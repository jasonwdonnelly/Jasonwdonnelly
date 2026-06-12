const { redis, userKey, CHAPTER_COUNT } = require("./_store.js");

module.exports = async (req, res) => {
  if(req.method !== "GET") return res.status(405).json({ error: "GET only" });
  const secret = process.env.ADMIN_SECRET;
  if(!secret) return res.status(500).json({ error: "ADMIN_SECRET is not configured in Vercel." });
  const supplied = req.headers["x-admin-key"];
  if(!supplied || supplied !== secret) return res.status(401).json({ error: "Wrong passphrase." });

  try {
    const emails = (await redis("SMEMBERS", "mfs:users")) || [];
    if(emails.length === 0) return res.status(200).json({ users: [] });
    const raws = await redis("MGET", ...emails.map(userKey));
    const users = (raws || [])
      .filter(Boolean)
      .map(r => { try { return JSON.parse(r); } catch(e){ return null; } })
      .filter(Boolean)
      .sort((a, b) => b.lastLogin - a.lastLogin);
    return res.status(200).json({ users, chapterCount: CHAPTER_COUNT });
  } catch(e){
    return res.status(500).json({ error: "The registrar is unavailable." });
  }
};

const { redis, normEmail, validEmail, userKey, CHAPTER_COUNT } = require("./_store.js");

module.exports = async (req, res) => {
  if(req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const body = req.body || {};
    const email = normEmail(body.email);
    if(!validEmail(email)) return res.status(400).json({ error: "Invalid email." });

    const raw = await redis("GET", userKey(email));
    if(!raw) return res.status(404).json({ error: "Not enrolled." });
    const user = JSON.parse(raw);

    const incoming = Array.isArray(body.passed) ? body.passed : [];
    /* Merge with OR: progress can only move forward. A buggy or hostile
       client can mark chapters passed for an email it knows, but it can
       never erase anyone's progress. */
    user.passed = user.passed.map((v, i) => v === true || incoming[i] === true);
    const cur = Number(body.current);
    if(Number.isInteger(cur) && cur >= 0 && cur < CHAPTER_COUNT) user.current = cur;
    user.lastLogin = Date.now();

    await redis("SET", userKey(email), JSON.stringify(user));
    return res.status(200).json(user);
  } catch(e){
    return res.status(500).json({ error: "The registrar is unavailable." });
  }
};

const { redis, normEmail, validEmail, userKey, CHAPTER_COUNT } = require("./_store.js");

module.exports = async (req, res) => {
  if(req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const body = req.body || {};
    const email = normEmail(body.email);
    const name = String(body.name || "").trim().slice(0, 60);
    const mode = body.mode === "resume" ? "resume" : "login";
    if(!validEmail(email)) return res.status(400).json({ error: "That email does not parse." });

    const raw = await redis("GET", userKey(email));
    let user = raw ? JSON.parse(raw) : null;
    const now = Date.now();

    if(user){
      if(mode === "login"){
        user.logins += 1;
        user.lastLogin = now;
        if(name.length >= 2) user.name = name;
      }
    } else {
      if(mode === "resume") return res.status(404).json({ error: "Not enrolled." });
      if(name.length < 2) return res.status(400).json({ error: "A name, please. The certificate needs one." });
      user = {
        name, email, logins: 1, firstLogin: now, lastLogin: now,
        passed: new Array(CHAPTER_COUNT).fill(false), current: 0
      };
    }

    await redis("SET", userKey(email), JSON.stringify(user));
    await redis("SADD", "mfs:users", email);
    return res.status(200).json(user);
  } catch(e){
    return res.status(500).json({ error: "The registrar is unavailable." });
  }
};

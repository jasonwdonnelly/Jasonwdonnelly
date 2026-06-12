/* Shared storage helpers. Underscore prefix = not exposed as a route. */
const CHAPTER_COUNT = 16;

function storeConfig(){
  /* trim() guards against invisible whitespace or line breaks picked up
     when values are pasted into the Vercel dashboard. */
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "").trim();
  if(!url || !token) throw new Error("Storage env vars missing");
  return { url, token };
}

async function redis(...command){
  const { url, token } = storeConfig();
  const r = await fetch(url, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(command)
  });
  if(!r.ok) throw new Error("Storage error " + r.status);
  const data = await r.json();
  return data.result;
}

function normEmail(v){ return String(v || "").trim().toLowerCase(); }
function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
function userKey(email){ return "mfs:user:" + email; }

module.exports = { redis, normEmail, validEmail, userKey, CHAPTER_COUNT };

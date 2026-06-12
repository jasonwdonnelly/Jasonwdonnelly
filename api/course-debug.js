/* TEMPORARY diagnostic endpoint. Reports configuration health without
   revealing secret values. Delete this file once the registrar works. */
module.exports = async (req, res) => {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  const url = rawUrl.trim();
  const token = rawToken.trim();

  const report = {
    url_present: Boolean(url),
    url_starts_with_https: url.startsWith("https://"),
    url_ends_with_upstash_io: url.endsWith(".upstash.io"),
    url_had_hidden_whitespace: rawUrl !== url,
    url_length: url.length,
    token_present: Boolean(token),
    token_length: token.length,
    token_had_hidden_whitespace: rawToken !== token,
    admin_secret_present: Boolean(process.env.ADMIN_SECRET),
    connection_test: "not attempted"
  };

  if(url && token){
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(["PING"])
      });
      const data = await r.json().catch(() => null);
      report.connection_test = "HTTP " + r.status + " / " + JSON.stringify(data);
    } catch(e){
      report.connection_test = "FETCH FAILED: " + String(e && e.message);
    }
  }

  res.status(200).json(report);
};

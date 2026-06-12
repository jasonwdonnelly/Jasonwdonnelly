// The Red Pen relay. Put this file at api/fetch.js in the same Vercel repo
// as index.html. No API key, no config. It just fetches the page server-side
// so the browser never hits CORS.
export default async function handler(req, res) {
  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: 'Pass a full URL, like ?url=https://example.com' });
    return;
  }
  try {
    const upstream = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    if (!upstream.ok) {
      res.status(502).json({ error: 'Site answered ' + upstream.status });
      return;
    }
    const html = await upstream.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(html);
  } catch (e) {
    res.status(502).json({ error: 'Could not reach the site' });
  }
}

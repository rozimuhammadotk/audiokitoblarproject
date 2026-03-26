const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.json({ ok: false, error: 'no code' });

  const entry = await kv.get(`book:${code.toUpperCase()}`);
  if (!entry) return res.json({ ok: false, error: 'invalid' });

  const now = Math.floor(Date.now() / 1000);
  if (now > entry.expire) {
    await kv.del(`book:${code.toUpperCase()}`);
    return res.json({ ok: false, error: 'expired' });
  }

  res.json({ ok: true, source: entry.source, id: entry.id });
};

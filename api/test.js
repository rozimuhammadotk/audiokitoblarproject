const axios = require('axios');
const cheerio = require('cheerio');

const BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

const TESTS = [
  // Русские
  { label: '🇷🇺 knigavuhe', url: `${BASE}/api/search?q=толстой&lang=ru` },
  { label: '🇷🇺 akniga',     url: `${BASE}/api/search?q=толстой&lang=ru` },
  { label: '🇷🇺 audioboo',   url: `${BASE}/api/search?q=пушкин&lang=ru` },
  { label: '🇷🇺 soundbook',  url: `${BASE}/api/search?q=достоевский&lang=ru` },
  { label: '🇷🇺 audioknigi', url: `${BASE}/api/search?q=булгаков&lang=ru` },
  // Английские
  { label: '🇬🇧 librivox',   url: `${BASE}/api/search?q=sherlock+holmes&lang=en` },
  { label: '🌍 archive',     url: `${BASE}/api/search?q=dracula&lang=en` },
  { label: '🇬🇧 loyalbooks', url: `${BASE}/api/search?q=treasure+island&lang=en` },
  { label: '🇬🇧 thoughtaudio', url: `${BASE}/api/search?q=plato&lang=en` },
  { label: '🇬🇧 openculture', url: `${BASE}/api/search?q=shakespeare&lang=en` },
];

module.exports = async (req, res) => {
  const results = [];

  for (const t of TESTS) {
    const start = Date.now();
    try {
      const r = await axios.get(t.url, { timeout: 10000 });
      const count = r.data?.results?.length || 0;
      results.push({
        source: t.label,
        status: count > 0 ? '✅' : '⚠️ пусто',
        count,
        ms: Date.now() - start,
        sample: r.data?.results?.[0]?.title || '—'
      });
    } catch (e) {
      results.push({
        source: t.label,
        status: '❌ ошибка',
        count: 0,
        ms: Date.now() - start,
        error: e.message
      });
    }
  }

  // Статистика
  const ok = results.filter(r => r.status === '✅').length;
  const empty = results.filter(r => r.status.includes('пусто')).length;
  const fail = results.filter(r => r.status.includes('ошибка')).length;

  res.json({
    summary: { ok, empty, fail, total: results.length },
    results
  });
};

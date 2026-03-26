const axios = require('axios');
const cheerio = require('cheerio');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

// ─── РУССКИЕ ────────────────────────────────────────────

async function getKnigavuhe(id) {
  const res = await axios.get(`https://knigavuhe.org/book/${id}/`, { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const title = $('h1').first().text().trim();
  const author = $('.book-author a').first().text().trim();
  const chapters = [];
  $('a[href$=".mp3"]').each((i, el) => {
    const url = $(el).attr('href');
    const name = $(el).text().trim() || `Глава ${i + 1}`;
    if (url) chapters.push({ index: i + 1, name, url });
  });
  return { title, author, chapters, total: chapters.length };
}

async function getAkniga(id) {
  const res = await axios.get(`https://akniga.org/book/${id}/`, { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const title = $('h1').first().text().trim();
  const author = $('.caption__article-author').first().text().trim();
  const scripts = $('script').map((i, el) => $(el).html()).get().join('\n');
  const matches = scripts.match(/"link"\s*:\s*"([^"]+\.mp3[^"]*)"/g) || [];
  const chapters = matches.map((m, i) => {
    const url = m.match(/"link"\s*:\s*"([^"]+)"/)?.[1] || '';
    return { index: i + 1, name: `Глава ${i + 1}`, url };
  });
  return { title, author, chapters, total: chapters.length };
}

async function getAudioboo(id) {
  const res = await axios.get(`https://audioboo.ru/${id}/`, { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const title = $('h1').first().text().trim();
  const author = $('.author, .book-author').first().text().trim();
  const chapters = [];
  $('a[href$=".mp3"], audio source').each((i, el) => {
    const url = $(el).attr('href') || $(el).attr('src');
    if (url) chapters.push({ index: i + 1, name: `Глава ${i + 1}`, url });
  });
  return { title, author, chapters, total: chapters.length };
}

async function getSoundbook(id) {
  const res = await axios.get(`https://soundbook.ru/${id}/`, { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const title = $('h1').first().text().trim();
  const author = $('.author').first().text().trim();
  const chapters = [];
  // soundbook использует плеер — ищем в script
  const scripts = $('script').map((i, el) => $(el).html()).get().join('\n');
  const matches = scripts.match(/https?:\/\/[^\s"']+\.mp3/g) || [];
  matches.forEach((url, i) => {
    chapters.push({ index: i + 1, name: `Глава ${i + 1}`, url });
  });
  return { title, author, chapters, total: chapters.length };
}

async function getAudioknigiClub(id) {
  const res = await axios.get(`https://audioknigi.club/${id}/`, { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const title = $('h1').first().text().trim();
  const author = $('.caption__article-author, .author').first().text().trim();
  const scripts = $('script').map((i, el) => $(el).html()).get().join('\n');
  const matches = scripts.match(/"link"\s*:\s*"([^"]+\.mp3[^"]*)"/g) || [];
  const chapters = matches.map((m, i) => {
    const url = m.match(/"link"\s*:\s*"([^"]+)"/)?.[1] || '';
    return { index: i + 1, name: `Глава ${i + 1}`, url };
  });
  return { title, author, chapters, total: chapters.length };
}

// ─── АНГЛИЙСКИЕ ─────────────────────────────────────────

async function getLibrivox(id) {
  const [bookRes, secRes] = await Promise.all([
    axios.get(`https://librivox.org/api/feed/audiobooks/?id=${id}&format=json`),
    axios.get(`https://librivox.org/api/feed/audiotracks/?book_id=${id}&format=json`)
  ]);
  const book = bookRes.data?.books?.[0];
  const sections = secRes.data?.sections || [];
  const chapters = sections.map((s, i) => ({
    index: i + 1,
    name: s.title || `Chapter ${i + 1}`,
    url: s.listen_url
  }));
  return {
    title: book?.title || '',
    author: `${book?.authors?.[0]?.first_name || ''} ${book?.authors?.[0]?.last_name || ''}`.trim(),
    chapters,
    total: chapters.length
  };
}

async function getArchive(id) {
  const metaRes = await axios.get(`https://archive.org/metadata/${id}`);
  const meta = metaRes.data;
  const title = meta?.metadata?.title || id;
  const author = meta?.metadata?.creator || '—';
  const files = meta?.files || [];
  const chapters = files
    .filter(f => f.name?.endsWith('.mp3'))
    .map((f, i) => ({
      index: i + 1,
      name: f.title || f.name || `Chapter ${i + 1}`,
      url: `https://archive.org/download/${id}/${f.name}`
    }));
  return { title, author, chapters, total: chapters.length };
}

async function getLoyalbooks(id) {
  const res = await axios.get(`https://www.loyalbooks.com/book/${id}`, { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const title = $('h1').first().text().trim();
  const author = $('.author, .by').first().text().trim();
  const chapters = [];
  $('a[href$=".mp3"]').each((i, el) => {
    const url = $(el).attr('href');
    const name = $(el).text().trim() || `Chapter ${i + 1}`;
    if (url) chapters.push({ index: i + 1, name, url });
  });
  return { title, author, chapters, total: chapters.length };
}

async function getThoughtaudio(id) {
  const res = await axios.get(`https://thoughtaudio.com/${id}/`, { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const title = $('h1').first().text().trim();
  const author = $('.author, .by-author').first().text().trim();
  const chapters = [];
  $('a[href$=".mp3"], audio source').each((i, el) => {
    const url = $(el).attr('href') || $(el).attr('src');
    if (url) chapters.push({ index: i + 1, name: `Chapter ${i + 1}`, url });
  });
  return { title, author, chapters, total: chapters.length };
}

async function getOpenculture(id) {
  const res = await axios.get(`https://www.openculture.com/${id}`, { headers: { 'User-Agent': UA } });
  const $ = cheerio.load(res.data);
  const title = $('h1, .entry-title').first().text().trim();
  const chapters = [];
  $('a[href$=".mp3"]').each((i, el) => {
    const url = $(el).attr('href');
    const name = $(el).text().trim() || `Chapter ${i + 1}`;
    if (url) chapters.push({ index: i + 1, name, url });
  });
  return { title, author: '—', chapters, total: chapters.length };
}

// ─── MAIN ───────────────────────────────────────────────

const HANDLERS = {
  kv: getKnigavuhe,
  ak: getAkniga,
  ab: getAudioboo,
  sb: getSoundbook,
  ac: getAudioknigiClub,
  lv: getLibrivox,
  ia: getArchive,
  lb: getLoyalbooks,
  ta: getThoughtaudio,
  oc: getOpenculture
};

module.exports = async (req, res) => {
  const { source, id } = req.query;
  if (!source || !id) return res.json({ ok: false, error: 'missing params' });
  const handler = HANDLERS[source];
  if (!handler) return res.json({ ok: false, error: 'unknown source' });

  try {
    const data = await handler(id);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
};

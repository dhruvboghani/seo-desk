// Rankdesk server: serves the toolkit and fetches pages for URL-based audits.
// Node 18+ (uses built-in fetch). Run: npm install && npm start
const express = require('express');
const dns = require('dns').promises;
const net = require('net');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PSI_KEY = process.env.PSI_API_KEY || ''; // optional Google PageSpeed API key (higher quota)
const UA = 'Mozilla/5.0 (compatible; RankdeskBot/1.0; +https://rankdesk.local)';
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const ALLOW_PRIVATE = process.env.ALLOW_PRIVATE === '1'; // set to 1 only for local testing

app.disable('x-powered-by');
app.set('trust proxy', 1);

/* ---------- site + Google AdSense settings ---------- */
const fs = require('fs');
const SITE_NAME = process.env.SITE_NAME || 'Rankdesk';
const SITE_URL_ENV = (process.env.SITE_URL || '').replace(/\/+$/, '');
// Without SITE_URL, use the address the visitor actually opened (works on Vercel, Render, etc.)
const siteUrl = req => SITE_URL_ENV || `${req.protocol}://${req.get('host')}`;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'hello@example.com';
const ADS_CLIENT = (process.env.ADSENSE_CLIENT ?? 'ca-pub-8829216905817441').trim(); // set ADSENSE_CLIENT= (empty) to turn ads off          // ca-pub-XXXXXXXXXXXXXXXX
const ADS_PREVIEW = process.env.ADS_PREVIEW === '1';                    // show empty ad boxes for layout testing
const ADS_SLOTS = { top: process.env.ADSENSE_SLOT_TOP, side: process.env.ADSENSE_SLOT_SIDE, bottom: process.env.ADSENSE_SLOT_BOTTOM };
if (ADS_CLIENT && !/^ca-pub-\d{10,20}$/.test(ADS_CLIENT)) console.warn('ADSENSE_CLIENT should look like ca-pub-1234567890123456');

const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function adHead() {
  if (!ADS_CLIENT) return '';
  return `<meta name="google-adsense-account" content="${attr(ADS_CLIENT)}">\n` +
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${attr(ADS_CLIENT)}" crossorigin="anonymous"></script>`;
}
const SLOT_FORMAT = { top: 'horizontal', side: 'vertical', bottom: 'auto' };
function adSlot(name) {
  const slot = ADS_SLOTS[name];
  if (ADS_CLIENT && slot) {
    return `<div class="ad ad-${name}"><span class="ad-label">Advertisement</span>` +
      `<ins class="adsbygoogle" style="display:block" data-ad-client="${attr(ADS_CLIENT)}" data-ad-slot="${attr(slot)}" ` +
      `data-ad-format="${SLOT_FORMAT[name]}" data-full-width-responsive="true"></ins></div>`;
  }
  if (ADS_PREVIEW) return `<div class="ad ad-${name} ad-preview"><span class="ad-label">Advertisement</span><div class="ad-box">Ad slot: ${name}</div></div>`;
  return '';
}
const pages = {};
function render(file, req) {
  if (!pages[file] || process.env.NODE_ENV !== 'production') pages[file] = fs.readFileSync(path.join(__dirname, 'public', file), 'utf8');
  return pages[file]
    .replace('<!--ADS_HEAD-->', adHead())
    .replace(/<!--AD:(\w+)-->/g, (_, n) => adSlot(n))
    .replace(/\{\{SITE_NAME\}\}/g, attr(SITE_NAME))
    .replace(/\{\{SITE_URL\}\}/g, attr(siteUrl(req)))
    .replace(/\{\{CONTACT_EMAIL\}\}/g, attr(CONTACT_EMAIL))
    .replace(/\{\{YEAR\}\}/g, new Date().getFullYear());
}
const sendPage = file => (req, res) => res.type('html').send(render(file, req));
app.get(['/', '/index.html'], sendPage('index.html'));
app.get('/about', sendPage('about.html'));
app.get('/privacy', sendPage('privacy.html'));
app.get(['/about.html', '/privacy.html'], (req, res) => res.redirect(301, req.path.replace('.html', '')));

// ads.txt: tells ad buyers that Google is allowed to sell ads on this site
app.get('/ads.txt', (req, res) => {
  if (!ADS_CLIENT) return res.status(404).type('text').send('# Set ADSENSE_CLIENT to publish ads.txt\n');
  res.type('text').send(`google.com, ${ADS_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
});
// Rankdesk's own robots.txt and sitemap
app.get('/robots.txt', (req, res) => res.type('text').send(`User-agent: *\nDisallow: /api/\n\nSitemap: ${siteUrl(req)}/sitemap.xml\n`));
app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const base = siteUrl(req);
  const urls = ['/', '/about', '/privacy'].map(p => `  <url><loc>${base}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

/* ---------- simple per-IP rate limit ---------- */
const hits = new Map();
app.use('/api', (req, res, next) => {
  const ip = req.ip, now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60_000);
  if (list.length >= 40) return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.' });
  list.push(now); hits.set(ip, list); next();
});

/* ---------- block private / internal addresses (SSRF guard) ---------- */
function isPrivate(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return isPrivate(v.slice(7));
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
}
async function assertPublic(urlStr) {
  let u;
  try { u = new URL(urlStr); } catch { throw httpErr(400, 'That is not a valid URL.'); }
  if (!/^https?:$/.test(u.protocol)) throw httpErr(400, 'Only http and https URLs can be audited.');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (ALLOW_PRIVATE) return u;
  if (host === 'localhost') throw httpErr(400, 'Local addresses cannot be audited.');
  let addrs;
  try { addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }); }
  catch { throw httpErr(400, `Could not find the domain ${host}. Check the spelling.`); }
  if (addrs.some(a => isPrivate(a.address))) throw httpErr(400, 'Private or internal addresses cannot be audited.');
  return u;
}
function httpErr(status, message) { const e = new Error(message); e.status = status; return e; }

/* ---------- guarded fetch that records the redirect chain ---------- */
async function guardedFetch(urlStr, { maxBytes = MAX_BYTES, timeout = 15000 } = {}) {
  const redirects = [];
  let current = urlStr;
  const started = Date.now();
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublic(current);
    let res;
    try {
      res = await fetch(current, {
        redirect: 'manual',
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-IN,en;q=0.9' },
        signal: AbortSignal.timeout(timeout)
      });
    } catch (e) {
      throw httpErr(502, e.name === 'TimeoutError' ? 'The site took too long to respond (over 15 seconds).' : `Could not connect to the site (${e.cause?.code || e.message}).`);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      const next = new URL(res.headers.get('location'), current).href;
      redirects.push({ url: current, status: res.status });
      current = next;
      continue;
    }
    // read body with a size cap
    const reader = res.body?.getReader();
    const chunks = []; let bytes = 0, truncated = false;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > maxBytes) { truncated = true; await reader.cancel(); break; }
        chunks.push(value);
      }
    }
    const body = Buffer.concat(chunks).toString('utf8');
    const headers = {};
    ['content-type', 'x-robots-tag', 'cache-control', 'content-encoding', 'server', 'strict-transport-security', 'last-modified']
      .forEach(h => { const v = res.headers.get(h); if (v) headers[h] = v; });
    return { finalUrl: current, status: res.status, redirects, headers, timeMs: Date.now() - started, bytes, truncated, body };
  }
  throw httpErr(502, `More than ${MAX_REDIRECTS} redirects. The site may have a redirect loop.`);
}

/* ---------- API: fetch page ---------- */
app.get('/api/fetch', async (req, res) => {
  try {
    let url = String(req.query.url || '').trim();
    if (url && !/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = 'https://' + url;
    const r = await guardedFetch(url);
    res.json({ finalUrl: r.finalUrl, status: r.status, redirects: r.redirects, headers: r.headers, timeMs: r.timeMs, bytes: r.bytes, truncated: r.truncated, html: r.body });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

/* ---------- API: robots.txt + sitemap ---------- */
function robotsBlocks(txt, pathName) {
  // rules for "User-agent: *" (and Googlebot if present). Longest matching rule wins.
  const groups = []; let cur = null, lastWasAgent = false;
  txt.split(/\r?\n/).forEach(line => {
    const l = line.replace(/#.*/, '').trim(); if (!l) return;
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) return;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (!lastWasAgent || !cur) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastWasAgent = true; }
    else { lastWasAgent = false; if (cur && (k === 'allow' || k === 'disallow')) cur.rules.push({ allow: k === 'allow', path: v }); }
  });
  const g = groups.find(x => x.agents.includes('googlebot')) || groups.find(x => x.agents.includes('*'));
  if (!g) return { blocked: false, rule: null };
  const toRe = p => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
  let best = null;
  g.rules.forEach(r => { if (r.path === '') return; if (toRe(r.path).test(pathName) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r; });
  return { blocked: !!best && !best.allow, rule: best ? `${best.allow ? 'Allow' : 'Disallow'}: ${best.path}` : null };
}
app.get('/api/robots', async (req, res) => {
  try {
    const u = await assertPublic(String(req.query.url || ''));
    const origin = u.origin;
    const out = { robots: { url: origin + '/robots.txt', found: false, status: null }, blocked: false, rule: null, sitemaps: [] };
    let sitemapUrls = [];
    try {
      const r = await guardedFetch(origin + '/robots.txt', { maxBytes: 512 * 1024, timeout: 10000 });
      out.robots.status = r.status;
      if (r.status === 200 && !/<html/i.test(r.body.slice(0, 500))) {
        out.robots.found = true;
        out.robots.text = r.body.slice(0, 4000);
        Object.assign(out, robotsBlocks(r.body, u.pathname + u.search));
        sitemapUrls = [...r.body.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map(m => m[1]);
      }
    } catch (e) { out.robots.error = e.message; }
    if (!sitemapUrls.length) sitemapUrls = [origin + '/sitemap.xml'];
    for (const sm of sitemapUrls.slice(0, 3)) {
      try {
        const r = await guardedFetch(sm, { maxBytes: 10 * 1024 * 1024, timeout: 12000 });
        const isXml = r.status === 200 && /<(urlset|sitemapindex)/i.test(r.body);
        out.sitemaps.push({ url: sm, status: r.status, valid: isXml, isIndex: /<sitemapindex/i.test(r.body), urls: isXml ? (r.body.match(/<loc>/gi) || []).length : 0,
          listsPage: isXml ? r.body.includes(u.href) || r.body.includes(u.href.replace(/\/$/, '')) : false });
      } catch (e) { out.sitemaps.push({ url: sm, status: null, valid: false, error: e.message }); }
    }
    res.json(out);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

/* ---------- API: Google PageSpeed Insights ---------- */
app.get('/api/pagespeed', async (req, res) => {
  try {
    const u = await assertPublic(String(req.query.url || ''));
    const strategy = req.query.strategy === 'desktop' ? 'desktop' : 'mobile';
    const q = new URLSearchParams({ url: u.href, strategy });
    ['performance', 'seo', 'accessibility', 'best-practices'].forEach(c => q.append('category', c));
    if (PSI_KEY) q.set('key', PSI_KEY);
    const r = await fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + q, { signal: AbortSignal.timeout(90000) });
    const j = await r.json();
    if (!r.ok) {
      const msg = j?.error?.message || 'PageSpeed request failed.';
      return res.status(502).json({ error: /quota/i.test(msg) ? 'PageSpeed quota reached. Add a PSI_API_KEY on the server for a higher limit.' : msg });
    }
    const lh = j.lighthouseResult || {}, cats = lh.categories || {}, audits = lh.audits || {};
    const score = k => cats[k] ? Math.round(cats[k].score * 100) : null;
    const lab = {};
    [['fcp', 'first-contentful-paint'], ['lcp', 'largest-contentful-paint'], ['tbt', 'total-blocking-time'], ['cls', 'cumulative-layout-shift'], ['si', 'speed-index']]
      .forEach(([k, a]) => { if (audits[a]) lab[k] = { value: audits[a].displayValue, score: audits[a].score }; });
    const fm = j.loadingExperience?.metrics || {};
    const field = {};
    [['LCP', 'LARGEST_CONTENTFUL_PAINT_MS'], ['INP', 'INTERACTION_TO_NEXT_PAINT'], ['CLS', 'CUMULATIVE_LAYOUT_SHIFT_SCORE']]
      .forEach(([k, a]) => { if (fm[a]) field[k] = { percentile: k === 'CLS' ? fm[a].percentile / 100 : fm[a].percentile, category: fm[a].category }; });
    const opportunities = Object.values(audits)
      .filter(a => a.details?.type === 'opportunity' && a.score !== null && a.score < 0.9)
      .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0))
      .slice(0, 6).map(a => ({ title: a.title, savings: a.displayValue || '' }));
    res.json({ strategy, scores: { performance: score('performance'), seo: score('seo'), accessibility: score('accessibility'), bestPractices: score('best-practices') }, lab, field, opportunities });
  } catch (e) { res.status(e.status || 502).json({ error: e.name === 'TimeoutError' ? 'PageSpeed took too long. Try again.' : e.message }); }
});

app.listen(PORT, () => {
  console.log(`Rankdesk running at http://localhost:${PORT}`);
  console.log(ADS_CLIENT ? `AdSense on: ${ADS_CLIENT} (slots: ${Object.entries(ADS_SLOTS).filter(([, v]) => v).map(([k]) => k).join(', ') || 'Auto ads only'})` : ADS_PREVIEW ? 'AdSense off, showing ad slot previews' : 'AdSense off (set ADSENSE_CLIENT to turn on)');
});

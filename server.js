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
const ADS_CLIENT = (process.env.ADSENSE_CLIENT ?? 'ca-pub-8829216905817441').trim(); // set ADSENSE_CLIENT= (empty) to turn ads off
const ADS_PREVIEW = process.env.ADS_PREVIEW === '1';                    // show empty ad boxes for layout testing
const ADS_SLOTS = {
  top: process.env.ADSENSE_SLOT_TOP ?? '3229197866',       // rankdesk-top
  side: process.env.ADSENSE_SLOT_SIDE ?? '8731886116',     // rankdesk-side
  bottom: process.env.ADSENSE_SLOT_BOTTOM ?? '1851792151', // rankdesk-bottom
};
if (ADS_CLIENT && !/^ca-pub-\d{10,20}$/.test(ADS_CLIENT)) console.warn('ADSENSE_CLIENT should look like ca-pub-1234567890123456');
// cache-busting version for /assets files
const ASSET_V = (process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())).slice(0, 8);

const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const html = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

/* ---------- pages ---------- */
// Each view starts with <!--@meta {...}--> holding its title, description, path, scripts and FAQ.
// Paths are written out one by one so hosting bundlers (Vercel) include every file.
const VIEW_FILES = {
  home: path.join(__dirname, 'views', 'home.html'),
  audit: path.join(__dirname, 'views', 'seo-audit.html'),
  meta: path.join(__dirname, 'views', 'meta-tag-generator.html'),
  schema: path.join(__dirname, 'views', 'schema-generator.html'),
  social: path.join(__dirname, 'views', 'hashtag-generator.html'),
  keywords: path.join(__dirname, 'views', 'keyword-ideas.html'),
  robots: path.join(__dirname, 'views', 'robots-txt-sitemap-generator.html'),
  tools: path.join(__dirname, 'views', 'free-seo-tools.html'),
  traffic: path.join(__dirname, 'views', 'website-traffic.html'),
  about: path.join(__dirname, 'views', 'about.html'),
  privacy: path.join(__dirname, 'views', 'privacy.html'),
  terms: path.join(__dirname, 'views', 'terms.html'),
  contact: path.join(__dirname, 'views', 'contact.html'),
  notFound: path.join(__dirname, 'views', '404.html'),
  head: path.join(__dirname, 'views', 'partials', 'head.html'),
  header: path.join(__dirname, 'views', 'partials', 'header.html'),
  footer: path.join(__dirname, 'views', 'partials', 'footer.html'),
};
const ROUTES = {
  '/': 'home', '/seo-audit': 'audit', '/meta-tag-generator': 'meta', '/schema-generator': 'schema',
  '/hashtag-generator': 'social', '/keyword-ideas': 'keywords', '/robots-txt-sitemap-generator': 'robots',
  '/free-seo-tools': 'tools', '/website-traffic': 'traffic', '/about': 'about', '/contact': 'contact', '/privacy': 'privacy', '/terms': 'terms',
};
const cache = {};
const read = key => (process.env.NODE_ENV === 'production' && cache[key]) || (cache[key] = fs.readFileSync(VIEW_FILES[key], 'utf8'));
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const blog = require('./lib/blog');

function renderFaq(faq) {
  return `<div class="faq-list">${faq.map(([q, a], i) => `<details class="faq-item"${i === 0 ? ' open' : ''}><summary><span>${html(q)}</span><i aria-hidden="true"></i></summary><div class="faq-a"><p>${html(a)}</p></div></details>`).join('')}</div>`;
}

const TOOL_LINKS = [
  ['traffic', '/website-traffic', 'Website traffic', 'Visits, keywords, countries, AI', '<path d="M2.5 13.5 6 9l3 2.5 4.5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 5.5h3v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'],
  ['audit', '/seo-audit', 'SEO audit', 'Checks on any URL', '<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 2.5A5.5 5.5 0 0 1 13.5 8" fill="none" stroke="currentColor" stroke-width="2.6"/>'],
  ['meta', '/meta-tag-generator', 'Meta tags', 'Title, description, share tags', '<path d="M2.5 4h11M2.5 8h11M2.5 12h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'],
  ['schema', '/schema-generator', 'Schema', 'JSON-LD structured data', '<path d="M6 3c-2 0-2 1.5-2 2.5S3.5 8 2.5 8C3.5 8 4 9 4 10.5S4 13 6 13M10 3c2 0 2 1.5 2 2.5s.5 2.5 1.5 2.5c-1 0-1.5 1-1.5 2.5S12 13 10 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'],
  ['social', '/hashtag-generator', 'Hashtags', 'Instagram and YouTube pack', '<path d="M6 2.5 4.8 13.5M11.2 2.5 10 13.5M2.5 6h11M2 10h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'],
  ['keywords', '/keyword-ideas', 'Keyword ideas', 'Local, buying and question searches', '<circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'],
  ['robots', '/robots-txt-sitemap-generator', 'Robots & sitemap', 'Files ready to upload', '<path d="M3 3h4v4H3zM9 9h4v4H9zM5 7v4h4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'],
];
const toolIcon = ico => `<span class="ico"><svg viewBox="0 0 16 16" aria-hidden="true">${ico}</svg></span>`;
function renderAside(nav) {
  const links = TOOL_LINKS.map(([k, href, name, sub, ico]) => `<a href="${href}"${k === nav ? ' aria-current="page"' : ''}>${toolIcon(ico)}<span>${html(name)}<small>${html(sub)}</small></span></a>`).join('');
  const guides = blog.forTool(nav, 3).map(p => `<a href="/blog/${p.slug}">${html(p.title)}</a>`).join('');
  return `<aside class="desk-aside" aria-label="More tools"><div class="aside-card"><h2>All tools</h2><nav class="aside-links">${links}</nav></div>${guides ? `<div class="aside-card aside-guides"><h2>Guides</h2>${guides}</div>` : ''}<!--AD:side--></aside>`;
}
const SRCBAR = `<div class="srcbar" data-srcbar>
  <span class="lbl"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>Fill from a website</span>
  <form novalidate><input class="input" type="text" inputmode="url" autocomplete="url" placeholder="yourwebsite.com" aria-label="Website address"><button class="btn btn-sm btn-ink" type="submit">Fill</button></form>
  <div class="state" role="status" aria-live="polite"></div>
</div>`;

// Turns a view (meta + body) into a full HTML document.
function renderDoc({ key, meta, body }, req) {
  const base = siteUrl(req);
  const url = base + (meta.path || req.path);
  const title = meta.title || SITE_NAME;
  const desc = meta.description || '';
  const image = meta.image ? (meta.image.startsWith('http') ? meta.image : base + meta.image) : base + '/og.png';

  const graph = [];
  const org = { '@type': 'Organization', '@id': base + '/#org', name: SITE_NAME, url: base + '/', logo: base + '/apple-touch-icon.png', email: CONTACT_EMAIL };
  if (key === 'home') graph.push(org, { '@type': 'WebSite', '@id': base + '/#website', name: SITE_NAME, url: base + '/', publisher: { '@id': base + '/#org' } });
  if (meta.app) graph.push({ '@type': 'WebApplication', name: meta.app, url, description: desc, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', isAccessibleForFree: true, image, offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, publisher: { '@type': 'Organization', name: SITE_NAME, url: base + '/' } });
  if (meta.ld) graph.push(...meta.ld(base));
  if (key !== 'home' && key !== 'notFound') {
    const trail = meta.crumbs || [[meta.name || title, meta.path || req.path]];
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [['Home', '/'], ...trail].map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: base + p })) });
  }
  if (meta.faq && meta.faq.length) {
    graph.push({ '@type': 'FAQPage', mainEntity: meta.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
    body = body.replace('<!--@faq-->', renderFaq(meta.faq));
  }
  body = body.replace('<!--@aside-->', renderAside(meta.nav)).replace('<!--@srcbar-->', SRCBAR)
    .replace('<!--@guides-->', () => blog.cards(blog.latest(6), { small: true }));

  const head = [
    '<!doctype html>', '<html lang="en">', '<head>', '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    `<title>${html(title)}</title>`,
    `<meta name="description" content="${attr(desc)}">`,
    key === 'notFound' ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${attr(url)}">`,
    `<meta property="og:type" content="${meta.ogType || 'website'}">`, `<meta property="og:site_name" content="${attr(SITE_NAME)}">`,
    `<meta property="og:title" content="${attr(meta.ogTitle || title)}">`, `<meta property="og:description" content="${attr(desc)}">`,
    `<meta property="og:url" content="${attr(url)}">`, `<meta property="og:image" content="${attr(image)}">`,
    '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
    ...(meta.published ? [`<meta property="article:published_time" content="${meta.published}">`, `<meta property="article:section" content="${attr(meta.section || '')}">`] : []),
    '<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:title" content="${attr(meta.ogTitle || title)}">`,
    `<meta name="twitter:description" content="${attr(desc)}">`, `<meta name="twitter:image" content="${attr(image)}">`,
    `<link rel="alternate" type="application/rss+xml" title="${attr(SITE_NAME)} guides" href="${base}/blog/rss.xml">`,
    read('head'),
    graph.length ? ld({ '@context': 'https://schema.org', '@graph': graph }) : '',
    '</head>',
  ].join('\n');

  const header = read('header').replace(new RegExp(`data-nav="${meta.nav}"`, 'g'), `data-nav="${meta.nav}" aria-current="page"`);
  const scripts = ['app.js', ...(meta.scripts || [])].map(s => `<script src="/assets/${s}?v=${ASSET_V}" defer></script>`).join('\n');
  const out = `${head}\n<body class="page-${key}">\n<a class="skip" href="#main">Skip to content</a>\n${header}\n${body}\n${read('footer')}\n${scripts}\n</body>\n</html>\n`;

  return out
    .replace('<!--ADS_HEAD-->', adHead())
    .replace(/<!--AD:(\w+)-->/g, (_, n) => adSlot(n))
    .replace(/\{\{SITE_NAME\}\}/g, attr(SITE_NAME))
    .replace(/\{\{SITE_URL\}\}/g, attr(base))
    .replace(/\{\{CONTACT_EMAIL\}\}/g, attr(CONTACT_EMAIL))
    .replace(/\{\{YEAR\}\}/g, new Date().getFullYear())
    .replace(/\{\{V\}\}/g, ASSET_V);
}
function renderPage(key, req) {
  const raw = read(key);
  const m = raw.match(/<!--@meta([\s\S]*?)-->/);
  const meta = m ? JSON.parse(m[1]) : {};
  return renderDoc({ key, meta, body: raw.replace(/<!--@meta[\s\S]*?-->\s*/, '') }, req);
}

// old single-page links: /?url=… and /index.html go to the new pages
app.get(['/', '/index.html'], (req, res, next) => {
  if (req.query.url) return res.redirect(301, '/seo-audit?url=' + encodeURIComponent(String(req.query.url)));
  if (req.path === '/index.html') return res.redirect(301, '/');
  next();
});
app.get(['/about.html', '/privacy.html'], (req, res) => res.redirect(301, req.path.replace('.html', '')));
Object.entries(ROUTES).forEach(([route, key]) => {
  app.get(route, (req, res) => res.type('html').send(renderPage(key, req)));
  if (route !== '/') app.get(route + '/', (req, res) => res.redirect(301, route));
});

/* ---------- blog ---------- */
app.get('/blog/rss.xml', (req, res) => res.type('application/rss+xml').send(blog.rss(siteUrl(req), SITE_NAME)));
app.get('/blog', (req, res) => res.type('html').send(renderDoc(blog.indexView(), req)));
app.get('/blog/category/:cat', (req, res, next) => {
  const v = blog.indexView(req.params.cat); if (!v) return next();
  res.type('html').send(renderDoc(v, req));
});
app.get('/blog/:slug', (req, res, next) => {
  const v = blog.postView(req.params.slug); if (!v) return next();
  res.type('html').send(renderDoc(v, req));
});

// ads.txt: tells ad buyers that Google is allowed to sell ads on this site
app.get('/ads.txt', (req, res) => {
  if (!ADS_CLIENT) return res.status(404).type('text').send('# Set ADSENSE_CLIENT to publish ads.txt\n');
  res.type('text').send(`google.com, ${ADS_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
});
// Rankdesk's own robots.txt and sitemap
app.get('/robots.txt', (req, res) => res.type('text').send(`User-agent: *\nDisallow: /api/\n\nSitemap: ${siteUrl(req)}/sitemap.xml\n`));
app.get('/sitemap.xml', (req, res) => {
  const base = siteUrl(req);
  const built = blog.builtAt;
  const pages = Object.keys(ROUTES).map(p => [p, built]);
  pages.push(['/blog', blog.latest(1)[0]?.date || built]);
  blog.categories().forEach(c => pages.push(['/blog/category/' + c.slug, built]));
  blog.all().forEach(p => pages.push(['/blog/' + p.slug, p.updated || p.date]));
  const urls = pages.map(([p, d]) => `  <url><loc>${base}${p}</loc><lastmod>${d}</lastmod></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public'), { index: false, maxAge: '1d' }));

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
        out.disallow = [...new Set([...r.body.matchAll(/^\s*disallow\s*:\s*(\S+)/gim)].map(m => m[1]))].slice(0, 20);
      }
    } catch (e) { out.robots.error = e.message; }
    if (!sitemapUrls.length) sitemapUrls = [origin + '/sitemap.xml'];
    // page paths on this site, taken from the sitemap (follows one child sitemap of an index)
    out.paths = [];
    const locs = body => [...body.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)/gi)].map(m => m[1].replace(/&amp;/g, '&'));
    const addPaths = body => locs(body).forEach(l => { try { const x = new URL(l); if (x.hostname.replace(/^www\./, '') === u.hostname.replace(/^www\./, '') && out.paths.length < 50 && !out.paths.includes(x.pathname)) out.paths.push(x.pathname); } catch {} });
    for (const sm of sitemapUrls.slice(0, 3)) {
      try {
        const r = await guardedFetch(sm, { maxBytes: 10 * 1024 * 1024, timeout: 12000 });
        const isXml = r.status === 200 && /<(urlset|sitemapindex)/i.test(r.body);
        if (isXml && !out.paths.length) {
          if (/<sitemapindex/i.test(r.body)) {
            const child = locs(r.body)[0];
            if (child) { try { const c = await guardedFetch(child, { maxBytes: 10 * 1024 * 1024, timeout: 12000 }); if (c.status === 200) addPaths(c.body); } catch {} }
          } else addPaths(r.body);
        }
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

/* ---------- API: website traffic (Similarweb) ---------- */
const similarweb = require('./lib/similarweb');
const trafficHits = new Map();
app.get('/api/traffic/status', (req, res) => res.json({ configured: similarweb.configured(), prompts: similarweb.hasCampaign() }));
app.get('/api/traffic', async (req, res) => {
  if (!similarweb.configured()) return res.status(503).json({ error: 'Traffic data is not switched on yet. Add SIMILARWEB_API_KEY on the server.', code: 'not_configured' });
  let domain = String(req.query.domain || '').trim().toLowerCase();
  domain = domain.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0].replace(/:\d+$/, '');
  if (!/^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return res.status(400).json({ error: 'Enter a website domain, for example example.com.' });
  const country = /^[a-z]{2}$/.test(String(req.query.country || '')) ? String(req.query.country) : 'ww';
  // each report spends Similarweb credits, so limit fresh reports per visitor
  const now = Date.now(), list = (trafficHits.get(req.ip) || []).filter(t => now - t < 60 * 60 * 1000);
  if (list.length >= 20) return res.status(429).json({ error: 'You have checked 20 websites in the last hour. Try again later.' });
  list.push(now); trafficHits.set(req.ip, list);
  try { res.json(await similarweb.report(domain, country)); }
  catch (e) { res.status(e.status || 502).json({ error: e.message, code: e.code || 'error' }); }
});

// API routes and pages are above; anything else is a 404 page
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found.' });
  res.status(404).type('html').send(renderPage('notFound', req));
});

app.listen(PORT, () => {
  console.log(`Rankdesk running at http://localhost:${PORT}`);
  console.log(ADS_CLIENT ? `AdSense on: ${ADS_CLIENT} (slots: ${Object.entries(ADS_SLOTS).filter(([, v]) => v).map(([k]) => k).join(', ') || 'Auto ads only'})` : ADS_PREVIEW ? 'AdSense off, showing ad slot previews' : 'AdSense off (set ADSENSE_CLIENT to turn on)');
});

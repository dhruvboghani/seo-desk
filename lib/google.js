// "My website" traffic: Google sign-in (OAuth) with read-only access to Search Console and
// Google Analytics 4. Tokens are kept in an encrypted, httpOnly cookie, so nothing is stored on the server.
const crypto = require('crypto');

const CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const SECRET = process.env.SESSION_SECRET || '';
const AUTH_URL = process.env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const GSC = process.env.GSC_API_BASE || 'https://www.googleapis.com/webmasters/v3';
const GA_ADMIN = process.env.GA_ADMIN_API_BASE || 'https://analyticsadmin.googleapis.com/v1beta';
const GA_DATA = process.env.GA_DATA_API_BASE || 'https://analyticsdata.googleapis.com/v1beta';
const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/analytics.readonly'];
const COOKIE = 'rd_g', STATE = 'rd_gs';

const configured = () => !!(CLIENT_ID && CLIENT_SECRET && SECRET.length >= 16);
const key = () => crypto.createHash('sha256').update(SECRET).digest();

function seal(obj) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString('base64url');
}
function open(str) {
  try {
    const b = Buffer.from(str, 'base64url'), d = crypto.createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
  } catch { return null; }
}
const cookies = req => Object.fromEntries(String(req.headers.cookie || '').split(/;\s*/).filter(Boolean).map(c => { const i = c.indexOf('='); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
const secure = req => req.secure || req.headers['x-forwarded-proto'] === 'https';
function setCookie(res, req, name, value, maxAge) {
  res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure(req) ? '; Secure' : ''}`);
}

class GErr extends Error { constructor(status, message, code) { super(message); this.status = status; this.code = code; } }

/* ---------- OAuth ---------- */
function startUrl(req, res, base) {
  const state = crypto.randomBytes(16).toString('hex');
  setCookie(res, req, STATE, state, 600);
  const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: base + '/auth/google/callback', response_type: 'code', scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state });
  return `${AUTH_URL}?${q}`;
}
async function token(params) {
  const r = await fetch(TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...params }), signal: AbortSignal.timeout(15000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new GErr(401, j.error_description || j.error || 'Google sign-in failed.', 'auth');
  return j;
}
async function callback(req, res, base) {
  const c = cookies(req);
  if (!req.query.code || !req.query.state || req.query.state !== c[STATE]) throw new GErr(400, 'The sign-in link expired. Please try again.', 'state');
  const t = await token({ grant_type: 'authorization_code', code: String(req.query.code), redirect_uri: base + '/auth/google/callback' });
  let email = '';
  try { email = JSON.parse(Buffer.from(String(t.id_token || '').split('.')[1] || '', 'base64url').toString()).email || ''; } catch {}
  setCookie(res, req, STATE, '', 0);
  setCookie(res, req, COOKIE, seal({ a: t.access_token, r: t.refresh_token, e: Date.now() + (t.expires_in - 60) * 1000, m: email }), 60 * 60 * 24 * 30);
}
function logout(req, res) { setCookie(res, req, COOKIE, '', 0); }
function session(req) { const v = cookies(req)[COOKIE]; return v ? open(v) : null; }
async function accessToken(req, res) {
  const s = session(req);
  if (!s) throw new GErr(401, 'Sign in with Google to see your own website.', 'signed_out');
  if (s.a && s.e > Date.now()) return s.a;
  if (!s.r) throw new GErr(401, 'Your Google sign-in expired. Please sign in again.', 'signed_out');
  const t = await token({ grant_type: 'refresh_token', refresh_token: s.r });
  setCookie(res, req, COOKIE, seal({ ...s, a: t.access_token, e: Date.now() + (t.expires_in - 60) * 1000 }), 60 * 60 * 24 * 30);
  return t.access_token;
}

async function gapi(tok, url, body) {
  let r;
  try { r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) }); }
  catch { throw new GErr(502, 'Could not reach Google.', 'network'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = j?.error?.message || `Google returned status ${r.status}.`;
    if (r.status === 401) throw new GErr(401, 'Your Google sign-in expired. Please sign in again.', 'signed_out');
    if (r.status === 403 && /not been used|disabled/i.test(msg)) throw new GErr(403, 'This Google API is not enabled in the Google Cloud project. ' + msg, 'api_disabled');
    throw new GErr(r.status, msg, 'api');
  }
  return j;
}
const section = async fn => { try { return { ok: true, ...(await fn()) }; } catch (e) { if (e.code === 'signed_out') throw e; return { ok: false, error: e.message, code: e.code }; } };

/* ---------- lists ---------- */
async function properties(req, res) {
  const tok = await accessToken(req, res);
  const [sites, ga] = await Promise.all([
    section(async () => ({ rows: ((await gapi(tok, `${GSC}/sites`)).siteEntry || []).filter(s => s.permissionLevel !== 'siteUnverifiedUser').map(s => ({ id: s.siteUrl, name: s.siteUrl.replace(/^sc-domain:/, '').replace(/^https?:\/\//, '').replace(/\/$/, '') })) })),
    section(async () => {
      const rows = []; let pageToken = '';
      for (let i = 0; i < 5; i++) {
        const j = await gapi(tok, `${GA_ADMIN}/accountSummaries?pageSize=200${pageToken ? '&pageToken=' + pageToken : ''}`);
        (j.accountSummaries || []).forEach(a => (a.propertySummaries || []).forEach(p => rows.push({ id: p.property, name: p.displayName, account: a.displayName })));
        if (!j.nextPageToken) break; pageToken = j.nextPageToken;
      }
      return { rows };
    }),
  ]);
  return { email: session(req)?.m || '', sites, ga };
}

/* ---------- report ---------- */
const AI_SOURCES = [
  ['ChatGPT', /chatgpt\.com|chat\.openai\.com|openai/], ['Perplexity', /perplexity/], ['Gemini', /gemini\.google|bard\.google/],
  ['Copilot', /copilot|bing\.com\/chat/], ['Claude', /claude\.ai|anthropic/], ['DeepSeek', /deepseek/], ['Meta AI', /meta\.ai/], ['Grok', /grok/], ['You.com', /^you\.com/],
];
const AI_REGEX = 'chatgpt|openai|perplexity|gemini\\.google|bard\\.google|copilot|claude\\.ai|anthropic|deepseek|meta\\.ai|grok|^you\\.com';
const aiName = src => (AI_SOURCES.find(([, re]) => re.test(src)) || ['Other AI'])[0];
const ymd = d => d.toISOString().slice(0, 10);
const daysAgo = n => ymd(new Date(Date.now() - n * 864e5));

async function report(req, res, site, property) {
  const tok = await accessToken(req, res);
  const ga = (body) => gapi(tok, `${GA_DATA}/${property}:runReport`, body);
  const gsc = (body) => gapi(tok, `${GSC}/sites/${encodeURIComponent(site)}/searchAnalytics/query`, body);
  // 12 complete months plus the current month so far (the page leaves out the unfinished month)
  const start12 = new Date(); start12.setUTCDate(1); start12.setUTCMonth(start12.getUTCMonth() - 12);
  const m12 = { startDate: ymd(start12), endDate: 'today' }, d28 = { startDate: '28daysAgo', endDate: 'yesterday' };
  const rows = j => (j.rows || []).map(r => ({ d: (r.dimensionValues || []).map(x => x.value), m: (r.metricValues || []).map(x => Number(x.value)) }));
  const gscEnd = daysAgo(3), gscStart28 = daysAgo(30), gscStart12 = ymd(start12);

  const tasks = {
    monthly: property && section(async () => ({ rows: rows(await ga({ dateRanges: [m12], dimensions: [{ name: 'yearMonth' }], metrics: ['sessions', 'totalUsers', 'averageSessionDuration', 'bounceRate', 'screenPageViewsPerSession', 'newUsers'].map(name => ({ name })), orderBys: [{ dimension: { dimensionName: 'yearMonth' } }] }))
      .map(r => ({ month: r.d[0].slice(0, 4) + '-' + r.d[0].slice(4), sessions: r.m[0], users: r.m[1], duration: r.m[2], bounce: r.m[3], pages: r.m[4], newUsers: r.m[5] })) })),
    channels: property && section(async () => ({ rows: rows(await ga({ dateRanges: [d28], dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] })).map(r => ({ channel: r.d[0], sessions: r.m[0] })) })),
    sources: property && section(async () => ({ rows: rows(await ga({ dateRanges: [d28], dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 10 })).map(r => ({ source: r.d[0], medium: r.d[1], sessions: r.m[0] })) })),
    countries: property && section(async () => ({ rows: rows(await ga({ dateRanges: [d28], dimensions: [{ name: 'countryId' }, { name: 'country' }], metrics: [{ name: 'sessions' }, { name: 'totalUsers' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 10 })).map(r => ({ code: r.d[0].toLowerCase(), name: r.d[1], sessions: r.m[0], users: r.m[1] })) })),
    devices: property && section(async () => ({ rows: rows(await ga({ dateRanges: [d28], dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }] })).map(r => ({ device: r.d[0], sessions: r.m[0] })) })),
    ai: property && section(async () => {
      const filter = { filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'PARTIAL_REGEXP', value: AI_REGEX, caseSensitive: false } } };
      const [byMonth, pages] = await Promise.all([
        ga({ dateRanges: [m12], dimensions: [{ name: 'yearMonth' }, { name: 'sessionSource' }], metrics: [{ name: 'sessions' }], dimensionFilter: filter, limit: 1000 }),
        ga({ dateRanges: [{ startDate: '90daysAgo', endDate: 'yesterday' }], dimensions: [{ name: 'landingPagePlusQueryString' }, { name: 'sessionSource' }], metrics: [{ name: 'sessions' }], dimensionFilter: filter, orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 50 }),
      ]);
      const agg = {};
      rows(byMonth).forEach(r => { const k = r.d[0].slice(0, 4) + '-' + r.d[0].slice(4) + '|' + aiName(r.d[1].toLowerCase()); agg[k] = (agg[k] || 0) + r.m[0]; });
      const pg = {};
      rows(pages).forEach(r => { const p = pg[r.d[0]] || (pg[r.d[0]] = { page: r.d[0], sessions: 0, platforms: new Set() }); p.sessions += r.m[0]; p.platforms.add(aiName(r.d[1].toLowerCase())); });
      return { rows: Object.entries(agg).map(([k, visits]) => { const [date, source] = k.split('|'); return { date, source, visits }; }),
        pages: Object.values(pg).sort((a, b) => b.sessions - a.sessions).slice(0, 10).map(p => ({ ...p, platforms: [...p.platforms] })) };
    }),
    searchMonthly: site && section(async () => {
      const j = await gsc({ startDate: gscStart12, endDate: gscEnd, dimensions: ['date'], rowLimit: 25000 });
      const by = {};
      (j.rows || []).forEach(r => { const m = r.keys[0].slice(0, 7); const b = by[m] || (by[m] = { month: m, clicks: 0, impressions: 0, posSum: 0 }); b.clicks += r.clicks; b.impressions += r.impressions; b.posSum += r.position * r.impressions; });
      return { rows: Object.values(by).sort((a, b) => a.month.localeCompare(b.month)).map(b => ({ month: b.month, clicks: b.clicks, impressions: b.impressions, position: b.impressions ? b.posSum / b.impressions : null })) };
    }),
    keywords: site && section(async () => ({ rows: ((await gsc({ startDate: gscStart28, endDate: gscEnd, dimensions: ['query'], rowLimit: 50 })).rows || []).map(r => ({ keyword: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })) })),
    searchCountries: site && section(async () => ({ rows: ((await gsc({ startDate: gscStart28, endDate: gscEnd, dimensions: ['country'], rowLimit: 10 })).rows || []).map(r => ({ code3: r.keys[0], clicks: r.clicks, impressions: r.impressions })) })),
    pages: site && section(async () => ({ rows: ((await gsc({ startDate: gscStart28, endDate: gscEnd, dimensions: ['page'], rowLimit: 10 })).rows || []).map(r => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })) })),
  };
  const keys = Object.keys(tasks);
  const vals = await Promise.all(keys.map(k => tasks[k] || Promise.resolve(null)));
  const out = { site: site || '', property: property || '', fetchedAt: new Date().toISOString() };
  keys.forEach((k, i) => { out[k] = vals[i]; });
  return out;
}

module.exports = { configured, startUrl, callback, logout, session, properties, report, GErr };

// Similarweb API v5 client for the website traffic report.
// Docs: https://docs.similarweb.com/api-v5
// Every call uses Similarweb data credits, so reports are cached for 24 hours per domain and country.
const BASE = (process.env.SIMILARWEB_API_BASE || 'https://api.similarweb.com').replace(/\/+$/, '');
const KEY = (process.env.SIMILARWEB_API_KEY || '').trim();
const CAMPAIGN = (process.env.SIMILARWEB_PROMPT_CAMPAIGN_ID || '').trim();
const TTL = 24 * 60 * 60 * 1000;
const cache = new Map();

const configured = () => !!KEY;

class SwError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}

// YYYY-MM for "n months before this month"
function month(n) {
  const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - n);
  return d.toISOString().slice(0, 7);
}
const flat = data => (Array.isArray(data) ? data.flat(2) : []).filter(x => x && typeof x === 'object');

async function call(path, params) {
  const q = new URLSearchParams({ format: 'json' });
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.set(k, String(v)); });
  let res;
  try {
    res = await fetch(`${BASE}/${path}?${q}`, { headers: { 'api-key': KEY, accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  } catch (e) {
    throw new SwError(502, e.name === 'TimeoutError' ? 'Similarweb took too long to respond.' : 'Could not reach Similarweb.', 'network');
  }
  let j = null;
  try { j = await res.json(); } catch {}
  const metaErr = j?.meta && String(j.meta.status).toLowerCase() === 'error';
  if (!res.ok || metaErr) {
    const msg = j?.meta?.error_message || j?.message || j?.error || `Similarweb returned status ${res.status}.`;
    const status = res.status === 200 ? 400 : res.status;
    if (status === 401) throw new SwError(401, 'The Similarweb API key was rejected. Check SIMILARWEB_API_KEY and that the key is activated.', 'auth');
    if (status === 403) throw new SwError(403, 'Your Similarweb plan does not include this data.', 'plan');
    if (status === 429) throw new SwError(429, 'Similarweb rate limit or data credits reached. Try again later.', 'limit');
    throw new SwError(status, String(msg), 'api');
  }
  return { rows: flat(j?.data), meta: j?.meta || {} };
}

// Run one section; a failing section returns its error instead of breaking the whole report.
async function section(fn) {
  try { return { ok: true, ...(await fn()) }; }
  catch (e) { if (e.code === 'auth') throw e; return { ok: false, error: e.message, code: e.code }; }
}

async function build(domain, country) {
  // Similarweb publishes a month's data a few days into the next month, so start with last month
  // and fall back one more month if it is not ready yet.
  let lastOffset = 1;
  const engParams = off => ({ domain, start_date: month(off + 11), end_date: month(off), granularity: 'monthly', web_source: 'total', country,
    metrics: 'visits,unique_visitors,average_visit_duration,pages_per_visit,bounce_rate,page_views' });
  let eng;
  try { eng = await call('v5/website-analysis/websites/traffic-and-engagement', engParams(1)); }
  catch (e) {
    if (e.code === 'auth') throw e;
    lastOffset = 2;
    eng = await call('v5/website-analysis/websites/traffic-and-engagement', engParams(2));
  }
  const last = month(lastOffset);
  const one = { start_date: last, end_date: last, granularity: 'monthly' };

  const [devices, geo, channels, keywords, ai, rank, prompts] = await Promise.all([
    section(async () => {
      const [d, m] = await Promise.all(['desktop', 'mobile_web'].map(ws =>
        call('v5/website-analysis/websites/traffic-and-engagement', { domain, ...one, web_source: ws, country, metrics: 'visits' })));
      return { desktop: d.rows[0]?.visits ?? null, mobile: m.rows[0]?.visits ?? null };
    }),
    section(async () => {
      const r = await call('v5/website-analysis/websites/geography/aggregated', { domain, ...one, web_source: 'total', metrics: 'share,visits', limit: 10, sort: 'share', asc: false });
      return { rows: r.rows.map(x => ({ country: String(x.country_code || x.country || x.country_name || '').toLowerCase(), name: x.country_name || '', share: x.share ?? null, visits: x.visits ?? null })).filter(x => x.country) };
    }),
    section(async () => {
      const r = await call('v5/website-analysis/websites/traffic-channels/share', { domain, ...one, web_source: 'total', country, limit: 100, sort: 'share', asc: false });
      return { rows: r.rows.map(x => ({ source: x.domain || x.source || '', channel: x.source_type || x.channel || 'Other', share: Number(x.share) || 0 })) };
    }),
    section(async () => {
      const r = await call('v5/website-analysis/keywords/aggregated', { domain, ...one, web_source: 'total', country, traffic_source: 'all',
        metrics: 'clicks,traffic_share,position,primary_intent,top_url,competition', limit: 50, sort: 'clicks', asc: false });
      return { rows: r.rows.map(x => ({ keyword: x.keyword, clicks: x.clicks ?? null, share: x.traffic_share ?? null, position: x.position ?? null, intent: x.primary_intent || '', url: x.top_url || '', competition: x.competition ?? null })).filter(x => x.keyword) };
    }),
    section(async () => {
      const r = await call('v5/gen-ai-research/ai-traffic/overview', { domain, start_date: month(lastOffset + 11), end_date: last, granularity: 'monthly', country, metrics: 'visits,share' });
      return { rows: r.rows.map(x => ({ date: String(x.date || '').slice(0, 7), source: x.llm_source || 'Other', visits: Number(x.visits) || 0, share: x.share ?? null })) };
    }),
    section(async () => {
      const calls = [call('v5/website-analysis/websites/website-rank', { domain, ...one, web_source: 'total', country: 'ww', metrics: 'country_rank,category_rank,category' })];
      if (country !== 'ww') calls.push(call('v5/website-analysis/websites/website-rank', { domain, ...one, web_source: 'total', country, metrics: 'country_rank,category_rank,category' }));
      const [w, c] = await Promise.all(calls);
      const g = w.rows[0] || {}, l = (c || w).rows[0] || {};
      return { global: g.country_rank ?? null, country: country === 'ww' ? null : (l.country_rank ?? null), category: l.category || g.category || '', categoryRank: l.category_rank ?? g.category_rank ?? null };
    }),
    CAMPAIGN ? section(async () => {
      const end = new Date(); const start = new Date(Date.now() - 30 * 864e5);
      const r = await call('v5/gen-ai-campaign-analysis/prompts', { campaign_id: CAMPAIGN, start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10), granularity: 'daily', limit: 1000, sort: 'date', asc: false });
      const core = domain.split('.')[0];
      const hits = new Map();
      r.rows.forEach(x => {
        const blob = JSON.stringify([x.citations, x.brands_mentioned]).toLowerCase();
        if (!blob.includes(domain) && !blob.replace(/[^a-z0-9]/g, '').includes(core.replace(/[^a-z0-9]/g, ''))) return;
        const k = String(x.prompt || '').trim(); if (!k) return;
        const h = hits.get(k) || { prompt: k, count: 0, llms: new Set(), sentiment: x.sentiment ?? null, cited: false };
        h.count++; if (x.llm) h.llms.add(x.llm); if (JSON.stringify(x.citations || '').toLowerCase().includes(domain)) h.cited = true;
        hits.set(k, h);
      });
      return { total: r.rows.length, rows: [...hits.values()].sort((a, b) => b.count - a.count).slice(0, 15).map(h => ({ ...h, llms: [...h.llms] })) };
    }) : Promise.resolve({ ok: false, code: 'no_campaign', error: 'Prompt tracking needs a Similarweb Gen AI campaign. Add SIMILARWEB_PROMPT_CAMPAIGN_ID on the server.' }),
  ]);

  return {
    domain, country, month: last, fetchedAt: new Date().toISOString(),
    dataType: eng.meta.data_type || '', lastUpdated: eng.meta.last_updated || '',
    engagement: eng.rows.map(x => ({ date: String(x.date || '').slice(0, 7), visits: x.visits ?? null, unique: x.unique_visitors ?? null, duration: x.average_visit_duration ?? null, pages: x.pages_per_visit ?? null, bounce: x.bounce_rate ?? null, pageViews: x.page_views ?? null })),
    devices, geo, channels, keywords, ai, rank, prompts,
  };
}

async function report(domain, country) {
  const key = domain + '|' + country;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return { ...(await hit.p), cached: true };
  const p = build(domain, country);
  cache.set(key, { at: Date.now(), p });
  try { return await p; } catch (e) { cache.delete(key); throw e; }
}

module.exports = { configured, report, hasCampaign: () => !!CAMPAIGN, SwError };

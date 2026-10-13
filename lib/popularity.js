// Free popularity signals for any website. None of these give visit counts; together they show
// roughly how big and how popular a site is.
//   Tranco          - research top-sites ranking, daily rank history (no key needed)
//   Cloudflare Radar - popularity bucket, top countries, categories (free API token)
//   Chrome UX Report - mobile/desktop split and Core Web Vitals from real Chrome users (free Google API key)
//   Open PageRank    - link-based authority score (free API key)
const TRANCO = process.env.TRANCO_API_BASE || 'https://tranco-list.eu';
const CF = process.env.CLOUDFLARE_API_BASE || 'https://api.cloudflare.com/client/v4';
const CRUX = process.env.CRUX_API_BASE || 'https://chromeuxreport.googleapis.com/v1';
const OPR = process.env.OPENPAGERANK_API_BASE || 'https://openpagerank.com';
const CF_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
const CRUX_KEY = (process.env.CRUX_API_KEY || process.env.PSI_API_KEY || '').trim();
const OPR_KEY = (process.env.OPENPAGERANK_API_KEY || '').trim();
const TTL = 12 * 60 * 60 * 1000;
const cache = new Map();

async function getJson(url, opts = {}) {
  let res;
  try { res = await fetch(url, { ...opts, signal: AbortSignal.timeout(15000), headers: { accept: 'application/json', ...(opts.headers || {}) } }); }
  catch (e) { const err = new Error(e.name === 'TimeoutError' ? 'The service took too long to respond.' : 'Could not reach the service.'); err.status = 502; throw err; }
  let j = null; try { j = await res.json(); } catch {}
  if (!res.ok) { const err = new Error(j?.errors?.[0]?.message || j?.error?.message || `Status ${res.status}`); err.status = res.status; throw err; }
  return j;
}
const section = async (enabled, why, fn) => {
  if (!enabled) return { ok: false, code: 'not_configured', error: why };
  try { return { ok: true, ...(await fn()) }; }
  catch (e) { return { ok: false, code: e.status === 404 ? 'no_data' : 'error', error: e.status === 404 ? 'No data for this website.' : e.message }; }
};

const tranco = domain => section(true, '', async () => {
  const j = await getJson(`${TRANCO}/api/ranks/domain/${encodeURIComponent(domain)}`);
  const ranks = (j?.ranks || []).map(r => ({ date: String(r.date).slice(0, 10), rank: Number(r.rank) })).filter(r => r.rank > 0).sort((a, b) => a.date.localeCompare(b.date));
  return { ranks };
});

const cloudflare = domain => section(!!CF_TOKEN, 'Add CLOUDFLARE_API_TOKEN on the server to show popularity by country.', async () => {
  const j = await getJson(`${CF}/radar/ranking/domain/${encodeURIComponent(domain)}?includeTopLocations=true&limit=10&format=JSON`, { headers: { authorization: `Bearer ${CF_TOKEN}` } });
  const d = j?.result?.details_0 || {};
  return {
    rank: d.rank ?? null,
    bucket: d.bucket ? String(d.bucket) : null,
    categories: (d.categories || []).map(c => c.name).filter(Boolean),
    locations: (d.top_locations || d.topLocations || []).map(l => ({ code: String(l.locationCode || l.location_code || '').toLowerCase(), name: l.locationName || l.location_name || '', rank: l.rank ?? null })).filter(l => l.code),
  };
});

const crux = domain => section(!!CRUX_KEY, 'Add a Google API key (CRUX_API_KEY or PSI_API_KEY) with the Chrome UX Report API enabled.', async () => {
  const origin = 'https://' + domain;
  const post = (path, body) => getJson(`${CRUX}/${path}?key=${encodeURIComponent(CRUX_KEY)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  let rec;
  try { rec = (await post('records:queryHistoryRecord', { origin, collectionPeriodCount: 25 })).record; }
  catch (e) { if (e.status !== 404) throw e; rec = (await post('records:queryHistoryRecord', { origin: 'https://www.' + domain, collectionPeriodCount: 25 })).record; }
  const m = rec?.metrics || {};
  const periods = (rec?.collectionPeriods || []).map(p => { const d = p.lastDate || {}; return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`; });
  const ff = m.form_factors?.fractionTimeseries || {};
  const num = v => (v === 'NaN' || v == null ? null : Number(v));
  const devices = periods.map((date, i) => ({ date, phone: num(ff.phone?.fractions?.[i]), desktop: num(ff.desktop?.fractions?.[i]), tablet: num(ff.tablet?.fractions?.[i]) }));
  const p75 = k => { const a = m[k]?.percentilesTimeseries?.p75s || []; for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return Number(a[i]); return null; };
  return { origin: rec?.key?.origin || origin, devices, vitals: { lcp: p75('largest_contentful_paint'), inp: p75('interaction_to_next_paint'), cls: p75('cumulative_layout_shift'), ttfb: p75('experimental_time_to_first_byte') } };
});

const openPageRank = domain => section(!!OPR_KEY, 'Add OPENPAGERANK_API_KEY on the server to show the authority score.', async () => {
  const j = await getJson(`${OPR}/api/v1.0/getPageRank?domains%5B0%5D=${encodeURIComponent(domain)}`, { headers: { 'API-OPR': OPR_KEY } });
  const r = (j?.response || [])[0] || {};
  if (r.status_code && r.status_code !== 200) { const e = new Error(r.error || 'No data for this website.'); e.status = 404; throw e; }
  return { score: r.page_rank_decimal != null ? Number(r.page_rank_decimal) : null, rank: r.rank ? Number(r.rank) : null };
});

async function report(domain) {
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < TTL) return { ...(await hit.p), cached: true };
  const p = Promise.all([tranco(domain), cloudflare(domain), crux(domain), openPageRank(domain)])
    .then(([tr, cf, cx, opr]) => ({ domain, fetchedAt: new Date().toISOString(), tranco: tr, cloudflare: cf, crux: cx, opr }));
  cache.set(domain, { at: Date.now(), p });
  return p;
}

module.exports = { report, sources: () => ({ tranco: true, cloudflare: !!CF_TOKEN, crux: !!CRUX_KEY, opr: !!OPR_KEY }) };

// Blog: reads the compiled guides (content/posts.json) and renders the blog pages.
const data = require('../content/posts.json');

const CATS = {
  technical: { name: 'Technical SEO', blurb: 'Crawling, indexing, redirects, speed and the files search engines read first.' },
  'on-page': { name: 'On-page SEO', blurb: 'Titles, descriptions, headings, links and content that match what people search.' },
  schema: { name: 'Schema', blurb: 'Structured data that helps search engines understand your business, products and pages.' },
  local: { name: 'Local SEO', blurb: 'Google Business Profile, reviews and local rankings for shops and service businesses.' },
  keywords: { name: 'Keyword research', blurb: 'Finding the words your customers type, and building pages around them.' },
  social: { name: 'Social search', blurb: 'Getting found on Instagram and YouTube, where many customers search first.' },
  strategy: { name: 'Strategy', blurb: 'Where to start, what to skip and the free tools that make SEO manageable.' },
};
const TOOLS = {
  audit: ['/seo-audit', 'Run a free SEO audit', 'Check any page for these problems in about 20 seconds.'],
  meta: ['/meta-tag-generator', 'Open the meta tag generator', 'Write the tags with a live Google and WhatsApp preview.'],
  schema: ['/schema-generator', 'Open the schema generator', 'Build valid JSON-LD, filled in from your own website.'],
  social: ['/hashtag-generator', 'Open the hashtag generator', 'Get hashtags, an Instagram bio and YouTube tags in one go.'],
  keywords: ['/keyword-ideas', 'Find keyword ideas', 'Turn one seed keyword into local, buying and question searches.'],
  robots: ['/robots-txt-sitemap-generator', 'Create robots.txt and a sitemap', 'Generate both files from your live site, ready to upload.'],
};

const posts = data.posts;
const bySlug = new Map(posts.map(p => [p.slug, p]));
const html = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => html(s).replace(/"/g, '&quot;');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const niceDate = d => { const [y, m, day] = d.split('-').map(Number); return `${day} ${MONTHS[m - 1]} ${y}`; };
const cover = p => `/blog/covers/${p.slug}`;
const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const catChip = c => `<span class="cat-chip cat-${c}">${html(CATS[c]?.name || c)}</span>`;

function cards(list, { small = false, lazyFrom = 0 } = {}) {
  return list.map((p, i) => `<a class="pcard cat-${p.category}${small ? ' small' : ''} reveal" style="--d:${i % 3}" href="/blog/${p.slug}" data-cat="${p.category}" data-q="${attr((p.title + ' ' + p.description).toLowerCase())}">
  <div class="pcover"><img src="${cover(p)}.webp" width="1200" height="630" alt=""${i >= lazyFrom ? ' loading="lazy"' : ''} decoding="async"></div>
  <div class="pbody">${catChip(p.category)}<h3>${html(p.title)}</h3>${small ? '' : `<p>${html(p.description)}</p>`}<span class="pmeta">${p.minutes} min read<span class="go">${ARROW}</span></span></div>
</a>`).join('\n');
}

function categories() {
  return Object.entries(CATS).map(([slug, c]) => ({ slug, ...c, count: posts.filter(p => p.category === slug).length })).filter(c => c.count);
}

function indexView(cat) {
  if (cat && !CATS[cat]) return null;
  const list = cat ? posts.filter(p => p.category === cat) : posts;
  const c = cat && CATS[cat];
  const chips = [`<a href="/blog" class="fchip"${!cat ? ' aria-current="page"' : ''}>All <b>${posts.length}</b></a>`,
    ...categories().map(x => `<a href="/blog/category/${x.slug}" class="fchip cat-${x.slug}"${cat === x.slug ? ' aria-current="page"' : ''}>${html(x.name)} <b>${x.count}</b></a>`)].join('');
  const [first, ...rest] = list;
  const featured = !cat && first ? `<a class="feature cat-${first.category} reveal" href="/blog/${first.slug}">
    <div class="pcover"><img src="${cover(first)}.webp" width="1200" height="630" alt="" fetchpriority="high" decoding="async"></div>
    <div class="fbody"><span class="kicker">Latest guide</span>${catChip(first.category)}<h2>${html(first.title)}</h2><p>${html(first.description)}</p><span class="pmeta">${niceDate(first.date)} · ${first.minutes} min read</span><span class="btn btn-sm">Read the guide ${ARROW}</span></div></a>` : '';
  const grid = cards(cat ? list : rest, { lazyFrom: cat ? 3 : 0 });
  const title = c ? `${c.name} Guides, Free and Practical | Rankdesk` : 'Free SEO Guides for Small Businesses | Rankdesk Blog';
  const desc = c ? `${c.blurb} ${list.length} free guides from Rankdesk.` : `${posts.length} free, practical SEO guides on technical SEO, on-page SEO, schema, local SEO, keywords and social search, written for people who run websites.`;
  const body = `<main id="main" class="blog">
  <section class="blog-hero wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>${c ? `<a href="/blog">Blog</a><span aria-hidden="true">/</span><span>${html(c.name)}</span>` : '<span>Blog</span>'}</nav>
    <div class="load-in">
      <h1 class="h1">${c ? html(c.name) + ' <span class="hl">guides.</span>' : 'SEO guides that <span class="hl">skip the jargon.</span>'}</h1>
      <p class="lede">${c ? html(c.blurb) : 'Practical guides for people who run websites: what to fix, why it matters and exactly how to do it. Each one links to a free tool that does the work.'}</p>
      <div class="blog-tools">
        <label class="bsearch"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m13.5 13.5 3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span class="sr">Search guides</span><input id="bsearch" type="search" placeholder="Search ${list.length} guides" autocomplete="off"></label>
      </div>
      <nav class="fchips" aria-label="Categories">${chips}</nav>
    </div>
  </section>
  <div class="wrap">
    <!--AD:top-->
    ${featured}
    ${c ? `<h2 class="sr">All ${html(c.name)} guides</h2>` : ''}
    <div class="pgrid" id="pgrid">${grid}</div>
    <p class="note bempty" id="bempty" hidden>No guides match that search. Try a shorter word, like "schema" or "local".</p>
  </div>
</main>`;
  return {
    key: 'blog', body,
    meta: { title, description: desc, path: cat ? `/blog/category/${cat}` : '/blog', nav: 'blog', name: c ? c.name : 'Blog', scripts: ['blog.js'],
      crumbs: c ? [['Blog', '/blog'], [c.name, `/blog/category/${cat}`]] : [['Blog', '/blog']],
      ld: base => [{ '@type': 'CollectionPage', name: c ? `${c.name} guides` : 'Rankdesk SEO guides', url: base + (cat ? `/blog/category/${cat}` : '/blog'),
        mainEntity: { '@type': 'ItemList', itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}/blog/${p.slug}` })) } }] },
  };
}

function related(p, n = 3) {
  const same = posts.filter(x => x.slug !== p.slug && x.category === p.category);
  const tool = posts.filter(x => x.slug !== p.slug && x.category !== p.category && p.tool && x.tool === p.tool);
  return [...same, ...tool, ...posts.filter(x => x.slug !== p.slug)].filter((x, i, a) => a.indexOf(x) === i).slice(0, n);
}

function postView(slug) {
  const p = bySlug.get(slug); if (!p) return null;
  const c = CATS[p.category] || { name: p.category };
  // in-article ad before the third section
  let n = 0;
  const article = p.html.replace(/<h2 /g, m => (++n === 3 ? '<!--AD:bottom-->\n' + m : m));
  const toc = p.toc.map(t => `<a href="#${t.id}">${html(t.text)}</a>`).join('');
  const t = TOOLS[p.tool];
  const cta = t ? `<a class="tool-cta reveal" href="${t[0]}"><span class="kicker">Free tool</span><b>${html(t[1])}</b><span>${html(t[2])}</span><span class="go">${ARROW}</span></a>` : '';
  const prevNext = (() => { const i = posts.indexOf(p); const prev = posts[i + 1], next = posts[i - 1];
    return `<nav class="pn" aria-label="More guides">${prev ? `<a href="/blog/${prev.slug}"><small>Previous guide</small>${html(prev.title)}</a>` : '<span></span>'}${next ? `<a class="nx" href="/blog/${next.slug}"><small>Next guide</small>${html(next.title)}</a>` : ''}</nav>`; })();
  const share = `<div class="share-row"><span>Share</span>
    <a data-share="wa" href="https://wa.me/" target="_blank" rel="noopener">WhatsApp</a>
    <a data-share="li" href="https://www.linkedin.com/" target="_blank" rel="noopener">LinkedIn</a>
    <a data-share="x" href="https://x.com/" target="_blank" rel="noopener">X</a>
    <button type="button" class="linkbtn" data-copylink>Copy link</button></div>`;
  const body = `<div class="readbar" aria-hidden="true"><i id="readbar"></i></div>
<main id="main" class="post cat-${p.category}">
  <header class="post-hero wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog">Blog</a><span aria-hidden="true">/</span><a href="/blog/category/${p.category}">${html(c.name)}</a></nav>
    <div class="load-in">
      <a class="cat-chip cat-${p.category}" href="/blog/category/${p.category}">${html(c.name)}</a>
      <h1 class="h1 post-title">${html(p.title)}</h1>
      <p class="lede">${html(p.description)}</p>
      <div class="post-meta"><span class="by"><span class="av" aria-hidden="true">R</span>Rankdesk Team</span><span>${p.updated ? 'Updated ' + niceDate(p.updated) : niceDate(p.date)}</span><span>${p.minutes} min read</span></div>
    </div>
  </header>
  <div class="wrap post-grid">
    <article class="post-main">
      <figure class="post-cover load-in"><img src="${cover(p)}.webp" width="1200" height="630" alt="${attr(p.title)}" fetchpriority="high" decoding="async"></figure>
      <div class="prose article">${article}</div>
      ${cta}
      ${share}
      <div class="author-box"><span class="av" aria-hidden="true">R</span><div><b>Written by the Rankdesk Team</b><p>We build websites and run SEO for small businesses in Ahmedabad, and we write down what works. Spotted a mistake? <a href="/contact">Tell us</a>.</p></div></div>
      ${prevNext}
    </article>
    <aside class="post-aside">
      ${toc ? `<nav class="toc" aria-label="On this page"><h2>On this page</h2>${toc}</nav>` : ''}
      <!--AD:side-->
    </aside>
  </div>
  <section class="wrap related">
    <div class="section-head reveal"><span class="kicker">Keep reading</span><h2 class="h2">More ${html(c.name.toLowerCase())} guides</h2></div>
    <div class="pgrid">${cards(related(p), {})}</div>
  </section>
</main>`;
  return {
    key: 'post', body, share: true,
    meta: { title: (t => (t + ' | Rankdesk').length <= 60 ? t + ' | Rankdesk' : t)(p.seoTitle || p.title), ogTitle: p.title, description: p.description, path: `/blog/${p.slug}`, nav: 'blog', name: p.title,
      image: `${cover(p)}.jpg`, ogType: 'article', published: p.date, section: c.name, scripts: ['blog.js'],
      crumbs: [['Blog', '/blog'], [c.name, `/blog/category/${p.category}`], [p.title, `/blog/${p.slug}`]],
      ld: base => [{ '@type': 'BlogPosting', headline: p.title, description: p.description, image: base + cover(p) + '.jpg',
        datePublished: p.date, dateModified: p.updated || p.date, wordCount: p.words, articleSection: c.name,
        mainEntityOfPage: base + '/blog/' + p.slug, author: { '@type': 'Organization', name: 'Rankdesk Team', url: base + '/about' },
        publisher: { '@type': 'Organization', name: 'Rankdesk', logo: { '@type': 'ImageObject', url: base + '/apple-touch-icon.png' } } }] },
  };
}

function rss(base, name) {
  const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const items = posts.slice(0, 30).map(p => `  <item><title>${x(p.title)}</title><link>${base}/blog/${p.slug}</link><guid>${base}/blog/${p.slug}</guid><pubDate>${new Date(p.date + 'T09:00:00+05:30').toUTCString()}</pubDate><category>${x(CATS[p.category]?.name || p.category)}</category><description>${x(p.description)}</description></item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${x(name)} SEO guides</title><link>${base}/blog</link><description>Practical SEO guides from ${x(name)}</description><language>en-in</language>\n${items}\n</channel></rss>\n`;
}

module.exports = {
  builtAt: data.builtAt, CATS,
  all: () => posts,
  latest: n => posts.slice(0, n),
  forTool: (tool, n) => posts.filter(p => p.tool === tool).slice(0, n),
  categories, cards, indexView, postView, rss, niceDate,
};

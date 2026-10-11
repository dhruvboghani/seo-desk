// Compiles the Markdown guides in content/blog into content/posts.json.
// Run with: npm run build   (Vercel runs it automatically on every deploy)
//
// Each guide is a .md file whose name is its URL slug, starting with front matter:
// ---
// title: How to Write Title Tags That Get Clicked
// description: One or two sentences for Google and the blog card.
// category: on-page            (technical, on-page, schema, local, keywords, social, strategy)
// tool: meta                   (optional: audit, meta, schema, social, keywords, robots)
// date: 2026-10-11
// seo_title: Shorter title tag  (optional, 60 characters max, when the title is long)
// updated: 2026-10-20          (optional)
// ---
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const DIR = path.join(__dirname, '..', 'content', 'blog');
const OUT = path.join(__dirname, '..', 'content', 'posts.json');

const decode = s => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const slugify = s => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function parse(file) {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = {};
  m[1].split('\n').forEach(line => { const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1'); });
  ['title', 'description', 'category', 'date'].forEach(k => { if (!meta[k]) throw new Error(`${file}: front matter needs "${k}"`); });

  const toc = [];
  const used = new Set();
  const renderer = new marked.Renderer();
  renderer.heading = (text, level) => {
    let id = slugify(decode(text)); while (used.has(id)) id += '-2'; used.add(id);
    if (level === 2) toc.push({ id, text: decode(text.replace(/<[^>]+>/g, '')) });
    return `<h${level} id="${id}">${text}</h${level}>\n`;
  };
  // external links open in a new tab
  renderer.link = (href, title, text) => {
    const ext = /^https?:\/\//.test(href);
    return `<a href="${href}"${title ? ` title="${title}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
  };
  renderer.table = (header, body) => `<div class="tbl-wrap"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`;
  const html = marked.parse(m[2], { renderer, gfm: true });
  const words = m[2].replace(/[#>*_`|\-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return {
    slug: file.replace(/\.md$/, ''),
    title: meta.title, seoTitle: meta.seo_title || '', description: meta.description, category: meta.category,
    tool: meta.tool || '', date: meta.date, updated: meta.updated || '',
    order: Number(meta.order || 0), words, minutes: Math.max(2, Math.round(words / 220)), toc, html,
  };
}

const posts = fs.readdirSync(DIR).filter(f => f.endsWith('.md')).map(parse)
  .sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order || a.title.localeCompare(b.title));
fs.writeFileSync(OUT, JSON.stringify({ builtAt: new Date().toISOString().slice(0, 10), posts }, null, 1));
console.log(`Built ${posts.length} guides into content/posts.json`);

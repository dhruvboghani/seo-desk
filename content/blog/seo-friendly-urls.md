---
title: "SEO-Friendly URLs: Short, Readable and Keyword-Focused"
description: A good URL tells people and search engines what a page is about before they click. The rules for readable URLs, what to avoid and how to change them safely.
category: on-page
tool: audit
date: 2026-10-11
order: 31
---
A URL is the address of a page. Compare these two:

- `https://example.com/index.php?id=4821&cat=7`
- `https://example.com/sarees/red-banarasi-silk`

The second tells you what the page is before you open it. Search engines read URLs too, and people see them in search results, browser tabs and shared links. URLs are a small ranking factor, but they affect trust and clicks, and they're hard to change later, so it's worth getting them right from the start.

## Rules for good URLs

**1. Describe the page in a few words.** `/bathroom-waterproofing` is clear. `/services/our-premium-waterproofing-solutions-for-your-home` is too long.

**2. Use hyphens between words.** Google treats hyphens as word separators. Underscores (`red_silk_saree`) and joined words (`redsilksaree`) are harder to read.

**3. Lowercase only.** URLs can be case-sensitive, so `/Sarees` and `/sarees` may be different pages. Lowercase avoids duplicates and broken links.

**4. Include the main keyword naturally.** `/silk-sarees` for a silk saree category. Don't repeat it: `/silk-sarees/silk-saree-red-silk` adds nothing.

**5. Leave out filler.** Words like "and", "the", "of" can usually go, as long as the URL still reads well.

**6. Avoid dates in evergreen content.** `/blog/2026/10/how-to-choose-a-saree` makes a timeless guide look old next year. `/blog/how-to-choose-a-saree` doesn't.

**7. Keep a sensible structure.** Folders can show hierarchy, such as `/sarees/banarasi/red-silk`. Don't go deeper than you need to. Two or three levels are plenty for most sites.

**8. Use English letters for the main site.** Hindi or Gujarati characters work in URLs, but they turn into long encoded strings when copied and shared, like `%E0%A4%B8...`. For local-language pages, a transliterated slug such as `/hi/silk-saree` is often easier to share. See our [Hindi and Gujarati keywords guide](/blog/hindi-gujarati-keywords).

## What to avoid

- **Session IDs and tracking codes** in normal links: `?sessionid=xyz`. Use them only in campaign links and set a [canonical tag](/blog/canonical-tags-guide) on the page.
- **File extensions** that reveal technology, like `.php` or `.aspx`. They're not harmful, but clean URLs age better if you ever change platforms.
- **Spaces and special characters**, which become `%20` and similar codes.
- **Keyword stuffing**: `/best-cheap-silk-saree-buy-online-silk-saree-surat`.

## Examples

| Page | Weak URL | Better URL |
|---|---|---|
| Category | /category.php?id=12 | /sarees/banarasi |
| Product | /product/8821 | /sarees/red-banarasi-silk |
| Service | /services/page-3 | /waterproofing/terrace |
| Location | /our-branch-in-vadodara-gujarat-india | /branches/vadodara |
| Blog post | /blog/2026/10/11/post-14 | /blog/how-to-identify-pure-silk |

## Setting URLs in your platform

- **WordPress:** Settings, Permalinks, choose "Post name". Edit each page's slug in the editor.
- **Shopify:** the URL handle is in each product's search engine listing section. Shopify adds `/products/` and `/collections/` automatically.
- **Wix and Squarespace:** edit the page URL or slug in each page's SEO settings.

## Changing existing URLs

Changing a URL that already ranks or has links pointing to it carries risk. Only change it if the old URL is truly bad, and when you do:

1. Set up a **301 redirect** from the old URL to the new one. See [301 vs 302 redirects](/blog/redirects-301-vs-302).
2. Update internal links to point straight to the new URL.
3. Update the sitemap.
4. Re-check the old URL to confirm it redirects in one step.

For new pages, get the URL right the first time and leave it alone.

## Check it

The [Rankdesk SEO audit](/seo-audit) shows each page's final URL after any redirects, so you can spot messy addresses, and the [meta tag generator](/meta-tag-generator) previews how the URL appears in Google's result as a readable breadcrumb.

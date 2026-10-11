---
title: What Is an SEO Audit? A Plain-English Checklist
description: An SEO audit finds the technical and on-page problems that stop a page from ranking. Here is what it checks, in the order to fix things, with no jargon.
category: technical
tool: audit
date: 2026-10-11
order: 1
---
An SEO audit is a health check for a web page. It looks at the page the way a search engine does and lists the problems that could stop it from being found, understood or shown in results. A good audit doesn't stop at problems. It tells you which ones matter most and how to fix each one.

You don't need to be technical to run one or act on it. Most fixes are a sentence in a title, a missing tag or a setting in your website builder.

## What an audit can and can't tell you

An audit checks things you control on your own site: the code, the content structure and how the server responds. It can't see how strong your competitors are, how many websites link to you, or whether your content answers the search better than the page ranked first.

So think of the score as the floor, not the ceiling. A page with serious technical problems will struggle no matter how good it is. A page with a perfect score still needs useful content and some reputation to rank well.

## The checklist, in the order to fix things

Fix problems from the top of this list down. The early items can stop a page from appearing in Google at all, while the later ones improve how well it does once it's there.

### 1. Can Google reach the page?

- **HTTP status 200.** A page that returns 404 (not found) or 500 (server error) can't be indexed.
- **Not blocked by robots.txt.** One wrong line in robots.txt can hide a whole section of a site. See our [robots.txt guide](/blog/robots-txt-guide).
- **No accidental noindex.** A `noindex` tag tells Google to leave the page out of results. It's often left on by mistake after a site goes live.
- **HTTPS.** Pages should load securely and plain `http://` addresses should redirect to `https://`.

### 2. Can Google understand it?

- **A clear title tag** of roughly 50 to 60 characters, with the main search phrase near the start.
- **One H1 heading** that says what the page is about, followed by H2 and H3 headings in order.
- **A canonical tag** pointing to the preferred address of the page, so copies don't compete with each other.
- **Alt text on images**, describing what each image shows.
- **Structured data (schema)** that labels your business, products or articles in a format machines read easily.

### 3. Will people click it?

- **A meta description** that answers the search and gives a reason to click. Google doesn't always use it, but when it does it's your sales pitch in the results.
- **Open Graph tags** so the link looks good when shared on WhatsApp, Facebook or LinkedIn.
- **A favicon**, which Google shows next to your result on mobile.

### 4. Is it fast and mobile-friendly?

- **A mobile viewport tag**, so the page fits phone screens.
- **Core Web Vitals**: how quickly the main content appears (LCP), how fast the page reacts to taps (INP) and how much the layout jumps around (CLS). Our [Core Web Vitals guide](/blog/core-web-vitals-guide) explains each one.
- **Compression and a quick server response**, so the HTML arrives fast.

### 5. Is there enough to work with?

- **Enough useful text** to answer the searcher's question. There's no magic word count, but a 40-word page rarely beats a thorough one.
- **Internal links** to related pages on your site, so Google can find them and understands how they connect.
- **An XML sitemap** listing the pages you want indexed.

## How often to audit

Audit a page when you publish it, after any redesign or platform change, and whenever traffic drops suddenly. For an established site, a monthly check of your most important pages catches problems before they cost you visitors.

Changes made by someone else are a common cause of problems. A developer adds `noindex` to a staging site and it goes live, a plugin update changes your titles, or a new theme drops your schema. A quick audit after any change catches these.

## What to do with the results

1. **Fix anything marked critical first.** Blocked pages, error codes and noindex tags stop everything else from mattering.
2. **Work through the improvements page by page.** Start with the pages that earn you money: your home page, main service or product pages and contact page.
3. **Re-audit after each change** to confirm the fix worked.
4. **Ask Google to recrawl** important pages through the URL Inspection tool in Google Search Console.

## Run one now

The [Rankdesk SEO audit](/seo-audit) checks a page against everything above, including Google's own PageSpeed data, in about 20 seconds. Each problem comes with a plain explanation and a link to the tool that writes the fix, already filled in with your site's details.

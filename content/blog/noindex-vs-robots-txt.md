---
title: "Noindex vs Robots.txt Disallow: The Difference That Breaks Sites"
description: Robots.txt stops crawling and noindex stops indexing. Mixing them up can keep pages in Google you wanted gone, or remove ones you need. When to use each.
category: technical
tool: robots
date: 2026-10-11
order: 30
seo_title: Noindex vs Robots.txt Disallow: The Difference That Matters
---
"I blocked the page in robots.txt, so why is it still in Google?" It's one of the most common SEO questions, and the answer explains a mix-up that quietly breaks a lot of websites. Robots.txt and noindex sound like they do the same thing. They don't.

## Two different jobs

| | Robots.txt `Disallow` | `noindex` |
|---|---|---|
| What it controls | **Crawling:** whether search engines may visit the page | **Indexing:** whether the page may appear in search results |
| Where it lives | One file at yourdomain.com/robots.txt | A meta tag in the page, or an HTTP header |
| Can the page still appear in Google? | Yes, if other pages link to it | No, once Google sees the tag |
| Can Google read the page's content? | No | Yes |

## Why a blocked page can still appear

Robots.txt tells Google "don't visit this URL". It doesn't say "don't list it". If other pages link to the blocked URL, Google knows it exists and may still show it in results, usually with no description, because it was never allowed to read the page.

## How noindex works

The noindex tag goes in the page's head:

```html
<meta name="robots" content="noindex">
```

Or as an HTTP header, useful for PDFs and other files:

```
X-Robots-Tag: noindex
```

When Google crawls the page and sees it, the page is dropped from results.

## The classic mistake

Combining both on the same page: noindex on the page and a robots.txt rule blocking it. Google can't crawl the page, so it never sees the noindex, and the page can stay in results indefinitely.

**To remove a page from Google, let it be crawled and add noindex.** Once it has dropped out of results, you can block it in robots.txt if you also want to save crawling, though for most small sites there's no need.

## When to use robots.txt

- Areas with no search value that could waste crawling: internal search results, endless filter combinations, cart and checkout
- Admin and backend paths
- Large sets of auto-generated URLs

## When to use noindex

- Thank-you and order confirmation pages
- Thin pages you need for users but not in search, such as tag archives with one post
- Internal campaign landing pages you don't want found organically
- Staging copies of a site that must be reachable but not indexed (better still, password-protect them)

## When to use neither

If a page shouldn't exist at all, delete it and return 404 or 410, or [redirect](/blog/redirects-301-vs-302) it to a real replacement. If a page is a duplicate of another, use a [canonical tag](/blog/canonical-tags-guide).

## When to use a password

Anything private, such as client files, staff areas and unreleased products, needs real access control. Robots.txt is public and noindex only affects search engines. Neither stops a person who has the link.

## The launch-day disaster

Many sites are built with "Discourage search engines" (WordPress) or a `noindex` tag on the staging site, plus `Disallow: /` in robots.txt. If either survives launch, the new site disappears from Google. Check both on launch day:

1. Open yourdomain.com/robots.txt and make sure it doesn't say `Disallow: /`.
2. In WordPress, Settings, Reading, make sure "Discourage search engines from indexing this site" is unticked.
3. Audit the home page and a few key pages.

## Removing a page urgently

If something sensitive is in Google, use the **Removals** tool in Search Console to hide it for about six months, then add noindex or remove the page permanently before that runs out.

## Check any page

The [Rankdesk SEO audit](/seo-audit) checks both: whether the page is blocked by robots.txt (and by which rule) and whether it has a noindex meta tag or header. Use the [robots.txt generator](/robots-txt-sitemap-generator) to create a clean file, and read our [robots.txt guide](/blog/robots-txt-guide) for the details.

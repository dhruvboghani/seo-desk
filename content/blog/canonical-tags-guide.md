---
title: "Canonical Tags: Fixing Duplicate Content Without Losing Rankings"
description: A canonical tag tells search engines which version of a page is the main one. Learn when you need it, how to write it and the mistakes to avoid.
category: technical
tool: meta
date: 2026-10-11
order: 15
seo_title: Canonical Tags: Fix Duplicate Content, Keep Rankings
---
The same page can often be reached through several addresses. With and without `www`, with tracking codes from an ad, with a product filter applied, or through two different categories. To you it's one page. To a search engine, each address could be a separate page with identical content.

A canonical tag solves this by naming the main version. It tells Google: "If you find copies of this page, treat this address as the original."

## What it looks like

It's a single line in the page's `<head>`:

```html
<link rel="canonical" href="https://example.com/silk-sarees">
```

Every version of the page should carry the same canonical pointing to the preferred address. The preferred page should point to itself, called a self-referencing canonical, which is a good default for every page.

## Why duplicates are a problem

Duplicate content isn't a penalty, but it causes real trouble:

- **Split signals.** Links and attention spread across several URLs instead of building up one.
- **The wrong URL ranks.** Google might show the version with a tracking code or the filtered view.
- **Wasted crawling.** On large sites, crawlers spend time on copies instead of new pages.

## Common sources of duplicates

- `http://` and `https://`, or `www` and non-`www` versions (fix these with redirects too)
- trailing slashes: `/page` and `/page/`
- tracking parameters: `?utm_source=whatsapp`
- filters and sorting: `?color=red&sort=price`
- the same product in two categories: `/sarees/red-silk` and `/wedding/red-silk`
- printer-friendly or AMP versions
- copies of your content on other sites (syndication)

## Rules for canonical tags

1. **Use absolute URLs** with `https://` and your domain, not relative paths.
2. **Point to a page that works:** status 200, not redirected, not `noindex`, not blocked by robots.txt.
3. **One canonical per page.** Two conflicting tags, often added by a theme and a plugin, may both be ignored.
4. **Be consistent.** Internal links, the sitemap and the canonical should all use the same preferred URL.
5. **Don't canonicalise different pages to one.** Page 2 of a category isn't a duplicate of page 1. A blue saree page isn't a duplicate of the red one.

## It's a hint, not a command

Google treats canonical tags as a strong suggestion. If other signals disagree, for example if all your internal links point to a different version, Google may choose its own canonical. Search Console's URL Inspection tool shows both the canonical you declared and the one Google selected.

## Canonical vs redirect vs noindex

| Situation | Use |
|---|---|
| The page moved permanently | A [301 redirect](/blog/redirects-301-vs-302) |
| Several URLs must keep working, such as filters or tracking links | Canonical tag |
| A page should not appear in search at all | `noindex` (see [noindex vs robots.txt](/blog/noindex-vs-robots-txt)) |

## How to set it

- **WordPress:** Yoast, Rank Math and similar plugins add self-referencing canonicals automatically and let you change them per page.
- **Shopify:** canonicals are added automatically, including for products reached through collections.
- **Custom sites:** add the tag to each page template. The [meta tag generator](/meta-tag-generator) includes it with your other head tags.

## Check it

The [Rankdesk SEO audit](/seo-audit) reports whether a page has a canonical tag and which URL it points to. Audit the versions people actually reach, such as a link with a tracking code, and make sure each one points to the clean URL.

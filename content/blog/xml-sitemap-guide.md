---
title: "XML Sitemaps: What to Include, What to Leave Out, and How to Submit"
description: An XML sitemap lists the pages you want search engines to find. Learn what belongs in it, the limits, how to submit it and how to read the report.
category: technical
tool: robots
date: 2026-10-11
order: 10
seo_title: XML Sitemaps: What to Include and How to Submit Them
---
An XML sitemap is a file that lists the pages on your website you want search engines to know about. It's like handing Google a table of contents instead of making it find every page by following links.

Google can find pages without one, especially on small, well-linked sites. A sitemap still helps new pages get discovered sooner, makes sure deep pages aren't missed, and gives you a useful report in Search Console.

## What a sitemap looks like

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/silk-sarees</loc>
    <lastmod>2026-10-01</lastmod>
  </url>
</urlset>
```

Each page is a `<url>` with its full address in `<loc>`. `<lastmod>` is the date the page content last changed.

You may see `<changefreq>` and `<priority>` in sitemaps too. Google has said it ignores both. It does use `<lastmod>` when the dates are consistently accurate, so only update it when the page really changes. Setting every page to today's date teaches Google to ignore the field.

## What to include

Only pages you want in search results:

- the page returns status 200
- it isn't blocked by robots.txt
- it has no `noindex` tag
- it's the canonical version (not a duplicate pointing elsewhere with a [canonical tag](/blog/canonical-tags-guide))

## What to leave out

- thank-you, cart, checkout and login pages
- internal search results
- filter and sort URLs such as `?color=red&sort=price`
- redirected URLs and pages that return 404
- `http://` versions if your site uses HTTPS
- duplicate URLs with tracking parameters

A sitemap full of broken or duplicate URLs wastes crawling and makes the report harder to read.

## Limits and sitemap indexes

One sitemap file can hold up to 50,000 URLs and be up to 50 MB uncompressed. Bigger sites split pages into several sitemaps and list them in a **sitemap index**:

```xml
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-products.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-blog.xml</loc></sitemap>
</sitemapindex>
```

Splitting by type (products, categories, blog) is also handy for small sites, because Search Console then reports indexing for each group separately.

## How to create one

- **WordPress:** Yoast, Rank Math and WordPress itself generate sitemaps automatically. Look for `/sitemap_index.xml` or `/wp-sitemap.xml`.
- **Shopify and Wix:** created automatically at `/sitemap.xml`.
- **Custom or static sites:** use the [Rankdesk sitemap generator](/robots-txt-sitemap-generator), which reads your live site's pages and builds the file. Upload it to your site's root folder.

## Tell search engines where it is

1. **Add it to robots.txt:** a line `Sitemap: https://example.com/sitemap.xml` lets every search engine find it.
2. **Submit it in Google Search Console:** open **Sitemaps**, type the sitemap address and click **Submit**.
3. **Submit it in Bing Webmaster Tools** too, which also feeds other search engines and assistants.

## Reading the report

After submitting, Search Console shows whether the sitemap was read successfully and how many URLs it found. The **Pages** report (filtered by sitemap) then shows how many are indexed and why the rest aren't. Common reasons:

- **Discovered, currently not indexed:** Google knows about the page but hasn't crawled it yet. Often a sign the site is new or the page looks low-value.
- **Crawled, currently not indexed:** Google looked and chose not to index it. Improve the content or merge thin pages.
- **Duplicate without user-selected canonical:** Google sees the page as a copy of another.
- **Excluded by noindex tag:** expected for pages you hid on purpose, a problem if not.

A sitemap doesn't guarantee indexing. It tells Google what you'd like indexed. Quality and usefulness decide the rest.

## A quick check

Run your home page through the [SEO audit](/seo-audit). It finds your sitemap through robots.txt, confirms it's valid, counts the URLs and checks whether the page you audited is listed.

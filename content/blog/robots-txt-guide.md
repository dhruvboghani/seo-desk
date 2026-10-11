---
title: "Robots.txt Explained: How to Allow, Block and Test Crawlers"
description: Robots.txt tells crawlers where they can and cannot go on your site. Learn the syntax, safe examples, the mistakes that hide whole sites, and testing.
category: technical
tool: robots
date: 2026-10-11
order: 9
---
Robots.txt is a small text file at the root of your website, at `yourdomain.com/robots.txt`. Before a search engine crawls your pages, it reads this file to see which areas it's allowed to visit. Get it right and crawlers focus on the pages that matter. Get it wrong and you can hide your entire site from Google.

## What it looks like

```
User-agent: *
Disallow: /admin
Disallow: /cart

Sitemap: https://example.com/sitemap.xml
```

- **User-agent** says which crawler the rules apply to. `*` means all of them.
- **Disallow** lists paths the crawler shouldn't visit.
- **Allow** (optional) makes an exception inside a blocked path.
- **Sitemap** tells crawlers where your [XML sitemap](/blog/xml-sitemap-guide) is.

Paths match from the start. `Disallow: /admin` blocks `/admin`, `/admin/settings` and also `/administration`. Add a trailing slash, `/admin/`, if you only mean the folder.

## What robots.txt is for

Use it to keep crawlers out of areas that have no value in search:

- admin and login pages
- cart, checkout and account pages
- internal search result pages
- filter and sort variations that create thousands of near-duplicate URLs
- staging or test folders

For small sites, the file is often nearly empty, and that's fine. Allowing everything is a safe default.

## What it's not for

**Robots.txt doesn't remove pages from Google.** It stops crawling, not indexing. If other pages link to a blocked URL, Google can still list it, usually with no description. To keep a page out of results, allow crawling and add a `noindex` tag. Our guide to [noindex vs robots.txt](/blog/noindex-vs-robots-txt) explains this common confusion.

**It's not security.** The file is public, and anyone can read it. Never use it to "hide" private pages. Protect them with a password.

## Mistakes that cause real damage

1. **`Disallow: /`** blocks the whole website. Developers often add it to a staging site and forget to remove it at launch.
2. **Blocking CSS and JavaScript.** Google renders pages like a browser. If it can't load your styles and scripts, it may misjudge the page or think it isn't mobile-friendly.
3. **Blocking pages that have a noindex tag.** Google can't see the noindex if it can't crawl the page.
4. **Typos and wrong case.** Paths are case-sensitive. `/Blog` and `/blog` are different.
5. **Putting the file in the wrong place.** It must be at the root of the domain. A file at `/files/robots.txt` is ignored.

## Blocking AI crawlers

Some AI companies use their own crawlers to collect training data, and they say they respect robots.txt. To opt out, add a group for each one:

```
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /
```

`Google-Extended` controls whether Google uses your content for its AI models. It doesn't affect normal Google Search crawling or rankings. Whether to block these is a business decision. Blocking may also keep your content out of some AI answers.

## How to test it

1. Open `yourdomain.com/robots.txt` in a browser. It should load as plain text.
2. In Google Search Console, the robots.txt report shows the version Google last fetched and any errors.
3. Run important pages through the [Rankdesk SEO audit](/seo-audit), which reads your robots.txt and tells you if the page is blocked and by which rule.

## Create yours

The [robots.txt and sitemap generator](/robots-txt-sitemap-generator) builds the file from your live site, keeps any rules you already have, lets you block private paths and AI crawlers with one setting, and adds your sitemap line. Upload it to your site's root folder, then test it.

On WordPress, plugins such as Yoast and Rank Math let you edit robots.txt from the dashboard. Shopify generates one automatically and lets you customise it through a template.

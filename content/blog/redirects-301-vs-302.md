---
title: "301 vs 302 Redirects: Which One to Use and When"
description: Redirects send visitors and search engines from an old URL to a new one. The difference between 301 and 302, when to use each and how to avoid chains.
category: technical
tool: audit
date: 2026-10-11
order: 22
---
A redirect sends anyone who visits one URL to another URL automatically. You need them whenever a page moves: a new website, a renamed product, a switch to HTTPS or merged pages. Done right, visitors and search engines barely notice. Done wrong, you lose traffic and rankings you spent years building.

## The two you'll use

| Code | Meaning | Use when |
|---|---|---|
| **301** | Moved permanently | The old URL is gone for good |
| **302** | Found (moved temporarily) | The old URL will come back |

There are also **308** (permanent) and **307** (temporary). They behave like 301 and 302 but guarantee the request method stays the same, which matters for forms and APIs more than ordinary pages. Google treats 308 like 301 and 307 like 302.

## What Google does with each

Google has said both permanent and temporary redirects pass ranking signals. The difference is which URL Google keeps in its results:

- With a **301**, Google understands the new URL is the one to show and moves its attention there.
- With a **302**, Google may keep showing the old URL for a while, expecting it to return.

So use 301 for permanent changes. If a 302 stays in place for a long time, Google may eventually treat it as permanent anyway, but there's no reason to rely on that.

## When to use a 301

- moving from `http://` to `https://`
- choosing `www` or non-`www` and redirecting the other
- changing your domain name
- renaming a page's URL, such as `/product-12` to `/red-silk-saree`
- merging two thin pages into one stronger page
- deleting a page that has a close replacement

## When to use a 302

- a product temporarily out of stock that redirects to its category
- a seasonal page sending visitors to a temporary offer
- testing a new page before switching permanently
- sending visitors to a maintenance page during short downtime

## Redirect chains and loops

A **chain** is when URL A redirects to B, which redirects to C. Each hop slows the page and adds a chance for something to break. Search engines follow several hops, but not forever. After a site moves twice, old links often go through chains without anyone noticing.

Fix chains by pointing every old URL straight to the final destination, and update your internal links to the final URL so no redirect is needed at all.

A **loop** is when URLs redirect to each other forever (A to B, B to A). Browsers show an error like "too many redirects" and the page can't be reached.

## Deleted pages: redirect or 404?

Redirect a deleted page only when there's a genuinely relevant replacement. Redirecting everything to the home page confuses visitors, and Google often treats those as "soft 404s" anyway. If there's no replacement, let the page return **404** or **410 (gone)**. That's a normal part of a website changing.

## Moving a whole website

1. List every important old URL, using your sitemap, Search Console and analytics.
2. Map each one to its new URL in a spreadsheet.
3. Set up 301 redirects for every row, one to one.
4. Update internal links, canonical tags and the sitemap to the new URLs.
5. For a domain change, use Search Console's Change of Address tool.
6. Keep the redirects in place for at least a year, ideally permanently.
7. Watch Search Console for errors in the following weeks.

## How to set up redirects

- **WordPress:** a redirect plugin such as Redirection, or the redirect manager in your SEO plugin.
- **Shopify:** Online Store, Navigation, URL Redirects. Shopify can also create them automatically when you change a product URL.
- **Apache hosting:** rules in the `.htaccess` file.
- **Vercel, Netlify and similar:** a redirects setting in the project configuration.

## Check your redirects

The [Rankdesk SEO audit](/seo-audit) shows the full redirect chain for any URL, flags temporary redirects that should be permanent and warns about multiple hops. Audit your old URLs after any move to confirm each one lands on the right page in one step. Moving to HTTPS? Read [HTTPS and SEO](/blog/https-ssl-seo) too.

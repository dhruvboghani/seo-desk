---
title: 15 Common SEO Mistakes on New Websites (and How to Fix Them)
description: The SEO mistakes we see most often on new business websites, from launch-day noindex tags to missing titles and slow images, each with a quick way to fix it.
category: strategy
tool: audit
date: 2026-10-11
order: 35
---
Most new websites don't fail because of advanced SEO problems. They fail on the basics, often things nobody noticed at launch. Here are the mistakes we find most often when auditing new business websites, roughly in order of how much damage they do.

## Can Google see the site?

### 1. Search engines still blocked after launch

The development site had "Discourage search engines" ticked in WordPress, a `noindex` tag or `Disallow: /` in robots.txt, and it went live like that. The whole site stays out of Google.

**Fix:** check robots.txt and audit the home page on launch day. Read [noindex vs robots.txt](/blog/noindex-vs-robots-txt).

### 2. No HTTPS, or HTTP still working alongside it

Browsers show "Not secure", and Google may see two copies of every page.

**Fix:** install a free certificate and 301-redirect every HTTP URL. See [HTTPS and SEO](/blog/https-ssl-seo).

### 3. Old URLs not redirected after a redesign

The new site has new addresses, and every old link and ranking now leads to a 404.

**Fix:** map every old URL to its new one with 301 redirects. See [301 vs 302 redirects](/blog/redirects-301-vs-302).

### 4. No Search Console

Without it, you won't know about indexing problems until traffic has already dropped.

**Fix:** set it up on day one and submit your sitemap.

## Can Google understand it?

### 5. Titles like "Home" and "Untitled"

The [title tag](/blog/title-tag-guide) is the headline in Google results. Generic titles waste it.

**Fix:** give every page a unique title with its main keyword and, for local businesses, the city.

### 6. Missing or duplicate meta descriptions

Google picks random text, often the menu or a cookie notice.

**Fix:** write a unique [description](/blog/meta-description-examples) for each important page.

### 7. No H1, or the logo as the H1

Search engines and screen readers rely on headings to understand the page.

**Fix:** one clear H1 per page that says what it's about. See our [headings guide](/blog/heading-structure-h1-h2-h3).

### 8. One page for every service

A single "Services" page listing everything can't rank for each individual service.

**Fix:** create a page for each main service or product line.

### 9. Text inside images

Prices, offers and contact details baked into banner images can't be read by search engines or screen readers, and can't be copied.

**Fix:** put important text in real HTML text, and write [alt text](/blog/image-seo-guide) for every meaningful image.

## Will people click and stay?

### 10. Huge images slowing the page

Uncompressed phone photos make pages slow on mobile data, and visitors leave.

**Fix:** resize, compress and convert to WebP. See [Core Web Vitals](/blog/core-web-vitals-guide).

### 11. Not built for mobile

Most local searches happen on phones. Tiny text, buttons too close together and pages wider than the screen drive people away.

**Fix:** test every page on a real phone, and make the phone number and WhatsApp link easy to tap.

### 12. No share image

Links shared on WhatsApp show no image, or a badly cropped logo.

**Fix:** add [Open Graph tags](/blog/open-graph-tags-guide) with a 1200 × 630 image.

## Will Google trust it?

### 13. Copied or thin content

Manufacturer descriptions copied word for word, or city pages identical except for the city name, give Google no reason to rank your page.

**Fix:** write original content with real details, photos and answers. See [does word count matter](/blog/word-count-and-seo).

### 14. No Google Business Profile, or inconsistent details

Local customers can't find you on Maps, or find an old address.

**Fix:** set up a [Business Profile](/blog/google-business-profile-guide) and make your [name, address and phone](/blog/nap-consistency) match everywhere.

### 15. Buying links or "SEO packages" that promise page one

Cheap link packages and guaranteed rankings break Google's rules. At best they waste money, at worst they cause a penalty that takes months to undo.

**Fix:** earn links through partners, directories, local press and useful content. Be wary of anyone guaranteeing rankings.

## Check your site in 20 seconds

The [Rankdesk SEO audit](/seo-audit) catches mistakes 1, 2, 5, 6, 7, 10 and 12 on any page, flags missing alt text (9) and a missing mobile viewport (11), and shows the redirect chain when you audit an old URL (3). Run it on your home page, a service or product page and a blog post, because each template can have different problems. For a step-by-step plan after that, read [SEO for small businesses in India](/blog/seo-for-small-business-india).

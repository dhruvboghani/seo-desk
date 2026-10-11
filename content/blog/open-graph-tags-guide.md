---
title: "Open Graph Tags: Make Your Links Look Good on WhatsApp and LinkedIn"
description: Open Graph tags control the title, description and image when your link is shared. The essential tags, the right image size and how to refresh a preview.
category: on-page
tool: meta
date: 2026-10-11
order: 18
seo_title: Open Graph Tags: Better WhatsApp and LinkedIn Previews
---
When you share a link on WhatsApp, Facebook, LinkedIn or X, the app shows a preview card with a title, short description and image. That card comes from Open Graph tags in your page's code. Without them, apps guess, and the result is often a cropped logo, the wrong text or no image at all.

For many Indian businesses, WhatsApp is where links get shared most. A good preview makes people far more likely to tap.

## The essential tags

```html
<meta property="og:title" content="Pure Silk Sarees from Surat">
<meta property="og:description" content="Banarasi and Kanjivaram sarees direct from our looms. Delivery across India.">
<meta property="og:image" content="https://shreetextiles.in/og/silk-sarees.jpg">
<meta property="og:url" content="https://shreetextiles.in/silk-sarees">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Shree Textiles">
```

- **og:title:** the headline on the card. It can be the same as your [title tag](/blog/title-tag-guide), often without the brand suffix.
- **og:description:** one or two sentences. Many apps show only the first line, so lead with the important part.
- **og:image:** the full `https://` address of the image. Relative paths like `/og.jpg` often fail.
- **og:url:** the page's preferred address, usually the same as its [canonical tag](/blog/canonical-tags-guide).
- **og:type:** `website` for most pages, `article` for blog posts, `product` for products.

## Twitter (X) cards

X reads Open Graph tags as a fallback, but add this one for a large image card:

```html
<meta name="twitter:card" content="summary_large_image">
```

## The image matters most

- **Size:** 1200 × 630 pixels works across WhatsApp, Facebook, LinkedIn and X.
- **File:** JPG or PNG, kept small, ideally well under 1 MB. Very large images may not show in WhatsApp.
- **Safe area:** keep text and logos away from the edges, as some apps crop the image to a square.
- **Content:** a clear photo of the product or your work, or a simple branded graphic with the page title. Avoid small text that's unreadable on phones.
- **One per page** where you can. A unique image for each product or blog post looks better than one logo everywhere.

## Fixing a preview that won't update

Apps save previews, so changing your tags doesn't update links already shared. To refresh:

- **Facebook and Instagram:** paste the URL into Facebook's Sharing Debugger and click "Scrape again".
- **LinkedIn:** use the Post Inspector.
- **WhatsApp:** it caches previews too. Sharing the URL with a small change, such as adding `?v=2`, usually forces a fresh preview.

## Common mistakes

1. **No og:image**, so apps pick a random image or none.
2. **A logo as the image**, cropped badly in square previews.
3. **The same title and image on every page.**
4. **Blocking the image with robots.txt or a login**, so apps can't fetch it.
5. **Tags added by JavaScript after the page loads.** Most apps read the raw HTML and don't run scripts.

## WordPress and builders

Yoast and Rank Math have a "Social" tab on each page where you set the image and text. Shopify themes use the product image by default. Wix and Squarespace have social share settings per page.

## Create and preview them

The [Rankdesk meta tag generator](/meta-tag-generator) writes all of these tags together with your title and description, and shows a live preview of the share card. The [SEO audit](/seo-audit) checks which Open Graph tags a page is missing.

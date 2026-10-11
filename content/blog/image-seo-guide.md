---
title: "Image SEO: Alt Text, File Names, WebP and Lazy Loading"
description: Images can bring search traffic or slow your site down. Learn how to write alt text, name files, choose formats and sizes, and load images so pages stay fast.
category: technical
tool: audit
date: 2026-10-11
order: 27
---
Images do a lot of work on a business website: they show products, prove the quality of your work and make pages worth reading. They can also be the main reason a page is slow. Good image SEO makes images findable in Google Images, understandable to search engines and screen readers, and light enough to load quickly on mobile data.

## 1. Write useful alt text

Alt text (the `alt` attribute) describes an image for people who can't see it, including screen reader users, and for search engines.

```html
<img src="red-banarasi-silk-saree.webp" alt="Red Banarasi silk saree with gold zari border and pallu">
```

Good alt text:

- describes what's in the image, specifically
- is a short phrase or sentence, not a list of keywords
- includes a keyword only when it naturally describes the image

Examples:

- Weak: `alt="saree"`, `alt="image1"`, `alt="saree silk saree buy saree online surat"`
- Good: `alt="Green Kanjivaram silk saree with temple border"`
- Good: `alt="Waterproofing membrane being applied on a terrace in Bopal"`

**Decorative images,** such as background patterns or dividers, should have an empty alt, `alt=""`, so screen readers skip them.

## 2. Name files clearly

Rename `IMG_20260912_143201.jpg` to `red-banarasi-silk-saree.jpg` before uploading. Use lowercase words separated by hyphens. It's a small signal, but it costs nothing.

## 3. Choose the right format

- **WebP:** smaller than JPG and PNG at similar quality, and supported by all modern browsers. A good default for photos and graphics.
- **AVIF:** even smaller in many cases, with growing support. Many image tools and CDNs serve it automatically.
- **JPG:** fine for photos if WebP isn't an option.
- **PNG:** for images that need transparency or sharp text, like screenshots.
- **SVG:** for logos and icons, which stay sharp at any size.

## 4. Resize before you upload

A phone photo can be 4000 pixels wide and several megabytes. If it's displayed at 800 pixels wide, the visitor downloads five times more than needed. Resize images to roughly the largest size they're displayed at, and compress them. Free tools like Squoosh do both in the browser.

For responsive sites, `srcset` lets the browser pick the right size:

```html
<img src="saree-800.webp" srcset="saree-400.webp 400w, saree-800.webp 800w, saree-1600.webp 1600w" sizes="(max-width: 600px) 100vw, 800px" alt="...">
```

WordPress and most modern platforms create these sizes automatically.

## 5. Always set width and height

Add `width` and `height` attributes so the browser reserves space before the image loads. Without them, text jumps down as images appear, which hurts your CLS score. Our [Core Web Vitals guide](/blog/core-web-vitals-guide) explains why that matters.

## 6. Lazy-load below the fold, not above

`loading="lazy"` delays loading images until the visitor scrolls near them, which speeds up the first view. Use it on images further down the page, but **not on the main image at the top**. Lazy-loading the hero image delays your Largest Contentful Paint. For that image, use `fetchpriority="high"` instead.

## 7. Put images near relevant text

Google uses the text around an image, such as captions, headings and nearby paragraphs, to understand it. A product photo next to the product name and description is understood better than a gallery of unlabeled images.

## 8. Use real images

Original photos of your products, team and work are more convincing than stock photos, and they're unique, so they can rank in Google Images on their own.

## 9. Share images properly

For WhatsApp and social sharing, set an [Open Graph image](/blog/open-graph-tags-guide) of 1200 × 630 pixels. For product pages, include images in [Product schema](/blog/product-schema-guide).

## Check your pages

The [Rankdesk SEO audit](/seo-audit) lists every image on a page that has no alt text, and its PageSpeed results show which images are slowing the page down.

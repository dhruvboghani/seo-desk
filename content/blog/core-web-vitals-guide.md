---
title: "Core Web Vitals for Small Business Websites: LCP, INP and CLS"
description: Core Web Vitals measure how fast, responsive and stable your pages feel. Learn what LCP, INP and CLS mean, the targets and the fixes that work.
category: technical
tool: audit
date: 2026-10-11
order: 14
seo_title: Core Web Vitals for Small Business Sites: LCP, INP and CLS
---
Core Web Vitals are three measurements Google uses to judge how a page feels to real visitors: how quickly the main content appears, how fast the page responds when you tap something, and whether the layout jumps around while loading. They're part of Google's page experience signals.

Their effect on rankings is real but modest. Great content on a slow page usually beats thin content on a fast one. But speed directly affects how many visitors stay, especially on mobile data, so it's worth getting right.

## The three metrics

| Metric | Measures | Good | Poor |
|---|---|---|---|
| **LCP**, Largest Contentful Paint | How long until the biggest image or text block appears | 2.5 seconds or less | Over 4 seconds |
| **INP**, Interaction to Next Paint | How quickly the page reacts to taps, clicks and typing | 200 ms or less | Over 500 ms |
| **CLS**, Cumulative Layout Shift | How much content moves unexpectedly while loading | 0.1 or less | Over 0.25 |

INP replaced an older metric, First Input Delay, in 2024. Google judges each metric at the 75th percentile of real visits, so most of your visitors need a good experience, not just the ones on fast phones.

## Field data vs lab data

PageSpeed Insights shows two kinds of results:

- **Field data** comes from real Chrome users over the last 28 days. This is what Google uses. Small sites may not have enough visitors to show it.
- **Lab data** is a test run on a simulated phone. It's useful for finding problems, but the score can vary between runs.

Don't chase a perfect lab score of 100. Aim for good field data, or good lab metrics if there's no field data yet.

## Fixing LCP: show the main content sooner

The largest element is usually a hero image, banner or slider.

- **Compress and resize images.** A 4 MB photo from a phone camera is a common culprit. Convert to WebP or AVIF and serve the size actually displayed. Our [image SEO guide](/blog/image-seo-guide) covers this.
- **Don't lazy-load the hero image.** Lazy loading is great below the fold, but it delays the main image. Add `fetchpriority="high"` to it instead.
- **Avoid sliders** at the top of the page. They're heavy and rarely help conversions.
- **Improve server response.** Cheap shared hosting can take over a second to respond. Caching plugins, a CDN or better hosting help.
- **Reduce render-blocking files.** Too many CSS and JavaScript files in the head delay everything.

## Fixing INP: make the page respond faster

Slow responses usually come from too much JavaScript:

- Remove plugins and scripts you don't use, such as old chat widgets, sliders and tracking codes.
- Load third-party scripts like chat, reviews and social feeds after the page is usable.
- Choose lighter themes. Page builders that add lots of code can hurt INP.

## Fixing CLS: stop the layout jumping

- **Set width and height on images and videos** so the browser reserves space before they load.
- **Reserve space for ads, banners and embeds.** Ads that push content down are a major cause of shift.
- **Load web fonts carefully.** Use `font-display: swap` and similar fallback fonts so text doesn't jump.
- **Don't insert banners above existing content** after the page loads, like cookie bars that push everything down.

## WordPress quick wins

1. Use a caching plugin.
2. Install an image optimisation plugin that converts to WebP.
3. Remove unused plugins.
4. Choose a lightweight theme.
5. Use a CDN, often included with good hosting.

## Measure, fix, measure again

Run your key pages through the [Rankdesk SEO audit](/seo-audit), which includes Google's PageSpeed data for mobile or desktop with the biggest fixes listed. After changes, re-test. Field data in Search Console's Core Web Vitals report updates over the following four weeks, as new visits replace old ones.

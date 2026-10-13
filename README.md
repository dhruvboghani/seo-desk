# Rankdesk SEO Toolkit

All-in-one SEO workspace. Enter a URL and get a full audit; the other tabs generate meta tags, schema, hashtags, keyword ideas, robots.txt and sitemap.

## What the URL audit checks

- **On-page:** title, meta description, H1, heading order, image alt text, canonical, viewport, language, noindex (meta and X-Robots-Tag header), Open Graph, Twitter card, JSON-LD schema, charset, favicon, word count, links
- **Server:** HTTP status, HTTPS, redirect chain (301 vs 302), response time, HTML size, gzip/Brotli
- **Crawling:** robots.txt found, whether this page is blocked, XML sitemap found, URL count, whether the page is listed
- **Google PageSpeed:** Performance, SEO, Accessibility and Best Practices scores; real-user Core Web Vitals (LCP, INP, CLS); lab metrics; top speed fixes

After an audit, the Meta & SERP and Robots tabs are pre-filled from that page. A link like `/?url=https://example.com` runs an audit directly, so it can be shared with the team.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm start
# open http://localhost:3000
```

## Settings (environment variables)

| Variable | Purpose |
|---|---|
| `PORT` | Port to listen on (default 3000) |
| `PSI_API_KEY` | Google PageSpeed Insights API key. Optional, but without it Google's shared quota runs out quickly. Get one free in Google Cloud Console → APIs & Services → enable "PageSpeed Insights API" → Credentials. |
| `SITE_NAME` | Name shown in the footer, About and Privacy pages (default Rankdesk) |
| `SITE_URL` | Your live address, e.g. `https://rankdesk.in`. Used for canonical tags, sitemap and robots.txt |
| `CONTACT_EMAIL` | Shown on About, Privacy and the footer. AdSense reviewers look for a contact |
| `ADSENSE_CLIENT` | AdSense publisher ID. Defaults to `ca-pub-8829216905817441`. Set it to an empty value to turn ads off, e.g. on a local copy |
| `ADSENSE_SLOT_TOP` | Ad unit ID for the banner above each tool (horizontal display ad) |
| `ADSENSE_SLOT_SIDE` | Ad unit ID for the sidebar, desktop only (vertical display ad) |
| `ADSENSE_SLOT_BOTTOM` | Ad unit ID below the results and on About/Privacy (responsive display ad) |
| `ADS_PREVIEW` | Set to `1` to show dashed boxes where ads will go, for layout testing |
| `CLOUDFLARE_API_TOKEN` | Free. Popularity bracket, top countries and categories in the traffic checker. Cloudflare dashboard → My Profile → API Tokens → Create Token → custom token with **Account → Radar → Read** |
| `CRUX_API_KEY` | Free. Mobile/desktop split and Core Web Vitals. A Google Cloud API key with the **Chrome UX Report API** enabled. If not set, `PSI_API_KEY` is used |
| `OPENPAGERANK_API_KEY` | Free. Authority score. Sign up at openpagerank.com |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Free. "My website" mode: Google sign-in for Search Console and Analytics (setup below) |
| `SESSION_SECRET` | Any random string of 32+ characters. Encrypts the Google sign-in cookie |
| `ALLOW_PRIVATE` | Set to `1` only for local testing, to audit localhost or LAN sites. Never set it on a public server. |

## Google AdSense

1. Deploy the site on your own domain with HTTPS, and set `SITE_URL` and `CONTACT_EMAIL`.
2. Sign up at adsense.google.com, add the site, and copy your publisher ID (`ca-pub-…`).
3. Set `ADSENSE_CLIENT` and restart. This adds the AdSense code to every page, which Google uses to verify the site, and serves `https://yoursite/ads.txt`.
4. Request review in AdSense. Approval usually takes a few days to a few weeks.
5. After approval, either turn on **Auto ads** in the AdSense dashboard (no more settings needed), or create three display ad units (horizontal, vertical, responsive) and put their IDs in `ADSENSE_SLOT_TOP`, `ADSENSE_SLOT_SIDE` and `ADSENSE_SLOT_BOTTOM`.
6. In AdSense → Privacy & messaging, create a European regulations (GDPR) message. Google requires it for visitors from the EEA, UK and Switzerland.

Rules the code already follows: each ad is labelled "Advertisement", ads are not placed next to buttons, ads are never refreshed when switching tabs, and empty slots collapse. Don't click your own ads, and don't ask visitors to click them; AdSense bans accounts for this.

## Website traffic checker (free)

`/website-traffic` has two modes. Both are free.

**Any website** shows popularity signals for any domain:
- popularity rank and its last 30 days, from the Tranco research list (no key needed)
- popularity bracket, the countries where the site is most popular and its categories, from Cloudflare Radar (`CLOUDFLARE_API_TOKEN`)
- mobile vs desktop share over time and Core Web Vitals, from Google's Chrome UX Report (`CRUX_API_KEY` or `PSI_API_KEY`)
- authority score from Open PageRank (`OPENPAGERANK_API_KEY`)

Visit counts, keywords and traffic sources for other people's websites are not available for free from any source.

**My website** shows real data after the visitor signs in with Google (read-only): visits over 12 months, users, engagement, bounce rate, device split, traffic sources, top countries, AI assistant traffic by platform and the pages AI visitors land on (from Google Analytics 4), plus clicks, impressions, average position and top keywords (from Search Console).

### Setting up Google sign-in

1. In Google Cloud Console, create a project (or use the one with your PageSpeed key).
2. **APIs & Services → Library**: enable **Google Search Console API**, **Google Analytics Data API** and **Google Analytics Admin API**. Enable **Chrome UX Report API** too for the free device data.
3. **OAuth consent screen**: choose External, fill in the app name, support email and your domain, and add the scopes `webmasters.readonly` and `analytics.readonly`.
4. **Credentials → Create credentials → OAuth client ID → Web application**. Add the authorised redirect URI `https://YOUR-DOMAIN/auth/google/callback` (for example `https://seo-all.vercel.app/auth/google/callback`).
5. Put the client ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, set `SESSION_SECRET` to a long random string and `SITE_URL` to your live address, then redeploy.

While the app is in Testing mode, only the Google accounts you add as test users (up to 100) can sign in. To open it to everyone, submit the app for Google verification from the consent screen page. The two scopes are classed as sensitive, so Google reviews the app first.

## Deploy

Any Node host works: Render, Railway, a DigitalOcean/Hostinger VPS with PM2 and Nginx, etc.

```bash
# VPS example
npm install --omit=dev
PSI_API_KEY=your_key pm2 start server.js --name rankdesk
```

Put it behind HTTPS. If it is for the team only, add a login or IP restriction in front of it (e.g. Nginx basic auth), because anyone with the link can use the fetch API.

## Security notes

- The fetch API refuses private, loopback and link-local addresses, re-checked on every redirect, to stop the server being used to reach internal networks.
- Each IP is limited to 40 API requests per minute (in memory; use Redis if you run several instances).
- Downloads are capped at 5 MB per page and 15 seconds per request.

## Files

```
server.js                 Pages, blog routes, ads.txt, sitemap, RSS and the API (/api/fetch, /api/robots, /api/pagespeed, /api/popularity, /api/own/*)
lib/popularity.js         Free popularity data (Tranco, Cloudflare Radar, Chrome UX Report, Open PageRank)
lib/google.js             Google sign-in, Search Console and Analytics 4 reports
lib/blog.js               Blog index, category pages, guide pages and RSS
views/*.html              One file per page. Each starts with <!--@meta {...}--> holding its title, description and FAQ
views/partials/           Shared head, header and footer
public/assets/app.css     The design system and all page styles
public/assets/app.js      Menu, scroll animations, copy buttons, ads and the shared "fill from a website" data
public/assets/*.js        One script per tool page, plus home.js and blog.js
content/blog/*.md         The guides, written in Markdown
content/posts.json        The compiled guides (generated, commit it)
public/blog/covers/       Cover images for the guides (generated, commit them)
scripts/                  build-content.js, make-covers.py and the fonts used for covers
```

## Adding or editing a guide

1. Create `content/blog/your-url-slug.md` with front matter at the top:

```
---
title: How to Write Title Tags That Get Clicked
description: One or two sentences, 160 characters or fewer. Shown in Google and on the card.
category: on-page        (technical, on-page, schema, local, keywords, social, strategy)
tool: meta               (optional: audit, meta, schema, social, keywords, robots)
date: 2026-10-20
seo_title: Optional shorter title tag, 60 characters max
---
```

2. Write the guide in Markdown below it. Use `##` for sections (they become the "On this page" links) and link to other guides as `/blog/slug`.
3. Run `npm run build` to compile the guides, and `npm run covers` to draw the cover image (needs Python with Pillow: `pip install pillow`).
4. Commit `content/posts.json` and the new files in `public/blog/covers/`, then push. Vercel also runs `npm run build` on every deploy.

The guide appears on the blog, in its category, in the sitemap and in the RSS feed automatically.

## Next steps

- Keyword search volume and rank tracking (DataForSEO or SerpApi)
- Multi-page crawl of a whole site
- Saved projects and PDF reports per client
- Login for team members
- Author pages and more guides (aim for one new guide a week)

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
| `ALLOW_PRIVATE` | Set to `1` only for local testing, to audit localhost or LAN sites. Never set it on a public server. |

## Google AdSense

1. Deploy the site on your own domain with HTTPS, and set `SITE_URL` and `CONTACT_EMAIL`.
2. Sign up at adsense.google.com, add the site, and copy your publisher ID (`ca-pub-…`).
3. Set `ADSENSE_CLIENT` and restart. This adds the AdSense code to every page, which Google uses to verify the site, and serves `https://yoursite/ads.txt`.
4. Request review in AdSense. Approval usually takes a few days to a few weeks.
5. After approval, either turn on **Auto ads** in the AdSense dashboard (no more settings needed), or create three display ad units (horizontal, vertical, responsive) and put their IDs in `ADSENSE_SLOT_TOP`, `ADSENSE_SLOT_SIDE` and `ADSENSE_SLOT_BOTTOM`.
6. In AdSense → Privacy & messaging, create a European regulations (GDPR) message. Google requires it for visitors from the EEA, UK and Switzerland.

Rules the code already follows: each ad is labelled "Advertisement", ads are not placed next to buttons, ads are never refreshed when switching tabs, and empty slots collapse. Don't click your own ads, and don't ask visitors to click them; AdSense bans accounts for this.

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
server.js          Pages, ads.txt, sitemap, and API: /api/fetch, /api/robots, /api/pagespeed
public/index.html  The toolkit (no build step)
public/about.html  About page
public/privacy.html Privacy policy (includes the disclosures AdSense requires)
```

## Next steps

- Keyword search volume and rank tracking (DataForSEO or SerpApi)
- Multi-page crawl of a whole site
- Saved projects and PDF reports per client
- Login for team members

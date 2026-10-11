---
title: "HTTPS and SEO: Moving a Small Site to SSL Without Losing Traffic"
description: HTTPS protects visitors and is a light ranking signal. How to get a free certificate, move from HTTP safely, fix mixed content and keep your rankings.
category: technical
tool: audit
date: 2026-10-11
order: 33
seo_title: HTTPS and SEO: Move a Small Site to SSL Safely
---
HTTPS is the secure version of HTTP, the protocol browsers use to load websites. It encrypts the connection between the visitor and your site, so passwords, form details and payment information can't be read or changed along the way. You can tell a site uses it by the `https://` in the address.

## Why it matters

- **Trust.** Browsers mark HTTP pages as "Not secure", especially on pages with forms. Many visitors leave as soon as they see it.
- **Rankings.** Google has used HTTPS as a ranking signal since 2014. It's a light signal, but there's no reason to give it away.
- **Features.** Many modern browser features only work on HTTPS, and some referral data is lost when visitors move from an HTTPS site to an HTTP one.
- **Data.** Without HTTPS, anyone on the same public Wi-Fi network could read or tamper with what's sent.

In short, every website needs HTTPS, even a simple brochure site.

## Getting a certificate

HTTPS needs an SSL/TLS certificate installed on your hosting. It's usually free:

- **Most hosts** offer free Let's Encrypt certificates with one click in the control panel, often turned on automatically.
- **Vercel, Netlify, Shopify, Wix and Squarespace** include HTTPS automatically.
- **Cloudflare** can add HTTPS in front of your site for free.

Paid certificates exist, but for most small business sites a free certificate provides the same encryption.

## Moving from HTTP to HTTPS safely

**1. Install the certificate** and check `https://yourdomain.com` loads correctly.

**2. Redirect all HTTP to HTTPS** with permanent **301 redirects**, page by page: `http://example.com/sarees` should go to `https://example.com/sarees`, not to the home page. Read [301 vs 302 redirects](/blog/redirects-301-vs-302) for why the type matters.

**3. Pick www or non-www** and redirect the other version too, so there's one address for every page. Avoid chains like `http://example.com` → `https://example.com` → `https://www.example.com`. Each old address should reach the final one in one step.

**4. Update internal links** in menus, content and templates to `https://`. WordPress users can change the site address in Settings, General, then use a search-and-replace plugin for old links in content.

**5. Fix mixed content.** If an HTTPS page loads images, scripts or styles over `http://`, browsers may block them or show a warning. Change those addresses to `https://`. Your browser's developer console lists mixed content errors.

**6. Update canonical tags, the sitemap and robots.txt** so they all use `https://` addresses. See our guides to [canonical tags](/blog/canonical-tags-guide) and [XML sitemaps](/blog/xml-sitemap-guide).

**7. Update Google Search Console.** Add the HTTPS version as a property (a Domain property covers all versions at once) and submit the new sitemap.

**8. Update external profiles,** such as your Google Business Profile, social profiles and directories, to the HTTPS address.

## Will rankings drop?

A careful move with page-by-page 301 redirects usually causes little or no lasting change. Search Console may show a short period of fluctuation while Google re-crawls. Rankings fall when redirects are missing, point to the home page, or go through long chains.

## HSTS

Once everything works on HTTPS, you can add an HSTS header, which tells browsers to always use HTTPS for your site. It closes a small security gap. Only add it when you're sure, because browsers remember it, and removing HTTPS later becomes difficult.

## Renewal

Free certificates usually last 90 days and renew automatically. If renewal fails, visitors see a full-page security warning. Most hosts email you before expiry. Don't ignore those emails.

## Check your site

The [Rankdesk SEO audit](/seo-audit) checks whether a page loads over HTTPS, follows the redirect chain from the address you entered, and flags temporary or multi-step redirects. Audit the `http://` version of your home page to confirm it lands on the secure version in one step.

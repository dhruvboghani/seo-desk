---
title: "Schema Markup for Beginners: JSON-LD Without the Jargon"
description: Schema markup labels the facts on your page so search engines understand them. Learn what it is, which types matter and how to add it.
category: schema
tool: schema
date: 2026-10-11
order: 4
---
Your page might say "Open Monday to Saturday, 10 to 7" and "★ 4.6 from 120 reviews". A person reads that instantly. A search engine sees words and has to guess which numbers are hours and which are a rating. Schema markup removes the guessing by labelling the facts in a format machines read directly.

## What schema markup is

Schema is a shared vocabulary, published at schema.org and supported by Google, Bing and others. It has types such as `LocalBusiness`, `Product`, `Article` and `FAQPage`, and properties such as `name`, `address`, `price` and `openingHours`.

You add it to a page as a small block of code that visitors never see. The format Google recommends is **JSON-LD**, which looks like this:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Shree Textiles",
  "telephone": "+91-98765-43210",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Ring Road Textile Market",
    "addressLocality": "Surat",
    "addressCountry": "IN"
  },
  "openingHours": "Mo-Sa 10:00-19:00"
}
</script>
```

It's just labelled facts: this is a local business, here is its name, phone, address and hours.

## Why it's worth adding

- **Rich results.** Some types can change how your result looks. Products can show price and stock, articles can show a larger image, and breadcrumbs replace the plain URL with a readable path.
- **Clearer understanding.** Schema confirms which business, product or person a page is about, which helps search engines connect your website, your Google Business Profile and mentions elsewhere.
- **Future use.** AI assistants and newer search features rely on structured information. Clean facts are easier for any system to use.

Schema isn't a direct ranking boost, and adding it doesn't guarantee a rich result. Google decides when to show them. But it removes ambiguity, and that rarely hurts.

## The types most sites need

| Type | Use it on | What it can do |
|---|---|---|
| Organization | Home or about page | Confirms your name, logo and social profiles |
| LocalBusiness | Home or contact page of a physical business | Address, hours, phone, location on the map |
| Product | Product pages | Price, availability and reviews in results |
| Article / BlogPosting | Blog posts and news | Headline, image, author and date |
| BreadcrumbList | Most inner pages | Shows the page's position in your site |
| FAQPage | Genuine FAQ pages | Limited rich results today (see our [FAQ schema guide](/blog/faq-schema-guide)) |

## The rules that keep you safe

1. **Mark up only what's visible.** If the schema says 4.8 stars, the page must show that rating. Hidden or invented data breaks Google's guidelines and can lead to a manual penalty.
2. **Be accurate.** Prices, hours and stock status should match the page and stay up to date.
3. **Use the most specific type.** `Dentist` or `ClothingStore` says more than `LocalBusiness`, and both inherit all the same properties.
4. **One clear main entity per page.** A product page is about one product. Don't mark up every product on a category page as if each were the main one.

## How to add it

- **WordPress:** SEO plugins like Yoast and Rank Math add Organization, Article and Breadcrumb schema automatically. WooCommerce adds Product schema.
- **Shopify:** most themes include Product schema. Check it with a validator before adding more, so you don't create duplicates.
- **Hand-coded sites:** paste the JSON-LD block anywhere in the page, usually just before the closing `</head>` or `</body>` tag.

## Test before and after

Run every page through Google's Rich Results Test to see which rich results it qualifies for, and the Schema Markup Validator to catch errors in any type. After publishing, Search Console reports schema problems across your whole site under its Enhancements section.

## Build yours

The [Rankdesk schema generator](/schema-generator) builds valid JSON-LD for local businesses, organizations, products, FAQs and articles. Enter your website and it fills the fields from your existing pages, so you only check and copy. For businesses with a shop or office, start with our [LocalBusiness schema guide](/blog/local-business-schema).

---
title: "LocalBusiness Schema: The Fields That Matter for Shops and Service Businesses"
description: LocalBusiness schema confirms your name, address, phone and hours to search engines. The fields worth filling, a full example and mistakes to avoid.
category: schema
tool: schema
date: 2026-10-11
order: 16
seo_title: LocalBusiness Schema: The Fields That Matter
---
If your business has a shop, office, clinic or service area, LocalBusiness schema is the structured data to add first. It states your key business facts in a format search engines read directly, and helps them connect your website with your Google Business Profile and listings elsewhere.

If schema is new to you, start with [schema markup for beginners](/blog/schema-markup-for-beginners).

## A complete example

```json
{
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  "name": "Shree Textiles",
  "url": "https://shreetextiles.in",
  "telephone": "+91-98765-43210",
  "image": "https://shreetextiles.in/images/shopfront.jpg",
  "priceRange": "₹₹",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Plot 12, Ring Road Textile Market",
    "addressLocality": "Surat",
    "addressRegion": "Gujarat",
    "postalCode": "395002",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 21.1950,
    "longitude": 72.8406
  },
  "openingHours": "Mo-Sa 10:00-19:00",
  "sameAs": [
    "https://www.instagram.com/shreetextiles",
    "https://www.facebook.com/shreetextiles"
  ]
}
```

Wrap it in a `<script type="application/ld+json">` tag on your home page or contact page.

## The fields, in order of importance

**Required in practice**

- **@type:** use the most specific type that fits, such as `Dentist`, `Restaurant`, `ClothingStore`, `Plumber`, `HomeAndConstructionBusiness`, `AccountingService` or `Bakery`. All of them are kinds of LocalBusiness, so they accept the same fields.
- **name:** exactly as on your signboard and Google Business Profile.
- **address:** street, city, state, PIN code and country code `IN`. Match the format you use everywhere else.

**Strongly recommended**

- **telephone:** with the country code, +91.
- **url:** your website's main address.
- **openingHours** or the more detailed `openingHoursSpecification` for different hours on different days.
- **geo:** latitude and longitude. Right-click your entrance in Google Maps to copy them.
- **image:** a real photo of the business, such as the shopfront.

**Useful extras**

- **priceRange:** a rough guide like `₹₹` or `₹500–₹5,000`.
- **sameAs:** links to your official social profiles and listings. This helps confirm all of them are the same business.
- **areaServed:** cities or regions, for businesses that travel to customers.
- **logo**, **email** and **aggregateRating** (only if real reviews appear on the page itself).

## Several branches

Each branch should have its own page on your website, such as `/branches/vadodara`, with its own LocalBusiness schema, address, phone and hours. Don't put several addresses in one block on the home page.

## Service-area businesses

If customers don't visit you, for example a pest control or painting service, you can leave out the street address and use `areaServed` instead:

```json
"areaServed": ["Ahmedabad", "Gandhinagar"]
```

Keep this consistent with your Google Business Profile, where you can also hide the address and show a service area.

## Mistakes to avoid

1. **Details that don't match the page or your Google profile.** If the footer shows one phone number and the schema another, you weaken trust in both.
2. **Ratings that aren't on the page.** Google's rules say review markup must reflect reviews visible to visitors. Don't copy your Google rating into schema without showing reviews on the page.
3. **Keywords in the name.** `"name": "Shree Textiles Best Saree Shop Surat"` breaks the same rules as keyword-stuffed Business Profile names.
4. **Duplicate blocks.** Many themes and plugins add their own schema. Check for duplicates before adding more.
5. **Wrong page.** The business block belongs on pages about the business, not on every blog post.

## Build and test it

The [Rankdesk schema generator](/schema-generator) has a local business type with every field above. Enter your website and it pulls your name, phone, address, social links and existing schema automatically. Then test the page with Google's Rich Results Test and fix any warnings.

Local schema works best together with a complete [Google Business Profile](/blog/google-business-profile-guide) and [consistent details across the web](/blog/nap-consistency).

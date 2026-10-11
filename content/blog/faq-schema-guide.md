---
title: "FAQ Schema: When It Still Helps and When to Skip It"
description: Google now shows FAQ rich results only for well-known government and health sites. What that means for your site and when FAQ markup still helps.
category: schema
tool: schema
date: 2026-10-11
order: 23
---
For a few years, FAQ schema was one of the easiest ways to make a search result bigger. Add questions and answers in structured data, and Google might show them as expandable drop-downs under your link. Many websites added FAQ markup to every page for this reason.

That changed in 2023, and plenty of sites still haven't caught up.

## What changed

In August 2023, Google announced it would show FAQ rich results only for well-known, authoritative government and health websites. For other sites, FAQ drop-downs no longer appear in normal search results, even with valid markup. At the same time, Google stopped showing HowTo rich results.

So if you run a shop, agency, blog or service business, adding FAQ schema won't bring back the expanded result.

## Does that make FAQ schema useless?

Not entirely, but its value is now much smaller:

- **It doesn't hurt.** Google said there's no need to remove existing FAQ markup, and valid markup causes no problems.
- **It labels content clearly.** Structured question-and-answer pairs are easy for any system to understand, including other search engines and AI tools.
- **It's not a ranking boost.** It never was.

The bigger value was always in the **visible FAQ section itself**, and that hasn't changed.

## Why a visible FAQ section still helps

A good FAQ section on a service or product page:

- answers the questions that stop people buying, such as price, time, warranty and delivery
- matches the long-tail questions people search, such as "how long does waterproofing last"
- can be used by Google for "People also ask" answers or featured snippets, which don't need FAQ schema
- reduces calls and messages asking the same things

## When to add FAQ schema now

Add it if:

- the page has a real FAQ section visible to visitors
- the questions and answers are written by you, not by users (user questions with several answers suit `QAPage` instead)
- you can add it easily, for example through your SEO plugin or a generator

Skip it, or don't prioritise it, if:

- you'd be adding questions only for the markup, without showing them on the page
- you'd need to hire a developer just for this
- you have more valuable markup to add first, such as [LocalBusiness](/blog/local-business-schema) or [Product](/blog/product-schema-guide)

## The rules still apply

If you use FAQ schema, follow Google's guidelines:

1. Every question and answer in the markup must be visible on the page.
2. Don't use it for advertising, such as "Why are we the best?" with a sales pitch.
3. Each question should appear once on the site, rather than the same FAQ copied onto every page.
4. Answers can include links and simple formatting, but keep them accurate.

## Example

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How long does terrace waterproofing last?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "A properly applied membrane system usually lasts 8 to 10 years. We give a 5-year written warranty."
    }
  }]
}
```

## Writing good FAQ answers

- Start with the direct answer, then explain.
- Keep each answer to two to four sentences where possible.
- Use the words customers use, from phone calls, WhatsApp and reviews.
- Update answers when prices, policies or processes change.

The [Rankdesk schema generator](/schema-generator) can build FAQ markup from questions already on your page. For an overview of which schema types matter most now, read [schema markup for beginners](/blog/schema-markup-for-beginners).

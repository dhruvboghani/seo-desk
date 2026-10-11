---
title: "H1, H2, H3: How to Structure Headings for SEO and Readers"
description: Headings give a page its outline for readers, screen readers and search engines. Use one H1, nest H2s and H3s properly and fix theme mistakes.
category: on-page
tool: audit
date: 2026-10-11
order: 17
---
Headings are the outline of a page. Readers skim them to decide whether to stay. Screen readers use them to jump between sections. Search engines use them to understand what each part of the page covers. Good headings help all three.

## The levels

HTML has six heading levels, `<h1>` to `<h6>`. Most pages only need three:

- **H1:** the title of the page. What the whole page is about.
- **H2:** the main sections.
- **H3:** sub-sections inside an H2.

Think of a book: H1 is the book title, H2s are chapters, H3s are sections within chapters.

```
H1 Bathroom Waterproofing in Ahmedabad
  H2 Signs your bathroom needs waterproofing
  H2 Our waterproofing methods
    H3 Chemical coating
    H3 Membrane waterproofing
  H2 Prices
  H2 Frequently asked questions
```

## One H1 per page

Use one H1 that clearly states the page's topic, usually close to your [title tag](/blog/title-tag-guide). Google has said it can handle pages with several H1s, but one clear H1 makes the structure obvious to everyone and avoids confusion about what the page is mainly about.

Common problems:

- **No H1 at all.** Some themes style the page title with a `<div>` or `<p>`.
- **The logo as the H1** on every page, so every page has the same main heading.
- **Several H1s** because a page builder uses H1 for every big piece of text.

## Don't skip levels

Go down one level at a time: H1, then H2, then H3. Jumping from H1 straight to H4 because you like the H4 font size breaks the outline. Choose the heading level for the structure, then style it with CSS to look however you want.

## Write useful headings

- **Make them descriptive.** "Prices" or "How much does waterproofing cost?" tells the reader what's below. "Section 2" or "More info" doesn't.
- **Use your keywords naturally.** H2s are a good place for related search phrases, such as "terrace waterproofing cost". Don't force the same phrase into every heading.
- **Questions work well.** Headings that match questions people ask can help your page appear for those searches.
- **Keep them short.** A heading is a signpost, not a paragraph.

## Headings aren't for styling

Don't use a heading tag just to make text big or bold, like a phone number, a slogan or a "Call now!" banner. Use normal text and style it. Headings should only mark sections.

The reverse is also a problem: section titles that are only bold paragraphs. They look like headings but don't work as headings for screen readers or search engines.

## Checking headings in your theme

Themes often use heading tags in places you wouldn't expect: the site name in the header, widget titles in the sidebar ("Recent posts"), and footer column titles. These aren't always wrong, but they add noise to the outline.

The [Rankdesk SEO audit](/seo-audit) shows a page's full heading outline, flags missing or multiple H1s and points to any skipped levels. Run it on a few page types (home, product, blog post) because each template can have different problems.

## Headings and featured snippets

Clear structure helps Google pull answers from your page. A heading phrased as a question, followed directly by a short, clear answer, and then more detail, is the format most likely to be used for a featured snippet or a "People also ask" answer.

## Quick checklist

- One H1 that describes the page
- H2s for main sections, H3s inside them, no skipped levels
- Descriptive headings that use natural keywords
- No headings used only for styling
- Section titles marked up as real headings

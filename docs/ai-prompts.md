# Approved AI Prompts

Used for admin-assisted content generation inside RR Admin (blog metadata, alt
text, outlines, SEO suggestions). All output is a **draft** an editor must review
before publishing.

## Blog post metadata

> Given this blog post title and body [insert], write: (1) a meta description
> under 160 characters, (2) 3–5 relevant tags, (3) a one-sentence excerpt. Do not
> invent facts not present in the body. Do not reference competitors by name.

## Image alt text

> Describe this image for accessibility purposes in one factual sentence under 20
> words: what is shown, not a marketing tagline. No brand claims, no invented
> location/client names beyond what's provided.

## Content outline

> Given this topic [insert] and the Mirabilis brand voice guide, produce a
> 4–6 section outline for a blog post. Do not fabricate statistics, client
> names, or testimonials.

## SEO suggestions

> Given this page's title and body [insert], suggest an SEO title (≤60 chars) and
> meta description (≤160 chars) consistent with the existing copy. Do not invent
> claims not present in the source content.

## Prohibited prompts

- Any prompt referencing named competitor studios for copying/scraping their
  copy, layout, or imagery.
- Any prompt that passes lead PII (name, email, phone, message contents) to an
  external model for purposes other than the admin's own drafting session.
- Any prompt requesting fabricated testimonials, fabricated client names, or
  fabricated performance claims ("we've shot 500+ resorts" etc.) not backed by
  real data entered by an admin.
- Any prompt asking the assistant to impersonate a real, named public figure.

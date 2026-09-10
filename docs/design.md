# Design System — Aerglow

## Purpose

An original, restrained, editorial visual language built around Mirabilis's
day → night signature: calm and open in daylight, warm and intimate after dark.

## Visual principles

- Broad breathing room over density on the public site.
- Asymmetric but balanced composition — not a rigid centered template.
- Light does the work: minimal filters/overlays, real captured light as the hero.
- Motion is a whisper, not a performance.

## Grid

- Desktop: 12-column, max content width ~82rem (`shell` utility), 1.5rem inline
  padding.
- Mobile: single-column stacked flow from 320px.

## Typography

- Display: Cormorant Garamond (serif, editorial) — headlines, quotes.
- Body/UI: Manrope (sans, highly legible) — body copy, labels, nav.
- Do not substitute a known studio's exact pairing; both are open-source and
  freely swappable if licensing needs change.

## Colour tokens (existing, do not restate a competitor palette)

- `--copper` — muted highlight accent (CTAs, active states, eyebrows).
- Twilight-blue and charcoal/ivory base tokens per `styles.css` OKLCH values.
- Maintain WCAG AA contrast for body text on all backgrounds.

## Motion

- Slow fades/transforms (`reveal`, `mask-reveal` keyframes already defined).
- No parallax gimmicks; respect `prefers-reduced-motion` — disable non-essential
  animation when set.

## Responsive breakpoints

Tailwind defaults (`sm`, `md`, `lg`, `xl`) — already in use across existing
components; no custom breakpoints needed.

## Component states

- Links/buttons: rest → hover (copper border/text or opacity shift) → focus
  (visible outline, never suppressed) → active.
- Cards (service/work): rest → hover (`rule-copper` line expands, image
  scale-up) — already implemented, reuse this pattern for new card types.

## Accessibility

- Skip-to-content link (already in `__root.tsx`).
- Semantic landmarks: `header`, `main`, `footer`, `nav[aria-label]`.
- All meaningful images require alt text (CMS field, required, not optional).
- Icon-only buttons require `aria-label` (mobile menu toggle already does this).

## Public page wireframe notes

- **Home**: hero (full-bleed image/video + veil) → services grid → day/night
  signature split → featured work → process → pricing teaser → FAQ → contact CTA.
- **Detail pages** (service/work): breadcrumb-style back link → title block →
  body content → related items grid. Established in `services.$slug.tsx` /
  `work.$slug.tsx` — reuse this shape for future detail types (industries).

## Admin design guidelines (for Phase 6/7 build)

- Dense but calm: neutral panels, generous row height in tables, copper as the
  _only_ active-state accent (not used decoratively elsewhere in admin).
- Status badges use consistent colour-to-meaning mapping across leads/content
  (e.g. draft = neutral, published = copper, error/spam = a desaturated red — not
  the copper accent, so errors don't compete visually with active states).

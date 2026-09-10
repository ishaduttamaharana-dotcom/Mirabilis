# PRD — Mirabilis Visual Production CMS

## 1. Business problem

Mirabilis (Nagpur) currently has a static-content public site with no way for a
non-technical admin to update copy, images, pricing, or portfolio work without a
code change. There is no lead capture beyond a `mailto:` handoff, no analytics on
enquiries, and no structured place to manage blog/SEO content.

## 2. Vision

A content-managed public site (premium, cinematic, "Aerglow" visual identity) backed
by an internal admin tool ("RR Admin") that lets an authenticated admin manage every
customer-facing field — text, image, video, CTA, SEO, list/collection item, and site
setting — without touching code.

## 3. Personas

- **Studio admin (super_admin)** — non-technical, manages all content, leads, settings.
- **Editor** — manages content collections, cannot touch users/settings/secrets.
- **Viewer** — read-only access to dashboard/leads for reporting.
- **Public visitor** — browses services/work/pricing, submits enquiries.

## 4. Success metrics

- Time to publish a content change: < 5 min, no deploy required.
- Lead capture rate: 100% of contact-form submissions persisted (vs. current 0%,
  since the form only opens `mailto:`).
- Admin can complete a full CRUD cycle (create → publish → edit → unpublish) on any
  collection without developer help.
- Core Web Vitals: LCP < 2.5s, CLS < 0.1 on public pages (image-heavy hero, so this is
  the primary perf risk).

## 5. Goals

### Public site

- Editorial, cinematic, minimal, fast, accessible (WCAG-minded), responsive from 320px.
- Every home-page section, service, project, price plan, FAQ, testimonial, team member,
  industry page, and blog post is CMS-driven.
- Contact form persists a lead server-side and notifies admin (replacing the current
  client-only `mailto:` flow).
- SEO: per-page metadata, OG, canonical, sitemap.xml, robots.txt, JSON-LD where valid.

### CMS goals

- Full CRUD across all defined collections with draft/publish states, slugs, ordering,
  media picker, RBAC, audit log.
- Media library with reference counting and orphan cleanup.
- Settings page for site/social/SMTP/Blogger/SEO config, secrets never returned to
  the browser.
- Blogger sync (optional, off by default) for blog import.

## 6. In scope

- Public routes: `/`, `/about` (`/studio`), `/services`, `/services/:slug`, `/work`,
  `/work/:slug`, `/industries/:slug`, `/pricing`, `/blog`, `/blog/:slug`, `/contact`,
  `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`.
- Admin routes per master prompt (dashboard, leads, all collections, media,
  activity-log, settings, auth pages).
- FastAPI + MongoDB backend, JWT + rotating refresh-token auth, RBAC.
- Local filesystem media storage in dev, S3-adapter-ready in prod.

## 7. Out of scope (v1)

- Multi-language / i18n.
- Payments / invoicing.
- Client portal / project delivery downloads.
- Native mobile app.
- Real-time collaborative editing in admin.

## 8. Non-functional requirements

- Security: Argon2id hashing, RBAC enforced server-side, rate limiting on
  login/reset/upload/contact, strict upload validation, sanitised rich text.
- Reliability: daily DB backup plan, documented restore process.
- Accessibility: keyboard nav, skip link, semantic landmarks, alt text required on
  all image fields, visible focus states.
- Performance: responsive images, lazy loading below the fold, no autoplay audio,
  reduced-motion fallback for all animation.

## 9. Acceptance criteria (major features)

| Feature      | Acceptance criteria                                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content CRUD | Admin can create/edit/duplicate/delete/publish any collection item; changes reflect on public site within one request (no cache staleness > 60s).                                            |
| Leads        | Every contact submission creates a `leads` document with status `new`, triggers a notification, and is visible in `/admin/leads` within 5s.                                                  |
| Auth         | Login issues short-lived access JWT + rotating refresh cookie; invalid/expired refresh forces re-login; RBAC blocks disallowed actions with 403, not just hidden UI.                         |
| Media        | Uploading an image validates type/size/signature, generates a server-side filename, and is immediately usable in a media picker; deleting a still-referenced file is blocked with a warning. |
| SEO          | Every public content type exposes title/meta description/canonical/OG fields; sitemap.xml reflects only published routes.                                                                    |

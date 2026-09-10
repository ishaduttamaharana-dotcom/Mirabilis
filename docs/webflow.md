# Web Flow — Routes, User Flows, CTAs

## Public routes (current + planned)

| Route                         | Status                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `/`                           | ✅ live                                                                        |
| `/studio` (about)             | ✅ live                                                                        |
| `/services`                   | ✅ live                                                                        |
| `/services/:slug`             | ✅ live                                                                        |
| `/work`                       | ✅ live                                                                        |
| `/work/:slug`                 | ✅ live                                                                        |
| `/pricing`                    | ✅ live                                                                        |
| `/contact`                    | ✅ live (mailto handoff, not yet backend-persisted)                            |
| `/privacy`, `/terms`          | ✅ live (draft, noindex)                                                       |
| `/industries/:slug`           | ⏳ blocked on CMS (Phase 4/7)                                                  |
| `/blog`, `/blog/:slug`        | ⏳ blocked on CMS (Phase 4/7)                                                  |
| `/sitemap.xml`, `/robots.txt` | ⏳ blocked on backend (Phase 8); static `robots.txt` exists in `public/` today |

## CTA behaviors

- Primary CTA ("Start a project" / "Enquire") always routes to `/contact`.
- Secondary CTA ("View work") routes to `/work`.
- Service/work cards are fully clickable to their detail page (not just a text
  link) — implemented via wrapping `<Link>`.
- Phone CTA (`tel:+91...`) used once, in the home contact-CTA section.

## Lead-submit states (current)

1. User fills contact form → submit.
2. Client composes a `mailto:` link and redirects the browser to the user's mail
   client, pre-filled.
3. Toast confirms "Opening your email app...".
   **Planned (Phase 5):** replace step 2 with `POST /api/v1/leads`, keep a toast for
   success/failure, and add inline field-level error display from the API's
   validation envelope.

## Project/category navigation

- `/work` lists all projects → click-through to `/work/:slug`.
- `/work/:slug` shows "More work" (other projects) and "Services used" (links
  into `/services/:slug`) — cross-linking implemented both directions.
- `/services` lists all services → click-through to `/services/:slug`, which
  cross-links to "Other services".

## Admin navigation (planned, Phase 6/7)

- Sidebar groups: Dashboard · Leads · Content (Services, Portfolio, Products,
  Industries, Categories, Team, Testimonials, Clients/Partners, Pricing,
  Hero Slides, Gallery, FAQs, Statistics, Blog) · Media · Activity Log · Settings.
- Breadcrumb reflects sidebar depth (e.g. Content / Services / Edit).
- Every collection list view: table with search, filters (state/category), sort,
  pagination, row actions (edit, duplicate, delete-with-confirm).

# Project Memory

## Brand facts

- Name: MIRABILIS. Descriptor: "Design · Build · Film". Services: "Photography ·
  Videography · Cinematography".
- Hero quote: "We don't just capture spaces. We tell their story."
- Location: Nagpur, Maharashtra. Instagram: @mirabilis_byt.
- Email: mirabilis.byt2026@gmail.com. Phones: 8600266620 / 9975531681.
- Signature concept: golden-hour + night aesthetics in one project ("Day + Night").
- Visual theme name: **Aerglow** — charcoal base, ivory text, muted copper
  highlight, twilight-blue accent.

## Stack (actual, not the original spec)

- Public site: TanStack Start (React 19, Vite, file-based routing), Tailwind v4,
  shadcn-derived primitives, React Query.
- Original master prompt specified a Vite SPA + FastAPI + MongoDB pnpm monorepo —
  the shipped scaffold is TanStack Start instead. Backend work should still
  target FastAPI + MongoDB per `schema.md`/`techspec.md`; only the frontend
  framework choice differs from the original brief.

## Canonical collections

See `schema.md`. Source of truth for field lists.

## Important decisions

- Contact form currently composes a `mailto:` link client-side (no backend yet).
  This must be replaced with a real `POST /api/v1/leads` call in Phase 5 — do not
  leave both mechanisms live simultaneously in production.
- `/about` is implemented as `/studio` in the current app; keep that URL unless
  explicitly asked to rename (would break any external links/SEO already built).
- Legal pages (`/privacy`, `/terms`) are marked `noindex` and explicitly labeled
  as unreviewed drafts pending legal review.

## Known constraints

- Sandbox build environment has no MongoDB/Docker network access — backend work
  here is code/tests only, not a live-running service, until deployed elsewhere.

## Change log format

`YYYY-MM-DD — phase — one-line summary` appended at the bottom of this section as
work lands.

### Log

- 2026-08-25 — Phase 0 — Public site pages completed (services/work detail,
  pricing, privacy, terms), nav fixed.
- 2026-08-25 — Phase 1 — Full docs set written.
- 2026-08-25 — Phase 2/3 (partial) — FastAPI skeleton, Mongo indexes, Argon2id +
  JWT + rotating-refresh auth with replay detection, RBAC dependency, seed
  script, orphan-media cleanup script, Docker Compose, 4 passing pytest tests,
  ruff-clean. Not yet done: password reset endpoints, rate limiting, live-DB
  integration test (no Mongo in this sandbox), all collection CRUD (Phase 4).

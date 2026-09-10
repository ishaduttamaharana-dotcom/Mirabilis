# Phased Roadmap

## Phase 0 — Foundation (done, this session)

- Public site pages complete on existing TanStack Start app: home, services (list +
  detail), work (list + detail), studio/about, pricing, contact, privacy, terms.
- **DoD:** `npm run build` and `tsc --noEmit` pass clean. ✅
- **Risk:** low.

## Phase 1 — Documentation (this session)

- Scope: all 15 docs in `docs/` (this file included).
- **DoD:** every doc has real decisions/tables, not placeholders.
- **Dependencies:** none.
- **Complexity:** low. **Risk:** low.

## Phase 2 — Backend foundation

- Scope: FastAPI app skeleton (`backend/app/{api,core,models,repositories,services,
tasks,utils}`), MongoDB connection via Motor, Pydantic v2 settings, health check,
  Docker Compose (api + mongo), `.env.example`.
- **DoD:** `docker compose up` boots API + Mongo locally; `/docs` reachable;
  `/api/v1/health` returns 200.
- **Dependencies:** Phase 1 (schema.md, techspec.md).
- **Complexity:** medium. **Risk:** medium (no network access to pull Docker images
  or MongoDB Atlas in this sandbox — see Known Limitations in README).

## Phase 3 — Auth & RBAC

- Scope: `users`, `refresh_tokens`, `password_reset_tokens` collections; Argon2id
  hashing; JWT access + rotating refresh cookie; RBAC dependency; seeded
  `super_admin`; forced password change on first login.
- **DoD:** login/refresh/logout/reset flows pass Pytest; RBAC denies a `viewer`
  write with 403.
- **Dependencies:** Phase 2.
- **Complexity:** high. **Risk:** high (security-critical path).

## Phase 4 — Collections CRUD (backend)

- Scope: repository + service + route modules for every collection in `schema.md`
  (services, projects, products, industries, clients, partners, categories, team,
  testimonials, pricing_plans, hero_slides, gallery_items, faqs, statistics,
  blog_posts). Draft/publish, slug collision handling, sort order, audit logging.
- **DoD:** each collection has full CRUD + pagination/filter/sort tested.
- **Dependencies:** Phase 3.
- **Complexity:** high (breadth). **Risk:** medium.

## Phase 5 — Media & leads

- Scope: storage adapter (local fs dev / S3 prod), upload validation (type, size,
  magic bytes), reference-counting service, `cleanup_orphaned_files.py`; leads +
  lead_notes CRUD, contact-form endpoint with rate limiting and attachment support.
- **DoD:** upload → attach → delete-blocked-while-referenced → delete-after-
  dereference cycle verified; contact form POST creates a lead + notification.
- **Dependencies:** Phase 4.
- **Complexity:** medium-high. **Risk:** medium (file-signature validation, storage
  abstraction correctness).

## Phase 6 — RR Admin shell + auth pages

- Scope: admin shell (sidebar, search, notification bell, breadcrumb, toasts,
  confirm dialogs), `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`,
  `RequireAdmin` route guard.
- **DoD:** unauthenticated visit to any `/admin/*` route redirects to login; login
  redirects back to originally requested route.
- **Dependencies:** Phase 3.
- **Complexity:** medium. **Risk:** low.

## Phase 7 — RR Admin dashboard + collection screens

- Scope: dashboard KPIs/charts, leads table + kanban, and CRUD screens for every
  collection from Phase 4, media library UI, settings page, activity log.
- **DoD:** every admin route in the master prompt route list is implemented and
  wired to the real API (no mock data).
- **Dependencies:** Phase 4, 5, 6.
- **Complexity:** high (breadth). **Risk:** medium.

## Phase 8 — SEO, sitemap/robots, Blogger sync

- Scope: dynamic `/sitemap.xml`, `/robots.txt`, per-content SEO fields wired to
  public `<head>`, JSON-LD where valid, Blogger import service (off by default,
  dedupe by external ID, sync-run log).
- **DoD:** sitemap reflects only published routes; sync run is idempotent on
  re-run.
- **Dependencies:** Phase 4.
- **Complexity:** medium. **Risk:** low-medium (third-party API surface).

## Phase 9 — Test, harden, deploy docs

- Scope: Pytest coverage on critical paths, Vitest/RTL on key components, Playwright
  smoke tests, ESLint/Prettier/Ruff/mypy clean, production Dockerfiles, README with
  full setup/seed/test instructions.
- **DoD:** `npm run build`, `pytest`, `ruff check`, all green; README complete.
- **Dependencies:** all prior phases.
- **Complexity:** medium. **Risk:** low.

# Tracker

Legend: [x] done · [~] in progress · [ ] not started

## Phase 0 — Public site

- [x] Frontend: home, services list/detail, work list/detail, studio, pricing,
      contact, privacy, terms
- [x] Frontend: nav wired to real routes (Studio/Pricing were orphaned before)
- [x] Test: `npm run build` + `tsc --noEmit` clean
- [ ] Frontend: `/industries/:slug` (backend `/public/industries` API now
      exists and works — the frontend route just hasn't been wired to fetch
      from it yet, still hardcoded/absent)
- [ ] Frontend: `/blog`, `/blog/:slug` (same — `/public/blog_posts` API exists,
      frontend route not wired)
- [ ] Frontend: public contact form still posts to `mailto:` instead of the
      real `/public/contact` endpoint (see Phase 5)
- [ ] Frontend: dynamic `/sitemap.xml`, `/robots.txt` (blocked on Phase 8)

## Phase 1 — Documentation

- [x] PRD.md
- [x] phases.md
- [x] tracker.md (this file)
- [x] architecture.md
- [x] techspec.md
- [x] schema.md
- [x] security.md
- [x] privacy.md
- [x] ai-prompts.md
- [x] rules.md
- [x] claude.md
- [x] memory.md
- [x] design.md
- [x] webflow.md
- [x] brand-voice.md

## Phase 2 — Backend foundation

- [x] Backend: `app/core/config.py` (Pydantic settings)
- [x] Backend: Motor client + lifespan wiring + index definitions
- [x] Backend: `/api/v1/health`
- [x] Data: Docker Compose (api + mongo)
- [x] Docs: `.env.example`
- [x] Test: `ruff check` clean, `python -c "import app.main"` clean

## Phase 3 — Auth & RBAC

- [x] Data: `users`, `refresh_tokens`, `password_reset_tokens` repositories + indexes
- [x] Backend: Argon2id hashing, JWT issue/verify, refresh rotation with replay
      detection (reused token revokes whole family)
- [x] Backend: RBAC dependency (`super_admin` / `editor` / `viewer`)
- [x] Backend: seed script (env-driven super_admin, forced password change)
- [x] Backend: password reset request/confirm endpoints (no email-enumeration
      leakage — identical response whether or not the email matched)
- [x] Backend: login/forgot-password/reset-password rate limiting
      (in-process sliding window — needs a Redis-backed swap before running
      more than one API instance; documented in `app/core/rate_limit.py`)
- [x] Test: `test_security.py`, `test_rbac.py` pass (4/4)
- [ ] Test: integration test against a real Mongo instance (unit tests above
      don't require a live DB; login/refresh/reset routes are untested
      end-to-end — no Mongo reachable in this sandbox)

## Phase 4 — Collections CRUD

- [x] Backend: services, projects, products, industries
- [x] Backend: clients, partners, categories
- [x] Backend: team, testimonials, pricing_plans
- [x] Backend: hero_slides, gallery_items, faqs, statistics
- [x] Backend: blog_posts
- [x] Backend: generic repo/service/router factory driven by an explicit
      per-collection field allowlist (`app/core/content_registry.py`) —
      admin (RBAC-gated) + public (published/visible-only) routes for all 14
      collections, slug generation + collision handling, audit logging on
      every write
- [x] Test: `test_content_service.py` — validation, defaults, slug collisions,
      type/enum checks, 404s (unit tests against an in-memory fake repo; no
      live Mongo in this sandbox)
- [ ] Test: integration test against a real Mongo instance

## Phase 5 — Media & leads

- [x] Backend: storage adapter (`LocalStorageAdapter` working; `S3StorageAdapter`
      is a documented interface stub — no S3-compatible endpoint reachable
      from this sandbox to implement/test against)
- [x] Backend: upload validation (extension allowlist → MIME cross-check →
      magic-byte signature → size limits; EXIF/metadata stripped via Pillow)
- [x] Backend: media reference counting, wired into all Phase 4 collections'
      media fields (create/update/delete auto reference/dereference);
      `cleanup_orphaned_files.py` already present from initial scaffold
- [x] Backend: leads + lead_notes CRUD (list/filter/detail/status/assign/notes/
      KPIs), public `/public/contact` endpoint with attachments + rate limiting + admin notification on new lead
- [ ] Frontend: wire public contact form to the real endpoint (replace `mailto:`)
- [ ] Test: integration test against a real Mongo + real file writes end-to-end

## Phase 6 — RR Admin shell

- [x] Frontend: admin shell (collapsible sidebar, breadcrumb-style path,
      notification bell placeholder, user menu, toasts via existing sonner
      setup) — `src/components/admin/admin-shell.tsx`
- [x] Frontend: login/forgot-password/reset-password pages
- [x] Frontend: `RequireAdmin` guard — pathless `admin._authenticated`
      layout route wraps every protected page; bootstraps the session via
      `/auth/refresh` on mount so a page reload doesn't bounce a logged-in
      user back to login
- [ ] Frontend: dedicated "you must change your password" screen on first
      login (`mustChangePassword` is surfaced via a toast only right now,
      not enforced as a blocking step)
- [ ] Backend: `/auth/me` endpoint so the shell can show the logged-in
      user's identity after a reload without waiting on another API call
      that happens to return it

## Phase 7 — RR Admin screens

- [x] Frontend: dashboard (new/won/media/total KPI cards, leads-by-status
      bar chart via recharts, latest-leads list)
- [x] Frontend: leads table + status filter + detail drawer with notes
      (kanban board view not built — table + status dropdown covers the
      same status-management need for now)
- [x] Frontend: CRUD screens for all 15 Phase 4 collections — one generic
      `AdminCollectionPage` component (table + create/edit sheet form,
      duplicate, delete-with-confirm) driven by `src/lib/admin/collections.ts`,
      instantiated per collection via 15 thin route files, mirroring the
      backend's registry-driven pattern
- [x] Frontend: media library UI (grid, category filter, upload, reference-
      aware delete)
- [x] Frontend: activity log (read-only, paginated)
- [ ] Frontend: settings page — placeholder only; blocked on the
      `site_settings` backend not existing yet (singleton doc + encrypted
      SMTP credentials didn't fit the generic collection framework, needs
      its own repo/service — see Phase 8)
- [ ] Test: Vitest/RTL coverage for the new admin components (Phase 9)
- [ ] Verification note: `npx tsc --noEmit`, `npx eslint` (on all new
      files), and `npx vite build` all pass clean in this sandbox; nothing
      has been exercised against a running API + Mongo + browser, since none
      of those are available here — that's the one gap between "compiles
      correctly" and "verified working," and the natural next step once this
      moves to an environment that can run `docker-compose up`.

## Phase 8 — SEO / Blogger sync

- [ ] Backend: sitemap.xml + robots.txt generation
- [ ] Backend: Blogger sync service + sync-run log
- [ ] Backend: `site_settings` singleton (site info, social links, SMTP
      config with encrypt-at-rest, SEO defaults, Blogger config) — needed
      before the admin Settings page can do anything real
- [ ] Frontend: SEO fields wired into public `<head>`

## Phase 9 — Test / harden / deploy

- [x] Backend: Pytest coverage on critical paths — 43 tests total, covering
      auth (login/refresh/reset/change-password), RBAC, content validation +
      slug collisions, media upload validation + reference counting, leads
      service, site_settings secret redaction, Blogger sync dedup/redaction,
      sitemap/robots generation
- [x] Lint: `ruff check`, `mypy --explicit-package-bases` clean on all 39
      backend source files (app/, scripts/, tests/)
- [x] Docs: production backend Dockerfile — multi-stage build, non-root user,
      curl-based healthcheck hitting `/api/v1/health`, dev-only deps
      (pytest/ruff/mypy) excluded from the runtime image. Verified by
      installing the exact prod dependency set into an isolated venv and
      confirming all 91 routes still import and register.
- [x] Docs: `docker-compose.yml` hardened — Mongo healthcheck, API waits on
      Mongo being healthy (not just started), API healthcheck + restart
      policy, `env_file` support for `backend/.env`
- [x] Docs: `requirements.txt` was missing `pillow` and `cryptography` even
      though `upload_validation.py` and `crypto.py` depend on them — fixed
      (this would have broken a real `docker compose build`)
- [x] Docs: README updated with real backend setup/run/test instructions
      (was pure Lovable boilerplate before)
- [ ] Frontend: Vitest/RTL, Playwright smoke tests — not started
- [ ] Full integration test against a live Mongo + running API + browser —
      still never exercised end-to-end; only unit-tested against fakes and
      verified via static checks (ruff/mypy/pytest/tsc/eslint/vite build) in
      this sandbox, which has no Mongo, no Docker daemon, and no browser

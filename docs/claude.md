# Agent Instructions (claude.md)

## Project context

Mirabilis is a Nagpur visual-production studio. This repo currently contains:

- `apps/web`-equivalent: the existing TanStack Start public site (root of repo,
  see `src/`) — public routes only, content sourced from `src/content/site.ts`.
- `docs/`: the planning/spec docs (this file's siblings).
- `backend/`: FastAPI + MongoDB CMS API (being built per `phases.md`).

The public site's original master-build prompt specified a different stack (Vite
SPA + pnpm monorepo). The actual repo uses TanStack Start. Treat `docs/` as the
source of truth for **what** to build; treat the existing `src/` structure as the
source of truth for **how** the current app is wired — don't restructure it
without an explicit instruction to do so.

## Commands

- `npm install`
- `npm run dev` — Vite dev server
- `npm run build` — production build (also regenerates `routeTree.gen.ts`)
- `npm run lint` / `npm run format`
- Backend (once Phase 2 lands): `uvicorn app.main:app --reload` from `backend/`

## Architecture boundaries

- Public pages read only published CMS data via public (unauthenticated) API
  routes — never call admin-only endpoints from public pages.
- `src/routes/` is file-based routing (TanStack Start conventions) — see
  `src/routes/README.md`. Never hand-edit `routeTree.gen.ts`.
- Secrets never enter frontend bundles or client-visible API responses.

## Coding conventions

- TypeScript strict mode; no `any` without a comment justifying it.
- Tailwind utility classes + the existing design tokens in `styles.css`
  (`shell`, `eyebrow`, `rule-copper`, `gradient-afterglow`, `veil`, `text-glow`) —
  reuse these before inventing new utility names.
- Python: Pydantic v2, type-hinted, Ruff-clean.

## Verification checklist (run before considering a change done)

1. `npm run build` passes.
2. `npx tsc --noEmit` passes.
3. New/changed routes appear correctly in the build output route list.
4. If backend touched: relevant Pytest suite passes.
5. `docs/tracker.md` checkboxes updated to reflect actual state.

## Forbidden actions

- Committing real secrets or `.env` values.
- Inventing fake testimonials, client names, or performance claims.
- Copying layout/imagery from reference sites named in the original brief.
- Marking a tracker item `[x]` without the corresponding code/tests existing.

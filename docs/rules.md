# Engineering Rules

1. No secrets in source control, ever. `.env` files are gitignored; only
   `.env.example` (no real values) is committed.
2. No unsafe HTML: rich text is sanitised with a strict allowlist at write time
   AND render time. Never `dangerouslySetInnerHTML` an unsanitised value.
3. Validate all input server-side with Pydantic — client-side (Zod) validation is
   UX only, never trusted as the security boundary.
4. Every critical path (auth, RBAC, media reference counting, lead creation) needs
   a passing test before merge.
5. Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
6. Branch naming: `phase-N/short-description`. PRs reference the phase and
   tracker checkboxes they close.
7. Original visual assets only — no third-party stock, no scraped reference-site
   imagery, no copied component geometry.
8. Any new collection needs a corresponding index defined in `schema.md` before
   the migration/seed script ships.
9. Accessible UI is not optional: every interactive element needs a visible focus
   state, every image field needs an alt-text input, every icon-only button needs
   an `aria-label`.
10. No dummy `TODO` implementations for anything listed as in-scope in a phase's
    Definition of Done — either it's built and tested, or it's explicitly moved to
    a later phase in `tracker.md`.

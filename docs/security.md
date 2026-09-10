# Security

## Threat model (summary)

| Threat                                                  | Mitigation                                                                                                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credential stuffing / brute force on login              | Argon2id hashing, rate limiting on `/auth/login`, account lockout after N failed attempts                                                                |
| Session/token theft                                     | Short-lived access JWT (15 min), rotating refresh token in HttpOnly/Secure/SameSite cookie, revocation on logout                                         |
| CSRF on cookie-authenticated writes                     | Double-submit CSRF token header required on refresh/logout and any cookie-only mutation                                                                  |
| NoSQL injection                                         | All queries built from validated Pydantic models, never raw dict interpolation from client input                                                         |
| Malicious file upload (webshell, oversized, mislabeled) | Extension allowlist + MIME + magic-byte signature check, server-generated filenames, size caps, no execution of uploaded files, path-traversal rejection |
| Privilege escalation via UI-only checks                 | RBAC enforced in API dependency layer, not just hidden buttons                                                                                           |
| Secret leakage (SMTP/API keys)                          | Encrypted at rest, redacted from logs/audit/API responses, only "configured: true/false + last updated" surfaced                                         |
| Stored XSS via rich text (blog body)                    | Strict sanitisation allowlist applied at write AND render time                                                                                           |
| Blogger sync overwriting manual edits                   | Conflict policy: sync never overwrites a post with local unsynced edits without explicit admin confirmation                                              |

## RBAC

Roles: `super_admin` (all), `editor` (content CRUD, no users/settings/secrets),
`viewer` (read-only). Enforced via a FastAPI dependency checked on every
admin-scoped route; UI hides disallowed actions as a UX nicety only.

## Auth / token rotation

- Argon2id password hashing; minimum password policy (length ≥ 12, not a known
  breached password if a check is available).
- Access JWT: short-lived, signed, contains `sub`, `role`, `exp`.
- Refresh token: opaque random value, hashed at rest, rotated on every use
  (reuse of a revoked token invalidates the whole token family — replay
  detection).
- Password reset tokens: single-use, time-limited (30 min), hashed at rest.

## Rate limiting

Applied per-IP (and per-account where relevant) on: login, password reset
request, media upload, contact-lead submission. Defaults in `techspec.md` env
vars; tunable without redeploy where feasible.

## Headers / transport

- HTTPS-only in production, HSTS.
- Restrictive CSP (no inline scripts beyond a nonce'd bootstrap, no wildcard
  sources).
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

## Upload validation

Allowlist: jpg, jpeg, png, webp, avif, mp4, webm, pdf (business-required only).
Checks, in order: extension → declared MIME → magic-byte signature → size →
dimensions/duration (where relevant). Filenames are always server-generated;
requests containing path-traversal sequences in any field are rejected outright.
Image metadata (EXIF) stripped/normalised on ingest.

## Audit logging

Every create/update/delete/login/password_reset/sync/upload writes an
`activity_logs` entry with a field-level diff summary. Diffs never include secret
fields (SMTP password, API keys) — those fields are excluded from the diff
entirely, not masked.

## Dependency & backup hygiene

- Dependency vulnerability scanning as part of CI (documented, not automated in
  this sandbox).
- Daily DB backup, 14-day retention, documented restore test (see
  `architecture.md`).

## Incident response checklist

1. Rotate `JWT_SECRET` and `SECRETS_ENCRYPTION_KEY`, forcing all sessions to
   re-authenticate.
2. Revoke all refresh tokens for affected accounts.
3. Review `activity_logs` for the affected time window.
4. Rotate SMTP/Blogger/S3 credentials.
5. Notify affected users/admins per the retention policy in `privacy.md`.

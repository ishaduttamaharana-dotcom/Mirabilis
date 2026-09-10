# Technical Specification

## API conventions

- Base path: `/api/v1`. Resource-oriented, plural nouns: `/api/v1/services`,
  `/api/v1/projects`, etc.
- JSON only. `Content-Type: application/json` required on write bodies except
  uploads (`multipart/form-data`).

## Pagination, sorting, filtering

- Query params: `page` (1-indexed, default 1), `pageSize` (default 20, max 100),
  `sort` (e.g. `-createdAt`, `sortOrder`), `state` (`draft|published`), free-text
  `q` where applicable, plus collection-specific filters (e.g. `category`, `tag`).
- List response envelope:

```json
{
  "items": [/* ... */],
  "page": 1,
  "pageSize": 20,
  "total": 42
}
```

## Response envelope

- Single item: `{ "data": { ... } }`
- Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "fields": { "slug": "Already in use" }
  }
}
```

- Standard codes: `VALIDATION_ERROR` (422), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
  `NOT_FOUND` (404), `CONFLICT` (409, e.g. slug collision), `RATE_LIMITED` (429),
  `INTERNAL_ERROR` (500).

## File upload contract

- `POST /api/v1/media` — `multipart/form-data`, fields: `file`, `category`.
- Server validates extension allowlist, MIME type, magic-byte signature, size limit
  (images 15MB / video 250MB / PDF 20MB, configurable via env), and for images,
  dimensions.
- Response: media document with server-generated filename/key — client never
  chooses the stored filename.

## Integrations

- **Blogger sync**: `POST /api/v1/admin/blogger-sync/run` (manual) and a scheduled
  interval job; dedupes on Blogger post external ID; writes a `blogger_sync_runs`
  record with status/error (no secrets in the record).
- **SMTP**: settings-driven, used for lead notification emails and password reset;
  test-send endpoint restricted to `super_admin`.
- **Webhooks**: none in v1; reserved path `/api/v1/webhooks/*` for future use.

## Environment variables (`.env.example` fields)

```
MONGODB_URI=
DB_NAME=mirabilis
JWT_SECRET=
JWT_ACCESS_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=30
CORS_ORIGINS=http://localhost:5173
STORAGE_DRIVER=local            # local | s3
STORAGE_LOCAL_PATH=backend/uploads
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
UPLOAD_MAX_IMAGE_MB=15
UPLOAD_MAX_VIDEO_MB=250
UPLOAD_MAX_PDF_MB=20
SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_NAME=Mirabilis
SECRETS_ENCRYPTION_KEY=
SEED_ADMIN_EMAIL=admin@rrindustries.com
SEED_ADMIN_PASSWORD=ChangeMeImmediately_2026!
BLOGGER_API_KEY=
BLOGGER_BLOG_URL=
BLOGGER_SYNC_ENABLED=false
BLOGGER_SYNC_INTERVAL_MINUTES=60
FRONTEND_BASE_URL=http://localhost:5173
RATE_LIMIT_LOGIN_PER_MINUTE=5
RATE_LIMIT_CONTACT_PER_MINUTE=3
```

## Performance budgets

- Public LCP < 2.5s on 4G profile; hero media served responsively with a poster
  frame for video.
- API p95 < 300ms for list endpoints under 1k documents per collection.
- Admin table views paginate server-side; never fetch full collections client-side.

## Testing plan

- **Pytest**: auth flow, RBAC denial cases, one CRUD collection fully (template for
  the rest), media reference counting, contact-lead creation.
- **Vitest + RTL**: admin form validation, public component rendering with mock
  data.
- **Playwright smoke**: public homepage loads, contact form submits, admin login →
  create a service → see it published on the public site.

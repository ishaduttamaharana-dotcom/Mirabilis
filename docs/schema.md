# MongoDB Schema

Conventions: `_id: ObjectId` internally, serialised as `id: str`. Every collection
adds `createdAt`, `updatedAt` (UTC datetime); mutable collections add `createdBy`,
`updatedBy` (user id).

## users

| field              | type | notes                                 |
| ------------------ | ---- | ------------------------------------- |
| email              | str  | unique index                          |
| passwordHash       | str  | Argon2id                              |
| role               | enum | `super_admin` \| `editor` \| `viewer` |
| mustChangePassword | bool | true after seed                       |
| active             | bool |                                       |

Index: unique `email`.

## refresh_tokens

| field     | type     | notes                           |
| --------- | -------- | ------------------------------- |
| userId    | ObjectId |                                 |
| tokenHash | str      | hashed at rest, never plaintext |
| expiresAt | datetime | TTL index                       |
| revoked   | bool     |                                 |

Index: TTL on `expiresAt`; index on `userId`.

## password_reset_tokens

Same shape as `refresh_tokens`, single-use (`usedAt` field), TTL index on
`expiresAt`.

## leads

| field                       | type                                                            |
| --------------------------- | --------------------------------------------------------------- |
| name, email, phone, company | str                                                             |
| serviceInterest             | str (service slug)                                              |
| message                     | str                                                             |
| attachments                 | array of media ids                                              |
| source                      | str (`website`, etc.)                                           |
| status                      | enum: new, contacted, qualified, proposal_sent, won, lost, spam |
| assignedTo                  | ObjectId (user), nullable                                       |

Index: `status`, `createdAt` (desc, for list sort).

## lead_notes

`leadId`, `authorId`, `body`, `createdAt`.

## services / projects / products / industries / clients / partners / team_members /

## testimonials / pricing_plans / hero_slides / gallery_items / faqs / statistics

Each follows the field lists specified in the master prompt section 5 (CRUD
collections), with the shared lifecycle fields below:

| field     | type   | notes                                                                                |
| --------- | ------ | ------------------------------------------------------------------------------------ |
| slug      | str    | unique per collection (or per `(type, slug)` for `categories`)                       |
| state     | enum   | `draft` \| `published` (where applicable)                                            |
| sortOrder | int    | for manual ordering                                                                  |
| visible   | bool   | separate from `state` where the item has no draft workflow (e.g. FAQs)               |
| seo       | object | `{ title, metaDescription, canonicalUrl, ogTitle, ogDescription, ogImage, noindex }` |

Index: unique `slug` (or `(type, slug)` on `categories`); `state`; `sortOrder`.

## blog_posts

Adds: `title`, `excerpt`, `contentHtml` (sanitised), `contentJson` (Tiptap doc),
`coverImage`, `publishDate`, `authorId`, `tags[]`, `categoryId`, `state`
(`draft|scheduled|published`), `externalId` (Blogger post id, nullable, unique
sparse index for dedupe).

## media

| field                          | type                           |
| ------------------------------ | ------------------------------ |
| key                            | str (storage path/object key)  |
| category                       | str                            |
| mimeType, size                 |                                |
| width, height, durationSeconds | nullable, media-type dependent |
| referenceCount                 | int                            |
| altText                        | str                            |

Index: `category`; `referenceCount` (for orphan queries).

## notifications

`userId` (nullable = broadcast), `type`, `message`, `read` (bool), `entityRef`.
Index: `(userId, read)`.

## activity_logs

`actorId`, `action` (`create|update|delete|login|password_reset|sync|upload`),
`collection`, `entityId`, `fieldDiff` (secrets redacted), `ip`, `userAgent`,
`createdAt`.
Index: `createdAt` desc; `actorId`.

## site_settings

Single document (or key/value collection): site info, social links, SMTP config
(password encrypted at rest with `SECRETS_ENCRYPTION_KEY`, never returned to
client — only `{ configured: bool, updatedAt }`), Blogger config, SEO defaults,
admin branding.

## blogger_sync_runs

`startedAt`, `finishedAt`, `status` (`success|error|running`), `postsImported`,
`postsSkipped`, `errorMessage` (secrets redacted).

## Referential integrity

- No native Mongo relations; references are ObjectIds validated at the service
  layer before write.
- MongoDB transactions used where the deployment is a replica set (Atlas always
  is); for local standalone Mongo, the service layer performs writes in a
  documented safe order (dereference before delete) and logs a repair task if the
  second step fails, since standalone Mongo can't roll back atomically.

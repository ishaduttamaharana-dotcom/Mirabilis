# Privacy (technical draft — requires legal review before publication)

## Data inventory

| Data                                                        | Source                          | Purpose                              | Retention                                                                            |
| ----------------------------------------------------------- | ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| Lead contact details (name, email, phone, company, message) | Public contact form             | Respond to enquiry, plan a shoot     | Until project closes + 12 months, then review for deletion                           |
| Lead attachments                                            | Public contact form             | Reference material for quoting       | Same as lead record                                                                  |
| Admin account (email, hashed password)                      | Seeded / created by super_admin | Authenticated CMS access             | Life of employment/engagement                                                        |
| Uploaded media                                              | Admin upload                    | Public site content / delivered work | Life of the referencing content; orphaned media flagged for review, not auto-deleted |
| Activity logs                                               | System-generated                | Security/audit                       | 12 months rolling                                                                    |
| Refresh/reset tokens                                        | System-generated                | Session/auth                         | TTL-bound (30 days / 30 min)                                                         |

## Purposes

Data is collected only to operate the site and deliver studio services — no
third-party ad tracking, no data sale.

## Admin data access

`super_admin` has full access; `editor`/`viewer` access is scoped per RBAC in
`security.md`. Lead PII is visible to authenticated admin roles only, never
exposed via public endpoints.

## Uploaded media handling

Client-supplied lead attachments are stored in a non-public path and served only
through an authenticated/signed endpoint — never the public `/uploads/...` path
used for approved site media.

## Cookies

Only the auth refresh-token cookie (HttpOnly, Secure, SameSite) is set, scoped to
the admin app. No marketing/analytics cookies in v1.

## Deletion / export process

- A lead or admin can request data export/deletion by contacting the studio
  (email in site settings).
- Deletion removes the lead/user document and any exclusively-referenced media;
  an audit-log entry records that a deletion occurred without retaining the
  deleted content itself.

## Note

This document defines the technical data-handling behaviour of the system. It is
**not** a published privacy policy and must be reviewed by qualified legal counsel
before being used as the basis of the public-facing `/privacy` page copy.

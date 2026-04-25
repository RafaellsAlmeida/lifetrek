# API Contracts: Lifetrek Backend

Lifetrek uses Supabase Edge Functions (Deno). This document summarizes the most important active contracts in the current product: email approval, blog, CRM, analytics, technical drawing, and visual support.

Older documentation prioritized visual generation/editing inside the Social Media Workspace. That flow is now treated as content support rather than the strategic center of the product.

## General Standards

- Auth: bearer token required for administrative operations.
- Content-Type: `application/json`.
- CORS: enabled in the functions.
- Sensitive operations stay in Edge Functions, never directly in the frontend.
- Public tokens should be minimally scoped and expiring.
- Standard error shape:

```json
{ "success": false, "error": "message" }
```

## Email Approval

### `POST /functions/v1/send-stakeholder-review`

Creates a stakeholder review batch and sends secure review emails.

Typical request:

```json
{
  "post_ids": ["uuid"],
  "notes": "Optional comment for reviewers"
}
```

Behavior:

- Requires authenticated user with admin permission.
- Validates that content is already internally approved.
- Creates records in `stakeholder_review_batches`.
- Creates tokens in `stakeholder_review_tokens`.
- Creates items in `stakeholder_review_items`.
- Sends email through the Lifetrek template.
- Updates content status to `stakeholder_review_pending`.
- Rolls back the batch if a critical send failure occurs.

Typical response:

```json
{
  "success": true,
  "batch_id": "uuid",
  "sent_count": 2
}
```

### `GET|POST /functions/v1/stakeholder-review-action`

Public endpoint used by `/review/:token`.

GET with `action=fetch`:

```text
/functions/v1/stakeholder-review-action?token=TOKEN&action=fetch
```

POST for decisions:

```json
{
  "token": "TOKEN",
  "item_id": "uuid",
  "action": "approve"
}
```

Actions:

- `fetch`: loads batch, reviewer, and items.
- `approve`: approves an item.
- `reject`: rejects an item with a comment.
- `edit_suggest`: records a copy-edit suggestion.

Rules:

- No admin login required.
- Token expires.
- Must not expose unnecessary internal administrative data.
- Records reviewer, timestamp, and decision.

## Blog

### `POST /functions/v1/generate-blog-post`

Generates a technical blog draft.

Typical request:

```json
{
  "topic": "Local manufacturing of orthopedic implants",
  "keywords": ["orthopedic implants", "local manufacturing"],
  "category": "educational",
  "async": true
}
```

Expected output:

```json
{
  "success": true,
  "post": {
    "title": "string",
    "slug": "string",
    "excerpt": "string",
    "seo_title": "string",
    "seo_description": "string",
    "content": "<h2>...</h2>",
    "keywords": ["string"],
    "tags": ["string"]
  }
}
```

Rules:

- Content should be in Brazilian Portuguese.
- Tone should remain technical and educational.
- SEO metadata must remain editable in the Admin Blog UI.
- Generated content requires human review before approval/publication.

### `POST /functions/v1/generate-blog-images`

Generates or associates supporting images for blog posts.

Request:

```json
{
  "limit": 20,
  "dry_run": false
}
```

Response:

```json
{
  "success": true,
  "processed_count": 12,
  "updated_count": 10,
  "failed_count": 2
}
```

Note: blog images are editorial support. They do not replace technical review, SEO, or approval.

## CRM

### `POST /functions/v1/import-leads`

Imports leads into the CRM.

Typical request:

```json
{
  "leads": [
    {
      "name": "Name",
      "email": "contact@company.com",
      "company": "Company",
      "score": 82
    }
  ]
}
```

Behavior:

- Requires administrative authentication.
- Normalizes core fields.
- Upserts by email when applicable.
- Assigns initial `new` status.
- Derives initial priority when a score exists.

## Analytics

### `POST /functions/v1/ingest-linkedin-analytics`

Validates and ingests LinkedIn CSV/XLS/XLSX into normalized `linkedin_analytics`.

Validation request:

```json
{
  "mode": "validate",
  "file_name": "linkedin-mar-2026.csv",
  "csv_text": "post date,post url,impressions,..."
}
```

Ingest request:

```json
{
  "mode": "ingest",
  "conflict_policy": "skip",
  "file_name": "linkedin-mar-2026.csv",
  "csv_text": "post date,post url,impressions,..."
}
```

`conflict_policy`:

- `skip`: keep existing rows and ignore already imported hashes.
- `overwrite_period`: remove rows for the detected period and reinsert the current file.

Response:

```json
{
  "success": true,
  "rows_total": 120,
  "accepted_count": 118,
  "rejected_count": 2,
  "inserted_count": 110,
  "skipped_duplicate_hash_count": 8,
  "periods_detected": ["2026-03"]
}
```

### `POST /functions/v1/sync-ga4-analytics`

Synchronizes Google Analytics data when the integration is configured.

### `POST /functions/v1/sync-linkedin-analytics`

Synchronizes LinkedIn metrics when the integration is configured.

## Technical Drawing

### `POST /functions/v1/engineering-drawing`

Executes server-side operations related to the technical drawing workflow.

Expected responsibilities:

- process technical input;
- support normalized-document generation;
- persist artifacts when needed;
- integrate with Storage and the database;
- preserve validation and traceability.

The full flow is exposed through `/admin/desenho-tecnico` and its React components.

## Visual Support Contracts

### `POST /functions/v1/regenerate-carousel-images`

Generates new image variants for an existing carousel and stores them in Supabase Storage.

Request:

```json
{
  "carousel_id": "uuid",
  "table_name": "linkedin_carousels",
  "slide_index": 0,
  "mode": "smart",
  "allow_ai_fallback": true
}
```

Response:

```json
{
  "success": true,
  "carousel_id": "uuid",
  "mode": "smart",
  "slides_regenerated": 1,
  "images_generated": 1,
  "duration_ms": 4800
}
```

Critical rule: this function must add variants. It must never overwrite existing historical images.

### `POST /functions/v1/set-slide-background`

Sets a slide background manually while preserving history.

Request:

```json
{
  "table_name": "instagram_posts",
  "post_id": "uuid",
  "slide_index": 0,
  "new_image_url": "https://...",
  "asset_id": "uuid",
  "source": "manual"
}
```

Behavior:

- Updates `slides[slide_index].image_url` and `imageUrl`.
- Appends a new entry into `image_variants`.
- Updates `image_urls[slide_index]`.
- Stores selection metadata.

Note: these visual contracts support content workflows. They should not be used to position Lifetrek as an advanced image/video editing platform.

## Related Tables

- `stakeholder_review_batches`
- `stakeholder_review_tokens`
- `stakeholder_review_items`
- `blog_posts`
- `blog_categories`
- `contact_leads`
- `linkedin_analytics`
- social content tables
- technical drawing sessions and normalized-document records

## General Principles

- Administrative functions require authentication.
- Public token-based functions should have minimal scope.
- Secret-bearing operations stay in Edge Functions.
- Images and variants must preserve history.
- Approval and publication actions must remain traceable.

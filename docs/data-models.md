# Data Models: Lifetrek

Summary of the most relevant current product data models, organized by sector.

## 1. Approval and Publishing

### Primary tables

- `stakeholder_review_batches`
- `stakeholder_review_tokens`
- `stakeholder_review_items`

### Table purpose

- `stakeholder_review_batches`: represents a review batch sent to stakeholders.
- `stakeholder_review_tokens`: stores token, reviewer, expiry, and batch linkage.
- `stakeholder_review_items`: links each content item in the batch to its review state.

### Important fields

- `status`
- `reviewer_email`
- `expires_at`
- `content_type`
- `content_id`
- `copy_edits`
- `reviewed_at`

## 2. Blog and Editorial

### Primary tables

- `blog_posts`
- `blog_categories`

### Important fields in `blog_posts`

- `title`
- `slug`
- `excerpt`
- `content`
- `status`
- `featured_image`
- `hero_image_url`
- `seo_title`
- `seo_description`
- `keywords`
- `tags`
- `published_at`
- `metadata`

### Expected editorial metadata

- `icp_primary`
- `icp_secondary`
- `pillar_keyword`
- `entity_keywords`
- `cta_mode`
- approval/publication helper fields

## 3. CRM and Leads

### Primary table

- `contact_leads`

### Typical fields

- `name`
- `email`
- `company`
- `status`
- `priority`
- `source`
- `lead_score`
- `score_breakdown`
- `technical_requirements`
- `created_at`
- `updated_at`

## 4. Analytics and Reporting

### Primary tables

- `linkedin_analytics`
- `linkedin_analytics_daily`
- `analytics_events`
- `blog_analytics`
- `lead_behavior_logs`

### Notes

- `linkedin_analytics` represents normalized CSV/XLS/XLSX imports.
- `linkedin_analytics_daily` covers existing daily snapshots or operational integrations.
- `blog_analytics` and `lead_behavior_logs` help connect content and behavior.

## 5. Technical Drawing

### Primary table

- `engineering_drawing_sessions`

### Purpose

Persist session state, normalized document state, and metadata required for rendering and export.

### Expected fields

- session identifier
- status
- source/reference input
- normalized document
- artifacts/exports
- `created_by`
- timestamps

## 6. Social Support and Visual Governance

### Primary tables

- `linkedin_carousels`
- `instagram_posts`
- `content_ideas`
- `product_catalog`
- `asset_embeddings`

### Relevant fields in `linkedin_carousels` / `instagram_posts`

- `slides` (jsonb)
- `image_urls` (text[])
- `caption`
- `status`

### Relevant fields per slide (`slides[n]`)

- `image_url` / `imageUrl`
- `image_variants`
- `prev_image_urls`
- `asset_source`
- `selection_score`
- `selection_reason`
- `asset_id`

### Rules

- image history is append-only;
- real assets come before AI fallback;
- visual templates remain controlled.

## 7. Knowledge and Search

### Supporting tables

- `knowledge_base`
- `company_facts`
- `ai_response_suggestions`
- `carousels_embeddings`

### Usage

- technical RAG
- structured facts
- semantic search for content and support

## 8. General Conventions

- PK: UUID v4
- timestamps: `created_at` / `updated_at` with `timestamptz`
- app typing source: `src/integrations/supabase/types.ts`

> For the full and current schema, use the migrations under `supabase/migrations/` and the generated application types.

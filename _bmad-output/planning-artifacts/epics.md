---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
lastStep: 'step-04-final-validation'
status: 'complete'
completedAt: '2026-03-05'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/project-context.md
workflowType: 'create-epics-and-stories'
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-03-05'
---

# Lifetrek - Epic Breakdown

## Overview

This document defines implementation-ready epics and stories for the 2026 Content Engine track. It is derived from PRD requirements and aligned with architecture and UX constraints.

## Requirements Inventory

### Functional Requirements

FR-001 Ideation Deep Research Mode  
FR-002 Ideation Persistence  
FR-003 Orchestrator Form Entry  
FR-004 Orchestrator Chat Entry  
FR-005 LinkedIn Generation Pipeline  
FR-006 Instagram Generation via Shared Pipeline  
FR-007 Blog Draft Generation  
FR-008 Blog Hero Image at Creation  
FR-009 Blog Approval Publishing Flow  
FR-010 Blog Hero Backfill Batch  
FR-011 LinkedIn Analytics CSV Upload  
FR-012 LinkedIn Analytics Normalized Persistence  
FR-013 Analytics Feedback Visibility  
FR-014 Approval Queue Integration  
FR-015 Image Versioning Guardrail  
FR-016 Real Asset First Background Selection  
FR-017 Cost Tracking Coverage  
FR-018 Access Control and Auditability
FR-019 Human Editing for Blogs and Resources
FR-020 Stakeholder Review Batch Creation
FR-021 Branded HTML Email Delivery via Resend
FR-022 Token-Based Stakeholder Authentication (No Login)
FR-023 Stakeholder Approve / Reject / Edit Copy Actions
FR-024 Copy Edit Suggestions Surfaced in Admin
FR-025 Manual Batch Send Trigger in Admin
FR-026 Weekly Auto-Send via Supabase Scheduled Function
FR-027 Stakeholder Review Status Visibility in Admin

### NonFunctional Requirements

NFR-001 Cost Ceiling Compatibility  
NFR-002 Event-Driven Behavior  
NFR-003 Language Fidelity  
NFR-004 Brand Fidelity  
NFR-005 Data Integrity  
NFR-006 Security  
NFR-007 Operability  
NFR-008 Performance  
NFR-009 Traceability  
NFR-010 Compatibility

### Additional Requirements

1. `_bmad-output` artifacts are canonical for 2026 planning and implementation.
2. Legacy December 2024 PRD is reference-only.
3. Stories must include no-regression guardrails for CRM, website, and non-content admin modules.
4. Story files must be generated under `_bmad-output/implementation-artifacts/stories/`.

### FR Coverage Map

- FR-001 -> Epic 1, Epic 2
- FR-002 -> Epic 1
- FR-003 -> Epic 4
- FR-004 -> Epic 2, Epic 4
- FR-005 -> Epic 2
- FR-006 -> Epic 2
- FR-007 -> Epic 2
- FR-008 -> Epic 2
- FR-009 -> Epic 4
- FR-010 -> Epic 2
- FR-011 -> Epic 3
- FR-012 -> Epic 1, Epic 3
- FR-013 -> Epic 3
- FR-014 -> Epic 4
- FR-015 -> Epic 1, Epic 5
- FR-016 -> Epic 5
- FR-017 -> Epic 2
- FR-018 -> Epic 5
- FR-019 -> Epic 4
- FR-020 -> Epic 6
- FR-021 -> Epic 6
- FR-022 -> Epic 6
- FR-023 -> Epic 6
- FR-024 -> Epic 6
- FR-025 -> Epic 6
- FR-026 -> Epic 6
- FR-027 -> Epic 6

## Epic List

### Epic 1: Data Foundation
Establish the minimum data contracts and guardrails required for safe content and analytics operations.

**FRs covered:** FR-001, FR-002, FR-012, FR-015

### Epic 2: Pipeline Contracts
Align generation functions and orchestrator routing so content can be produced consistently across platforms and blog workflows.

**FRs covered:** FR-001, FR-004, FR-005, FR-006, FR-007, FR-008, FR-010, FR-017

### Epic 3: Analytics Loop
Enable reliable analytics upload, ingestion, and visibility to feed future content strategy.

**FRs covered:** FR-011, FR-012, FR-013

### Epic 4: UX Hardening
Harden entry, approval, and operational UX so non-technical operators can safely complete workflows.

**FRs covered:** FR-003, FR-004, FR-009, FR-014, FR-019

### Epic 5: Cross-Domain Guardrails
Protect non-content domains from regressions while enforcing security, brand, and data integrity constraints.

**FRs covered:** FR-015, FR-016, FR-018

### Epic 6: Stakeholder Email Approval System
Enable a two-stage approval loop where Rafael approves content in admin, then
sends a branded HTML email digest to rbianchini@lifetrek-medical and
njesus@lifetrek-medical for their review. Stakeholders can approve, reject with
a comment, or suggest copy edits — all via a token-secured public review page
with no admin login required.

**FRs covered:** FR-020, FR-021, FR-022, FR-023, FR-024, FR-025, FR-026, FR-027

## Epic 1: Data Foundation

Deliver canonical data contracts for ideas, analytics, and blog content lifecycle behaviors.

### Story 1.1: Content Ideas Schema

As an admin operator,  
I want content ideas persisted with structured metadata,  
So that ideation outputs can be reused in future planning.

**Acceptance Criteria:**

1. **Given** ideation output is generated, **When** persistence is requested, **Then** a `content_ideas` record is created with topic, ICP segment, and timestamps.
2. **Given** ideation sources are present, **When** the record is stored, **Then** source references are persisted in a machine-readable format.
3. **Given** unauthorized context, **When** write is attempted, **Then** write is blocked by authorization controls.

### Story 1.2: LinkedIn Analytics Schema

As an analytics operator,  
I want normalized storage for LinkedIn performance rows,  
So that imported CSV data is queryable and comparable over time.

**Acceptance Criteria:**

1. **Given** a valid analytics import payload, **When** persistence runs, **Then** rows are stored in `linkedin_analytics` with normalized fields.
2. **Given** required fields are missing, **When** persistence is attempted, **Then** the system returns validation errors without partial corruption.
3. **Given** repeated imports for distinct rows, **When** ingest completes, **Then** records preserve ingest timestamps for traceability.

### Story 1.3: Blog Posts Hero Status Alignment

As a reviewer,  
I want blog status and hero-image fields aligned,  
So that approval publishing works without manual data fixes.

**Acceptance Criteria:**

1. **Given** a blog draft with generated hero image, **When** saved, **Then** required hero and status fields are present and coherent.
2. **Given** status changes to approved, **When** publish workflow triggers, **Then** publication state and timestamps are set consistently.
3. **Given** legacy posts missing hero metadata, **When** queried, **Then** they are clearly identifiable for backfill workflows.

### Story 1.4: Image Variant Guardrails

As a content editor,  
I want image regenerations to create new variants only,  
So that historical images remain available for comparison and rollback.

**Acceptance Criteria:**

1. **Given** a slide image regeneration request, **When** processing completes, **Then** a new variant is appended and prior active image is preserved.
2. **Given** variant history exists, **When** user chooses another variant, **Then** active pointer changes without deleting prior variants.
3. **Given** deletion attempts on historical variants, **When** policy is enforced, **Then** system blocks destructive overwrite behavior.

## Epic 2: Pipeline Contracts

Unify generation function contracts and routing for social and blog flows.

### Story 2.1: Platform Param Carousel Generation

As a content creator,  
I want carousel generation to accept platform context,  
So that LinkedIn and Instagram outputs are tailored without duplicate pipelines.

**Acceptance Criteria:**

1. **Given** generation request includes `platform`, **When** pipeline starts, **Then** copy rules and output config reflect selected platform.
2. **Given** `platform=linkedin`, **When** generation completes, **Then** current LinkedIn behavior is preserved.
3. **Given** `platform=instagram`, **When** generation completes, **Then** Instagram-specific copy constraints are applied.

### Story 2.2: Blog Hero Generation at Create

As an author,  
I want hero image generation to happen at blog creation time,  
So that each draft is review-ready with a visual.

**Acceptance Criteria:**

1. **Given** blog generation starts, **When** draft is created, **Then** hero image generation is executed in the same workflow.
2. **Given** hero generation succeeds, **When** draft persists, **Then** `hero_image_url` is populated.
3. **Given** hero generation fails, **When** workflow completes, **Then** draft remains saved with an actionable error state.

### Story 2.3: Chat Intent to Carousel Params

As a sales operator,  
I want chat intent transformed into valid generation params,  
So that I can generate content without using the form.

**Acceptance Criteria:**

1. **Given** chat message intent is clear, **When** parsing runs, **Then** system maps intent to required generation fields.
2. **Given** required fields are ambiguous, **When** mapping runs, **Then** system requests targeted clarifications.
3. **Given** mapping succeeds, **When** user confirms, **Then** generation runs through the same validated contract as form entry.

### Story 2.4: Cost Tracking Enforcement

As an operations owner,  
I want all relevant generation calls cost-tracked,  
So that spend remains observable and controlled.

**Acceptance Criteria:**

1. **Given** an AI call starts in content pipeline, **When** request completes, **Then** cost event is recorded.
2. **Given** cost event write fails, **When** workflow evaluates completion, **Then** failure is observable in logs/alerts.
3. **Given** monthly review, **When** reports are generated, **Then** content operations cost data is queryable.

## Epic 3: Analytics Loop

Create reliable analytics ingestion and feedback visibility.

### Story 3.1: LinkedIn CSV Ingestion Function

As an analytics operator,  
I want a dedicated ingestion function for LinkedIn CSVs,  
So that monthly data imports are repeatable and safe.

**Acceptance Criteria:**

1. **Given** a CSV upload payload, **When** ingestion runs, **Then** file shape is validated before writes.
2. **Given** valid rows and invalid rows coexist, **When** ingestion completes, **Then** accepted rows persist and rejected rows are reported.
3. **Given** duplicate period upload, **When** policy check runs, **Then** system follows defined conflict behavior with explicit operator feedback.

### Story 3.2: Analytics Upload Contract UI

As an admin user,  
I want a clear analytics upload UI contract,  
So that I can upload files and understand ingestion outcomes without developer help.

**Acceptance Criteria:**

1. **Given** user opens analytics upload, **When** file is selected, **Then** schema expectations are visible before submit.
2. **Given** ingest completes, **When** result is displayed, **Then** accepted/rejected counts and key error reasons are shown.
3. **Given** upload fails pre-validation, **When** user reviews feedback, **Then** corrective steps are explicit and actionable.

### Story 3.3: Imported Analytics Visibility

As a strategist,  
I want imported analytics surfaced for planning,  
So that future content decisions use real performance data.

**Acceptance Criteria:**

1. **Given** imported analytics exists, **When** user opens analytics view, **Then** latest period summary is visible.
2. **Given** no analytics exists, **When** view loads, **Then** empty state directs user to upload flow.
3. **Given** ingestion errors occurred, **When** user checks results, **Then** error summary is available for correction.

## Epic 4: UX Hardening

Ensure operator-safe UX across create, approve, and recover flows.

### Story 4.1: Orchestrator Mode Parity UX

As a non-technical operator,  
I want form and chat modes to feel equivalent,  
So that I can use either mode confidently.

**Acceptance Criteria:**

1. **Given** user switches entry mode, **When** context persists, **Then** critical generation settings remain visible and coherent.
2. **Given** chat-derived params exist, **When** confirmation is shown, **Then** user can review and edit before generation.
3. **Given** generation fails, **When** retry is offered, **Then** prior user input is preserved.

### Story 4.2: Unified Approval Queue Behavior

As an approver,  
I want social and blog items in one predictable approval flow,  
So that publication decisions are fast and reliable.

**Acceptance Criteria:**

1. **Given** pending items exist, **When** queue loads, **Then** blog and social records are filterable and previewable.
2. **Given** publish-impacting approval action, **When** user confirms, **Then** state transition is logged and reflected immediately.
3. **Given** prerequisites are missing, **When** approval is attempted, **Then** action is blocked with explicit remediation instructions.

### Story 4.3: Operator Failure Recovery UX

As a daily operator,  
I want actionable recovery paths for common failures,  
So that work can continue without technical escalation.

**Acceptance Criteria:**

1. **Given** a validation or ingest error, **When** it is presented, **Then** message explains cause and next action.
2. **Given** async task failure, **When** user retries, **Then** system avoids duplicate destructive effects.
3. **Given** unavailable downstream service, **When** user views error, **Then** status indicates retry timing and fallback options.

### Story 4.4: Human Editing Surfaces for Blogs and Resources

As an admin editor,  
I want explicit human-edit interfaces for blog posts and resources,  
So that AI drafts and existing content can be corrected before publication.

**Acceptance Criteria:**

1. **Given** a blog post is listed in admin, **When** user clicks edit, **Then** title, excerpt, content, SEO, tags, and status are editable and persistable.
2. **Given** a resource is listed in admin, **When** user clicks edit, **Then** core fields and status are editable and persistable.
3. **Given** content approval queue items (blog/resource), **When** user chooses edit, **Then** user is routed to the correct human editor with context preserved.

## Epic 5: Cross-Domain Guardrails

Protect non-content product areas while enforcing security and brand constraints.

### Story 5.1: Real Asset First Enforcement

As a brand owner,  
I want real facility assets preferred for backgrounds,  
So that published visuals remain authentic and consistent.

**Acceptance Criteria:**

1. **Given** slide generation needs a background, **When** asset selection runs, **Then** real assets are attempted before AI fallback.
2. **Given** no adequate real match exists, **When** fallback is allowed, **Then** fallback usage is traceable.
3. **Given** template constraints, **When** composition executes, **Then** output remains within approved visual system.

### Story 5.2: Access and Audit Guardrails

As a platform owner,  
I want sensitive operations protected and logged,  
So that compliance and troubleshooting are reliable.

**Acceptance Criteria:**

1. **Given** unauthorized actor attempts sensitive write, **When** request is evaluated, **Then** operation is denied.
2. **Given** authorized write succeeds, **When** audit logging runs, **Then** operation metadata is traceable.
3. **Given** admin review, **When** operation history is queried, **Then** key actions are discoverable.

### Story 5.3: Cross-Domain No-Regression Verification

As a release owner,  
I want explicit no-regression verification for CRM and website domains,  
So that content-engine delivery does not disrupt existing business operations.

**Acceptance Criteria:**

1. **Given** content-engine changes are prepared, **When** regression checklist runs, **Then** CRM and website key paths are validated.
2. **Given** regression risk is detected, **When** release gate evaluates, **Then** blocker is surfaced before production promotion.
3. **Given** no blockers remain, **When** release is approved, **Then** verification evidence is attached to release notes.

---

## Epic 6: Stakeholder Email Approval System

Enable a two-stage content approval loop. After Rafael approves content in the
admin dashboard, the system collects approved posts and delivers a branded HTML
email digest to rbianchini@lifetrek-medical and njesus@lifetrek-medical.
Stakeholders can approve, reject with a comment, or suggest copy edits — all
through a token-secured public review page (no admin login required). The first
approval from either stakeholder marks the post as stakeholder-approved. Rafael
retains the final publish action.

**Approval status progression:**
```
generated → pending → admin_approved → stakeholder_review_pending
  → stakeholder_approved (first approval wins)
  → stakeholder_rejected (if all reviewers reject with no prior approval)
  → published (Rafael explicitly publishes)
```

**Stakeholder reviewers (fixed):**
- rbianchini@lifetrek-medical
- njesus@lifetrek-medical

**Send triggers:**
- Manual: Rafael selects admin_approved posts in Content Approval and clicks
  "Enviar para Aprovação dos Stakeholders"
- Automatic: Supabase scheduled function runs every Monday at 08:00 BRT
  (11:00 UTC) and sends any admin_approved posts not yet in a review batch.
  If Rafael manually sent that week, the cron skips (no posts to send).

**Resend integration:** `RESEND_API_KEY` edge function secret; sender address
`noreply@lifetrek-medical.com` (or Resend sandbox domain in local dev).

---

### Story 6.1: DB Schema — Stakeholder Review Tables

As a platform owner,
I want canonical tables for stakeholder review batches, tokens, and item statuses,
So that all approval state is persisted and auditable without relying on ephemeral logic.

**New tables:**

`stakeholder_review_batches`
- `id` UUID PK
- `created_by` UUID FK (admin user who triggered the send)
- `notes` text nullable (optional context Rafael can add before sending)
- `sent_at` timestamptz NOT NULL DEFAULT now()
- `expires_at` timestamptz NOT NULL DEFAULT now() + interval '7 days'
- `status` text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','completed','expired'))
- `created_at` timestamptz NOT NULL DEFAULT now()

`stakeholder_review_tokens`
- `id` UUID PK DEFAULT gen_random_uuid()
- `batch_id` UUID FK → stakeholder_review_batches(id) ON DELETE CASCADE
- `reviewer_email` text NOT NULL
- `token` UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()
- `created_at` timestamptz NOT NULL DEFAULT now()
- `expires_at` timestamptz NOT NULL
- `last_used_at` timestamptz nullable
INDEX: `idx_stakeholder_review_tokens_token` ON token

`stakeholder_review_items`
- `id` UUID PK DEFAULT gen_random_uuid()
- `batch_id` UUID FK → stakeholder_review_batches(id) ON DELETE CASCADE
- `content_type` text NOT NULL CHECK (content_type IN ('linkedin_carousel','instagram_post','blog_post'))
- `content_id` UUID NOT NULL
- `status` text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','edit_suggested'))
- `reviewed_by_email` text nullable
- `reviewer_comment` text nullable
- `copy_edits` jsonb nullable
  — For carousels/Instagram: `{"caption":"...","slides":[{"index":0,"headline":"...","body":"..."}]}`
  — For blog posts: `{"title":"...","excerpt":"..."}`
- `reviewed_at` timestamptz nullable
- `created_at` timestamptz NOT NULL DEFAULT now()
INDEX: `idx_stakeholder_review_items_batch_content` ON (batch_id, content_type, content_id)

**Status additions to content tables:**
- `linkedin_carousels.status`: add allowed values `stakeholder_review_pending`,
  `stakeholder_approved`, `stakeholder_rejected`
- `instagram_posts.status`: same additions
- `blog_posts.status`: same additions

**RLS:** `stakeholder_review_batches` and `stakeholder_review_tokens` — admin-only
read/write. `stakeholder_review_items` — admin read/write; public-read via
service-role key in the review-action edge function only.

**Acceptance Criteria:**

1. **Given** a valid admin session, **When** a batch is created, **Then** a
   `stakeholder_review_batches` record is persisted with correct `sent_at` and
   `expires_at` values.
2. **Given** two reviewers are configured, **When** a batch is created, **Then**
   two `stakeholder_review_tokens` records exist with distinct tokens and the
   same `expires_at` as the batch.
3. **Given** N posts are included in a batch, **When** batch is created, **Then**
   N `stakeholder_review_items` exist with `status = 'pending'` and correct
   `content_type` / `content_id` values.
4. **Given** unauthorized actor, **When** write to batch tables is attempted,
   **Then** RLS denies the operation.
5. **Given** a batch expires, **When** cron marks status, **Then** associated
   tokens are no longer usable.

---

### Story 6.2: `send-stakeholder-review` Edge Function + HTML Email Template

As an admin operator,
I want a single edge function that creates the review batch and delivers a
branded HTML email to both stakeholders,
So that the full send flow is atomic and requires no manual steps beyond clicking Send.

**Edge function:** `supabase/functions/send-stakeholder-review/index.ts`

**Request payload:**
```json
{
  "post_refs": [
    { "content_type": "linkedin_carousel", "content_id": "uuid" },
    { "content_type": "blog_post", "content_id": "uuid" }
  ],
  "notes": "optional batch note from Rafael"
}
```

**Procedure:**
1. Validate JWT + admin authorization.
2. Validate each `content_id` exists and has `status = 'admin_approved'`.
3. Validate each post has a caption or excerpt (at minimum one line of copy)
   before sending — return 400 with explicit error if any post has no copy.
4. Create `stakeholder_review_batches` record.
5. For each reviewer email (rbianchini, njesus from env vars
   `STAKEHOLDER_EMAIL_1`, `STAKEHOLDER_EMAIL_2`), create a
   `stakeholder_review_tokens` record.
6. For each post ref, create a `stakeholder_review_items` record with
   `status = 'pending'`.
7. Update each content record `status → 'stakeholder_review_pending'`.
8. Build HTML email (see template spec below).
9. Send via Resend to both reviewers simultaneously.
10. Return `{ data: { batch_id, sent_to: [...], item_count } }`.

**HTML Email Template spec:**
- Subject: `Lifetrek – [N] conteúdos aguardando sua aprovação`
- Preheader: `Revise os conteúdos da semana antes da publicação.`
- Header band: Corporate Blue `#004F8F`, Lifetrek logo (white), bold white
  subheading with reviewer first name
- Body background: `#F4F7FA`
- Per-post card (white card, 8px radius, subtle shadow):
  - Content type badge (LinkedIn / Instagram / Blog Post) — color-coded
  - Thumbnail: first slide image URL or blog hero (120×120px, rounded 6px)
    displayed inline (if no image: placeholder gray box)
  - Caption preview: italic, truncated to 200 chars with ellipsis
  - Slide headlines for carousels: bulleted list of first 3 headlines
  - Action buttons row:
    - ✅ Aprovar — `#1A7A3E` green background, white text, links to direct
      approve URL: `{REVIEW_BASE_URL}/api/review-action?token={token}&item={item_id}&action=approve`
    - ✏️ Revisar / Editar — `#004F8F` blue, links to
      `{REVIEW_BASE_URL}/review/{token}?item={item_id}`
    - ❌ Rejeitar — `#DC2626` red, links to
      `{REVIEW_BASE_URL}/review/{token}?item={item_id}&action=reject`
  - Note: all buttons are `<a>` tags with inline CSS (email client safe)
- Divider between posts
- Footer: "Este link expira em 7 dias · Lifetrek Medical · [current year]"
- Full PT-BR copy throughout

**`REVIEW_BASE_URL`** = Vercel deployment URL (env var set in Supabase dashboard
for edge functions; in local dev, use tunnel URL).

**Cost tracking:** No AI calls in this function — Resend only. Cost tracker not
required, but log send event to `audit_log` or console with batch_id.

**Acceptance Criteria:**

1. **Given** valid post refs with `admin_approved` status, **When** function is
   called, **Then** batch, tokens, and items are created; both reviewers receive
   the email; content moves to `stakeholder_review_pending`.
2. **Given** a post without caption or copy, **When** function is called, **Then**
   function returns 400 with `{ error: "Post {id} has no copy. Generate caption before sending." }`.
3. **Given** non-admin caller, **When** function is called, **Then** returns 401.
4. **Given** email delivery succeeds, **When** email is received, **Then** each
   post has three working action buttons (Aprovar / Revisar / Rejeitar).
5. **Given** HTML email renders, **When** opened on desktop or mobile email
   client, **Then** Lifetrek brand colors and logo are present; all text is PT-BR.

---

### Story 6.3: `stakeholder-review-action` Public Edge Function

As a stakeholder,
I want my approval, rejection, or copy-edit submitted securely without logging in,
So that reviewing content is frictionless and requires only clicking a link in email.

**Edge function:** `supabase/functions/stakeholder-review-action/index.ts`

**Auth model:** No JWT required (`verify_jwt = false` in config.toml). Security
via token validation only. Uses `SUPABASE_SERVICE_ROLE_KEY` internally.

**Endpoints (all GET or POST):**

`GET /stakeholder-review-action?token={token}&item={item_id}&action=approve`
- Validates token exists in `stakeholder_review_tokens` AND `now() < expires_at`
- Marks `stakeholder_review_items.status = 'approved'`, sets `reviewed_by_email`,
  `reviewed_at`
- Checks if content already has another `approved` item in same batch → if so,
  skip content status update (idempotent)
- Updates `stakeholder_review_items` first approval → sets content table
  `status = 'stakeholder_approved'`
- Updates `stakeholder_review_tokens.last_used_at`
- Returns HTML page: branded thank-you page with Lifetrek styling, PT-BR copy:
  "Conteúdo aprovado! Obrigado, [first name]."

`GET /stakeholder-review-action?token={token}&item={item_id}&action=reject`
- Same token validation
- Returns HTML page with a simple rejection form: comment textarea + submit button
- On form submit (POST to same endpoint with `action=reject&comment=...`):
  - Sets `status = 'rejected'`, stores `reviewer_comment`
  - Updates content status to `stakeholder_rejected` ONLY IF no approved item
    exists for that content in this batch (i.e., the other reviewer may have approved)
  - Returns HTML confirmation: "Feedback registrado. Obrigado."

`GET /stakeholder-review-action?token={token}&item={item_id}&action=edit`
- Redirects to `/review/{token}?item={item_id}` (public review page)

**Error responses (also HTML pages):**
- Expired token: "Este link expirou. Peça a Rafael um novo envio."
- Invalid token: "Link inválido."
- Already reviewed: "Você já revisou este conteúdo."

**Acceptance Criteria:**

1. **Given** valid token and `action=approve`, **When** GET fires, **Then**
   item status becomes `approved`, content status becomes `stakeholder_approved`,
   and reviewer sees PT-BR thank-you page.
2. **Given** valid token and `action=reject`, **When** GET fires, **Then**
   reviewer is presented with a comment form; on submit, item status becomes
   `rejected` with stored comment.
3. **Given** other reviewer already approved, **When** second reviewer rejects,
   **Then** content status remains `stakeholder_approved` (first approval wins).
4. **Given** expired token, **When** GET fires, **Then** HTML page explains
   expiry; no DB state changes.
5. **Given** same token used for approve twice, **When** second GET fires, **Then**
   function is idempotent (no duplicate updates, informational page returned).

---

### Story 6.4: Public Review Page `/review/[token]`

As a stakeholder,
I want a web page where I can see all posts in my review batch, approve, reject
with a comment, or suggest copy edits,
So that I can give detailed feedback without needing an admin account.

**Route:** `/review/:token` — public React route added to `src/App.tsx`.
No `ProtectedAdminRoute` wrapper.

**Page component:** `src/pages/StakeholderReview/StakeholderReviewPage.tsx`

**Data flow:**
- On mount, call `stakeholder-review-action?token={token}&action=fetch` (GET)
  to retrieve batch items + content details (via service role in edge function)
- Edge function returns:
  ```json
  {
    "data": {
      "reviewer_name": "Rodrigo",
      "expires_at": "...",
      "items": [
        {
          "item_id": "uuid",
          "content_type": "linkedin_carousel",
          "content_id": "uuid",
          "status": "pending",
          "title": "...",
          "caption": "...",
          "thumbnail_url": "...",
          "slides": [{ "headline": "...", "body": "..." }]
        }
      ]
    }
  }
  ```
- Display each item as a card:
  - Content type badge
  - Thumbnail (first slide or blog hero)
  - Caption (read-only display)
  - Slide headlines list (for carousels)
  - If `status !== 'pending'`: show locked "Já revisado" badge, no actions
  - Actions row:
    - "Aprovar" button → POST approve action, update local state
    - "Rejeitar" button → expands inline comment form; on submit → POST reject action
    - "Editar cópia" button → expands inline editor with editable caption and slide
      text fields; on submit → POST edit-suggestion action (saves to `copy_edits`)
- Progress bar at top: "X de N posts revisados"
- After all items reviewed: "Revisão completa! Obrigado, [name]."
- Branded: Lifetrek logo, Corporate Blue header, PT-BR throughout
- Mobile-responsive (Tailwind utilities only)

**Edit-suggestion POST endpoint in `stakeholder-review-action`:**
`POST /stakeholder-review-action`
```json
{
  "token": "...",
  "item_id": "...",
  "action": "edit_suggest",
  "copy_edits": { "caption": "...", "slides": [...] }
}
```
- Sets `status = 'edit_suggested'`, stores `copy_edits`
- Does NOT change content status (remains `stakeholder_review_pending`)
- Sends a Realtime DB change that Rafael sees in admin

**Acceptance Criteria:**

1. **Given** valid token, **When** page loads, **Then** all batch items render
   with correct content type, thumbnail, and caption.
2. **Given** stakeholder clicks Aprovar, **When** API call succeeds, **Then** card
   updates to "Aprovado" state without page reload.
3. **Given** stakeholder clicks Editar cópia, **When** they submit changes,
   **Then** `copy_edits` is stored in DB and item `status = 'edit_suggested'`.
4. **Given** expired token, **When** page loads, **Then** user sees expiry message
   in PT-BR with no post data exposed.
5. **Given** mobile screen width, **When** page renders, **Then** post cards are
   readable and action buttons are tappable without horizontal scroll.

---

### Story 6.5: Admin Content Approval — Stakeholder Status & Copy Suggestions

As an admin operator,
I want to see stakeholder review status for each post in the Content Approval
page, and apply or dismiss copy-edit suggestions,
So that I can act on stakeholder feedback before publishing.

**Changes to `ContentApprovalCore.tsx` and related hooks:**

**New status filter tabs (add to existing tab set):**
- "Em revisão" → filters `status = 'stakeholder_review_pending'`
- "Aprovado por stakeholder" → `status = 'stakeholder_approved'`
- "Rejeitado por stakeholder" → `status = 'stakeholder_rejected'`
- "Sugestões de edição" → `status = 'edit_suggested'` (from `stakeholder_review_items`)

**Per-post expanded detail (when card is expanded):**
- Stakeholder review status badge: Pending / Approved by [email] / Rejected by [email]
- Reviewer comment (if any): shown in a styled callout block
- Copy edit suggestions (if `copy_edits` present):
  - Diff view: original text vs suggested text (side-by-side or below)
  - "Aplicar sugestão" button → updates content record with suggested copy,
    calls existing caption/slide update path
  - "Descartar sugestão" button → marks item as dismissed (no DB status change
    on content, item `copy_edits` cleared)

**New hook:** `src/hooks/useStakeholderReview.ts`
- `useStakeholderReviewItems(contentType, contentId)` → queries
  `stakeholder_review_items` for a given post, returns items with reviewer info
- `useApplyCopyEditSuggestion(itemId)` → mutation that applies `copy_edits`
  to the content record and clears suggestion

**Acceptance Criteria:**

1. **Given** posts with `stakeholder_review_pending` status, **When** "Em revisão"
   tab is selected, **Then** those posts appear with reviewer status shown.
2. **Given** a post with `copy_edits` set, **When** card is expanded, **Then**
   diff between original and suggested copy is visible.
3. **Given** Rafael clicks "Aplicar sugestão", **When** mutation succeeds, **Then**
   content record is updated with suggested text and suggestion is cleared.
4. **Given** a post is `stakeholder_approved`, **When** viewed in admin, **Then**
   reviewer email and approval timestamp are shown.
5. **Given** a post is `stakeholder_rejected`, **When** viewed in admin, **Then**
   rejection comment is displayed in a clearly styled callout.

---

### Story 6.6: Admin Manual Send Trigger ("Enviar para Aprovação")

As Rafael (admin),
I want to select admin-approved posts in the Content Approval page and send them
for stakeholder review with one action,
So that I control exactly which posts go out and when.

**UI additions to `ContentApprovalCore.tsx`:**

- In "Aprovado" tab (existing `admin_approved` filter): add a checkbox column
  to each post card
- When ≥1 post selected: floating action bar appears at bottom of screen with:
  - "X posts selecionados"
  - "Enviar para Aprovação" button
- Clicking "Enviar para Aprovação" opens `SendReviewModal`:
  - Summary: "Enviar [N] posts para:"
    - rbianchini@lifetrek-medical ✓
    - njesus@lifetrek-medical ✓
  - Optional notes textarea: "Adicionar nota para os revisores (opcional)"
  - Post list with thumbnail + type badge (non-editable)
  - "Cancelar" and "Confirmar envio" buttons
- On confirm: calls `send-stakeholder-review` edge function; shows toast on
  success: "Email enviado com sucesso para 2 revisores."
- On error: toast with error message from function response

**New component:** `src/components/admin/content/SendReviewModal.tsx`

**Acceptance Criteria:**

1. **Given** posts with `admin_approved` status, **When** checkboxes are selected,
   **Then** floating action bar shows with count and send button.
2. **Given** send modal is open, **When** confirm is clicked, **Then** edge
   function is called; loading state is shown; success toast appears on completion.
3. **Given** send succeeds, **When** modal closes, **Then** selected posts update
   to `stakeholder_review_pending` status in the UI (React Query invalidation).
4. **Given** send fails, **When** error is returned, **Then** modal stays open
   with error message; no status change on posts.
5. **Given** Rafael adds optional notes, **When** batch is sent, **Then** notes
   are persisted in `stakeholder_review_batches.notes`.

---

### Story 6.7: Weekly Auto-Send Scheduled Function

As the platform,
I want an automatic weekly send of admin-approved posts that have not yet been
sent for stakeholder review,
So that the approval loop completes even if Rafael forgets to trigger it manually.

**Scheduled function:** `supabase/functions/weekly-stakeholder-send/index.ts`

Registered in Supabase dashboard as a cron job:
`0 11 * * 1` (11:00 UTC = 08:00 BRT, every Monday)

**Procedure:**
1. Query all `linkedin_carousels`, `instagram_posts`, `blog_posts` where:
   - `status = 'admin_approved'`
   - `id NOT IN (SELECT content_id FROM stakeholder_review_items)`
2. If result set is empty → log "No posts to send. Skipping." and return 200.
3. If result set has ≥1 post → call `send-stakeholder-review` internally
   (direct Supabase function invocation or shared handler import) with:
   - `post_refs`: all found posts
   - `notes`: "Envio automático semanal – {ISO date}"
   - `created_by`: system UUID (defined in env var `SYSTEM_USER_ID`)
4. Log result: batch_id, count sent, reviewer emails.

**Idempotency:** Cron runs Monday. If Rafael manually sent on Friday (all posts
already in `stakeholder_review_items`), query returns empty — no duplicate send.

**Acceptance Criteria:**

1. **Given** admin_approved posts not yet in any batch, **When** cron fires,
   **Then** a batch is created and emails sent to both reviewers.
2. **Given** no admin_approved posts pending, **When** cron fires, **Then**
   function exits cleanly with log "No posts to send."
3. **Given** Rafael manually sent all posts earlier that week, **When** cron
   fires on Monday, **Then** no duplicate batch or duplicate email is sent.
4. **Given** function invocation fails (Resend error), **When** error is caught,
   **Then** function returns 500 with error logged; no partial batch is left
   in `sent` status (rollback or clear created records).

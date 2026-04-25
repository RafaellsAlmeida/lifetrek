# BMAD Standard Documentation - Lifetrek

Date: 2026-04-25  
Language: English  
Audience: agents, developers, internal operators

## 1. Purpose

This is the primary BMAD standard for agent-facing and internal work on Lifetrek.

Use this document as the first routing layer for:

- implementation tasks;
- documentation tasks;
- architecture and planning work;
- repository orientation for agents.

The stakeholder-facing companion lives in Portuguese at `docs/bmad-standard-documentation-pt.md`. Sector docs in `docs/sectors/` are also stakeholder-facing by default.

## 2. Product Positioning

Lifetrek is an internal operations platform for Lifetrek Medical. Its current value is in structured approval, technical editorial workflows, CRM visibility, analytics, and technical drawing.

Older documentation overemphasized in-app image editing and video editing. That is no longer the right product story. Visual tooling still exists as support for content and brand consistency, but it is not a strategic pillar.

The platform should now be framed around:

- stakeholder approval by email;
- blog generation and editorial review;
- CRM and lead operations;
- unified analytics and reporting;
- technical drawing workflows;
- controlled social-content support.

## 3. Primary Scope

### Email Approval

The system supports internal review followed by stakeholder approval through secure email links and public tokenized review pages.

### Blog Generator and Editor

The blog flow should be treated as a full editorial product: strategy, draft generation, editing, SEO, approval, and publication.

### CRM

The CRM is the operational view of leads, pipeline status, priorities, and fast commercial action.

### Analytics

Analytics consolidates website, LinkedIn, content, and lead data to support editorial and commercial decisions.

### Technical Drawing

Technical drawing converts sketches or references into normalized technical documents, 2D outputs, A3 sheets, 3D previews, validation steps, and STEP exports.

### Social Content Support

The orchestrator and social workspace still matter, but as support systems for content operations. They should not be positioned as advanced image/video editors.

## 4. Main Routes

- `/admin/orchestrator`: content orchestration
- `/admin/content-approval`: internal approval and stakeholder sends
- `/admin/blog`: blog generator/editor
- `/admin/leads`: CRM
- `/admin/analytics`: unified analytics
- `/admin/desenho-tecnico`: technical drawing
- `/admin/social`: social workspace and visual support
- `/review/:token`: public approval page

## 5. Architecture Standard

### Core Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Data/state: TanStack Query, dedicated hooks, Supabase client
- Backend: Supabase Auth, Postgres, RLS, Storage, Edge Functions
- Technical visualization: Three.js, OpenCascade.js/WebAssembly, SVG/Canvas rendering
- Charts: Recharts
- Testing: Playwright

### Architectural Principles

- Admin authentication is required for internal workflows.
- Public tokens are only for scoped stakeholder review and must expire.
- Sensitive operations should run through Edge Functions or privileged backend flows.
- RLS and permission checks protect admin data.
- Draft, internal approval, stakeholder approval, and publication are distinct states.
- STEP, 2D, A3, and validation outputs are technical artifacts, not just visuals.

## 6. Module Standards

### 6.1 Email Approval

The approval system is one of the core workflows in the product.

Key files:

- `src/components/admin/content/SendReviewModal.tsx`
- `supabase/functions/send-stakeholder-review/index.ts`
- `supabase/functions/stakeholder-review-action/index.ts`
- `supabase/functions/_shared/stakeholderReviewEmail.ts`

Key rules:

- only content already approved internally should be sent outward;
- tokens must expire;
- public review pages must not expose unnecessary admin data;
- rejection should include enough context for action;
- review suggestions must remain traceable.

### 6.2 Blog Generator and Editor

The blog is a strategic internal product, not a lightweight side tool.

Key files:

- `src/pages/Admin/AdminBlog.tsx`
- `src/components/admin/content/EditorialWorkspace.tsx`
- `src/hooks/useBlogPosts.ts`
- `src/types/blog.ts`
- `supabase/functions/generate-blog-post/index.ts`
- `supabase/functions/generate-blog-images/index.ts`

Editorial rules:

- write in Brazilian Portuguese unless the workflow explicitly asks for another language;
- maintain a technical, engineer-to-engineer tone;
- keep body editing separate from metadata management;
- require ICP and pillar keyword before approval/publication;
- avoid marketing cliches and vague claims.

### 6.3 CRM

The CRM exists to help technical sales representatives act quickly and understand pipeline status.

Key files:

- `src/pages/AdminLeads.tsx`
- `src/components/admin/LeadsCRMBoard.tsx`
- `src/components/admin/LeadsSpreadsheet.tsx`
- `supabase/functions/import-leads/index.ts`
- `supabase/functions/manage-leads-csv/index.ts`

Core states:

- `new`
- `contacted`
- `in_progress`
- `quoted`
- `closed`
- `rejected`

Priorities:

- `low`
- `medium`
- `high`

### 6.4 Analytics

Analytics should answer operational questions, not just display disconnected numbers.

Key files:

- `src/pages/Admin/UnifiedAnalytics.tsx`
- `src/components/admin/analytics/LinkedInCsvUploadPanel.tsx`
- `src/components/admin/analytics/ImportedAnalyticsSummary.tsx`
- `src/hooks/useImportedLinkedInAnalytics.ts`
- `supabase/functions/ingest-linkedin-analytics/index.ts`
- `supabase/functions/sync-ga4-analytics/index.ts`
- `supabase/functions/sync-linkedin-analytics/index.ts`

Known concerns:

- some aggregates may still be computed client-side and should move server-side at higher scale;
- rejected import rows should stay easy to audit;
- reporting should connect metrics to editorial or commercial decisions.

### 6.5 Technical Drawing

Technical drawing is a strategic differentiator because it connects engineering, manufacturing, and technical sales.

Key files:

- `src/components/admin/engineering/TechnicalDrawingCore.tsx`
- `src/components/admin/engineering/EngineeringDrawing3DPreview.tsx`
- `src/lib/engineering-drawing/renderStep.ts`
- `src/lib/engineering-drawing/svg-renderer.ts`
- `src/lib/engineering-drawing/renderA3.ts`
- `src/lib/engineering-drawing/validation.ts`
- `src/lib/engineering-drawing/semantic-validation.ts`
- `src/lib/engineering-drawing/repository.ts`
- `supabase/functions/engineering-drawing/index.ts`

Product rules:

- do not skip human review when ambiguity remains;
- technical exports should depend on minimum validation gates;
- surface pending issues in plain operational language;
- prioritize technical clarity over visual flourish.

### 6.6 Social Content Support

The orchestrator and social workspace remain useful for idea generation, draft preparation, approvals, and controlled visual support.

Approved template families:

- Glassmorphism Card
- Full-Bleed Dark Text
- Split Comparison
- Pure Photo / Equipment Showcase

Rules:

- use real Lifetrek photos whenever possible;
- keep content aligned with approved visual families;
- preserve image variant history;
- do not treat visual generation as the main product promise.

## 7. Data and Contract Surface

### Core Tables

- `stakeholder_review_batches`
- `stakeholder_review_tokens`
- `stakeholder_review_items`
- `blog_posts`
- `blog_categories`
- `contact_leads`
- `linkedin_analytics`
- technical drawing session tables and exported artifacts

### Active Edge Functions

- `send-stakeholder-review`
- `stakeholder-review-action`
- `generate-blog-post`
- `generate-blog-images`
- `ingest-linkedin-analytics`
- `sync-ga4-analytics`
- `sync-linkedin-analytics`
- `import-leads`
- `manage-leads-csv`
- `engineering-drawing`
- `regenerate-carousel-images`
- `set-slide-background`

Visual functions are support capabilities and should be documented that way.

## 8. Documentation Routing

Agents should use documentation in this order:

1. `docs/bmad-standard-documentation.md`
2. `_bmad-output/project-context.md`
3. relevant `_bmad-output/planning-artifacts/*.md`
4. the active story under `_bmad-output/implementation-artifacts/stories/`
5. relevant technical docs under `docs/`
6. `docs/bmad-standard-documentation-pt.md` and `docs/sectors/*.md` only when the task is stakeholder-facing or shareable in Portuguese

Documentation split:

- English: agent-facing, technical, planning, implementation, procedural
- Portuguese: stakeholder-facing, shareable business/product documentation

## 9. Operating Rules

### Secrets

Never expose or commit:

- `SUPABASE_SERVICE_ROLE_KEY`
- `UNIPILE_DSN`
- `UNIPILE_API_KEY`
- `LOVABLE_API_KEY`
- `OPENROUTER_API_KEY`

### LinkedIn Operations

- do not run outreach automation without explicit approval;
- do not revive deprecated Unipile scripts;
- prefer the admin UI for LinkedIn-related operations.

### Image Versioning

- never overwrite existing carousel images;
- always create a new variant with a new filename/timestamp;
- preserve history for comparison and selection.

### Approval and Publication

- content should pass through approval before publication;
- blogs require minimum metadata before approval/publication;
- stakeholder reviews should remain traceable by batch, item, and reviewer.

## 10. Current Strengths and Gaps

Strong enough for internal use:

- stakeholder email approval with tokenized public review;
- admin blog workflow with editorial and SEO fields;
- lead CRM;
- analytics imports and summary views;
- technical drawing with 2D, 3D, and STEP outputs.

Still needs continued improvement:

- editorial quality and UX in the blog generator/editor;
- backend-side analytics aggregation at larger scale;
- clearer import-error auditing;
- ongoing polish in technical drawing UX and review flows.

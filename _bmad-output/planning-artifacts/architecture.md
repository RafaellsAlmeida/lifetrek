---
stepsCompleted: [1, 2, 3, 4, 5, 6]
lastStep: 6
status: 'complete'
completedAt: '2026-04-23'
inputDocuments:
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/prd.md
  - docs/bmad-standard-documentation-pt.md
  - docs/api-contracts.md
  - docs/data-models.md
workflowType: 'architecture'
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-04-23'
---

# Architecture Decision Document

## 1. Current Architecture Framing

Lifetrek is a brownfield React + Supabase application whose primary value lies in operations workflows, not in standalone media editing.

The architecture must therefore optimize for:

1. secure approval flows;
2. editorial control;
3. operational CRM visibility;
4. analytics accessibility;
5. technical drawing reliability;
6. controlled social-support visuals.

## 2. Domain Architecture Overview

### Domain A: Approval and Publishing

- Admin selection and review happen inside `/admin/content-approval`.
- External stakeholders receive branded emails and review public links at `/review/:token`.
- State transitions are persisted in dedicated stakeholder review tables.

### Domain B: Blog and Editorial

- Draft generation occurs via `generate-blog-post`.
- Human editing and metadata control happen in `/admin/blog`.
- Approval/publication state is enforced in app and data contracts.

### Domain C: CRM

- Lead operations center around `contact_leads`.
- UI surfaces include board-style and spreadsheet-style operations.
- Realtime updates should remain compatible with current Supabase subscriptions.

### Domain D: Analytics

- Imported LinkedIn analytics live in `linkedin_analytics`.
- Existing daily/social analytics surfaces may continue in parallel where already implemented.
- The architecture should prefer normalized persistence plus summarized UI views.

### Domain E: Technical Drawing

- Technical drawing is a route-level product area at `/admin/desenho-tecnico`.
- Sessions persist in `engineering_drawing_sessions`.
- Validation, normalized document review, SVG/A3 generation, 3D preview, and STEP-related outputs belong to the same workflow.

### Domain F: Social Support

- Social content generation and visual support remain active.
- Image/version management is append-only.
- Visual support should consume approved templates and real assets first.

## 3. Core Architectural Principles

### 3.1 Brownfield Consistency

- Extend existing React pages, hooks, and Supabase functions.
- Reuse current patterns before creating new abstractions.
- Preserve compatibility with `src/integrations/supabase/types.ts`.

### 3.2 Backend Locality

- All privileged backend logic remains in Supabase Edge Functions.
- No new worker tier, queue system, or separate API service is introduced.

### 3.3 Security and Traceability

- Admin operations remain authenticated.
- Public stakeholder review uses expiring, scoped tokens.
- Approval, publishing, import, and export actions should remain inspectable.

### 3.4 Non-Destructive Data

- Image histories remain append-only.
- Approval decisions remain recorded, not inferred.
- Drawing sessions preserve intermediate and normalized states.

## 4. Data Architecture

### Core Tables by Domain

| Domain | Tables |
| --- | --- |
| Approval | `stakeholder_review_batches`, `stakeholder_review_tokens`, `stakeholder_review_items` |
| Blog | `blog_posts`, `blog_categories` |
| CRM | `contact_leads` |
| Analytics | `linkedin_analytics`, `linkedin_analytics_daily`, `analytics_events`, `blog_analytics`, `lead_behavior_logs` |
| Technical Drawing | `engineering_drawing_sessions` |
| Social Support | `linkedin_carousels`, `instagram_posts`, `content_ideas`, `product_catalog`, `asset_embeddings` |

### Key Data Rules

1. Blog status must remain coherent with approval flow.
2. Stakeholder review records must preserve reviewer identity, expiry, and item-level decisions.
3. Lead records must support realtime operational updates.
4. Analytics imports must remain queryable by period and source.
5. Drawing sessions must preserve normalized documents and export-related artifacts.
6. Social image histories must never be overwritten destructively.

## 5. API and Edge Function Architecture

### Approval

- `send-stakeholder-review`
- `stakeholder-review-action`

### Blog

- `generate-blog-post`
- `generate-blog-images`

### CRM

- `import-leads`
- `manage-leads-csv` (legacy/support)

### Analytics

- `ingest-linkedin-analytics`
- `sync-ga4-analytics`
- `sync-linkedin-analytics`

### Technical Drawing

- `engineering-drawing`

### Social Support

- `regenerate-carousel-images`
- `set-slide-background`

## 6. Frontend Architecture

### Core Admin Routes

| Route | Purpose |
| --- | --- |
| `/admin/content-approval` | internal review, stakeholder send, status visibility |
| `/admin/blog` | editorial management and SEO fields |
| `/admin/leads` | CRM board and spreadsheet operations |
| `/admin/analytics` | reporting and import workflows |
| `/admin/desenho-tecnico` | technical drawing workflow |
| `/admin/social` | social generation and visual support |
| `/admin/image-editor` | legacy/support route, not strategic center |

### Public Route

| Route | Purpose |
| --- | --- |
| `/review/:token` | stakeholder review without admin login |

## 7. Cross-Cutting Concerns

### 7.1 Language

- PT-BR remains the default for relevant user-facing admin and content surfaces.

### 7.2 Cost and Infrastructure

- Stay compatible with current low-cost model and free-tier infra constraints.
- Do not require additional servers or paid orchestration layers.

### 7.3 Branding

- Brand fidelity is enforced by templates, approved assets, and controlled editorial rules.
- Visual-support systems must not drift into uncontrolled style generation.

### 7.4 Operability

- Operators should get actionable feedback for failed imports, failed sends, invalid approvals, and incomplete technical review states.

## 8. Architecture Decisions

### Decision A: Approval is a platform concern

Approval is not a single-feature add-on. It spans social content and blog content and therefore remains a platform-level architecture concern.

### Decision B: Blog is editorial, not auto-publish

The architecture assumes generation accelerates drafting, but humans own editorial review and publication.

### Decision C: CRM and Analytics remain operational peers

CRM and analytics are not side modules. They support the same technical-sales operating model and therefore remain first-class product areas.

### Decision D: Technical Drawing is an operational workflow

The architecture must preserve review, persistence, and export concerns instead of treating the route as a visual experiment.

### Decision E: Visual tools are support scope

Social and visual tooling remain in the architecture, but the system should not be planned or described as a media-editing platform.

## 9. Documentation Architecture

The documentation structure should mirror the product architecture:

1. one master standard document for the whole product;
2. separate sector docs for Approval, Blog, CRM, Analytics, Technical Drawing, and Social Support;
3. supporting technical docs for APIs, data models, and testing.

## 10. Implementation Priorities

1. Approval and publishing coherence.
2. Blog editorial quality and review safety.
3. CRM and analytics operational clarity.
4. Technical drawing polish and confidence.
5. Social support scope containment and visual governance.

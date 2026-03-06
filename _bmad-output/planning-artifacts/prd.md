---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
lastStep: 12
status: 'complete'
completedAt: '2026-03-05'
inputDocuments:
  - _bmad-output/project-context.md
  - docs/product/LIFETREK_PRD.md
  - _bmad-output/planning-artifacts/architecture.md
  - docs/content-engine-guide.md
  - docs/api-contracts.md
  - docs/data-models.md
  - AGENTS.md
workflowType: 'prd'
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-03-05'
---

# Product Requirements Document - Lifetrek (Content Engine 2026)

**Author:** Rafaelalmeida  
**Date:** 2026-03-05  
**Primary Scope:** Content Engine (LinkedIn, Instagram, Blog, Ideation, Analytics)  
**Planning Horizon:** 2026 only

## 1. Executive Summary

Lifetrek will prioritize a production-grade Content Engine in 2026 while preserving existing CRM, website, and operational admin workflows. The immediate objective is to unify content ideation, generation, approval, and performance feedback loops for technical sales operations.

This PRD defines product behavior and business outcomes. It avoids implementation details except where needed to declare external constraints and compatibility rules.

## 2. Product Goals

1. Increase usable, on-brand content output for technical sales.
2. Reduce operator effort to move from idea to approved publication.
3. Improve content relevance through structured ideation and analytics feedback.
4. Preserve stability in existing domains not in build scope.

## 3. Scope Definition

### 3.1 In Scope (2026)

1. Ideation with optional deep research mode.
2. LinkedIn carousel generation pipeline.
3. Instagram post generation through shared pipeline with platform-specific copy behavior.
4. Blog draft generation with hero image generation and approval publishing flow.
5. LinkedIn CSV analytics ingestion and analytics feedback surface.
6. Orchestrator dual entry model: structured form + natural-language chat.
7. Content approval flow hardening.
8. Guardrails for image versioning and real-asset-first background selection.
9. Human editing surfaces for blog posts and resources inside admin workflows.

### 3.2 Explicit Out of Scope (2026)

1. New CRM feature expansion (lead scoring model redesign, new enrichment pipelines).
2. Public website redesign or information architecture changes.
3. Infrastructure changes requiring new paid services or non-approved hosting.
4. LinkedIn analytics ML optimization layer beyond ingestion/normalized reporting.

### 3.3 No-Regression Constraints (Cross-Domain)

1. CRM behavior remains functionally equivalent for existing users.
2. Public website behavior and SEO-critical paths remain intact.
3. Existing admin tools outside Content Engine remain available.
4. Existing generated content records remain accessible and editable.

## 4. Target Users

1. Technical Sales Representative (primary daily user).
2. Content Reviewer/Approver (quality and publication gatekeeper).
3. Admin Operator (maintenance and troubleshooting).

## 5. Functional Requirements

### FR Catalog

**FR-001 Ideation Deep Research Mode**  
The system shall support ideation with an optional deep research mode that generates ICP pain-point-driven content ideas.

**FR-002 Ideation Persistence**  
The system shall persist generated ideas with topic, ICP context, and traceable source references.

**FR-003 Orchestrator Form Entry**  
The system shall keep structured form-based content generation as a fully supported entry path.

**FR-004 Orchestrator Chat Entry**  
The system shall support natural-language chat entry that can resolve intent into valid generation parameters.

**FR-005 LinkedIn Generation Pipeline**  
The system shall generate LinkedIn carousels through the approved multi-agent pipeline and save complete content artifacts.

**FR-006 Instagram Generation via Shared Pipeline**  
The system shall generate Instagram content using the same core pipeline with platform-specific copy and output settings.

**FR-007 Blog Draft Generation**  
The system shall generate blog drafts in PT-BR suitable for internal review.

**FR-008 Blog Hero Image at Creation**  
The system shall generate a hero image during blog post creation and attach it to the draft record.

**FR-009 Blog Approval Publishing Flow**  
The system shall support approval-based publication where approved posts become published immediately with publication timestamps.

**FR-010 Blog Hero Backfill Batch**  
The system shall support batch generation of hero images for existing blog posts missing hero images.

**FR-011 LinkedIn Analytics CSV Upload**  
The system shall allow upload of LinkedIn analytics CSV files from the admin analytics workflow.

**FR-012 LinkedIn Analytics Normalized Persistence**  
The system shall parse and persist analytics rows into a normalized analytics dataset for future reporting.

**FR-013 Analytics Feedback Visibility**  
The system shall provide visibility of imported analytics data for operational decision-making.

**FR-014 Approval Queue Integration**  
The system shall include content items requiring review in a consistent approval workflow.

**FR-015 Image Versioning Guardrail**  
The system shall preserve existing carousel slide images and add new image variants as append-only versions.

**FR-016 Real Asset First Background Selection**  
The system shall prioritize real Lifetrek/facility assets before AI fallback for slide backgrounds.

**FR-017 Cost Tracking Coverage**  
The system shall register cost tracking for AI calls relevant to content workflows.

**FR-018 Access Control and Auditability**  
The system shall enforce authenticated admin-only write operations for sensitive content and analytics actions.

**FR-019 Human Editing for Blogs and Resources**  
The system shall provide human-editable admin surfaces for blog posts and resources, including edit entry from approval workflows.

## 6. Non-Functional Requirements

**NFR-001 Cost Ceiling Compatibility**  
The solution shall remain compatible with free-tier hosting constraints and approved low-cost model usage.

**NFR-002 Event-Driven Behavior**  
The solution shall avoid polling-based architecture for new content workflows.

**NFR-003 Language Fidelity**  
Generated content shall enforce PT-BR output where user-facing content is produced.

**NFR-004 Brand Fidelity**  
Visual output shall remain constrained to approved templates, color palette, and Satori-locked composition rules.

**NFR-005 Data Integrity**  
Content history (especially image variants) shall be append-safe and non-destructive.

**NFR-006 Security**  
Sensitive operations shall require authenticated and authorized admin context.

**NFR-007 Operability**  
Error states shall be actionable for non-technical operators with clear recovery paths.

**NFR-008 Performance**  
Common admin operations (open workspace tabs, load generated records, start generation jobs) shall remain responsive under typical team usage.

**NFR-009 Traceability**  
Generated artifacts and workflow decisions shall be traceable to source actions and timestamps.

**NFR-010 Compatibility**  
New changes shall not break existing content records, current routes, or operational dashboards.

## 7. User Journeys

### Journey A: Idea to LinkedIn Carousel

1. User opens orchestrator (form or chat).
2. User defines topic or requests ideation support.
3. System generates strategy, copy, design guidance, and composed slides.
4. User reviews and sends for approval.
5. Approved content remains available for iteration and analytics linkage.

### Journey B: Blog Draft to Publication

1. User initiates blog generation.
2. System creates PT-BR draft and hero image.
3. Draft appears in approval queue.
4. Reviewer approves item.
5. Post is immediately published with proper status and timestamp fields.

### Journey C: Analytics Feedback Loop

1. User uploads monthly LinkedIn CSV.
2. System validates and ingests rows.
3. System stores normalized analytics data.
4. User views imported performance and uses insights for future planning.

## 8. Data and Contract Requirements

### 8.1 Data Contracts (Product-Level)

1. `content_ideas`: persisted ideation records for operator reuse.
2. `linkedin_analytics`: normalized analytics dataset from CSV ingestion.
3. `blog_posts`: status + hero image behavior aligned with approval publishing flow.
4. `image_variants` behavior: append-only versions for regenerated carousel images.

### 8.2 Function/API Contracts (Product-Level)

1. `generate-linkedin-carousel` must accept platform context and preserve current LinkedIn behavior.
2. `generate-blog-post` must support hero generation during post creation.
3. `generate-blog-images` must support controlled backfill use cases.
4. `ingest-linkedin-analytics` must accept CSV-uploaded analytics payloads and persist normalized rows.
5. `chat` must support intent routing to content generation parameters.

### 8.3 UI Contract Requirements

1. `/admin/orchestrator`: form and chat entry consistency.
2. `/admin/social`: platform toggle behavior and generation continuity.
3. `/admin/content-approval`: approval queue supports blog and social content items.
4. `/admin/analytics`: upload contract and ingestion result visibility.
5. `/admin/blog` and `/admin/resources`: human editing of core fields and publication status.

## 9. Success Metrics (2026)

1. Higher rate of content pieces moving from draft to approved status.
2. Reduction in operator time from topic input to review-ready output.
3. Increase in analytics-informed content iterations.
4. Zero critical regressions in CRM and website baseline workflows.

## 10. Risks and Mitigations

1. **Risk:** New content flows break existing admin pages.  
   **Mitigation:** explicit guardrail stories + regression checks.
2. **Risk:** Analytics CSV variability causes ingestion failures.  
   **Mitigation:** schema validation and clear operator errors.
3. **Risk:** Brand drift in generated visuals.  
   **Mitigation:** strict template and Satori composition constraints.
4. **Risk:** Cost increase from uncontrolled AI calls.  
   **Mitigation:** mandatory cost tracking and constrained model policy.

## 11. 2026 Roadmap Phases

### Phase 1 (Q1 2026): Data and Pipeline Foundation

1. Introduce core data contracts for ideas, analytics, and blog hero/status alignment.
2. Harden generation function contracts and guardrails.

### Phase 2 (Q2 2026): Analytics Loop and Approval Robustness

1. Productionize CSV ingestion workflow.
2. Strengthen approval and feedback visibility.

### Phase 3 (Q3-Q4 2026): UX Hardening and Operational Scale

1. Refine orchestrator chat/form parity.
2. Improve operator-safe recovery states and cross-domain regression confidence.

## 12. Requirement Traceability Anchor

This PRD is the source document for:

1. Architecture alignment updates in `_bmad-output/planning-artifacts/architecture.md`.
2. UX design details in `_bmad-output/planning-artifacts/ux-design-specification.md`.
3. Epic/story decomposition in `_bmad-output/planning-artifacts/epics.md`.
4. Sprint tracking and story execution artifacts in `_bmad-output/implementation-artifacts/`.

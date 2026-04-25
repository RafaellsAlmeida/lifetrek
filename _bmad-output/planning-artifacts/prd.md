---
stepsCompleted: [1, 2, 3, 4, 5, 6]
lastStep: 6
status: 'complete'
completedAt: '2026-04-23'
inputDocuments:
  - _bmad-output/project-context.md
  - docs/bmad-standard-documentation.md
  - docs/project-overview.md
  - docs/api-contracts.md
  - docs/data-models.md
  - AGENTS.md
workflowType: 'prd'
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-04-23'
---

# Product Requirements Document - Lifetrek Operations Platform 2026

**Author:** Rafaelalmeida
**Date:** 2026-04-23
**Primary Scope:** Approval, Blog, CRM, Analytics, Technical Drawing, Social Support
**Planning Horizon:** 2026

## 1. Executive Summary

Lifetrek is an internal operations platform for Lifetrek Medical. The product must support technical sales, content review, editorial production, analytics, and engineering workflows from a single administrative environment.

The older documentation framed the product primarily as a content-engine plus visual-editing environment. That is no longer the correct product story. Image and video editing are not strategic pillars. The platform’s real value is in:

1. stakeholder approval by email;
2. blog generation and editorial review;
3. CRM visibility and lead operations;
4. analytics and reporting;
5. technical drawing;
6. controlled social content support.

## 2. Product Goals

1. Reduce friction from draft creation to approved, shareable content.
2. Improve the quality and control of technical blog output.
3. Give commercial teams a reliable CRM and pipeline view.
4. Make analytics actionable for editorial and commercial planning.
5. Support technical drawing workflows with validation and export confidence.
6. Preserve brand consistency while reducing dependence on manual content coordination.

## 3. Scope Definition

### 3.1 In Scope

1. Stakeholder email approval batches and public review links.
2. Blog draft generation, editing, approval, and publication controls.
3. CRM lead management, import/export, and stage visibility.
4. Analytics ingestion and visibility for website, LinkedIn, and leads.
5. Technical drawing sessions, validation, 2D/3D outputs, and STEP export.
6. Social content generation and asset-governed visual support.

### 3.2 Explicit Out of Scope

1. Rebuilding the product around advanced image editing.
2. Rebuilding the product around video editing.
3. Public website redesign as part of this planning cycle.
4. New infrastructure that requires extra paid servers, queues, or workers.
5. Bulk outreach automation without explicit approval.

### 3.3 No-Regression Constraints

1. Existing admin routes must remain operational.
2. Existing blog, CRM, analytics, and technical drawing data must remain accessible.
3. Existing content records and image histories must remain non-destructive.
4. Security posture for admin-only actions must not weaken.

## 4. Primary Users

1. **Technical Sales Representatives**: need CRM, content, and analytics visibility.
2. **Content/Marketing Operators**: need generation, editing, approval, and publishing flows.
3. **Stakeholders/Reviewers**: need low-friction review without admin login.
4. **Engineering/Technical Operators**: need drawing review, validation, and export tools.
5. **Admins**: need visibility, auditability, and operational safety.

## 5. Functional Requirements

### Approval and Publishing

**FR-001 Stakeholder Batch Creation**
The system shall allow an admin to select approved content and create a stakeholder review batch.

**FR-002 Branded Email Delivery**
The system shall send branded review emails to stakeholders with content summaries and secure links.

**FR-003 Token-Based Public Review**
The system shall allow stakeholders to review items via expiring token links without admin login.

**FR-004 Stakeholder Actions**
The public review flow shall support approve, reject, and edit-suggestion actions per item.

**FR-005 Approval Visibility in Admin**
The admin UI shall display stakeholder review statuses and outcomes in a traceable way.

### Blog and Editorial

**FR-006 PT-BR Blog Draft Generation**
The system shall generate PT-BR technical blog drafts suitable for internal editorial review.

**FR-007 Editorial Metadata Control**
The blog editor shall support ICP, pillar keyword, entity keywords, CTA mode, SEO title, SEO description, tags, and status controls.

**FR-008 Human Approval Before Publication**
The system shall require human approval before a blog post is published.

**FR-009 Publication Traceability**
Approved/published blog posts shall preserve publication timestamps and approval metadata.

### CRM

**FR-010 Lead Pipeline Visibility**
The system shall provide a stage-based CRM view for leads.

**FR-011 Lead Detail Editing**
The system shall support operational editing of lead priority, status, company, and supporting notes/fields.

**FR-012 Lead Import/Export**
The system shall support CSV-based import/export for operational lead workflows.

### Analytics

**FR-013 LinkedIn Analytics Ingestion**
The system shall allow validation and ingestion of LinkedIn analytics files.

**FR-014 Analytics Visibility**
The system shall expose imported and internal analytics in a way that supports editorial and commercial decisions.

**FR-015 Cross-Domain Reporting**
The analytics area shall connect content, website, and lead signals where data is available.

### Technical Drawing

**FR-016 Drawing Session Persistence**
The system shall persist technical drawing sessions and their normalized document state.

**FR-017 Drawing Validation Flow**
The system shall support review and validation gates before technical export actions.

**FR-018 Technical Exports**
The system shall support 2D, A3, 3D preview, and STEP-related outputs where the current module supports them.

### Social Support

**FR-019 Social Content Support**
The system shall continue supporting social content generation and editing workflows for LinkedIn and Instagram.

**FR-020 Approved Template Enforcement**
The system shall constrain social visuals to approved Lifetrek templates and asset rules.

**FR-021 Append-Only Image Versioning**
The system shall preserve historical image variants and avoid destructive overwrites.

## 6. Non-Functional Requirements

**NFR-001 Cost Ceiling Compatibility**
The solution shall remain compatible with free-tier hosting and approved low-cost model usage.

**NFR-002 Brownfield Compatibility**
New work shall extend existing architecture rather than replacing it.

**NFR-003 Language Fidelity**
PT-BR shall remain the default language for relevant user-facing content.

**NFR-004 Security**
Sensitive operations shall require authenticated and authorized admin context or tightly scoped public tokens.

**NFR-005 Traceability**
Approval, publication, import, and export actions shall remain traceable.

**NFR-006 Non-Destructive History**
Image variants and major approval decisions shall remain historically inspectable.

**NFR-007 Operability**
Non-technical operators shall be able to recover from common failures without developer intervention.

**NFR-008 Documentation Clarity**
The product shall be documented with one master standard plus sector-specific references.

## 7. Core User Journeys

### Journey A: Internal Review to Stakeholder Approval

1. Admin selects approved content.
2. Admin sends a stakeholder batch.
3. Stakeholders receive branded emails.
4. Stakeholders approve, reject, or suggest copy edits from a public page.
5. Admin sees the result in the approval queue.

### Journey B: Blog Draft to Publication

1. Operator generates a technical draft.
2. Operator edits the draft and metadata in Admin Blog.
3. Reviewer validates technical quality and SEO.
4. Content moves through approval.
5. Approved content is published with traceability.

### Journey C: Lead Pipeline Management

1. Lead arrives or is imported.
2. Sales/operator reviews lead in CRM board or spreadsheet.
3. Team updates stage, priority, and notes.
4. Pipeline view remains current and visible.

### Journey D: Analytics-Informed Iteration

1. Operator uploads or syncs analytics.
2. System validates and stores metrics.
3. Team reviews top-performing content and lead signals.
4. Editorial/commercial decisions are adjusted.

### Journey E: Technical Drawing Delivery

1. User creates a drawing session from a croqui or reference.
2. System structures the normalized document.
3. Human review resolves ambiguity.
4. User generates technical outputs and exports.

## 8. Data and Contract Requirements

### 8.1 Data Contracts

1. `stakeholder_review_batches`
2. `stakeholder_review_tokens`
3. `stakeholder_review_items`
4. `blog_posts`
5. `blog_categories`
6. `contact_leads`
7. `linkedin_analytics`
8. `engineering_drawing_sessions`
9. social content tables and append-only image variants

### 8.2 Function/API Contracts

1. `send-stakeholder-review`
2. `stakeholder-review-action`
3. `generate-blog-post`
4. `generate-blog-images`
5. `import-leads`
6. `ingest-linkedin-analytics`
7. `sync-ga4-analytics`
8. `sync-linkedin-analytics`
9. `engineering-drawing`
10. visual-support contracts such as `regenerate-carousel-images` and `set-slide-background`

### 8.3 UI Contract Requirements

1. `/admin/content-approval`
2. `/review/:token`
3. `/admin/blog`
4. `/admin/leads`
5. `/admin/analytics`
6. `/admin/desenho-tecnico`
7. `/admin/social`

## 9. Success Metrics

1. Higher share of content reaching stakeholder-approved or published states.
2. Lower friction between blog draft creation and approved publication.
3. Better visibility of active leads and pipeline stages.
4. Consistent use of analytics in content and sales planning.
5. Higher confidence in technical drawing output readiness.

## 10. Risks and Mitigations

1. **Risk:** old visual-first assumptions keep leaking into product direction.
   **Mitigation:** canonical docs now position visual generation as support only.

2. **Risk:** approval and publication state drift across content types.
   **Mitigation:** status handling and admin visibility remain first-class requirements.

3. **Risk:** analytics remain informational but not actionable.
   **Mitigation:** planning docs and UX must tie metrics to decisions and next actions.

4. **Risk:** technical drawing is treated as a demo rather than an operational workflow.
   **Mitigation:** preserve review gates, validation, persistence, and export requirements.

## 11. Documentation Strategy

The documentation model for this product shall have two layers:

1. **Master standard:** one shared product/technical standard for the whole team.
2. **Sector docs:** separate docs for Approval, Blog, CRM, Analytics, Technical Drawing, and Social Support.

## 12. Traceability

This PRD is the source document for:

1. `_bmad-output/planning-artifacts/architecture.md`
2. `_bmad-output/planning-artifacts/ux-design-specification.md`
3. `_bmad-output/planning-artifacts/epics.md`
4. `docs/bmad-standard-documentation.md`
5. `docs/bmad-standard-documentation-pt.md`
6. `docs/sectors/*.md`

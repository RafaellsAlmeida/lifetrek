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

---
stepsCompleted:
  [
    'step-01-realign-scope',
    'step-02-design-epics',
    'step-03-create-story-map',
    'step-04-final-validation',
  ]
lastStep: 'step-04-final-validation'
status: 'complete'
completedAt: '2026-04-23'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/project-context.md
workflowType: 'create-epics-and-stories'
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-04-23'
---

# Lifetrek - Epic Breakdown

## Overview

This epic map reflects the current product direction: approval, editorial workflows, CRM, analytics, technical drawing, and social support.

## Requirements Inventory

### Functional Requirements

FR-001 Stakeholder Batch Creation
FR-002 Branded Email Delivery
FR-003 Token-Based Public Review
FR-004 Stakeholder Actions
FR-005 Approval Visibility in Admin
FR-006 PT-BR Blog Draft Generation
FR-007 Editorial Metadata Control
FR-008 Human Approval Before Publication
FR-009 Publication Traceability
FR-010 Lead Pipeline Visibility
FR-011 Lead Detail Editing
FR-012 Lead Import/Export
FR-013 LinkedIn Analytics Ingestion
FR-014 Analytics Visibility
FR-015 Cross-Domain Reporting
FR-016 Drawing Session Persistence
FR-017 Drawing Validation Flow
FR-018 Technical Exports
FR-019 Social Content Support
FR-020 Approved Template Enforcement
FR-021 Append-Only Image Versioning

### Non-Functional Requirements

NFR-001 Cost Ceiling Compatibility
NFR-002 Brownfield Compatibility
NFR-003 Language Fidelity
NFR-004 Security
NFR-005 Traceability
NFR-006 Non-Destructive History
NFR-007 Operability
NFR-008 Documentation Clarity

## Epic List

### Epic 1: Approval and Publishing

Establish a stable, traceable approval system for internal and external reviewers.

**FRs covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-008, FR-009

### Epic 2: Blog and Editorial System

Improve the quality and controllability of technical blog generation, editing, SEO, and publication.

**FRs covered:** FR-006, FR-007, FR-008, FR-009

### Epic 3: CRM and Lead Operations

Strengthen day-to-day lead visibility, editing, and import/export workflows.

**FRs covered:** FR-010, FR-011, FR-012

### Epic 4: Analytics and Reporting

Make imported and internal analytics visible and useful for decision-making.

**FRs covered:** FR-013, FR-014, FR-015

### Epic 5: Technical Drawing Workflow

Polish the technical drawing system so review, validation, and export flows remain trustworthy.

**FRs covered:** FR-016, FR-017, FR-018

### Epic 6: Social Content Support and Visual Governance

Keep social generation productive while containing it within approved asset and template rules.

**FRs covered:** FR-019, FR-020, FR-021

## Epic 1: Approval and Publishing

### Story 1.1: Stakeholder Batch Send

As an admin reviewer,
I want to create and send stakeholder review batches,
So that external stakeholders can review approved content quickly.

**Acceptance Criteria:**

1. Given approved items are selected, when the batch is sent, then branded review emails are generated and delivered.
2. Given batch creation fails, when the operation ends, then partial state is not left in an ambiguous status.
3. Given a batch exists, when viewed in admin, then item-level and batch-level states are visible.

### Story 1.2: Public Token Review

As a stakeholder,
I want to review content via a secure public link,
So that I can approve, reject, or suggest edits without admin login.

**Acceptance Criteria:**

1. Given a valid token, when the review page loads, then the stakeholder sees only the items in scope.
2. Given a stakeholder action, when submitted, then the system records item-level traceability.
3. Given an invalid or expired token, when accessed, then the page shows a clear non-admin recovery state.

### Story 1.3: Approval Queue Coherence

As an admin operator,
I want internal and stakeholder approval states to be coherent in the admin UI,
So that I can understand what still needs action.

**Acceptance Criteria:**

1. Given stakeholder review is pending, when the queue loads, then the item state is clearly distinguished from internal approval.
2. Given a stakeholder rejects or edits, when admin revisits the item, then the decision is visible and actionable.
3. Given blog and social items coexist, when the queue is filtered, then status behavior stays consistent across types.

## Epic 2: Blog and Editorial System

### Story 2.1: Technical Draft Quality

As a content operator,
I want technical blog drafts generated in PT-BR with usable structure,
So that editing starts from a strong first version.

**Acceptance Criteria:**

1. Given a topic and context, when generation completes, then the draft includes title, summary, content, and SEO fields.
2. Given missing supporting context, when generation completes, then the article still remains reviewable rather than failing silently.
3. Given PT-BR output is expected, when generation completes, then the article language remains consistent.

### Story 2.2: Editorial Metadata Controls

As an editor,
I want to manage ICP, pillar keyword, entities, CTA, and SEO metadata,
So that approval is tied to real editorial readiness.

**Acceptance Criteria:**

1. Given a blog draft, when edited, then the operator can manage all key metadata fields.
2. Given required metadata is missing, when approval is attempted, then the system blocks publication and explains why.
3. Given a post is approved, when published, then publication metadata remains consistent.

### Story 2.3: Blog Editorial Feedback Loop

As a reviewer,
I want analytics and approval context to inform blog iteration,
So that the blog becomes an operational content asset instead of a draft dump.

**Acceptance Criteria:**

1. Given a blog is under review, when opened from approval or analytics context, then the editor retains enough context to continue work.
2. Given a blog performs well or poorly, when reviewed, then operators can use that context in future editorial planning.
3. Given image support exists, when used, then it remains subordinate to editorial quality and approval.

## Epic 3: CRM and Lead Operations

### Story 3.1: CRM Board Reliability

As a technical sales rep,
I want a reliable stage-based CRM view,
So that I can understand pipeline state quickly.

**Acceptance Criteria:**

1. Given leads exist, when the board loads, then status-based columns and KPIs are visible.
2. Given lead fields change, when updated, then the board and related views stay in sync.
3. Given realtime updates occur, when other users make changes, then the board reflects them safely.

### Story 3.2: Lead Import and Export

As an operator,
I want to import and export leads safely,
So that operational work can move between systems without corrupting the CRM.

**Acceptance Criteria:**

1. Given a valid CSV import, when processed, then leads are normalized and inserted or updated safely.
2. Given invalid rows, when import completes, then errors are visible and accepted rows remain valid.
3. Given export is requested, when completed, then the output supports downstream operational use.

### Story 3.3: Lead Detail Hygiene

As a sales operator,
I want priority, company, source, and technical context to remain usable,
So that CRM records support actual follow-up work.

**Acceptance Criteria:**

1. Given a lead record is edited, when saved, then key operational fields stay structured and visible.
2. Given filters or search are used, when results render, then records remain easy to scan.
3. Given analytics or reporting consume lead data, when queried, then the CRM fields remain compatible.

## Epic 4: Analytics and Reporting

### Story 4.1: LinkedIn Ingestion Flow

As an analytics operator,
I want a clear validation and import flow for LinkedIn files,
So that monthly reporting remains repeatable.

**Acceptance Criteria:**

1. Given a file is uploaded, when validation runs, then accepted and rejected rows are made explicit.
2. Given conflict policy is needed, when importing, then the operator can choose the intended behavior.
3. Given ingest finishes, when results render, then period and row outcomes are visible.

### Story 4.2: Reporting Visibility

As a strategist,
I want analytics summarized in a readable way,
So that planning decisions can use real metrics.

**Acceptance Criteria:**

1. Given imported data exists, when analytics loads, then latest-period and top-post summaries are visible.
2. Given website and lead signals exist, when the page loads, then they contribute to the reporting surface.
3. Given no data exists, when analytics is opened, then empty states explain what action is needed.

### Story 4.3: Decision-Oriented Analytics

As an operations owner,
I want analytics tied to next decisions,
So that reports help prioritize content, leads, and follow-up actions.

**Acceptance Criteria:**

1. Given content metrics are available, when reviewed, then operators can identify which themes or items deserve follow-up.
2. Given lead behavior is available, when reviewed, then the team can connect activity to commercial outcomes.
3. Given volume grows, when architecture is reviewed, then heavy aggregation is migrated away from expensive client-side patterns.

## Epic 5: Technical Drawing Workflow

### Story 5.1: Session and Document Reliability

As a technical operator,
I want drawing sessions and normalized documents preserved,
So that work is resumable and auditable.

**Acceptance Criteria:**

1. Given a session is created, when work progresses, then the session persists its evolving technical state.
2. Given the normalized document changes, when revisited, then the latest reviewed state is recoverable.
3. Given exports depend on reviewed state, when gates are not met, then the system blocks them clearly.

### Story 5.2: Review and Validation Gates

As a reviewer,
I want explicit validation and ambiguity handling,
So that the system does not overstate certainty.

**Acceptance Criteria:**

1. Given ambiguity exists, when the drawing workflow proceeds, then review is required before downstream export steps.
2. Given validation errors exist, when surfaced, then the operator can understand them without reading implementation details.
3. Given review is complete, when export paths unlock, then the state change is explicit.

### Story 5.3: Technical Output Confidence

As an engineering user,
I want 2D, A3, 3D, and STEP outputs to feel trustworthy,
So that the module is usable in real technical workflows.

**Acceptance Criteria:**

1. Given a reviewed session, when outputs are generated, then technical artifacts are downloadable or viewable as expected.
2. Given the 3D preview loads, when used, then it represents the reviewed session rather than stale data.
3. Given UX polish items remain, when prioritized, then stepper clarity, export hierarchy, and text-overlap issues are addressed.

## Epic 6: Social Content Support and Visual Governance

### Story 6.1: Social Generation Support

As a content operator,
I want social generation to remain productive,
So that the team can keep producing support content without the product becoming visual-tool-first.

**Acceptance Criteria:**

1. Given a generation request, when completed, then LinkedIn or Instagram output remains usable.
2. Given the route is used operationally, when content is approved, then it connects cleanly to approval workflows.
3. Given other domains are prioritized, when planning continues, then social support does not displace core operational modules.

### Story 6.2: Asset-First Visual Governance

As a brand owner,
I want approved templates and real assets enforced,
So that visuals remain consistent and credible.

**Acceptance Criteria:**

1. Given a slide needs a background, when selection runs, then real assets are preferred first.
2. Given regeneration occurs, when the new image is created, then template and brand constraints stay intact.
3. Given image history exists, when operators switch variants, then no destructive overwrite occurs.

### Story 6.3: Legacy Visual Scope Containment

As a product owner,
I want older visual-editing capabilities documented as support or legacy,
So that the roadmap stays focused.

**Acceptance Criteria:**

1. Given documentation is updated, when the product is described, then image/video editing is not presented as a primary pillar.
2. Given support visual routes still exist, when referenced, then their scope is clearly bounded.
3. Given team-facing docs are shared, when operators read them, then sector priorities are unambiguous.

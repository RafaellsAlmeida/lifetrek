---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
lastStep: 14
status: 'complete'
completedAt: '2026-03-05'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/project-context.md
  - docs/brand/BRAND_BOOK.md
  - docs/content-engine-guide.md
workflowType: 'ux-design'
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-03-05'
---

# UX Design Specification - Lifetrek Content Engine 2026

**Author:** Rafaelalmeida  
**Date:** 2026-03-05  
**Primary Users:** Technical Sales Representatives and Content Review Operators

## 1. UX Objectives

1. Make content workflows understandable to non-technical operators.
2. Preserve speed for power users generating recurring content.
3. Prevent destructive actions in content/image workflows.
4. Surface clear next actions when generation or ingestion fails.

## 2. Core UX Principles

1. **Dual-entry parity:** form and chat entry in orchestrator should produce equivalent outcomes.
2. **Operator-safe defaults:** preselect safest generation options and require explicit confirmation for costly/batch actions.
3. **Non-destructive editing:** regenerated visual outputs are additive (new variants) and reversible.
4. **Progress transparency:** asynchronous operations must show state, elapsed phase, and actionable errors.
5. **Brand and language consistency:** PT-BR content output and approved visual constraints remain visible in context.

## 3. Route-Level Design

### 3.1 `/admin/orchestrator`

#### Primary Jobs

1. Start generation from structured form.
2. Start generation from chat/natural language.
3. Compare and approve generated outputs.

#### Required Interaction Patterns

1. Entry mode toggle (Form / Chat) persists during the session.
2. Chat intent summary is shown before generation starts.
3. Generation progress panel shows stage transitions.
4. Completion state links directly to edit/approval workflow.

#### Failure States

1. Invalid prompt context: show field-level guidance with one-click correction suggestions.
2. Generation timeout: show retry action with preserved inputs.
3. Model/provider error: show fallback guidance and correlation identifier.

### 3.2 `/admin/social`

#### Primary Jobs

1. Generate LinkedIn or Instagram content.
2. Edit slide-level output safely.
3. Manage regenerated backgrounds and variant selection.

#### Required Interaction Patterns

1. Platform toggle (LinkedIn / Instagram) updates copy constraints and output dimensions.
2. Variant history panel is available for each slide.
3. “Use variant” action updates active image without deleting previous versions.
4. Template lock indicator confirms allowed visual style constraints.

#### Failure States

1. Missing real-asset match: system explains fallback path and provenance.
2. Regeneration failure: keep previous active image and suggest retry.
3. Unsupported template request: explain approved template set and nearest valid option.

### 3.3 `/admin/content-approval`

#### Primary Jobs

1. Review pending content items (social + blog).
2. Approve or request revisions.
3. Confirm publication-impacting actions.

#### Required Interaction Patterns

1. Queue grouping by content type and status.
2. Side-by-side preview of draft metadata and generated assets.
3. Approval confirmation modal for publish-impacting actions.
4. Activity log entry for each approval decision.

#### Failure States

1. Invalid publish state transition: block action and show required prerequisites.
2. Missing mandatory metadata: explain missing fields and provide direct edit link.

### 3.4 `/admin/analytics`

#### Primary Jobs

1. Upload LinkedIn CSV.
2. Validate file shape before ingestion.
3. Review ingestion result summary and errors.

#### Required Interaction Patterns

1. Upload widget with schema hints and sample format link.
2. Pre-ingestion validation summary (rows accepted/rejected).
3. Post-ingestion report with row counts and detected period.
4. Error export option for rejected rows.

#### Failure States

1. CSV schema mismatch: show column-level mismatch details.
2. Duplicate period upload: show merge/overwrite policy and require explicit choice.
3. Partial ingest failure: persist successful rows and report failed subset.

## 4. Information Architecture

1. **Create:** orchestrator + social generation entry.
2. **Edit:** social slide/editor workflows.
3. **Approve:** content approval queue.
4. **Measure:** analytics upload and insight surfaces.

Navigation labels should map to operator verbs: `Create`, `Edit`, `Approve`, `Measure`.

## 5. Key UX Flows

### Flow A: Chat to Generation

1. User selects Chat mode.
2. User enters intent in natural language.
3. System shows interpreted parameters (topic, platform, objective).
4. User confirms and starts generation.
5. System shows staged progress.
6. User receives completed artifact and next-step actions.

### Flow B: Safe Slide Regeneration

1. User opens slide editor.
2. User requests background regeneration.
3. System creates new variant and keeps prior active variant.
4. User previews old/new variants.
5. User chooses active variant.
6. System logs change without destructive overwrite.

### Flow C: Analytics Upload to Feedback

1. User uploads CSV.
2. System validates schema and period.
3. User confirms ingest.
4. System persists accepted rows and reports rejects.
5. User views summary and can navigate to related planning context.

## 6. Accessibility and Usability Requirements

1. Interactive controls must be keyboard accessible.
2. Status and error messaging must be available to assistive technology.
3. Color-only signaling is not allowed for critical states.
4. Contrast and focus states must remain visible across admin workflows.
5. Validation errors must point to exact offending fields/columns.

## 7. Operator-Safe Defaults

1. Default generation mode emphasizes lower-cost, known-safe behavior.
2. Destructive operations require confirmation dialogs.
3. Batch operations require explicit scope preview before execution.
4. Approval actions display irreversible consequences clearly.
5. Retry actions preserve user input by default.

## 8. UX Acceptance Criteria

1. Form and chat entries in orchestrator reach equivalent generation endpoints.
2. No regeneration action deletes historical variants.
3. Approval workflow supports both blog and social items without mode confusion.
4. Analytics upload provides actionable error reports for failed rows.
5. Non-technical operator can recover from common failures without developer support.

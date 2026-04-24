---
stepsCompleted: [1, 2, 3, 4, 5, 6]
lastStep: 6
status: 'complete'
completedAt: '2026-04-23'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/project-context.md
  - docs/brand/BRAND_BOOK.md
workflowType: 'ux-design'
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-04-23'
---

# UX Design Specification - Lifetrek Operations Platform 2026

**Author:** Rafaelalmeida
**Date:** 2026-04-23
**Primary Users:** Technical sales representatives, content operators, stakeholders, engineering reviewers

## 1. UX Objectives

1. Make the admin app feel like one coherent operations workspace.
2. Keep approval and publication decisions obvious and low-risk.
3. Make blog and CRM workflows efficient for repeat users.
4. Make analytics and technical drawing states understandable to non-developers.
5. Keep social visual support contained and predictable.

## 2. Core UX Principles

1. **Operational clarity first:** every major screen should answer “what needs action now?”
2. **Approval-aware design:** publishing and stakeholder review must remain explicit.
3. **Non-destructive behavior:** image history and technical states should not disappear silently.
4. **Contextual editing:** users should arrive in editors with enough surrounding context to finish the job.
5. **Support scope honesty:** social visuals are important, but not the primary narrative of the app.

## 3. Information Architecture

### Top-Level Product Areas

1. **Aprovação**
2. **Blog**
3. **Leads / CRM**
4. **Analytics**
5. **Desenho Técnico**
6. **Social Support**

The navigation should make these areas legible as distinct workflows rather than a single undifferentiated admin list.

## 4. Route-Level Design

### 4.1 `/admin/content-approval`

#### Primary Jobs

1. Review internal content state.
2. Send stakeholder review batches.
3. See stakeholder outcomes.
4. Approve, reject, or redirect work.

#### Required Interaction Patterns

1. Queue grouping by type and status.
2. Fast access to edit screens for blog/social items.
3. Clear stakeholder status badges and summaries.
4. Explicit send action for stakeholder batches.

#### Failure States

1. Missing approval prerequisites.
2. Invalid publish/send state.
3. Email send failure or partial-batch risk.

### 4.2 `/review/:token`

#### Primary Jobs

1. Let stakeholders review content without admin login.
2. Make approve/reject/edit actions obvious.
3. Handle expired/invalid links safely.

#### Required Interaction Patterns

1. Clean item cards with enough context to decide.
2. Separate actions for approve, reject, and edit suggestion.
3. Visible token state and expiration messaging when relevant.

#### Failure States

1. Invalid token.
2. Expired token.
3. Previously completed token/item.

### 4.3 `/admin/blog`

#### Primary Jobs

1. Generate and edit blog drafts.
2. Manage SEO/editorial metadata.
3. Move articles toward approval and publication.

#### Required Interaction Patterns

1. Fast edit access from approval context.
2. Clear distinction between draft quality and publication readiness.
3. Structured metadata fields near the main content editor.

#### Failure States

1. Missing ICP or pillar keyword.
2. Empty or invalid content.
3. Approval/publish action blocked by metadata gaps.

### 4.4 `/admin/leads`

#### Primary Jobs

1. Review pipeline.
2. Update lead status and priority.
3. Search/filter/export/import.

#### Required Interaction Patterns

1. Stage-based board view for quick scanning.
2. Spreadsheet-style editing for heavier operations.
3. KPI summary cards that support pipeline triage.

#### Failure States

1. Import validation errors.
2. Realtime sync mismatch.
3. Invalid field updates.

### 4.5 `/admin/analytics`

#### Primary Jobs

1. Upload and validate LinkedIn analytics.
2. Review imported and internal metrics.
3. Support decision-making for content and sales.

#### Required Interaction Patterns

1. Upload panel with schema guidance.
2. Summary cards for latest period.
3. Tables/charts that connect metrics to content items or lead trends.

#### Failure States

1. File schema mismatch.
2. Period conflict handling.
3. Empty state with no imported data.

### 4.6 `/admin/desenho-tecnico`

#### Primary Jobs

1. Create and review drawing sessions.
2. Validate technical interpretation.
3. Generate outputs and exports.

#### Required Interaction Patterns

1. Step-based workflow clarity.
2. Review gates before technical exports.
3. Explicit distinction between draft, reviewed, and export-ready states.

#### Failure States

1. Ambiguous input.
2. Validation failure.
3. Export attempted before review completion.

### 4.7 `/admin/social`

#### Primary Jobs

1. Generate and adjust social content.
2. Manage visual variants and approved template usage.
3. Keep content aligned with approval flow.

#### Required Interaction Patterns

1. Platform toggle where applicable.
2. Variant history visibility.
3. Clear indication that visual tooling is support scope.

#### Failure States

1. Real-asset match unavailable.
2. Regeneration failure.
3. Unsupported visual request outside approved templates.

## 5. Key Cross-Route Flows

### Flow A: Approval to Stakeholder Review

1. Admin reviews content.
2. Admin sends batch.
3. Stakeholder receives email.
4. Stakeholder reviews public page.
5. Admin sees result and acts.

### Flow B: Blog Draft to Publish

1. Operator generates draft.
2. Editor improves article and metadata.
3. Approver reviews.
4. Item is published with traceable state.

### Flow C: Analytics to Editorial Decision

1. Team imports or syncs metrics.
2. Analytics view shows latest performance.
3. Operators identify topics/posts worth repeating or revising.
4. Those insights influence blog/social planning.

### Flow D: Technical Drawing to Export

1. User creates session from reference.
2. Session is reviewed and normalized.
3. Validation gates clear.
4. User generates outputs and exports.

## 6. Accessibility and Usability Requirements

1. Keyboard-accessible controls across admin workflows.
2. Screen-readable status and error messages.
3. Critical states must not rely on color only.
4. Validation must point to exact next actions.
5. Dense screens must remain scannable for repeat operators.

## 7. Operator-Safe Defaults

1. Block irreversible publish/send actions behind clear confirmation.
2. Preserve user input on recoverable errors.
3. Default to safe, lower-risk behaviors for imports and regenerations.
4. Preserve prior visual state when regeneration fails.
5. Preserve review gates in technical drawing before export.

## 8. Documentation UX Rule

UX documentation should mirror the product structure:

1. master standard for the whole platform;
2. sector docs for each workflow area;
3. specialized testing and contract docs as supporting references.

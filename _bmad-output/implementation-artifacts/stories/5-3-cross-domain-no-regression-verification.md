# Story 5.3: Cross-Domain No-Regression Verification

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a release owner,
I want explicit no-regression verification for CRM and website domains,
so that content-engine delivery does not disrupt existing business operations.

## Acceptance Criteria

1. **Given** content-engine changes are prepared, **When** regression checklist runs, **Then** CRM and website key paths are validated.
2. **Given** regression risk is detected, **When** release gate evaluates, **Then** blocker is surfaced before production promotion.
3. **Given** no blockers remain, **When** release is approved, **Then** verification evidence is attached to release notes.

## Tasks / Subtasks

- [ ] Task 1: Create cross-domain regression checklist document (AC: #1, #3)
  - [ ] 1.1 Create `docs/regression-checklist.md` with the following sections:
    - **CRM paths**: Lead list view loads, Lead detail view loads, Contact form submissions work (if applicable), CRM data is not mutated by content pipeline
    - **Website paths**: Public blog index loads, Blog post page renders, Resources index loads, Resource detail renders, Contact/landing pages load without JS errors
    - **Admin paths**: Login works, Dashboard loads, Orchestrator loads, Approval queue loads
  - [ ] 1.2 Add a "Evidence" column to each checklist item for screenshot/timestamp capture
  - [ ] 1.3 Mark each item as manual-test (not automated) since E2E coverage of these paths is not in scope for this story

- [ ] Task 2: Run the regression checklist against the current state and document results (AC: #1, #2)
  - [ ] 2.1 Start dev server (`npm run dev:web`)
  - [ ] 2.2 Navigate each path in the checklist at `localhost:8080`
  - [ ] 2.3 For each path: note status (✅ pass / ❌ fail / ⚠️ degraded) and a brief observation
  - [ ] 2.4 If any ❌ or ⚠️ is found, document it as a finding with file reference

- [ ] Task 3: Attach verification evidence to sprint status (AC: #3)
  - [ ] 3.1 Add a `## Cross-Domain Regression Results — [date]` section to `_bmad-output/implementation-artifacts/sprint-status.yaml` comments (or create a separate `docs/regression-results-[date].md`)
  - [ ] 3.2 Report overall verdict: PASS / PASS WITH WARNINGS / BLOCKED
  - [ ] 3.3 Update `sprint-status.yaml` story `5-3` to `review` on completion

## Dev Notes

### Scope

This is a **verification story**, not a feature story. The primary deliverable is documentation + evidence. No new code is required unless a blocker is found during testing — in that case, document the blocker and leave fixing it to a separate task.

### Key Files to Protect

These paths/files must NOT be modified by content-engine work:
- `src/pages/CRM/` — Lead management
- `src/pages/Website/` or equivalent public pages
- `src/integrations/supabase/types.ts` — only additive changes allowed
- `supabase/migrations/` — no destructive migrations

### What to Look For

Common regression risks from content-engine work:
1. New DB migrations breaking existing RLS policies
2. Shared hook changes (e.g. `useLinkedInPosts`) breaking CRM hooks
3. New Supabase Edge Functions consuming quota that throttles existing functions

### Architecture Compliance

- No code changes in this story unless a blocker is found
- All findings documented in markdown
- Evidence = dev server screenshots or console.log confirmation

### Testing Requirements

- All CRM and website routes return 200 (or render correctly)
- No new console errors in admin dashboard
- `npm run build` must pass

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-53-cross-domain-no-regression-verification]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-010 Compatibility]
- [Source: _bmad-output/planning-artifacts/architecture.md#brownfield-constraints]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

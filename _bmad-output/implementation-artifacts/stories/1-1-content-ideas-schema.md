# Story 1.1: Content Ideas Schema

Status: in-progress

## Story

As an admin operator,
I want content ideas persisted with structured metadata,
so that ideation outputs can be reused in future planning.

## Acceptance Criteria

1. Given ideation output is generated, when persistence is requested, then a `content_ideas` record is created with topic, ICP segment, and timestamps.
2. Given ideation sources are present, when the record is stored, then source references are persisted in machine-readable format.
3. Given unauthorized context, when write is attempted, then write is blocked by authorization controls.

## Tasks / Subtasks

- [ ] Create migration for `content_ideas` table (AC: 1, 2)
  - [ ] Add required columns and timestamps
  - [ ] Add indexes for common reads
- [ ] Apply access policies (AC: 3)
  - [ ] Restrict write operations to admin context
  - [ ] Verify policy behavior for non-admin users
- [ ] Add contract notes to docs references (AC: 1, 2, 3)

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Persist real `source_references` from strategist output instead of hardcoding `[]`, otherwise AC2 is still missing. [supabase/functions/generate-linkedin-carousel/index.ts:98]
- [ ] [AI-Review][High] Require an authenticated admin context before calling `persistContentIdea`; the current service-role flow still allows unauthorized writes. [supabase/functions/generate-linkedin-carousel/index.ts:184]
- [ ] [AI-Review][Medium] Populate `created_by` from the resolved user id so persisted ideas retain operator traceability. [supabase/functions/generate-linkedin-carousel/index.ts:98]

## Dev Notes

- Keep naming conventions from architecture (`snake_case`, plural table names).
- Preserve existing data model patterns in `src/integrations/supabase/types.ts` updates.
- No cross-domain side effects (CRM and website remain untouched).

### Project Structure Notes

- Migration files: `supabase/migrations/`
- Shared contract typing: `src/integrations/supabase/types.ts`
- Optional helper logic: `supabase/functions/_shared/`

### References

- [Source: _bmad-output/planning-artifacts/prd.md#5-functional-requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#data-architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#story-11-content-ideas-schema]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List

## Senior Developer Review (AI)

- Reviewer: Rafaelalmeida
- Date: 2026-03-10
- Outcome: Changes Requested
- Status Recommendation: `in-progress`
- Git Note: local `git status` contains unrelated worktree changes, so the review was executed against the current implementation rather than a clean per-story diff.
- Story Note: this story reached `review` with an empty File List and no completion evidence even though implementation exists in the codebase.
- Findings:
  - [High] `persistContentIdea()` still saves `source_references: []`, so the machine-readable source contract from AC2 is not implemented. [supabase/functions/generate-linkedin-carousel/index.ts:98]
  - [High] `generate-linkedin-carousel` never requires an authenticated admin before inserting with the service-role client, which violates AC3's authorization requirement. [supabase/functions/generate-linkedin-carousel/index.ts:184]
  - [Medium] The schema includes `created_by`, but the persistence path never fills it even after resolving the caller identity. [supabase/functions/generate-linkedin-carousel/index.ts:123]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

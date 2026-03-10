# Story 1.2: LinkedIn Analytics Schema

Status: in-progress

## Story

As an analytics operator,
I want normalized storage for LinkedIn performance rows,
so that imported CSV data is queryable and comparable over time.

## Acceptance Criteria

1. Given a valid analytics import payload, when persistence runs, then rows are stored in `linkedin_analytics` with normalized fields.
2. Given required fields are missing, when persistence is attempted, then the system returns validation errors without partial corruption.
3. Given repeated imports for distinct rows, when ingest completes, then records preserve ingest timestamps for traceability.

## Tasks / Subtasks

- [ ] Create migration for `linkedin_analytics` table (AC: 1)
  - [ ] Define normalized column set and timestamps
  - [ ] Add indexes for period/post lookups
- [ ] Add validation contract for required fields (AC: 2)
  - [ ] Reject invalid payload rows with clear error details
- [ ] Ensure ingest traceability metadata (AC: 3)
  - [ ] Preserve upload/ingest timestamps

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Reject rows missing required metric columns instead of defaulting those fields to `0`, otherwise validation silently corrupts the normalized dataset. [supabase/functions/ingest-linkedin-analytics/index.ts:290]
- [ ] [AI-Review][High] Restrict ingestion to admin users before using the service-role client to write `linkedin_analytics`. [supabase/functions/ingest-linkedin-analytics/index.ts:200]
- [ ] [AI-Review][Medium] Add DB-level guards for normalized contract fields such as `uploaded_period` format and non-negative metrics so direct writes cannot bypass the function assumptions. [supabase/migrations/20260305113000_content_engine_foundation.sql:71]

## Dev Notes

- Keep schema aligned with architecture data contract decisions.
- Do not embed CSV raw text into operational query columns.
- Preserve compatibility with current analytics surfaces.

### Project Structure Notes

- Migrations: `supabase/migrations/`
- Function contract typing: `supabase/functions/ingest-linkedin-analytics/`
- Frontend types: `src/integrations/supabase/types.ts`

### References

- [Source: _bmad-output/planning-artifacts/prd.md#8-data-and-contract-requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#data-architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#story-12-linkedin-analytics-schema]

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
- Story Note: this story reached `review` with an empty File List and no completion evidence even though the migration, types, and ingestion function are already present in the codebase.
- Findings:
  - [High] Missing metric columns are normalized to zero instead of being rejected, so AC2's validation-without-corruption requirement is not met. [supabase/functions/ingest-linkedin-analytics/index.ts:290]
  - [High] The ingestion endpoint checks only for any authenticated user and then writes with a service-role client, leaving the schema open to non-admin imports. [supabase/functions/ingest-linkedin-analytics/index.ts:200]
  - [Medium] The table relies on function-level assumptions for period and metric validity; the migration itself does not enforce those invariants. [supabase/migrations/20260305113000_content_engine_foundation.sql:71]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

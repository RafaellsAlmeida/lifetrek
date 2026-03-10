# Story 3.1: LinkedIn CSV Ingestion Function

Status: in-progress

## Story

As an analytics operator,
I want a dedicated ingestion function for LinkedIn CSVs,
so that monthly data imports are repeatable and safe.

## Acceptance Criteria

1. Given a CSV upload payload, when ingestion runs, then file shape is validated before writes.
2. Given valid rows and invalid rows coexist, when ingestion completes, then accepted rows persist and rejected rows are reported.
3. Given duplicate period upload, when policy check runs, then system follows defined conflict behavior with explicit operator feedback.

## Tasks / Subtasks

- [ ] Implement ingestion function endpoint and payload contract (AC: 1)
  - [ ] Define parser validation for required columns
- [ ] Support partial-success ingestion reporting (AC: 2)
  - [ ] Return accepted/rejected counts and row-level errors
- [ ] Add duplicate period policy enforcement (AC: 3)
  - [ ] Implement deterministic conflict handling

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Enforce a real duplicate-period policy for `conflict_policy=skip`; today the function still inserts new rows into already-imported periods unless the row hash matches exactly. [supabase/functions/ingest-linkedin-analytics/index.ts:330]
- [ ] [AI-Review][High] Fail validation when required metric columns are missing instead of normalizing them to `0`. [supabase/functions/ingest-linkedin-analytics/index.ts:290]
- [ ] [AI-Review][High] Restrict ingestion to admin users before service-role writes. [supabase/functions/ingest-linkedin-analytics/index.ts:200]

## Dev Notes

- Keep ingest idempotency behavior explicit.
- Avoid destructive rewrite of prior imported analytics periods by default.
- Ensure normalized schema contract is respected.

### Project Structure Notes

- Function target: `supabase/functions/ingest-linkedin-analytics/`
- Related existing function: `supabase/functions/sync-linkedin-analytics/`
- Analytics persistence: `linkedin_analytics` contract from Story 1.2

### References

- [Source: _bmad-output/planning-artifacts/prd.md#82-functionapi-contracts-product-level]
- [Source: _bmad-output/planning-artifacts/architecture.md#api--communication-patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#story-31-linkedin-csv-ingestion-function]

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
- Story Note: this story reached `review` with an empty File List and no completion evidence even though the ingestion function is present in the codebase.
- Findings:
  - [High] Duplicate-period handling is not deterministic in `skip` mode because the function only dedupes exact row hashes and still mixes uploads inside an existing month. [supabase/functions/ingest-linkedin-analytics/index.ts:330]
  - [High] File-shape validation does not really happen before writes; rows missing required metric columns are still accepted with zeroed values. [supabase/functions/ingest-linkedin-analytics/index.ts:290]
  - [High] The ingestion endpoint is available to any authenticated user, even though the workflow is meant to be an admin operator action. [supabase/functions/ingest-linkedin-analytics/index.ts:200]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

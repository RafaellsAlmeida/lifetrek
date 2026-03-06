# Story 1.2: LinkedIn Analytics Schema

Status: review

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

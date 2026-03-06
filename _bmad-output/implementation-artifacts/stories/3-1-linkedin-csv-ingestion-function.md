# Story 3.1: LinkedIn CSV Ingestion Function

Status: review

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

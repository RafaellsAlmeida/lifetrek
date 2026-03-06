# Story 1.1: Content Ideas Schema

Status: review

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

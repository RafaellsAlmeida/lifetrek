# Story 1.3: Blog Posts Hero Status Alignment

Status: review

## Story

As a reviewer,
I want blog status and hero-image fields aligned,
so that approval publishing works without manual data fixes.

## Acceptance Criteria

1. Given a blog draft with generated hero image, when saved, then required hero and status fields are present and coherent.
2. Given status changes to approved, when publish workflow triggers, then publication state and timestamps are set consistently.
3. Given legacy posts missing hero metadata, when queried, then they are clearly identifiable for backfill workflows.

## Tasks / Subtasks

- [ ] Validate/adjust blog schema fields for status and hero image (AC: 1)
  - [ ] Confirm nullable behavior for legacy rows
- [ ] Implement/align approval-to-publish transition contract (AC: 2)
  - [ ] Ensure state transition is deterministic
- [ ] Add legacy detection query path for backfill candidate selection (AC: 3)

## Dev Notes

- Preserve current content approval workflows while extending blog behavior.
- Ensure no destructive updates on historical blog records.
- Keep publish transition explicit and auditable.

### Project Structure Notes

- Schema/migration changes: `supabase/migrations/`
- Blog generation function: `supabase/functions/generate-blog-post/`
- Approval UI: `src/pages/Admin/ContentApproval.tsx` and related components

### References

- [Source: _bmad-output/planning-artifacts/prd.md#5-functional-requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#api--communication-patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#story-13-blog-posts-hero-status-alignment]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List

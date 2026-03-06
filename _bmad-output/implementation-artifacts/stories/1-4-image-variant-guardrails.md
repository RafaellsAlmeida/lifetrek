# Story 1.4: Image Variant Guardrails

Status: ready-for-dev

## Story

As a content editor,
I want image regenerations to create new variants only,
so that historical images remain available for comparison and rollback.

## Acceptance Criteria

1. Given a slide image regeneration request, when processing completes, then a new variant is appended and prior active image is preserved.
2. Given variant history exists, when user chooses another variant, then active pointer changes without deleting prior variants.
3. Given deletion attempts on historical variants, when policy is enforced, then system blocks destructive overwrite behavior.

## Tasks / Subtasks

- [ ] Enforce append-only variant writes in regeneration flow (AC: 1)
  - [ ] Block overwrite paths for existing active image
- [ ] Support active variant switching with immutable history (AC: 2)
  - [ ] Ensure UI and backend pointer updates are aligned
- [ ] Add destructive-action guardrails (AC: 3)
  - [ ] Validate API/UI rejects deletion-style operations

## Dev Notes

- Must follow strict image versioning rule from AGENTS.md.
- Keep existing slide references stable while adding variants.
- Ensure behavior is consistent for LinkedIn and Instagram records.

### Project Structure Notes

- Regeneration function: `supabase/functions/regenerate-carousel-images/`
- Background set/update function: `supabase/functions/set-slide-background/`
- Social editor surfaces: `src/pages/Admin/SocialMediaWorkspace.tsx` and related components

### References

- [Source: AGENTS.md#image-generation--versioning-rule-critical]
- [Source: _bmad-output/planning-artifacts/prd.md#5-functional-requirements]
- [Source: _bmad-output/planning-artifacts/epics.md#story-14-image-variant-guardrails]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List

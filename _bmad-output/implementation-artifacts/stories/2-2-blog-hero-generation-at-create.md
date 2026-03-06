# Story 2.2: Blog Hero Generation at Create

Status: review

## Story

As an author,
I want hero image generation to happen at blog creation time,
so that each draft is review-ready with a visual.

## Acceptance Criteria

1. Given blog generation starts, when draft is created, then hero image generation is executed in the same workflow.
2. Given hero generation succeeds, when draft persists, then `hero_image_url` is populated.
3. Given hero generation fails, when workflow completes, then draft remains saved with an actionable error state.

## Tasks / Subtasks

- [ ] Integrate hero-generation step in blog creation flow (AC: 1)
  - [ ] Preserve existing draft generation behavior
- [ ] Persist hero image URL on success (AC: 2)
  - [ ] Validate URL field contract and storage location
- [ ] Implement recoverable failure handling (AC: 3)
  - [ ] Return explicit error object and remediation guidance

## Dev Notes

- Do not block draft persistence on non-critical image generation failures.
- Keep model policy aligned with existing image-generation standards.
- Ensure compatibility with approval queue behavior.

### Project Structure Notes

- Blog function: `supabase/functions/generate-blog-post/`
- Optional batch helper: `supabase/functions/generate-blog-images/`
- Blog/admin views: `src/pages/Admin/Blog*` and approval surfaces

### References

- [Source: _bmad-output/planning-artifacts/prd.md#5-functional-requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#api--communication-patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#story-22-blog-hero-generation-at-create]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List

# Story 2.2: Blog Hero Generation at Create

Status: in-progress

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

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Persist `featured_image` and `hero_image_url` in the `/admin/blog` AI-create flow; the current editor-form path drops both fields before save. [src/pages/AdminBlog.tsx:195]
- [ ] [AI-Review][High] Preserve `image_generation_status` and `image_generation_error` when drafts are created from `generate-blog-post` so failures remain actionable after save. [src/pages/AdminBlog.tsx:261]
- [ ] [AI-Review][Medium] Normalize failed hero generations to `NULL` instead of empty strings so backfill detection and hero/status alignment keep working. [supabase/functions/generate-blog-post/index.ts:702]

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

## Senior Developer Review (AI)

- Reviewer: Rafaelalmeida
- Date: 2026-03-10
- Outcome: Changes Requested
- Status Recommendation: `in-progress`
- Git Note: local `git status` contains unrelated worktree changes, so the review was executed against the current implementation rather than a clean per-story diff.
- Story Note: this story reached `review` with an empty File List and no completion evidence even though the generation function and admin create flows changed.
- Findings:
  - [High] The `/admin/blog` AI-create path still discards hero fields when it loads generated text into the editor form, so drafts can be saved without the generated hero. [src/pages/AdminBlog.tsx:195]
  - [High] The direct-create flows do not persist `image_generation_status` or `image_generation_error`, which leaves hero failures non-actionable after save and misses AC3. [src/pages/AdminBlog.tsx:261]
  - [Medium] Failed hero generations are represented as empty strings rather than `NULL`, which breaks the follow-on backfill and alignment logic. [supabase/functions/generate-blog-post/index.ts:702]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

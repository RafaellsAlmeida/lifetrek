# Story 1.3: Blog Posts Hero Status Alignment

Status: in-progress

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

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Treat empty hero strings as missing (`NULLIF('', '')`) in `sync_blog_hero_featured` and `blog_posts_hero_backfill_candidates`, otherwise failed and legacy posts are invisible to backfill. [supabase/migrations/20260305113000_content_engine_foundation.sql:146]
- [ ] [AI-Review][High] Stop bypassing the blog approval contract in `ContentPreview`; that path still skips the `approved_at` metadata written by `useApproveBlogPost`. [src/pages/Admin/ContentPreview.tsx:192]
- [ ] [AI-Review][Medium] Align scheduled publish updates with the manual publish path so approval and publication timestamps stay consistent. [supabase/functions/process-scheduled-posts/index.ts:88]

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

## Senior Developer Review (AI)

- Reviewer: Rafaelalmeida
- Date: 2026-03-10
- Outcome: Changes Requested
- Status Recommendation: `in-progress`
- Git Note: local `git status` contains unrelated worktree changes, so the review was executed against the current implementation rather than a clean per-story diff.
- Story Note: this story reached `review` with an empty File List and no completion evidence even though the migration, view, and publish paths changed in the codebase.
- Findings:
  - [High] The hero-sync trigger and backfill view still treat empty strings as valid values, which hides failed hero generations from the legacy backfill flow. [supabase/migrations/20260305113000_content_engine_foundation.sql:146]
  - [High] `ContentPreview` approves blog posts by writing `status='approved'` directly, which bypasses the `approved_at` metadata contract used elsewhere. [src/pages/Admin/ContentPreview.tsx:192]
  - [Medium] Scheduled publish writes `published_at` only, while manual publish also updates metadata timestamps, so AC2 is not consistent across publish paths. [supabase/functions/process-scheduled-posts/index.ts:88]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

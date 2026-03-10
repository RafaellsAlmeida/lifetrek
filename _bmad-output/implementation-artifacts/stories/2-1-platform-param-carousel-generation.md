# Story 2.1: Platform Param Carousel Generation

Status: in-progress

## Story

As a content creator,
I want carousel generation to accept platform context,
so that LinkedIn and Instagram outputs are tailored without duplicate pipelines.

## Acceptance Criteria

1. Given generation request includes `platform`, when pipeline starts, then copy rules and output config reflect selected platform.
2. Given `platform=linkedin`, when generation completes, then current LinkedIn behavior is preserved.
3. Given `platform=instagram`, when generation completes, then Instagram-specific copy constraints are applied.

## Tasks / Subtasks

- [ ] Extend generation contract with explicit `platform` field (AC: 1)
  - [ ] Validate accepted platform values
- [ ] Preserve LinkedIn branch behavior (AC: 2)
  - [ ] Add regression checks for existing LinkedIn generation
- [ ] Implement Instagram-specific copy branch (AC: 3)
  - [ ] Align output fields with existing `instagram_posts` structure

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Enforce authenticated admin access before `generate-linkedin-carousel` saves LinkedIn or Instagram records through the service-role client. [supabase/functions/generate-linkedin-carousel/index.ts:323]
- [ ] [AI-Review][Medium] Reject unsupported `platform` values instead of silently coercing them to `linkedin`. [supabase/functions/generate-linkedin-carousel/index.ts:35]
- [ ] [AI-Review][Medium] Return platform-specific output config in non-persisted responses too; `plan` and preview payloads are still shaped generically via `toCarouselPayload`. [supabase/functions/generate-linkedin-carousel/index.ts:70]

## Dev Notes

- Keep shared pipeline architecture; avoid forking full implementation.
- Maintain existing visual/template constraints across platforms.
- Ensure PT-BR output remains default for user-facing content.

### Project Structure Notes

- Main function: `supabase/functions/generate-linkedin-carousel/`
- Prompt/config helpers: function-local `utils/` and existing prompt assets
- Frontend request origin: orchestrator/social admin flows

### References

- [Source: _bmad-output/planning-artifacts/prd.md#82-functionapi-contracts-product-level]
- [Source: _bmad-output/planning-artifacts/architecture.md#api--communication-patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#story-21-platform-param-carousel-generation]

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
- Story Note: this story reached `review` with an empty File List and no completion evidence even though the platform contract now spans backend and frontend files.
- Findings:
  - [High] `generate-linkedin-carousel` still uses the service-role client without an admin gate, so platform-aware content generation is not restricted to the intended operator context. [supabase/functions/generate-linkedin-carousel/index.ts:323]
  - [Medium] Unsupported platform values are silently normalized to `linkedin`, which means the contract does not really validate accepted values. [supabase/functions/generate-linkedin-carousel/index.ts:35]
  - [Medium] The preview and plan responses remain generic even for Instagram, so platform-specific output config is only visible after persistence. [supabase/functions/generate-linkedin-carousel/index.ts:70]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

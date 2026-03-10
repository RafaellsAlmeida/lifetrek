# Story 1.4: Image Variant Guardrails

Status: in-progress

## Story

As a content editor,
I want image regenerations to create new variants only,
so that historical images remain available for comparison and rollback.

## Acceptance Criteria

1. Given a slide image regeneration request, when processing completes, then a new variant is appended and prior active image is preserved.
2. Given variant history exists, when user chooses another variant, then active pointer changes without deleting prior variants.
3. Given deletion attempts on historical variants, when policy is enforced, then system blocks destructive overwrite behavior.

## Tasks / Subtasks

- [x] Enforce append-only variant writes in regeneration flow (AC: 1)
  - [x] Block overwrite paths for existing active image
- [x] Support active variant switching with immutable history (AC: 2)
  - [x] Ensure UI and backend pointer updates are aligned
- [x] Add destructive-action guardrails (AC: 3)
  - [x] Validate API/UI rejects deletion-style operations

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Load the current active slide image before the last appended variant in the editor; reopening the editor currently shows the newest variant instead of the selected active one. [src/components/admin/content/ImageEditorCore.tsx:390]
- [ ] [AI-Review][Medium] Remove or harden the client-side fallback write path so immutable-history behavior is enforced through the same backend guardrails even when the edge function is unavailable. [src/components/admin/content/ImageEditorCore.tsx:481]
- [ ] [AI-Review][Medium] Add an automated regression that switches to an older variant and verifies the editor reopens on that active pointer. [src/components/admin/content/ImageEditorCore.tsx:527]

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

- `deno check supabase/functions/regenerate-carousel-images/index.ts supabase/functions/set-slide-background/index.ts`
- `npm run lint`
- Playwright admin verification screenshot: `/var/folders/64/d80xb0q973lcbhg8xntrqky40000gn/T/playwright-mcp-output/1772803323178/page-2026-03-06T13-57-45-135Z.png`

### Completion Notes List

- Preserved append-only image variant history in both regeneration and manual background selection flows.
- Fixed `image_urls` persistence to preserve slide index alignment instead of collapsing arrays.
- Added explicit API rejection for deletion-style variant requests and surfaced immutable-history guidance in the editor UI.
- Kept local fallback behavior aligned with edge-function behavior when the published function is unavailable.

### File List

- supabase/functions/regenerate-carousel-images/index.ts
- supabase/functions/regenerate-carousel-images/generators/satori.ts
- supabase/functions/set-slide-background/index.ts
- src/components/admin/content/ImageEditorCore.tsx

## Senior Developer Review (AI)

- Reviewer: Rafaelalmeida
- Date: 2026-03-10
- Outcome: Changes Requested
- Status Recommendation: `in-progress`
- Git Note: local `git status` contains unrelated worktree changes, so the review was executed against the current implementation rather than a clean per-story diff.
- Findings:
  - [High] The editor reload path prefers the last item in `image_variants` over the active `image_url`, so UI state drifts from the backend pointer after a variant switch. [src/components/admin/content/ImageEditorCore.tsx:390]
  - [Medium] The browser fallback update path bypasses the shared edge-function contract, which weakens the story's claim that guardrails are enforced uniformly. [src/components/admin/content/ImageEditorCore.tsx:481]
  - [Medium] The story evidence has no automated regression covering variant switching, which is exactly where the current UI mismatch slipped through. [src/components/admin/content/ImageEditorCore.tsx:527]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

# Story 5.1: Real Asset First Enforcement

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a brand owner,
I want real facility assets preferred for backgrounds,
so that published visuals remain authentic and consistent.

## Acceptance Criteria

1. **Given** slide generation needs a background, **When** asset selection runs, **Then** real assets are attempted before AI fallback.
2. **Given** no adequate real match exists, **When** fallback is allowed, **Then** fallback usage is traceable.
3. **Given** template constraints, **When** composition executes, **Then** output remains within approved visual system.

## Tasks / Subtasks

- [ ] Task 1: Enforce asset-first in initial carousel generation (AC: #1, #2)
  - [ ] 1.1 In `supabase/functions/generate-linkedin-carousel/agents.ts` (Designer Agent, ~line 695+), update the image generation flow to attempt real asset matching BEFORE falling back to AI generation
  - [ ] 1.2 Currently the initial generation goes straight to AI image generation. Add a pre-step that calls `AssetLoader.getSmartBackgroundForSlide()` (from `regenerate-carousel-images/utils/assets.ts`) with the slide content
  - [ ] 1.3 If asset match scores above threshold → use real asset with Satori overlay (skip AI generation for that slide)
  - [ ] 1.4 If no match or below threshold → proceed with existing AI generation flow
  - [ ] 1.5 Track asset source on each slide: add `asset_source` field to slide metadata (`'real'`, `'ai'`, `'rule_override'`) — this field already exists in smart regen but needs to be set during initial generation too

- [ ] Task 2: Make asset selection reusable across generation paths (AC: #1)
  - [ ] 2.1 The smart asset selection logic currently lives in `regenerate-carousel-images/utils/assets.ts`. Extract the core scoring functions into a shared location accessible by both `generate-linkedin-carousel` and `regenerate-carousel-images`
  - [ ] 2.2 Recommended approach: Create `supabase/functions/_shared/asset-selection.ts` with:
    - `classifyIntent(slideContent: string): IntentType`
    - `scoreAssetMatch(embedding: number[], candidates: AssetCandidate[], intent: IntentType): ScoredAsset[]`
    - `getThresholdForIntent(intent: IntentType): number`
  - [ ] 2.3 Update `regenerate-carousel-images/utils/assets.ts` to import from shared module (avoid duplication)
  - [ ] 2.4 Update `generate-linkedin-carousel/agents.ts` to use the shared asset selection

- [ ] Task 3: Add traceability for fallback usage (AC: #2)
  - [ ] 3.1 When AI fallback is used (real asset match below threshold), log: `{ slide_index, intent, best_score, threshold, fallback_reason: "below_threshold" }`
  - [ ] 3.2 Store `asset_source` in the slide's metadata within the `slides` JSONB array on `linkedin_carousels` and `instagram_posts`
  - [ ] 3.3 Ensure `image_variants` entries (from Story 1.4) also track `asset_source` for each variant
  - [ ] 3.4 Add a summary log at generation completion: `{ total_slides, real_asset_count, ai_fallback_count }`

- [ ] Task 4: Respect template visual constraints (AC: #3)
  - [ ] 4.1 The 4 approved templates (Glassmorphism Card, Full-Bleed Dark Text, Split Comparison, Pure Photo) have different background requirements:
    - **Glassmorphism Card**: needs subtle/blurred background — real assets work well
    - **Full-Bleed Dark Text**: needs dark/muted background — filter real assets by brightness
    - **Split Comparison**: needs clean half-background — crop/position real assets
    - **Pure Photo**: the photo IS the content — real asset is mandatory, AI fallback should be blocked
  - [ ] 4.2 Add template-aware scoring: boost real asset scores for templates that benefit from real photography (Pure Photo, Glassmorphism)
  - [ ] 4.3 For Pure Photo template: set `allowAiFallback = false` — if no real asset matches, return an error rather than generating AI content
  - [ ] 4.4 Log template type alongside asset selection decisions for auditability

- [ ] Task 5: Apply to Instagram generation path (AC: #1, #2, #3)
  - [ ] 5.1 Instagram posts share the image pipeline with LinkedIn (same Satori/background system)
  - [ ] 5.2 Ensure the asset-first logic applies to Instagram generation as well — the shared module from Task 2 enables this
  - [ ] 5.3 Instagram may have different dimension requirements (1080x1080 vs 1080x1350) — ensure asset selection considers aspect ratio compatibility

## Dev Notes

### Current Asset Selection Architecture

The smart regen pipeline (`regenerate-carousel-images/handlers/smart.ts`) already implements asset-first logic:
1. Intent classification (5 types with per-intent thresholds: 0.62-0.70)
2. Vector embedding match via `match_asset_candidates` RPC
3. Keyword boost + curated override boost
4. Anti-repetition across slides
5. AI fallback only when below threshold

This story's job is to bring this same logic to the **initial generation** path, which currently skips it.

### Key Files

**To modify:**
- `supabase/functions/generate-linkedin-carousel/agents.ts` — Designer Agent image generation (~line 695)
- `supabase/functions/regenerate-carousel-images/utils/assets.ts` — extract shared logic
- `supabase/functions/regenerate-carousel-images/handlers/smart.ts` — update to use shared module

**To create:**
- `supabase/functions/_shared/asset-selection.ts` — shared asset scoring/selection utilities

### What NOT to Do

- Do NOT remove AI fallback entirely — it's needed when no real assets match
- Do NOT change the Satori compositor — it's the brand fidelity control point and is not in scope
- Do NOT modify the `asset_embeddings` table or `match_asset_candidates` RPC — they work correctly
- Do NOT add new templates — the 4 templates are locked
- Do NOT change scoring thresholds without testing — the current values (0.62-0.70) were tuned
- Do NOT add cost tracking for asset selection — it's DB queries only, no AI calls

### Architecture Compliance

- **Runtime:** Deno (Edge Functions)
- **Shared code:** `_shared/` directory pattern (already used for cost tracking)
- **Image versioning:** Append-only — never overwrite existing `image_url`, always create new variant
- **Brand fidelity:** Satori compositor remains the single point of control
- **Cost:** Asset selection is DB queries (free). AI fallback uses existing cost-tracked generation path

### Testing Requirements

- Generate a carousel with topic matching existing real assets → slides use real assets (check `asset_source`)
- Generate a carousel with topic having no asset matches → AI fallback used, `asset_source = 'ai'`
- Generate Pure Photo template with no matching assets → error returned (no AI fallback)
- Check generation logs → `real_asset_count` and `ai_fallback_count` visible
- Regenerate a slide via smart regen → same behavior as before (no regression)
- Run `npm run build` — must pass

### Cross-Story Context

- **Story 1.4** (Image Variant Guardrails, in review): Append-only image versioning. This story's `asset_source` tracking extends that pattern.
- **Story 5.2** (Access & Audit Guardrails): Broader audit logging — `asset_source` traceability supports that goal.
- **Story 2.1** (Platform Param Carousel Generation, in review): Platform-specific generation. Asset-first applies equally to LinkedIn and Instagram.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-51-real-asset-first-enforcement]
- [Source: _bmad-output/planning-artifacts/architecture.md#smart-regen-architecture-update]
- [Source: supabase/functions/regenerate-carousel-images/utils/assets.ts — scoring model lines 44-124]
- [Source: supabase/functions/regenerate-carousel-images/handlers/smart.ts — smart handler lines 29-150]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List


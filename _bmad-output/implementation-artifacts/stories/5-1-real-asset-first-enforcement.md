# Story 5.1: Real Asset First Enforcement

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a brand owner,
I want real facility assets preferred for backgrounds,
so that published visuals remain authentic and consistent.

## Acceptance Criteria

1. **Given** slide generation needs a background, **When** asset selection runs, **Then** real assets are attempted before AI fallback.
2. **Given** no adequate real match exists, **When** fallback is allowed, **Then** fallback usage is traceable in the slide metadata.
3. **Given** template constraints, **When** composition executes, **Then** output remains within approved visual system (4 approved templates).

## Tasks / Subtasks

- [ ] Task 1: Harden `getFacilityPhotoForSlide()` to always prioritize real assets (AC: #1)
  - [ ] 1.1 In `supabase/functions/regenerate-carousel-images/utils/assets.ts`, confirm the function queries `product_catalog` with `category = 'facility'` before any AI fallback
  - [ ] 1.2 Add a hard guard: if `ENFORCE_REAL_ASSETS=true` env var is set, throw an error instead of falling back to AI
  - [ ] 1.3 Ensure semantic keyword matching covers all 12 facility photo categories (production-floor, grinding-room, laser-marking, electropolish-line-new, polishing-manual, clean-room-1..7, cleanroom-hero, exterior, reception, water-treatment)

- [ ] Task 2: Trace fallback usage in slide metadata (AC: #2)
  - [ ] 2.1 When AI fallback is used, set `slide.asset_source = 'ai'` in the slide JSON stored in DB
  - [ ] 2.2 When real photo is used, set `slide.asset_source = 'facility:{photo_name}'`
  - [ ] 2.3 Add `asset_source` to the `image_variants` JSONB field (do NOT create a new column)

- [ ] Task 3: Template compliance guard (AC: #3)
  - [ ] 3.1 In `supabase/functions/regenerate-carousel-images/generators/satori.ts`, add a lint-style assertion that the chosen template is one of: `template_a`, `template_b`, `template_c`, `template_d`
  - [ ] 3.2 If unknown template, log warning and default to `template_a`

## Dev Notes

### Files to Modify

- `supabase/functions/regenerate-carousel-images/utils/assets.ts` — `getFacilityPhotoForSlide()` hardening
- `supabase/functions/regenerate-carousel-images/generators/satori.ts` — template guard
- `supabase/functions/regenerate-carousel-images/handlers/hybrid.ts` — ensure asset_source is passed through

### Available Facility Photos (`product_catalog`, category='facility')

`production-floor`, `production-overview`, `grinding-room`, `laser-marking`, `electropolish-line-new`, `polishing-manual`, `clean-room-1..7`, `cleanroom-hero`, `exterior`, `reception`, `water-treatment`

### Architecture Compliance

- Never overwrite `image_url` on existing slides — only append to `image_variants`
- `asset_source` must be stored inside `image_variants` JSONB, not as a new column
- Always use the 4-template visual system defined in AGENTS.md

### What NOT to Do

- Do NOT add a new DB column for `asset_source` — use JSONB metadata
- Do NOT disable AI fallback entirely unless `ENFORCE_REAL_ASSETS=true` — just make it traceable
- Do NOT change the Satori template rendering logic — only add the guard assertion

### Testing Requirements

- Verify that a slide with a matching keyword (e.g. "sala limpa") resolves to a clean-room photo
- Verify that `image_variants` entry contains `asset_source` field after regeneration
- Verify unknown template logs warning and defaults to template_a
- Run `npm run build` — must pass

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-51-real-asset-first-enforcement]
- [Source: _bmad-output/planning-artifacts/prd.md#FR-016]
- [Source: AGENTS.md#background-photo-selection-logic]
- [Source: AGENTS.md#visual-template-system]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

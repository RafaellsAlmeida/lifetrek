# Smart Regen Architecture

Date: 2026-03-05

## Goal

Prioritize real Lifetrek assets for social post backgrounds and fall back to AI only when confidence is below threshold.

## Runtime Flow

1. UI (`ImageEditorCore`) calls `regenerate-carousel-images` with `mode=smart`.
2. Function validates bearer token + admin permission.
3. Function loads post slide data and asset catalog.
4. `AssetLoader.getSmartBackgroundForSlide()`:
- classifies slide intent
- builds intent-specific pool
- scores candidates using `cosine + keyword_boost + curated_boost`
- applies anti-repetition
- decides `real/rule_override` vs `ai` fallback
5. `handleSmartGeneration` composes final image (Satori over real asset or AI generated), uploads to storage, and updates slide metadata.
6. UI manual override (`set-slide-background`) can replace any slide image while preserving history.

## Auth Model

`verify_jwt=false` at gateway level for these functions, with explicit in-function checks:
- `supabase.auth.getUser(token)`
- admin authorization via `admin_permissions`, `admin_users`, optional `user_roles`

Functions:
- `supabase/functions/regenerate-carousel-images/index.ts`
- `supabase/functions/set-slide-background/index.ts`

## Data Integrity Rules

For every background update:
- sync `slides[slide_index].image_url` and `image_urls[slide_index]`
- append to `image_variants`
- keep `prev_image_urls`
- persist provenance (`asset_source`, `selection_score`, `selection_reason`, `asset_id`)

## Decision Defaults

Thresholds:
- `company_trust`: 0.68
- `quality_machines_metrology`: 0.66
- `cleanroom_iso`: 0.64
- `vet_odonto_product`: 0.62
- `generic`: 0.70

Curated rules:
- partner/complete solution -> exterior/reception/production-overview
- quality/machines/metrology -> equipment/metrology assets
- cleanroom/ISO/ANVISA/FDA -> clean-room assets
- vet/odonto -> product assets first

## Verified Production Example

Post: `instagram_posts.a31da9e2-367c-4c22-ba81-af7831d25976`

- Smart regeneration result: `asset_source=rule_override`, `selection_score=0.81`
- Manual override result: `asset_source=manual`
- Both flows persisted with version history.

## Known Constraint

If embedding API is unavailable, lexical + curated + intent-pool scoring keeps smart selection operational.

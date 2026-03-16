# Image Pipeline Architecture — LinkedIn Carousel Generation

> Last updated: 2026-03-16. Reference for AI agents working on the content engine.

## Overview

The carousel image pipeline selects a real facility photo, composites branded text overlays via Satori, and uploads the final slide image. The goal is **zero AI-generated backgrounds** — all images use real LifeTrek facility photos with deterministic text compositing.

## Pipeline Flow

```
Carousel Copy (slides[])
  → Asset Selection (RAG + keyword scoring)
  → Facility Photo Resize (Supabase image transform)
  → Satori Text Overlay (glassmorphism card + logo + ISO badge)
  → Upload to Storage (carousel-images bucket)
  → Vision QA Scoring (optional, non-blocking)
```

## Key Files

| Component | File | Purpose |
|-----------|------|---------|
| **Satori Compositor** | `supabase/functions/regenerate-carousel-images/generators/satori.ts` | Renders text overlay + logo + ISO badge as PNG |
| **Hybrid Handler** | `supabase/functions/regenerate-carousel-images/handlers/hybrid.ts` | Orchestrates: photo selection → Satori → upload |
| **Smart Handler** | `supabase/functions/regenerate-carousel-images/handlers/smart.ts` | Semantic selection with AI fallback (legacy) |
| **Asset Loader** | `supabase/functions/regenerate-carousel-images/utils/assets.ts` | Loads assets, generates embeddings, scores matches |
| **Vision QA** | `supabase/functions/regenerate-carousel-images/qa/vision-scorer.ts` | Scores final image quality via vision model |
| **Storage Utils** | `supabase/functions/regenerate-carousel-images/utils/storage.ts` | Upload to Supabase Storage |
| **Brand Prompt** | `supabase/functions/regenerate-carousel-images/prompts/brand-prompt.ts` | Brand colors and visual guidelines |
| **Types** | `supabase/functions/regenerate-carousel-images/types.ts` | SlideData, PlatformConfig interfaces |
| **Cost Tracking** | `supabase/functions/_shared/costTracking.ts` | Per-request cost logging |

## Image Selection (RAG)

### Three-Tier Strategy

1. **Semantic Matching** (`getSmartBackgroundForSlide`): Embeds slide text, compares against `asset_embeddings` via pgvector cosine similarity
2. **Keyword Matching** (`getFacilityPhotoForSlide`): Hard-coded keyword→photo map (11 groups)
3. **Fallback**: Best-scoring real photo (no AI generation)

### Embedding Models

| Model | Dimensions | Type | Status |
|-------|-----------|------|--------|
| `openai/text-embedding-3-small` | 1536 | Text-only | Legacy (via OpenRouter) |
| `gemini-embedding-exp-03-07` | 768 (MRL) | Multimodal (text+image) | New — stored in `embedding_v2` column |

Gemini Embedding 2 is the preferred model because it embeds **actual photos** into the same vector space as text queries, enabling true visual semantic matching.

### Scoring Formula

```
finalScore = cosineSimilarity(0-1) + keywordBoost(0-0.78) + curatedBoost(0-0.22)
```

- **Cosine Similarity**: Embedding distance between slide text and asset
- **Keyword Boost**: Tokenized content matching + intent pool bonus (0.40-0.44) + curated hints (0.10-0.14)
- **Curated Boost**: Hard-coded keyword+asset pairs (e.g., "metrologia"+"zeiss" → 0.20)

### Intent Classification

Each slide is classified into one of 5 intents with different asset pools and thresholds:

| Intent | Threshold | Asset Pool |
|--------|-----------|------------|
| `company_trust` | 0.68 | exterior, reception, production-overview |
| `quality_machines_metrology` | 0.66 | equipment, production floor |
| `cleanroom_iso` | 0.64 | clean-room photos |
| `vet_odonto_product` | 0.62 | product photos, clean facilities |
| `generic` | 0.70 | all eligible assets |

### Non-Repetition Logic

Tracks `usedUrls` across slides to avoid repeating the same photo in consecutive carousel slides. Allows slightly lower-scoring alternatives (within 0.03 score difference).

## Satori Compositor

### VDOM Structure

```
Outer Container (facility photo as CSS backgroundImage)
  └─ Content Wrapper (blue overlay rgba(0,20,65,0.58), column layout)
     ├─ Top Bar (LifeTrek logo, top-right) — if showLogo && logoUrl
     ├─ Middle Section (flex: 1, centered)
     │   └─ Glassmorphism Card (65% width, left-aligned)
     │      ├─ Category Label (green, uppercase: DESTAQUE/INSIGHT/PRÓXIMO PASSO)
     │      ├─ Headline (white, bold, dynamic font size)
     │      ├─ Body Text (light gray, dynamic font size)
     │      └─ CTA Pill (optional, green checkmark)
     └─ Bottom Bar (ISO 13485 badge, bottom-right) — if showISOBadge && isoUrl
```

### Dynamic Font Sizing

Prevents text overflow (the "Manufaturabilida de" bug):

| Headline Length | Font Size |
|----------------|-----------|
| ≤ 35 chars | 48px |
| 36-55 chars | 42px |
| 56-80 chars | 36px |
| > 80 chars | 32px |

| Body Length | Font Size |
|-------------|-----------|
| ≤ 200 chars | 24px |
| 201-300 chars | 20px |
| > 300 chars | 18px |

### Logo & ISO Badge Rendering

Logos and ISO badges are **real assets composited by Satori**, never AI-generated:

- **Logo**: Pre-resized to 180x60 via Supabase image transform, rendered at 150x50
- **ISO Badge**: Pre-resized to 70x70, rendered at 60x60
- Pre-resizing keeps images under ~50KB, avoiding Satori's stack-overflow risk with large images

### Card Styling

```css
background: rgba(8, 18, 35, 0.80)
border: 1px solid rgba(255, 255, 255, 0.12)
border-radius: 20px
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5)
padding: 40px
margin-left: 40px
```

### Brand Colors

```javascript
primaryBlue: "#004F8F"
darkBlueStart: "#0A1628"
darkBlueEnd: "#003052"
innovationGreen: "#1A7A3E"  // Category labels
energyOrange: "#F07818"
white: "#FFFFFF"             // Headlines
lightGray: "#E0E0E0"        // Body text
```

## Hybrid Handler Workflow

For each slide:
1. Set metadata: `showLogo` (first + last), `showISOBadge` (last + CTA)
2. Load logo URL (`getLogo()`) and ISO badge URL (`getIsoBadge("iso 13485")`)
3. Select facility photo via keyword map or semantic matching
4. Resize photo via Supabase image transform (`/render/image/public/` + `?width=W&height=H&resize=cover&quality=65`)
5. Generate Satori composite (text + logo + ISO over photo)
6. Base64-encode with chunking (8KB chunks to avoid stack overflow)
7. Upload to `carousel-images` bucket
8. Store URL in `slide.imageUrl` and append to `slide.image_variants`

## Vision QA Scorer

After generation, each slide image can be scored by a vision model:

- **Model**: `google/gemini-2.5-flash-preview` via OpenRouter (~$0.003/call)
- **Scores** (0-25 each, total 0-100):
  - Brand Consistency: colors, logo, template adherence
  - Readability: text contrast, font size, legibility
  - Composition: layout balance, visual hierarchy
  - Content Relevance: background matches slide topic
- **Flags**: AI-generated logos, AI-generated backgrounds, distorted badges
- **Storage**: `slide.qa_score` (total) and `slide.qa_breakdown` (full object)
- **Non-blocking**: Failures return null, never stop carousel generation

## Database Tables

### `asset_embeddings` (pgvector)

```sql
id              uuid PRIMARY KEY
asset_id        uuid
asset_url       text UNIQUE NOT NULL
category        text NOT NULL        -- 'facility', 'equipment', 'product', 'asset', 'template'
tags            text[] DEFAULT '{}'  -- ['clean-room', 'iso-7', 'orthopedic']
search_text     text                 -- Concatenated name + description
embedding       vector(1536)         -- Legacy: text-embedding-3-small
embedding_v2    vector(768)          -- New: Gemini Embedding 2 (multimodal)
embedding_model text                 -- Which model generated the embedding
quality_score   numeric DEFAULT 0.75
active          boolean DEFAULT true
```

### `linkedin_carousels`

```sql
id              uuid PRIMARY KEY
topic           text
slides          jsonb                -- Array of SlideData objects
caption         text
status          text                 -- draft, pending_approval, approved, published
profile_type    enum                 -- 'company' or 'salesperson'
```

### `product_catalog` (legacy asset source)

```sql
id              uuid PRIMARY KEY
category        text                 -- 'facility', 'equipment', etc.
image_url       text
name            text
description     text
metadata        jsonb
embedding       vector(1536)         -- Legacy embeddings
```

## Available Facility Photos

```
clean-room-1 through clean-room-7
production-floor
production-overview
grinding-room
laser-marking
electropolish-line-new
exterior
reception-hero
water-treatment
polishing-manual
cleanroom-hero
```

Base URL: `https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/content_assets/ingested/`

## Visual Templates (4 approved)

| Template | Use Case | Key Features |
|----------|----------|-------------|
| **A — Glassmorphism Card** | Body/CTA slides (default) | Dark overlay + glass card left + green label + bold headline + logo top-right |
| **B — Full-Bleed Dark Text** | Hook/cover slides | No card, full-bleed, huge headline, accent line bottom, slide counter |
| **C — Split Comparison** | Before/after comparisons | 50/50 vertical split, different tint each half |
| **D — Pure Photo** | Equipment/facility showcase | Minimal text overlay |

Reference images in `GoodPostExemples/`.

## Cost Tracking

| Operation | Model | Cost |
|-----------|-------|------|
| Text embedding (OpenRouter) | text-embedding-3-small | $0.00002 |
| Text embedding (Gemini) | gemini-embedding-exp-03-07 | ~$0.0001 |
| Image embedding (Gemini) | gemini-embedding-exp-03-07 | ~$0.0001 |
| Vision QA scoring | gemini-2.5-flash-preview | ~$0.003 |
| Satori rendering | N/A (local) | $0.00 |
| Image upload | Supabase Storage | $0.00 |

All AI calls use `executeWithCostTracking` from `_shared/costTracking.ts`.

## Critical Rules

1. **ALWAYS use real facility photos** as backgrounds — never AI-generated
2. **Logo and ISO badge must be real assets** composited via Satori — never AI-generated
3. **Never overwrite image_variants** — always append
4. **Cost tracking on every AI call** — no unbounded loops
5. **Dark blue overlay** `rgba(0,20,65,0.58)` over real photos for text readability
6. **One slide at a time** for regeneration — WORKER_LIMIT if all 5 at once (~27-30s per slide)

## Embedding Script

To re-embed all assets with Gemini Embedding 2:

```bash
GEMINI_API_KEY=xxx deno run --allow-net --allow-env --allow-read scripts/embed_assets_gemini.ts
```

This embeds actual facility photos as vectors (not just text descriptions), enabling true visual-semantic matching.

---
name: lifetrek-linkedin-designer-agent
description: Define Lifetrek LinkedIn carousel art direction per slide using manufacturing context and brand colors. Use when the user asks for visual concepts, composition, mood, and background guidance for each slide.
---

# Lifetrek LinkedIn Designer Agent

Receives copy from the Copywriter and produces per-slide visual direction that the image composition system (Satori) or AI image generator will execute.

## Source Files (Load Before Executing)

### Tier 1 — Visual Rules (REQUIRED)
- [SOCIAL_MEDIA_GUIDELINES.md](file:///Users/rafaelalmeida/lifetrek/docs/brand/SOCIAL_MEDIA_GUIDELINES.md) — base families A/B/C/D, approved variants, visual rules, accents
- [BRAND_BOOK.md](file:///Users/rafaelalmeida/lifetrek/docs/brand/BRAND_BOOK.md) — colors, gradients, glassmorphism specs, photography style

### Tier 2 — Photo Assets (REQUIRED)
- [GoodPostExemples/](file:///Users/rafaelalmeida/lifetrek/GoodPostExemples/) — winning visual references
- Equipment photos in `product_catalog` (Supabase, category=`facility`):
  - `production-floor`, `production-overview`, `grinding-room`, `laser-marking`
  - `electropolish-line-new`, `polishing-manual`
  - `clean-room-1` through `clean-room-7`, `cleanroom-hero`
  - `exterior`, `reception`, `water-treatment`
- Product/equipment photos:
  - `src/assets/metrology/zeiss-contura.png` — ZEISS CMM
  - `src/assets/equipment/` — CNC, lathes
  - `src/assets/facility/` — cleanrooms, production floor
  - `src/assets/products/` — implants, instruments

### Tier 3 — Brand Context (IF NEEDED)
- [COMPANY_CONTEXT.md](file:///Users/rafaelalmeida/lifetrek/docs/brand/COMPANY_CONTEXT.md) — machinery specs for visual accuracy

## Inputs
- `topic` (required)
- `slides` copy draft from Copywriter (headline/body/type per slide) (required)
- Optional: `equipment_priority`, `reference_image_context`, `analyst_feedback`

## Procedure

1. Load Tier 1 + Tier 2 source files.
2. For each slide, determine the **base visual family** (A/B/C/D) and the strongest approved variant from `GoodPostExemples/`.
3. Select a **background photo** using the photo selection logic.
4. Define visual concept, composition, mood, and color emphasis.
5. Specify **typography weight direction** based on copywriter's `**bold**` markers.
6. Return strict JSON.

## Template Decision Tree (CRITICAL)

Use A/B/C/D as base families. Do NOT stop there if `GoodPostExemples/` contains a stronger approved variant for the same family.

```
IF slide.type == "hook":
  → Template B — Full-Bleed Dark Text
  → Large bold white headline, no text card
  → Logo top-right + thin rule line
  → Slide counter bottom-left ("1 de 7")

IF slide.type == "content" | "value" | "problem" | "proof":
  → Template A — Glassmorphism Card
  → Real photo background + dark overlay (rgba(0,30,70,0.65))
  → Glass card left-aligned (~65% width)
  → Label in Innovation Green #1A7A3E (ALL CAPS)
  → Headline Inter Bold 42–48px, white

IF slide.type == "conclusion" | "cta":
  → Template A — Glassmorphism Card (with emphasis)
  → Stronger green or orange accent line
  → If CTA: bold action verb headline

IF topic involves comparison (A vs B, import vs local):
  → Template C — Split Comparison
  → 50/50 vertical split, different color tints

IF topic is equipment showcase or facility highlight:
  → Template D — Pure Photo
  → Minimal text, high-quality real photo
  → Use equipment images as AI reference images
```

## Approved Variant Mapping

Use these as approved composition references:

- Template A variants:
  - `RiscoDeRecall.jpeg`
  - `1772644433414.jpeg`
  - `CalculeSeuCustoReal.jpeg`
  - `ProgrammaticCarrousel.jpeg`
- Template B variants:
  - `GreatVisualAndBolding.jpeg`
  - `PrototipagemRapida.jpeg`
  - `ZeissPost.jpeg` when the headline remains dominant
- Template C variants:
  - `ISO8vsISO7.jpeg`
  - `90v30dias.jpeg`
  - `MesmaMaquinaMesmaQualidade.jpeg`
- Template D variants:
  - `ZeissPost.jpeg` when the image itself carries the message
  - `master-showcase-v4.mp4`
  - `swissturning_premium.mp4`
- AI-assisted references:
  - `AICarrousel.jpeg`
  - `A:FullyAIPost.jpeg`
  - Use only when real-asset matching is insufficient

When a reference feels hybrid, map it to the nearest family and reuse the approved layout logic instead of inventing a new one.

## Photo Selection Logic

```
1. SEMANTIC MATCH: Match slide content keywords to facility photos
   - "ZEISS" | "CMM" | "metrologia"  →  zeiss-contura.png or metrology room
   - "sala limpa" | "cleanroom"       →  clean-room-1..7 or cleanroom-hero
   - "CNC" | "usinagem" | "Citizen"   →  production-floor or grinding-room
   - "eletropolimento"                →  electropolish-line-new
   - "laser" | "marcação"             →  laser-marking
   - "implante" | "produto"           →  product photos from src/assets/products/

2. FALLBACK: If no semantic match:
   → production-floor or production-overview

3. AI-GENERATED: Only if no real match AND topic explicitly allows creative imagery
   → Flag: "ai_generated": true in output
   → Use real equipment images as REFERENCE for AI generation
```

## Typography Direction

Translate the copywriter's `**bold**` markers into visual weight instructions:

```
IF word is **bold** in copy:
  → Font weight: 700 (Bold) or 800 (Extra Bold)
  → Slightly larger font size (+2px) for key numbers

IF word is regular in copy:
  → Font weight: 400 (Regular)
  → Standard font size
```

## Output Contract

```json
{
  "slides": [
    {
      "slide_number": 1,
      "template": "B",
      "visual_concept": "Descrição fotográfica do cenário principal",
      "composition": "Arranjo visual dos elementos (card posição, texto posição)",
      "mood": "Clima emocional da imagem",
      "color_emphasis": "Paleta de cores predominante (#004F8F, #1A7A3E, etc.)",
      "background_photo": "production-floor | clean-room-1 | zeiss-contura | etc.",
      "background_source": "facility_catalog | src/assets | ai_generated",
      "typography_weights": {
        "headline_bold_words": ["TCO", "2026"],
        "body_bold_words": ["ISO 13485", "30 dias"]
      }
    }
  ]
}
```

## 🚫 NEVER DO

- ❌ Use AI-generated backgrounds when a real Lifetrek photo matches
- ❌ Same visual concept for multiple slides — each must be DISTINCT
- ❌ Reduce the library to only 4 rigid layouts and ignore stronger approved variants
- ❌ Conflict with Satori overlay rules (don't specify text rendering that Satori can't do)
- ❌ Generic stock-photo descriptions ("businessman shaking hands", "abstract blue waves")
- ❌ Colors outside the brand palette (#004F8F, #1A7A3E, #F07818, white)
- ❌ Skip logo placement on Templates A and B
- ❌ Template D for text-heavy slides
- ❌ Ignore copywriter's bold markers — always translate them to weight instructions

## Guardrails

- Every slide must reference a real facility/product photo OR explicitly flag `ai_generated: true`.
- Every brief should be traceable to both a base family and a concrete approved reference from `GoodPostExemples/` whenever possible.
- Distinct visual concept per slide — no repetition.
- Follow Lifetrek palette: Corporate Blue `#004F8F`, Innovation Green `#1A7A3E`, Energy Orange `#F07818`.
- Typography direction must mirror the copywriter's emphasis markers.
- All text descriptions in PT-BR.

---
name: lifetrek-linkedin-designer-agent
description: Define Lifetrek LinkedIn carousel art direction per slide using manufacturing context and brand colors. Use when the user asks for visual concepts, composition, mood, and background guidance for each slide.
---

# Lifetrek LinkedIn Designer Agent

Receives copy from the Copywriter and produces per-slide visual direction that the image composition system (Satori) or AI image generator will execute.

## Source Files (Load Before Executing)

### Tier 1 — Visual Rules (REQUIRED)
- [SOCIAL_MEDIA_GUIDELINES.md](file:///Users/rafaelalmeida/lifetrek/docs/brand/SOCIAL_MEDIA_GUIDELINES.md) — Templates A/B/C/D definitions, visual rules, accents
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
2. For each slide, determine the **visual template** (A/B/C/D).
3. Select a **background photo** using the photo selection logic.
4. Define visual concept, composition, mood, and color emphasis.
5. Specify **typography weight direction** based on copywriter's `**bold**` markers.
6. Return strict JSON.

## Template Decision Tree (CRITICAL)

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
- ❌ Conflict with Satori overlay rules (don't specify text rendering that Satori can't do)
- ❌ Generic stock-photo descriptions ("businessman shaking hands", "abstract blue waves")
- ❌ Colors outside the brand palette (#004F8F, #1A7A3E, #F07818, white)
- ❌ Skip logo placement on Templates A and B
- ❌ Template D for text-heavy slides
- ❌ Ignore copywriter's bold markers — always translate them to weight instructions

## Guardrails

- Every slide must reference a real facility/product photo OR explicitly flag `ai_generated: true`.
- Distinct visual concept per slide — no repetition.
- Follow Lifetrek palette: Corporate Blue `#004F8F`, Innovation Green `#1A7A3E`, Energy Orange `#F07818`.
- Typography direction must mirror the copywriter's emphasis markers.
- All text descriptions in PT-BR.

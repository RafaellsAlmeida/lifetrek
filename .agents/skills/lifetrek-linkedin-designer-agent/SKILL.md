---
name: lifetrek-linkedin-designer-agent
description: Define Lifetrek LinkedIn carousel art direction per slide using manufacturing context and brand colors. Use when the user asks for visual concepts, composition, mood, and background guidance for each slide.
---

# Lifetrek LinkedIn Designer Agent

Use this skill to produce per-slide visual direction JSON before image generation.

## Inputs
- `topic`
- `slides` copy draft (headline/body/type)
- `brand_colors`
- Optional: `design_rules`, `equipment_priority`, `reference_image_context`

## Procedure
1. Load [prompt.md](references/prompt.md).
2. Generate one visual concept per slide.
3. Keep direction specific to medical manufacturing visuals.
4. Return strict JSON only.

## Output Contract
```json
{
  "slides": [
    {
      "slide_number": 1,
      "visual_concept": "...",
      "composition": "...",
      "mood": "...",
      "color_emphasis": "...",
      "background_elements": "..."
    }
  ]
}
```

## Guardrails
- Distinct visual concept per slide.
- Follow Lifetrek palette and industrial-medical context.
- Avoid text styling instructions that conflict with Satori overlay rules.

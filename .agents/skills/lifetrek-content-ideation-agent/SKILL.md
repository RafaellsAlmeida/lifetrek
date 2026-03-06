---
name: lifetrek-content-ideation-agent
description: Generate PT-BR content ideas for Lifetrek across LinkedIn, Instagram, blog, and resources using ICP pains, proof points, and CTA intent.
---

# Lifetrek Content Ideation Agent

Use this skill when you need ideation before writing copy or generating assets.

## Inputs
- `goal`
- `platform` (`linkedin`, `instagram`, `blog`, `resource`, `multi`)
- `target_icp`
- `pain_points` (array)
- Optional: `proof_points`, `seasonality`, `keyword_constraints`, `ideas_count`

## Procedure
1. Load [prompt.md](references/prompt.md).
2. Build ideas around ICP pain -> proof -> action.
3. Keep all ideas in PT-BR, engineer-to-engineer tone.
4. Return strict JSON only.

## Output Contract
```json
{
  "ideas": [
    {
      "title": "...",
      "platform": "linkedin",
      "angle": "...",
      "targetAudience": "...",
      "painPoint": "...",
      "desiredOutcome": "...",
      "proofPoints": ["..."],
      "ctaAction": "...",
      "priority": "high"
    }
  ]
}
```

## Guardrails
- No generic marketing clichés.
- Include operational proof in each idea.
- Keep CTA concrete and low-friction.

---
name: lifetrek-linkedin-style-brief-agent
description: Extract a reusable style brief from high-performing Lifetrek LinkedIn carousels. Use when the user asks to learn headline patterns, tone, visual mood, and CTA structure from historical winners.
---

# Lifetrek LinkedIn Style Brief Agent

Use this skill to infer winning creative patterns from historical carousel performance.

## Inputs
- `top_carousels` dataset or summaries
- Optional: engagement metrics by post

## Procedure
1. Load [prompt.md](references/prompt.md).
2. Analyze narrative and headline patterns from top posts.
3. Produce a reusable creative brief for downstream agents.
4. Return strict JSON only.

## Output Contract
```json
{
  "narrative_pattern": "...",
  "headline_formula": "...",
  "winning_tone": "...",
  "visual_mood": "...",
  "cta_structure": "...",
  "key_insight": "..."
}
```

## Guardrails
- Keep output actionable for strategist/copywriter/designer.
- Prefer patterns grounded in observed winners.

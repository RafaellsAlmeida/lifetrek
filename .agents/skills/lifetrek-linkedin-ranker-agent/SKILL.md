---
name: lifetrek-linkedin-ranker-agent
description: Rank multiple Lifetrek LinkedIn carousel variations and select the best option. Use when the user generates two or more candidate versions and needs an objective winner with reasons.
---

# Lifetrek LinkedIn Ranker Agent

Use this skill to compare multiple generated carousel variations.

## Inputs
- `variations` (strategy + copy + design summaries)
- Optional: campaign objective

## Procedure
1. Load [prompt.md](references/prompt.md).
2. Evaluate each variation with consistent criteria.
3. Return ranking and winner rationale in JSON.

## Output Contract
```json
{
  "ranking": [
    { "variation": 1, "score": 88, "reason": "..." }
  ],
  "winner": 1,
  "winner_reason": "..."
}
```

## Guardrails
- Keep criteria explicit: hook impact, narrative coherence, brand alignment, originality.
- Provide short, concrete justifications.

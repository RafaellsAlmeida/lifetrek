---
name: lifetrek-linkedin-ranker-agent
description: Rank multiple Lifetrek LinkedIn carousel variations and select the best option. Use when the user generates two or more candidate versions and needs an objective winner with reasons.
---

# Lifetrek LinkedIn Ranker Agent

Compares multiple generated carousel variations and selects the winner based on consistent criteria.

## Source Files (Load Before Ranking)

### Tier 1 — Evaluation Standards (REQUIRED)
- [SOCIAL_MEDIA_GUIDELINES.md](file:///Users/rafaelalmeida/lifetrek/docs/brand/SOCIAL_MEDIA_GUIDELINES.md) — base-family compliance, approved-variant use, CTA rules
- [BRAND_BOOK.md](file:///Users/rafaelalmeida/lifetrek/docs/brand/BRAND_BOOK.md) — voice, tone, brand alignment standards

### Tier 2 — Winning Patterns (RECOMMENDED)
- [GoodPostExemples/](file:///Users/rafaelalmeida/lifetrek/GoodPostExemples/) — reference for what "winning" looks like
- Style brief from `lifetrek-linkedin-style-brief-agent` if available

## Inputs
- `variations` (required) — array of strategy + copy + design summaries (2+ variations)
- Optional: `campaign_objective`, `priority_icp`

## Procedure

1. Load Tier 1 source files.
2. Score each variation on 4 criteria (see matrix below).
3. Check whether each variation is anchored to a strong approved reference from `GoodPostExemples/`, not just a generic A/B/C/D label.
4. Apply tie-breaking rules if scores are within 3 points.
5. Select the winner with concrete justification.
6. Return strict JSON.

## Evaluation Matrix

| Criterion | Weight | What to Evaluate |
|:---|:---|:---|
| **Hook Impact** | 30% | Will this stop the scroll? Specific or generic? Data-driven? |
| **Narrative Coherence** | 25% | Does the arc flow logically? Does tension build? |
| **Brand Alignment** | 25% | Engineer-to-engineer tone? No hype? Claims supported? CTA rules followed? |
| **Creative Originality** | 20% | Does it stand out in the feed? Memorable or forgettable? |

**Score per criterion: 0–100. Weighted total = final score.**

## Tie-Breaking Rules

```
IF two variations are within 3 points of each other:
  1. Prefer the one with the stronger hook (Hook Impact wins)
  2. If hooks are equal, prefer better brand alignment
  3. If still tied, prefer the more creative/original option
```

## Decision Rules

```
IF campaign_objective == "lead_generation":
  → Weight Hook Impact higher (+10% bonus)
  → CTA compliance is mandatory

IF campaign_objective == "authority_building":
  → Weight Narrative Coherence higher (+10% bonus)
  → No CTA expected

IF priority_icp is specified:
  → Check if the hook speaks directly to that ICP's pain
  → Penalize variations that are too generic for the ICP
```

## Output Contract

```json
{
  "ranking": [
    {
      "variation": 1,
      "score": 88,
      "breakdown": {
        "hook_impact": 90,
        "narrative_coherence": 85,
        "brand_alignment": 92,
        "creative_originality": 82
      },
      "reason": "Justificativa curta e concreta (PT-BR)"
    },
    {
      "variation": 2,
      "score": 79,
      "breakdown": {
        "hook_impact": 70,
        "narrative_coherence": 82,
        "brand_alignment": 85,
        "creative_originality": 78
      },
      "reason": "Justificativa curta e concreta (PT-BR)"
    }
  ],
  "winner": 1,
  "winner_reason": "Por que esta variação é a melhor (PT-BR)",
  "improvement_suggestion": "Uma sugestão para tornar o vencedor ainda melhor"
}
```

## 🚫 NEVER DO

- ❌ Rank without scoring all 4 criteria
- ❌ Give the same score to all variations — find meaningful differences
- ❌ Vague justifications ("this one is better") — be specific and concrete
- ❌ Ignore CTA rule violations in any variation
- ❌ Let personal preference override the scoring matrix
- ❌ Skip tie-breaking rules when scores are close

## Guardrails

- All justifications in **PT-BR**.
- Return **JSON only** — no markdown fences, no preamble.
- Score breakdown must be transparent and reproducible.
- Always provide at least one `improvement_suggestion` for the winner.
- Minimum 2 variations required to rank. If only 1 is provided, return score without ranking.

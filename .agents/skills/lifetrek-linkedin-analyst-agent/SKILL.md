---
name: lifetrek-linkedin-analyst-agent
description: Evaluate Lifetrek LinkedIn carousel quality and decide revision routing. Use when the user asks for scoring, issue detection, and whether to revise copywriter, designer, or both before final approval.
---

# Lifetrek LinkedIn Analyst Agent

Use this skill as the quality gate in the carousel pipeline.

## Inputs
- `slides` copy JSON
- `design_direction` JSON
- Optional: `image_sources`

## Procedure
1. Load [prompt.md](references/prompt.md).
2. Score clarity, narrative, brand, and visual quality.
3. Flag issues and define revision targets.
4. Return strict JSON only.

## Output Contract
```json
{
  "overall_score": 85,
  "clarity": 22,
  "narrative": 23,
  "brand": 20,
  "visual": 20,
  "feedback": "...",
  "copy_feedback": "...",
  "design_feedback": "...",
  "revision_targets": [],
  "issues": ["..."],
  "needs_revision": false
}
```

## Guardrails
- Cap total score at 100.
- Penalize markdown artifacts and non-PT-BR copy.
- Set `needs_revision = true` when score is below threshold.

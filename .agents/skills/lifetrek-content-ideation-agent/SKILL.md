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

## Source Files (Load Before Generating)
- [prompt.md](references/prompt.md) — ideation system prompt
- [lifetrek-anti-ai-slop-writing/SKILL.md](file:///Users/rafaelalmeida/lifetrek/.agents/skills/lifetrek-anti-ai-slop-writing/SKILL.md) — banned vocabulary, structural rules. Apply to idea `title` and `angle` fields specifically (REQUIRED)

## Procedure
1. Load `prompt.md` and the anti-AI-slop directive (PT-BR banned list at minimum).
2. Build ideas around ICP pain -> proof -> action.
3. Keep all ideas in PT-BR, engineer-to-engineer tone.
4. Validate every `title` and `angle` against the anti-slop directive: no banned tokens, no rule-of-three default, no vague hooks ("Você sabia...?", "Descubra como...", "Já parou pra pensar...?"), no marketing clichés.
5. Return strict JSON only.

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
- No generic marketing clichés. Specifically reject any `title` or `angle` containing tokens from `lifetrek-anti-ai-slop-writing/references/banned-words-pt.md` — including "revolucionário", "alavancar", "potencializar", "destrave", "no atual cenário", "vale destacar", "vamos mergulhar", "tradição e inovação", "padrão de excelência", "soluções sob medida" (sem detalhe).
- No vague-hook titles ("Você sabia que...?", "Descubra como...", "Já parou pra pensar...?", "Aqui está tudo que você precisa saber sobre...").
- Vary the count when listing items in titles ("3 erros..." is fine if there are genuinely 3, but do not default to 3 — try 2, 4, 5, 7).
- Include operational proof in each idea.
- Treat `target_icp` as internal strategy context, not user-facing copy. Do not include raw ICP labels or codes in blog, resource, LinkedIn, or Instagram text.
- Keep CTA concrete and low-friction.

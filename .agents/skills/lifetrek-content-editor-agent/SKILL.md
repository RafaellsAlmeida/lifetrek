---
name: lifetrek-content-editor-agent
description: Human-edit assistant for Lifetrek blog/resource/social drafts, producing revised PT-BR content with clarity, compliance, and brand fidelity.
---

# Lifetrek Content Editor Agent

Use this skill to revise draft content before approval/publishing.

## Inputs
- `content_type` (`blog`, `resource`, `linkedin`, `instagram`)
- `draft_text` (or draft JSON)
- `edit_goal` (clarity, brevity, conversion, compliance)
- Optional: `max_length`, `seo_keywords`, `forbidden_claims`

## Source Files (Load Before Editing)

- [prompt.md](references/prompt.md) — editor system prompt
- [lifetrek-anti-ai-slop-writing/SKILL.md](file:///Users/rafaelalmeida/lifetrek/.agents/skills/lifetrek-anti-ai-slop-writing/SKILL.md) — banned vocabulary, structural rules, self-check (REQUIRED)

## Procedure
1. Load `prompt.md` and the anti-AI-slop directive (including `banned-words-pt.md`, `banned-words-en.md`, `structural-rules.md`).
2. Apply human editorial improvements without changing technical meaning.
3. Keep PT-BR and engineer-to-engineer tone.
4. Run the 12-step anti-slop self-check on the revised draft. Continue revising until it passes.
5. Return revised content + compact checklist.

## Output Contract
```json
{
  "revised": {
    "title": "...",
    "body": "...",
    "caption": "..."
  },
  "edits_summary": ["..."],
  "review_checklist": {
    "clarity": true,
    "brand_tone": true,
    "claim_safety": true,
    "cta_quality": true,
    "anti_slop_passed": true,
    "anti_slop_issues_fixed": ["..."]
  }
}
```

`anti_slop_passed` must be `true` on return. List in `anti_slop_issues_fixed` every category of slop you removed (banned tokens, em-dash overuse, parataxis, rule-of-three default, hedging seesaw, fabricated specifics, etc.) so the change is auditable.

## Guardrails
- Never invent certifications, regulatory status, or legal claims.
- Numbers in a draft fall into three buckets — handle each differently:
  1. **Backed by Tier 1–4 evidence** (public site, vendor datasheet, internal validated trial like CMM/MSA/FAI). Keep the number. Ensure the qualifier (machine, part family, time window) is present in the sentence. For `blog`/`resource`/`newsletter` content, ensure the citation is visible (footnote, inline link, or "datasheet do fabricante", "FAI de [data]", "ISO 13485:2016 §8.5.1"). For `linkedin`/`instagram` content, no visible citation is needed — just the qualifier in the claim text.
  2. **Backed by no traceable source.** Remove or replace with "cerca de" / "aproximadamente". Do not preserve the fabrication.
  3. **Extrapolation beyond evidence scope** (e.g. claiming a tolerance for "all parts" when the trial covered one geometry). Restrict to the validated scope in the rewrite.
- When in doubt about whether a number has evidence, defer to `lifetrek-technical-claims-guardian` (mode `claim-review`, channel = the content type being edited).
- Strip every banned PT-BR token from `banned-words-pt.md` (revolucionário, alavancar, potencializar, vamos mergulhar, vale destacar, no atual cenário, em essência, etc.). Replace with a concrete alternative or restructure.
- Reduce em-dashes to a maximum of 1 per 500 words. Convert extras to commas, semicolons, colons, parentheses, or new sentences.
- Break parataxis (3+ short consecutive sentences) by connecting with conjunctions or punctuation.
- Break default rule-of-three lists when the content is not genuinely three items.
- Convert passive constructions ("foi realizado", "foi aprovado") to active voice unless the subject is genuinely unknown.
- Keep ICP/persona labels as internal planning metadata only; never publish client-facing headings or copy such as "ICP deste conteúdo", "ICP primário", "MI", "OD", or "VT".
- Keep editorial/publication guidance internal; never publish sections like "Como falar disso publicamente", "linguagem aprovada", "não devem ser publicados", or instructions about what can/cannot be said publicly.
- Keep changes auditable (summarize what changed).
- Prefer concise language and concrete proof.

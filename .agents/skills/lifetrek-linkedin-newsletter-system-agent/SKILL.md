---
name: lifetrek-linkedin-newsletter-system-agent
description: Adapt Lifetrek blogs and resources into recurring LinkedIn newsletter editions, feed promo posts, and approval notes. Use when planning or writing the Boletim Lifetrek, repurposing blog/resource topics for LinkedIn, or deciding how a site article should become newsletter content.
---

# Lifetrek LinkedIn Newsletter System Agent

Use this skill to turn a canonical Lifetrek blog or resource into a LinkedIn newsletter edition and a short feed distribution post.

## Source Files

Load these before producing the final package:

1. `docs/strategy/lifetrek-linkedin-newsletter-system.md`
2. `docs/brand/BRAND_BOOK.md`
3. `docs/brand/COMPANY_CONTEXT.md`
4. `docs/brand/SOCIAL_MEDIA_GUIDELINES.md`
5. `.agents/skills/lifetrek-anti-ai-slop-writing/SKILL.md` — anti-AI-slop directive (REQUIRED). Newsletter editions are 650–1,000 words of long-form prose, which is exactly where banned tokens, em-dash overuse, parataxis, and rule-of-three defaults are most visible. Load all three references: `banned-words-pt.md`, `banned-words-en.md`, `structural-rules.md`.

When writing copy, also load `references/prompt.md`.

## Core Rule

The site is canonical. LinkedIn is distribution and audience-building.

- Blog/resource: complete version, SEO, FAQ, resource links, sales reference.
- Newsletter: editorial version adapted for LinkedIn reading behavior.
- Feed post: short distribution asset that promotes the edition or resource.

Do not copy the full blog into LinkedIn. Rewrite the topic for the platform.

## Editorial Classification (post_class)

Every LinkedIn output produced by this agent or the broader LinkedIn pipeline must carry a `post_class` label so the modeling dataset stays clean.

| `post_class` | When to use | Enters modeling dataset? |
|---|---|---|
| `editorial` | Newsletter editions, feed promo posts tied to a blog/resource, thematic technical posts (e.g. the May 2026 4-week test in `docs/strategy/linkedin-test-may-2026-execution-plan.md`). | Yes |
| `institutional` | Brand, anniversary, certification announcements, trade shows, corporate updates. | No |
| `recruiting_or_announcement` | Job openings, site launches, commercial changes, partnership announcements. | No |

Rules:

- The newsletter package this agent returns is always `post_class: editorial`. Surface the value inside `approval_notes` so the publisher can tag it correctly.
- If the canonical source is institutional or a recruiting/announcement note, do not produce a newsletter edition. Route it to a separate institutional track and stop.
- Only `post_class: editorial` posts are included in the next modeling rounds (`output/linkedin_post_audit/build_linkedin_post_audit.mjs`, `output/linkedin_post_audit/analyze_linkedin_post_factors.py`). Mixing classes pollutes coefficients on `topic_group` and `post_format_clean`.

## Required Output

Return a single package:

```json
{
  "canonical_source": {
    "type": "blog | resource | blog_plus_resource",
    "title": "...",
    "url_or_slug": "..."
  },
  "newsletter": {
    "newsletter_name": "Boletim Lifetrek de Manufatura Médica",
    "edition_title": "...",
    "pillar": "rastreabilidade | primeiro_lote | fornecedores_iso_13485 | escala_regulada",
    "cover_image_brief": "...",
    "body_markdown": "...",
    "cta": "..."
  },
  "feed_promo": {
    "post_text": "...",
    "visual_brief": "...",
    "cta": "..."
  },
  "approval_notes": [
    "post_class: editorial",
    "..."
  ]
}
```

## Newsletter Format

Use this structure for every edition:

1. Title with operational tension, not generic advice.
2. Opening paragraph tied to risk, containment, audit, recall, supplier approval, or scale.
3. Three narrative sections:
   - what breaks in the operation,
   - what evidence or decision changes the outcome,
   - how to review the issue without creating bureaucracy.
4. One short checklist or 2-4 critical bullets only.
5. CTA to the canonical resource or blog when it is a lead magnet.

Target length: 650-1,000 words. Shorter is acceptable if the piece is sharp.

## Feed Promo Format

Create one short LinkedIn post:

- Hook in the first line.
- One concrete operational insight.
- Mention the newsletter edition or resource.
- Ask for subscription or access only when the asset is a newsletter edition or lead magnet.

## Guardrails

- Write client-facing copy in PT-BR with correct accents.
- Keep the tone technical, pragmatic, and engineer-to-engineer.
- Do not publish internal audience labels, persona notes, editorial instructions, or content safety notes.
- Do not expose codes like `MI`, `OD`, `VT`, or labels such as "ICP deste conteúdo".
- Avoid hype, generic marketing language, and unsupported claims.
- Use serious Lifetrek technical imagery or a clear photo/inspection/product direction; avoid generic stock-style visuals.
- Always emit `post_class` in `approval_notes`. Refuse to produce a newsletter package for inputs whose canonical source is institutional or a recruiting/announcement note.

## Anti-AI-Slop (Required for newsletter body and feed promo)

Before returning the package, run the 12-step self-check from `lifetrek-anti-ai-slop-writing/SKILL.md` over `newsletter.body_markdown` and `feed_promo.post_text`. Newsletter prose at 650–1,000 words is the highest-risk surface in the pipeline; apply these constraints strictly:

- **Banned PT-BR tokens.** Never use "revolucionário", "transformador", "alavancar", "potencializar", "destravar", "no atual cenário", "no mundo atual", "vale destacar que", "é importante notar que", "em essência", "no fim do dia", "vamos mergulhar", "vamos explorar a fundo", "vamos nos aprofundar", "tradição e inovação", "padrão de excelência", "DNA de inovação", "soluções sob medida" (sem detalhe), "experiência única". Full list in `references/banned-words-pt.md`.
- **Banned openers.** Never start a paragraph with "Certamente,", "Adicionalmente,", "Ademais,", "Outrossim,", "Notavelmente,", "Importantemente,", "Curiosamente,", "Interessantemente,", "De fato,", "No geral,".
- **Em-dash limit.** Maximum 1 em-dash (—) per 500 words across the full edition. Replace extras with commas, semicolons, colons, or new sentences.
- **No rule of three by default.** The newsletter format calls for "three narrative sections" because the operational arc genuinely has three (what breaks → what changes the outcome → how to review without bureaucracy). Inside each section, do not default to three sub-points or three examples.
- **No parataxis.** Three or more short consecutive declarative sentences must be connected with subordinate clauses, conjunctions, semicolons, or commas.
- **Sentence-length variance.** Mix short fragments with long sentences. Never three consecutive sentences within ±3 words of each other.
- **Active voice.** Prefer "A auditoria pegou o desvio no segundo lote" over "O desvio foi identificado pela auditoria".
- **Quantitative claims are allowed when evidenced and cited.** Newsletter editions are 650–1,000 words of editorial prose where real numbers carry the argument. Quantitative claims (tolerances, Cpk, cycle times, lead times, accuracy figures) are encouraged when:
  - the evidence exists in a vendor datasheet (Citizen, ZEISS, etc.) **or** in internal validated evidence (CMM logs, MSA, FAI reports, pilot-lot data); AND
  - the claim is **qualified** (specific machine, part family, time window); AND
  - the source is **cited inline**. Newsletter style: "segundo o datasheet do fabricante", "no FAI de junho de 2025", "no estudo MSA LT-2025-06", "ISO 13485:2016 §8.5.1". Footnotes are optional; inline attribution is the default.
  - Defer to `lifetrek-technical-claims-guardian` (mode `claim-review`, channel `newsletter`) for any claim that is not already in the canonical source. The guardian returns the qualified rewrite plus the citation format.
  - Never invent a number, client name, date, audit finding, or quote that has no Tier 1–4 evidence. If a real number is missing, restructure the sentence or use "cerca de" / "aproximadamente".
- **Never extrapolate** a validated tolerance/Cpk to broader scope than the underlying trial covered.
- **Regulatory pathway language (ANVISA/FDA/ISO 13485 scope) stays Tier 1** — match the public site, do not sharpen.
- **No corporate pep talk.** Include the friction: what broke, what didn't work the first time, what the engineer almost did wrong before the audit caught it.
- **Hook of the feed promo first line.** Specific, data-anchored, not a question. Never "Você sabia...?", "Já pensou em...?", "Descubra...".

Add `"anti_slop_passed: true"` to `approval_notes` once the self-check passes.

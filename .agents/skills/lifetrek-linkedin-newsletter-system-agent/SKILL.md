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

---
name: lifetrek-technical-claims-guardian
description: Technical and brand claim guardian for Lifetrek content. Use when validating machinery, products, metrology, facility, regulatory, or process claims against the website, local assets, and approved brand language before publishing.
---

# Lifetrek Technical Claims Guardian

Use this skill as the source-of-truth review layer for technical content.

## Primary Jobs

1. Consolidate published and approved Lifetrek language from the site and brand docs.
2. Validate whether a claim is supported, generalized, inferred, or unsafe.
3. Detect internal contradictions across website pages, assets, and prompt-style docs.
4. Rewrite content into language that is publishable, technically safer, and brand-consistent.

## Source Hierarchy

Always review sources in this order.

### Tier 1: Approved public source

Use first:
- `src/pages/Products.tsx`
- `src/pages/Capabilities.tsx`
- `src/pages/Infrastructure.tsx`
- `src/pages/Quality.tsx`
- `docs/brand/BRAND_BOOK.md`
- `docs/brand/COMPANY_CONTEXT.md`

Treat these as the strongest source for published wording, canonical naming, and already-assumed market positioning.

### Tier 2: Visual corroboration

Use next:
- `src/assets/equipment/`
- `src/assets/metrology/`
- `src/assets/facility/`
- `src/assets/products/`

Use these to confirm that a machine, facility, or product family visibly exists in Lifetrek materials. Do not let assets alone authorize strong operational, quantitative, or regulatory claims.

### Tier 3: Internal technical prompts and docs

Use as supporting context:
- prompt files under `.agents/skills/`
- `src/config/`
- campaign configs
- content scripts
- marketing docs

These help explain how the company talks internally, but they do not authorize strong claims on their own.

### Tier 4: Inference

Only infer when needed from:
- machine names
- visible product geometry
- general process logic

Inference can support moderate wording, not hard claims.

## Modes

### 1. `source-audit`

Use when the user wants to audit or consolidate the technical truth base.

Output:
- consolidated entities
- contradictions
- missing validation items
- recommended temporary wording

### 2. `claim-review`

Use when the user provides a draft caption, post, carousel, or article section.

Output:
- extracted claims
- evidence tier per claim
- approval decision per claim
- internal conflict alerts
- rewritten publishable version

### 3. `content-brief-prep`

Use when strategist or copywriter context needs to be made safe before drafting.

Output:
- approved claims
- soft claims
- blocked claims
- preferred terms
- avoid terms
- recommended assets
- risk notes

## Required Workflow

1. Load `references/public-language-map.md`.
2. Load `references/claims-policy.md`.
3. Load `references/source-conflicts.md`.
4. Load `references/product-taxonomy.md` if products or applications are involved.
5. Load `references/asset-evidence-index.md` if a machine, facility, metrology asset, or product image is relevant.
6. Compare the draft against published wording before approving any strong claim.
7. If sources conflict, mark `[conflicting_internal_sources]`.
8. If evidence is missing, mark `[needs_stakeholder_validation]`.
9. Always return a rewritten version that is safer than the input.

## Decision Rules

- If a claim is published and visually corroborated, it can usually be approved as written or lightly tightened.
- If a claim is published but broad, keep it broad. Do not sharpen it into a more specific claim.
- If a claim relies only on inference, soften it.
- If a claim is operationally specific, quantitative, or regulatory without strong proof, block or flag it.
- If two internal sources disagree, do not pick the stronger-sounding version. Use temporary neutral wording and flag the conflict.
- If a product image clearly belongs to a different family than the copy, flag the mismatch.

## Output Contracts

### `claim-review`

Return JSON only:

```json
{
  "overall_status": "approved_with_edits",
  "claims": [
    {
      "text": "...",
      "entity": "...",
      "classification": "B - Published but generalized",
      "decision": "soften",
      "reason": "...",
      "evidence_refs": ["..."],
      "flags": [],
      "safe_rewrite": "..."
    }
  ],
  "rewrites": {
    "best_safe": "...",
    "bolder_safe": "...",
    "ultra_conservative": "..."
  },
  "published_language_matches": ["..."],
  "internal_conflicts": ["..."],
  "recommended_assets": ["..."],
  "needs_stakeholder_validation": ["..."]
}
```

### `content-brief-prep`

Return JSON only:

```json
{
  "topic": "...",
  "approved_claims": [],
  "soft_claims": [],
  "blocked_claims": [],
  "preferred_terms": [],
  "avoid_terms": [],
  "recommended_assets": [],
  "risk_notes": []
}
```

### `source-audit`

Return markdown with these sections:
- `Consolidated Entities`
- `Conflicts`
- `Needs Validation`
- `Temporary Safe Wording`

## Guardrails

- Never invent certifications, numerical performance, tolerances, inspection coverage, or regulatory status.
- Never convert broad published language into narrow production guarantees.
- Never use asset presence alone as proof of throughput, process sequence, or validation outcome.
- Never publish internal claim-review guidance verbatim. Sections that describe "approved language", "how to speak publicly", or what should not be published must be rewritten as normal client-facing content or removed.
- Treat `ANVISA`, `FDA`, `ISO 13485`, tolerance numbers, defect-rate claims, and setup-count claims as high-scrutiny areas.
- Prefer the wording already used on the site when in doubt.
- If a prompt or campaign file is stronger than the site, default to the site.

## When To Escalate

Mark `[needs_stakeholder_validation]` when:
- the claim contains a number, tolerance, defect rate, throughput change, or lead-time delta;
- the claim describes a highly specific process sequence not already published;
- the claim implies regulatory acceptance or customer validation outcome;
- the claim depends on choosing between conflicting internal sources.

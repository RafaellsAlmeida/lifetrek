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

Always review sources in this order. The hierarchy is about evidence strength, not about exclusion — Tier 3 and Tier 4 are real evidence sources for quantitative claims, not weaker fallbacks to Tier 1.

### Tier 1: Approved public source

Use first:
- `src/pages/Products.tsx`
- `src/pages/Capabilities.tsx`
- `src/pages/Infrastructure.tsx`
- `src/pages/Quality.tsx`
- `docs/brand/BRAND_BOOK.md`
- `docs/brand/COMPANY_CONTEXT.md`

Treat these as the strongest source for published wording, canonical naming, and already-assumed market positioning. Required source for regulatory and certification language.

### Tier 2: Visual corroboration

Use next:
- `src/assets/equipment/`
- `src/assets/metrology/`
- `src/assets/facility/`
- `src/assets/products/`

Use these to confirm that a machine, facility, or product family visibly exists in Lifetrek materials. Do not let assets alone authorize strong operational, quantitative, or regulatory claims — but combined with Tier 3 or Tier 4 they support qualified quantitative claims about the specific equipment shown.

### Tier 3: Manufacturer-published specifications

Recognized vendor sources:
- machine datasheets (Citizen, Mori Seiki, DMG Mori, Mazak, etc.)
- metrology equipment specs (ZEISS, Mitutoyo, Hexagon, etc.)
- finishing-line equipment manuals
- material/coating supplier datasheets
- ISO/ASTM/ANVISA published standards (when quoted accurately with clause reference)

Use this tier to authorize quantitative claims about equipment performance that are public information from the manufacturer. Always name the manufacturer and the exact spec; never paraphrase a datasheet number into a stronger one. For blog and resource content, cite the datasheet (revision and date when available). For LinkedIn, the manufacturer name in the claim is sufficient context.

### Tier 4: Internal validated empirical evidence

Recognized internal sources:
- CMM logs and dimensional reports
- MSA / Gage R&R studies
- FAI (First Article Inspection) reports
- validated pilot-lot data with defined sample and time window
- supplier-qualified trial reports
- audit logs from quality system

Use this tier to authorize quantitative claims about Lifetrek's actual manufacturing performance. Required structure: claim must include the **part family or geometry**, the **machine or process**, and the **time window or sample size**. Cite the report ID for blog/resource content. For LinkedIn, embed the qualifiers in the claim text itself.

### Tier 5: Internal technical prompts and editorial docs

Use as supporting context:
- prompt files under `.agents/skills/`
- `src/config/`
- campaign configs
- content scripts
- marketing docs

These help explain how the company talks internally, but they do not authorize strong claims on their own. If a prompt or campaign file contains a number that does not appear in Tier 1–4, treat the number as unsourced.

### Tier 6: Engineering inference

Only infer when needed from:
- machine names
- visible product geometry
- general process logic

Inference can support moderate qualitative wording, never quantitative claims.

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

- If a claim is published and visually corroborated (Tier 1 + Tier 2), approve as written or tighten lightly.
- If a claim is published but broad (Tier 1 only), keep it broad. Do not sharpen into a more specific claim.
- If a claim is **quantitative and supported by Tier 3 (vendor datasheet) or Tier 4 (internal validated evidence)**, approve when:
  - the claim names the specific equipment, part family, or condition that the evidence covers; AND
  - the channel-appropriate citation rule is met (blog/resource → cite source; LinkedIn/Instagram → qualifier embedded in claim text).
  - Do not strip the number. Add the qualifier instead.
- If a claim is quantitative and supported only by Tier 5 (internal prompt/marketing doc) or Tier 6 (inference), block the number and rewrite to qualitative or remove.
- If a claim relies only on inference, keep it qualitative and soften.
- If a claim is regulatory (FDA pathway, ANVISA registration status, ISO scope) without Tier 1 confirmation, block or rewrite. Tier 3 vendor docs and Tier 4 internal trials never authorize regulatory pathway claims.
- If a claim extrapolates beyond the validated condition (e.g. applies a tolerance from one part family to "all parts"), block or restrict to the validated scope.
- If two internal sources disagree, do not pick the stronger-sounding version. Use temporary neutral wording and flag the conflict.
- If a product image clearly belongs to a different family than the copy, flag the mismatch.

## Channel Input

Always ask the caller for the target channel (`blog`, `resource`, `newsletter`, `linkedin`, `instagram`, `internal_sales`) before doing `claim-review` or `content-brief-prep`. The decision on whether to require a visible citation depends on it. If the caller does not specify, default to `linkedin` (qualifier required, citation not visible) and emit a `assumed_channel` note in the output.

Channel rules summary:

- `blog`, `resource`, `whitepaper` — Tier 3/4 claims must carry a visible citation (footnote, inline link, or "datasheet do fabricante", "estudo MSA interno LT-XXX-YYYY-MM", "ISO 13485:2016 §8.5.1").
- `newsletter` — inline attribution is enough ("segundo o datasheet do fabricante", "no FAI de junho de 2025"); footnotes optional.
- `linkedin`, `instagram` — no visible citation, but the claim must embed the qualifier (machine, part family, condition, time window).
- `internal_sales`, `proposal` — cite by source ID.

## Output Contracts

### `claim-review`

Return JSON only:

```json
{
  "overall_status": "approved_with_edits",
  "channel": "linkedin",
  "claims": [
    {
      "text": "...",
      "entity": "...",
      "classification": "E - Empirically or vendor-documented",
      "evidence_tier": "T3 - Manufacturer datasheet | T4 - Internal validated evidence | T1 | T2 | T5 | T6",
      "evidence_source": "ZEISS Contura datasheet rev. 2024-03 | LT-MSA-2025-06 | site /quality | ...",
      "qualifier_present": true,
      "decision": "approve | approve_with_qualifier | soften | block | rewrite",
      "reason": "...",
      "evidence_refs": ["..."],
      "flags": [],
      "citation_required": true,
      "citation_format_suggestion": "Footnote: 'Datasheet ZEISS Contura, rev. 2024-03'",
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

Notes:

- `evidence_tier` must be filled. If the claim is quantitative and the tier resolves to T5 or T6, the claim's `decision` must be `block` or `soften` (never `approve`).
- `qualifier_present` answers: does the claim text already include the machine, part family, condition, or time window? If `false` for a Tier E quantitative claim, set `decision: "approve_with_qualifier"` and provide the qualified version in `safe_rewrite`.
- `citation_required` and `citation_format_suggestion` follow the channel rule. For LinkedIn/Instagram set `citation_required: false` but still suggest format in case the same content is repurposed for blog.

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

- Never invent certifications, numerical performance, tolerances, inspection coverage, or regulatory status that has no Tier 1–4 evidence behind it.
- Never convert broad published language into narrow production guarantees by sharpening Tier 1 or Tier 2 claims into quantitative ones unless Tier 3 or Tier 4 evidence supports the sharper version.
- Never use asset presence alone as proof of throughput, process sequence, or validation outcome.
- Never strip a number that has Tier 3 or Tier 4 evidence behind it just because the channel is LinkedIn — instead, ensure the qualifier is present in the claim text. Removing well-evidenced specificity is its own quality failure.
- Never extrapolate a validated tolerance/Cpk/cycle-time from one part family to a broader scope.
- Never authorize regulatory pathway claims (FDA, ANVISA) from Tier 3 or Tier 4 — those require Tier 1 confirmation.
- Never publish internal claim-review guidance verbatim. Sections that describe "approved language", "how to speak publicly", or what should not be published must be rewritten as normal client-facing content or removed.
- Treat `ANVISA`, `FDA`, `ISO 13485`, regulatory pathway claims, and "guaranteed/always/never" framing as high-scrutiny areas regardless of tier.
- Prefer the wording already used on the site when in doubt.
- If a prompt or campaign file is stronger than the site, default to the site.

## When To Escalate

Mark `[needs_stakeholder_validation]` when:
- the claim contains a number, tolerance, defect rate, throughput change, or lead-time delta **and** the evidence tier resolves to T5 (internal marketing doc) or T6 (inference) only;
- the claim contains a quantitative Tier 4 reference (internal trial) but the report ID, sample size, or time window is missing;
- the claim describes a highly specific process sequence not already published;
- the claim implies regulatory acceptance or customer validation outcome beyond Tier 1 wording;
- the claim depends on choosing between conflicting internal sources.

Do **not** escalate when:
- the claim has clear Tier 3 (vendor datasheet) or Tier 4 (validated internal trial) evidence and the qualifier is present;
- the only issue is missing visible citation on a LinkedIn/Instagram claim — fix in copy, do not block.

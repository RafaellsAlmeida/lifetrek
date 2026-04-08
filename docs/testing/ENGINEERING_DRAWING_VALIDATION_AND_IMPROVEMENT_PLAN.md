# Engineering Drawing Validation And Improvement Plan

## Validation Run

- Run ID: `validation-run-2026-04-07`
- Storage bucket: `engineering-drawings`
- Storage prefix: `reports/validation-runs/validation-run-2026-04-07/`
- Local manifest: `tmp/engineering-drawing-validation-run/validation-run-2026-04-07/engineering-drawing-validation-manifest.json`
- Local report: `tmp/engineering-drawing-validation-run/validation-run-2026-04-07/engineering-drawing-validation-report.pdf`

## Saved Evidence

Uploaded to Supabase storage:

- `manual-technical-drawing-supported-3d.png`
- `manual-technical-drawing-gdt-cleared.png`
- `technical-drawing-3d-happy-path.png`
- `technical-drawing-gdt-review.png`
- `technical-drawing-final.png`
- `engineering-drawing-validation-report.pdf`

## What Was Verified

### Automated

- `playwright/tests/api/engineering-drawing.api.spec.ts` passed
- `playwright/tests/e2e/technical-drawing.e2e.spec.ts` passed
- `npm run build` passed

### Manual In-App Validation

- Supported axisymmetric sketch flow passed:
  - upload
  - ambiguity resolution
  - geometry review confirmation
  - semantic review confirmation
  - 2D generation
  - 3D preview
  - GLB export enabled
- GD&T review gate passed:
  - drawing with unknown governing standard blocked rendering
  - reviewer selected standard and confirmed callout
  - rendering/export became available after semantic review cleared

## Observed Results

### What Is Working

- The supported axisymmetric pipeline is stable end to end.
- Semantic GD&T gating is blocking export until reviewer confirmation.
- Unsupported geometry is preserved and blocked instead of being rendered as misleading 3D.
- Evidence can now be bundled and published into project storage through a repeatable script.

### What Still Needs Improvement

- First-pass extraction confidence still depends heavily on heuristics and fixtures.
- Reviewer corrections are applied, but not yet reused to improve future suggestions.
- The E2E harness needed hardening because the module uses persistent admin state and long-lived page activity.
- 3D fidelity remains intentionally scoped to supported axisymmetric geometry rather than full CAD-grade detail.

## Improvement Strategy

The next realistic step is a reviewed-example feedback loop. This is intentionally simple, auditable, and deterministic. It does not require introducing a separate machine-learning platform.

### Phase 1: Capture Reviewer Corrections

Goal: persist exactly what the reviewer changed.

Store field-level deltas for:

- governing standard selection
- datum type changes
- callout review status changes
- ambiguity resolutions
- feature association overrides
- unsupported-to-accepted reviewer decisions

Each correction should also store:

- raw extracted text
- feature or callout id
- confidence bucket
- fixture id or session id
- reason code such as `standard`, `symbol_parse`, `leader_target`, `datum_type`, `tolerance_value`, `unsupported_scope`

Expected impact:

- Creates the labeled correction history needed for future rule improvement.

### Phase 2: Reviewed-Example Memory

Goal: reuse accepted reviewer decisions when a new extraction matches a known pattern.

Approach:

- Create a small reviewed example store keyed by:
  - normalized raw callout text
  - governing standard family
  - feature kind
  - axisymmetric flag
  - local geometry context when available
- On extraction, check reviewed examples before generic fallback heuristics.
- Surface the reason in UI as:
  - `Sugerido com base em exemplo revisado`

Expected impact:

- Repeated title-block patterns, datum labels, and common FCF structures should converge faster with less manual correction.

### Phase 3: Acceptance-Rate Tuning

Goal: decide what is safe to suggest with higher confidence.

Approach:

- Track acceptance rate per heuristic and per reviewed-example pattern.
- Promote a suggestion only if:
  - it has enough prior reviewed examples
  - reviewer acceptance stays above a strict threshold
  - there is no conflicting correction history
- Demote unstable patterns back to `review-required`.

Expected impact:

- Confidence becomes calibrated by reviewer agreement instead of only OCR or parser confidence.

### Phase 4: Gold Corpus Replay

Goal: turn approved drawings into a long-term regression corpus.

Approach:

- Export approved sessions into a gold corpus containing:
  - source image
  - geometry draft
  - reviewed geometry spec
  - reviewed semantic document
  - expected 2D result
  - expected 3D readiness
  - expected export outcome
- Replay the corpus on every extraction or validation change.
- Fail CI if a previously accepted reviewed case regresses without an explicit rule change.

Expected impact:

- The module improves from reviewed production history while staying deterministic and auditable.

## Concrete Next Implementation Slice

### Scope

- Persist `review_corrections` records for engineering drawing sessions.
- Add helper utilities to compare extraction draft vs reviewed final state.
- Add a reviewed-example lookup for:
  - standard detection
  - datum type suggestion
  - callout normalization
  - ambiguity suggestions
- Show the source of each suggestion in the review UI.

### Do Not Automate Yet

- Auto-accept standards-sensitive GD&T without review
- Composite or advanced ISO semantics
- Automatic cross-standard conversion
- Non-axisymmetric 3D generation
- Metrology-grade conformance decisions

## Test Impact

After the validation run, the Playwright suite was hardened to remove false failures caused by:

- `networkidle` waits on a page with long-lived traffic
- ambiguous fixture selection in a growing recent-session list
- parallel test interference on a stateful admin workflow

The current test stance for this module should remain:

- API contract tests for geometry + semantic validation
- serial E2E flow for the stateful admin drawing module
- manual in-app validation for at least one supported and one GD&T-blocked case before major release decisions

## Republish Command

To rebuild and republish the same style of validation bundle:

```bash
node --env-file=.env scripts/engineering-drawing/publish-validation-run.mjs validation-run-YYYY-MM-DD
```

This expects fresh JSON results in:

- `tmp/engineering-drawing-validation-run/api-results.json`
- `tmp/engineering-drawing-validation-run/e2e-results.json`

# Claims Policy

Use this file to classify claims before approving publication.

## Classification System

### A - Published and corroborated

Definition:
- the claim or a very close equivalent is already published in Tier 1 sources; and
- it is reinforced by coherent assets or repeated public references.

Allowed action:
- approve
- minor tightening only

Examples:
- Lifetrek has ISO 13485 certification.
- Lifetrek presents ZEISS Contura metrology capability.
- Lifetrek presents ISO 7 cleanroom capability.

### B - Published but generalized

Definition:
- the idea is publicly present, but the available wording is broad;
- the claim should stay broad and not be sharpened into a technical guarantee.

Allowed action:
- approve if kept broad
- soften if the draft is too specific

Examples:
- Swiss turning helps concentrate precision machining capability.
- Metrology supports dimensional control and traceability.
- Fewer process handoffs can improve predictability.

### C - Asset or inference supported only

Definition:
- the machine, product family, or process appears visually or is a reasonable technical inference;
- the exact claim is not clearly published in public wording.

Allowed action:
- soften
- use conditional or process-compatible wording

Examples:
- a specific Citizen machine may support certain geometry families;
- a product image suggests a product family, but not a quantified performance claim.

### D - Unsupported or conflicting

Definition:
- the claim is not supported by Tier 1 or Tier 2 evidence; or
- internal sources conflict; or
- the statement is stronger than the published evidence.

Allowed action:
- block
- replace with temporary neutral wording
- mark `[needs_stakeholder_validation]`

Examples:
- exact tolerance, defect-rate, or lead-time numbers without source;
- “single setup” for broad classes of complex implants without published support;
- “same CNC program from pilot to series” without explicit public support;
- generic FDA-compliance claims when the public wording is more limited.

## High-Scrutiny Claim Types

Always apply higher scrutiny to:
- quantitative claims
- tolerance claims
- inspection coverage claims like `100% CMM`
- defect-rate claims
- lead-time reduction claims
- regulatory pathway claims
- process-sequence claims
- language that sounds like a guarantee

## Rewrite Heuristics

Use these default moves:

- Replace certainty with operational tendency.
  - `reduces` -> `helps reduce`
  - `guarantees` -> `supports`
  - `ensures` -> `helps control`

- Replace narrow absolutes with geometry-qualified language.
  - `in a single setup` -> `in fewer fixations for compatible geometries`

- Replace validation certainty with engineering predictability.
  - `more confidence to validate` -> `more predictability in dimensional evaluation`

- Replace regulatory overreach with documentation-support wording.
  - `FDA-ready` -> `supports customer documentation needs depending on the project`

## Temporary Safe Wording Defaults

Use these when evidence is mixed:

- `estrutura de Swiss turning em equipamentos Citizen`
- `capacidade de metrologia com ZEISS Contura e inspeção complementar`
- `ambiente ISO 7 para etapas compatíveis com essa operação`
- `famílias de implantes e instrumentais mostradas no portfólio`
- `benefícios esperados de um processo com menos transferências e mais controle`

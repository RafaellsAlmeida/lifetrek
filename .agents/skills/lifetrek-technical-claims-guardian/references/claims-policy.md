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

### E - Empirically or vendor-documented (citation-ready)

Definition:
- the claim is a quantitative or specific statement (tolerance, accuracy, cycle time, surface finish) that is supported by either:
  - a manufacturer-published spec (Citizen, Mori Seiki, ZEISS, DMG Mori, Mitutoyo, etc. — datasheets, brochures, manuals); OR
  - internal validated empirical evidence (CMM logs, MSA/Gage R&R studies, FAI reports, validated pilot-lot data, supplier-qualified trial reports).

Allowed action:
- approve when the claim is **qualified** (specific machine, specific part family, specific condition) AND the channel-appropriate citation rule is met (see below).
- soften only if the claim generalizes beyond the validated condition (e.g. claiming a tolerance for "all parts" when the trial covered a single part family).
- never strip the qualifier — "± 5 µm na geometria do implante odontológico modelo X em Citizen L20" is approvable; "± 5 µm" alone is not.

Examples:
- "O ZEISS Contura tem precisão volumétrica MPE_E publicada em até 1.6 + L/333 µm" — vendor-documented, blog cites the ZEISS datasheet, LinkedIn writes it plainly without footnote.
- "Em estudo MSA de junho de 2025 no Citizen L20, mantivemos Cpk ≥ 1.67 na cota crítica do conector dental modelo X" — empirically supported; blog cites internal report ID, LinkedIn keeps the qualifiers.
- "Os FAIs dos últimos 12 lotes de [família X] passaram em 100% dos pontos críticos no primeiro CMM" — empirically supported across a defined window; cite the audit log range.

Why this exists:
- The earlier policy treated every number as Tier D. That over-restricts content. Real engineering writing leans on real numbers, and Lifetrek has real machines and real measurements behind them. The discipline is qualification + citation, not blanket avoidance.

### D - Unsupported or conflicting

Definition:
- the claim is not supported by Tier 1, Tier 2, manufacturer datasheet, or internal validated evidence; or
- internal sources conflict; or
- the statement is stronger than what the underlying evidence supports (extrapolation beyond validated range, regulatory overreach, "always" / "never" / "guaranteed" framing).

Allowed action:
- block
- replace with temporary neutral wording
- mark `[needs_stakeholder_validation]`

Examples:
- exact tolerance, defect-rate, or lead-time numbers with **no** source (neither datasheet nor internal trial nor public site);
- "single setup" for broad classes of complex implants without published support;
- "same CNC program from pilot to series" without explicit public support;
- generic FDA-compliance claims when the public wording is more limited;
- extrapolating a validated tolerance from one part family to "all parts".

## Channel-Aware Citation Rules

Different channels require different evidence visibility. The underlying evidence must always exist; what changes is how it appears in the published text.

| Channel | Tier E claim handling |
|---|---|
| Blog / Resource / Whitepaper | Cite the source visibly: footnote, inline link, or "datasheet do fabricante", "estudo MSA interno LT-MSA-2025-06", "ISO 13485:2016 §8.5.1". The number without a citation is a flag. |
| Newsletter (Boletim Lifetrek) | Cite when the claim is the centerpiece of the edition. Inline attribution like "segundo o datasheet do fabricante" or "no FAI de junho de 2025" is sufficient — no footnotes needed. |
| LinkedIn caption / slide | No visible citation required, but the claim must be **qualified**: include the machine name, the part family, the process condition, or the time window. "Mantemos Cpk ≥ 1.67 na cota crítica do conector dental X no Citizen L20" passes; "alta precisão" with a number does not. |
| Instagram | Same as LinkedIn — qualifier required, citation not visible. |
| Internal sales / proposal | Cite source by ID (datasheet revision, MSA report number, FAI batch range). |

## High-Scrutiny Claim Types

Always apply higher scrutiny to:
- quantitative claims **without a qualifier** (machine, part family, condition)
- tolerance claims that generalize beyond the validated geometry
- inspection coverage claims like `100% CMM` (require validated audit window)
- defect-rate claims (require defined sample and time window)
- lead-time reduction claims (require before/after pair with same scope)
- regulatory pathway claims (Tier 1 only — no Tier E shortcut for FDA/ANVISA pathway language)
- process-sequence claims that imply a single fixed sequence
- language that sounds like a guarantee ("sempre", "nunca falha", "garantido")

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

- For Tier E numbers, **add the qualifier instead of removing the number**:
  - `± 5 µm` (raw) -> `± 5 µm na geometria do implante odontológico modelo X em Citizen L20`
  - `Cpk ≥ 1.67` (raw) -> `Cpk ≥ 1.67 na cota crítica do conector dental modelo X (estudo MSA LT-2025-06)`
  - `lead time de 18 dias` (raw) -> `lead time de 18 dias para lotes piloto de [família X], média dos últimos 6 lotes em 2025`

## Temporary Safe Wording Defaults

Use these when evidence is mixed:

- `estrutura de Swiss turning em equipamentos Citizen`
- `capacidade de metrologia com ZEISS Contura e inspeção complementar`
- `ambiente ISO 7 para etapas compatíveis com essa operação`
- `famílias de implantes e instrumentais mostradas no portfólio`
- `benefícios esperados de um processo com menos transferências e mais controle`

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

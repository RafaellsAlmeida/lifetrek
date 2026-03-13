# Source Conflicts

Use this file whenever internal sources disagree. If a draft depends on one of these areas, return `[conflicting_internal_sources]`.

## Conflict 1

Claim area:
- Citizen machine naming and image pairing

Source A:
- `/Users/rafaelalmeida/lifetrek/src/pages/Capabilities.tsx`

Source B:
- `/Users/rafaelalmeida/lifetrek/src/pages/Infrastructure.tsx`
- `/Users/rafaelalmeida/lifetrek/src/assets/equipment/citizen-l20-new.png`
- `/Users/rafaelalmeida/lifetrek/src/assets/equipment/citizen-m32-new.png`

Conflict:
- `Capabilities.tsx` appears to pair `Citizen M32` with one asset and `Citizen L20-VIII LFV` with another in a way that may be swapped or at least inconsistent with the rest of the repo.

Recommended temporary wording:
- `estrutura de Swiss turning com equipamentos Citizen`
- `equipamentos Citizen L20/M32`, but only when the copy does not depend on exact image-to-name pairing

Needs stakeholder validation:
- yes

## Conflict 2

Claim area:
- strength of FDA wording

Source A:
- some internal prompts and campaign-style files use stronger global-compliance language

Source B:
- `/Users/rafaelalmeida/lifetrek/docs/guides/LIFETREK_RAG_KNOWLEDGE.md`
- `/Users/rafaelalmeida/lifetrek/docs/brand/BRAND_BOOK.md`

Conflict:
- internal materials sometimes drift toward generic `FDA compliance support` language, while other sources are more careful and position Lifetrek around ISO 13485, ANVISA, and project-specific documentation support.

Recommended temporary wording:
- `suporte às necessidades documentais do cliente conforme o projeto`
- prefer `ISO 13485 + ANVISA` over broad FDA-ready wording

Needs stakeholder validation:
- yes

## Conflict 3

Claim area:
- inspection coverage language

Source A:
- some internal docs say `100% CMM inspection`

Source B:
- core public pages emphasize metrology and ZEISS capability, but the exact blanket statement is not consistently surfaced in the main website pages reviewed for this skill

Conflict:
- inspection capability is clear, but blanket `100% CMM` wording should be treated as high scrutiny unless a stakeholder confirms it is still approved for publication in that exact form.

Recommended temporary wording:
- `metrologia com ZEISS Contura e inspeção complementar de features críticas`
- `controle dimensional com suporte de CMM`

Needs stakeholder validation:
- yes

## Conflict 4

Claim area:
- specificity of process-sequence claims for Swiss turning

Source A:
- internal content drafts often escalate to claims like `single setup`, `same CNC program from pilot to series`, or exact geometry combinations

Source B:
- public sources support Swiss-type capability broadly, but not all of these specific operational statements

Conflict:
- broad manufacturing capability is public; the exact operational promise is not consistently public.

Recommended temporary wording:
- `mais operações em menos fixações para geometrias compatíveis`
- `ajuda a reduzir transferências e variabilidade de processo`

Needs stakeholder validation:
- yes

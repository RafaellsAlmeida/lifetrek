# Lead Magnets (Resources)

## Purpose
This document tracks the lead magnets surfaced on the public `/resources` route and the approval workflow used by the admin team.

## Where They Live
- Data source: `public.resources` in Supabase.
- Public routes: `/resources` (list) and `/resources/:slug` (detail).
- Admin editor: `/admin/resources`.
- Admin approval: `/admin/content-approval` (items with `status = pending_approval`).

## Workflow
1. Create or edit a resource in `/admin/resources` with `status = pending_approval`.
2. The item appears in Content Approval under "Recursos".
3. Review Markdown body, metadata, persona, thumbnail and preview in the editorial workspace.
4. Approve to publish (status becomes `published`) or reject (status becomes `rejected`).
5. Published items render on `/resources` and `/resources/:slug`.

## Current Approval Cycle (P0)
- Cycle date: `2026-02-20`
- Scope: approval-only (stakeholder review via `/admin/content-approval`)
- New P0 lead magnets:
  - `calculadora-custo-falha-qualidade` (`calculator`)
  - `checklist-transferencia-npi-producao` (`checklist`)
- Pending refresh set (10 existing slugs):
  - `checklist-producao-local`
  - `checklist-auditoria-iso-13485`
  - `guia-sala-limpa-dispositivos-medicos`
  - `checklist-auditoria-fornecedores-medicos`
  - `whitepaper-usinagem-suica-dispositivos-medicos`
  - `guia-metrologia-3d-cnc-swiss`
  - `guia-metrologia-alta-precisao`
  - `guia-sala-limpa-iso-7`
  - `scorecard-risco-supply-chain-2026`
  - `iso-13485-auditoria-usinagem`

### Editorial Positioning (avoid overlap)
- `checklist-auditoria-iso-13485`: internal SGQ audit focus.
- `checklist-auditoria-fornecedores-medicos`: second-party supplier qualification focus.
- `iso-13485-auditoria-usinagem`: machining + metrology process audit focus.

## Required Fields (Minimum)
| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Display title. |
| `description` | yes | Short teaser shown on cards. |
| `content` | yes | Markdown rendered on the detail page. |
| `type` | yes | `checklist`, `guide`, or `calculator`. |
| `slug` | yes | Used in `/resources/:slug`. |
| `status` | yes | `pending_approval` for review, `published` for live. |
| `persona` | no | Example: `Supply Chain / CFO`. |
| `thumbnail_url` | no | Optional card image. |
| `metadata` | no | JSON for tags or flags. |

## Editorial Workspace Standard
- Resources use Markdown in the main canvas because the public detail page renders `resources.content` with `ReactMarkdown`.
- Metadata stays in the right panel: type, status, persona, description, thumbnail URL and JSON metadata.
- Use `Salvar` for draft/review persistence and `Publicar` only when the public page should become live.
- Approval deep links must preserve `returnTo` and `stateKey` after save, publish or cancel.

## Metadata Contract (Approval Quality)
Use this minimum `metadata` contract for resources in approval:
- `tags`
- `value_promise`
- `interactive_block`
- `estimated_read_minutes`
- `review_version`
- `review_owner`

## Current Lead Magnets
| Title | Slug | Type | Persona | Status | Route |
| --- | --- | --- | --- | --- | --- |
| Fluxo de Validacao de Fadiga | `fatigue-validation-guide` | guide | Engenharia/P&D | published | `/resources/fatigue-validation-guide` |
| Checklist DFM para Implantes e Instrumentais | `dfm-checklist-implantes-instrumentais` | checklist | Engenharia / P&D | published | `/resources/dfm-checklist-implantes-instrumentais` |
| Checklist de Auditoria ISO 13485 para Usinagem | `iso-13485-auditoria-usinagem` | checklist | Qualidade / RA | published | `/resources/iso-13485-auditoria-usinagem` |
| Scorecard de Risco de Supply Chain 2026 | `scorecard-risco-supply-chain-2026` | guide | Supply Chain / CFO | published | `/resources/scorecard-risco-supply-chain-2026` |
| Roadmap de 90 Dias para Migrar 1-3 SKUs | `roadmap-90-dias-migracao-skus` | guide | Supply Chain / Operacoes | published | `/resources/roadmap-90-dias-migracao-skus` |
| Checklist: Quando Faz Sentido Produzir Local | `checklist-producao-local` | checklist | CFO / Compras | published | `/resources/checklist-producao-local` |
| Checklist de Auditoria Interna ISO 13485 | `checklist-auditoria-iso-13485` | checklist | Qualidade/Regulatory | published | `/resources/checklist-auditoria-iso-13485` |
| Guia: Sala Limpa ISO 7 e Montagem de Kits | `guia-sala-limpa-iso-7` | guide | Producao/Ops | published | `/resources/guia-sala-limpa-iso-7` |
| Manual de Metrologia e Inspecao de Alta Precisao | `guia-metrologia-alta-precisao` | guide | Qualidade/Engenharia | published | `/resources/guia-metrologia-alta-precisao` |
| Guia de Precisao: Metrologia 3D e CNC Swiss | `guia-metrologia-3d-cnc-swiss` | guide | Engenharia/Qualidade | pending_approval | `/resources/guia-metrologia-3d-cnc-swiss` |

## P0 Approval Backlog (Stakeholder Review)
All items below are expected to remain `pending_approval` during this cycle:

| Slug | Type | Interactive Block |
| --- | --- | --- |
| `checklist-producao-local` | checklist | `LocalProductionChecklistTool` |
| `checklist-auditoria-iso-13485` | checklist | `SupplierAuditCalculator` |
| `guia-sala-limpa-dispositivos-medicos` | guide | `CleanRoomClassifier` |
| `checklist-auditoria-fornecedores-medicos` | checklist | `SupplierAuditCalculator` |
| `whitepaper-usinagem-suica-dispositivos-medicos` | guide | `SwissVsConventionalTool` |
| `guia-metrologia-3d-cnc-swiss` | guide | `ToleranceLookup` |
| `guia-metrologia-alta-precisao` | guide | `ToleranceLookup` |
| `guia-sala-limpa-iso-7` | guide | `CleanRoomClassifier` |
| `scorecard-risco-supply-chain-2026` | guide | `SupplyChainRiskScorecard` |
| `iso-13485-auditoria-usinagem` | checklist | `SupplierAuditCalculator` |
| `calculadora-custo-falha-qualidade` | calculator | `CostOfQualityCalculator` |
| `checklist-transferencia-npi-producao` | checklist | `NpiTransferChecklistTool` |

## Implementation Notes
- `/resources` uses `status = published`. Pending items are visible only in Content Approval.
- `fatigue-validation-guide` is a custom route with a dedicated page. All other slugs use the generic `ResourceDetail` page.
- Interactive block resolution is centralized in `src/components/resources/ResourceInteractiveBlocks.tsx` and reused by public detail and admin preview.

# Lead Magnets (Resources)

## Purpose
This document tracks the lead magnets surfaced on the public `/resources` route and the approval workflow used by the admin team.

## Where They Live
- Data source: `public.resources` in Supabase.
- Public routes: `/resources` (list) and `/resources/:slug` (detail).
- Admin approval: `/admin/content-approval` (items with `status = pending_approval`).

## Workflow
1. Create a new record in `public.resources` with `status = pending_approval`.
2. The item appears in Content Approval under "Recursos".
3. Approve to publish (status becomes `published`) or reject (status becomes `rejected`).
4. Published items render on `/resources` and `/resources/:slug`.

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

## Implementation Notes
- `/resources` uses `status = published`. Pending items are visible only in Content Approval.
- `fatigue-validation-guide` is a custom route with a dedicated page. All other slugs use the generic `ResourceDetail` page.
- If a lead magnet needs interactive UI, add a slug-specific block in `src/pages/ResourceDetail.tsx`.

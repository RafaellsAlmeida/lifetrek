# Lead Magnets to Create Next

## Goal
Expand the `/resources` library with lead magnets that help Technical Sales Representatives start informed conversations and capture qualified leads.

## Prioritized Backlog
| Priority | Working Title | Type | Primary Persona | Proposed Slug | Intent |
| --- | --- | --- | --- | --- | --- |
| P0 | Calculadora de Custo de Falha de Qualidade | calculator | Qualidade / Operacoes | `calculadora-custo-falha-qualidade` | Quantify cost of scrap, rework, and NCRs to justify supplier change. |
| P0 | Checklist de Transferencia de Produto (NPI -> Producao) | checklist | Engenharia / Operacoes | `checklist-transferencia-npi-producao` | Reduce launch risk with a structured handoff checklist. |
| P1 | Guia de Validacao de Fornecedor (ANVISA/FDA) | guide | Qualidade / Regulatory | `guia-validacao-fornecedor-anvisa-fda` | Provide a step-by-step vendor validation framework. |
| P1 | Scorecard de Complexidade de Usinagem | guide | Engenharia / P&D | `scorecard-complexidade-usinagem` | Rapidly assess manufacturability and quote readiness. |
| P2 | Checklist de Rastreabilidade e Serializacao | checklist | Qualidade / Supply Chain | `checklist-rastreabilidade-serializacao` | Ensure end-to-end lot and serial control. |
| P2 | Guia de Setup de Sala Limpa para Kits Cirurgicos | guide | Producao / Ops | `guia-setup-sala-limpa-kits` | Outline facility and process requirements. |
| P2 | Guia de Reducao de Lead Time em Importacao | guide | Supply Chain / Compras | `guia-reducao-lead-time-importacao` | Identify levers for lead-time reduction and nearshoring. |

## Creation Checklist
1. Draft the content in Markdown and assign `type`, `persona`, and `slug`.
2. Insert into `public.resources` with `status = pending_approval`.
3. Review in `/admin/content-approval` and approve to publish.
4. Confirm it renders on `/resources` and `/resources/:slug`.

## Interactive Lead Magnets
If a lead magnet needs sliders, scorecards, or checklists, add a slug-specific block in `src/pages/ResourceDetail.tsx` and document it in `docs/content/LEAD_MAGNETS.md`.

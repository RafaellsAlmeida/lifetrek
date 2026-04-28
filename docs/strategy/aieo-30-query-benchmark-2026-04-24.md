# AIEO 30-Query Benchmark

Purpose: track whether Lifetrek appears, is cited, or is absent for high-intent buyer questions across ChatGPT, Perplexity, Google AI features, and classic Google/Bing SERP.

Source inputs:

- `docs/strategy/medical-device-cm-deep-research-report-2026-04-24.md`
- `docs/content/faq-seo-aieo-first-answer-page-drafts-2026-04-24.md`
- `docs/content/faq-seo-aieo-content-ideas-2026-04-24.json`

## Tracking Fields

For each query, record weekly:

- date checked
- surface checked: ChatGPT, Perplexity, Google AI feature, Google classic, Bing classic
- Lifetrek result: cited, mentioned without citation, surfaced in SERP, absent
- cited URL
- competitor URLs cited
- answer framing
- content gap observed
- action required

## Query Set

| # | Query | Language | Cluster | Target Lifetrek page |
|---|---|---|---|---|
| 1 | como qualificar fornecedor de dispositivos medicos ISO 13485 | PT-BR | Supplier qualification | `como-qualificar-fornecedor-manufatura-medica-iso-13485` |
| 2 | checklist auditoria fornecedor ISO 13485 dispositivos medicos | PT-BR | Supplier qualification | resource: supplier audit checklist |
| 3 | quais documentos pedir de fornecedor de manufatura medica | PT-BR | Supplier qualification | `como-qualificar-fornecedor-manufatura-medica-iso-13485` |
| 4 | como escolher contract manufacturer para dispositivo medico | PT-BR | Supplier qualification | `como-qualificar-fornecedor-manufatura-medica-iso-13485` |
| 5 | medical device supplier qualification ISO 13485 checklist | EN | Supplier qualification | English version pending |
| 6 | what to ask a medical device contract manufacturer before approval | EN | Supplier qualification | English version pending |
| 7 | o que primeiro lote controlado deve provar antes da producao medica | PT-BR | Transfer and scale-up | `o-que-primeiro-lote-controlado-deve-provar-antes-da-escala` |
| 8 | transferencia NPI para producao dispositivos medicos checklist | PT-BR | Transfer and scale-up | resource: NPI transfer checklist |
| 9 | como transferir item medico para fornecedor sem risco | PT-BR | Transfer and scale-up | `o-que-primeiro-lote-controlado-deve-provar-antes-da-escala` |
| 10 | controlled first lot medical device manufacturing what to verify | EN | Transfer and scale-up | English version pending |
| 11 | NPI to production transfer checklist medical device manufacturing | EN | Transfer and scale-up | English version pending |
| 12 | o que e FAI em componentes medicos | PT-BR | FAI and inspection | future FAI/IQ/OQ/PQ page |
| 13 | diferenca entre FAI IQ OQ PQ manufatura medica | PT-BR | FAI and inspection | future FAI/IQ/OQ/PQ page |
| 14 | first article inspection medical device machining supplier | EN | FAI and inspection | English version pending |
| 15 | como evitar revisao errada de desenho em fornecedor medico | PT-BR | Documentation control | future drawing revision page |
| 16 | drawing revision control medical device supplier transfer | EN | Documentation control | English version pending |
| 17 | rastreabilidade completa lote componentes medicos | PT-BR | Traceability | `rastreabilidade-completa-lote-componentes-medicos` |
| 18 | o que deve conter certificado CoC componente medico | PT-BR | Traceability | `rastreabilidade-completa-lote-componentes-medicos` |
| 19 | genealogia de lote dispositivos medicos o que incluir | PT-BR | Traceability | `rastreabilidade-completa-lote-componentes-medicos` |
| 20 | medical device lot traceability what should include | EN | Traceability | English version pending |
| 21 | UDI laser marking medical device what to validate | EN | UDI and marking | future UDI page |
| 22 | marcacao laser UDI o que validar dispositivo medico | PT-BR | UDI and marking | future UDI page |
| 23 | etiqueta UDI incorreta impacto recall dispositivo medico | PT-BR | UDI and marking | future UDI page |
| 24 | sala limpa ISO 7 manufatura dispositivos medicos o que muda | PT-BR | Cleanroom | existing/future ISO 7 page |
| 25 | ISO 7 cleanroom medical device manufacturing what changes | EN | Cleanroom | English version pending |
| 26 | quando componente medico precisa de sala limpa | PT-BR | Cleanroom | existing/future ISO 7 page |
| 27 | controle de mudancas processo validado usinagem medica | PT-BR | Change control | future change-control page |
| 28 | validated machining process change control medical devices | EN | Change control | English version pending |
| 29 | como conter lote suspeito em manufatura medica | PT-BR | Containment and CAPA | future containment page |
| 30 | CAPA containment response supplier medical device manufacturing | EN | Containment and CAPA | English version pending |

## Weekly Review Process

1. Run the same 30 queries without changing phrasing.
2. Capture the top cited sources and whether Lifetrek appears.
3. Mark each query as:
   - `won`: Lifetrek cited or top organic result
   - `visible`: Lifetrek appears but not as primary source
   - `absent`: Lifetrek absent
   - `wrong fit`: Lifetrek appears for the wrong entity/topic
4. Improve the bottom 3 pages or missing pages before creating net-new topics.
5. Log approved stakeholder wording before adding stronger claims to any page.

## Initial Content Gaps

- English answer pages are pending.
- Public pages for FAI/IQ/OQ/PQ, UDI laser marking, drawing-revision control, change control, and containment/CAPA are still pending.
- Stakeholder-approved Lifetrek-specific proof language for the first FAQ wave was logged on 2026-04-28 in `docs/strategy/stakeholder-claim-validation-faq-seo-aieo-2026-04-28.md`.
- Resource pages now expose a public preview, but several resources still need deeper ungated summaries for stronger AIEO extraction.

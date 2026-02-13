-- Update Roadmap content with ANVISA clarity per Vanessa's feedback
-- Key changes:
-- 1. Clarify target audience: manufacturers WITH plants in Brazil
-- 2. Explain ANVISA requirement for local manufacturing
-- 3. Clarify who Lifetrek CANNOT serve (distributors, importers, offices-only)

UPDATE public.resources
SET
  title = 'Roteiro de 90 Dias: Internalize SKUs Críticos',
  description = 'Guia prático para fabricantes de dispositivos médicos com planta no Brasil que querem reduzir dependência de importação. Inclui cronograma, checkpoints de validação e requisitos regulatórios.',
  content = $$## Objetivo
Ajudar **fabricantes de dispositivos médicos com planta no Brasil** a internalizar 1–3 SKUs críticos, reduzindo dependência de importação sem comprometer qualidade ou compliance.

> **Importante:** A ANVISA exige que o detentor do registro tenha capacidade de fabricação nacional. A Lifetrek atua como parceiro de manufatura — você mantém o controle do registro e do processo produtivo.

---

## Para quem é este roteiro

✅ Fabricantes com planta fabril no Brasil
✅ Empresas que já possuem ou estão estabelecendo registro ANVISA
✅ Operações que querem terceirizar etapas específicas (usinagem, acabamento, montagem)

## Não atendemos

❌ Distribuidores ou importadores exclusivos
❌ Empresas com apenas escritório comercial no Brasil
❌ Projetos sem perspectiva de registro próprio

---

## Semanas 1–2: Diagnóstico e Seleção

- Selecionar SKUs com maior impacto (custo, lead time, risco de ruptura)
- Levantar TCO atual: preço FOB + frete + impostos + estoque de segurança + custo de NC
- Alinhar requisitos regulatórios (seu DHF, especificações ANVISA)
- NDA + kickoff técnico

## Semanas 3–6: DFM e Validação

- Revisão colaborativa de Design for Manufacturing
- Protótipos em CNC suíço (Citizen L20/M32)
- Metrologia completa (CMM Zeiss Contura)
- Documentação alinhada ao seu sistema de qualidade

## Semanas 7–12: Produção e Estabilização

- 1º lote produtivo em ambiente controlado
- Integração com seu MRP e ciclo de pedidos
- Definição de KPIs: lead time real, taxa de NC, OTD
- Revisão de custo-benefício vs. importação

---

## Resultado esperado

| Métrica | Antes (Importação) | Depois (Local) |
|---------|-------------------|----------------|
| Lead time | 90–120 dias | 15–30 dias |
| Estoque de segurança | 3–4 meses | 2–4 semanas |
| Visibilidade de qualidade | Pós-chegada | Tempo real |
| Controle regulatório | Dependente do fornecedor | Total (você mantém o registro) |

---

## Próximo passo

Quer avaliar se faz sentido para seus SKUs? [Agende uma conversa técnica](/contact) com nossa equipe de engenharia.
$$,
  metadata = '{"category": "roadmap", "target_audience": "manufacturers_with_br_plant", "exclusions": ["distributors", "importers", "offices_only"]}'::jsonb,
  updated_at = timezone('utc'::text, now())
WHERE slug = 'roadmap-90-dias-migracao-skus';

-- Also update the production checklist to align messaging
UPDATE public.resources
SET
  description = 'Checklist de decisão para fabricantes com planta no Brasil avaliarem se vale internalizar componentes.',
  content = $$## Pré-requisito
Este checklist é para **fabricantes com planta fabril no Brasil**. Se você é distribuidor ou só possui escritório comercial, a produção local via terceirização não é viável para fins de registro ANVISA.

---

## Critérios de Avaliação (SIM/NÃO)

- [ ] Volume anual relevante (justifica setup e validação)
- [ ] Lead time de importação > 60 dias
- [ ] Alto impacto se faltar (linha para, perda de venda)
- [ ] Problemas recorrentes de qualidade ou NC
- [ ] Alto valor em estoque parado (capital imobilizado)

---

## Interpretação

| SIMs | Recomendação |
|------|--------------|
| 0–2 | Manter importação. Monitorar indicadores. |
| 3 | Avaliar piloto local para 1 SKU crítico. |
| 4–5 | Prioridade alta. Iniciar diagnóstico com parceiro de manufatura. |

---

## Próximo passo

Se marcou 3+ SIM, [baixe o Roteiro de 90 Dias](/resources/roadmap-90-dias-migracao-skus) ou [fale com nossa equipe](/contact).
$$,
  updated_at = timezone('utc'::text, now())
WHERE slug = 'checklist-producao-local';

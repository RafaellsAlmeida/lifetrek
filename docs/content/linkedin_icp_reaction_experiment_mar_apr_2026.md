# LinkedIn ICP Reaction Experiment (Mar-Apr 2026)

## Objetivo
Validar quais ângulos e formatos geram melhor resposta para os 5 ICPs da página **Quem Atendemos**, priorizando conteúdo com imagens reais de máquina/produto.

## ICPs do Website
- `MI`: Fabricantes de Implantes e Instrumentais
- `OD`: Empresas de Equipamentos Odontológicos
- `VT`: Empresas Veterinárias
- `HS`: Instituições de Saúde
- `CM`: Parceiros de Manufatura Contratada (OEM/CM)

## Hipótese Central
Posts com visual de maquinário/produto real tendem a gerar reação imediata (likes/reposts), enquanto cards mais conceituais tendem a elevar CTR/comentários por curiosidade.

## Desenho de Teste
- 2 posts por ICP (total 10 posts).
- 1 variação visual por ICP:
  - `machine_or_product` com texto curto.
  - `facility_or_process` com texto médio.
- Bucket de slides por teste:
  - `2-4` slides para prova visual rápida.
  - `5+` slides para conteúdo educacional.

## Cadência
- 3 posts por semana.
- Distribuição semanal recomendada:
  - Semana A: `MI`, `OD`, `CM`
  - Semana B: `VT`, `HS`, `MI`
  - Semana C: `OD`, `CM`, `VT`
  - Semana D: `HS` + melhores variantes das semanas anteriores

## Engine de Geração
- Usar **somente** `generate-linkedin-carousel`.
- Payload padrão:
  - `mode: "generate"`
  - `numberOfCarousels: 1`
  - `style_mode: "hybrid-composite"`
  - `researchLevel: "light"`
  - `selectedEquipment` preenchido por ICP

## KPIs por Post
- Reações por 1.000 impressões
- Comentários por 1.000 impressões
- CTR
- Engagement rate
- Reposts por 1.000 impressões

## Score de Performance (para ranking)
`score = 0.35 * reaction_rate + 0.20 * comment_rate + 0.20 * ctr + 0.15 * repost_rate + 0.10 * follows_rate`

> Use taxas normalizadas por 1.000 impressões para reduzir viés de alcance.

## Critério de Vitória
- Um ICP só entra como “vencedor” com:
  - mínimo de 2 posts publicados
  - pelo menos 300 impressões acumuladas no período
  - score médio superior aos demais ICPs no mesmo mês

## Próxima Ação
- Executar os 10 posts planejados no **Admin > Generator (ICP Content Test Lab)**.
- Consolidar resultado no relatório mensal de analytics com comparação:
  - `machine_or_product` vs `facility_or_process`
  - `2-4 slides` vs `5+ slides`

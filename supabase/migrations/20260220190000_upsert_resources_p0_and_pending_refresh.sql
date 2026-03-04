-- P0 approval cycle:
-- - refresh 10 existing pending resources
-- - add 2 new lead magnets
-- - force all 12 as pending_approval for stakeholder review

INSERT INTO public.resources (
  slug,
  title,
  description,
  content,
  type,
  persona,
  status,
  metadata,
  updated_at
)
VALUES
(
  'checklist-producao-local',
  'Checklist: Quando Faz Sentido Produzir Local',
  'Checklist de triagem para decidir nearshoring de SKUs medicos com base em risco, lead time e custo total.',
  $$## Objetivo
Avaliar rapidamente se um SKU importado deve entrar no funil de internalizacao/localizacao.

## Quando usar
- Reunioes de S&OP
- Revisao trimestral de risco de supply
- Priorizacao de SKUs para piloto

## Perguntas criticas (SIM/NAO)
1. Lead time internacional atual excede 60 dias?
2. Existe ruptura recorrente ou risco de parada de linha?
3. O estoque de seguranca imobiliza capital relevante?
4. Historico de NC do fornecedor atual e recorrente?
5. O SKU tem impacto alto em receita/paciente?
6. Ha capacidade tecnica de usinagem/metrologia local?
7. O ganho de responsividade justifica validacao?

## Interpretacao
- 0-2 SIM: manter estrategia atual e monitorar mensalmente
- 3-4 SIM: iniciar analise tecnico-financeira
- 5-7 SIM: priorizar piloto em ate 90 dias

## Entregavel esperado
Lista priorizada de SKUs com dono, prazo e criterio de sucesso.
$$,
  'checklist',
  'Supply Chain / Compras',
  'pending_approval',
  '{
    "tags": ["nearshoring", "supply-chain", "priorizacao"],
    "value_promise": "Priorizar SKUs certos para migracao local sem decisao baseada apenas em percepcao.",
    "interactive_block": "LocalProductionChecklistTool",
    "estimated_read_minutes": 6,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Supply Chain Engineering"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'checklist-auditoria-iso-13485',
  'Checklist de Auditoria Interna ISO 13485 (SGQ Vivo)',
  'Checklist para auditoria interna do SGQ com foco em evidencias operacionais e eficacia real do sistema.',
  $$## Escopo
Este checklist foi desenhado para auditoria interna de primeira parte, avaliando o SGQ da propria organizacao.

## Processos avaliados
1. Controle de documentos e registros
2. Gestao de riscos e mudancas
3. Tratativa de NC e CAPA
4. Competencia e treinamento
5. Controle de medicao e calibracao
6. Analise critica pela direcao
7. Indicadores e melhoria continua

## Testes praticos sugeridos
- Selecionar 1 CAPA encerrada e verificar evidencia de eficacia
- Escolher 1 instrumento aleatorio e validar status de calibracao
- Validar 1 instrucao de trabalho na area e conferir revisao vigente
- Rastrear 1 lote desde entrada ate liberacao final

## Faixas de maturidade
- 90%+ = SGQ robusto
- 75-89% = SGQ funcional com observacoes
- 50-74% = SGQ fragil, requer plano de acao
- <50% = risco alto de nao conformidade maior

## Saida
Plano de acao com prioridade, dono e data compromisso por lacuna.
$$,
  'checklist',
  'Qualidade / SGQ',
  'pending_approval',
  '{
    "tags": ["iso-13485", "auditoria-interna", "sgq"],
    "value_promise": "Auditar o SGQ interno por evidencia real e nao por existencia de procedimento.",
    "interactive_block": "SupplierAuditCalculator",
    "estimated_read_minutes": 8,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Quality Systems"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'guia-sala-limpa-dispositivos-medicos',
  'Guia de Sala Limpa para Dispositivos Medicos',
  'Guia pratico para planejar, operar e monitorar ambientes controlados em processos de montagem medica.',
  $$## Objetivo
Consolidar requisitos de ambiente limpo para reduzir contaminacao, desvio de processo e risco regulatorio.

## Pilares do ambiente controlado
1. Classificacao da area e diferencial de pressao
2. Fluxo de pessoas, materiais e residuos
3. Parametros ambientais monitorados (particulas, temperatura, umidade)
4. Limpeza validada e rotina de sanitizacao
5. Gowning e disciplina operacional

## O que verificar em auditoria
- Registros de monitoramento ambiental com tendencia
- Evidencia de investigacao para excursionamento
- Treinamento periodico da equipe de sala limpa
- Integridade de barreiras e fluxo unidirecional

## Erros comuns
- Tratar limpeza como rotina administrativa sem validacao
- Aceitar desvios de pressao sem avaliacao de impacto
- Atualizar SOP sem reciclagem formal dos operadores

## Entregavel
Checklist de controles minimos e plano de melhoria por criticidade.
$$,
  'guide',
  'Qualidade / Operacoes',
  'pending_approval',
  '{
    "tags": ["clean-room", "contaminacao", "compliance"],
    "value_promise": "Padronizar controles de ambiente limpo para reduzir risco de contaminacao e retrabalho.",
    "interactive_block": "CleanRoomClassifier",
    "estimated_read_minutes": 7,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Operations Excellence"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'checklist-auditoria-fornecedores-medicos',
  'Checklist de Auditoria de Fornecedores Medicos (2a Parte)',
  'Checklist para qualificacao de fornecedores com foco em rastreabilidade, CAPA, metrologia e processos especiais.',
  $$## Proposito
Avaliar fornecedor critico com profundidade de segunda parte, indo alem de certificado exposto.

## 7 processos criticos (39 itens)
1. SGQ ativo e evidencias de rotina
2. Controle de documentos na operacao
3. Rastreabilidade lote MP -> processo -> produto final
4. Compras e qualificacao de subfornecedor
5. Validacao de processo especial
6. Metrologia e calibracao
7. NC, CAPA e eficacia comprovada

## Testes de campo recomendados
- CAPA recente: verificar se a acao fechou causa raiz
- Trace test: pegar 1 lote e rastrear em tempo real
- Calibracao surpresa: checar equipamento aleatorio
- Documento na area: validar revisao vigente

## Scoring
- 90%+ = Confiavel
- 75-89% = Aprovado com observacoes
- 50-74% = Requer plano de acao
- <50% = Alto risco

## Resultado esperado
Decisao de aprovacao com risco explicito, plano de mitigacao e prazo de reavaliacao.
$$,
  'checklist',
  'Qualidade / Compras',
  'pending_approval',
  '{
    "tags": ["fornecedor", "auditoria-2a-parte", "qualificacao"],
    "value_promise": "Separar fornecedor confiavel de fornecedor de risco por evidencia operacional objetiva.",
    "interactive_block": "SupplierAuditCalculator",
    "estimated_read_minutes": 9,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Supplier Quality"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'whitepaper-usinagem-suica-dispositivos-medicos',
  'Whitepaper: Usinagem Suica para Dispositivos Medicos',
  'Comparativo tecnico entre usinagem suica e rotas convencionais para microcomponentes medicos de alta precisao.',
  $$## Contexto
Decidir processo de manufatura para geometrias complexas exige comparar capacidade, repetibilidade e custo total.

## Comparativo objetivo
### Usinagem suica
- Melhor desempenho em pecas longas e delgadas
- Alta repetibilidade em diametros pequenos
- Menos setups para geometrias complexas

### Processo convencional
- Bom para geometrias menos esbeltas
- Menor eficiencia em alta mistura de lotes pequenos
- Pode exigir mais retrabalho em tolerancias apertadas

## Criterios de decisao
1. Janela de tolerancia e concentricidade
2. Custo por lote e tempo de setup
3. Capabilidade de medicao inline/final
4. Risco de scrap e estabilidade de processo

## Recomendacao
Rodar piloto comparativo com 2-3 SKUs criticos antes de definir politica de escala.
$$,
  'guide',
  'Engenharia / Compras',
  'pending_approval',
  '{
    "tags": ["cnc-swiss", "micro-usinagem", "tco"],
    "value_promise": "Comparar rotas de manufatura com criterio tecnico e financeiro para decisoes de capacidade.",
    "interactive_block": "SwissVsConventionalTool",
    "estimated_read_minutes": 8,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Manufacturing Engineering"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'guia-metrologia-3d-cnc-swiss',
  'Guia de Metrologia 3D para CNC Swiss',
  'Guia para definir estrategia de medicao em pecas usinadas em CNC swiss com foco em CTQs e liberacao de lote.',
  $$## Objetivo
Melhorar confiabilidade de medicao em componentes de alta precisao produzidos em celulas CNC swiss.

## Blocos essenciais
1. Definicao de CTQs e plano de amostragem
2. Escolha de metodo (CMM, optico, comparador)
3. MSA e incerteza de medicao
4. Critrios de aprovacao/rejeicao por lote
5. Gatilhos de revalidacao metrologica

## Perguntas de auditoria
- Cada CTQ possui metodo de medicao padronizado?
- A frequencia de medicao esta alinhada ao risco?
- Ha evidencia de MSA e rastreabilidade metrologica?
- Desvios geram acao de contencao formal?

## Entregavel
Plano de medicao executavel com rastreabilidade e tempo de resposta definido.
$$,
  'guide',
  'Qualidade / Engenharia',
  'pending_approval',
  '{
    "tags": ["metrologia-3d", "cnc-swiss", "ctq"],
    "value_promise": "Estruturar medicao de CTQs com robustez para reduzir falso aceite e falso rejeito.",
    "interactive_block": "ToleranceLookup",
    "estimated_read_minutes": 7,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Metrology Lab"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'guia-metrologia-alta-precisao',
  'Guia de Metrologia de Alta Precisao',
  'Framework pratico para controle dimensional de pecas medicas com tolerancias apertadas e rastreabilidade total.',
  $$## Objetivo
Padronizar governanca metrologica do recebimento ate liberacao final.

## Estrutura recomendada
1. Matriz CTQ x metodo de medicao
2. Regras de calibracao e verificacao intermediaria
3. MSA por familia de caracteristica critica
4. Plano de reacao para instrumentos fora de calibracao
5. Dashboard de tendencia de desvio por processo

## Indicadores minimos
- % de caracteristicas com capabilidade de medicao comprovada
- Tempo medio de liberacao metrologica por lote
- Incidentes de calibracao vencida
- Reincidencia de desvio dimensional

## Resultado
Menor variabilidade de decisao de aceite e maior velocidade de resposta em NCs.
$$,
  'guide',
  'Qualidade / Engenharia',
  'pending_approval',
  '{
    "tags": ["metrologia", "msa", "calibracao"],
    "value_promise": "Criar rotina metrologica previsivel para acelerar liberacao sem aumentar risco de qualidade.",
    "interactive_block": "ToleranceLookup",
    "estimated_read_minutes": 8,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Metrology Lab"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'guia-sala-limpa-iso-7',
  'Guia Operacional de Sala Limpa ISO 7',
  'Passo a passo para operacao robusta de sala limpa ISO 7 em processos de montagem e embalagem medica.',
  $$## Objetivo
Transformar requisitos de ISO 7 em rotina operacional auditavel.

## Rotina diaria recomendada
1. Checklist de abertura (pressao, temperatura, umidade, particulas)
2. Liberacao de materiais e gowning
3. Ronda de disciplina de fluxo e comportamento
4. Registro de limpeza e sanitizacao
5. Fechamento com revisao de desvios

## Controle de risco
- Definir limite de alerta e limite de acao por parametro
- Formalizar plano de contingencia para excursionamento
- Garantir evidencia fotografica e registro de ocorrencia

## Erros criticos a evitar
- Uso de instrucoes obsoletas na area
- Ajuste de parametro sem aprovacao formal
- Falta de rastreio de lotes manipulados durante desvio ambiental

## Resultado esperado
Estabilidade ambiental e queda de desvios de contaminacao.
$$,
  'guide',
  'Operacoes / Qualidade',
  'pending_approval',
  '{
    "tags": ["iso-7", "clean-room", "operacao"],
    "value_promise": "Executar ISO 7 com disciplina operacional e rastreabilidade de desvios.",
    "interactive_block": "CleanRoomClassifier",
    "estimated_read_minutes": 7,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Clean Room Operations"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'scorecard-risco-supply-chain-2026',
  'Scorecard de Risco de Supply Chain 2026',
  'Scorecard executivo para classificar exposicao da cadeia e direcionar plano de mitigacao por faixa de risco.',
  $$## Como usar
Atribua nota de 1 (baixo) a 5 (alto) para cada eixo e some o total.

## Eixos de avaliacao
1. Dependencia geografica
2. Volatilidade de custo e cambio
3. Lead time e variacao logistica
4. Maturidade de qualidade/compliance do fornecedor
5. Capital imobilizado em estoque

## Faixas
- 5-10: risco baixo
- 11-18: risco moderado
- 19-25: risco alto

## Decisao recomendada
- Risco baixo: manter governanca trimestral
- Risco moderado: criar plano de contingencia por SKU critico
- Risco alto: acelerar diversificacao e localizacao seletiva

## Saida
Backlog de acoes com dono, prazo e impacto financeiro estimado.
$$,
  'guide',
  'Supply Chain / Financeiro',
  'pending_approval',
  '{
    "tags": ["scorecard", "supply-chain", "risco"],
    "value_promise": "Traduzir risco de supply em decisao executiva com prioridade clara de mitigacao.",
    "interactive_block": "SupplyChainRiskScorecard",
    "estimated_read_minutes": 6,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Supply Chain Engineering"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'iso-13485-auditoria-usinagem',
  'Checklist ISO 13485 para Auditoria de Usinagem e Metrologia',
  'Checklist focado na celula de usinagem: processo especial, controle de medicao, rastreabilidade e CAPA tecnica.',
  $$## Escopo
Auditoria de processo aplicada ao chao de fabrica de usinagem medica, com foco em disciplina de execucao.

## Pontos de verificacao
1. Parametros de processo bloqueados e controlados
2. Setup e liberacao de primeira peca documentados
3. Plano de controle alinhado a CTQs
4. Calibracao de instrumentos e dispositivos de fixacao
5. Rastreabilidade lote MP -> ordem -> inspecao final
6. Tratativa de desvio dimensional com CAPA tecnica

## Evidencias rapidas
- 1 ordem recente com trilha completa de dados
- 1 equipamento medido com calibracao vigente
- 1 alteracao de processo com aprovacao formal
- 1 CAPA de repeticao de desvio com eficacia verificada

## Classificacao sugerida
- >=90%: processo estavel
- 75-89%: processo sob controle com melhorias
- 50-74%: risco de variacao relevante
- <50%: risco alto para conformidade e prazo
$$,
  'checklist',
  'Qualidade / Engenharia de Processo',
  'pending_approval',
  '{
    "tags": ["iso-13485", "usinagem", "metrologia"],
    "value_promise": "Avaliar robustez de usinagem medica por evidencia de processo e metrologia no chao de fabrica.",
    "interactive_block": "SupplierAuditCalculator",
    "estimated_read_minutes": 8,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Process Quality"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'calculadora-custo-falha-qualidade',
  'Calculadora de Custo da Falha de Qualidade',
  'Ferramenta para estimar perdas anuais por scrap, retrabalho, reclamacoes e horas de contencao.',
  $$## Objetivo
Quantificar impacto financeiro de falhas de qualidade para priorizar CAPA e investimento em estabilidade de processo.

## Entradas da calculadora
- Volume mensal
- Custo unitario medio
- Taxa de scrap e retrabalho
- Custo medio por reclamacao
- Horas de contencao e custo/hora

## Saidas
- Perda anual por categoria
- Custo total anual de falha
- Faixa de impacto (alto, moderado, controlado)
- Recomendacao de proximo passo

## Como usar em comite
Rodar a calculadora com dados dos ultimos 90 dias e definir metas trimestrais de reducao.
$$,
  'calculator',
  'Qualidade / Financeiro',
  'pending_approval',
  '{
    "tags": ["cost-of-quality", "scrap", "capa"],
    "value_promise": "Converter desvio de qualidade em impacto financeiro para acelerar decisao executiva.",
    "interactive_block": "CostOfQualityCalculator",
    "estimated_read_minutes": 5,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "Quality Finance"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'checklist-transferencia-npi-producao',
  'Checklist de Transferencia NPI para Producao',
  'Checklist de prontidao para transicao segura de NPI para producao com foco em processo, qualidade e ramp-up.',
  $$## Objetivo
Garantir transferencia NPI -> producao com risco controlado e criterios claros de go/no-go.

## Blocos da avaliacao
1. Pacote tecnico completo (desenho, BOM, CTQ)
2. Processo e validacao (PFMEA, plano de controle, capabilidade)
3. Qualidade e compliance (rastreabilidade, calibracao, CAPA)
4. Operacao e supply (capacidade, treinamento, contingencia)
5. Go-live e estabilizacao (rituais, dashboard, licoes aprendidas)

## Faixas de prontidao
- >=90%: pronto para transferencia
- 75-89%: aprovado com plano de acao
- 50-74%: risco elevado
- <50%: nao pronto

## Resultado esperado
Plano de fechamento de lacunas antes de liberar o ramp-up.
$$,
  'checklist',
  'Engenharia / Operacoes',
  'pending_approval',
  '{
    "tags": ["npi", "transferencia", "ramp-up"],
    "value_promise": "Fechar lacunas criticas antes do go-live para reduzir retrabalho e instabilidade no ramp-up.",
    "interactive_block": "NpiTransferChecklistTool",
    "estimated_read_minutes": 7,
    "review_version": "p0-2026-02-20-v1",
    "review_owner": "NPI Program Office"
  }'::jsonb,
  timezone('utc'::text, now())
)
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  persona = EXCLUDED.persona,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = timezone('utc'::text, now());

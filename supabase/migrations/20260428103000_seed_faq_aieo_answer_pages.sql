-- Seed first FAQ/SEO/AIEO canonical answer pages and the missing traceability CTA.
-- Claim language follows Rafael Bianchini's 2026-04-28 stakeholder validation.

ALTER TABLE IF EXISTS public.blog_posts
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

INSERT INTO public.blog_posts (
  title,
  slug,
  content,
  excerpt,
  category_id,
  seo_title,
  seo_description,
  keywords,
  status,
  published_at,
  ai_generated,
  metadata,
  updated_at
)
VALUES
(
  'Como qualificar um fornecedor de manufatura medica sob ISO 13485',
  'como-qualificar-fornecedor-manufatura-medica-iso-13485',
  $$<p>Para qualificar um fornecedor de manufatura medica sob ISO 13485, o OEM deve verificar mais do que certificacao. O processo precisa confirmar responsabilidades de qualidade, controle de revisao de desenhos, rastreabilidade de lote, evidencia de inspecao, regras de mudanca, capacidade produtiva e resposta a nao conformidades antes da liberacao de producao.</p>
<h2>Por que isso importa</h2>
<p>A certificacao indica que existe um sistema de gestao da qualidade, mas nao substitui evidencia operacional. Muitos riscos aparecem tarde: desenho desatualizado, mudanca de processo sem avaliacao, FAI incompleto, CAPA lenta, lote sem genealogia fechada ou embalagem e manuseio sem controle suficiente.</p>
<h2>O que perguntar ao fornecedor</h2>
<ul>
<li>Existe acordo de qualidade ou matriz de responsabilidades antes da producao?</li>
<li>Como desenhos e revisoes sao liberados para producao?</li>
<li>Como mudancas de site, subfornecedor, processo critico ou programa sao avaliadas?</li>
<li>O que entra no pacote de FAI ou primeiro lote controlado?</li>
<li>Quais documentos acompanham a liberacao de lote?</li>
<li>Como desvios e lotes suspeitos sao avaliados e documentados, quando aplicavel?</li>
<li>Qual e o fluxo de contencao, causa raiz e acao corretiva?</li>
</ul>
<h2>Evidencias para pedir</h2>
<ul>
<li>Certificacao e escopo ISO 13485.</li>
<li>Modelo de acordo de qualidade ou matriz de responsabilidades.</li>
<li>Exemplo anonimizado de controle de revisao de desenho.</li>
<li>Exemplo de FAI ou sumario dimensional.</li>
<li>Certificado de material, CoC e sumario de inspecao.</li>
<li>Fluxo de controle de mudancas.</li>
<li>Evidencia de tratamento de desvios e disposicao, quando aplicavel.</li>
</ul>
<h2>Como a Lifetrek trata esse tema</h2>
<p>A Lifetrek opera com sistema de qualidade ISO 13485 para manufatura medica. Antes de seguir para producao ou liberacao, o produto passa por analise e aprovacao de Producao e Qualidade, conforme o escopo aprovado. A Lifetrek trabalha com desenhos controlados na revisao vigente dentro do sistema de qualidade ISO 13485.</p>
<p>Evidencias aplicaveis ao escopo do servico podem ser discutidas sob solicitacao, incluindo desenho, processo, qualidade e entrega. A contencao e tratada com prioridade e acoes corretivas seguem procedimentos internos definidos no sistema de qualidade.</p>
<h2>O que ainda deve ser validado caso a caso</h2>
<p>Acordo de qualidade assinado, direitos de auditoria, IQ/OQ/PQ, validacoes de limpeza, marcacao ou embalagem e janelas formais de resposta CAPA nao devem ser tratados como promessa universal. Esses pontos dependem de escopo, contrato, requisito do cliente e aprovacao interna.</p>
<h2>Perguntas frequentes</h2>
<h3>ISO 13485 garante que o fornecedor esta pronto?</h3>
<p>Nao sozinho. ISO 13485 indica que existe um sistema de gestao da qualidade, mas o OEM ainda precisa verificar escopo, processo real, documentacao de lote, controle de mudancas, capacidade produtiva e resposta a desvios.</p>
<h3>O que deve estar em um acordo de qualidade?</h3>
<p>Um acordo de qualidade deve definir responsabilidades, criterios de liberacao, auditoria, notificacao de mudancas, tratamento de nao conformidades, rastreabilidade, documentacao exigida e regras de comunicacao entre OEM e fornecedor.</p>
<h3>Quando pedir FAI?</h3>
<p>FAI e mais util em transferencia, primeiro lote, revisao critica de desenho, mudanca de processo ou quando uma caracteristica dimensional impacta montagem, funcao, rastreabilidade ou risco regulatorio.</p>
<h3>O que indica risco em um fornecedor?</h3>
<p>Sinais de risco incluem promessa de prazo sem plano de transferencia, respostas vagas sobre rastreabilidade, falta de controle de revisao, resistencia a auditoria, mudancas nao notificadas e ausencia de regras claras para avaliar lote suspeito.</p>
<h3>Como reduzir risco sem exigir garantia impossivel?</h3>
<p>O caminho mais defensavel e exigir visibilidade e disciplina: primeiro lote controlado quando aplicavel, FAI, rastreabilidade, controle de mudancas, criterio de aceitacao, contencao documentada e revisao de capacidade antes da escala.</p>
<h2>Proximo passo</h2>
<p>Use o checklist de auditoria de fornecedores para transformar a conversa de qualificacao em uma revisao objetiva de evidencia.</p>$$,
  'Veja quais evidencias pedir antes de aprovar um fornecedor de manufatura medica: acordo de qualidade, rastreabilidade, FAI, validacao e controle de mudancas.',
  NULL::uuid,
  'Como qualificar fornecedor medico ISO 13485 | Lifetrek',
  'Veja evidencias para qualificar fornecedor de manufatura medica: ISO 13485, desenho controlado, FAI, rastreabilidade, CAPA e mudancas.',
  ARRAY['qualificacao de fornecedor ISO 13485','fornecedor de dispositivos medicos','manufatura medica','rastreabilidade','controle de mudancas'],
  'published',
  timezone('utc'::text, now()),
  false,
  '{
    "content_type": "faq_aieo_answer_page",
    "content_cluster": "supplier_qualification",
    "funnel_stage": "middle",
    "icp_primary": "CM",
    "pillar_keyword": "qualificacao de fornecedor ISO 13485",
    "entity_keywords": ["Lifetrek Medical", "ISO 13485", "ANVISA", "fornecedor de dispositivos medicos", "manufatura medica", "rastreabilidade", "controle de mudancas", "Indaiatuba"],
    "cta_mode": "resource_optional",
    "cta_resource_slug": "checklist-auditoria-fornecedores",
    "claim_validation": "Rafael Bianchini 2026-04-28"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'O que um primeiro lote controlado precisa provar antes da escala',
  'o-que-primeiro-lote-controlado-deve-provar-antes-da-escala',
  $$<p>Um primeiro lote controlado deve provar que o processo consegue produzir a peca certa, na revisao certa, com medicoes aceitaveis, documentacao rastreavel, fluxo de liberacao claro e capacidade inicial realista. Quando um lote piloto for aplicavel, ele tambem deve revelar gargalos, desvios e ajustes necessarios antes de transferir uma familia inteira para escala.</p>
<h2>Por que isso importa</h2>
<p>Transferencias falham quando a organizacao pula do desenho para a producao como se capacidade, inspecao, documentacao e suprimentos ja estivessem resolvidos. O primeiro lote controlado cria uma etapa de aprendizado antes que o risco vire atraso, retrabalho ou disputa de qualidade.</p>
<h2>O que o primeiro lote deve provar</h2>
<ul>
<li>A revisao correta do desenho chegou ao chao de fabrica.</li>
<li>Caracteristicas criticas foram medidas e registradas.</li>
<li>Desvios foram documentados e tiveram disposicao.</li>
<li>Materiais, fornecedores e certificados estao rastreaveis.</li>
<li>O fluxo de inspecao e liberacao funciona.</li>
<li>Gargalos de maquina, setup, inspecao ou acabamento foram mapeados.</li>
<li>A escala proposta e coerente com capacidade real.</li>
</ul>
<h2>O que revisar antes de produzir</h2>
<p>Antes da producao, a Lifetrek avalia capacidade e recursos criticos, incluindo ferramentas, disponibilidade, dispositivos, FMEA, mao de obra e recursos de medicao. Para projetos make-to-order, a linguagem mais precisa e transferencia de item, peca, projeto ou familia de pecas; SKU nao deve ser tratado como unidade padrao.</p>
<h2>Falhas comuns</h2>
<ul>
<li>Primeiro lote aprovado sem FAI ou sumario dimensional suficiente.</li>
<li>Mudancas de programa ou setup tratadas como ajustes informais.</li>
<li>Desenho revisado sem aceite controlado.</li>
<li>Prazo prometido sem revisao de capacidade.</li>
<li>Familia de pecas escalada antes de avaliar o primeiro item ou projeto.</li>
</ul>
<h2>Como a Lifetrek trata esse tema</h2>
<p>A Lifetrek trabalha com desenhos controlados na revisao vigente dentro do sistema de qualidade ISO 13485. Antes de seguir para producao ou liberacao, o produto passa por analise e aprovacao de Producao e Qualidade, conforme o escopo aprovado.</p>
<p>O pacote de FAI ou liberacao deve ser definido conforme desenho, requisito do cliente, processo aplicavel e criterios aprovados. Evidencias aplicaveis ao escopo do servico podem ser discutidas sob solicitacao.</p>
<h2>Perguntas frequentes</h2>
<h3>Primeiro lote controlado e a mesma coisa que validacao?</h3>
<p>Nao necessariamente. Um primeiro lote controlado ou lote piloto, quando aplicavel, pode gerar evidencia para transferencia e aprendizado de processo, mas validacao formal depende do risco, do processo, dos requisitos do produto e dos criterios definidos no sistema de qualidade.</p>
<h3>Quantas pecas um primeiro lote controlado deve ter?</h3>
<p>Depende da geometria, risco, caracteristicas criticas, historico do processo e plano de aceitacao. O ponto principal e justificar o tamanho da amostra e ligar a amostra ao risco tecnico.</p>
<h3>O que deve sair do primeiro lote controlado?</h3>
<p>O minimo pratico e: revisao de desenho usada, registros dimensionais, desvios e disposicao, certificados aplicaveis, rastreabilidade, observacoes de capacidade, gargalos e recomendacao para escala ou novo ajuste.</p>
<h3>Quando nao escalar depois do primeiro lote?</h3>
<p>Nao escale se houver instabilidade dimensional, documentacao incompleta, gargalo sem plano, revisao errada, desvios sem causa definida ou mudanca de processo ainda nao avaliada.</p>
<h2>Proximo passo</h2>
<p>Use o checklist de transferencia NPI para producao para revisar desenho, criterio de aceitacao, FAI, rastreabilidade e capacidade antes de escalar.</p>$$,
  'Entenda como um primeiro lote controlado reduz risco de transferencia em manufatura medica ao testar capacidade, FAI, controle dimensional e rastreabilidade.',
  NULL::uuid,
  'Primeiro lote controlado antes da escala | Lifetrek',
  'Entenda o que um primeiro lote controlado deve provar antes da escala: desenho vigente, FAI, rastreabilidade, capacidade e criterios de liberacao.',
  ARRAY['primeiro lote controlado manufatura medica','lote piloto quando aplicavel','NPI','transferencia para producao','FAI','rastreabilidade'],
  'published',
  timezone('utc'::text, now()),
  false,
  '{
    "content_type": "faq_aieo_answer_page",
    "content_cluster": "transfer_scale_up",
    "funnel_stage": "middle",
    "icp_primary": "CM",
    "pillar_keyword": "primeiro lote controlado manufatura medica",
    "entity_keywords": ["primeiro lote controlado", "lote piloto quando aplicavel", "NPI", "transferencia para producao", "FAI", "rastreabilidade", "Lifetrek Medical"],
    "cta_mode": "resource_optional",
    "cta_resource_slug": "checklist-transferencia-npi-producao",
    "claim_validation": "Rafael Bianchini 2026-04-28"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'O que rastreabilidade completa de lote deve incluir em componentes medicos',
  'rastreabilidade-completa-lote-componentes-medicos',
  $$<p>Rastreabilidade completa de lote deve conectar material, processo, desenho, inspecao, identificacao, liberacao e destino do produto. Na pratica, isso inclui certificado de material, CoC, revisao de desenho, registros de inspecao, lote ou serial, UDI quando aplicavel, desvios, disposicoes e responsaveis pela liberacao.</p>
<h2>Por que isso importa</h2>
<p>Quando uma nao conformidade aparece tarde, rastreabilidade define se a empresa consegue conter o problema rapidamente ou se precisa ampliar investigacao, estoque bloqueado e comunicacao de campo. Em ambiente regulado, rastreabilidade nao e apenas registro: e capacidade de resposta.</p>
<h2>Checklist de genealogia do lote</h2>
<ul>
<li>Numero de lote, ordem ou serial aplicavel.</li>
<li>Materia-prima e certificado de material.</li>
<li>Revisao do desenho e especificacoes aplicaveis.</li>
<li>Processo, maquina, operador ou etapa critica quando aplicavel.</li>
<li>Registros de inspecao e criterios de aceitacao.</li>
<li>CoC ou documento de conformidade.</li>
<li>Marcacao, etiqueta ou UDI quando aplicavel.</li>
<li>Desvios, concessoes e disposicao.</li>
<li>Data, responsavel e criterio de liberacao.</li>
</ul>
<h2>Falhas comuns</h2>
<ul>
<li>CoC sem ligacao clara com material e inspecao.</li>
<li>UDI ou etiqueta incorreta, ausente ou nao verificavel.</li>
<li>Desenho usado na producao diferente da revisao aprovada.</li>
<li>Registros de inspecao sem caracteristicas criticas.</li>
<li>Lote suspeito sem avaliacao, segregacao ou disposicao documentada quando aplicavel.</li>
</ul>
<h2>Como a Lifetrek trata esse tema</h2>
<p>Use liberacao de lote rastreavel como linguagem aprovada. Para Lifetrek, a liberacao deve conectar desenho, processo, qualidade, entrega e rastreabilidade aplicavel ao projeto. A Lifetrek trabalha com desenhos controlados na revisao vigente dentro do sistema de qualidade ISO 13485.</p>
<p>Detalhes internos de hold ou quarentena nao devem ser publicados. O nivel publico adequado e afirmar que lotes suspeitos sao tratados por procedimentos internos de segregacao, avaliacao e disposicao, quando aplicavel.</p>
<h2>Perguntas frequentes</h2>
<h3>CoC basta para provar rastreabilidade?</h3>
<p>Nao. O CoC e uma peca do pacote. Ele precisa se conectar a certificados, revisao de desenho, inspecao, lote ou serial, desvios e criterio de liberacao.</p>
<h3>UDI e rastreabilidade sao a mesma coisa?</h3>
<p>Nao. UDI ajuda identificacao e captura de dados, mas rastreabilidade completa tambem depende da genealogia interna do lote, registros de processo, inspecao, material e liberacao.</p>
<h3>Por que etiqueta incorreta e um problema serio?</h3>
<p>Porque identificacao ruim dificulta estoque, segregacao, historico de campo e investigacao. Mesmo quando a peca esta fisicamente correta, erro de identificacao pode virar risco operacional e regulatorio.</p>
<h3>O que pedir do fornecedor em cada liberacao?</h3>
<p>Peca um pacote proporcional ao risco: CoC, certificado de material, resumo de inspecao, revisao de desenho usada, identificacao de lote ou serial, desvios e disposicao quando existirem.</p>
<h2>Proximo passo</h2>
<p>Use o checklist de rastreabilidade e serializacao para verificar se material, processo, inspecao, identificacao e liberacao fecham a mesma historia de lote.</p>$$,
  'Veja como certificado de material, CoC, inspecao, serializacao, UDI e historico de lote se conectam para reduzir risco de auditoria e contencao.',
  NULL::uuid,
  'Rastreabilidade de lote em componentes medicos | Lifetrek',
  'Veja o que rastreabilidade completa de lote deve incluir: material, CoC, desenho, inspecao, UDI, desvios e liberacao.',
  ARRAY['rastreabilidade de lote dispositivos medicos','UDI','CoC','certificado de material','serializacao','manufatura medica'],
  'published',
  timezone('utc'::text, now()),
  false,
  '{
    "content_type": "faq_aieo_answer_page",
    "content_cluster": "traceability",
    "funnel_stage": "middle",
    "icp_primary": "CM",
    "pillar_keyword": "rastreabilidade de lote dispositivos medicos",
    "entity_keywords": ["rastreabilidade", "UDI", "CoC", "certificado de material", "lote", "serializacao", "manufatura medica", "Lifetrek Medical"],
    "cta_mode": "resource_optional",
    "cta_resource_slug": "checklist-rastreabilidade-serializacao",
    "claim_validation": "Rafael Bianchini 2026-04-28"
  }'::jsonb,
  timezone('utc'::text, now())
)
ON CONFLICT (slug)
DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  excerpt = EXCLUDED.excerpt,
  category_id = EXCLUDED.category_id,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = COALESCE(blog_posts.published_at, EXCLUDED.published_at),
  ai_generated = EXCLUDED.ai_generated,
  metadata = EXCLUDED.metadata,
  updated_at = timezone('utc'::text, now());

UPDATE public.resources
SET
  content = replace(
    content,
    '- [ ] Em recall, identificam lotes afetados em < 24h?',
    '- [ ] Em uma investigacao, conseguem identificar lotes afetados dentro do prazo definido pelo procedimento aplicavel?'
  ),
  updated_at = timezone('utc'::text, now())
WHERE slug = 'checklist-auditoria-fornecedores'
  AND content LIKE '%Em recall, identificam lotes afetados em < 24h?%';

INSERT INTO public.resources (
  title,
  description,
  content,
  type,
  persona,
  status,
  slug,
  metadata,
  updated_at
)
VALUES
(
  'Checklist de Transferencia NPI para Producao',
  'Checklist para revisar desenho, criterios de aceitacao, FAI, rastreabilidade e capacidade antes de escalar um item medico.',
  $$## Objetivo
Reduzir risco na passagem de desenvolvimento, primeiro lote controlado ou transferencia de projeto para producao recorrente.

## Antes da producao
- [ ] Revisao vigente do desenho confirmada.
- [ ] Criterios de aceitacao definidos.
- [ ] Necessidade de FAI ou primeiro lote controlado avaliada.
- [ ] Materiais, certificados e identificacao de lote definidos.
- [ ] Plano de inspecao e recursos de medicao confirmados.
- [ ] Ferramentas, dispositivos e disponibilidade revisados.
- [ ] FMEA ou analise de risco aplicavel revisada.
- [ ] Mao de obra e treinamento confirmados.

## Saida esperada
Decisao documentada para produzir, ajustar ou reavaliar antes da escala.

## Perguntas frequentes
### O checklist substitui validacao?
Nao. Ele organiza a revisao operacional. Validacao formal depende do risco, escopo, processo e requisitos aprovados.

### Item, peca ou familia de pecas?
Para projetos make-to-order, use item, peca, projeto ou familia de pecas conforme a unidade que melhor representa o escopo tecnico.
$$,
  'checklist',
  'Engenharia / Operacoes',
  'published',
  'checklist-transferencia-npi-producao',
  '{
    "tags": ["NPI", "transferencia", "FAI", "capacidade", "rastreabilidade"],
    "value_promise": "Organizar a transferencia tecnica antes da escala sem prometer validacao universal.",
    "interactive_block": "NpiTransferChecklistTool",
    "estimated_read_minutes": 7,
    "review_version": "faq-aieo-2026-04-28-v1",
    "review_owner": "Manufacturing Engineering"
  }'::jsonb,
  timezone('utc'::text, now())
),
(
  'Checklist de Rastreabilidade e Serializacao',
  'Checklist para conectar material, desenho, processo, inspecao, identificacao e liberacao em componentes medicos.',
  $$## Objetivo
Verificar se a genealogia do lote fecha a mesma historia entre material, processo, inspecao, identificacao e liberacao.

## Genealogia do lote
- [ ] Numero de lote, ordem ou serial aplicavel definido.
- [ ] Materia-prima vinculada ao certificado de material.
- [ ] Revisao do desenho registrada.
- [ ] Processo ou etapa critica identificada quando aplicavel.
- [ ] Registros de inspecao conectados ao lote.
- [ ] CoC ou documento de conformidade emitido.
- [ ] Marcacao, etiqueta ou UDI verificada quando aplicavel.
- [ ] Desvios e disposicoes documentados quando existirem.
- [ ] Responsavel e criterio de liberacao registrados.

## Sinais de alerta
- CoC sem ligacao clara com material.
- Desenho sem revisao controlada.
- Inspecao sem caracteristicas criticas.
- Identificacao fisica que nao fecha com os registros.

## Perguntas frequentes
### UDI substitui rastreabilidade?
Nao. UDI ajuda identificacao e captura de dados, mas a rastreabilidade depende da genealogia interna do lote.

### O que pedir por liberacao?
Peca um pacote proporcional ao risco: CoC, certificado de material, resumo de inspecao, revisao de desenho, identificacao e desvios quando existirem.
$$,
  'checklist',
  'Qualidade / Supply Chain',
  'published',
  'checklist-rastreabilidade-serializacao',
  '{
    "tags": ["rastreabilidade", "serializacao", "UDI", "CoC", "lote"],
    "value_promise": "Checar se os registros de lote sustentam auditoria, segregacao e resposta operacional.",
    "estimated_read_minutes": 6,
    "review_version": "faq-aieo-2026-04-28-v1",
    "review_owner": "Quality Systems"
  }'::jsonb,
  timezone('utc'::text, now())
)
ON CONFLICT (slug)
DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  persona = EXCLUDED.persona,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = timezone('utc'::text, now());

-- Expand the traceability lead magnet and align it to the website ICP taxonomy.
-- Primary ICP: MI (Fabricantes de Implantes e Instrumentais), with OD/VT as secondary applications.

UPDATE public.blog_posts
SET
  title = 'O que rastreabilidade de lote deve incluir em implantes e instrumentais',
  content = $$<p>Para fabricantes de implantes ortopédicos, componentes odontológicos, soluções veterinárias e instrumentais cirúrgicos, rastreabilidade de lote não é só um registro final. Ela precisa conectar material, desenho, processo, inspeção, identificação, liberação e destino do produto na mesma história técnica.</p>
<p>Quando uma não conformidade aparece tarde, a genealogia do lote define se a empresa consegue conter o problema com precisão ou se precisa ampliar investigação, estoque bloqueado e comunicação operacional. Em ambiente regulado, rastreabilidade é capacidade de resposta.</p>
<h2>ICP deste conteúdo</h2>
<p><strong>ICP primário: MI — Fabricantes de Implantes e Instrumentais.</strong> O conteúdo também se aplica como leitura secundária para <strong>OD — Empresas Odontológicas</strong> e <strong>VT — Empresas Veterinárias</strong> quando há lote, serialização, UDI, CoC, certificado de material ou pacote de liberação.</p>
<h2>Checklist clicável de genealogia do lote</h2>
<p>Use os itens abaixo como revisão operacional antes de aceitar ou liberar um lote. Ajuste o nível de evidência ao risco do produto, ao processo aprovado e ao sistema de qualidade aplicável.</p>
<div style="display:grid;gap:10px;margin:16px 0 28px;">
<label><input type="checkbox"> Número de lote, ordem, serial ou identificador equivalente definido.</label>
<label><input type="checkbox"> Família, item, código interno e revisão vigente do desenho registrados.</label>
<label><input type="checkbox"> Matéria-prima vinculada ao certificado de material aplicável.</label>
<label><input type="checkbox"> Especificações críticas, critérios de aceitação e plano de inspeção conectados ao lote.</label>
<label><input type="checkbox"> Processo, etapa crítica, máquina, setup ou rota identificados quando aplicável.</label>
<label><input type="checkbox"> Registros de inspeção ligados ao mesmo lote, serial ou ordem.</label>
<label><input type="checkbox"> CoC ou documento de conformidade emitido com referência consistente ao lote.</label>
<label><input type="checkbox"> Marcação, etiqueta, serialização ou UDI verificados quando aplicável.</label>
<label><input type="checkbox"> Desvios, concessões, retrabalhos e disposições documentados quando existirem.</label>
<label><input type="checkbox"> Responsável, data e critério de liberação registrados.</label>
<label><input type="checkbox"> Destino do lote claro: liberado, segregado, retrabalhado, reprovado ou sob avaliação.</label>
</div>
<h2>Falhas comuns</h2>
<ul>
<li>CoC sem ligação clara com material, inspeção e revisão do desenho.</li>
<li>Identificação física que não fecha com os registros do lote.</li>
<li>Inspeção registrada sem características críticas ou critérios de aceitação.</li>
<li>Desenho usado na produção diferente da revisão aprovada.</li>
<li>Lote suspeito sem avaliação, segregação ou disposição documentada quando aplicável.</li>
</ul>
<h2>Como falar disso publicamente</h2>
<p>Use a linguagem aprovada: <strong>liberação de lote rastreável</strong>. Para a Lifetrek, a liberação deve conectar desenho, processo, qualidade, entrega e rastreabilidade aplicável ao projeto. A Lifetrek trabalha com desenhos controlados na revisão vigente dentro do sistema de qualidade ISO 13485.</p>
<p>Detalhes internos de hold, quarentena ou fluxo específico de contenção não devem ser publicados. O nível público adequado é afirmar que lotes suspeitos são tratados por procedimentos internos de segregação, avaliação e disposição, quando aplicável.</p>
<h2>Perguntas frequentes</h2>
<h3>CoC basta para provar rastreabilidade?</h3>
<p>Não. O CoC é uma peça do pacote. Ele precisa se conectar a certificados, revisão de desenho, inspeção, lote ou serial, desvios e critério de liberação.</p>
<h3>UDI e rastreabilidade são a mesma coisa?</h3>
<p>Não. UDI ajuda identificação e captura de dados, mas rastreabilidade completa também depende da genealogia interna do lote, registros de processo, inspeção, material e liberação.</p>
<h3>O que pedir do fornecedor em cada liberação?</h3>
<p>Peça um pacote proporcional ao risco: CoC, certificado de material, resumo de inspeção, revisão de desenho usada, identificação de lote ou serial, desvios e disposição quando existirem.</p>
<h2>Próximo passo</h2>
<p>Abra o checklist de rastreabilidade e serialização para verificar se material, desenho, processo, inspeção, identificação e liberação fecham a mesma história de lote.</p>$$,
  excerpt = 'Veja como material, desenho, processo, inspeção, serialização, UDI e CoC se conectam na genealogia de lote para implantes e instrumentais.',
  seo_title = 'Rastreabilidade de lote em implantes | Lifetrek',
  seo_description = 'Veja o que rastreabilidade de lote deve incluir em implantes e instrumentais: material, desenho, inspeção, UDI, CoC e liberação.',
  keywords = ARRAY[
    'rastreabilidade de lote implantes',
    'genealogia de lote dispositivos médicos',
    'UDI',
    'CoC',
    'certificado de material',
    'serialização',
    'implantes ortopédicos',
    'instrumentais cirúrgicos'
  ],
  metadata = jsonb_build_object(
    'content_type', 'faq_aieo_answer_page',
    'content_cluster', 'traceability',
    'funnel_stage', 'middle',
    'icp_primary', 'MI',
    'icp_secondary', jsonb_build_array('OD', 'VT', 'CM'),
    'icp_specificity_scores', jsonb_build_object('MI', 5, 'OD', 4, 'VT', 4, 'CM', 3, 'HS', 1),
    'pillar_keyword', 'rastreabilidade de lote implantes e instrumentais',
    'entity_keywords', jsonb_build_array('rastreabilidade', 'UDI', 'CoC', 'certificado de material', 'lote', 'serialização', 'implantes ortopédicos', 'odontologia', 'veterinário', 'Lifetrek Medical'),
    'cta_mode', 'resource_optional',
    'cta_resource_slug', 'checklist-rastreabilidade-serializacao',
    'locale', 'pt-BR',
    'translation_ready', true,
    'claim_validation', 'technical-claims-guardian 2026-04-28'
  ),
  updated_at = timezone('utc'::text, now())
WHERE slug = 'rastreabilidade-completa-lote-componentes-medicos';

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
VALUES (
  'Checklist de Rastreabilidade e Serialização para Implantes e Instrumentais',
  'Checklist clicável para verificar se material, desenho, processo, inspeção, identificação e liberação fecham a genealogia do lote.',
  $$# Checklist de Rastreabilidade e Serialização para Implantes e Instrumentais

**ICP primário:** `MI` — Fabricantes de Implantes e Instrumentais.

**Aplicação secundária:** `OD` e `VT`, quando componentes odontológicos ou veterinários exigem lote, serialização, UDI, CoC, certificado de material ou pacote de liberação.

**Para quem é:** qualidade, engenharia, operações e supply chain em fabricantes de implantes ortopédicos, componentes odontológicos, implantes veterinários e instrumentais cirúrgicos.

**Como usar:** marque os itens no site durante a revisão. Ao baixar o material, o arquivo Markdown mantém os itens como `- [ ]` para uso em Notion, Docs, sistemas internos ou revisão de fornecedor.

---

## 1. Escopo do lote

- [ ] Família, item, código interno ou projeto definidos.
- [ ] Número de lote, ordem, serial ou identificador equivalente definido.
- [ ] Quantidade, unidade de liberação e destino pretendido do lote registrados.
- [ ] Responsável pela revisão do pacote de lote identificado.

## 2. Material e certificados

- [ ] Matéria-prima vinculada ao certificado de material aplicável.
- [ ] Lote de matéria-prima conectado ao lote do componente quando aplicável.
- [ ] Requisitos especiais de material, tratamento ou acabamento registrados.
- [ ] Evidência de recebimento, segregação ou liberação de material disponível conforme o processo aplicável.

## 3. Desenho, revisão e especificações

- [ ] Revisão vigente do desenho confirmada antes da produção ou liberação.
- [ ] Especificações críticas e critérios de aceitação definidos.
- [ ] Alterações de desenho ou processo avaliadas antes de aceitar o lote.
- [ ] Requisitos de marcação, etiqueta, serialização ou UDI definidos quando aplicável.

## 4. Processo e rota produtiva

- [ ] Rota, etapa crítica, máquina, setup ou processo especial identificados quando aplicável.
- [ ] Registros de operação conectados ao mesmo lote, ordem ou serial.
- [ ] Ferramentas, dispositivos ou parâmetros críticos controlados conforme o processo aplicável.
- [ ] Retrabalho, reinspeção ou ajuste de processo registrados quando existirem.

## 5. Inspeção e evidência dimensional

- [ ] Plano de inspeção vinculado ao item, revisão e lote.
- [ ] Registros de inspeção conectados ao mesmo lote, ordem ou serial.
- [ ] Características críticas medidas com critério de aceitação claro.
- [ ] Resultado de inspeção, disposição e responsável pela decisão registrados.

## 6. CoC, liberação e documentação do pacote

- [ ] CoC ou documento de conformidade emitido com identificação consistente.
- [ ] Certificados, inspeções, desvios e disposições referenciam o mesmo lote ou serial.
- [ ] Critério de liberação documentado antes de envio, estoque ou próxima etapa.
- [ ] Data, responsável e status final do lote registrados.

## 7. Identificação física, embalagem e UDI

- [ ] Marcação, etiqueta, serialização ou UDI verificados quando aplicável.
- [ ] Identificação física confere com registros, CoC e pacote de liberação.
- [ ] Embalagem, segregação ou condição de armazenamento registradas quando aplicável.
- [ ] Itens sem identificação coerente são bloqueados para avaliação antes de seguir.

## 8. Desvios, contenção e resposta

- [ ] Desvios, concessões, não conformidades e disposições documentados quando existirem.
- [ ] Lote suspeito tem status claro: segregado, em avaliação, liberado, retrabalhado ou reprovado.
- [ ] Escopo de impacto considera material, processo, data, serial, lote e destino quando aplicável.
- [ ] A decisão de disposição é proporcional ao risco e ao procedimento aplicável.

## Sinais de alerta

- CoC sem ligação clara com material, inspeção e revisão do desenho.
- Identificação física que não fecha com os registros do lote.
- Inspeção sem características críticas ou critério de aceitação.
- Revisão de desenho usada na produção diferente da revisão aprovada.
- Lote suspeito sem segregação, avaliação ou disposição documentada quando aplicável.

## Pacote mínimo para baixar e revisar

- [ ] Capa do lote: item, revisão, quantidade, lote ou serial.
- [ ] Certificado de material ou referência equivalente.
- [ ] Registros de inspeção ou resumo dimensional aplicável.
- [ ] CoC ou documento de conformidade.
- [ ] Lista de desvios, concessões, retrabalhos ou declaração de não ocorrência.
- [ ] Critério, data e responsável pela liberação.

## Perguntas frequentes

### CoC basta para provar rastreabilidade?

Não. O CoC é uma peça do pacote. Ele precisa se conectar a certificados, revisão de desenho, inspeção, lote ou serial, desvios e critério de liberação.

### UDI substitui rastreabilidade?

Não. UDI ajuda identificação e captura de dados, mas rastreabilidade completa também depende da genealogia interna do lote, registros de processo, inspeção, material e liberação.

### O que pedir por liberação?

Peça um pacote proporcional ao risco: CoC, certificado de material, resumo de inspeção, revisão de desenho, identificação de lote ou serial, desvios e disposição quando existirem.

### Esse checklist substitui validação formal?

Não. Ele organiza a revisão operacional da genealogia do lote. Validação formal depende do risco, do processo, dos requisitos aprovados e do sistema de qualidade aplicável.
$$,
  'checklist',
  'Qualidade / Engenharia (MI)',
  'published',
  'checklist-rastreabilidade-serializacao',
  jsonb_build_object(
    'tags', jsonb_build_array('rastreabilidade', 'serialização', 'UDI', 'CoC', 'lote', 'implantes', 'instrumentais'),
    'value_promise', 'Checar se os registros de lote sustentam auditoria, segregação e resposta operacional.',
    'estimated_read_minutes', 10,
    'review_version', 'traceability-mi-2026-04-28-v2',
    'review_owner', 'Quality Systems',
    'icp_primary', 'MI',
    'icp_secondary', jsonb_build_array('OD', 'VT', 'CM'),
    'icp_specificity_scores', jsonb_build_object('MI', 5, 'OD', 4, 'VT', 4, 'CM', 3, 'HS', 1),
    'locale', 'pt-BR',
    'translation_ready', true,
    'download_format', 'markdown_task_list',
    'claim_validation', 'technical-claims-guardian 2026-04-28'
  ),
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

export const TRACEABILITY_CHECKLIST_SLUG = "checklist-rastreabilidade-serializacao";

export const TRACEABILITY_CHECKLIST_TITLE =
    "Checklist de Rastreabilidade e Serialização para Implantes e Instrumentais";

export const TRACEABILITY_CHECKLIST_DESCRIPTION =
    "Checklist clicável para verificar se material, desenho, processo, inspeção, identificação e liberação fecham a genealogia do lote.";

export const TRACEABILITY_CHECKLIST_PERSONA = "Qualidade / Engenharia";

export const TRACEABILITY_CHECKLIST_FULL_MARKDOWN = `# Checklist de Rastreabilidade e Serialização para Implantes e Instrumentais

**Para quem é:** qualidade, engenharia, operações e supply chain em fabricantes de implantes ortopédicos, componentes odontológicos, implantes veterinários e instrumentais cirúrgicos.

**Como usar:** marque os itens no site durante a revisão. Ao baixar o material, o arquivo Markdown mantém os itens como \`- [ ]\` para uso em Notion, Docs, sistemas internos ou revisão de fornecedor.

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
`;

export function shouldUseTraceabilityChecklistOverride(slug: string | undefined, markdown: string): boolean {
    if (slug !== TRACEABILITY_CHECKLIST_SLUG) return false;
    return markdown.includes("**ICP primário:**") || markdown.includes("**Aplicação secundária:**") || !markdown.includes("## 1. Escopo do lote") || markdown.length < 2500;
}

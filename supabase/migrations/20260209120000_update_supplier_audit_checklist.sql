-- Update the supplier audit checklist with comprehensive content
UPDATE public.resources 
SET 
  title = 'Checklist: Auditoria de Fornecedores de Dispositivos Médicos',
  description = 'Checklist prático com 39 itens de verificação nos 7 processos críticos da ISO 13485 para validação de fornecedores. Inclui scoring e interpretação.',
  content = '# Checklist: Auditoria de Fornecedores de Dispositivos Médicos

Garanta que seus fornecedores atendem a todos os requisitos da norma ISO 13485 com este checklist prático.

---

## 1. Sistema de Gestão da Qualidade (SGQ)

- [ ] Manual da Qualidade disponível e atualizado?
- [ ] Política da Qualidade comunicada a todos os níveis?
- [ ] Objetivos da Qualidade definidos e mensuráveis?
- [ ] Análises críticas pela direção documentadas (últimos 12 meses)?
- [ ] Indicadores de desempenho acompanhados regularmente?
- [ ] Ações corretivas abertas sendo tratadas dentro do prazo?

🔴 **Alerta:** SGQ apenas "no papel" é a maior causa de falhas em fornecedores.

---

## 2. Controle de Documentos e Registros

- [ ] Procedimento de controle de documentos implementado?
- [ ] Índice mestre de documentos atualizado?
- [ ] Documentos obsoletos identificados e removidos das áreas de trabalho?
- [ ] Aprovações de documentos rastreáveis?
- [ ] Registros da qualidade legíveis, identificáveis e recuperáveis?
- [ ] Tempo de retenção de registros definido e seguido?

💡 **Dica:** Peça para ver como um operador acessa a instrução de trabalho atual.

---

## 3. Rastreabilidade

- [ ] Cada lote de produto tem identificação única?
- [ ] Registros de produção vinculam matéria-prima → processo → produto final?
- [ ] É possível rastrear todos os componentes de um lote específico?
- [ ] Rastreabilidade mantida durante toda a cadeia (subcontratados inclusos)?
- [ ] Em caso de recall, conseguem identificar todos os lotes afetados em < 24h?

🔴 **Alerta:** Rastreabilidade fraca = recall impossível de gerenciar.

---

## 4. Controle de Compras e Avaliação de Subfornecedores

- [ ] Lista de fornecedores aprovados atualizada?
- [ ] Critérios de seleção e avaliação de fornecedores documentados?
- [ ] Avaliação de risco para fornecedores críticos?
- [ ] Acordos de qualidade ou contratos técnicos estabelecidos?
- [ ] Recebimento de materiais inclui verificação vs. especificação?
- [ ] Ações para fornecedores com desempenho abaixo do esperado?

💡 **Dica:** Um bom fornecedor audita seus próprios fornecedores.

---

## 5. Validação de Processos Especiais

- [ ] Processos especiais identificados (soldagem, colagem, esterilização, etc.)?
- [ ] Validação (IQ/OQ/PQ) documentada para cada processo especial?
- [ ] Revalidação periódica programada e executada?
- [ ] Operadores de processos especiais qualificados e treinados?
- [ ] Equipamentos de processo especial com manutenção preventiva?

🔴 **Alerta:** Processo especial não validado = lote inteiro em risco.

---

## 6. Controle de Equipamentos de Medição

- [ ] Lista mestre de equipamentos de medição?
- [ ] Calibrações dentro da validade com certificados rastreáveis?
- [ ] Procedimento para equipamentos fora de calibração?
- [ ] Identificação visual do status de calibração nos equipamentos?
- [ ] Incerteza de medição considerada nas decisões de conformidade?

💡 **Dica:** Peça para ver um certificado de calibração recente e a análise de incerteza.

---

## 7. Gestão de Não Conformidades e CAPAs

- [ ] Procedimento de não conformidade implementado?
- [ ] RNCs abertas sendo tratadas no prazo definido?
- [ ] Análise de causa raiz documentada (5 Porquês, Ishikawa, etc.)?
- [ ] CAPAs com eficácia verificada e evidenciada?
- [ ] Reclamações de clientes registradas e investigadas?
- [ ] Tendências de não conformidades analisadas?

🔴 **Alerta:** CAPAs sem verificação de eficácia = problemas recorrentes.

---

## 📊 Scoring Rápido

| Categoria | Itens OK | Total |
|-----------|----------|-------|
| 1. SGQ | __ | 6 |
| 2. Documentos | __ | 6 |
| 3. Rastreabilidade | __ | 5 |
| 4. Compras | __ | 6 |
| 5. Validação | __ | 5 |
| 6. Metrologia | __ | 5 |
| 7. NC/CAPA | __ | 6 |
| **TOTAL** | **__** | **39** |

**Interpretação:**
- 90-100%: Fornecedor confiável
- 75-89%: Aprovado com observações
- 50-74%: Requer plano de ação
- <50%: Alto risco - reavaliar fornecimento

---

*Checklist desenvolvido por Lifetrek Medical com base em requisitos ISO 13485:2016 e experiência em auditorias de fornecedores de dispositivos médicos.*',
  metadata = '{"tags": ["ISO 13485", "Quality", "Audit", "Suppliers", "CAPA"], "items_count": 39, "categories": 7}'::jsonb,
  updated_at = NOW()
WHERE slug = 'checklist-auditoria-iso-13485';

-- Verify the update
SELECT id, title, slug, length(content) as content_length FROM public.resources WHERE slug LIKE '%auditoria%';

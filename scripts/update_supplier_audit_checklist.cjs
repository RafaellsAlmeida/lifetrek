/**
 * Update the supplier audit checklist resource with comprehensive content
 * Run with: node scripts/update_supplier_audit_checklist.cjs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

const checklistContent = `# Checklist: Auditoria de Fornecedores de Dispositivos Médicos

Garanta que seus fornecedores atendem a todos os requisitos da norma ISO 13485 com este checklist prático.

---

## 1. Sistema de Gestão da Qualidade (SGQ)

- [ ] Manual da Qualidade disponível e atualizado?
- [ ] Política da Qualidade comunicada a todos os níveis?
- [ ] Objetivos da Qualidade definidos e mensuráveis?
- [ ] Análises críticas pela direção documentadas (últimos 12 meses)?
- [ ] Indicadores de desempenho acompanhados regularmente?
- [ ] Ações corretivas abertas sendo tratadas dentro do prazo?

**🔴 Alerta:** SGQ apenas "no papel" é a maior causa de falhas em fornecedores.

---

## 2. Controle de Documentos e Registros

- [ ] Procedimento de controle de documentos implementado?
- [ ] Índice mestre de documentos atualizado?
- [ ] Documentos obsoletos identificados e removidos das áreas de trabalho?
- [ ] Aprovações de documentos rastreáveis?
- [ ] Registros da qualidade legíveis, identificáveis e recuperáveis?
- [ ] Tempo de retenção de registros definido e seguido?

**💡 Dica:** Peça para ver como um operador acessa a instrução de trabalho atual.

---

## 3. Rastreabilidade

- [ ] Cada lote de produto tem identificação única?
- [ ] Registros de produção vinculam matéria-prima → processo → produto final?
- [ ] É possível rastrear todos os componentes de um lote específico?
- [ ] Rastreabilidade mantida durante toda a cadeia (subcontratados inclusos)?
- [ ] Em caso de recall, conseguem identificar todos os lotes afetados em < 24h?

**🔴 Alerta:** Rastreabilidade fraca = recall impossível de gerenciar.

---

## 4. Controle de Compras e Avaliação de Subfornecedores

- [ ] Lista de fornecedores aprovados atualizada?
- [ ] Critérios de seleção e avaliação de fornecedores documentados?
- [ ] Avaliação de risco para fornecedores críticos?
- [ ] Acordos de qualidade ou contratos técnicos estabelecidos?
- [ ] Recebimento de materiais inclui verificação vs. especificação?
- [ ] Ações para fornecedores com desempenho abaixo do esperado?

**💡 Dica:** Um bom fornecedor audita seus próprios fornecedores.

---

## 5. Validação de Processos Especiais

- [ ] Processos especiais identificados (soldagem, colagem, esterilização, etc.)?
- [ ] Validação (IQ/OQ/PQ) documentada para cada processo especial?
- [ ] Revalidação periódica programada e executada?
- [ ] Operadores de processos especiais qualificados e treinados?
- [ ] Equipamentos de processo especial com manutenção preventiva?

**🔴 Alerta:** Processo especial não validado = lote inteiro em risco.

---

## 6. Controle de Equipamentos de Medição

- [ ] Lista mestre de equipamentos de medição?
- [ ] Calibrações dentro da validade com certificados rastreáveis?
- [ ] Procedimento para equipamentos fora de calibração?
- [ ] Identificação visual do status de calibração nos equipamentos?
- [ ] Incerteza de medição considerada nas decisões de conformidade?

**💡 Dica:** Peça para ver um certificado de calibração recente e a análise de incerteza.

---

## 7. Gestão de Não Conformidades e CAPAs

- [ ] Procedimento de não conformidade implementado?
- [ ] RNCs abertas sendo tratadas no prazo definido?
- [ ] Análise de causa raiz documentada (5 Porquês, Ishikawa, etc.)?
- [ ] CAPAs com eficácia verificada e evidenciada?
- [ ] Reclamações de clientes registradas e investigadas?
- [ ] Tendências de não conformidades analisadas?

**🔴 Alerta:** CAPAs sem verificação de eficácia = problemas recorrentes.

---

## 📊 Scoring Rápido

| Categoria | Itens OK | Total | % |
|-----------|----------|-------|---|
| 1. SGQ | __ | 6 | |
| 2. Documentos | __ | 6 | |
| 3. Rastreabilidade | __ | 5 | |
| 4. Compras | __ | 6 | |
| 5. Validação | __ | 5 | |
| 6. Metrologia | __ | 5 | |
| 7. NC/CAPA | __ | 6 | |
| **TOTAL** | **__** | **39** | |

**Interpretação:**
- 90-100%: Fornecedor confiável
- 75-89%: Aprovado com observações
- 50-74%: Requer plano de ação
- <50%: Alto risco - reavaliar fornecimento

---

*Checklist desenvolvido por Lifetrek Medical com base em requisitos ISO 13485:2016 e experiência em auditorias de fornecedores de dispositivos médicos.*
`;

async function updateResource() {
    console.log('Updating supplier audit checklist resource...');

    const { data, error } = await supabase
        .from('resources')
        .update({
            content: checklistContent,
            title: 'Checklist: Auditoria de Fornecedores de Dispositivos Médicos',
            description: 'Checklist prático com 39 itens de verificação nos 7 processos críticos da ISO 13485 para validação de fornecedores. Inclui scoring e interpretação.',
            metadata: {
                tags: ['ISO 13485', 'Quality', 'Audit', 'Suppliers', 'CAPA'],
                items_count: 39,
                categories: 7
            },
            updated_at: new Date().toISOString()
        })
        .eq('slug', 'checklist-auditoria-iso-13485')
        .select();

    if (error) {
        console.error('Error updating resource:', error);

        // Try to insert if doesn't exist
        console.log('Trying to insert new resource...');
        const { data: insertData, error: insertError } = await supabase
            .from('resources')
            .insert({
                title: 'Checklist: Auditoria de Fornecedores de Dispositivos Médicos',
                description: 'Checklist prático com 39 itens de verificação nos 7 processos críticos da ISO 13485 para validação de fornecedores. Inclui scoring e interpretação.',
                content: checklistContent,
                type: 'checklist',
                persona: 'Gestores da Qualidade',
                slug: 'checklist-auditoria-fornecedores',
                status: 'published',
                metadata: {
                    tags: ['ISO 13485', 'Quality', 'Audit', 'Suppliers', 'CAPA'],
                    items_count: 39,
                    categories: 7
                }
            })
            .select();

        if (insertError) {
            console.error('Error inserting resource:', insertError);
        } else {
            console.log('Resource inserted successfully:', insertData);
        }
    } else {
        console.log('Resource updated successfully:', data);
    }
}

updateResource();

INSERT INTO public.resources (
  title,
  description,
  content,
  type,
  persona,
  status,
  slug,
  metadata
)
VALUES (
  'Checklist: Auditoria de Fornecedores de Dispositivos Medicos',
  'Checklist pratico com 39 itens de verificacao nos 7 processos criticos da ISO 13485 para avaliar fornecedores com scoring.',
  $$# Tem certificado? Aprovado.

Essa e a abordagem que mais gera surpresa em auditorias de certificacao.
Voce qualifica um fornecedor com base no certificado ISO 13485.
Tres meses depois, auditoria: NC maior por rastreabilidade.

Investigacao:
- o fornecedor nao consegue vincular lote de materia-prima ao produto final;
- o certificado estava la;
- o sistema, nao.

## Por que isso acontece
Avaliacao superficial tende a focar em:
- tem certificado;
- preco competitivo;
- entrega no prazo.

E ignora o que realmente protege a operacao:
- SGQ vivo (nao apenas papel);
- CAPA com eficacia verificada;
- processos especiais validados;
- calibracoes dentro da validade;
- documentos corretos nas areas.

---

## Checklist de Auditoria (7 processos, 39 itens)

### 1) Sistema de Gestao da Qualidade (6)
- [ ] Manual da Qualidade disponivel e atualizado?
- [ ] Politica da Qualidade comunicada a todos os niveis?
- [ ] Objetivos da Qualidade definidos e mensuraveis?
- [ ] Analises criticas pela direcao documentadas (ultimos 12 meses)?
- [ ] Indicadores de desempenho acompanhados regularmente?
- [ ] Acoes corretivas abertas tratadas dentro do prazo?

### 2) Controle de Documentos e Registros (6)
- [ ] Procedimento de controle de documentos implementado?
- [ ] Indice mestre de documentos atualizado?
- [ ] Documentos obsoletos removidos das areas?
- [ ] Aprovacoes rastreaveis?
- [ ] Registros legiveis, identificaveis e recuperaveis?
- [ ] Tempo de retencao definido e seguido?

### 3) Rastreabilidade (5)
- [ ] Cada lote possui identificacao unica?
- [ ] Registros vinculam MP -> processo -> produto final?
- [ ] Componentes rastreaveis por lote especifico?
- [ ] Rastreabilidade mantida em subcontratados?
- [ ] Em recall, identificam lotes afetados em < 24h?

### 4) Controle de Compras e Subfornecedores (6)
- [ ] Lista de fornecedores aprovados atualizada?
- [ ] Criterios de selecao e avaliacao documentados?
- [ ] Avaliacao de risco para fornecedores criticos?
- [ ] Acordos de qualidade estabelecidos?
- [ ] Recebimento verifica material versus especificacao?
- [ ] Acoes para desempenho abaixo do esperado?

### 5) Validacao de Processos Especiais (5)
- [ ] Processos especiais identificados?
- [ ] Validacao IQ/OQ/PQ documentada?
- [ ] Revalidacao periodica programada e executada?
- [ ] Operadores qualificados e treinados?
- [ ] Equipamentos com manutencao preventiva?

### 6) Controle de Metrologia e Calibracao (5)
- [ ] Lista mestre de equipamentos de medicao?
- [ ] Calibracoes dentro da validade?
- [ ] Procedimento para equipamento fora de calibracao?
- [ ] Identificacao visual do status de calibracao?
- [ ] Incerteza de medicao considerada nas decisoes?

### 7) NC e CAPA (6)
- [ ] Procedimento de nao conformidade implementado?
- [ ] RNCs tratadas no prazo?
- [ ] Causa raiz documentada (5 porques, Ishikawa, etc.)?
- [ ] CAPAs com eficacia verificada?
- [ ] Reclamacoes registradas e investigadas?
- [ ] Tendencias de NC analisadas?

---

## Scoring
- **90-100%**: Fornecedor Confiavel
- **75-89%**: Aprovado com Observacoes
- **50-74%**: Requer Plano de Acao
- **<50%**: Alto Risco - Reavaliar

## O que auditores experientes fazem diferente
1. Pedem uma CAPA recente e verificam tempo de fechamento e eficacia.
2. Pegam um lote e testam rastreabilidade ate a MP.
3. Checam calibracao de equipamento aleatorio.
4. Verificam documento em uso na area para detectar versao obsoleta.

Nao e o certificado na parede que separa risco de confiabilidade.
E a profundidade e consistencia do sistema.
$$,
  'checklist',
  'Qualidade/RA',
  'published',
  'checklist-auditoria-fornecedores',
  '{"tags":["ISO 13485","audit","suppliers","quality","capa"],"items_count":39,"categories":7}'::jsonb
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

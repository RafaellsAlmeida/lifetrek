# Lifetrek - Onboarding Checklist
## SDR/Marketing Team Member

---

## A. Acesso & Integrações (Infraestrutura)

### Sistema e Ferramentas
- [ ] Acesso ao sistema Lifetrek (login criado)
- [ ] Acesso aos perfis de LinkedIn da empresa e sócios
  - [ ] LinkedIn pessoal do Rafael conectado
  - [ ] Outros membros do time (se aplicável)
- [ ] Acesso à página da empresa no LinkedIn
- [ ] **LinkedIn Sales Navigator** (licença individual)
  - [ ] Trial de 30 dias ativado (ou licença paga)
  - [ ] Treinamento em filtros avançados agendado
  - [ ] Listas salvas criadas (ortopedia, odonto, vet, OEM)
- [ ] Acesso ao CRM ou planilha de gestão de leads
  - Localização: `/MASTER_ENRICHED_LEADS.csv`
  - Campos principais: Nome, Empresa, Cargo, Canal, Origem, Etapa, Próximos Passos

### Canais de Comunicação
- [ ] Email comercial configurado (comercial@lifetrek.com.br)
  - [ ] Assinatura de email configurada
  - [ ] Modelos de resposta salvos
- [ ] WhatsApp Business configurado
  - [ ] Mensagens automáticas configuradas
  - [ ] Etiquetas organizadas
- [ ] Instagram/LinkedIn DMs
  - [ ] Notificações ativadas
  - [ ] Respostas rápidas configuradas
- [ ] Sistema de telefonia/VoIP configurado
  - [ ] Ramal configurado
  - [ ] Gravação de chamadas ativada
  - [ ] Voicemail personalizado

### Ferramentas de Enriquecimento e Automação
- [ ] Acesso aos scripts de enriquecimento de leads (`/execution`)
  - [ ] `enrich_emails_super.py` - Como executar
  - [ ] Entender processo de enrichment
- [ ] Acesso ao sistema de geração de conteúdo LinkedIn
  - [ ] `/docs/systems/linkedin-automation.md` revisado
  - [ ] Processo de aprovação de carousels entendido
- [ ] **LinkedIn Sales Navigator - Funcionalidades**
  - [ ] Filtros avançados (50+ opções)
  - [ ] InMail credits (50/mês)
  - [ ] Lead IQ e Account IQ (alertas inteligentes)
  - [ ] Saved searches e custom lists

---

## B. Conhecimento da Empresa e Mercado

### Documentação Essencial (ler e compreender)
- [ ] **Brand Book Completo**
  - Localização: `/docs/brand/BRAND_BOOK.md`
  - Principais valores, tom de voz, posicionamento
- [ ] **Brand Quick Reference**
  - Localização: `/docs/brand/BRAND_QUICK_REFERENCE.md`
  - Elevator pitch, mensagens-chave
- [ ] **Company Context**
  - Localização: `/docs/brand/COMPANY_CONTEXT.md`
  - História, equipe, casos de uso
- [ ] **Pitch Deck atualizado**
  - Estrutura: Problema → Solução → Prova → Piloto
  - Adaptações por segmento (ortopedia, odonto, vet, OEM, hospital)
- [ ] **Pesquisa de mercado brasileiro**
  - Dores principais: importação cara/lenta, estoque, lead time
  - Diferenciais Lifetrek vs. importação

### Ofertas e Segmentos
- [ ] Tipos de cliente:
  - [ ] Ortopedia (próteses, placas, parafusos)
  - [ ] Odontologia (guias cirúrgicos, implantes)
  - [ ] Veterinária (placas, pinos)
  - [ ] OEM/Indústria (componentes para revenda)
  - [ ] Hospitais (instrumentais customizados)
- [ ] Tipos de projeto:
  - [ ] Protótipo (baixo volume, alta customização)
  - [ ] Produção seriada (médio/alto volume)
  - [ ] Desenvolvimento conjunto (co-design)
- [ ] Matriz de qualificação de leads:
  - [ ] Volume estimado
  - [ ] Tipo de material (aço inox, titânio, PEEK, outros)
  - [ ] Requisitos regulatórios (ISO 13485, ANVISA, FDA)
  - [ ] Prazo esperado
  - [ ] Orçamento disponível

### SLAs e Processos
- [ ] **SLA de resposta**: Responder todos os leads em até **1h no horário comercial**
- [ ] **Processo de qualificação**: 3-6 perguntas antes de passar para orçamento
- [ ] **Próximos passos padrão**:
  - Lead frio → Agendamento de call
  - Lead qualificado → NDA + envio de desenho técnico
  - Lead quente → Reunião técnica + proposta comercial

---

## C. Playbooks e Prompts Existentes

### Prompts de IA Disponíveis
- [ ] **LinkedIn Best Practices**
  - Localização: `/docs/guides/LINKEDIN_BEST_PRACTICES.md`
- [ ] **Plano de Conteúdo LinkedIn (Jan 2026)**
  - Localização: `/docs/content/linkedin_mar_2026_content_plan.md`
  - Temas, hooks, CTAs por semana
- [ ] **Sales Enrichment System**
  - Localização: `/docs/systems/sales-enrichment.md`
  - Como usar IA para pesquisar prospects
- [ ] **Lead Enrichment Guide**
  - Localização: `/docs/guides/ENRICHMENT_GUIDE.md`

### Scripts e Sequências
- [ ] **Sequência de LinkedIn** (conexão + follow-up)
  - Mensagem 1: Convite personalizado com research
  - Mensagem 2-4: Sequência de valor (problema, solução, case, CTA)
- [ ] **Cold Email**
  - Assunto + corpo + CTA
  - Por nicho (ortopedia, odonto, etc.)
- [ ] **Resposta a inbound** (formulário do site)
  - Agradecimento + contexto + perguntas de qualificação
  - Sugestão de próximo passo

---

## D. Regras de Voz e Tom

- [ ] **Idioma**: Sempre português BR técnico, educado, direto
- [ ] **Postura**: Falar como "nós/nossa equipe" (nunca em primeira pessoa singular)
- [ ] **Promessas**:
  - ❌ Nunca promete preço/prazo sem análise técnica
  - ✅ Sempre oferecer "análise gratuita de viabilidade"
- [ ] **Próximos passos**: Toda mensagem termina com um **próximo passo claro**
  - Pergunta direcionada, ou
  - Convite para call/reunião, ou
  - Pedido de informação específica

---

## E. Regras de Escalação e Handoff

### Quando envolver o time técnico/comercial humano

- [ ] **Lead de alto valor** (score 4-5 na matriz de qualificação)
  - Volume >100 peças/mês
  - Projeto estratégico (OEM, hospital grande)
- [ ] **Dúvida técnica profunda**
  - Materiais exóticos (PEEK, cerâmica)
  - Requisitos regulatórios complexos (FDA, certificações)
- [ ] **Negociação comercial**
  - Pedido de desconto
  - Discussão de termos de pagamento
  - Contratos de longo prazo
- [ ] **Cliente existente** com problema ou reclamação
  - Sempre escalar imediatamente

### Como escalar
- [ ] Registrar no CRM/planilha: "ESCALADO - [motivo]"
- [ ] Notificar time no Slack/WhatsApp
- [ ] Fazer handoff contextualizado (resumo da conversa até o momento)

---

## F. Operação por Canal

### 1. LinkedIn - Gestão de Perfis Pessoais

**O que você fará:**
- [ ] Enviar convites personalizados (máx. 20-30/dia por perfil)
  - Usar research do prospect (empresa, cargo, setor)
  - Template: Ver `/docs/guides/LINKEDIN_BEST_PRACTICES.md`
- [ ] Gerenciar sequência de mensagens (máx. 3-4 mensagens)
  - Mensagem 1: Por que estou conectando
  - Mensagem 2: Valor/case relevante
  - Mensagem 3: CTA (call/material)
  - Mensagem 4: Breakup (última tentativa)
- [ ] Logar todas as interações no CRM

**Critérios de sucesso:**
- Taxa de aceitação de convites >30%
- Taxa de resposta >15%
- Pelo menos 2 calls agendadas/semana via LinkedIn

---

### 2. Engajamento em Posts (LinkedIn)

**O que você fará:**
- [ ] Responder **todos** os comentários em posts da Lifetrek em até **2 horas**
- [ ] Identificar comentários "quentes":
  - Pergunta técnica → Responder + enviar DM
  - Pedido de contato → Responder + agendar call
  - Interesse explícito → Logar lead no CRM
- [ ] Monitorar quem "curtiu" ou visitou a página da empresa
  - Enviar conexão personalizada
  - Mensagem: "Vi que você interagiu com nosso conteúdo sobre [tema], normalmente isso é porque..."

**Critérios de sucesso:**
- 100% dos comentários respondidos
- Pelo menos 5 conversas iniciadas/semana via engajamento

---

### 3. Leads do Site (Formulários Inbound)

**O que você fará:**
- [ ] Usar o **AI Sales Assistant Prompt** (ver abaixo)
  1. Agradecer pelo contato
  2. Puxar contexto (empresa, segmento via LinkedIn/Google)
  3. Fazer 3-6 perguntas de qualificação:
     - Volume esperado (protótipo ou produção)
     - Tipo de material
     - Possui desenho técnico?
     - Prazo desejado
     - Requisitos regulatórios (ISO, ANVISA, etc.)
  4. Sugerir próximo passo: call ou NDA + envio de desenho
- [ ] Logar lead no CRM com score 0-100
  - Leads 4-5: Notificação imediata ao time

**SLA:**
- Primeira resposta: **15 minutos** (horário comercial)
- Follow-up (se sem resposta): 24h depois

---

### 4. Insights e Relatórios Semanais

**O que você entregará:**
- [ ] Relatório semanal com:
  - Quais mensagens/CTAs mais geraram resposta
  - Quais nichos mais engajaram (ortopedia, odonto, etc.)
  - Perguntas técnicas recorrentes
  - Sugestões de posts/artigos para próxima semana
- [ ] Formato: **1 página**
  - O que funcionou
  - O que não funcionou
  - O que testar semana que vem

**Métricas principais:**
- Leads gerados por canal
- Taxa de conversão (lead → call → proposta)
- Tempo médio de resposta
- Score médio dos leads

---

### 5. Atendimento Telefônico

**Fluxo padrão:**
1. **Saudação**: "Bom dia/tarde, Lifetrek, [seu nome], como posso ajudar?"
2. **Identificar**:
   - Cliente atual?
   - Novo projeto?
   - Suporte/dúvida?
3. **Coletar dados mínimos**:
   - Nome, empresa, telefone, email
   - Motivo do contato
4. **Registrar** no CRM
5. **Encaminhar** ou agendar follow-up

**O que NUNCA decidir sozinha:**
- ❌ Preço final
- ❌ Desconto
- ❌ Prazo de entrega definitivo
- ❌ Termos comerciais (pagamento, garantia)

**Sempre:**
- ✅ Oferecer "análise técnica gratuita"
- ✅ Agendar call com time técnico se necessário
- ✅ Enviar resumo + gravação da ligação pro time

---

### 6. Orquestração Multi-Canal

**Regra de ouro:** Centralizar histórico por lead
- "Último contato: WhatsApp dia X, antes email dia Y, antes LinkedIn dia Z"

**Cadência de contato:**
- [ ] Não mandar mesma mensagem em 3 canais no mesmo dia
- [ ] Ordem sugerida: **LinkedIn → Email → WhatsApp** (intervalos de 2-3 dias)
- [ ] Se sem resposta após 3 tentativas multi-canal: marcar como "nurture" e incluir em campanhas de conteúdo

**Ferramentas:**
- CRM/Planilha para centralizar histórico
- Tags por canal de origem (LinkedIn, Site, Indicação, Evento, etc.)

---

## G. Cronograma de Onboarding (Primeira Semana)

### Dia 1 - Setup e Conhecimento
- [ ] Configurar acessos (LinkedIn, email, WhatsApp, CRM)
- [ ] Ler Brand Book + Company Context
- [ ] Assistir pitch deck (com sócio/líder)

### Dia 2 - Processos e Ferramentas
- [ ] Estudar playbooks de LinkedIn e Email
- [ ] Rodar script de enrichment (acompanhado)
- [ ] Entender fluxo de qualificação de leads

### Dia 3 - Prática Supervisionada
- [ ] Responder 5 leads inbound (com revisão)
- [ ] Enviar 10 convites LinkedIn (com revisão)
- [ ] Fazer 2 ligações de follow-up (com sombra)

### Dia 4 - Autonomia Parcial
- [ ] Responder inbound sozinha (com check diário)
- [ ] Gerenciar sequências LinkedIn
- [ ] Começar a alimentar CRM

### Dia 5 - Revisão e Planejamento
- [ ] Reunião de feedback com líder
- [ ] Criar plano de ação para semana 2
- [ ] Definir metas: X leads qualificados, Y calls agendadas

---

## H. Responsáveis e Prazos

| Item | Responsável | Prazo | Status |
|------|-------------|-------|--------|
| Criar login sistema | TI/Rafael | Antes do Dia 1 | ⬜ |
| Configurar email | TI/Rafael | Antes do Dia 1 | ⬜ |
| Acesso LinkedIn | Rafael | Dia 1 | ⬜ |
| Treinamento Brand Book | Rafael | Dia 1 | ⬜ |
| Treinamento Playbooks | SDR Sênior/Rafael | Dia 2 | ⬜ |
| Prática supervisionada | SDR Sênior/Rafael | Dia 3-4 | ⬜ |
| Revisão semanal | Rafael | Toda sexta | ⬜ |

---

## I. Dúvidas Frequentes (FAQ)

**Q: O que fazer se um lead pedir preço de cara?**  
A: Nunca dar preço sem qualificação. Resposta: "Para darmos um orçamento preciso, precisamos entender melhor seu projeto. Posso fazer algumas perguntas rápidas?"

**Q: E se o lead disser que já tem fornecedor?**  
A: "Entendo! Muitos dos nossos clientes também tinham fornecedores antes de nos conhecer. O que os trouxe até nós foi [benefício específico]. Posso mostrar como ajudamos [empresa similar]?"

**Q: Como sei se devo escalar para o time técnico?**  
A: Use a matriz de qualificação (score 4-5) + critérios de escalação (seção E deste documento).

**Q: Quantos follow-ups devo fazer?**  
A: Máximo de 3-4 tentativas por canal. Depois, mover para "nurture" e incluir em campanhas de conteúdo.

---

## J. Recursos e Links Úteis

- **Documentação completa**: `/docs`
- **Brand Book**: `/docs/brand/BRAND_BOOK.md`
- **LinkedIn Best Practices**: `/docs/guides/LINKEDIN_BEST_PRACTICES.md`
- **Scripts de enrichment**: `/execution`
- **CRM/Leads**: `/MASTER_ENRICHED_LEADS.csv`
- **Suporte interno**: [Slack/WhatsApp do time]

---

**Última atualização:** 07/01/2026  
**Versão:** 1.0  
**Contato para dúvidas:** Rafael Almeida

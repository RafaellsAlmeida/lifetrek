# Plano Contínuo — 24 Blogs até 31/05/2026

**Data de referência:** 12/02/2026 (quinta-feira)  
**Prazo final:** 31/05/2026 (domingo)

## Estado Atual (baseline real)

- Posts no banco hoje: **7**
- Status atual: **1 published**, **1 draft**, **5 pending_review**
- Gap até a meta: **17 posts**
- Capa horizontal para blog: gerada e validada
- SEO técnico da página de post: canonical/meta/OG/Twitter unificados e validados

## Meta Final até 31/05/2026

- **24 posts prontos para aprovação interna** (stakeholder-ready)
- **24 posts com checklist SEO/AIO completo**
- **24 posts com data de scheduling definida**
- Pipeline estável para manter publicação sem gargalo até o fim de maio

## Cadência Operacional (a partir de 12/02/2026)

- Ritmo de produção: **2 posts por semana**
- Ritmo de aprovação interna: **2 posts por semana**
- Ritmo de scheduling: **1 a 2 posts por semana** (com buffer de atraso)
- Buffer de risco: últimas semanas de maio reservadas para ajustes finais

## Pipeline Obrigatório por Post

1. `brief_ready`  
2. `draft_pending_internal`  
3. `stakeholder_review`  
4. `approved_to_schedule`  
5. `scheduled`

## Gate SEO/AIO (obrigatório antes de `approved_to_schedule`)

1. `seo_title` entre 40 e 65 caracteres
2. `seo_description` entre 140 e 160 caracteres
3. `keywords` com 3 ou mais termos relevantes
4. `featured_image` definida (capa horizontal)
5. `metadata.sources` com 4 ou mais links válidos
6. Seção `Referências` presente no conteúdo
7. FAQ presente (mínimo 3 perguntas) quando aplicável ao tema
8. Canonical/OG/Twitter corretos no link público `/blog/:slug`

## Plano de Execução (rolling)

### Sprint 1 — 12/02 a 28/02

- Fechar os 7 já existentes para gate SEO/AIO completo
- Gerar + revisar 4 novos posts
- Total acumulado alvo: **11/24**

### Sprint 2 — 01/03 a 31/03

- Gerar + revisar 8 novos posts
- Iniciar scheduling contínuo dos aprovados
- Total acumulado alvo: **19/24**

### Sprint 3 — 01/04 a 30/04

- Gerar + revisar 5 novos posts
- Validar distribuição de keywords por cluster
- Total acumulado alvo: **24/24**

### Sprint 4 — 01/05 a 31/05

- Janela de buffer para retrabalho, aprovação final e agendamento restante
- Garantir que todos os 24 estejam `approved_to_schedule` ou `scheduled`

## Rotina Semanal (segunda a sexta)

1. Segunda: priorização dos 2 temas da semana + pesquisa/citações
2. Terça: versão draft + SEO pack do post 1
3. Quarta: revisão interna + ajustes post 1; draft post 2
4. Quinta: revisão interna + ajustes post 2; envio stakeholder
5. Sexta: decisão de aprovação + agendamento + auditoria SEO semanal

## Regras de Qualidade Editorial

- Tom técnico (engenheiro-para-engenheiro)
- Proposta de valor concreta por artigo
- Sem promessas clínicas indevidas
- CTA consultivo (diagnóstico, checklist, call técnica)
- Dados e claims sempre com fonte

## Entregáveis já criados para suportar esta operação

- Tracker operacional dos 24 slots:  
  `/Users/rafaelalmeida/lifetrek/docs/content/BLOG_24_EXECUTION_TRACKER.md`
- Auditoria SEO do banco (script):  
  `/Users/rafaelalmeida/lifetrek/scripts/audit_blog_seo.cjs`

## Commit Strategy (incremental)

- 1 commit por bloco fechado:
  - bloco planejamento/tracker
  - bloco automações/scripts
  - bloco conteúdo/lotes
  - bloco ajustes SEO/UI

## Próximo Bloco Imediato

1. Rodar auditoria SEO e publicar baseline no tracker
2. Fechar os 7 posts atuais no gate SEO/AIO
3. Gerar o próximo lote de 4 posts
4. Submeter 2 para stakeholder review

# Modelos de Dados: Lifetrek

Resumo dos modelos de dados mais relevantes do produto atual, organizado por setor.

## 1. Aprovação e Publicação

### Tabelas principais

- `stakeholder_review_batches`
- `stakeholder_review_tokens`
- `stakeholder_review_items`

### Função das tabelas

- `stakeholder_review_batches`: representa um lote enviado para revisão.
- `stakeholder_review_tokens`: armazena token, reviewer, expiração e vínculo com lote.
- `stakeholder_review_items`: liga cada item de conteúdo do lote ao seu estado de revisão.

### Campos importantes

- `status`
- `reviewer_email`
- `expires_at`
- `content_type`
- `content_id`
- `copy_edits`
- `reviewed_at`

## 2. Blog e Editorial

### Tabelas principais

- `blog_posts`
- `blog_categories`

### Campos importantes em `blog_posts`

- `title`
- `slug`
- `excerpt`
- `content`
- `status`
- `featured_image`
- `hero_image_url`
- `seo_title`
- `seo_description`
- `keywords`
- `tags`
- `published_at`
- `metadata`

### Metadados editoriais esperados

- `icp_primary`
- `icp_secondary`
- `pillar_keyword`
- `entity_keywords`
- `cta_mode`
- campos auxiliares de aprovação/publicação

## 3. CRM e Leads

### Tabela principal

- `contact_leads`

### Campos típicos

- `name`
- `email`
- `company`
- `status`
- `priority`
- `source`
- `lead_score`
- `score_breakdown`
- `technical_requirements`
- `created_at`
- `updated_at`

## 4. Analytics e Relatórios

### Tabelas principais

- `linkedin_analytics`
- `linkedin_analytics_daily`
- `analytics_events`
- `blog_analytics`
- `lead_behavior_logs`

### Observações

- `linkedin_analytics` representa a importação normalizada via CSV/XLS/XLSX.
- `linkedin_analytics_daily` cobre snapshots ou integrações operacionais já existentes.
- `blog_analytics` e `lead_behavior_logs` ajudam a conectar conteúdo e comportamento.

## 5. Desenho Técnico

### Tabela principal

- `engineering_drawing_sessions`

### Finalidade

Persistir sessão, documento normalizado, estado técnico e metadados necessários para renderização e exportação.

### Campos esperados

- identificador da sessão
- status
- referência de entrada
- documento normalizado
- artefatos/exportações
- `created_by`
- timestamps

## 6. Suporte Social e Governança Visual

### Tabelas principais

- `linkedin_carousels`
- `instagram_posts`
- `content_ideas`
- `product_catalog`
- `asset_embeddings`

### Campos relevantes em `linkedin_carousels` / `instagram_posts`

- `slides` (jsonb)
- `image_urls` (text[])
- `caption`
- `status`

### Campos relevantes por slide (`slides[n]`)

- `image_url` / `imageUrl`
- `image_variants`
- `prev_image_urls`
- `asset_source`
- `selection_score`
- `selection_reason`
- `asset_id`

### Regras

- histórico de imagem é append-only;
- assets reais vêm antes do fallback com IA;
- templates visuais permanecem controlados.

## 7. Conhecimento e Busca

### Tabelas auxiliares

- `knowledge_base`
- `company_facts`
- `ai_response_suggestions`
- `carousels_embeddings`

### Uso

- RAG técnico;
- fatos estruturados;
- busca semântica para apoio ao conteúdo e atendimento.

## 8. Convenções Gerais

- PK: UUID v4
- timestamps: `created_at` / `updated_at` com `timestamptz`
- tipagem da aplicação: `src/integrations/supabase/types.ts`

> Para o schema completo e atualizado, use as migrations em `supabase/migrations/` e os tipos gerados da aplicação.

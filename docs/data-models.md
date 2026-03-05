# Data Models: Lifetrek

Resumo dos modelos de dados relevantes para geração de conteúdo, seleção de fundos e override manual.

## Core Schema (Public)

### Content & Marketing

- `blog_posts`: artigos e metadados de SEO.
- `blog_categories`: categorização de blog.
- `content_templates`: templates base de conteúdo.
- `linkedin_carousels`: conteúdo e slides para LinkedIn.
- `instagram_posts`: conteúdo e slides para Instagram.

Campos relevantes em `linkedin_carousels`/`instagram_posts`:
- `slides` (jsonb): array de slides.
- `image_urls` (text[]): URLs de imagem por slide.

Campos relevantes por slide (`slides[n]`):
- `image_url` / `imageUrl`
- `image_variants` (string[])
- `asset_source` (`real | ai | rule_override | manual`)
- `selection_score` (number)
- `selection_reason` (string)
- `asset_id` (opcional)

### Assets e Similaridade Semântica

- `product_catalog`: catálogo de fotos/produtos/facility.
- `asset_embeddings`: índice semântico para matching de assets.
  - `asset_id`, `asset_url`, `category`, `tags`, `search_text`, `embedding vector(1536)`, `quality_score`, `active`.
- RPC `match_asset_candidates(query_embedding, categories, match_threshold, match_count)`.

### AI & Knowledge

- `knowledge_base`: chunks de conhecimento técnico para RAG.
- `ai_response_suggestions`: respostas sugeridas.
- `carousels_embeddings`: embeddings de conteúdo social para análises internas.

### Lead & CRM

- `contact_leads`
- `lead_analytics_detailed`
- `admin_permissions`
- `daily_tasks`

### Analytics

- `analytics_events`
- `blog_analytics`
- `lead_behavior_logs`

## Conventions

- PK: UUID v4.
- Timestamps: `created_at` / `updated_at` (`timestamptz`).
- Tipagem de app: `src/integrations/supabase/types.ts`.

> Nota: para o schema completo e atualizado, use migrations em `supabase/migrations/` e os tipos gerados.

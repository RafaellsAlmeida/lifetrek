# Contratos de API: Lifetrek Backend

Lifetrek usa Supabase Edge Functions (Deno). Este documento resume os contratos ativos mais importantes do produto atual: aprovação por email, blog, CRM, analytics e desenho técnico.

A documentação antiga priorizava geração/edição visual no Social Media Workspace. Esse fluxo agora deve ser tratado como suporte ao conteúdo, não como prioridade estratégica do produto.

## Padrões Gerais

- Auth: bearer token obrigatório para operações administrativas.
- Content-Type: `application/json`.
- CORS: habilitado nas functions.
- Operações sensíveis ficam em Edge Functions, nunca diretamente no frontend.
- Tokens públicos devem ter escopo mínimo e expiração.
- Erro padrão:

```json
{ "success": false, "error": "mensagem" }
```

## Aprovação por Email

### `POST /functions/v1/send-stakeholder-review`

Cria um lote de revisão por stakeholder e envia emails com links seguros.

Request típico:

```json
{
  "post_ids": ["uuid"],
  "notes": "Comentário opcional para os revisores"
}
```

Comportamento:

- Exige usuário autenticado com permissão administrativa.
- Valida que os conteúdos estão aprovados internamente.
- Cria registros em `stakeholder_review_batches`.
- Cria tokens em `stakeholder_review_tokens`.
- Cria itens em `stakeholder_review_items`.
- Envia email com template Lifetrek.
- Atualiza os conteúdos para `stakeholder_review_pending`.
- Desfaz o lote se houver falha crítica de envio.

Response típico:

```json
{
  "success": true,
  "batch_id": "uuid",
  "sent_count": 2
}
```

### `GET|POST /functions/v1/stakeholder-review-action`

Endpoint público usado pela rota `/review/:token`.

GET com `action=fetch`:

```text
/functions/v1/stakeholder-review-action?token=TOKEN&action=fetch
```

POST para decisão:

```json
{
  "token": "TOKEN",
  "item_id": "uuid",
  "action": "approve"
}
```

Actions:

- `fetch`: carrega lote, reviewer e itens.
- `approve`: aprova um item.
- `reject`: rejeita um item com comentário.
- `edit_suggest`: registra sugestão de edição/copy.

Regras:

- Não exige login administrativo.
- Token expira.
- Não deve expor dados administrativos além do necessário para revisão.
- Registra reviewer, data e decisão.

## Blog

### `POST /functions/v1/generate-blog-post`

Gera um rascunho técnico para o blog.

Request típico:

```json
{
  "topic": "Fabricação local de implantes ortopédicos",
  "keywords": ["implantes ortopédicos", "fabricação local"],
  "category": "educacional",
  "async": true
}
```

Saída esperada:

```json
{
  "success": true,
  "post": {
    "title": "string",
    "slug": "string",
    "excerpt": "string",
    "seo_title": "string",
    "seo_description": "string",
    "content": "<h2>...</h2>",
    "keywords": ["string"],
    "tags": ["string"]
  }
}
```

Regras:

- Conteúdo em português do Brasil.
- Tom técnico e educacional.
- Metadados de SEO devem ser editáveis no Admin Blog.
- Conteúdo gerado precisa de revisão humana antes de aprovação/publicação.

### `POST /functions/v1/generate-blog-images`

Gera ou associa imagens de apoio para posts do blog.

Request:

```json
{
  "limit": 20,
  "dry_run": false
}
```

Response:

```json
{
  "success": true,
  "processed_count": 12,
  "updated_count": 10,
  "failed_count": 2
}
```

Observação: imagens de blog são suporte editorial. Elas não substituem revisão técnica, SEO ou aprovação.

## CRM

### `POST /functions/v1/import-leads`

Importa leads para o CRM.

Request típico:

```json
{
  "leads": [
    {
      "name": "Nome",
      "email": "contato@empresa.com",
      "company": "Empresa",
      "score": 82
    }
  ]
}
```

Comportamento:

- Requer autenticação administrativa.
- Normaliza campos principais.
- Faz upsert por email quando aplicável.
- Atribui status inicial `new`.
- Calcula prioridade inicial quando há score.

## Analytics

### `POST /functions/v1/ingest-linkedin-analytics`

Validação e ingestão de CSV/XLS/XLSX do LinkedIn para tabela normalizada `linkedin_analytics`.

Request de validação:

```json
{
  "mode": "validate",
  "file_name": "linkedin-mar-2026.csv",
  "csv_text": "post date,post url,impressions,..."
}
```

Request de ingestão:

```json
{
  "mode": "ingest",
  "conflict_policy": "skip",
  "file_name": "linkedin-mar-2026.csv",
  "csv_text": "post date,post url,impressions,..."
}
```

`conflict_policy`:

- `skip`: mantém linhas existentes e ignora hashes já importados.
- `overwrite_period`: remove linhas do período detectado e reinsere o arquivo atual.

Response:

```json
{
  "success": true,
  "rows_total": 120,
  "accepted_count": 118,
  "rejected_count": 2,
  "inserted_count": 110,
  "skipped_duplicate_hash_count": 8,
  "periods_detected": ["2026-03"]
}
```

### `POST /functions/v1/sync-ga4-analytics`

Sincroniza dados de Google Analytics quando a integração está configurada.

### `POST /functions/v1/sync-linkedin-analytics`

Sincroniza métricas LinkedIn quando a integração está configurada.

## Desenho Técnico

### `POST /functions/v1/engineering-drawing`

Executa operações server-side relacionadas ao fluxo de desenho técnico.

Responsabilidades esperadas:

- processar entrada técnica;
- apoiar normalização do documento;
- persistir artefatos quando necessário;
- integrar com Storage e banco;
- preservar validações e rastreabilidade.

O fluxo completo é exposto pela rota `/admin/desenho-tecnico` e seus componentes React.

## Contratos Visuais de Apoio

### `POST /functions/v1/regenerate-carousel-images`

Gera novas variantes de imagem para carousel existente e salva no Supabase Storage.

Request:

```json
{
  "carousel_id": "uuid",
  "table_name": "linkedin_carousels",
  "slide_index": 0,
  "mode": "smart",
  "allow_ai_fallback": true
}
```

Response:

```json
{
  "success": true,
  "carousel_id": "uuid",
  "mode": "smart",
  "slides_regenerated": 1,
  "images_generated": 1,
  "duration_ms": 4800
}
```

Regra crítica: esta função deve adicionar variantes. Nunca sobrescrever imagens existentes.

### `POST /functions/v1/set-slide-background`

Define manualmente o fundo de um slide, preservando histórico.

Request:

```json
{
  "table_name": "instagram_posts",
  "post_id": "uuid",
  "slide_index": 0,
  "new_image_url": "https://...",
  "asset_id": "uuid",
  "source": "manual"
}
```

Comportamento:

- Atualiza `slides[slide_index].image_url` e `imageUrl`.
- Adiciona entrada em `image_variants`.
- Atualiza `image_urls[slide_index]`.
- Salva metadados de seleção.

Observação: esses contratos visuais são suporte ao conteúdo. Eles não devem ser usados para posicionar o Lifetrek como editor avançado de imagem ou vídeo.

## Tabelas Relacionadas

- `stakeholder_review_batches`
- `stakeholder_review_tokens`
- `stakeholder_review_items`
- `blog_posts`
- `blog_categories`
- `contact_leads`
- `linkedin_analytics`
- tabelas de conteúdo social
- sessões e documentos normalizados de desenho técnico

## Princípios Gerais

- Funções administrativas exigem autenticação.
- Funções públicas por token devem ter escopo mínimo.
- Operações com segredo ou service role ficam em Edge Functions.
- Imagens e variantes devem preservar histórico.
- Aprovação e publicação devem ser rastreáveis.

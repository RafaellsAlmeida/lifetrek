# API Contracts: Lifetrek Backend

Lifetrek usa Supabase Edge Functions (Deno). Este documento foca nos contratos ativos do fluxo de geração/edição visual no Social Media Workspace.

## Padrões Gerais

- Auth: bearer token obrigatório para operações administrativas.
- `regenerate-carousel-images` e `set-slide-background` usam validação manual de token/admin dentro da function.
- Content-Type: `application/json`.
- CORS: habilitado nas functions.
- Erro padrão:

```json
{ "success": false, "error": "mensagem" }
```

## Endpoints de Conteúdo Visual

### 1) `POST /functions/v1/regenerate-carousel-images`

Regera 1 slide ou carousel completo com seleção inteligente de fundo.

Request (campos relevantes):

```json
{
  "carousel_id": "uuid",
  "table_name": "linkedin_carousels",
  "slide_index": 0,
  "mode": "smart",
  "allow_ai_fallback": true
}
```

Campos:
- `carousel_id`: id do post.
- `table_name`: `linkedin_carousels` ou `instagram_posts`.
- `slide_index` (opcional): quando enviado, processa apenas o slide.
- `mode`: `smart | hybrid | ai`.
- `allow_ai_fallback` (opcional): default `true`.

Response (resumo):

```json
{
  "success": true,
  "carousel_id": "uuid",
  "mode": "smart",
  "slides_regenerated": 1,
  "images_generated": 1,
  "duration_ms": 4800,
  "selections": [
    {
      "index": 0,
      "image_url": "https://...",
      "asset_source": "rule_override",
      "selection_score": 0.81,
      "selection_reason": "Selected clean-room-exterior.jpg (...)",
      "asset_id": "uuid"
    }
  ]
}
```

### 2) `POST /functions/v1/set-slide-background`

Override manual de fundo no UI, preservando histórico.

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
- atualiza `slides[slide_index].image_url` e `imageUrl`.
- append em `image_variants`.
- atualiza `image_urls[slide_index]`.
- salva metadados (`asset_source`, `selection_reason`, `asset_id`).

Response:

```json
{
  "success": true,
  "table_name": "instagram_posts",
  "post_id": "uuid",
  "slide_index": 0,
  "old_image_url": "https://...",
  "new_image_url": "https://..."
}
```

## Endpoints de Analytics (CSV)

### 3) `POST /functions/v1/ingest-linkedin-analytics`

Validação e ingestão de CSV do LinkedIn para tabela normalizada `linkedin_analytics`.

Request (validate):

```json
{
  "mode": "validate",
  "file_name": "linkedin-mar-2026.csv",
  "csv_text": "post date,post url,impressions,..."
}
```

Request (ingest):

```json
{
  "mode": "ingest",
  "conflict_policy": "skip",
  "file_name": "linkedin-mar-2026.csv",
  "csv_text": "post date,post url,impressions,..."
}
```

`conflict_policy`:
- `skip` (recomendado): mantém linhas existentes e ignora hashes já importados.
- `overwrite_period`: remove linhas do período detectado e reinsere o arquivo atual.

Response (resumo):

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

## Endpoints de Blog Hero Backfill

### 4) `POST /functions/v1/generate-blog-images`

Geração em lote de hero para posts sem imagem (`featured_image`/`hero_image_url`).

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

## Contrato Semântico de Seleção de Assets

### RPC: `match_asset_candidates(...)`

Assinatura:
- `query_embedding vector(1536)`
- `categories text[]`
- `match_threshold float`
- `match_count int`

Retorno:
- `asset_id`
- `asset_url`
- `category`
- `tags`
- `search_text`
- `quality_score`
- `similarity`

## Observações Operacionais

- Em caso de erro de auth/gateway no `regenerate-carousel-images`, o UI aplica fallback local de seleção smart para não travar o fluxo de design.
- Regra de versionamento: nunca sobrescrever variantes antigas; sempre acumular.

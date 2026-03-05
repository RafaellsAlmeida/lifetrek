# API Contracts: Lifetrek Backend

Lifetrek usa Supabase Edge Functions (Deno). Este documento foca nos contratos ativos do fluxo de geração/edição visual no Social Media Workspace.

## Padrões Gerais

- Auth: JWT obrigatório para operações administrativas.
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
  "mode": "smart",
  "updated_count": 1,
  "results": {
    "slides": [
      {
        "image_url": "https://...",
        "asset_source": "real",
        "selection_score": 0.74,
        "selection_reason": "intent=company_trust; ...",
        "asset_id": "uuid"
      }
    ]
  }
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

- Em ambiente sem deploy da `set-slide-background`, o UI aplica fallback para update direto no banco, mantendo o histórico de variantes.
- Regra de versionamento: nunca sobrescrever variantes antigas; sempre acumular.

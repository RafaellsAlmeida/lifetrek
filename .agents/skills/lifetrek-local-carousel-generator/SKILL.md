---
name: lifetrek-local-carousel-generator
description: Generate LinkedIn carousels locally bypassing Supabase Edge Functions. Use when the user wants to generate content, compose text on images, and save to DB without remote triggers.
---

# Lifetrek Local Carousel Generator

This skill enables the generation of LinkedIn carousels directly from the local development environment using Deno scripts.

## Prerequisites
- Deno installed and available in the PATH.
- Valid `.env` file with `OPEN_ROUTER_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.

## Procedure

### 1. Unified Generation (Pipeline)
To run the full pipeline (Strategist -> Copywriter -> Designer -> Analyst) and save to the database:
```bash
deno run --allow-all scripts/generate_priority_content_local.ts
```
*Note: Edit the `tierOneContent` array in the script to customize the topic and audience.*

### 2. Text Composition (Visual Layer)
To compose the text overlay onto the generated images for a specific carousel:
```bash
deno run --allow-all scripts/compose_carousel_text.ts <carousel_id>
```

### 3. Batch Generation
For processing multiple topics at once:
```bash
deno run --allow-all scripts/batch-generate-carousels-local-persist.ts
```

## Guardrails
- **Environment Variables**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is never exposed.
- **Database Status**: The script will insert carousels with a `pending_approval` or `draft` status based on the Quality Score.
- **Image Persistence**: Uses Sharp or Satori locally to compose images and uploads them back to Supabase storage.

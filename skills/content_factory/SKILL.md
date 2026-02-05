
---
name: Content Factory Ingestion
description: Ingests documents and assets into the RAG Knowledge Base for the Content Generation System.
version: 1.0.0
---

# Content Factory Ingestion Skill

This skill provides the tools to ingest local files (documents and images) into the Supabase Vector Database. This enables the **Content Orchestrator** and **Designer Agent** to access your specific business knowledge and brand assets.

## Prerequisites

1.  **Dependencies**: Ensure `openai` and `@supabase/supabase-js` are installed (already in `package.json`).
2.  **Environment Variables**: The execution environment must have:
    *   `SUPABASE_URL`
    *   `SUPABASE_SERVICE_ROLE_KEY` (Required for writing to DB)
    *   `OPENAI_API_KEY` (Required for embedding and vision)

## Available Scripts

### 1. Ingest Documents (`ingest_docs.js`)

Scans a directory for text files (`.md`, `.txt`, `.pdf` (text only)), chunks them, generates embeddings, and stores them in the `knowledge_base` table.

**Usage:**
```bash
node skills/content_factory/ingest_docs.js <directory_path>
```

**What it does:**
*   Reads files recursively.
*   Splits content into ~1000 token chunks.
*   Calls OpenAI `text-embedding-3-small` (or `text-embedding-ada-002`).
*   Upserts to `knowledge_base` table.

### 2. Ingest Assets (`ingest_assets.js`)

Scans a directory for images (`.jpg`, `.png`, `.webp`), uploads them to Supabase Storage, analyzes them with AI Vision to generate a description, and stores vectors in the `product_catalog` (or `content_assets`) table.

**Usage:**
```bash
node skills/content_factory/ingest_assets.js <directory_path>
```

**What it does:**
*   Uploads image to `content_assets` bucket.
*   Calls OpenAI `gpt-4o` to describe the image (Subject, Context, Visual Style, Brand Alignment).
*   Embeds the *description*.
*   Upserts to `product_catalog` with `image_url` and `embedding`.

## Integration with Agents

*   **Orchestrator**: Queries `knowledge_base` to answer questions or write copies (e.g., "What is our policy on Titanium?").
*   **Designer Agent**: Queries `product_catalog` to find images matching a concept (e.g., "Find me a photo of the Clean Room").

## ⚠️ Troubleshooting

### "fetch failed" / "ENOTFOUND"
If you see `getaddrinfo ENOTFOUND ...supabase.co`, your Supabase project is likely **paused** or **unhealthy**.
1. Go to Supabase Dashboard.
2. Check if the project is "Paused" -> Click "Restore".
3. Check status.supabase.com for outages.

### "Bucket not found"
Ensure you created a public storage bucket named `content_assets` in your Supabase project.
*   **Cost**: Uses OpenAI API. Monitor your usage.

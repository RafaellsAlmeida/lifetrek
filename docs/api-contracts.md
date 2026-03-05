# API Contracts: lifetrek Backend

Lifetrek uses **Supabase Edge Functions** (Deno) for its backend logic. Most functions are organized as standalone microservices.

## Core API Patterns

### Request/Response Format

- **Headers**: CORS enabled, requires `Authorization` (Bearer JWT) for sensitive endpoints.
- **Body**: JSON-based request/responses.
- **Standard Error Response**:

  ```json
  { "error": "Message", "status": 500 }
  ```

## Key Endpoints

### 1. Chat Agent (`/chat`)

- **Purpose**: AI-driven conversation for lead capture and knowledge search.
- **Model**: Gemini 2.0 Flash (via OpenRouter).
- **Modes**: `orchestrator` (Internal content planning), `visitor` (Lead capture).
- **Tools**: `save_lead`, `search_knowledge`, `generate_carousel`.

### 2. Content Generation (`/generate-blog-post`, `/generate-carousel-images`)

- **Purpose**: Automated content production.
- **Integrations**: Nano Banana Pro, OpenRouter.
- **Output**: Clean text or image URLs stored in `company_assets`.

### 3. Analytics Sync (`/sync-ga4-analytics`, `/sync-linkedin-analytics`)

- **Purpose**: Background jobs for data ingestion.
- **Schedule**: Cron-based triggers.

### 4. Admin Tools (`/get-admin-dashboard-stats`)

- **Purpose**: Aggregating metadata for the dashboard views.

## Authentication

- **Public**: Contact forms, guest chatbot.
- **Private**: Content orchestrator, admin dashboards, analytics sync.
- **Service Role**: Used for database cleaning or high-privilege background tasks.

> [!IMPORTANT]
> All new Edge Functions should follow the `index.ts` structure found in `supabase/functions/chat/` for consistency.

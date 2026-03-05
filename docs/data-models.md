# Data Models: lifetrek

This document outlines the core database schema for the Lifetrek platform, organized by functional area.

## Core Schema (Public)

The database follows a relational structure optimized for content orchestration, lead management, and clinical validation.

### Content & Marketing

- **`blog_posts`**: Stores articles, AI-generated content, SEO metadata, and scheduling.
- **`blog_categories`**: Hierarchical organization for content.
- **`content_templates`**: Versions and pillars for content generation hooks.
- **`company_assets`**: Links to media and static assets.

### Lead & CRM

- **`contact_leads`**: Centralized lead storage (Name, Email, CNPJ, Lead Score).
- **`lead_analytics_detailed`**: Deep dive into lead behavior and attribution.
- **`admin_permissions`**: Role-based access control (Engenheira de Vendas, Admin).
- **`daily_tasks`**: Task management for Rafael and Vanessa.

### Analytics

- **`analytics_events`**: Custom tracking for UTMS and page paths.
- **`blog_analytics`**: Tracking for scroll depth, time on page, and CTA clicks.
- **`lead_behavior_logs`**: Raw events for user journey mapping.

### AI & Knowledge

- **`knowledge_base` / `product_catalog`**: Vector-enabled tables for similarity search.
- **`ai_response_suggestions`**: Pre-computed responses for leads.
- **`carousels_embeddings`**: Vector data for LinkedIn visual content.

## Schema Conventions

- **Timestamps**: Uses `created_at` (timestamptz) for most tables.
- **Primary Keys**: UUID (v4).
- **Types**: Strongly typed via `src/integrations/supabase/types.ts`.

> [!NOTE]
> For a full list of tables and columns, refer to the [generated types](../src/integrations/supabase/types.ts).

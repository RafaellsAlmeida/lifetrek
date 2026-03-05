---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/project-context.md
  - docs/product/LIFETREK_PRD.md
  - docs/content-engine-guide.md
  - docs/data-models.md
  - docs/api-contracts.md
  - AGENTS.md
  - GoodPostExemples/ (13 visual reference images)
workflowType: 'architecture'
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-03-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The system has 4 domains. Architecture focus is the Content Engine (must-have); CRM/Website/Image Enhancement are operational and must not be broken.

1. **Content Engine** (primary build scope)
   - LinkedIn carousel generation — multi-agent pipeline (Strategist → Copywriter → Designer → Compositor → Brand Analyst). Operational.
   - Instagram post generation — shares image pipeline (Satori/backgrounds), needs separate copy agent (different voice, dimensions, hashtag format)
   - Blog post generation — PT-BR, draft → Rafael approves → immediately live
   - Ideation — optional `researchLevel: deep` extension on Strategist; surfaces ICP pain points from internet when user has no specific topic
   - Monthly LinkedIn CSV analytics ingestion → informs future content strategy
   - Entry modes: structured form (existing `/admin/orchestrator`) + chat/natural-language (missing)
   - 4 locked visual templates (Glassmorphism Card, Full-Bleed Dark Text, Split Comparison, Pure Photo)

2. **CRM** — operational; lead scoring, email drafts, enrichment. No new scope.
3. **Public Website** — operational. No new scope.
4. **Admin Tools** — image enhancement, pitch deck. No new scope.

**Non-Functional Requirements:**

| NFR | Constraint | Architectural Impact |
|-----|-----------|---------------------|
| Zero infra cost | Free Supabase + Vercel only | No new servers, no paid queues, no Redis |
| No polling | Event-driven: Realtime/Webhooks | No `setInterval`, no background workers |
| Cost per request | `_shared/` cost tracking utilities | Every AI call must log cost |
| PT-BR output | All content generation | Prompts must enforce language |
| Brand fidelity | Satori locked, 4 templates only | No CSS-based image composition |
| Image versioning | Append-only `image_variants` | Never overwrite image_url, always insert variant |
| Non-technical user | Vanessa must self-serve | Progressive UI, safe defaults, no dev-needed error paths |
| Brownfield safety | 170+ components, 33+ pages | Reuse existing hooks/patterns, no breaking changes |

**Scale & Complexity:**

- Primary domain: Full-stack SPA + Serverless AI pipelines (Deno)
- Complexity level: **Medium-High**
- Estimated architectural components: ~8 new edge functions or extensions, ~6 new frontend surfaces
- All backend compute: Supabase Edge Functions (Deno) — hard constraint

### Technical Constraints & Dependencies

- Text LLMs: `google/gemini-2.5-flash` via **OpenRouter**
- Image generation: `google/gemini-3-pro-image-preview` via **OpenRouter** (Nano Banana Pro) — only when real asset threshold not met
- Image composition: Satori (programmatic) — brand elements always added here
- Asset selection: `match_asset_candidates` RPC on `asset_embeddings` table (vector 1536)
- RAG: `knowledge_base` table + Supabase vector search
- Auth: Supabase JWT — all admin operations gated

### Cross-Cutting Concerns Identified

1. **Cost tracking** — every AI call must hit `_shared/cost-tracker`; no unbounded loops
2. **Language enforcement** — PT-BR in all prompts; must be architecture-level rule not per-agent
3. **Brand fidelity** — Satori compositor is the single point of brand control; no exceptions
4. **Image versioning** — append-only rule must be enforced at the data layer, not just UI
5. **Playbook injection** — `topic_playbooks.ts` pattern must extend to cover new content types
6. **Brownfield compatibility** — new features reuse existing hooks (`useLinkedInPosts`, etc.), never re-implement

## Starter Template Evaluation

### Primary Technology Domain

Full-stack SPA (React/Vite) + Serverless AI pipelines (Supabase Edge Functions/Deno).
Brownfield project — no starter initialization. Stack is established and locked.

### Selected Foundation: Existing Lifetrek Codebase

**Rationale:** Project is in active development. All tooling, conventions, and patterns are established. New work extends rather than initializes.

**Architectural Decisions Already Made:**

**Language & Runtime:** TypeScript 5.8.3 (strict), Deno for Edge Functions
**Styling:** Tailwind CSS 3.4.17 + Shadcn/ui components in `src/components/ui/`
**Build Tooling:** Vite 5.4.19 (ESM), path alias `@/` → `src/`
**Testing:** Playwright 1.57.0 (E2E + API)
**Code Organization:** kebab-case components, PascalCase pages, hooks in `src/hooks/`
**AI Routing:** OpenRouter for all models (text + image)
**Deployment:** Vercel (free) + Supabase (free) — zero infra cost constraint

**Note:** No initialization story needed. Implementation begins directly with feature stories.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Instagram uses shared generation pipeline with `platform` param
- Ideation research goes through OpenRouter (no direct Perplexity API)
- Blog posts go through Content Approval (not Blog admin)
- Blog hero images generated via Nano Banana at post creation + batch backfill for existing 24

**Important Decisions (Shape Architecture):**
- New normalized tables: `content_ideas`, `linkedin_analytics`
- Chat orchestrator entry: fix existing non-functional mode in `/admin/orchestrator`
- Instagram workspace: platform toggle on `/admin/social`

**Deferred Decisions (Post-MVP):**
- LinkedIn analytics CSV processing logic (ingest pipeline defined, ML/learning on top deferred)

---

### Data Architecture

| Table | Status | Purpose |
|-------|--------|---------|
| `linkedin_carousels` | Existing | LinkedIn content + slides JSONB |
| `instagram_posts` | Existing | Instagram content, identical slide schema |
| `blog_posts` | Existing | Add `hero_image_url`; ensure `status` supports approval flow |
| `content_ideas` | **New** | Persisted ideation results from deep research; browsable by Vanessa |
| `linkedin_analytics` | **New** | Raw rows from monthly CSV + processed aggregates |

`content_ideas` schema (proposed):
- `id` UUID PK
- `topic` text
- `icp_segment` text
- `pain_points` jsonb (array)
- `source_urls` text[]
- `research_model` text
- `created_by` UUID (admin user)
- `created_at` timestamptz

`linkedin_analytics` schema (proposed):
- `id` UUID PK
- `period_start` date, `period_end` date
- `post_url` text
- `impressions`, `reactions`, `comments`, `shares`, `clicks` int
- `raw_csv_row` jsonb
- `uploaded_at` timestamptz

Blog approval flow: Rafael sets `status = 'approved'` in Content Approval page →
Edge Function / DB trigger sets `is_published = true`, `published_at = now()`.

Blog hero images: generated via `google/gemini-3-pro-image-preview` (Nano Banana via OpenRouter).
Same visual style as existing posts. Generated at blog post creation time.
Batch backfill edge function for existing 24 posts.

---

### Authentication & Security

No changes. Supabase JWT + RLS on all tables. New tables (`content_ideas`,
`linkedin_analytics`) follow same pattern: admin-only write, RLS enforced.

---

### API & Communication Patterns

| Function | Change |
|----------|--------|
| `generate-linkedin-carousel` | Add `platform: 'linkedin' \| 'instagram'` param; routes to platform-specific copywriter prompt |
| `generate-blog-post` | Extend to generate hero image via Nano Banana at creation time |
| `chat` (existing) | Wire NL intent extraction → CarouselParams → `generate-linkedin-carousel`. Currently built, not functional — needs test validation. |
| `generate-blog-images` | **New** — batch hero image generation for blog posts |
| `ingest-linkedin-analytics` | **New** — processes uploaded CSV → `linkedin_analytics` table |

Ideation research: `researchLevel: 'deep'` in strategist uses
`perplexity/llama-3.1-sonar-small-128k-online` **via OpenRouter** (not direct Perplexity API).
Keeps all AI on single OpenRouter key. Results persisted to `content_ideas`.

All new edge functions must call `_shared/cost-tracker` on every AI call.

---

### Frontend Architecture

| Route | Change |
|-------|--------|
| `/admin/orchestrator` | Wire existing chat mode toggle (already built, not functional) |
| `/admin/social` | Add platform toggle: LinkedIn / Instagram; shared visual editor |
| `/admin/content-approval` | Add blog posts to approval queue; add image generation for blog heroes |
| `/admin/blog` | Read-only list; approval action moved to content approval |
| `/admin/analytics` | Add LinkedIn CSV upload UI → triggers `ingest-linkedin-analytics` |

State management: no changes. React Query for server state, local hooks for UI state.
No new global state patterns introduced.

---

### Infrastructure & Deployment

No changes. Vercel (free) + Supabase (free). Zero new paid services.
All AI via OpenRouter single key. Image generation: Nano Banana via OpenRouter.
Event-driven only — no polling, no background workers.

---

### Decision Impact Analysis

**Implementation Sequence:**
1. DB migrations: `content_ideas`, `linkedin_analytics`, `blog_posts` hero field
2. Extend `generate-linkedin-carousel` with `platform` param (Instagram copy)
3. Fix chat mode in `/admin/orchestrator`
4. Blog hero image generation + batch backfill (24 posts)
5. LinkedIn analytics CSV ingestion
6. Ideation deep research integration

**Cross-Component Dependencies:**
- Instagram copy shares image pipeline — design tab changes affect both platforms
- Chat mode depends on CarouselParams type staying stable
- Blog approval in Content Approval page depends on `blog_posts` status field alignment
- All new AI calls depend on `_shared/cost-tracker` pattern

---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-05'
inputDocuments:
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/prd.md
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

### PRD-to-Architecture Trace Mapping (Delta 2026-03-05)

This section aligns the rebuilt PRD in `_bmad-output/planning-artifacts/prd.md` with architectural implementation surfaces while preserving previously validated architectural decisions.

| PRD Requirement Cluster | Architecture Decision Surface | Primary Artifacts |
|---|---|---|
| FR-001/FR-002 Ideation + persistence | Add normalized `content_ideas`; keep ideation path in content pipeline | Data Architecture, API & Communication Patterns |
| FR-003/FR-004 Orchestrator entry parity | Maintain form entry; route chat intent to existing generation contracts | Frontend Architecture (`/admin/orchestrator`), API & Communication Patterns (`chat`) |
| FR-005/FR-006 Social generation contracts | Shared generation pipeline with explicit `platform` parameter | API & Communication Patterns (`generate-linkedin-carousel`) |
| FR-007/FR-008/FR-010 Blog generation lifecycle | Hero image at create + batch backfill support | API & Communication Patterns (`generate-blog-post`, `generate-blog-images`) |
| FR-009/FR-014 Approval consistency | Status-driven publication and approval queue integration | Frontend Architecture (`/admin/content-approval`, `/admin/blog`) |
| FR-011/FR-012/FR-013 Analytics loop | CSV ingestion to normalized `linkedin_analytics` and visibility paths | Data Architecture, Frontend Architecture (`/admin/analytics`), API & Communication Patterns (`ingest-linkedin-analytics`) |
| FR-015 Append-only image variants | Non-destructive regeneration with active variant switching | Cross-Cutting Concerns, Smart Regen Architecture Update |
| FR-016 Real asset first fallback policy | Semantic asset selection before AI fallback | Cross-Cutting Concerns, Smart Regen Architecture Update |
| FR-017 Cost tracking coverage | Enforce `_shared/cost-tracker` on new AI calls | Cross-Cutting Concerns, Implementation Patterns |
| FR-018 Access control and auditability | Admin-only writes with RLS and auditable operations | Authentication & Security |

**No-Regression Guardrails from PRD:**
- CRM, public website, and non-content admin modules remain out of feature-expansion scope.
- Content Engine changes must pass cross-domain no-regression checks before release.

---

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified
7 areas where AI agents could make different choices without explicit rules.

### Naming Patterns

**Database Naming Conventions:**
- Tables: snake_case plural — `content_ideas`, `linkedin_analytics` ✓
- Columns: snake_case — `icp_segment`, `created_by`, `period_start` ✓
- Foreign keys: `<table_singular>_id` — `post_id`, `user_id`
- Indexes: `idx_<table>_<column>` — `idx_content_ideas_created_by`
- NEVER: camelCase columns, singular table names, abbreviations (`usr`, `msg`)

**Edge Function Naming:**
- Directory: kebab-case — `generate-blog-images`, `ingest-linkedin-analytics`
- Entry point: always `index.ts` inside the function directory
- Shared utilities: `supabase/functions/_shared/<purpose>.ts` — only cross-function logic goes here
- Function-local utilities: `supabase/functions/<fn-name>/utils/<name>.ts`
- NEVER: snake_case function directories, logic in `_shared/` used by only one function

**Frontend Naming:**
- Component files: PascalCase — `ContentApprovalCore.tsx`, `ImageEditorCore.tsx`
- Hook files: camelCase with `use` prefix — `useLinkedInPosts.ts`, `useContentIdeas.ts`
- Utility files: camelCase — `formatDate.ts`, `parseCSV.ts`
- Route components (pages): PascalCase — `Orchestrator.tsx`, `Analytics.tsx`
- CSS/Tailwind: no custom CSS classes — Tailwind utilities only
- NEVER: kebab-case component files, inline styles, `styled-components`

**TypeScript Naming:**
- Variables/functions: camelCase — `carouselParams`, `generateSlides()`
- Types/Interfaces: PascalCase — `CarouselParams`, `SlideContent`
- Constants: SCREAMING_SNAKE_CASE — `MAX_SLIDES`, `DEFAULT_PLATFORM`
- Enums: PascalCase members — `Platform.LinkedIn`, `Platform.Instagram`
- DB row types: use as-is from `integrations/supabase/types.ts` — never hand-write column names

### Structure Patterns

**Project Organization:**
- All E2E/API tests: `playwright/tests/` — never co-located with source
- React hooks: `src/hooks/` — all hooks, no exceptions
- Reusable UI: `src/components/ui/` (shadcn) or `src/components/<domain>/`
- Admin page components: `src/components/admin/<feature>/`
- Page route components: `src/pages/Admin/<PageName>/` or `src/pages/<PageName>.tsx`

**Edge Function Internal Structure:**
```
supabase/functions/<fn-name>/
  index.ts          ← Deno serve entry, request routing only
  handlers/         ← One file per operation (generate.ts, validate.ts)
  utils/            ← Function-local helpers
  types.ts          ← Local TypeScript types
```

**New React Query Hooks:**
- One hook per entity, follow existing pattern in `src/hooks/useLinkedInPosts.ts`
- Always include: `queryKey`, `queryFn`, `enabled` guard, typed return

### Format Patterns

**Edge Function Responses:**
```typescript
// SUCCESS
return new Response(JSON.stringify({ data: result }), {
  headers: { 'Content-Type': 'application/json' },
  status: 200,
})
// ERROR
return new Response(JSON.stringify({ error: message }), {
  headers: { 'Content-Type': 'application/json' },
  status: 400 | 500,
})
```
- NEVER: raw unwrapped data, `{ success: true }` pattern

**Dates:**
- DB: `timestamptz` UTC; API transport: ISO 8601 string `"2026-03-05T14:30:00Z"`
- UI display: `Intl.DateTimeFormat` with `pt-BR` locale
- NEVER: Unix timestamps in API, `toLocaleString()` without locale

**JSON Fields:** DB is snake_case; React state uses Supabase client as-is (snake_case). No manual mapping layers.

### Communication Patterns

**AI Model Calls — mandatory order:**
```typescript
const startTime = Date.now()
const result = await callOpenRouter(model, prompt)  // may throw
await trackCost({ model, tokens: result.usage, durationMs: Date.now() - startTime })
// If cost tracker fails: log error, do NOT fail the main request
```

**Language Enforcement:**
- All content generation system prompts must include: `"Respond ONLY in Brazilian Portuguese (PT-BR)."`
- Applied at system prompt level, not per-message

**Event-Driven (no polling):**
- Use Supabase Realtime channels with `useEffect` cleanup
- Channel names: `<table>-changes-<userId>` (user-scoped) or `<table>-changes` (global)
- NEVER: `setInterval`, `setTimeout` loops, background workers

### Process Patterns

**Error Handling:**
```typescript
// Edge Function
try {
  return new Response(JSON.stringify({ data: result }), { status: 200 })
} catch (err) {
  console.error('[fn-name]', err)
  return new Response(JSON.stringify({ error: err.message }), { status: 500 })
}
// Frontend: surface via sonner toast, never console.error only
// NEVER: silent catch blocks, alert(), window.confirm()
```

**Loading States:**
- Server state: React Query `isLoading`/`isPending` — do not duplicate with local state
- AI generation: always show explicit progress indicator (10-30s operations)
- Skeletons: use shadcn `Skeleton` component

**Image Variants (append-only — enforced everywhere):**
```typescript
// ALWAYS append
.update({ image_variants: supabase.raw('image_variants || ?::jsonb', [newVariant]) })
// NEVER: update({ image_url: newUrl }) on existing slide records
```

**Auth in Edge Functions:**
- All admin functions: `verify_jwt = true` in `config.toml` OR manual bearer verification via `supabase.auth.getUser(token)`
- Admin authorization: check `admin_permissions` or `admin_users` table after JWT validation

### Enforcement Guidelines

**All AI Agents MUST:**
- Read `integrations/supabase/types.ts` before writing DB queries — never hand-write column names
- Call `_shared/cost-tracker` after every OpenRouter call
- Add `"Respond ONLY in Brazilian Portuguese (PT-BR)."` to all content generation system prompts
- Append to `image_variants` — never overwrite `image_url` on existing slides
- Follow existing React Query hook pattern in `src/hooks/useLinkedInPosts.ts`
- Use Tailwind utilities only — no custom CSS, no inline styles

---

## Project Structure & Boundaries

### Complete Project Directory Structure (Brownfield)

```text
lifetrek/
├── src/
│   ├── pages/
│   │   ├── Admin/
│   │   │   ├── ContentOrchestrator.tsx
│   │   │   ├── SocialMediaWorkspace.tsx
│   │   │   ├── ContentApproval.tsx
│   │   │   ├── AdminBlog.tsx
│   │   │   ├── LinkedInAnalytics.tsx
│   │   │   └── UnifiedAnalytics.tsx
│   ├── components/
│   │   ├── admin/
│   │   │   ├── content/
│   │   │   ├── analytics/
│   │   │   └── dashboards/
│   │   └── ui/
│   ├── hooks/
│   │   ├── useLinkedInPosts.ts
│   │   ├── useInstagramPosts.ts
│   │   ├── useBlogPosts.ts
│   │   └── useLinkedInAnalytics.ts
│   ├── integrations/supabase/
│   │   └── types.ts
│   └── lib/
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── _shared/
│       │   └── costTracking.ts
│       ├── generate-linkedin-carousel/
│       │   ├── index.ts
│       │   ├── functions_logic.ts
│       │   ├── topic_playbooks.ts
│       │   └── types.ts
│       ├── generate-blog-post/
│       ├── regenerate-carousel-images/
│       │   ├── handlers/
│       │   ├── generators/
│       │   ├── workflows/
│       │   └── utils/
│       ├── set-slide-background/
│       ├── sync-linkedin-analytics/
│       └── chat/
├── playwright/
│   └── tests/
│       ├── api/
│       └── ui/
└── docs/
```

### Architectural Boundaries

**Frontend boundaries:**
- Routes and access control in `src/pages/*` + `ProtectedAdminRoute`.
- Feature UI composition in `src/components/admin/*`.
- Data fetching and mutation orchestration in `src/hooks/*` using React Query.

**Backend boundaries:**
- All server logic in `supabase/functions/*` (Deno only).
- AI orchestration isolated per function (`generate-linkedin-carousel`, `generate-blog-post`, `regenerate-carousel-images`).
- Cross-function shared logic only in `_shared/*` (cost tracking and shared providers).

**Data boundaries:**
- Content entities (`linkedin_carousels`, `instagram_posts`, `blog_posts`) are canonical.
- Asset retrieval and semantic match via `product_catalog`, `asset_embeddings`, and RPCs.
- Analytics ingestion isolated to dedicated tables/functions (`sync-linkedin-analytics` plus planned `linkedin_analytics` normalized table).

**Security boundaries:**
- Admin routes protected in frontend.
- JWT + admin authorization checks in Edge Functions.
- RLS remains the final data-access gate in Supabase.

### Requirements-to-Structure Mapping

**Content Engine:**
- UI: `/admin/orchestrator`, `/admin/social`, `/admin/content-approval`, `/admin/blog`
- Hooks: `useLinkedInPosts`, `useInstagramPosts`, `useBlogPosts`
- Functions: `generate-linkedin-carousel`, `generate-blog-post`, `chat`, `regenerate-carousel-images`, `set-slide-background`

**LinkedIn Analytics ingestion:**
- UI: `/admin/analytics` and `LinkedInAnalytics` surfaces
- Hook: `useLinkedInAnalytics`
- Function: `sync-linkedin-analytics` (and planned `ingest-linkedin-analytics`)
- Data: analytics tables + normalized ingestion target

**Ideation deep research:**
- UI entry via orchestrator
- Function boundary in strategist stage of `generate-linkedin-carousel`
- Persistence target: `content_ideas` (planned)

### Integration Points

**Internal:**
- Page -> component -> hook -> Supabase client/Edge Function
- React Query invalidation and Realtime updates synchronize UI state

**External:**
- OpenRouter for all text/image generation
- Supabase Storage for media assets and variants

**Cross-cutting enforcement in structure:**
- Cost tracking path: `supabase/functions/_shared/costTracking.ts`
- Template/brand lock path: `supabase/functions/regenerate-carousel-images/*`
- Type authority path: `src/integrations/supabase/types.ts`

## Epic 6 Architecture Extension — Stakeholder Email Approval System (2026-03-10)

### Overview

A second-level approval loop built on top of the existing `admin_approved` status.
Zero new paid infrastructure: uses Resend (free tier: 3,000 emails/month) and
Supabase scheduled functions (cron, free tier). All secure-but-unauthenticated
stakeholder interactions are routed through token-validated public edge functions.

### New Environment Variables (Supabase Dashboard)

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key for email delivery |
| `REVIEW_BASE_URL` | Vercel deployment URL (e.g., `https://lifetrek.vercel.app`) |
| `STAKEHOLDER_EMAIL_1` | `rbianchini@lifetrek-medical.com` |
| `STAKEHOLDER_EMAIL_2` | `njesus@lifetrek-medical.com` |
| `SYSTEM_USER_ID` | UUID used as `created_by` for cron-triggered batches |

### Data Architecture Addition

Three new tables — all snake_case, UUID PKs, RLS-enforced:

| Table | Owner | Purpose |
|---|---|---|
| `stakeholder_review_batches` | admin-write | One record per send event |
| `stakeholder_review_tokens` | admin-write | One token per reviewer per batch |
| `stakeholder_review_items` | admin-write / service-role-read | One record per post per batch |

Content status additions (non-breaking additions to existing CHECK constraints):
- `stakeholder_review_pending` — post sent, awaiting stakeholder response
- `stakeholder_approved` — at least one stakeholder approved
- `stakeholder_rejected` — all reviewers rejected, none approved

### API & Communication Patterns Addition

| Function | Auth | Notes |
|---|---|---|
| `send-stakeholder-review` | JWT + admin | Creates batch, builds HTML email, sends via Resend |
| `stakeholder-review-action` | Token (no JWT) | Public; approve/reject/edit_suggest/fetch actions |
| `weekly-stakeholder-send` | Cron (service role) | Scheduled: Monday 11:00 UTC; invokes send logic |

All three follow the standard edge function structure:
```
supabase/functions/<fn-name>/
  index.ts
  handlers/
  utils/
  types.ts
```

`stakeholder-review-action` returns HTML responses (not JSON) for approve/reject
actions because stakeholders click from email — the browser must show a human-readable
confirmation page, not raw JSON.

`send-stakeholder-review` uses `npm:resend` (Deno npm compatibility) for email delivery.
No AI calls → no `_shared/cost-tracker` required in this function.

### Frontend Architecture Addition

| Route | Access | Component |
|---|---|---|
| `/review/:token` | Public (no auth) | `src/pages/StakeholderReview/StakeholderReviewPage.tsx` |

Added to `src/App.tsx` routes without `ProtectedAdminRoute` wrapper.

Admin changes (no new routes):
- `ContentApprovalCore.tsx`: new status filter tabs, stakeholder status badge,
  copy-edit suggestion diff + apply/dismiss, floating multi-select action bar
- `SendReviewModal.tsx`: new component in `src/components/admin/content/`
- `useStakeholderReview.ts`: new hook in `src/hooks/`

### Approval State Machine

```
admin_approved
    ↓ [Rafael clicks Send / cron fires]
stakeholder_review_pending
    ↓ [any reviewer approves]          ↓ [all reviewers reject, none approved]
stakeholder_approved              stakeholder_rejected
    ↓ [Rafael publishes]
published
```

Rule enforcement: state transitions only via `stakeholder-review-action` and
`send-stakeholder-review`. Content table direct writes are blocked by RLS for
these status values — only service-role (used in edge functions) can set them.

### Cron Schedule

Registered in Supabase dashboard under Project → Edge Functions → Schedule:
- Function: `weekly-stakeholder-send`
- Schedule: `0 11 * * 1` (every Monday at 11:00 UTC)
- No new infra — Supabase cron is available on the free tier

### NFR Compliance

| NFR | Compliance |
|---|---|
| Zero infra cost | Resend free tier (3,000/mo), Supabase cron free, no new servers |
| No polling | Token validation is stateless; review page uses React Query one-shot fetch |
| PT-BR | Email template and review page copy fully in PT-BR |
| Security | Token UUID + expiry; service-role only for internal DB writes; no JWT exposed |
| Event-driven | Status updates trigger Supabase Realtime → admin sees updates live |

---

## Smart Regen Architecture Update (Implemented 2026-03-05)

### Scope Completed

1. Smart background selection in `regenerate-carousel-images` (`mode=smart`) with:
   - intent classification (`company_trust`, `quality_machines_metrology`, `cleanroom_iso`, `vet_odonto_product`, `generic`)
   - score model `cosine + keyword_boost + curated_boost` and per-intent thresholds
   - anti-repetition across recent slides
   - fallback to AI when below threshold and `allow_ai_fallback=true`

2. Manual override in `set-slide-background` with:
   - deterministic single-slide update
   - append-only variant history (`image_variants`, `prev_image_urls`)
   - synchronization of `slides[n].image_url` and `image_urls[n]`

3. Auth hardening for both functions:
   - function-level manual bearer verification (`supabase.auth.getUser(token)`)
   - admin authorization checks (`admin_permissions`, `admin_users`, optional `user_roles`)
   - compatible with `verify_jwt=false` deployment mode

4. UI resilience in `ImageEditorCore`:
   - local smart fallback when edge auth/gateway path fails
   - preserves manual flow continuity for Design tab users

### Operational Result (Verified)

- Target post: `instagram_posts.a31da9e2-367c-4c22-ba81-af7831d25976`
- Slide 0 (`"Um Parceiro. Solucao Completa."`) regenerated in smart mode using real asset selection:
  - `asset_source = rule_override`
  - `selection_score = 0.81`
  - selected asset intent-aligned with company-trust pool (`clean-room-exterior.jpg`)
- Manual override via UI (`Trocar Fundo`) persisted successfully:
  - `asset_source = manual`
  - `image_urls[0]` and `slides[0].image_url` updated
  - variant history preserved

### Known Runtime Constraint

- Embedding provider call may fail in some environments (`openrouter embeddings 401`).
- Mitigation implemented: lexical + curated + intent-pool scoring keeps smart selection usable without hard dependency on live embeddings.

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All decisions are compatible. TypeScript strict throughout; Deno in Edge Functions shares the same type discipline. OpenRouter unifies all AI calls under a single key and billing surface. React Query + Supabase Realtime covers all state patterns without introducing new libraries. No contradictory decisions found.

**Pattern Consistency:** Naming conventions (snake_case DB, kebab-case functions, PascalCase components) extend existing codebase patterns without exception. Communication patterns (append-only image_variants, cost-tracker ordering, PT-BR enforcement) are consistent and non-overlapping.

**Structure Alignment:** Step 6 is now explicitly documented in this file with concrete project boundaries and requirement-to-structure mappings. Brownfield directory structure and new feature extension points are aligned.

### Requirements Coverage Validation ✅

| Requirement | Architecture Support |
|---|---|
| LinkedIn carousel generation | `generate-linkedin-carousel` + `platform` param ✓ |
| Instagram posts | Shared pipeline, platform-specific copywriter prompt ✓ |
| Blog post generation (PT-BR) | `generate-blog-post` + hero image via Nano Banana ✓ |
| Blog approval flow | `status='approved'` → DB trigger → `is_published=true` ✓ |
| Ideation deep research | `researchLevel: 'deep'` on Strategist via OpenRouter ✓ |
| LinkedIn CSV analytics ingestion | `ingest-linkedin-analytics` + `linkedin_analytics` table ✓ |
| Chat/NL entry mode | Wire existing non-functional chat mode in `/admin/orchestrator` ✓ |
| Form entry mode | Existing `/admin/orchestrator` form — no changes needed ✓ |
| 4 locked visual templates | Satori compositor is single brand control point ✓ |
| Non-technical primary user | Progressive UI, safe defaults, no dev-needed error paths ✓ |
| Zero infra cost | Vercel free + Supabase free — no new paid services ✓ |
| No polling | Event-driven only (Realtime/Webhooks) enforced in patterns ✓ |
| Cost guardrails | `_shared/cost-tracker` mandatory on every AI call ✓ |
| PT-BR output | Architecture-level rule — all content prompts must enforce ✓ |
| Image versioning | Append-only `image_variants` rule enforced at pattern level ✓ |
| Brownfield safety | Reuse existing hooks, no breaking changes documented ✓ |

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with model IDs and versions. 6-step implementation sequence defined with cross-component dependencies mapped.

**Structure Completeness:** Brownfield structure is fully documented (Step 6) and aligned with current repo layout. New tables have full schema proposals and function ownership boundaries.

**Pattern Completeness:** 7 conflict areas addressed. Naming, structure, format, communication, and process patterns all specified with concrete examples and anti-patterns.

### Gap Analysis Results

| Gap | Priority | Resolution |
|---|---|---|
| Chat mode wiring specifics | Important | Story-level spec in epics phase |
| `blog_posts.status` field alignment | Important | Verify schema before writing migration story |
| Batch blog hero backfill rollback | Nice-to-have | Story should include dry-run step for 24 posts |

### Architecture Completeness Checklist

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] NFRs architecturally addressed
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented
- [x] Implementation sequence defined
- [x] Project structure detail (Step 6)

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level:** High — all must-have requirements covered, no critical gaps, patterns are specific and enforceable.

**Key Strengths:**
- Single AI gateway (OpenRouter) simplifies cost tracking and key management
- Append-only image variants prevents data loss across all platforms
- PT-BR and cost-tracking enforced at architecture level, not left to individual stories
- Brownfield approach preserves 170+ working components

**Areas for Future Enhancement:**
- LinkedIn analytics ML/learning layer (deferred post-MVP)
- Automated pattern compliance checks (linting rules)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Read `integrations/supabase/types.ts` before any DB work
- Use implementation patterns consistently — refer to Step 5 for all naming and process questions
- Refer to implementation sequence (Step 4) for story ordering

**First Implementation Priority:** DB migrations — `content_ideas`, `linkedin_analytics`, `blog_posts` hero field

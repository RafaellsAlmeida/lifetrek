# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeTrek is an internal admin dashboard and public website for a medical device manufacturing company. It's built with React/TypeScript and uses Supabase as the backend. The main purpose is content management, lead tracking, and marketing automation for LinkedIn outreach.

## Commands

### Development
```bash
npm run dev          # Starts both web (Vite) and agent-service (Python/FastAPI)
npm run dev:web      # Vite dev server only
npm run dev:agent    # Python agent service only (port 8000)
npm run build        # Production build
npm run lint         # ESLint
```

### Testing
```bash
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright with UI
npm run test:api         # API tests only (playwright/tests/api)
```

Test environment is controlled via `TEST_ENV` env var: `local`, `staging`, or `production`.

### Supabase Edge Functions
```bash
supabase functions deploy <function-name>  # Deploy specific function
supabase functions serve                    # Local development
```

Key functions: `admin-support-agent`, `generate-linkedin-carousel`, `generate-blog-post`, `send-weekly-report`

## Architecture

### Frontend Structure (`src/`)
- **pages/**: Route components. Public pages (Home, About, Products, Blog) and Admin pages (`pages/Admin/`)
- **components/**: Reusable UI components. Uses shadcn/ui from `components/ui/`
- **hooks/**: React Query hooks for data fetching (`useBlogPosts`, `useLinkedInPosts`, `useAdminPermissions`)
- **contexts/**: Global state (`LanguageContext`, `ImpersonationContext`)
- **integrations/supabase/**: Auto-generated Supabase client and types

### Backend Structure (`supabase/`)
- **functions/**: Deno-based Edge Functions
- **migrations/**: SQL migrations
- **functions/_shared/**: Shared utilities (cost tracking, Google Drive integration)

### Key Patterns
- Lazy loading for route components via `React.lazy()`
- Protected admin routes via `ProtectedAdminRoute` component
- Admin layout wraps all `/admin/*` routes with sidebar navigation
- AI chatbot (`AIChatbot.tsx`) available on public pages for admin users

### Data Flow
1. Frontend uses React Query hooks to fetch from Supabase
2. Edge Functions handle AI operations (LLM calls, carousel generation)
3. Storage buckets for assets: product images, carousel slides, blog images

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` - Public API key

Edge Functions require (set in Supabase dashboard):
- `LOVABLE_API_KEY` - For AI features
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations

## Key Features

### Admin Dashboard (`/admin/*`)
- **Orchestrator**: Content generation workflow
- **Content Approval**: Review AI-generated content
- **Leads**: CRM for sales leads with scoring
- **Blog**: Manage blog posts
- **Analytics**: LinkedIn performance metrics
- **Video Studio**: Video content creation

### LinkedIn Carousel Generation
The carousel system uses a multi-agent approach:
1. Strategist agent consults knowledge base (RAG)
2. Copywriter refines content
3. Designer generates images (1080x1080)

See `TESTING_GUIDE.md` for manual testing procedures.

## Brand Identity

**Always follow brand guidelines when creating UI or content.**

Key references:
- `docs/brand/BRAND_BOOK.md` - Complete brand guidelines (colors, typography, voice)
- `docs/brand/BRAND_QUICK_REFERENCE.md` - Quick reference for developers
- `docs/brand/COMPANY_CONTEXT.md` - Company background and positioning

### Brand Colors (use CSS variables)
```css
bg-primary              /* Corporate Blue #004F8F */
bg-accent               /* Innovation Green #1A7A3E */
bg-accent-orange        /* Energy Orange #F07818 */
```

### Brand Voice
- Professional, technical, engineer-to-engineer tone
- Partnership language ("together", "collaborate")
- Avoid marketing clichés and casual language

## UI Testing & Visual Verification

### Manual Testing Workflow
1. Start dev server: `npm run dev:web`
2. Login at `localhost:8080/admin/login` (credentials in AGENTS.md: rafacrvg@icloud.com / Lifetrek2026)
3. Take screenshots to verify UI changes
4. See `TESTING_GUIDE.md` for detailed test cases

### Playwright E2E Tests
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # Interactive UI mode
TEST_ENV=staging npm run test:e2e   # Against staging
```

Screenshots captured on failure: `test-results/` directory

### Verification Scripts
Located in `scripts/`:
```bash
deno run --allow-all scripts/verify_login.ts        # Verify auth flow
deno run --allow-all scripts/verify_rpc.ts          # Verify Supabase RPCs
deno run --allow-all scripts/utils/verify_storage_assets.ts  # Check storage
```

## Content Generation Skills

### Social Content Orchestrator
Generate LinkedIn/Instagram content using multi-agent workflow:
```bash
deno run --allow-net --allow-read --allow-env scripts/generate_social_agent.ts "Your Topic"
```
See `skills/social_agent/SKILL.md` for details.

### LinkedIn Carousel via Admin UI
1. Navigate to `/admin/orchestrator`
2. Fill in topic, audience, pain points
3. Select "Value Post" or "Commercial Post"
4. Enable image generation (optional, slower)

### Blog Post Generation
Uses `generate-blog-post` Edge Function. Triggered from `/admin/blog`.

## Useful Scripts

| Script | Purpose |
|--------|---------|
| `scripts/generate_social_agent.ts` | CLI social content generation |
| `scripts/batch-generate-carousels.ts` | Bulk carousel generation |
| `scripts/ingest_assets.ts` | Import assets to storage |
| `scripts/ingest_knowledge.ts` | Populate knowledge base |
| `scripts/verify_login.ts` | Test authentication flow |

## supabase-js Submodule

The `supabase-js/` directory contains a local copy of the Supabase JS SDK monorepo. See `supabase-js/CLAUDE.md` for its specific documentation. When working there, use Nx commands from that directory.

## Security Warnings

**NEVER expose or commit these keys:**
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- `UNIPILE_DSN` / `UNIPILE_API_KEY` - LinkedIn automation (rate limits are strict, can ban accounts)
- `LOVABLE_API_KEY`, `OPENROUTER_API_KEY` - AI API keys

**Unipile**: Do NOT run automated LinkedIn outreach scripts without explicit approval. Use Admin UI only.

## Deprecated

- Direct Unipile scripts in `execution/` - Use Admin UI instead
- Old automation governor system was removed - do not recreate

## BMAD Workflow (Project Management)

This project uses **BMAD v6** for structured AI-assisted development.

### Status
- **Phase 1 (Analysis):** Complete — project docs in `docs/`
- **Phase 2 (Planning):** Complete — PRD at `docs/product/LIFETREK_PRD.md`
- **Phase 3 (Solutioning):** In progress — Architecture, Epics/Stories, Readiness Check
- **Phase 4 (Implementation):** Not started

### Key Artifacts
| Artifact | Location |
|----------|----------|
| Project Context (AI rules) | `_bmad-output/project-context.md` |
| PRD | `docs/product/LIFETREK_PRD.md` |
| Architecture *(pending)* | `_bmad-output/planning-artifacts/architecture.md` |
| Epics & Stories *(pending)* | `_bmad-output/planning-artifacts/epics.md` |
| Sprint Status *(pending)* | `_bmad-output/implementation-artifacts/sprint-status.yaml` |

### BMAD Commands (run in fresh context windows)
```
/bmad-bmm-create-architecture       # Phase 3 — next required step
/bmad-bmm-create-epics-and-stories  # Phase 3 — after architecture
/bmad-bmm-check-implementation-readiness  # Phase 3 — final gate
/bmad-bmm-sprint-planning           # Phase 4 — starts implementation
/bmad-bmm-dev-story                 # Phase 4 — story-by-story dev loop
```

### Focus Domain
The primary development focus is the **Content Generation System**:
ideation → generation → editing → visualization (LinkedIn carousels, blog posts).
See `docs/content-engine-guide.md` for current pipeline architecture.

### Cost Guardrails
Previous iteration burned $1000+ in API credits. All AI calls must respect:
- Per-request cost tracking (existing `_shared/` utilities)
- No unbounded loops or bulk regeneration without explicit user trigger
- Prefer Gemini Flash over Pro for non-image tasks

## Notes

- **See `AGENTS.md` for test credentials and verification workflow**
- Always screenshot UI changes for verification before considering work done
- The app uses shadcn/ui components (`src/components/ui/`) and custom components
- Onboarding docs: `docs/ONBOARDING.md`
- Get Supabase env vars from `.env` or `.env.backup`

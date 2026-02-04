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

## supabase-js Submodule

The `supabase-js/` directory contains a local copy of the Supabase JS SDK monorepo. See `supabase-js/CLAUDE.md` for its specific documentation. When working there, use Nx commands from that directory.

## Notes

- Login for testing: `/admin/login` with test credentials from AGENTS.md
- Brand guidelines are in `brandbook.md` - follow when creating UI
- The app uses both shadcn/ui components and custom components

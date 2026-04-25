# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Lifetrek is an internal operations platform for a medical device manufacturing company. The repository supports approval workflows, technical blogging, CRM, analytics, technical drawing, and controlled social-content support.

Do not frame the product primarily as an image editor or video editor. Those capabilities may still exist in code or support workflows, but they are not the main product story.

## Documentation Routing

Use documentation in this order:

1. `docs/bmad-standard-documentation.md`
2. `_bmad-output/project-context.md`
3. Relevant `_bmad-output/planning-artifacts/*.md`
4. The active story in `_bmad-output/implementation-artifacts/stories/`
5. Supporting technical docs under `docs/`
6. `docs/bmad-standard-documentation-pt.md` and `docs/sectors/*.md` only for stakeholder-facing or shareable Portuguese output

Canonical BMAD planning remains under `_bmad-output/`. The Portuguese BMAD standard is stakeholder-facing, not the primary entrypoint for agents.

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
npm run test:api         # API tests only
```

### Supabase Edge Functions
```bash
supabase functions deploy <function-name>
supabase functions serve
```

## Architecture

### Frontend Structure (`src/`)
- `pages/`: route components, including admin pages under `pages/Admin/`
- `components/`: reusable UI, including shadcn/ui
- `hooks/`: React Query hooks and feature hooks
- `contexts/`: shared app state
- `integrations/supabase/`: generated Supabase client and types

### Backend Structure (`supabase/`)
- `functions/`: Deno-based Edge Functions
- `migrations/`: SQL migrations
- `functions/_shared/`: shared utilities

### Key Patterns
- lazy-loaded routes with `React.lazy()`
- protected admin routes via `ProtectedAdminRoute`
- admin layout wrapping `/admin/*`
- Supabase-backed CRUD and workflow operations

## Current Product Areas

### Approval
- `/admin/content-approval`
- `/review/:token`

### Blog
- `/admin/blog`

### CRM
- `/admin/leads`

### Analytics
- `/admin/analytics`

### Technical Drawing
- `/admin/desenho-tecnico`

### Social Support
- `/admin/orchestrator`
- `/admin/social`

## Brand Identity

Always follow:

- `docs/brand/BRAND_BOOK.md`
- `docs/brand/BRAND_QUICK_REFERENCE.md`
- `docs/brand/COMPANY_CONTEXT.md`

Brand voice:

- professional, technical, engineer-to-engineer
- partnership language where appropriate
- avoid marketing cliches

## Testing and Verification

### Manual Workflow
1. Start dev server: `npm run dev:web`
2. Login at `localhost:8080/admin/login`
3. Verify the changed route or workflow
4. Capture screenshots for UI changes

Use credentials from `AGENTS.md`.

### Notes
- For documentation-only changes, structural verification is acceptable: file existence, link cleanup, and diff validation.
- For feature work, prefer validating the real admin route and related Supabase behavior.

## Security

Never expose or commit:

- `SUPABASE_SERVICE_ROLE_KEY`
- `UNIPILE_DSN`
- `UNIPILE_API_KEY`
- `LOVABLE_API_KEY`
- `OPENROUTER_API_KEY`

Rules:

- do not run automated LinkedIn outreach without explicit approval;
- use the admin UI for LinkedIn-related operations when possible;
- never overwrite existing carousel images; always create new variants.

## BMAD Workflow

Use these BMAD artifacts as the canonical internal planning source:

- `docs/bmad-standard-documentation.md`
- `_bmad-output/project-context.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

Stakeholder-facing Portuguese references:

- `docs/bmad-standard-documentation-pt.md`
- `docs/sectors/`

## supabase-js Submodule

The `supabase-js/` directory contains a local copy of the Supabase JS SDK monorepo. When working there, use `supabase-js/CLAUDE.md`.

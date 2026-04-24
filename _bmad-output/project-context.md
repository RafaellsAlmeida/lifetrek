---
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-04-23'
sections_completed:
  [
    'technology_stack',
    'product_priorities',
    'route_map',
    'documentation_rules',
    'testing_rules',
    'quality_rules',
    'anti_patterns',
  ]
status: 'complete'
rule_count: 24
optimized_for_llm: true
---

# Project Context for AI Agents

This file contains the current implementation and documentation context for Lifetrek. It replaces the older visual-first framing and should be treated as the canonical AI working context until superseded.

## 1. Product Priorities

The current product is an internal operations platform for Lifetrek Medical. Work should be framed in this order:

1. Stakeholder email approval and publishing workflow.
2. Blog generator/editor with SEO and editorial controls.
3. CRM and lead pipeline operations.
4. Analytics and reporting.
5. Technical drawing.
6. Social content generation and visual support.

Image editing and video editing are not strategic product pillars. Visual generation remains useful as support for content, branding, and approved templates, but should not be treated as the center of the platform.

## 2. Technology Stack & Versions

- **Core:** React 18.3.1, TypeScript 5.8.3, Vite 5.4.19 (ESM).
- **Styling:** Tailwind CSS 3.4.17, PostCSS, Autoprefixer.
- **UI Components:** Radix UI primitives, Shadcn UI, Framer Motion.
- **Backend:** Supabase (`@supabase/supabase-js` 2.94.1) for Auth, Database, Storage, Realtime.
- **Edge Functions:** Deno-based Supabase Edge Functions.
- **State/Data Fetching:** TanStack React Query 5.83.0.
- **Forms/Validation:** React Hook Form 7.61.1, Zod 3.24.1.
- **Graphics/Visualization:** Three.js, Recharts, Konva, Mermaid.
- **Technical Drawing/CAD:** OpenCascade.js/WebAssembly.
- **Testing:** Playwright 1.57.0 (E2E and API), Seon Playwright Utils.
- **Utilities:** `date-fns`, `lucide-react`, `sonner`.

Remotion and older video-related assets may still exist in the repository. Treat them as legacy or supporting assets unless the user explicitly asks to work on them.

## 3. Route Map

### Public

- `/blog`
- `/blog/:slug`
- `/review/:token`

### Admin

- `/admin/orchestrator`
- `/admin/content-approval`
- `/admin/blog`
- `/admin/leads`
- `/admin/analytics`
- `/admin/social`
- `/admin/image-editor` (legacy/support)
- `/admin/desenho-tecnico`

## 4. Critical Implementation Rules

### 4.1 Brownfield First

- This is a brownfield project. Match existing patterns before inventing new ones.
- Reuse hooks in `src/hooks/` whenever possible.
- Prefer extending current Supabase functions and typed data models over introducing parallel abstractions.

### 4.2 Backend Locality

- All server-side logic resides in Supabase Edge Functions.
- Do not introduce new backend frameworks, workers, or servers.
- Stay compatible with free-tier Supabase + Vercel constraints.

### 4.3 Content and Language

- Default user-facing admin text should be PT-BR unless the feature explicitly targets another language.
- Blog and content generation should keep a technical, engineer-to-engineer tone.
- Avoid marketing clichés and avoid exposing internal system language in user-facing content.

### 4.4 Visual Scope

- Social visuals must follow approved Lifetrek templates.
- Prioritize real Lifetrek assets before AI fallback.
- Never treat image/video editing as the product’s primary promise.
- Always preserve image history through append-only variants.

### 4.5 Approval and Publication

- Approval is a first-class system, not an afterthought.
- Stakeholder review links must remain token-scoped and expiring.
- Sensitive write operations must stay behind authenticated admin access.
- Status transitions must stay traceable and auditable.

### 4.6 Technical Drawing

- Technical drawing is an operational system, not just a visual demo.
- Do not bypass human review gates when ambiguity exists.
- STEP, 2D, A3, and validation outputs are technical artifacts and must be described and handled as such.

## 5. Data and Security Rules

- Use `src/integrations/supabase/types.ts` as the application-level schema truth.
- Prefer RLS-protected tables and Edge Functions for privileged actions.
- Never expose or commit service-role or third-party automation secrets.
- Use append-only image versioning; never overwrite historical carousel images.

## 6. Documentation Rules

### Canonical Layers

1. `_bmad-output/project-context.md`
2. `_bmad-output/planning-artifacts/*.md`
3. `docs/bmad-standard-documentation-pt.md`
4. `docs/sectors/*.md`
5. specialized operational docs under `docs/`

### Documentation Shape

- Keep one master standard document for the whole product.
- Keep separate sector docs for Approval, Blog, CRM, Analytics, Technical Drawing, and Social Support.
- Old visual-first or video-first docs should be explicitly marked as support, legacy, or archived.

## 7. Testing Rules

- Verify changed behavior before considering work done.
- For documentation-only changes, run structural verification such as link/file checks, diff validation, and consistency checks.
- For feature changes, prefer the actual admin routes and flows over isolated mock validation.
- When testing UI flows, prioritize:
  - `/admin/content-approval`
  - `/review/:token`
  - `/admin/blog`
  - `/admin/leads`
  - `/admin/analytics`
  - `/admin/desenho-tecnico`
  - `/admin/social`

## 8. Anti-Patterns

Avoid these unless explicitly requested:

- Reframing Lifetrek as an image editor or video editor.
- Introducing new paid infrastructure for routine workflows.
- Replacing established Supabase patterns with unrelated server approaches.
- Documenting outdated routes or credentials in shareable team docs.
- Treating old March 2026 planning artifacts as current without checking current code and docs.

Last Updated: 2026-04-23

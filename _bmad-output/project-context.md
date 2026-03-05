---
project_name: 'lifetrek'
user_name: 'Rafaelalmeida'
date: '2026-03-04'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 18
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Core:** React 18.3.1, TypeScript 5.8.3, Vite 5.4.19 (ESM).
- **Styling:** Tailwind CSS 3.4.17, PostCSS, Autosuffixer.
- **UI Components:** Radix UI primitives, Shadcn UI (installed in `src/components/ui`), Framer Motion 12. Follow @brandbook.md for more information.
- **Backend/Integrations:**
  - **Supabase:** `@supabase/supabase-js` 2.94.1 (Auth, Database, Storage).
  - **Edge Functions:** Deno-based Supabase Edge Functions.
- **Video/Graphics:** Remotion 4.0.407, Three.js 0.170.0, Konva, Mermaid.
- **Data Fetching:** TanStack React Query 5.83.0.
- **Form Handling:** React Hook Form 7.61.1, Zod 3.24.1.
- **Testing:** Playwright 1.57.0 (API and E2E), Seon Playwright Utils.
- **Utilities:** `date-fns`, `lucide-react`, `sonner`, `recharts`.

## Critical Implementation Rules

### 1. Code Style & Naming

- **Components:** Create components in `src/components/` using **kebab-case** (e.g., `content-card.tsx`).
- **Pages:** Create pages in `src/pages/` using **PascalCase** (e.g., `BlogPost.tsx`).
- **Path Aliases:** Always use the `@/` alias to refer to the `src/` directory.
- **Classes:** Use the `cn()` utility from `@/lib/utils` for conditional tailwind classes.

### 2. UI/UX & Strategic Constraints

- **Strategic Constraints**: Never create architectures in the future that will require cloud credits, different servers, or paid services. No frontend changes without permission. We use FREE supabase, FREE Vercel, and spend just a little for image generation with Nano Banana Pro when needed. Text LLM models should be cheap/free. Don't mess with our website.
- **Content Orchestration**: Social content generation MUST follow the Strategist -> Copywriter -> Designer -> Compositor pipeline. Output text in Portuguese (PT-BR), clean text format.
- **Visual Branding (Satori-Locked)**: AI models should generate CLEAN backgrounds (no text/logos). All brand elements (Logo, ISO badges, headlines) must be added programmatically via Satori to ensure brand fidelity.
- **Asset Retrieval (RAG)**: Prioritize real assets from `product_catalog` (metrology, cleanrooms, equipment) using semantic search before falling back to AI generation. We have our assets both locally and in supabase storage.
- **Data Models**: Refer to `src/integrations/supabase/types.ts` for truth. AI logic resides in Supabase Edge Functions.
- **Brownfield Development**: Maintain consistency with existing architecture. If a feature exists in `src/hooks`, reuse or wrap it.
- **Backend Locality:** All server-side logic resides in **Supabase Edge Functions** (Deno). Do not introduce other backend frameworks.
- **Default Language:** Content Orchestrator and user-facing text must be in **Portuguese (PT-BR)**. Output must be clean text (no markdown) unless specified.

### 3. Brownfield Development

- **Consistency First:** This is a **brownfield** project. AI agents must prioritize matching existing patterns and architecture over introducing "cleaner" or different alternatives unless explicitly asked.
- **Pattern Retrieval:** Before implementing, search `docs/source-tree-analysis.md` and `docs/index.md` to find similar existing implementations.
- **Impact Analysis:** Changes to core hooks or shared utilities must consider the 33+ existing pages and 170+ components.

### 4. Search & Discovery

- **Knowledge Base:** Use the `product_catalog` or `knowledge_base` tables for vector searches via Supabase.
- **Match Functions:** Utilize RPCs like `match_product_assets` for similarity search.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update when technology stack changes.
- Review quarterly for outdated rules.

Last Updated: 2026-03-04

# Project Overview: Lifetrek

## Executive Summary

Lifetrek is an internal platform that supports Lifetrek Medical's technical commercial operation. The application brings content generation and approval, technical blogging, lead CRM, analytics, and technical drawing into a single admin environment.

Older documentation framed the product with too much emphasis on in-app image and video editing. That is no longer the right product story. Visual capabilities still exist as support for content and brand consistency, but the current focus is operations, approval, technical content, commercial intelligence, and technical documentation.

Current internal reference: [BMAD Standard Documentation - Lifetrek](./bmad-standard-documentation.md).
Current stakeholder-facing reference: [Documentação Padrão BMAD - Lifetrek PT-BR](./bmad-standard-documentation-pt.md).

## Core Information

- **Type:** monolithic React SPA
- **Primary language:** TypeScript
- **Architecture:** component-based frontend with Supabase Backend-as-a-Service
- **Status:** active development with Vite/React 18
- **Domain:** `lifetrek-medical.com`

## Technical Stack

| Category | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS |
| UI | Shadcn UI, Radix UI, Framer Motion |
| Backend | Supabase Auth, Postgres, Storage |
| Compute | Supabase Edge Functions (Deno) |
| State | TanStack Query and dedicated hooks |
| Testing | Playwright |
| Graphics and visualization | Three.js, Recharts, Konva |
| Technical CAD | OpenCascade.js/WebAssembly |

Remotion and video-related flows may still exist in the repository as legacy or support assets, but they should not be presented as the current strategic product priority.

## Primary User Groups

1. **Technical sales representatives:** track leads, content, and opportunities.
2. **Marketing/content operators:** create, edit, and approve materials.
3. **Lifetrek stakeholders:** review content via email and public review pages.
4. **Engineering/technical operators:** use the technical drawing workflow.
5. **Administrators:** manage access, data, and integrations.

## Main Admin Areas

- `/admin/orchestrator`: content orchestration
- `/admin/content-approval`: internal approval and stakeholder sends
- `/admin/blog`: blog generator/editor
- `/admin/leads`: lead CRM
- `/admin/analytics`: unified analytics
- `/admin/desenho-tecnico`: technical drawing
- `/admin/social`: social workspace and visual support
- `/review/:token`: public approval page

## Current Capabilities

### Email Approval

The system sends content batches to stakeholders by email through secure public links. Reviewers can approve, reject, or suggest edits without accessing the admin panel.

Relevant files:

- `src/components/admin/content/SendReviewModal.tsx`
- `supabase/functions/send-stakeholder-review/index.ts`
- `supabase/functions/stakeholder-review-action/index.ts`
- `supabase/functions/_shared/stakeholderReviewEmail.ts`

### Technical Blog

The blog combines assisted generation, editing, SEO, approval, and publication. The editor manages ICP, pillar keyword, entity keywords, CTA, summary, SEO title, and SEO description.

Relevant files:

- `src/pages/Admin/AdminBlog.tsx`
- `src/hooks/useBlogPosts.ts`
- `src/types/blog.ts`
- `supabase/functions/generate-blog-post/index.ts`

### CRM

The CRM manages leads by status, priority, source, and company. It includes CSV import/export, realtime updates, and a pipeline view.

Relevant files:

- `src/pages/AdminLeads.tsx`
- `src/components/admin/LeadsCRMBoard.tsx`
- `src/components/admin/LeadsSpreadsheet.tsx`
- `supabase/functions/import-leads/index.ts`

### Analytics

Unified analytics consolidates website, LinkedIn content, leads, and monthly reporting. LinkedIn import accepts CSV/XLS/XLSX and normalizes metrics for admin reporting.

Relevant files:

- `src/pages/Admin/UnifiedAnalytics.tsx`
- `src/components/admin/analytics/LinkedInCsvUploadPanel.tsx`
- `src/components/admin/analytics/ImportedAnalyticsSummary.tsx`
- `supabase/functions/ingest-linkedin-analytics/index.ts`

### Technical Drawing

The technical drawing flow allows users to move from sketch or reference input to a normalized document, validation, 2D drawing, A3 sheet, 3D preview, and STEP export.

Relevant files:

- `src/components/admin/engineering/TechnicalDrawingCore.tsx`
- `src/components/admin/engineering/EngineeringDrawing3DPreview.tsx`
- `src/lib/engineering-drawing/renderStep.ts`
- `src/lib/engineering-drawing/svg-renderer.ts`
- `supabase/functions/engineering-drawing/index.ts`

### Content and Visual Support

The social workspace and orchestrator remain relevant for content creation and review. Visual resources must follow approved templates, use real Lifetrek photos, and preserve variant history. They are not the center of the product.

## BMAD Documentation

For the current cycle, `_bmad-output/` remains the canonical source for planning and implementation. `docs/` serves as navigation and operational documentation.

- [Project Context AI Rules](../_bmad-output/project-context.md)
- [BMAD PRD](../_bmad-output/planning-artifacts/prd.md)
- [BMAD Architecture](../_bmad-output/planning-artifacts/architecture.md)
- [BMAD UX Design Specification](../_bmad-output/planning-artifacts/ux-design-specification.md)
- [BMAD Epics](../_bmad-output/planning-artifacts/epics.md)
- [BMAD Sprint Status](../_bmad-output/implementation-artifacts/sprint-status.yaml)
- [BMAD Standard Documentation - Lifetrek](./bmad-standard-documentation.md)
- [Documentação Padrão BMAD - PT-BR](./bmad-standard-documentation-pt.md)

## Stakeholder-Facing Sector Docs

- [Aprovação e Publicação](./sectors/approval-and-publishing.md)
- [Blog e Editorial](./sectors/blog-and-editorial.md)
- [CRM e Leads](./sectors/crm-and-leads.md)
- [Analytics e Relatórios](./sectors/analytics-and-reporting.md)
- [Desenho Técnico](./sectors/technical-drawing.md)
- [Suporte Social e Governança Visual](./sectors/social-content-support.md)

## Admin Access

Use the test credentials documented in the internal project guide. Do not replicate passwords in shareable documentation outside the repository.

## Current Priority Order

1. Consolidate email approval as a reliable workflow.
2. Improve blog generator/editor quality and technical SEO.
3. Strengthen CRM and analytics as decision systems.
4. Polish technical drawing as an operational differentiator.
5. Keep visual generation as controlled support, not as the central product promise.

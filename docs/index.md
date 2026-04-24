# Lifetrek Documentation Index

Welcome to the Lifetrek project documentation. This index serves as the primary navigation for both developers and AI agents.

**Current standard reference:** [BMAD Standard Documentation - Lifetrek PT-BR](./bmad-standard-documentation-pt.md)

The Portuguese BMAD standard is the recommended shareable reference for the Lifetrek team. It updates the old image/video-editing positioning and refocuses the product around stakeholder email approval, blog generation/editing, CRM, analytics, technical drawing, and controlled content workflows.

## Quick Reference

- **Tech Stack:** React 18, Vite, Tailwind, Supabase.
- **Primary Routes:** Check `src/pages/` for all available views.
- **Backend:** 38 Edge Functions and 120 Database Migrations.

## Core Documentation

- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [BMAD Standard Documentation - PT-BR](./bmad-standard-documentation-pt.md)
- [Content Engine Guide](./content-engine-guide.md)
- [Sector Documentation](./sectors/README.md)
- [Smart Regen Architecture](./architecture/SMART_REGEN_ARCHITECTURE.md)
- [LinkedIn SGLang Prefill Playbook](./content/LINKEDIN_SGLANG_PREFILL_PLAYBOOK.md)
- [Source Tree Analysis](./source-tree-analysis.md) - Annotated directory structure.
- [**Project Context (AI Rules)**](../_bmad-output/project-context.md) - Critical implementation rules for AI.

## Sector Documentation

- [Approval and Publishing](./sectors/approval-and-publishing.md)
- [Blog and Editorial](./sectors/blog-and-editorial.md)
- [CRM and Leads](./sectors/crm-and-leads.md)
- [Analytics and Reporting](./sectors/analytics-and-reporting.md)
- [Technical Drawing](./sectors/technical-drawing.md)
- [Social Content Support](./sectors/social-content-support.md)

## Canonical BMAD Artifacts (2026 Operations Platform Track)

_bmad-output is the canonical planning/implementation source for the current cycle._

- [PRD](../_bmad-output/planning-artifacts/prd.md)
- [Architecture](../_bmad-output/planning-artifacts/architecture.md)
- [UX Design Specification](../_bmad-output/planning-artifacts/ux-design-specification.md)
- [Epics and Stories](../_bmad-output/planning-artifacts/epics.md)
- [Sprint Status](../_bmad-output/implementation-artifacts/sprint-status.yaml)
- [Sprint 1 Story Files](../_bmad-output/implementation-artifacts/stories/)
- [PRD Validation Report](../_bmad-output/planning-artifacts/prd-validation-report-2026-03-05.md)
- [Implementation Readiness Report](../_bmad-output/planning-artifacts/implementation-readiness-report-2026-03-05.md)
- [Implementation Delta Report](../_bmad-output/planning-artifacts/implementation-delta-report-2026-03-05.md)
- [Orchestrator Architecture Research](../_bmad-output/planning-artifacts/orchestrator-architecture-research-2026-03-06.md)

March 2026 validation/readiness reports remain available as historical snapshots and may not reflect the current April 23, 2026 product framing.

## Recent Updates (2026-04-23)

- Added Portuguese BMAD Standard Documentation for team sharing in [BMAD Standard Documentation - PT-BR](./bmad-standard-documentation-pt.md).
- Repositioned image/video editing as legacy/support capability instead of strategic product focus.
- Expanded current documentation focus around stakeholder email approval, blog generator/editor, CRM, analytics, and technical drawing.

## Historical Updates (2026-03-05)

- Historical: March planning rebuilt the BMAD PRD around the then-current scope in [planning artifacts](../_bmad-output/planning-artifacts/prd.md).
- Added BMAD UX specification and epics/stories decomposition for implementation planning.
- Generated sprint tracking and Sprint 1 ready-for-dev story files under `_bmad-output/implementation-artifacts/`.
- Smart background selection (`real asset` vs `AI fallback`) documented in [Content Engine Guide](./content-engine-guide.md).
- Smart Regen architecture spec documented in [Smart Regen Architecture](./architecture/SMART_REGEN_ARCHITECTURE.md).
- Manual background override flow (`Trocar Fundo`) documented in [API Contracts](./api-contracts.md) and [Data Models](./data-models.md).
- Updated validation checklist in [Social Media Workspace Testing Plan](./testing/SOCIAL_MEDIA_WORKSPACE_TESTING_PLAN.md).
- Execution orchestration with sub-agents in [Smart Regen Orchestrator Plan](./plans/SMART_REGEN_ORCHESTRATOR_PLAN.md).
- Smart Regen architecture decisions + production validation in [Architecture Decision Document](../_bmad-output/planning-artifacts/architecture.md).
- Added AI/LLM ranking content playbook from LinkedIn SGLang case in [LinkedIn SGLang Prefill Playbook](./content/LINKEDIN_SGLANG_PREFILL_PLAYBOOK.md).

## Technical Details

- [**Data Models**](./data-models.md) - Database schema and relationships.
- [**API Contracts**](./api-contracts.md) - Edge Function endpoints and payloads.
- [**Testing Guide**](../TESTING_GUIDE.md) - Playwright and unit testing instructions.
- [**Admin Operations Testing Plan**](./testing/ADMIN_OPERATIONS_TESTING_PLAN.md) - Sector-based operational verification.

## Guides and Processes

- [**Onboarding**](./ONBOARDING.md) - Getting started for new developers.
- [**Internal Processes**](./INTERNAL_PROCESSES.md) - Development workflows and standards.
- [**Fatigue Validation Guide**](../src/pages/FatigueValidationGuide.tsx) - Clinical validation logic.

## Marketing & Product

- [**Marketing Funnel Strategy**](./marketing_funnel_strategy.md)
- [**Product Catalog**](../src/pages/ProductCatalog.tsx)

---
_Last Updated: 2026-04-23_

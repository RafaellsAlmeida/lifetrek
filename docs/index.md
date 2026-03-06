# Lifetrek Documentation Index

Welcome to the Lifetrek project documentation. This index serves as the primary navigation for both developers and AI agents.

## Quick Reference

- **Tech Stack:** React 18, Vite, Tailwind, Supabase.
- **Primary Routes:** Check `src/pages/` for all available views.
- **Backend:** 38 Edge Functions and 120 Database Migrations.

## Core Documentation

- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Content Engine Guide](./content-engine-guide.md)
- [Smart Regen Architecture](./architecture/SMART_REGEN_ARCHITECTURE.md)
- [LinkedIn SGLang Prefill Playbook](./content/LINKEDIN_SGLANG_PREFILL_PLAYBOOK.md)
- [Source Tree Analysis](./source-tree-analysis.md) - Annotated directory structure.
- [**Project Context (AI Rules)**](../_bmad-output/project-context.md) - Critical implementation rules for AI.

## Canonical BMAD Artifacts (2026 Content Engine Track)

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

## Recent Updates (2026-03-05)

- Rebuilt BMAD PRD for 2026 content-engine scope in [planning artifacts](../_bmad-output/planning-artifacts/prd.md).
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

## Guides and Processes

- [**Onboarding**](./ONBOARDING.md) - Getting started for new developers.
- [**Internal Processes**](./INTERNAL_PROCESSES.md) - Development workflows and standards.
- [**Fatigue Validation Guide**](../src/pages/FatigueValidationGuide.tsx) - Clinical validation logic.

## Marketing & Product

- [**Marketing Funnel Strategy**](./marketing_funnel_strategy.md)
- [**Product Catalog**](../src/pages/ProductCatalog.tsx)

---
_Last Updated: 2026-03-05_

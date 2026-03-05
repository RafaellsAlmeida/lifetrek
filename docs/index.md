# Lifetrek Documentation Index

Welcome to the Lifetrek project documentation. This index serves as the primary navigation for both developers and AI agents.

## Quick Reference

- **Tech Stack:** React 18, Vite, Tailwind, Supabase.
- **Primary Routes:** Check `src/pages/` for all available views.
- **Backend:** 38 Edge Functions and 120 Database Migrations.

## Core Documentation

- [Data Models](file:///Users/rafaelalmeida/lifetrek/docs/data-models.md)
- [API Contracts](file:///Users/rafaelalmeida/lifetrek/docs/api-contracts.md)
- [Content Engine Guide](file:///Users/rafaelalmeida/lifetrek/docs/content-engine-guide.md)
- [Smart Regen Architecture](./architecture/SMART_REGEN_ARCHITECTURE.md)
- [LinkedIn SGLang Prefill Playbook](./content/LINKEDIN_SGLANG_PREFILL_PLAYBOOK.md)
- [Source Tree Analysis](file:///Users/rafaelalmeida/lifetrek/docs/source-tree-analysis.md) - Annotated directory structure.
- [**Project Context (AI Rules)**](../_bmad-output/project-context.md) - Critical implementation rules for AI.

## Recent Updates (2026-03-05)

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

# Lifetrek Documentation Index

Welcome to the Lifetrek documentation. This index should separate what is safe and useful to share with stakeholders from what is primarily intended for developers, operators, and agents.

## Stakeholder-Facing Documentation (PT-BR)

Use this set when you want a large shareable folder in Portuguese for the Lifetrek team and stakeholders.

- [Documentação Padrão BMAD - Lifetrek PT-BR](./bmad-standard-documentation-pt.md)
- [Documentação por Setor](./sectors/README.md)
- [Aprovação e Publicação](./sectors/approval-and-publishing.md)
- [Blog e Editorial](./sectors/blog-and-editorial.md)
- [CRM e Leads](./sectors/crm-and-leads.md)
- [Analytics e Relatórios](./sectors/analytics-and-reporting.md)
- [Desenho Técnico](./sectors/technical-drawing.md)
- [Suporte Social e Governança Visual](./sectors/social-content-support.md)

## Agent-Facing / Internal Documentation

Use this set for implementation, planning, testing, contracts, and internal technical operations.

### Primary Entry Points

- [BMAD Standard Documentation - Lifetrek](./bmad-standard-documentation.md)
- [Project Context (AI Rules)](../_bmad-output/project-context.md)
- [Project Overview](./project-overview.md)

### Core Technical Docs

- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Content Engine Guide](./content-engine-guide.md)
- [Smart Regen Architecture](./architecture/SMART_REGEN_ARCHITECTURE.md)
- [LinkedIn SGLang Prefill Playbook](./content/LINKEDIN_SGLANG_PREFILL_PLAYBOOK.md)
- [Source Tree Analysis](./source-tree-analysis.md)

### Canonical BMAD Artifacts

`_bmad-output` remains the canonical planning and implementation source for the current cycle.

- [PRD](../_bmad-output/planning-artifacts/prd.md)
- [Architecture](../_bmad-output/planning-artifacts/architecture.md)
- [UX Design Specification](../_bmad-output/planning-artifacts/ux-design-specification.md)
- [Epics and Stories](../_bmad-output/planning-artifacts/epics.md)
- [Sprint Status](../_bmad-output/implementation-artifacts/sprint-status.yaml)
- [Historical Story Files](../_bmad-output/implementation-artifacts/stories/)
- [PRD Validation Report](../_bmad-output/planning-artifacts/prd-validation-report-2026-03-05.md)
- [Implementation Readiness Report](../_bmad-output/planning-artifacts/implementation-readiness-report-2026-03-05.md)
- [Implementation Delta Report](../_bmad-output/planning-artifacts/implementation-delta-report-2026-03-05.md)
- [Orchestrator Architecture Research](../_bmad-output/planning-artifacts/orchestrator-architecture-research-2026-03-06.md)

March 2026 validation and readiness reports remain available as historical snapshots and may not reflect the April 2026 product framing.

### Internal Testing and Ops

- [Onboarding](./ONBOARDING.md)
- [Internal Processes](./INTERNAL_PROCESSES.md)

Route-specific testing guidance should live in the relevant BMAD story, feature doc, or `AGENTS.md` instead of standalone legacy testing plans.

## Notes

- Stakeholder-facing docs should stay in Portuguese.
- Agent-facing docs should stay in English when they are technical, procedural, or implementation-oriented.
- The primary BMAD entrypoint for agents is `docs/bmad-standard-documentation.md`.
- Remaining legacy docs should be normalized or deleted intentionally, with agent routing kept consistent.

---
_Last Updated: 2026-04-25_

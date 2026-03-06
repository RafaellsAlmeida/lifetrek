# Implementation Delta Report (PRD vs Current Code)

**Date:** 2026-03-05  
**Scope:** 2026 Content Engine track (`_bmad-output/planning-artifacts/prd.md`)

## 1) Fully Implemented in Current Branch

1. **FR-002 Ideation persistence**
   - New `content_ideas` contract and persistence path were added.
2. **FR-005 LinkedIn generation pipeline**
   - Existing generation flow remains operational with explicit platform support.
3. **FR-006 Instagram generation via shared pipeline**
   - `platform` parameter added and routed to shared generation contract.
4. **FR-008 Blog hero generation at create**
   - Blog generation now returns/stores `hero_image_url` alongside legacy `featured_image`.
5. **FR-010 Blog hero backfill batch**
   - New `generate-blog-images` edge function supports dry-run and batch update.
6. **FR-011 LinkedIn CSV upload**
   - Upload contract and UI panel implemented in `/admin/analytics`.
7. **FR-012 LinkedIn analytics normalized persistence**
   - New `linkedin_analytics` schema + ingestion function.

## 2) Implemented but Needs Stabilization/Hardening

1. **FR-004 Orchestrator chat entry -> generation params**
   - Intent extraction mode exists (`chat` with `mode=orchestrator_intent`) and UI confirm step exists.
   - Needs deployed-function verification in target Supabase environment.
2. **FR-009 Blog approval publishing flow**
   - Status/timestamp alignment improved.
   - Needs end-to-end approval queue verification against production-like data.
3. **FR-018 Access control and auditability**
   - New functions enforce bearer auth and new tables include RLS policies.
   - Audit/event visibility is still basic; no explicit cross-feature audit dashboard.

## 3) Not Implemented Yet (Primary Delta)

1. **FR-013 Analytics feedback visibility**
   - Upload and ingest exist, but dedicated views over imported `linkedin_analytics` are not implemented.
   - Story gap: `3-3-imported-analytics-visibility`.
2. **FR-015 Image versioning guardrail (full enforcement)**
   - Existing system already uses variants in parts of flow, but Story 1.4 guardrail completion is still pending.
   - Story gap: `1-4-image-variant-guardrails`.
3. **FR-017 Cost tracking coverage**
   - New/updated AI call paths are not fully wired to mandatory `_shared/cost-tracker` instrumentation.
   - Story gap: `2-4-cost-tracking-enforcement`.
4. **Epic 4 / Epic 5 hardening stories**
   - UX hardening and cross-domain no-regression guardrail stories remain backlog.

## 4) Technical Delivery Gaps (Non-FR but Release-Critical)

1. **Type-safety drift in edge functions**
   - Deno type-check has unresolved generic/type mismatches in modified functions.
2. **Local-vs-hosted function parity**
   - UI calls may hit hosted functions without latest branch changes unless deployed.
3. **Story file status mismatch**
   - Sprint status marks several items in `review`, but story specs still had `ready-for-dev` (needs synchronization).

## 5) Suggested Sprint-Run Entry Criteria

1. Deploy migration `20260305113000_content_engine_foundation.sql` to target environment.
2. Deploy new/updated edge functions (`ingest-linkedin-analytics`, `generate-blog-images`, `chat`, `generate-linkedin-carousel`, `generate-blog-post`).
3. Close Story 1.4, 2.4, and 3.3 or explicitly defer them with product sign-off.
4. Add/verify cost tracking for all new AI call paths.
5. Pass end-to-end checks for:
   - `/admin/social` platform toggle + generation,
   - `/admin/orchestrator` chat intent extraction,
   - `/admin/analytics` validate/import flow.

## 6) Verification Artifacts Captured

- `generated_content/verification_2026-03-05/admin-social-create-platform-toggle.png`
- `generated_content/verification_2026-03-05/admin-analytics-csv-upload.png`


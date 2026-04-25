# Marketing Workflow Optimizations (P1/P2)

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `PLANS.md` from the repository root and must be maintained in accordance with that document.

## Purpose / Big Picture

After this change, internal users can trace LinkedIn campaign performance through consistent campaign identifiers captured in both content records and analytics events, and see post performance (including campaign id) in the Analytics dashboard’s LinkedIn tab. Documentation and training references will point to the correct Social Media Workspace route, and lead scoring will be explained consistently across the UI and docs. You can verify the work by generating or opening a LinkedIn carousel, checking that campaign fields are stored, viewing analytics events with campaign metadata, opening Analytics to see the post performance table, and reading updated docs that reference the correct admin URLs.

## Progress

- [x] (2026-02-10 01:10Z) Create campaign tracking schema and analytics capture updates.
- [x] (2026-02-10 01:10Z) Wire campaign identifiers into LinkedIn carousel generation flows.
- [x] (2026-02-10 01:10Z) Fix documentation URL mismatches for Social Media Workspace (docs already pointed to `/admin/social`).
- [x] (2026-02-10 01:10Z) Align lead-score scale language in UI/docs without data migration.
- [x] (2026-02-10 02:40Z) Surface post performance with campaign id in Analytics (LinkedIn tab) and tighten table rendering.
- [x] (2026-02-10 01:15Z) Validate in dev server and capture screenshots.

## Surprises & Discoveries

- Observation: The Social Media Workspace route was already documented as `/admin/social`, so no route correction was needed.
  Evidence: the current documentation already pointed to the `/admin/social` route.

- Observation: The `/admin/analytics` route renders `UnifiedAnalytics`, so the post performance table needed to be placed in its LinkedIn tab to be visible.
  Evidence: `src/App.tsx` routes `path="analytics"` to `UnifiedAnalytics`.

## Decision Log

- Decision: Keep lead score storage unchanged and correct the user-facing language to 0–100 rather than migrating data.
  Rationale: Avoids risky data changes while aligning with existing schema comments and UI behavior.
  Date/Author: 2026-02-10 / Codex

- Decision: Use `LINKEDIN_CAMPAIGN` item `id` as the `campaign_id` and `utm_campaign` when batch generating.
  Rationale: Ensures a stable identifier with zero UI changes and enables cross-table joins.
  Date/Author: 2026-02-10 / Codex

- Decision: Surface post performance in `UnifiedAnalytics` instead of swapping the `/admin/analytics` route.
  Rationale: Keeps the existing unified dashboard intact while adding the new table where users already visit.
  Date/Author: 2026-02-10 / Codex

## Outcomes & Retrospective

The campaign tracking columns, analytics capture enrichment, and lead-score language updates are in place, and the Analytics LinkedIn tab now surfaces the post performance table with the campaign id column. The dev server was started, the admin flows were visited, and a screenshot of the Analytics LinkedIn tab was captured for confirmation. The remaining gap is that we did not execute a live batch generation run to observe a stored `campaign_id` in the database; the code path is updated, but a production-style run would confirm persistence end-to-end.

## Context and Orientation

The marketing workflow spans LinkedIn carousel generation in `src/pages/LinkedInCarousel.tsx`, analytics capture in `src/utils/trackAnalytics.ts`, and reporting in admin dashboards such as `src/pages/Admin/UnifiedAnalytics.tsx` (which now renders `src/components/admin/analytics/PostPerformanceTable.tsx` under the LinkedIn tab). The database schema lives under `supabase/migrations`. The Social Media Workspace route is `/admin/social`. Lead scoring appears in admin UI components like `src/components/admin/LeadDetailsModal.tsx` and in onboarding documentation under `docs/onboarding`.

The key term “campaign linkage” means that LinkedIn carousel records include a campaign identifier, and analytics events record UTM parameters and campaign identifiers so reports can correlate content to traffic or leads.

## Plan of Work

First, add campaign tracking columns to the database schema and update the Supabase types to include those fields. Then, update analytics tracking to capture UTM query parameters and campaign identifiers into explicit columns rather than only the metadata JSON. Next, wire campaign identifiers into the LinkedIn carousel generation flow used by batch campaign generation, so each generated carousel is labeled with a campaign id. After that, fix Social Media Workspace documentation URL references and align lead-score language in UI and onboarding docs to clarify the 0–100 scale. Then, surface the `PostPerformanceTable` in the Analytics page (LinkedIn tab) and ensure the empty state renders correctly for the new campaign column. Finally, verify behavior using the local dev server and capture screenshots that show the relevant screens.

## Concrete Steps

1) Add migration `supabase/migrations/20260210120000_add_campaign_tracking.sql` to include campaign fields in `linkedin_carousels` and `analytics_events`, plus indexes.

2) Update `src/integrations/supabase/types.ts` for `analytics_events` and `linkedin_carousels` to include the new columns.

3) Update `src/utils/trackAnalytics.ts` to parse UTM query parameters and write them to analytics event columns, keeping metadata for extra context.

4) Update `src/pages/LinkedInCarousel.tsx` to accept optional `campaignId`/`utmCampaign` in `autoSaveCarousel`, and pass campaign identifiers during batch generation from `src/config/linkedinCampaign.ts`.

5) Update documentation references to use `/admin/social` instead of `/admin/social-workspace`.

6) Update lead-score wording in `docs/onboarding/IMPLEMENTATION_PLAN.md`, `docs/onboarding/ONBOARDING_CHECKLIST.md`, and UI copy where needed to clarify “0–100” scale.

7) Update `src/components/admin/analytics/PostPerformanceTable.tsx` for the campaign column and empty state, and render it in `src/pages/Admin/UnifiedAnalytics.tsx` under the LinkedIn tab.

8) Run `npm run dev:web`, verify `/admin/linkedin-carousel`, `/admin/social?tab=create`, and `/admin/analytics` (LinkedIn tab), and capture screenshots for evidence.

## Validation and Acceptance

Start the dev server with `npm run dev:web`. Log in at `http://localhost:8080/admin/login` (or the assigned port) and open `/admin/linkedin-carousel` to ensure the page loads. Generate or open a carousel and confirm that a `campaign_id` can be stored when batch generation runs. Confirm that `trackAnalyticsEvent` inserts `utm_campaign` and related fields by inspecting logs or the database if available. Open `/admin/analytics`, switch to the LinkedIn tab, and confirm the “Performance de Posts” table renders with the “Campanha” column. Verify that current documentation references `/admin/social`. Acceptance is achieved when the UI loads, the new columns exist in schema and types, analytics capture uses UTM columns, and the post performance table renders.

## Idempotence and Recovery

The migration uses `ADD COLUMN IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, so it can be rerun safely. Documentation edits are textual and can be repeated without side effects. If any step fails, revert the specific file change and re-run after fixing the cause.

## Artifacts and Notes

Evidence artifacts (screenshots) will be saved in `tmp/` and referenced in the final report.

Captured: `tmp/admin-analytics-post-performance.png`.

## Interfaces and Dependencies

The database interface changes are in `supabase/migrations/20260210120000_add_campaign_tracking.sql` and `src/integrations/supabase/types.ts`. Analytics capture logic is in `src/utils/trackAnalytics.ts`. LinkedIn campaign metadata flows from `src/config/linkedinCampaign.ts` into `src/pages/LinkedInCarousel.tsx` via batch generation. The Analytics surface uses `src/pages/Admin/UnifiedAnalytics.tsx` with `src/components/admin/analytics/PostPerformanceTable.tsx` to display campaign-linked post metrics. Documentation references live under `docs/`.

---

Plan created on 2026-02-10 by Codex. This file must be updated as work progresses.

Update 2026-02-10: Marked campaign tracking and lead-score language tasks complete, and recorded that Social Media Workspace doc already had the correct URL.

Update 2026-02-10: Added Analytics post performance surfacing to the plan and updated migration filename references.

Update 2026-02-10: Adjusted dashboard references to use `UnifiedAnalytics` (the `/admin/analytics` route) for the post performance table.

Update 2026-02-10: Recorded validation completion and screenshot artifact.

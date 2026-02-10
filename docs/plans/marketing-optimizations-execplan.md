# Marketing Workflow Optimizations (P1/P2)

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `PLANS.md` from the repository root and must be maintained in accordance with that document.

## Purpose / Big Picture

After this change, internal users can trace LinkedIn campaign performance through consistent campaign identifiers captured in both content records and analytics events. Documentation and training references will point to the correct Social Media Workspace route, and lead scoring will be explained consistently across the UI and docs. You can verify the work by generating or opening a LinkedIn carousel, checking that campaign fields are stored, viewing analytics events with campaign metadata, and reading updated docs that reference the March 2026 plan and the correct admin URLs.

## Progress

- [ ] (2026-02-10 00:35Z) Create campaign tracking schema and analytics capture updates.
- [ ] (2026-02-10 00:35Z) Wire campaign identifiers into LinkedIn carousel generation flows.
- [ ] (2026-02-10 00:35Z) Fix documentation URL mismatches for Social Media Workspace.
- [ ] (2026-02-10 00:35Z) Align lead-score scale language in UI/docs without data migration.
- [ ] (2026-02-10 00:35Z) Validate in dev server and capture screenshots.

## Surprises & Discoveries

- None yet.

## Decision Log

- Decision: Keep lead score storage unchanged and correct the user-facing language to 0–100 rather than migrating data.
  Rationale: Avoids risky data changes while aligning with existing schema comments and UI behavior.
  Date/Author: 2026-02-10 / Codex

## Outcomes & Retrospective

- Pending. This section will be updated after validation.

## Context and Orientation

The marketing workflow spans LinkedIn carousel generation in `src/pages/LinkedInCarousel.tsx`, analytics capture in `src/utils/trackAnalytics.ts`, and reporting in admin dashboards. The database schema lives under `supabase/migrations`. The Social Media Workspace route is `/admin/social` and its test plan is in `docs/testing/SOCIAL_MEDIA_WORKSPACE_TESTING_PLAN.md`. Lead scoring appears in admin UI components like `src/components/admin/LeadDetailsModal.tsx` and in onboarding documentation under `docs/onboarding`.

The key term “campaign linkage” means that LinkedIn carousel records include a campaign identifier, and analytics events record UTM parameters and campaign identifiers so reports can correlate content to traffic or leads.

## Plan of Work

First, add campaign tracking columns to the database schema and update the Supabase types to include those fields. Then, update analytics tracking to capture UTM query parameters and campaign identifiers into explicit columns rather than only the metadata JSON. Next, wire campaign identifiers into the LinkedIn carousel generation flow used by batch campaign generation, so each generated carousel is labeled with a campaign id. After that, fix the Social Media Workspace testing plan URL references and align lead-score language in UI and onboarding docs to clarify the 0–100 scale. Finally, verify behavior using the local dev server and capture screenshots that show the relevant screens.

## Concrete Steps

1) Add migration `supabase/migrations/20260210_add_campaign_tracking.sql` to include campaign fields in `linkedin_carousels` and `analytics_events`, plus indexes.

2) Update `src/integrations/supabase/types.ts` for `analytics_events` and `linkedin_carousels` to include the new columns.

3) Update `src/utils/trackAnalytics.ts` to parse UTM query parameters and write them to analytics event columns, keeping metadata for extra context.

4) Update `src/pages/LinkedInCarousel.tsx` to accept optional `campaignId`/`utmCampaign` in `autoSaveCarousel`, and pass campaign identifiers during batch generation from `src/config/linkedinCampaign.ts`.

5) Update `docs/testing/SOCIAL_MEDIA_WORKSPACE_TESTING_PLAN.md` to reference `/admin/social` instead of `/admin/social-workspace`.

6) Update lead-score wording in `docs/onboarding/IMPLEMENTATION_PLAN.md`, `docs/onboarding/ONBOARDING_CHECKLIST.md`, and UI copy where needed to clarify “0–100” scale.

7) Run `npm run dev:web`, verify `/admin/linkedin-carousel` and `/admin/social?tab=create`, and capture screenshots for evidence.

## Validation and Acceptance

Start the dev server with `npm run dev:web`. Log in at `http://localhost:8080/admin/login` (or the assigned port) and open `/admin/linkedin-carousel` to ensure the page loads. Generate or open a carousel and confirm that a `campaign_id` can be stored when batch generation runs. Confirm that `trackAnalyticsEvent` inserts `utm_campaign` and related fields by inspecting logs or the database if available. Verify that the Social Media Workspace testing doc references `/admin/social`. Acceptance is achieved when the UI loads, the new columns exist in schema and types, and analytics capture uses UTM columns.

## Idempotence and Recovery

The migration uses `ADD COLUMN IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, so it can be rerun safely. Documentation edits are textual and can be repeated without side effects. If any step fails, revert the specific file change and re-run after fixing the cause.

## Artifacts and Notes

Evidence artifacts (screenshots) will be saved in `tmp/` and referenced in the final report.

## Interfaces and Dependencies

The database interface changes are in `supabase/migrations/20260210_add_campaign_tracking.sql` and `src/integrations/supabase/types.ts`. Analytics capture logic is in `src/utils/trackAnalytics.ts`. LinkedIn campaign metadata flows from `src/config/linkedinCampaign.ts` into `src/pages/LinkedInCarousel.tsx` via batch generation. Documentation references live under `docs/`.

---

Plan created on 2026-02-10 by Codex. This file must be updated as work progresses.

# Story 3.3: Imported Analytics Visibility

Status: review

## Story

As a strategist,
I want imported analytics surfaced for planning,
so that future content decisions use real performance data.

## Acceptance Criteria

1. Given imported analytics exists, when user opens analytics view, then latest period summary is visible.
2. Given no analytics exists, when view loads, then empty state directs user to upload flow.
3. Given ingestion errors occurred, when user checks results, then error summary is available for correction.

## Tasks / Subtasks

- [x] Create `useImportedLinkedInAnalytics` hook (AC: 1, 2)
  - [x] Query `linkedin_analytics` table for all rows ordered by `posted_at desc`
  - [x] Derive `latest_period` as the most recent `uploaded_period` value
  - [x] Compute aggregate for latest period: total impressions, clicks, reactions, comments, shares, avg engagement_rate
  - [x] Return `{ data, loading, hasData }` where `hasData = data.rows.length > 0`
  - [x] Use existing `supabase` client from `@/integrations/supabase/client`
- [x] Create `ImportedAnalyticsSummary` component (AC: 1, 2)
  - [x] When `hasData=false`: render empty-state card with "Nenhum dado importado" and CTA "Faça o upload do CSV acima"
  - [x] When `hasData=true`: render latest-period label + 4 KPI stat cards (Impressões, Cliques, Reações, Engajamento médio)
  - [x] Add top-posts table showing up to 10 rows from `linkedin_analytics` for latest period, columns: Data, URL do post, Impressões, Cliques, Reações, Engajamento
  - [x] Show post URL as truncated anchor (`<a href>`) linking to the LinkedIn post
  - [x] Follow existing card/table pattern from `PostPerformanceTable.tsx`
  - [x] PT-BR labels throughout
- [x] Wire `ImportedAnalyticsSummary` into `UnifiedAnalytics.tsx` LinkedIn tab (AC: 1, 2, 3)
  - [x] Add `ImportedAnalyticsSummary` below the existing `PostPerformanceTable` in `TabsContent value="linkedin"`
  - [x] AC3 is handled by `LinkedInCsvUploadPanel` already rendered above the tabs — confirm it remains there on the same page
  - [x] No changes to other tabs, routes, or shared hooks
- [x] Verify no-regression: run `npm run lint` (AC: none but required per brownfield rule)

## Dev Notes

- **`linkedin_analytics` table** stores CSV-imported LinkedIn Page post metrics. Fields: `id`, `uploaded_period` (YYYY-MM), `posted_at` (date), `post_url`, `post_id`, `impressions`, `clicks`, `reactions`, `comments`, `shares`, `engagement_rate`, `ctr`, `source_file_name`, `source_row_hash`, `ingested_by`, `ingested_at`, `raw_payload`.
- **AC3 coverage**: `LinkedInCsvUploadPanel` (already rendered at top of `UnifiedAnalytics.tsx` above the tab list) shows `rejected_rows` inline after each upload. The visibility story does not need to re-persist or re-surface error rows — the upload panel state already satisfies AC3 as long as the panel remains mounted. Do NOT move or remove `LinkedInCsvUploadPanel` from the page.
- **`PostPerformanceTable`** in the LinkedIn tab reads from `linkedin_carousels`, NOT from `linkedin_analytics`. These are SEPARATE data sources — do not confuse or merge them.
- **`useUnifiedAnalytics`** fetches `linkedin_analytics_daily` (connection/message snapshots from Unipile). This is different from `linkedin_analytics` (CSV-imported page post metrics). Do NOT modify `useUnifiedAnalytics`.
- **Hook pattern**: Follow `src/hooks/useInternalAnalytics.ts` pattern — return `{ data, loading }`, use `useEffect` + `useState`, call Supabase directly.
- **Empty state CTA**: Just descriptive text — "Faça o upload do CSV acima para visualizar dados importados." Do NOT add a button that scrolls or navigates — the upload panel is already visible at the top of the page.
- **Cost tracking**: No AI calls in this story. No cost tracking needed.
- **Brownfield safety**: Only touch `UnifiedAnalytics.tsx` (add one component to LinkedIn tab). Create 2 new files. Do not modify any other existing file.

### Project Structure Notes

- Hook location: `src/hooks/useImportedLinkedInAnalytics.ts` (new)
- Component location: `src/components/admin/analytics/ImportedAnalyticsSummary.tsx` (new)
- Wire-in target: `src/pages/Admin/UnifiedAnalytics.tsx` — LinkedIn `TabsContent` (add below `<PostPerformanceTable />`)
- Supabase client: `import { supabase } from "@/integrations/supabase/client"`
- Types reference: `src/integrations/supabase/types.ts` — `linkedin_analytics` Row type at line 1183
- Existing UI components to reuse: `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` from `@/components/ui/card`; `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@/components/ui/table`; `Loader2` from `lucide-react`; `Badge` from `@/components/ui/badge`
- Existing analytics pattern to follow: `src/components/admin/analytics/PostPerformanceTable.tsx` (same card/table structure, same empty-state pattern)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-33-imported-analytics-visibility]
- [Source: _bmad-output/planning-artifacts/prd.md — FR-013 Analytics Feedback Visibility]
- [Source: src/components/admin/analytics/PostPerformanceTable.tsx — table/card UI pattern]
- [Source: src/components/admin/analytics/LinkedInCsvUploadPanel.tsx — upload panel with rejected_rows (AC3 already covered)]
- [Source: src/pages/Admin/UnifiedAnalytics.tsx — integration target (LinkedIn tab)]
- [Source: supabase/functions/ingest-linkedin-analytics/index.ts — linkedin_analytics insert contract]
- [Source: src/integrations/supabase/types.ts:1183 — linkedin_analytics Row type]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run lint` completed with 0 errors and 40 pre-existing warnings unrelated to Story 3.3.
- Browser verification at `http://localhost:8080/admin/analytics` with admin login `rafacrvg@icloud.com`.
- `linkedin_analytics` row count verified via service-role query: `0`.
- Screenshots:
  - `/var/folders/64/d80xb0q973lcbhg8xntrqky40000gn/T/playwright-mcp-output/1772817785303/page-2026-03-06T17-24-49-448Z.png`
  - `/var/folders/64/d80xb0q973lcbhg8xntrqky40000gn/T/playwright-mcp-output/1772817785303/page-2026-03-06T17-24-49-760Z.png`
  - `/var/folders/64/d80xb0q973lcbhg8xntrqky40000gn/T/playwright-mcp-output/1772817785303/page-2026-03-06T17-25-17-204Z.png`

### Completion Notes List

- Audited the existing implementation against Story 3.3 and kept the brownfield scope minimal.
- Restored `PostPerformanceTable` above `ImportedAnalyticsSummary` in the LinkedIn tab so the imported summary is additive rather than replacing existing analytics UI.
- Verified the empty-state branch in the admin UI because this environment currently has no imported `linkedin_analytics` rows.
- Confirmed `LinkedInCsvUploadPanel` remains visible above the tab set on `/admin/analytics`.
- Could not verify inline `rejected_rows` rendering from `localhost:8080` because the existing deployed `ingest-linkedin-analytics` function is currently failing CORS preflight from the local origin before returning a validation payload.
- Observed an unrelated brownfield issue after restoring the existing LinkedIn post table: `PostPerformanceTable` queries non-existent `linkedin_carousels.published_at` / `views` fields and logs Supabase 42703 errors. Left unchanged because Story 3.3 explicitly limits edits to the summary hook/component and the LinkedIn tab wiring.

### File List

- `src/hooks/useImportedLinkedInAnalytics.ts`
- `src/components/admin/analytics/ImportedAnalyticsSummary.tsx`
- `src/pages/Admin/UnifiedAnalytics.tsx`

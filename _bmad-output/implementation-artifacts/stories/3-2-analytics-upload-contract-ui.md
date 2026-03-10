# Story 3.2: Analytics Upload Contract UI

Status: in-progress

## Story

As an admin user,
I want a clear analytics upload UI contract,
so that I can upload files and understand ingestion outcomes without developer help.

## Acceptance Criteria

1. Given user opens analytics upload, when file is selected, then schema expectations are visible before submit.
2. Given ingest completes, when result is displayed, then accepted/rejected counts and key error reasons are shown.
3. Given upload fails pre-validation, when user reviews feedback, then corrective steps are explicit and actionable.

## Tasks / Subtasks

- [ ] Build or update analytics upload panel for contract clarity (AC: 1)
  - [ ] Show expected columns and file constraints inline
- [ ] Render post-ingest summary state in UI (AC: 2)
  - [ ] Include accepted/rejected counts and major error categories
- [ ] Add pre-validation failure guidance (AC: 3)
  - [ ] Provide direct correction instructions

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Render inline corrective guidance from failed validation responses instead of reducing them to a toast message. [src/components/admin/analytics/LinkedInCsvUploadPanel.tsx:63]
- [ ] [AI-Review][Medium] Summarize dominant rejection reasons in the ingest result UI instead of only showing raw row samples. [src/components/admin/analytics/LinkedInCsvUploadPanel.tsx:192]
- [ ] [AI-Review][Medium] Gate `Importar` behind a successful validation pass so the upload flow follows the documented contract. [src/components/admin/analytics/LinkedInCsvUploadPanel.tsx:163]

## Dev Notes

- Keep UI language concise for non-technical operators.
- Preserve existing analytics dashboard routes and navigation patterns.
- Ensure upload UX remains accessible and keyboard operable.

### Project Structure Notes

- Admin analytics page/components under `src/pages/Admin/` and `src/components/admin/analytics/`
- API call target: `ingest-linkedin-analytics`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#34-adminanalytics]
- [Source: _bmad-output/planning-artifacts/prd.md#83-ui-contract-requirements]
- [Source: _bmad-output/planning-artifacts/epics.md#story-32-analytics-upload-contract-ui]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List

## Senior Developer Review (AI)

- Reviewer: Rafaelalmeida
- Date: 2026-03-10
- Outcome: Changes Requested
- Status Recommendation: `in-progress`
- Git Note: local `git status` contains unrelated worktree changes, so the review was executed against the current implementation rather than a clean per-story diff.
- Story Note: this story reached `review` with an empty File List and no completion evidence even though the upload panel is already mounted on `/admin/analytics`.
- Findings:
  - [High] Failed validation responses are collapsed to a toast, so the UI discards the structured correction data needed for AC3. [src/components/admin/analytics/LinkedInCsvUploadPanel.tsx:63]
  - [Medium] The result UI exposes counts and raw samples but never groups the main rejection reasons, so AC2 is only partially satisfied. [src/components/admin/analytics/LinkedInCsvUploadPanel.tsx:192]
  - [Medium] The UI still lets operators ingest without first completing a validation pass, which weakens the explicit upload contract. [src/components/admin/analytics/LinkedInCsvUploadPanel.tsx:163]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

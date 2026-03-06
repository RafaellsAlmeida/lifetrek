# Story 3.2: Analytics Upload Contract UI

Status: review

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

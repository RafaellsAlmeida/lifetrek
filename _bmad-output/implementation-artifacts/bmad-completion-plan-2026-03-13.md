# BMAD Completion Plan

Date: 2026-03-13
Project: lifetrek

## Goal

Finish all open BMAD implementation, review, testing, and artifact-sync work without blocking on a single agent or a single branch.

## Current Snapshot

- Done stories: 4
- Review stories: 7
- In-progress stories: 6
- Ready-for-dev stories: 8
- Backlog stories: 0

## Parallel Lanes

### Lane A: Codex

Purpose: implementation, bug fixes, tests, screenshots, and code review follow-through.

Primary sequence:

1. Stabilize the current approval queue / failure recovery work already in progress.
   Focus:
   - 4-2-unified-approval-queue-behavior
   - 4-3-operator-failure-recovery-ux
   - 4-4-human-editing-surfaces-blogs-resources

2. Finish Epic 6 UI completion in dependency order.
   Order:
   - 6-4-public-review-page
   - 6-5-admin-stakeholder-status-ui
   - 6-6-admin-manual-send-trigger
   - 6-7-weekly-auto-send-cron

3. Clear the oldest in-progress stories still blocking BMAD closure.
   Target set:
   - 1-1-content-ideas-schema
   - 1-2-linkedin-analytics-schema
   - 1-3-blog-posts-hero-status-alignment
   - 2-2-blog-hero-generation-at-create
   - 2-3-chat-intent-to-carousel-params

4. Resolve review stories with targeted fixes instead of reopening broad scope.
   Target set:
   - 1-4-image-variant-guardrails
   - 2-1-platform-param-carousel-generation
   - 3-1-linkedin-csv-ingestion-function
   - 3-2-analytics-upload-contract-ui
   - 3-3-imported-analytics-visibility
   - 4-1-orchestrator-mode-parity-ux
   - 4-2-unified-approval-queue-behavior

5. Close Epic 5 guardrails after stakeholder-review UI work is stable.
   Target set:
   - 5-1-real-asset-first-enforcement
   - 5-2-access-and-audit-guardrails
   - 5-3-cross-domain-no-regression-verification

Execution rule:
- Each story is not done until code changes, verification, and screenshot evidence exist.

### Lane B: Gemini

Purpose: BMAD operations, documentation, artifact synchronization, and review bookkeeping only.

Allowed scope:
- `_bmad-output/**`
- `_bmad/**`
- `.agent/**`
- `docs/**`

Do not edit:
- `src/**`
- `supabase/**`
- `scripts/**` unless the task is pure documentation about the script
- package manifests
- lockfiles

Primary sequence:

1. Keep `sprint-status.yaml` aligned with the story inventory from `epics.md`.
2. Sync story file `Status:` lines with the sprint tracker once implementation is merged and verified.
3. Update story Dev Agent Record sections, file lists, and change logs from completed work.
4. Prepare or refresh BMAD review notes for stories in `review`.
5. Document BMAD workflow usage, operator notes, and current gaps in parallel execution docs.
6. Create retrospective scaffolding when an epic reaches fully done status.

Execution rule:
- Gemini should not invent completion states. It should only sync statuses from actual files, accepted review outcomes, and verified implementation state.

## Recommended Work Split

### Immediate next 48 hours

Codex:
- Finish the current approval/error recovery thread.
- Move 4-3 to implementation completion with tests and screenshots.
- Start 6-4 immediately after 4-3 is stable.

Gemini:
- Clean BMAD story/status drift.
- Update workflow docs for the current implementation phase.
- Prepare review artifacts for any story already marked `review`.

### After Epic 6 UI is stable

Codex:
- Finish 6-5 and 6-6 together if they share the same approval UI surfaces.
- Finish 6-7 after verifying 6-2 and 6-3 integration assumptions.

Gemini:
- Update story docs for Epic 6 as each story advances.
- Draft epic-level completion summary and retrospective shell.

### Final closure phase

Codex:
- Clear remaining in-progress and ready-for-dev stories.
- Run final code review and verification loops.

Gemini:
- Make BMAD artifacts consistent.
- Ensure story files, sprint tracking, and review notes reflect reality.

## Working Rules

1. One agent owns code; the other owns BMAD docs and status hygiene.
2. Use separate worktrees to avoid file collisions.
3. Do not let Gemini edit implementation files while Codex is actively devving.
4. Do not mark stories `done` from file existence alone.
5. Re-run sprint planning after major story creation or title/slug changes.

## Done Definition

BMAD is complete when:

- All stories in `sprint-status.yaml` are `done`
- Story files are status-synced
- Code review findings are either fixed or explicitly captured
- Required tests have been run
- Required screenshots have been captured for UI work
- Epic retrospectives are created where needed

# Story 6.7: Weekly Auto-Send Scheduled Function

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the platform,
I want an automatic weekly send of admin-approved posts that have not yet been sent for stakeholder review,
so that the approval loop completes even if Rafael forgets to trigger it manually.

## Acceptance Criteria

1. **Given** admin_approved posts not yet in any batch, **When** cron fires, **Then** a batch is created and emails sent to both reviewers.
2. **Given** no admin_approved posts pending, **When** cron fires, **Then** function exits cleanly with log "No posts to send."
3. **Given** Rafael manually sent all posts earlier that week, **When** cron fires on Monday, **Then** no duplicate batch or duplicate email is sent.
4. **Given** function invocation fails (Resend error), **When** error is caught, **Then** function returns 500 with error logged; no partial batch is left in `sent` status.

## Tasks / Subtasks

- [ ] Task 1: Create Edge Function `weekly-stakeholder-send` (AC: #1, #2, #3, #4)
  - [ ] 1.1 Create `supabase/functions/weekly-stakeholder-send/index.ts`
  - [ ] 1.2 Function queries all `linkedin_carousels`, `instagram_posts`, `blog_posts` where:
    - `status = 'admin_approved'`
    - `id NOT IN (SELECT content_id FROM stakeholder_review_items)`
  - [ ] 1.3 If result set is empty → log "No posts to send. Skipping." and return 200
  - [ ] 1.4 If ≥1 post found → call `send-stakeholder-review` logic (import shared handler or invoke function)
    - `post_refs`: all found posts
    - `notes`: `"Envio automático semanal – {ISO date}"`
    - `created_by`: system UUID from `SYSTEM_USER_ID` env var
  - [ ] 1.5 Log result: batch_id, count sent, reviewer emails
  - [ ] 1.6 On Resend error: catch, log error, return 500; no partial batch left — if batch was created, mark as `expired` or delete it

- [ ] Task 2: Register cron schedule in Supabase (AC: #1)
  - [ ] 2.1 Deploy function with `verify_jwt = false` (it's invoked internally by Supabase cron, not by user)
  - [ ] 2.2 Register cron job via Supabase dashboard or `pg_cron`: `0 11 * * 1` (11:00 UTC = 08:00 BRT, every Monday)
  - [ ] 2.3 Document the cron registration steps in `docs/operations.md` (or create it if absent)

- [ ] Task 3: Idempotency guard (AC: #3)
  - [ ] 3.1 The query in step 1.2 already handles idempotency: `id NOT IN (SELECT content_id FROM stakeholder_review_items)` — posts in any existing batch are excluded
  - [ ] 3.2 Test: after manual send, cron dry-run should find 0 posts

- [ ] Task 4: Rollback on failure (AC: #4)
  - [ ] 4.1 Wrap batch creation + email send in a try/catch
  - [ ] 4.2 If email send fails after batch is created: delete the created batch and token records (or set `status = 'expired'`)
  - [ ] 4.3 Return 500 with `{ error: "Weekly send failed: {reason}" }`

## Dev Notes

### Files to Create

- `supabase/functions/weekly-stakeholder-send/index.ts`

### Shared Logic Pattern

Prefer importing the shared batch creation logic from `send-stakeholder-review` if extracted to `supabase/functions/_shared/`:

```typescript
import { createReviewBatch } from '../_shared/stakeholderReview.ts'
```

If not yet extracted, inline the logic from `send-stakeholder-review` (acceptable for MVP — refactor later).

### Environment Variables Required

- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — for DB queries
- `RESEND_API_KEY` — for email delivery
- `STAKEHOLDER_EMAIL_1` = `rbianchini@lifetrek-medical.com`
- `STAKEHOLDER_EMAIL_2` = `njesus@lifetrek-medical.com`
- `REVIEW_BASE_URL` — Vercel deployment URL
- `SYSTEM_USER_ID` — UUID representing the automated system actor (set in Supabase dashboard)

### Architecture Compliance

- Deno-based Edge Function
- No JWT verification required (this is a server-side cron, not user-invoked)
- All errors must result in no partial data left in DB
- Log all key events to console (Supabase Edge Function logs)

### Testing Requirements

- Manually invoke the function with `supabase functions invoke weekly-stakeholder-send`
- Verify with 0 pending posts → returns 200, no batch created
- Verify with 1+ pending posts → batch created, emails dispatched (or mocked)
- Verify idempotency: run twice — second run finds 0 posts
- Run `npm run build` (if bundled) — must pass

### Cross-Story Context

- Requires story 6.2 (`send-stakeholder-review`) — either imports shared logic or invokes the function
- Coordinates with story 6.1 (DB schema for batch tables)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-67-weekly-auto-send]
- [Source: _bmad-output/planning-artifacts/prd.md#FR-026]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

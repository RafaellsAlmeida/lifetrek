# Story 5.2: Access and Audit Guardrails

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform owner,
I want sensitive operations protected and logged,
so that compliance and troubleshooting are reliable.

## Acceptance Criteria

1. **Given** unauthorized actor attempts sensitive write (e.g. bulk approve, delete content), **When** request is evaluated, **Then** operation is denied with 401/403.
2. **Given** authorized write succeeds, **When** audit logging runs, **Then** operation metadata (user, action, timestamp, content_id) is traceable.
3. **Given** admin review, **When** operation history is queried, **Then** key actions are discoverable via Supabase table or logs.

## Tasks / Subtasks

- [ ] Task 1: Verify RLS coverage on all content tables (AC: #1)
  - [ ] 1.1 Check `linkedin_carousels`, `instagram_posts`, `blog_posts`, `resources` tables — confirm RLS is enabled
  - [ ] 1.2 For any table missing RLS, apply a migration to enable it with an admin-only write policy
  - [ ] 1.3 Check `stakeholder_review_batches` and `stakeholder_review_tokens` — admin-only read/write policy per epic spec
  - [ ] 1.4 Verify service-role key usage in Edge Functions is deliberate and scoped (document in code comments where used)

- [ ] Task 2: Create `audit_log` table if not exists (AC: #2, #3)
  - [ ] 2.1 Create migration: `audit_log` table with columns: `id UUID PK`, `actor_id UUID nullable`, `action text`, `content_type text nullable`, `content_id UUID nullable`, `metadata jsonb nullable`, `created_at timestamptz DEFAULT now()`
  - [ ] 2.2 RLS: admin-read only; service-role writes only
  - [ ] 2.3 Add index on `(content_type, content_id)` and `created_at`

- [ ] Task 3: Log key admin actions to `audit_log` (AC: #2, #3)
  - [ ] 3.1 In `send-stakeholder-review` edge function — log `action='stakeholder_review_sent'` with batch_id
  - [ ] 3.2 In `stakeholder-review-action` edge function — log `action='stakeholder_approved'` or `'stakeholder_rejected'` with reviewer_email and item_id
  - [ ] 3.3 In content approval mutations (`useLinkedInPosts`, `useBlogPosts`) — add client-side audit note in mutation `onSuccess` that calls a lightweight `POST /api/audit` or just logs to Supabase `audit_log` via service-role if available

- [ ] Task 4: Guard admin-only Edge Functions (AC: #1)
  - [ ] 4.1 Verify all Edge Functions that mutate content call `await getUserFromRequest(req)` and check `role = 'admin'` before proceeding
  - [ ] 4.2 For those missing the check, add `if (!user || user.role !== 'admin') return new Response('Unauthorized', { status: 401 })`

## Dev Notes

### Scope Limitation

This story is about **verification and light reinforcement** of existing guardrails — not a full IAM implementation. Focus on:
1. Confirming RLS is on for all content tables
2. Creating `audit_log` if missing
3. Logging 2–3 key actions

### Files to Modify

- New migration: `supabase/migrations/YYYYMMDD_audit_log.sql`
- `supabase/functions/send-stakeholder-review/index.ts` — add audit log call
- `supabase/functions/stakeholder-review-action/index.ts` — add audit log call
- `supabase/functions/_shared/auth.ts` or equivalent — verify admin guard pattern

### Architecture Compliance

- Use `apply_migration` for DDL changes (new table, new RLS policies)
- No new backend frameworks — all in Supabase Edge Functions (Deno)
- `audit_log` uses service-role write only; never expose to anon key

### Testing Requirements

- Verify that attempting a content delete without admin session returns 401/403
- Verify that `audit_log` has a row after `send-stakeholder-review` runs
- Run `npm run build` — must pass

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-52-access-and-audit-guardrails]
- [Source: _bmad-output/planning-artifacts/prd.md#FR-018 NFR-006]
- [Source: _bmad-output/planning-artifacts/architecture.md#security-architecture]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

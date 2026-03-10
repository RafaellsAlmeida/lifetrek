# Story 6.1: DB Schema — Stakeholder Review Tables

Status: done

## Story

As a platform owner,
I want canonical tables for stakeholder review batches, tokens, and item statuses,
so that all approval state is persisted and auditable without relying on ephemeral logic.

## Acceptance Criteria

1. Given a valid admin session, when a batch is created, then a `stakeholder_review_batches` record is persisted with correct `sent_at` and `expires_at` values (7 days out).
2. Given two reviewers are configured, when a batch is created, then two `stakeholder_review_tokens` records exist with distinct tokens and the same `expires_at` as the batch.
3. Given N posts are included in a batch, when batch is created, then N `stakeholder_review_items` exist with `status = 'pending'` and correct `content_type` / `content_id` values.
4. Given unauthorized actor, when write to batch tables is attempted, then RLS denies the operation.
5. Given content tables (linkedin_carousels, instagram_posts, blog_posts), when queried for valid status values, then `stakeholder_review_pending`, `stakeholder_approved`, `stakeholder_rejected` are accepted by CHECK constraints.

## Tasks / Subtasks

- [ ] Create migration `20260310100000_stakeholder_review_schema.sql` (AC: 1, 2, 3, 4, 5)
  - [ ] Create `stakeholder_review_batches` table with columns, constraints, indexes
  - [ ] Create `stakeholder_review_tokens` table with UNIQUE token index
  - [ ] Create `stakeholder_review_items` table with content_type CHECK and indexes
  - [ ] Enable RLS on all three tables
  - [ ] Add admin + service_role policies (following `has_role(auth.uid(), 'admin')` pattern)
  - [ ] Drop and recreate status CHECK constraints on linkedin_carousels, instagram_posts, blog_posts to add new values
  - [ ] Verify migration is idempotent with IF NOT EXISTS guards

## Dev Notes

- Follow naming conventions from architecture doc: snake_case, plural table names.
- RLS pattern: `has_role(auth.uid(), 'admin')` for authenticated writes; `service_role` policy with `USING (true)` for edge function access.
- `stakeholder_review_tokens.token` is a UUID used as the magic-link key — must have a UNIQUE index.
- `copy_edits` jsonb schema differs by content type:
  - carousels/instagram: `{"caption":"...","slides":[{"index":0,"headline":"...","body":"..."}]}`
  - blog_posts: `{"title":"...","excerpt":"..."}`
- The new status values (`stakeholder_review_pending`, `stakeholder_approved`, `stakeholder_rejected`) must be added to the CHECK constraint on all three content tables WITHOUT removing existing values.
- Current CHECK values to preserve (from `20260210_fix_approval_constraints.sql`):
  - `linkedin_carousels`: `draft`, `pending_approval`, `approved`, `rejected`, `published`, `scheduled`, `archived`
  - `instagram_posts`: `draft`, `pending_approval`, `approved`, `rejected`, `published`, `scheduled`, `archived`
  - `blog_posts`: `draft`, `pending_review`, `approved`, `rejected`, `published`, `scheduled`, `archived`

### Project Structure Notes

- Migration file: `supabase/migrations/20260310100000_stakeholder_review_schema.sql`
- Types will auto-update next time `supabase gen types` is run — no manual edit to `src/integrations/supabase/types.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-61-db-schema--stakeholder-review-tables]
- [Source: _bmad-output/planning-artifacts/architecture.md#epic-6-architecture-extension]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Migration applied via MCP `apply_migration`. Tables verified present via SQL query.
Status constraints verified on all 3 content tables.

### Completion Notes List

- All 3 tables created with RLS enabled and correct policies
- UNIQUE index on `stakeholder_review_tokens.token` (primary lookup key)
- Status constraints on linkedin_carousels, instagram_posts, blog_posts extended to include stakeholder values — all existing values preserved
- `expires_at` on tokens requires explicit value at insert time (no default, since it must match the batch `expires_at`)

### File List

- `supabase/migrations/20260310100000_stakeholder_review_schema.sql`

## Senior Developer Review (AI)


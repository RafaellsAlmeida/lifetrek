# Story 5.2: Access and Audit Guardrails

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform owner,
I want sensitive operations protected and logged,
so that compliance and troubleshooting are reliable.

## Acceptance Criteria

1. **Given** unauthorized actor attempts sensitive write, **When** request is evaluated, **Then** operation is denied.
2. **Given** authorized write succeeds, **When** audit logging runs, **Then** operation metadata is traceable.
3. **Given** admin review, **When** operation history is queried, **Then** key actions are discoverable.

## Tasks / Subtasks

- [ ] Task 1: Create audit_log table (AC: #2, #3)
  - [ ] 1.1 Create migration with `audit_log` table:
    ```sql
    CREATE TABLE IF NOT EXISTS audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id UUID REFERENCES auth.users(id),
      actor_email TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id UUID,
      metadata JSONB DEFAULT '{}',
      ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
    CREATE INDEX idx_audit_log_action ON audit_log(action);
    CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
    CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
    ```
  - [ ] 1.2 RLS: admin read-only (no admin writes via client — writes come from service role in edge functions), service role full access
  - [ ] 1.3 Retention: add a comment noting that a cleanup cron can be added later for records older than 90 days (not implemented now — table will stay small at current scale)

- [ ] Task 2: Create shared audit logging utility (AC: #2)
  - [ ] 2.1 Create `supabase/functions/_shared/audit.ts` with:
    ```typescript
    interface AuditEntry {
      actor_id?: string;
      actor_email?: string;
      action: string;
      resource_type: string;
      resource_id?: string;
      metadata?: Record<string, unknown>;
      ip_address?: string;
    }
    export async function logAudit(client: SupabaseClient, entry: AuditEntry): Promise<void>
    ```
  - [ ] 2.2 Function should never throw — wrap in try/catch, log failure to console but don't break the calling operation
  - [ ] 2.3 Extract actor info from JWT when available: `const { data: { user } } = await client.auth.getUser()`
  - [ ] 2.4 Include request IP from `Deno.serve` request headers (`x-forwarded-for` or `x-real-ip`)

- [ ] Task 3: Add audit logging to sensitive edge functions (AC: #2)
  - [ ] 3.1 **Content approval actions** — log in existing approval edge functions or via Supabase triggers:
    - Action: `content.approve`, `content.reject`, `content.publish`
    - Resource type: `linkedin_carousel`, `instagram_post`, `blog_post`
    - Metadata: `{ status_from, status_to }`
  - [ ] 3.2 **Stakeholder review send** (`send-stakeholder-review`):
    - Action: `stakeholder.batch_send`
    - Metadata: `{ batch_id, item_count, reviewer_emails }`
  - [ ] 3.3 **Stakeholder review actions** (`stakeholder-review-action`):
    - Action: `stakeholder.approve`, `stakeholder.reject`, `stakeholder.edit_suggest`
    - Actor: reviewer email (not a user ID — stakeholders aren't in auth.users)
    - Metadata: `{ batch_id, item_id, content_type }`
  - [ ] 3.4 **Image operations** (`set-slide-background`, `regenerate-carousel-images`):
    - Action: `image.set_background`, `image.regenerate`
    - Metadata: `{ slide_index, asset_source }`
  - [ ] 3.5 **LinkedIn analytics upload** (if edge function exists):
    - Action: `analytics.csv_upload`
    - Metadata: `{ row_count, rejected_count }`

- [ ] Task 4: Verify RLS coverage on sensitive tables (AC: #1)
  - [ ] 4.1 Audit existing RLS policies on content tables — ensure all have `has_role(auth.uid(), 'admin')` for write operations:
    - `linkedin_carousels` — verify INSERT/UPDATE/DELETE policies
    - `instagram_posts` — verify
    - `blog_posts` — verify
    - `stakeholder_review_batches` — verify (created in Story 6.1)
    - `stakeholder_review_tokens` — verify
    - `stakeholder_review_items` — verify
  - [ ] 4.2 Check for tables that may have overly permissive policies:
    - `leads` — should be admin-only
    - `content_ideas` — should be admin-only
    - `knowledge_base` — should be admin-only
  - [ ] 4.3 Create a migration to fix any missing or overly permissive RLS policies found
  - [ ] 4.4 Document all RLS policies in a summary comment at the top of the migration

- [ ] Task 5: Add admin audit log viewer (AC: #3)
  - [ ] 5.1 Create a simple audit log viewer in admin — this can be a basic table/list, not a full feature:
    - Route: add to existing admin settings or as a sub-section of an existing admin page
    - Display: timestamp, actor email, action, resource type, resource ID
    - Filter: by action type, by date range (last 7/30/90 days)
    - Pagination: simple load-more (not complex pagination)
  - [ ] 5.2 Create React Query hook: `useAuditLog({ action?: string, days?: number, limit?: number })`
  - [ ] 5.3 Keep it minimal — this is an internal troubleshooting tool, not a user-facing feature

## Dev Notes

### Current Authorization Architecture

Authorization uses a multi-path check (from `set-slide-background/index.ts` pattern):
1. `admin_permissions` table — email-based
2. `admin_users` table — legacy user_id-based
3. `user_roles` table — role-based (graceful fallback if table missing)

The `has_role()` SQL function (migration `20260126180000_create_has_role.sql`) checks `admin_users` and `admin_permissions` — it's the canonical RLS gatekeeper.

### Audit Logging Philosophy

- **Fire-and-forget**: Audit logging must never block or fail the primary operation
- **Service role writes**: Client-side code never writes to `audit_log` — only edge functions with service role
- **Structured metadata**: JSONB allows flexible context without schema changes
- **No PII in metadata**: Store IDs and emails, not names or passwords

### Files to Create

- `supabase/migrations/YYYYMMDDHHMMSS_create_audit_log.sql`
- `supabase/functions/_shared/audit.ts`
- `src/hooks/useAuditLog.ts` (simple query hook)

### Files to Modify

- `supabase/functions/send-stakeholder-review/index.ts` — add audit logging
- `supabase/functions/stakeholder-review-action/index.ts` — add audit logging
- `supabase/functions/set-slide-background/index.ts` — add audit logging
- `supabase/functions/regenerate-carousel-images/index.ts` — add audit logging
- Admin page component (TBD) — add audit log viewer section

### What NOT to Do

- Do NOT create a complex audit dashboard — a simple filterable list is sufficient
- Do NOT log read operations — only writes and state changes
- Do NOT make audit logging synchronous/blocking — always fire-and-forget
- Do NOT store sensitive data in audit metadata (API keys, tokens, passwords)
- Do NOT add audit logging to high-frequency read paths — only mutating operations
- Do NOT change the `has_role()` function — it works correctly
- Do NOT add new authorization mechanisms — extend existing patterns

### Architecture Compliance

- **Naming:** snake_case for DB, camelCase for TS
- **Shared code:** `_shared/audit.ts` follows existing `_shared/` pattern
- **RLS:** admin read-only on `audit_log`, service role for writes
- **Performance:** Indexes on actor, action, resource, created_at for query efficiency
- **Brownfield:** Adds to existing edge functions, doesn't restructure them

### Testing Requirements

- Attempt unauthenticated write to `linkedin_carousels` → RLS denies
- Approve a post via admin → `audit_log` entry with `content.approve` action
- Send stakeholder review → `audit_log` entry with `stakeholder.batch_send`
- Stakeholder approves via token → `audit_log` entry with `stakeholder.approve`
- View audit log in admin → entries visible with correct filters
- Verify audit logging failure doesn't break the primary operation
- Run `npm run build` — must pass
- Run `npm run lint` — no new warnings

### Cross-Story Context

- **Story 4.2** (Unified Approval Queue): Added `approved_at`/`approved_by` columns — this story's audit logging provides the broader activity trail
- **Story 5.1** (Real Asset First): `asset_source` tracking is a form of audit — this story adds the formal audit log entry
- **Story 6.2/6.3** (done): Stakeholder functions already work — this story adds audit logging calls to them

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-52-access-and-audit-guardrails]
- [Source: _bmad-output/planning-artifacts/architecture.md — cross-cutting concerns lines 75-82]
- [Source: supabase/migrations/20260126180000_create_has_role.sql — authorization function]
- [Source: supabase/functions/set-slide-background/index.ts — auth pattern lines 39-92]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List


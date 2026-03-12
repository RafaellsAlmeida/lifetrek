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
4. **Given** function invocation fails (Resend error), **When** error is caught, **Then** function returns 500 with error logged; no partial batch is left in `sent` status (rollback or clear created records).

## Tasks / Subtasks

- [ ] Task 1: Create edge function scaffold (AC: #1, #2)
  - [ ] 1.1 Create `supabase/functions/weekly-stakeholder-send/index.ts`
  - [ ] 1.2 Standard Deno edge function structure with `Deno.serve()` handler
  - [ ] 1.3 Use `SUPABASE_SERVICE_ROLE_KEY` for DB access (cron invocations don't have user JWT)
  - [ ] 1.4 Create Supabase client with service role key: `createClient(SUPABASE_URL, SERVICE_ROLE_KEY)`
  - [ ] 1.5 Log function start: `console.log("weekly-stakeholder-send: starting", { timestamp: new Date().toISOString() })`

- [ ] Task 2: Query unsent approved posts (AC: #1, #2, #3)
  - [ ] 2.1 Query all content tables for posts with `status = 'approved'` (or `admin_approved` — match whatever status the manual flow uses, consistent with Story 6.6):
    ```sql
    -- LinkedIn carousels
    SELECT id FROM linkedin_carousels WHERE status = 'approved'
      AND id NOT IN (SELECT content_id FROM stakeholder_review_items WHERE content_type = 'linkedin_carousel')

    -- Instagram posts
    SELECT id FROM instagram_posts WHERE status = 'approved'
      AND id NOT IN (SELECT content_id FROM stakeholder_review_items WHERE content_type = 'instagram_post')

    -- Blog posts
    SELECT id FROM blog_posts WHERE status = 'approved'
      AND id NOT IN (SELECT content_id FROM stakeholder_review_items WHERE content_type = 'blog_post')
    ```
  - [ ] 2.2 Use Supabase client `.from().select().eq().not()` or raw SQL via `.rpc()` if the NOT IN subquery is complex with the JS client
  - [ ] 2.3 Combine results into `post_refs` array: `[{ content_type, content_id }]`
  - [ ] 2.4 If empty: log "No posts to send. Skipping." and return `{ status: 200, body: { message: "No posts to send" } }`

- [ ] Task 3: Invoke send logic (AC: #1, #3)
  - [ ] 3.1 Call `send-stakeholder-review` edge function internally. Two approaches:
    - **Option A (recommended)**: Extract shared send logic from `send-stakeholder-review/index.ts` into a shared handler that both functions import. This avoids an HTTP round-trip.
    - **Option B**: Make an HTTP call to the `send-stakeholder-review` function URL with a service-role JWT. Simpler but adds network hop.
  - [ ] 3.2 **For simplicity, use Option B**: Call the function via `fetch()`:
    ```typescript
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-stakeholder-review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_refs: postRefs,
        notes: `Envio automático semanal – ${new Date().toISOString().split('T')[0]}`,
      }),
    });
    ```
  - [ ] 3.3 The `send-stakeholder-review` function requires admin auth — verify that service role key is accepted as a valid admin token. If not, the function needs to also accept service role as authorized caller (add check for `SYSTEM_USER_ID` env var)
  - [ ] 3.4 Set `created_by` to `SYSTEM_USER_ID` (env var) for cron-triggered batches

- [ ] Task 4: Error handling and idempotency (AC: #3, #4)
  - [ ] 4.1 If the internal call to `send-stakeholder-review` fails, log the error with full context: `{ error, post_refs, timestamp }`
  - [ ] 4.2 Return 500 with error body: `{ error: "Weekly send failed", details: errorMessage }`
  - [ ] 4.3 The `send-stakeholder-review` function handles atomicity internally (batch + tokens + items created together). If it fails mid-way, the batch status indicates incomplete state
  - [ ] 4.4 The NOT IN query (Task 2) ensures idempotency: posts already in `stakeholder_review_items` from a manual send won't be included again

- [ ] Task 5: Register cron schedule (AC: #1)
  - [ ] 5.1 Add cron configuration to `supabase/config.toml` if supported, or document that cron must be registered in Supabase dashboard:
    - Function: `weekly-stakeholder-send`
    - Schedule: `0 11 * * 1` (every Monday at 11:00 UTC = 08:00 BRT)
  - [ ] 5.2 Add a comment in the function file documenting the expected cron schedule
  - [ ] 5.3 The function should also work when called manually (e.g., for testing) — no cron-specific dependencies

## Dev Notes

### Service Role Authentication

This function runs from a cron trigger, not from a user session. Key differences:
- No JWT from a logged-in user — use `SUPABASE_SERVICE_ROLE_KEY`
- `created_by` field on the batch should use `SYSTEM_USER_ID` env var (a UUID representing "system")
- The `send-stakeholder-review` function validates admin auth — when calling it internally, the service role key must be accepted. If the function checks `has_role()` against a user, add a bypass for service role or `SYSTEM_USER_ID`

### Idempotency Guarantee

The query `id NOT IN (SELECT content_id FROM stakeholder_review_items)` ensures:
- Posts already sent (manually or by previous cron) are excluded
- If cron runs twice (Supabase retry), the second run finds no posts and exits cleanly
- No need for external deduplication state

### Files to Create

- `supabase/functions/weekly-stakeholder-send/index.ts`

### Files to Potentially Modify

- `supabase/config.toml` — add function config if needed
- `supabase/functions/send-stakeholder-review/index.ts` — may need to accept service role key as valid auth (not just JWT from admin user)

### What NOT to Do

- Do NOT add a Redis lock or external dedup — the SQL NOT IN query handles idempotency
- Do NOT create a queue system — this is a simple weekly batch, not a high-throughput pipeline
- Do NOT poll or retry on Resend failure within the function — let it fail, log clearly, and the next Monday it retries naturally
- Do NOT hardcode reviewer emails — they're already handled by `send-stakeholder-review` via env vars
- Do NOT use `setInterval` or background workers — this is a Supabase cron-invoked edge function

### Architecture Compliance

- **Runtime:** Deno (Supabase Edge Function)
- **Auth:** Service role key, no user JWT
- **Cost:** No AI calls — only DB queries + HTTP call to sibling function. No cost tracker needed
- **Logging:** Console log with structured context for debugging cron runs
- **Naming:** snake_case function name (`weekly-stakeholder-send`)

### Testing Requirements

- Call function manually with approved posts in DB → batch created, emails sent
- Call function with no approved posts → returns 200 with "No posts to send"
- Call function after manual send covered all posts → returns 200, no duplicate batch
- Call function when `send-stakeholder-review` returns error → returns 500 with logged error
- Verify `SYSTEM_USER_ID` is used as `created_by` on the batch
- Verify notes contain "Envio automático semanal" + date
- Run `npm run build` — must pass (edge functions build separately but check for type errors)

### Cross-Story Context

- **Story 6.2** (done): `send-stakeholder-review` — the function this story calls internally
- **Story 6.6** (Manual Send Trigger): The manual alternative. Both use the same `send-stakeholder-review` backend, ensuring consistency
- **Story 6.4** (Public Review Page): Stakeholders receive emails linking to the review page — same flow whether triggered manually or by cron

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-67-weekly-auto-send-scheduled-function]
- [Source: _bmad-output/planning-artifacts/architecture.md#cron-schedule]
- [Source: supabase/functions/send-stakeholder-review/index.ts — shared send logic]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List


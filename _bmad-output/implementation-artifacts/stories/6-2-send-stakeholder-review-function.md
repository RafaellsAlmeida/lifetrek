# Story 6.2 + 6.3: send-stakeholder-review + stakeholder-review-action Functions

Status: done

## Stories Merged

Story 6.2 (send-stakeholder-review) and Story 6.3 (stakeholder-review-action public endpoint)
were implemented together as they share types and token validation logic.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- `send-stakeholder-review`: JWT + admin auth, fetches post data, creates batch/tokens/items,
  updates content status to `stakeholder_review_pending`, builds per-reviewer HTML email,
  sends via Resend to both stakeholders
- `stakeholder-review-action`: public endpoint (verify_jwt=false), token-based auth with
  7-day expiry, handles GET (approve/reject form) and POST (reject submit / edit_suggest)
- HTML email uses table-based layout for email-client compatibility (no flexbox)
- Action URLs embed `apikey` query param so browser clicks work without auth headers
- First-approval-wins logic: `trySetContentApproved` skips if content already approved
- Rejection does not downgrade content already approved by another reviewer
- `fetch` action returns full batch JSON for the public review page (Story 6.4)
- `verify_jwt = false` registered in `supabase/config.toml` for `stakeholder-review-action`

### File List

- `supabase/functions/send-stakeholder-review/index.ts`
- `supabase/functions/stakeholder-review-action/index.ts`
- `supabase/config.toml` (added verify_jwt = false for stakeholder-review-action)

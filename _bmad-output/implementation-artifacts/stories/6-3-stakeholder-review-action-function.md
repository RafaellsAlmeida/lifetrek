# Story 6.3: `stakeholder-review-action` Public Edge Function

Status: done

## Story

As a stakeholder,
I want my approval, rejection, or copy-edit submitted securely without logging in,
So that reviewing content is frictionless and requires only clicking a link in email.

## Acceptance Criteria

1. **Given** valid token and `action=approve`, **When** GET fires, **Then** item status becomes `approved`, content status becomes `stakeholder_approved`, and reviewer sees PT-BR thank-you page.
2. **Given** valid token and `action=reject`, **When** GET fires, **Then** reviewer is presented with a comment form; on submit, item status becomes `rejected` with stored comment.
3. **Given** other reviewer already approved, **When** second reviewer rejects, **Then** content status remains `stakeholder_approved` (first approval wins).
4. **Given** expired token, **When** GET fires, **Then** HTML page explains expiry; no DB state changes.
5. **Given** same token used for approve twice, **When** second GET fires, **Then** function is idempotent (no duplicate updates, informational page returned).

## Dev Agent Record

### Agent Model Used

BMAD Doc Lane Agent (Scaffold)

### Completion Notes List

- This story file was scaffolded automatically because it was marked `done` in `sprint-status.yaml` but the file was missing from the repository. Note: Validation of the actual implementation in `supabase/functions/stakeholder-review-action/index.ts` is recommended.

### File List

- supabase/functions/stakeholder-review-action/index.ts

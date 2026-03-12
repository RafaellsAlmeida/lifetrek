# Story 6.6: Admin Manual Send Trigger ("Enviar para Aprovação")

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Rafael (admin),
I want to select admin-approved posts in the Content Approval page and send them for stakeholder review with one action,
so that I control exactly which posts go out and when.

## Acceptance Criteria

1. **Given** posts with `admin_approved` status, **When** checkboxes are selected, **Then** floating action bar shows with count and send button.
2. **Given** send modal is open, **When** confirm is clicked, **Then** edge function is called; loading state is shown; success toast appears on completion.
3. **Given** send succeeds, **When** modal closes, **Then** selected posts update to `stakeholder_review_pending` status in the UI (React Query invalidation).
4. **Given** send fails, **When** error is returned, **Then** modal stays open with error message; no status change on posts.
5. **Given** Rafael adds optional notes, **When** batch is sent, **Then** notes are persisted in `stakeholder_review_batches.notes`.

## Tasks / Subtasks

- [ ] Task 1: Add checkbox selection to approved posts (AC: #1)
  - [ ] 1.1 In `ContentApprovalCore.tsx`, add a checkbox to each post card when viewing the "approved" tab (existing `approved` status filter)
  - [ ] 1.2 Also show checkboxes for posts with `status = 'admin_approved'` if that status exists — NOTE: check current status flow. The existing approval sets `status = 'approved'`. If `admin_approved` is not a separate DB status, use `approved` as the selectable status
  - [ ] 1.3 Track selected post IDs in local state: `useState<Set<string>>()` with `content_type` and `content_id` pairs
  - [ ] 1.4 "Selecionar todos" checkbox in the tab header to toggle all visible posts
  - [ ] 1.5 Clear selection when switching tabs

- [ ] Task 2: Build floating action bar (AC: #1)
  - [ ] 2.1 When `selectedPosts.size > 0`, render a fixed-bottom bar (z-50, shadow-lg, white background):
    - Left: "{N} posts selecionados"
    - Right: "Enviar para Aprovação dos Stakeholders" button (Corporate Blue `bg-primary`, white text)
  - [ ] 2.2 Bar animates in from bottom (Tailwind `transition-transform`)
  - [ ] 2.3 Bar disappears when selection is cleared
  - [ ] 2.4 "Limpar seleção" text button on the left side

- [ ] Task 3: Create SendReviewModal component (AC: #2, #4, #5)
  - [ ] 3.1 Create `src/components/admin/content/SendReviewModal.tsx`
  - [ ] 3.2 Modal content:
    - Heading: "Enviar para Aprovação dos Stakeholders"
    - Summary: "Enviar {N} posts para:"
    - Reviewer list with checkmarks: "rbianchini@lifetrek-medical.com ✓" and "njesus@lifetrek-medical.com ✓" (read-only — reviewers are fixed)
    - Post list: thumbnail + content type badge + topic/title for each selected post (non-editable, scrollable if many)
    - Notes textarea: label "Adicionar nota para os revisores (opcional)", placeholder "Ex: Priorizar os posts de LinkedIn esta semana..."
    - Footer: "Cancelar" (ghost button) + "Confirmar envio" (primary button)
  - [ ] 3.3 Use existing Dialog/Sheet component from `src/components/ui/` (shadcn pattern)
  - [ ] 3.4 Props: `open: boolean`, `onOpenChange: (open: boolean) => void`, `selectedPosts: Array<{ content_type: string; content_id: string; title: string; thumbnail_url?: string }>`, `onSuccess: () => void`

- [ ] Task 4: Implement send mutation (AC: #2, #3, #4, #5)
  - [ ] 4.1 On "Confirmar envio" click: call `send-stakeholder-review` edge function via Supabase client `supabase.functions.invoke('send-stakeholder-review', { body: { post_refs, notes } })`
  - [ ] 4.2 Build `post_refs` array from selected posts: `[{ content_type: "linkedin_carousel", content_id: "uuid" }, ...]`
  - [ ] 4.3 Map content types correctly: the selection tracks types as used in the UI (e.g., "linkedin", "blog") but the edge function expects `"linkedin_carousel"`, `"instagram_post"`, `"blog_post"` — ensure correct mapping
  - [ ] 4.4 Loading state: disable "Confirmar envio" button, show spinner, text changes to "Enviando..."
  - [ ] 4.5 On success: close modal, show toast "Email enviado com sucesso para 2 revisores. ({N} posts)", clear selection, invalidate React Query keys (`content-approval-items`, `approved-content-items`)
  - [ ] 4.6 On error: keep modal open, show error in red callout inside modal (below post list), parse error from function response (e.g., "Post {id} has no copy. Generate caption before sending.")
  - [ ] 4.7 Notes are included in the request body only if non-empty

- [ ] Task 5: Handle status mapping (AC: #1, #3)
  - [ ] 5.1 Verify the current approval flow: when Rafael clicks "Aprovar" in admin, what status is set? If it's `approved` (not `admin_approved`), then the send flow should work with `approved` status
  - [ ] 5.2 The `send-stakeholder-review` edge function validates `status = 'admin_approved'` on each post — **check this**: if the function expects `admin_approved` but admin sets `approved`, we need to either:
    - (a) Update the edge function to accept `approved` OR
    - (b) Add an `admin_approved` status to the content tables and update the approval flow
  - [ ] 5.3 **Recommended**: Check the edge function source. If it checks for `approved` (not `admin_approved`), this task is a no-op. If it checks `admin_approved`, update it to check `approved` since that's what the existing admin flow sets
  - [ ] 5.4 After send, posts transition to `stakeholder_review_pending` (handled by edge function, not UI)

## Dev Notes

### Edge Function Contract

The `send-stakeholder-review` edge function (Story 6.2, already implemented) expects:

```json
POST /functions/v1/send-stakeholder-review
Authorization: Bearer <jwt>

{
  "post_refs": [
    { "content_type": "linkedin_carousel", "content_id": "uuid" },
    { "content_type": "blog_post", "content_id": "uuid" }
  ],
  "notes": "optional batch note"
}
```

Returns on success:
```json
{ "data": { "batch_id": "uuid", "sent_to": ["email1", "email2"], "item_count": 3 } }
```

Returns on error:
```json
{ "error": "Post {id} has no copy. Generate caption before sending." }
```

### Content Type Mapping

The UI uses short names but the edge function uses full names:
- `"linkedin"` → `"linkedin_carousel"`
- `"instagram"` → `"instagram_post"`
- `"blog"` → `"blog_post"`
- `"resource"` → not applicable (resources don't go through stakeholder review)

### Files to Create

- `src/components/admin/content/SendReviewModal.tsx`

### Files to Modify

- `src/components/admin/content/ContentApprovalCore.tsx` — add checkboxes, selection state, floating bar, modal trigger
- `supabase/functions/send-stakeholder-review/index.ts` — potentially update status check if it expects `admin_approved` instead of `approved`

### What NOT to Do

- Do NOT allow selecting posts from non-approved tabs — checkboxes only appear for `approved` status posts
- Do NOT allow editing the reviewer list — it's fixed (from env vars in edge function)
- Do NOT send individual emails per post — the edge function handles batching
- Do NOT bypass the edge function — always call `send-stakeholder-review`, don't directly update DB status
- Do NOT add a separate page for this — integrate into existing ContentApprovalCore

### Architecture Compliance

- **Naming:** PascalCase for `SendReviewModal`, camelCase for handlers
- **Styling:** Tailwind + shadcn Dialog component
- **State:** Local `useState` for selection, React Query for data mutations
- **Language:** All visible text in PT-BR
- **Brownfield:** Extend `ContentApprovalCore.tsx`, reuse existing card layout

### Testing Requirements

- View "Aprovado" tab → checkboxes visible on each card
- Select 2 posts → floating bar shows "2 posts selecionados" + send button
- Click send → modal opens with correct post summary and reviewer emails
- Add notes → click confirm → loading state → success toast → posts move to "Em revisão" tab
- If edge function returns error → modal stays open with error message
- Select all → deselect one → count updates correctly
- Switch tabs → selection clears
- Run `npm run build` — must pass
- Run `npm run lint` — no new warnings

### Cross-Story Context

- **Story 6.2** (done): `send-stakeholder-review` edge function — the backend this story calls
- **Story 6.4** (Public Review Page): Stakeholders receive email with links to that page. This story triggers the email send.
- **Story 6.5** (Admin Stakeholder Status): Shows results after stakeholders review. Can be built in parallel.
- **Story 6.7** (Weekly Auto-Send): Automatic alternative to this manual trigger. Independent.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-66-admin-manual-send-trigger]
- [Source: _bmad-output/planning-artifacts/architecture.md#frontend-architecture-addition]
- [Source: supabase/functions/send-stakeholder-review/index.ts — request payload and response contract]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List


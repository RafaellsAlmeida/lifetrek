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

- [ ] Task 1: Add checkbox selection to admin_approved post cards (AC: #1)
  - [ ] 1.1 In `ContentApprovalCore.tsx`, when viewing "Aprovado" tab (admin_approved), add a checkbox to each post card (top-left corner)
  - [ ] 1.2 Manage selection state with `useState<Set<string>>(new Set())` for selected post IDs
  - [ ] 1.3 "Selecionar todos" link at top of list when in this tab

- [ ] Task 2: Floating action bar (AC: #1)
  - [ ] 2.1 When selection set has ≥1 post: render a fixed bottom bar:
    ```
    [X posts selecionados] [Enviar para Aprovação ↗]
    ```
  - [ ] 2.2 Bar uses `fixed bottom-0 left-0 right-0` with Corporate Blue background, white text
  - [ ] 2.3 "Enviar para Aprovação" opens `SendReviewModal`

- [ ] Task 3: Create `SendReviewModal` component (AC: #2, #3, #4, #5)
  - [ ] 3.1 Create `src/components/admin/content/SendReviewModal.tsx`
  - [ ] 3.2 Modal contents:
    - Title: "Enviar para Aprovação"
    - Summary: "Enviar [N] posts para:"
      - ✓ rbianchini@lifetrek-medical.com
      - ✓ njesus@lifetrek-medical.com
    - Post list: thumbnail + type badge per post (non-editable)
    - Optional notes textarea: "Adicionar nota para os revisores (opcional)"
    - Buttons: "Cancelar" (ghost) + "Confirmar envio" (primary/blue)
  - [ ] 3.3 On confirm: call `send-stakeholder-review` edge function with `post_refs` and `notes`
  - [ ] 3.4 Show loading spinner during call
  - [ ] 3.5 On success: show `toast.success("Email enviado com sucesso para 2 revisores.")`, close modal, invalidate React Query for affected posts
  - [ ] 3.6 On error: show error message inside modal, keep modal open, no status change

- [ ] Task 4: Wire up React Query invalidation (AC: #3)
  - [ ] 4.1 After successful send, call `queryClient.invalidateQueries(['linkedin-posts'])` (and blog/instagram equivalents)
  - [ ] 4.2 Affected posts should now show `stakeholder_review_pending` in the UI

## Dev Notes

### Files to Create/Modify

**New files:**
- `src/components/admin/content/SendReviewModal.tsx`

**Modified files:**
- `src/components/admin/content/ContentApprovalCore.tsx` — checkbox column + floating bar + modal trigger

### Edge Function Call

```typescript
const { data, error } = await supabase.functions.invoke('send-stakeholder-review', {
  body: {
    post_refs: selectedPosts.map(p => ({ content_type: p.type, content_id: p.id })),
    notes: notes || undefined,
  }
});
```

### Architecture Compliance

- Use existing `Dialog` from `@/components/ui/dialog` for modal
- Use `sonner` toasts
- Tailwind only for styling
- PT-BR all user-facing text
- Floating bar must not overlap modal — use z-index management

### Testing Requirements

- Select 2 posts in "Aprovado" tab — floating bar shows "2 posts selecionados"
- Open modal — reviewer emails listed, post list shown
- Confirm send (with mocked edge fn) — posts move to "Em revisão" tab
- Send fails — modal stays open with error
- Optional notes textarea — notes persisted in batch
- Run `npm run build` — must pass

### Cross-Story Context

- Requires story 6.2 (`send-stakeholder-review` edge function) to exist
- Coordinates with story 6.5 (both modify `ContentApprovalCore.tsx`)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-66-admin-manual-send-trigger]
- [Source: _bmad-output/planning-artifacts/prd.md#FR-025]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

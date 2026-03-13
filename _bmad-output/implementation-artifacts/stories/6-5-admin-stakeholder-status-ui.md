# Story 6.5: Admin Content Approval — Stakeholder Status & Copy Suggestions

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin operator,
I want to see stakeholder review status for each post in the Content Approval page, and apply or dismiss copy-edit suggestions,
so that I can act on stakeholder feedback before publishing.

## Acceptance Criteria

1. **Given** posts with `stakeholder_review_pending` status, **When** "Em revisão" tab is selected, **Then** those posts appear with reviewer status shown.
2. **Given** a post with `copy_edits` set, **When** card is expanded, **Then** diff between original and suggested copy is visible.
3. **Given** Rafael clicks "Aplicar sugestão", **When** mutation succeeds, **Then** content record is updated with suggested text and suggestion is cleared.
4. **Given** a post is `stakeholder_approved`, **When** viewed in admin, **Then** reviewer email and approval timestamp are shown.
5. **Given** a post is `stakeholder_rejected`, **When** viewed in admin, **Then** rejection comment is displayed in a clearly styled callout.

## Tasks / Subtasks

- [ ] Task 1: Create `useStakeholderReview` hook (AC: #1, #2, #4, #5)
  - [ ] 1.1 Create `src/hooks/useStakeholderReview.ts`
  - [ ] 1.2 Export `useStakeholderReviewItems(contentType: string, contentId: string)` — queries `stakeholder_review_items` for the given post
  - [ ] 1.3 Export `useApplyCopyEditSuggestion(itemId: string)` — mutation that applies `copy_edits` to content record and clears suggestion from item

- [ ] Task 2: Add new status filter tabs to `ContentApprovalCore.tsx` (AC: #1)
  - [ ] 2.1 Add tab: "Em revisão" — filters `status = 'stakeholder_review_pending'`
  - [ ] 2.2 Add tab: "Aprovado ✓" — filters `status = 'stakeholder_approved'`
  - [ ] 2.3 Add tab: "Rejeitado" — filters `status = 'stakeholder_rejected'`
  - [ ] 2.4 Add tab: "Sugestões" — filters by posts that have `stakeholder_review_items` with `status = 'edit_suggested'`
  - [ ] 2.5 Keep all existing tabs unchanged

- [ ] Task 3: Add stakeholder review info to post card expanded view (AC: #2, #3, #4, #5)
  - [ ] 3.1 In post card expanded state: show stakeholder review status badge
  - [ ] 3.2 If `stakeholder_approved`: show "Aprovado por [email] em [date]" in green
  - [ ] 3.3 If `stakeholder_rejected`: show "Rejeitado por [email]" + reviewer_comment in a `bg-destructive/10` callout
  - [ ] 3.4 If `edit_suggested`: show copy_edits diff — original vs suggestion side-by-side (or stacked on small screens)
  - [ ] 3.5 "Aplicar sugestão" button → calls `useApplyCopyEditSuggestion`, shows success toast
  - [ ] 3.6 "Descartar" button → calls a mutation to clear `copy_edits` on the item (set to null), show toast

- [ ] Task 4: Update content queries to include stakeholder status (AC: #1, #4, #5)
  - [ ] 4.1 Confirm `useLinkedInPosts`, `useBlogPosts`, `useInstagramPosts` fetch `status` field — they should already
  - [ ] 4.2 Add the new status values (`stakeholder_review_pending`, `stakeholder_approved`, `stakeholder_rejected`) to any TypeScript type unions that gate status filtering

## Dev Notes

### Files to Modify

**New files:**
- `src/hooks/useStakeholderReview.ts`

**Modified files:**
- `src/components/admin/content/ContentApprovalCore.tsx` — new tabs + expanded card sections
- `src/hooks/useLinkedInPosts.ts` — possibly extend type for new status values
- `src/hooks/useBlogPosts.ts` — same

### Diff View Pattern

Use a simple two-column approach:
```tsx
<div className="grid grid-cols-2 gap-2 text-sm">
  <div className="bg-red-50 p-2 rounded"><p className="text-red-700 font-medium">Original</p><p>{original}</p></div>
  <div className="bg-green-50 p-2 rounded"><p className="text-green-700 font-medium">Sugestão</p><p>{suggestion}</p></div>
</div>
```

### Architecture Compliance

- Follow existing hook patterns in `src/hooks/`
- Use `sonner` for toasts
- Tailwind only for styling
- PT-BR all user-facing text
- Use `cn()` for conditional classes

### Testing Requirements

- Filter by "Em revisão" — shows posts with `stakeholder_review_pending`
- Expand a post with `copy_edits` — diff view renders correctly
- Click "Aplicar sugestão" — content is updated, suggestion cleared
- Filter by "Aprovado ✓" — shows reviewer email + timestamp
- Filter by "Rejeitado" — shows rejection comment
- Run `npm run build` — must pass

### Cross-Story Context

- Requires stories 6.1–6.3 for backend state to exist
- Coordinates with story 6.6 (manual send trigger lives on the same `ContentApprovalCore.tsx`)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-65-admin-stakeholder-status]
- [Source: _bmad-output/planning-artifacts/prd.md#FR-024 FR-027]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

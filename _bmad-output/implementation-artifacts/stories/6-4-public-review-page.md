# Story 6.4: Public Review Page `/review/[token]`

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a stakeholder,
I want a web page where I can see all posts in my review batch, approve, reject with a comment, or suggest copy edits,
so that I can give detailed feedback without needing an admin account.

## Acceptance Criteria

1. **Given** valid token, **When** page loads, **Then** all batch items render with correct content type, thumbnail, and caption.
2. **Given** stakeholder clicks Aprovar, **When** API call succeeds, **Then** card updates to "Aprovado" state without page reload.
3. **Given** stakeholder clicks Editar cópia, **When** they submit changes, **Then** `copy_edits` is stored in DB and item `status = 'edit_suggested'`.
4. **Given** expired token, **When** page loads, **Then** user sees expiry message in PT-BR with no post data exposed.
5. **Given** mobile screen width, **When** page renders, **Then** post cards are readable and action buttons are tappable without horizontal scroll.

## Tasks / Subtasks

- [ ] Task 1: Add public route to App.tsx (AC: #1, #4)
  - [ ] 1.1 In `src/App.tsx`, add a new public route: `/review/:token` → `<StakeholderReviewPage />`
  - [ ] 1.2 Route must NOT be wrapped in `ProtectedAdminRoute`
  - [ ] 1.3 The route component is lazy-loaded

- [ ] Task 2: Create `StakeholderReviewPage` component (AC: #1, #2, #3, #4, #5)
  - [ ] 2.1 Create file: `src/pages/StakeholderReview/StakeholderReviewPage.tsx`
  - [ ] 2.2 On mount, fetch from `stakeholder-review-action?token={token}&action=fetch`
  - [ ] 2.3 Display reviewer name and expiry info at top
  - [ ] 2.4 Progress bar: "X de N posts revisados"
  - [ ] 2.5 If token expired/invalid: show PT-BR error page ("Este link expirou. Peça a Rafael um novo envio.")
  - [ ] 2.6 For each item, render a card with:
    - Content type badge (LinkedIn / Instagram / Blog Post)
    - Thumbnail (first slide image or blog hero, 120x120px)
    - Caption (read-only, italic)
    - Slide headlines list (for carousels)
    - If `status !== 'pending'`: show locked "Já revisado" badge, no actions
    - Action row:
      - "✅ Aprovar" button → calls approve action, updates card state
      - "❌ Rejeitar" button → expands inline comment form, on submit calls reject
      - "✏️ Editar cópia" button → expands inline editor for caption + slides

- [ ] Task 3: Add `action=fetch` endpoint to `stakeholder-review-action` Edge Function (AC: #1)
  - [ ] 3.1 In `supabase/functions/stakeholder-review-action/index.ts`, handle `action=fetch`
  - [ ] 3.2 Validate token, return batch items with content details (type, title, caption, thumbnail_url, slides)
  - [ ] 3.3 Response format:
    ```json
    {
      "data": {
        "reviewer_name": "Rodrigo",
        "expires_at": "...",
        "items": [{ "item_id": "...", "content_type": "...", "status": "pending", "title": "...", "caption": "...", "thumbnail_url": "...", "slides": [...] }]
      }
    }
    ```

- [ ] Task 4: Add `action=edit_suggest` POST endpoint (AC: #3)
  - [ ] 4.1 Handle POST to `stakeholder-review-action` with `action=edit_suggest`
  - [ ] 4.2 Validate token, store `copy_edits` in `stakeholder_review_items`, set `status = 'edit_suggested'`
  - [ ] 4.3 Return 200 with `{ data: { success: true } }`

- [ ] Task 5: Mobile-responsive styling (AC: #5)
  - [ ] 5.1 Cards use flex-col on small screens
  - [ ] 5.2 Action buttons are at least 44px tall (tappable)
  - [ ] 5.3 Caption text is `text-sm` min to remain readable

## Dev Notes

### Branding Requirements

- Lifetrek logo top-right (white on Corporate Blue `#004F8F` header)
- All copy in PT-BR
- Mobile-first layout with Tailwind utilities

### Files to Create/Modify

**New files:**
- `src/pages/StakeholderReview/StakeholderReviewPage.tsx`

**Modified files:**
- `src/App.tsx` — add public `/review/:token` route
- `supabase/functions/stakeholder-review-action/index.ts` — add `fetch` and `edit_suggest` actions

### Architecture Compliance

- Use `@/` path alias
- Components in kebab-case files if extracted
- Tailwind only for styling
- All PT-BR user-facing text
- Token validation uses service-role key in edge function; never expose token validation on frontend

### Testing Requirements

- Navigate to `/review/{valid-token}` — items load correctly
- Click Aprovar on first item — card shows "Aprovado" without reload
- Click Editar cópia, fill caption, submit — DB `copy_edits` field is populated
- Navigate to `/review/{expired-token}` — expiry message shown, no data
- Open on mobile viewport (375px) — no horizontal scroll
- Run `npm run build` — must pass

### Cross-Story Context

- Story 6.2 creates the `stakeholder-review-action` edge function — this story adds `fetch` and `edit_suggest` actions to it
- Stories 6.1–6.3 must be `done` for this story to be fully testable end-to-end

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-64-public-review-page]
- [Source: _bmad-output/planning-artifacts/prd.md#FR-022 FR-023 FR-024]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

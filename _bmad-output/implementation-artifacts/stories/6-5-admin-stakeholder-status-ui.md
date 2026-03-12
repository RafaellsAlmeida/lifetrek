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
  - [ ] 1.2 `useStakeholderReviewItems(contentType: string, contentId: string)` — React Query hook that queries `stakeholder_review_items` joined with `stakeholder_review_batches` for a given content record. Returns items with `reviewed_by_email`, `reviewer_comment`, `copy_edits`, `reviewed_at`, `status`
  - [ ] 1.3 `useApplyCopyEditSuggestion()` — mutation that:
    1. Reads `copy_edits` from the `stakeholder_review_items` record
    2. Updates the content table (linkedin_carousels/instagram_posts/blog_posts) with the suggested copy fields
    3. Clears `copy_edits` on the review item (set to null)
    4. Sets review item `status` to `approved` (suggestion applied = approval)
    5. Invalidates React Query keys: `content-approval-items`, `stakeholder-review-items`
  - [ ] 1.4 `useDismissCopyEditSuggestion()` — mutation that clears `copy_edits` on the review item without changing content. Sets review item `status` back to `pending` so it can be re-reviewed
  - [ ] 1.5 Query key pattern: `["stakeholder-review-items", contentType, contentId]`

- [ ] Task 2: Add stakeholder status filter tabs (AC: #1)
  - [ ] 2.1 In `ContentApprovalCore.tsx`, add new tabs to the existing tab set:
    - "Em revisão" → filters posts where `status = 'stakeholder_review_pending'`
    - "Aprovado (Stakeholder)" → filters `status = 'stakeholder_approved'`
    - "Rejeitado (Stakeholder)" → filters `status = 'stakeholder_rejected'`
  - [ ] 2.2 Update the `useContentApprovalItems()` hook (or equivalent data-fetching logic) to include these new status values in queries
  - [ ] 2.3 Tab badges: "Em revisão" gets yellow badge, "Aprovado (Stakeholder)" gets green, "Rejeitado (Stakeholder)" gets red
  - [ ] 2.4 These tabs are additive — do NOT remove or modify existing tabs

- [ ] Task 3: Add stakeholder status badge to post cards (AC: #1, #4, #5)
  - [ ] 3.1 When a post has `status` in `['stakeholder_review_pending', 'stakeholder_approved', 'stakeholder_rejected']`, show a secondary status badge on the card:
    - `stakeholder_review_pending`: yellow badge "Em revisão pelos stakeholders"
    - `stakeholder_approved`: green badge "Aprovado por {reviewer_email}" + timestamp
    - `stakeholder_rejected`: red badge "Rejeitado por {reviewer_email}" + timestamp
  - [ ] 3.2 Fetch reviewer info via `useStakeholderReviewItems()` when card is expanded (lazy load — don't fetch for every card in the list)
  - [ ] 3.3 For rejected posts: show `reviewer_comment` in a styled callout block (rose background, left border)

- [ ] Task 4: Build copy edit suggestion diff view (AC: #2, #3)
  - [ ] 4.1 When expanded card has a review item with non-null `copy_edits`, show a "Sugestões de edição" section
  - [ ] 4.2 Display diff: show original text and suggested text side-by-side (desktop) or stacked (mobile)
    - For carousels: compare `caption` (original vs suggested) + per-slide `headline`/`body` changes
    - For blog posts: compare `title` and `excerpt`
    - Highlight differences with green background for additions, red strikethrough for removals (simple word-level diff, not character-level — keep it readable)
  - [ ] 4.3 "Aplicar sugestão" button (green, `bg-accent`) — calls `useApplyCopyEditSuggestion` mutation
  - [ ] 4.4 "Descartar sugestão" button (gray, `bg-muted`) — calls `useDismissCopyEditSuggestion` mutation
  - [ ] 4.5 Loading state on buttons while mutation runs
  - [ ] 4.6 Success toast: "Sugestão aplicada com sucesso" / "Sugestão descartada"

- [ ] Task 5: Update publish flow for stakeholder-approved posts (AC: #4)
  - [ ] 5.1 Posts with `stakeholder_approved` status should show a "Publicar" button (same as existing publish flow)
  - [ ] 5.2 The publish mutation should transition `stakeholder_approved → published` — verify existing `usePublishLinkedInPost`, `usePublishBlogPost` hooks handle this status as a valid source state
  - [ ] 5.3 If existing hooks only check for `approved` status before publishing, update them to also accept `stakeholder_approved`

## Dev Notes

### Data Model

The `stakeholder_review_items` table (created in Story 6.1) contains:
- `content_type`: `'linkedin_carousel' | 'instagram_post' | 'blog_post'`
- `content_id`: UUID referencing the content record
- `status`: `'pending' | 'approved' | 'rejected' | 'edit_suggested'`
- `reviewed_by_email`: email of the reviewer who acted
- `reviewer_comment`: text comment (for rejections)
- `copy_edits`: JSONB — `{ caption: "...", slides: [...] }` for carousels, `{ title: "...", excerpt: "..." }` for blogs
- `reviewed_at`: timestamp

### Applying Copy Edits

When "Aplicar sugestão" is clicked, the mutation should update:

**For LinkedIn carousels:**
```typescript
// Update caption
await supabase.from('linkedin_carousels').update({ caption: copyEdits.caption }).eq('id', contentId);
// Update slide text (slides is JSONB array — update individual slide headline/body)
// Fetch current slides, merge suggested changes, update full slides array
```

**For blog posts:**
```typescript
await supabase.from('blog_posts').update({
  title: copyEdits.title,
  excerpt: copyEdits.excerpt,
}).eq('id', contentId);
```

### Files to Create

- `src/hooks/useStakeholderReview.ts`

### Files to Modify

- `src/components/admin/content/ContentApprovalCore.tsx` — add tabs, badges, diff view, action buttons
- `src/hooks/useLinkedInPosts.ts` — update `usePublishLinkedInPost` to accept `stakeholder_approved` as valid source status (if needed)
- `src/hooks/useBlogPosts.ts` — same for `usePublishBlogPost`
- `src/hooks/useInstagramPosts.ts` — same for `usePublishInstagramPost`

### What NOT to Do

- Do NOT create a separate page for stakeholder review management — integrate into existing ContentApprovalCore
- Do NOT fetch stakeholder review items for every card in the list view — only fetch when card is expanded (performance)
- Do NOT implement a full text diff library — simple side-by-side comparison is sufficient. Use basic string comparison with highlighted sections
- Do NOT change the approval state machine — content status transitions are enforced by edge functions, not the admin UI
- Do NOT remove or modify existing tab behavior — stakeholder tabs are additive

### Architecture Compliance

- **Naming:** camelCase for hooks, PascalCase for components
- **Styling:** Tailwind only, `cn()` for conditional classes
- **State:** React Query for all server data, mutations with optimistic invalidation
- **Language:** All UI labels in PT-BR
- **Brownfield:** Extend `ContentApprovalCore.tsx` — do not restructure

### Testing Requirements

- Filter by "Em revisão" → shows only `stakeholder_review_pending` posts
- Expand a post with copy edits → diff view renders with original and suggested text
- Click "Aplicar sugestão" → content updates, suggestion clears, success toast
- Click "Descartar sugestão" → suggestion clears without content change
- View `stakeholder_approved` post → reviewer email and timestamp shown
- View `stakeholder_rejected` post → rejection comment in styled callout
- Publish a `stakeholder_approved` post → transitions to `published`
- Run `npm run build` — must pass
- Run `npm run lint` — no new warnings

### Cross-Story Context

- **Story 6.1** (done): DB schema with `stakeholder_review_items` table
- **Story 6.2/6.3** (done): Edge functions that create review items and handle stakeholder actions
- **Story 6.4** (Public Review Page): Where stakeholders submit their reviews — independent, can be built in parallel
- **Story 6.6** (Manual Send Trigger): Sends posts for review — the trigger that creates the review items this story displays

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-65-admin-content-approval--stakeholder-status--copy-suggestions]
- [Source: _bmad-output/planning-artifacts/architecture.md#frontend-architecture-addition]
- [Source: src/components/admin/content/ContentApprovalCore.tsx — tab structure lines 1093-1106]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List


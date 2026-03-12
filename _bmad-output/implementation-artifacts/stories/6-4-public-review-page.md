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
  - [ ] 1.1 Add lazy-loaded route `/review/:token` in `src/App.tsx` — OUTSIDE `ProtectedAdminRoute` and `MainLayout` wrappers
  - [ ] 1.2 Create page component at `src/pages/StakeholderReview/StakeholderReviewPage.tsx`
  - [ ] 1.3 Route must not include navigation bar, footer, or any admin layout — standalone branded page

- [ ] Task 2: Implement token validation and data fetch (AC: #1, #4)
  - [ ] 2.1 On mount, extract `token` from URL params via `useParams()`
  - [ ] 2.2 Call `stakeholder-review-action` edge function with `?token={token}&action=fetch` (GET request)
  - [ ] 2.3 Use `fetch()` directly (not Supabase client) since this is a public unauthenticated endpoint — URL: `{VITE_SUPABASE_URL}/functions/v1/stakeholder-review-action?token={token}&action=fetch&apikey={VITE_SUPABASE_ANON_KEY}`
  - [ ] 2.4 Handle error states: expired token → show "Este link expirou. Peça a Rafael um novo envio." / invalid token → "Link inválido." / network error → retry guidance
  - [ ] 2.5 While loading, show skeleton cards with Lifetrek branding

- [ ] Task 3: Build review card UI (AC: #1, #5)
  - [ ] 3.1 Header: Lifetrek logo (from public assets), Corporate Blue `#004F8F` background, white text greeting "Olá, {reviewer_name}!"
  - [ ] 3.2 Progress bar: "X de N posts revisados" — updates as items are acted on
  - [ ] 3.3 Per-item card (white, rounded-lg, shadow-sm):
    - Content type badge: "LinkedIn" (blue), "Instagram" (purple), "Blog Post" (green) — use `bg-primary`, `bg-purple-600`, `bg-accent` respectively
    - Thumbnail: first slide `image_url` or blog `hero_image_url` — 120x120px rounded, gray placeholder if missing
    - Caption text: italic, max 200 chars with ellipsis
    - Slide headlines list: bulleted, first 3 only (for carousels)
  - [ ] 3.4 If item `status !== 'pending'`: show "Já revisado" badge (gray), disable all action buttons
  - [ ] 3.5 Mobile responsive: single column layout, full-width cards, touch-friendly buttons (min 44px tap target)

- [ ] Task 4: Implement approve action (AC: #2)
  - [ ] 4.1 "Aprovar" button — green (`bg-[#1A7A3E]`), white text, check icon
  - [ ] 4.2 On click: POST to `stakeholder-review-action` with body `{ token, item_id, action: "approve" }` — NOTE: the existing edge function handles approve via GET with query params, so use GET: `?token={token}&item={item_id}&action=approve` but we need JSON response not HTML. Check if the fetch action's approve path returns JSON when called programmatically. **Alternatively**: POST JSON body since the edge function already handles POST for reject/edit_suggest — extend to handle POST approve too if needed
  - [ ] 4.3 **Recommended approach**: Since the edge function returns HTML for GET approve (designed for email clicks), the review page should POST JSON: `{ token, item_id, action: "approve" }`. The edge function already checks request method — add a JSON response path for POST approve (return `{ success: true, status: "approved" }` instead of HTML)
  - [ ] 4.4 On success: update local React state to show "Aprovado" badge on card, increment progress counter
  - [ ] 4.5 On error: show toast with PT-BR error message, keep card in pending state

- [ ] Task 5: Implement reject action with comment (AC: #2)
  - [ ] 5.1 "Rejeitar" button — red (`bg-[#DC2626]`), white text, X icon
  - [ ] 5.2 On click: expand inline comment textarea below the card (not a modal — keep context visible)
  - [ ] 5.3 Textarea placeholder: "Descreva o motivo da rejeição..." — required, min 10 chars
  - [ ] 5.4 Submit: POST to `stakeholder-review-action` with `{ token, item_id, action: "reject", comment: "..." }` — this path already exists in the edge function
  - [ ] 5.5 On success: update card to "Rejeitado" state, show reviewer comment inline
  - [ ] 5.6 Cancel button to collapse the form without submitting

- [ ] Task 6: Implement copy edit suggestion (AC: #3)
  - [ ] 6.1 "Editar cópia" button — blue (`bg-[#004F8F]`), white text, pencil icon
  - [ ] 6.2 On click: expand inline editor below the card with pre-filled editable fields:
    - Caption textarea (pre-filled with current caption)
    - For carousels: editable headline + body per slide (accordion or list)
    - For blog posts: editable title + excerpt
  - [ ] 6.3 Submit: POST to `stakeholder-review-action` with `{ token, item_id, action: "edit_suggest", copy_edits: { caption: "...", slides: [...] } }` — this path already exists
  - [ ] 6.4 On success: update card to "Sugestão enviada" state
  - [ ] 6.5 Cancel button to collapse editor

- [ ] Task 7: Completion state (AC: #2)
  - [ ] 7.1 After all items reviewed: show completion message "Revisão completa! Obrigado, {reviewer_name}." with check icon
  - [ ] 7.2 Footer: "Lifetrek Medical · 2026" — muted text, centered

## Dev Notes

### Edge Function Integration

The `stakeholder-review-action` edge function already supports all required actions:
- `action=fetch` → returns JSON with batch items, reviewer name, expiry (line 291 in index.ts)
- `action=approve` (GET) → returns HTML confirmation page
- `action=reject` (GET → form, POST → submit with comment)
- `action=edit_suggest` (POST) → stores copy_edits JSON

**Critical decision for Task 4**: The GET approve returns HTML (for email clicks). For the review page, we need JSON responses. Two options:
1. **Preferred**: Modify `stakeholder-review-action` to check `Accept: application/json` header or `format=json` query param — if present, return JSON instead of HTML
2. **Alternative**: Have the review page call the fetch action after each approve to refresh state

Recommend option 1 — add a `format` query param check in the edge function for approve/reject POST paths.

### Files to Create

- `src/pages/StakeholderReview/StakeholderReviewPage.tsx` — main page component
- `src/pages/StakeholderReview/ReviewItemCard.tsx` — per-item card with actions
- `src/pages/StakeholderReview/CopyEditForm.tsx` — inline editor for copy suggestions
- `src/pages/StakeholderReview/RejectForm.tsx` — inline rejection comment form

### Files to Modify

- `src/App.tsx` — add `/review/:token` route (lazy loaded, no layout wrapper)
- `supabase/functions/stakeholder-review-action/index.ts` — add JSON response path for POST approve/reject (check `format` param or `Accept` header)

### What NOT to Do

- Do NOT use Supabase JS client for the public page — use raw `fetch()` since there's no auth session
- Do NOT add this route inside `MainLayout` or `ProtectedAdminRoute` — it must be fully standalone
- Do NOT create a new edge function — reuse `stakeholder-review-action` which already has all logic
- Do NOT add navigation links to admin — stakeholders should not see admin UI
- Do NOT use React Query for this page — simple `useState` + `useEffect` with fetch is sufficient (one-shot load, local state updates)

### Architecture Compliance

- **Naming:** PascalCase for components, camelCase for functions
- **Styling:** Tailwind only, no custom CSS files. Use `cn()` from `@/lib/utils` for conditional classes
- **Language:** All visible text in PT-BR
- **Brand:** Corporate Blue `#004F8F` header, Lifetrek logo, clean professional look
- **Security:** Token-only access — no JWT, no cookies, no admin context exposed
- **Mobile-first:** Stack cards vertically, 44px min tap targets, no horizontal scroll

### Testing Requirements

- Load `/review/{valid-token}` → items render with correct types and content
- Click Aprovar → card transitions to approved state without reload
- Click Rejeitar → comment form expands → submit → card transitions to rejected state
- Click Editar cópia → edit form expands with pre-filled text → modify → submit → card shows suggestion state
- Load with expired token → expiry message shown, no data exposed
- Load with invalid token → error message shown
- Test on mobile viewport (375px width) → cards readable, buttons tappable
- Run `npm run build` — must pass
- Run `npm run lint` — no new warnings

### Cross-Story Context

- **Story 6.2/6.3** (done): Edge functions already created. The `fetch` action returns the JSON this page consumes. Approve/reject/edit_suggest actions already work.
- **Story 6.5** (Admin Stakeholder Status): Will show stakeholder review results in admin. Independent — can be built in parallel.
- **Story 6.6** (Manual Send Trigger): Sends emails that contain links to this review page. Must be built before E2E testing of the full flow.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-64-public-review-page]
- [Source: _bmad-output/planning-artifacts/architecture.md#epic-6-architecture-extension]
- [Source: supabase/functions/stakeholder-review-action/index.ts — fetch action lines 176-256, approve lines 307-333]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List


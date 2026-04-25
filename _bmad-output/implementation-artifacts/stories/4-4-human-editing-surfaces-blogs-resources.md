# Story 4.4: Human Editing Surfaces (Blogs and Resources)

Status: in-progress

## Story

As an admin editor,
I want explicit human-edit interfaces for blog posts and resources,
so that AI drafts and existing content can be corrected before publication.

## Acceptance Criteria

1. Given a blog post is listed in admin, when user clicks edit, then title, excerpt, content, SEO, tags, and status are editable and persistable.
2. Given a resource is listed in admin, when user clicks edit, then core fields and status are editable and persistable.
3. Given content approval queue items (blog/resource), when user chooses edit, then user is routed to the correct human editor with context preserved.

## Tasks / Subtasks

- [x] Add blog editor action in `/admin/blog` with save persistence.
- [x] Add dedicated admin resources editor route and CRUD controls.
- [x] Wire blog/resource edit entry points from `/admin/content-approval`.
- [x] Add admin navigation path for resources editor.
- [x] Replace form-only edit modals with a shared editorial workspace for blog HTML and resource Markdown.
- [x] Add explicit resource publish mutation and publish action in `/admin/resources`.

### Review Follow-ups (AI)

- [x] [AI-Review][High] Preserve `returnTo` and `stateKey` through the resources editor and navigate back after save or cancel so approval-context editing works for resources, not just blogs. [src/pages/Admin/AdminResources.tsx:109]
- [x] [AI-Review][Medium] Add a first-class navigation entry to `/admin/blog`; the blog editor route exists but is still not discoverable from the admin header. [src/components/admin/AdminHeader.tsx:73]
- [ ] [AI-Review][Medium] Add browser verification for the approval-to-editor-to-approval round trip; the current story evidence stops at `npm run build`. [src/components/admin/content/ContentApprovalCore.tsx:252]

## Dev Notes

- Keep editing non-destructive and compatible with existing approval workflow.
- Preserve existing social design edit flow for LinkedIn/Instagram.
- Do not change public resource/blog route contracts.

### Project Structure Notes

- Blog admin editor: `src/pages/Admin/AdminBlog.tsx`
- Resource admin editor: `src/pages/Admin/AdminResources.tsx`
- Approval routing: `src/components/admin/content/ContentApprovalCore.tsx`
- Card edit action UI: `src/components/admin/content/ContentItemCard.tsx`
- Route/nav wiring: `src/App.tsx`, `src/components/admin/AdminHeader.tsx`

### References

- [Source: _bmad-output/planning-artifacts/prd.md#5-functional-requirements]
- [Source: _bmad-output/planning-artifacts/epics.md#story-44-human-editing-surfaces-for-blogs-and-resources]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run build` (pass)
- `npx tsc --noEmit` (pass, 2026-04-25)
- `npx eslint --config ./config/eslint.config.js src/components/admin/content/EditorialWorkspace.tsx src/pages/Admin/AdminBlog.tsx src/pages/Admin/AdminResources.tsx src/hooks/useResources.ts src/hooks/useBlogPosts.ts src/components/admin/AdminHeader.tsx` (pass, 2026-04-25)
- Browser verification (pass, 2026-04-25): created and edited draft resource `codex-editor-verification-202604251211`; created and edited draft blog `codex-blog-editor-verification-202604251214`; verified both changes visible after returning to their admin lists.
- `npm run build` (blocked by existing `opencascade.js/dist/opencascade.wasm.wasm?url` resolution in `src/lib/engineering-drawing/renderStep.ts`, 2026-04-25)

### Completion Notes List

- Implemented blog edit modal and deep-link edit support from approval.
- Implemented dedicated resources admin CRUD editor.
- Added blog/resource edit actions in approval cards.
- Added shared editor workspace with central writing canvas, toolbar, side metadata panel and preview.
- Blog editor now edits rendered HTML content and can publish from the editor after required ICP/pillar metadata validation.
- Resource editor now edits Markdown content, preserves approval return context and can publish to the public resources site.

### File List

- src/components/admin/content/EditorialWorkspace.tsx
- src/pages/Admin/AdminBlog.tsx
- src/pages/Admin/AdminResources.tsx
- src/hooks/useResources.ts
- src/components/admin/content/ContentApprovalCore.tsx
- src/components/admin/content/ContentItemCard.tsx
- src/components/admin/AdminHeader.tsx
- src/App.tsx
- docs/sectors/blog-and-editorial.md
- docs/bmad-standard-documentation.md
- docs/content/LEAD_MAGNETS.md

## Senior Developer Review (AI)

- Reviewer: Rafaelalmeida
- Date: 2026-03-10
- Outcome: Changes Requested
- Status Recommendation: `in-progress`
- Git Note: local `git status` contains unrelated worktree changes, so the review was executed against the current implementation rather than a clean per-story diff.
- Findings:
  - [High] `/admin/resources` accepts `edit=...` deep links from approval, but it never preserves `returnTo` or `stateKey` on save or cancel, so resource edits lose approval context and miss AC3. [src/pages/Admin/AdminResources.tsx:109]
  - [Medium] The new resources route is discoverable from the admin header, but the corresponding `/admin/blog` editor is still missing a first-class navigation entry. [src/components/admin/AdminHeader.tsx:73]
  - [Medium] The story evidence does not include UI verification of the approval-to-editor round trip, which is the most failure-prone part of this workflow. [src/components/admin/content/ContentApprovalCore.tsx:252]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

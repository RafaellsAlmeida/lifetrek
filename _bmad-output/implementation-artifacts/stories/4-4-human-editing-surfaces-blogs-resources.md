# Story 4.4: Human Editing Surfaces (Blogs and Resources)

Status: review

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

### Completion Notes List

- Implemented blog edit modal and deep-link edit support from approval.
- Implemented dedicated resources admin CRUD editor.
- Added blog/resource edit actions in approval cards.

### File List

- src/pages/Admin/AdminBlog.tsx
- src/pages/Admin/AdminResources.tsx
- src/components/admin/content/ContentApprovalCore.tsx
- src/components/admin/content/ContentItemCard.tsx
- src/components/admin/AdminHeader.tsx
- src/App.tsx

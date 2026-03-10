# Story 2.3: Chat Intent to Carousel Params

Status: in-progress

## Story

As a sales operator,
I want chat intent transformed into valid generation params,
so that I can generate content without using the form.

## Acceptance Criteria

1. Given chat message intent is clear, when parsing runs, then system maps intent to required generation fields.
2. Given required fields are ambiguous, when mapping runs, then system requests targeted clarifications.
3. Given mapping succeeds, when user confirms, then generation runs through the same validated contract as form entry.

## Tasks / Subtasks

- [ ] Implement/align intent extraction schema for chat requests (AC: 1)
  - [ ] Map topic, audience, platform, objective fields
- [ ] Add ambiguity handling prompts/clarification path (AC: 2)
  - [ ] Provide concise clarification prompts for missing required fields
- [ ] Route confirmed payload to shared generation contract (AC: 3)
  - [ ] Verify equivalence with form submission path

### Review Follow-ups (AI)

- [ ] [AI-Review][High] Wire `/admin/orchestrator` chat mode to the shared generation contract; the route currently renders the chat UI without any `onGenerate` handler. [src/pages/Admin/ContentOrchestrator.tsx:5]
- [ ] [AI-Review][High] Expand intent validation so missing `platform`, CTA/objective, and other contract fields trigger clarification instead of silently defaulting. [supabase/functions/chat/index.ts:43]
- [ ] [AI-Review][Medium] Remove hardcoded fallback business defaults from `handleGenerateFromOrchestrator`; confirmed chat payloads should match form-submitted values, not injected assumptions. [src/pages/Admin/SocialMediaWorkspace.tsx:101]

## Dev Notes

- Keep chat entry as front-end UX enhancement over existing backend contract.
- Do not create a separate generation function for chat mode.
- Preserve existing route and access controls.

### Project Structure Notes

- Chat function: `supabase/functions/chat/`
- Generation function: `supabase/functions/generate-linkedin-carousel/`
- Orchestrator UI: `src/pages/Admin/Orchestrator*`

### References

- [Source: _bmad-output/planning-artifacts/prd.md#7-user-journeys]
- [Source: _bmad-output/planning-artifacts/architecture.md#frontend-architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#story-23-chat-intent-to-carousel-params]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

### File List

## Senior Developer Review (AI)

- Reviewer: Rafaelalmeida
- Date: 2026-03-10
- Outcome: Changes Requested
- Status Recommendation: `in-progress`
- Git Note: local `git status` contains unrelated worktree changes, so the review was executed against the current implementation rather than a clean per-story diff.
- Story Note: this story reached `review` with an empty File List and no completion evidence even though the chat function and orchestrator UI were modified.
- Findings:
  - [High] The standalone `/admin/orchestrator` route still cannot generate from chat because `ContentOrchestratorCore` is mounted without an `onGenerate` bridge. [src/pages/Admin/ContentOrchestrator.tsx:5]
  - [High] `normalizeIntent()` only treats `topic` and `targetAudience` as required, so ambiguity handling is incomplete for other generation-critical fields. [supabase/functions/chat/index.ts:43]
  - [Medium] The embedded orchestrator still fills missing business context with hardcoded defaults before generation, which weakens contract equivalence with the form flow. [src/pages/Admin/SocialMediaWorkspace.tsx:101]

### Change Log

- 2026-03-10: Senior Developer Review (AI) completed. Added follow-up items and returned status to `in-progress`.

# Story 2.3: Chat Intent to Carousel Params

Status: review

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

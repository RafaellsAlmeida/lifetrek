# Story 2.4: Cost Tracking Enforcement

Status: done

## Story

As an operations owner,
I want all relevant generation calls cost-tracked,
so that spend remains observable and controlled.

## Acceptance Criteria

1. Given an AI call starts in content pipeline, when request completes, then cost event is recorded.
2. Given cost event write fails, when workflow evaluates completion, then failure is observable in logs/alerts.
3. Given monthly review, when reports are generated, then content operations cost data is queryable.

## Tasks / Subtasks

- [x] Create shared safe cost-tracking helper behavior for content workflows (AC: 1, 2)
  - [x] Keep cost logging non-blocking for the main generation request if the tracker write fails
  - [x] Emit structured metadata so monthly review is queryable by operation, model, and workflow stage
- [x] Wire carousel generation pipeline to cost tracking (AC: 1, 2)
  - [x] Track strategist/copywriter/designer research and embedding calls where AI providers are used
  - [x] Preserve existing generation behavior if cost logging fails
- [x] Wire blog generation workflows to cost tracking (AC: 1, 2, 3)
  - [x] Track OpenRouter text, embeddings, research, and image calls in `generate-blog-post`
  - [x] Track hero backfill image generation in `generate-blog-images`
- [x] Wire orchestrator chat flows to cost tracking (AC: 1, 2)
  - [x] Track both `orchestrator_intent` and conversational chat completions
- [x] Verify operational observability and artifact alignment (AC: 2, 3)
  - [x] Confirm logs/alerts path on tracker failure
  - [x] Update sprint/story records and run BMAD code review

## Dev Notes

- Architecture requires `_shared/costTracking.ts` usage on every relevant AI call and states tracker failures must not fail the main request.
- Scope is the content engine path, not unrelated sales/chatbot automations.
- Prefer estimated-cost logging with strong metadata over introducing new paid infrastructure or blocking flows.

### Project Structure Notes

- Shared helper: `supabase/functions/_shared/costTracking.ts`
- Carousel pipeline: `supabase/functions/generate-linkedin-carousel/`
- Blog generation: `supabase/functions/generate-blog-post/index.ts`
- Blog hero backfill: `supabase/functions/generate-blog-images/index.ts`
- Orchestrator chat: `supabase/functions/chat/index.ts`

### References

- [Source: _bmad-output/planning-artifacts/prd.md#5-functional-requirements]
- [Source: _bmad-output/planning-artifacts/prd.md#6-non-functional-requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#communication-patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#enforcement-guidelines]
- [Source: _bmad-output/planning-artifacts/epics.md#story-24-cost-tracking-enforcement]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `deno check supabase/functions/_shared/costTracking.ts supabase/functions/chat/index.ts supabase/functions/generate-blog-images/index.ts supabase/functions/generate-blog-post/index.ts supabase/functions/generate-linkedin-carousel/index.ts supabase/functions/generate-linkedin-carousel/agents.ts supabase/functions/generate-linkedin-carousel/agent_tools.ts`
- `npm run lint`
- `npm run build`
- Direct helper verification inserted a fresh `api_cost_tracking` row for `content.chat.orchestrator-intent` using `recordCostEventSafely`.
- Provider-backed local Deno runtime verification succeeded for:
  - `supabase/functions/chat/index.ts` with `mode=orchestrator_intent`
  - `supabase/functions/generate-linkedin-carousel/index.ts` with `mode=plan`
  - `supabase/functions/generate-blog-post/index.ts` with `skipImage=true`
- Verified fresh `api_cost_tracking` rows for:
  - `content.chat.orchestrator-intent`
  - `content.generate-linkedin-carousel.plan`
  - `content.generate-linkedin-carousel.copywriter`
  - `content.generate-blog-post.strategist`
  - `content.generate-blog-post.writer`
- Admin UI screenshot: `/var/folders/64/d80xb0q973lcbhg8xntrqky40000gn/T/playwright-mcp-output/1772803323178/page-2026-03-06T14-27-29-117Z.png`

### Completion Notes List

- Replaced overloaded RPC-based cost logging with direct inserts into `api_cost_tracking` and `cost_alerts` so writes are deterministic.
- Added non-blocking cost tracking across the content-engine entry points: `chat`, `generate-blog-images`, `generate-blog-post`, and `generate-linkedin-carousel`.
- Propagated structured operation metadata across carousel strategist/copywriter/designer/reviewer, blog strategist/writer/image, and orchestrator chat modes.
- Provider-backed runtime verification now passes with the local OpenRouter CLI credential in `.env.local`.
- One unrelated brownfield issue remains visible in logs: `match_knowledge_base` RPC overloading causes KB search ambiguity in carousel plan mode, but the generation flow still completes and cost tracking remains correct.

### File List

- `supabase/functions/_shared/costTracking.ts`
- `supabase/functions/chat/index.ts`
- `supabase/functions/generate-blog-images/index.ts`
- `supabase/functions/generate-blog-post/index.ts`
- `supabase/functions/generate-linkedin-carousel/index.ts`
- `supabase/functions/generate-linkedin-carousel/agents.ts`
- `supabase/functions/generate-linkedin-carousel/agent_tools.ts`
- `playwright/support/merged-fixtures.ts`

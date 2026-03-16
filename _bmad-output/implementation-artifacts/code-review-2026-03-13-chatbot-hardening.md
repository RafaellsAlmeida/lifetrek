# Code Review - 2026-03-13 - Chatbot Hardening

## Scope

- `supabase/functions/website-bot/index.ts`
- `supabase/functions/_shared/companyLookup.ts`
- `supabase/functions/_shared/approvedCompanies.ts`
- `supabase/functions/populate-knowledge-base/index.ts`
- `src/components/AIChatbot.tsx`
- `src/hooks/useChatbotConversations.ts`
- `src/pages/Admin/ChatbotInbox.tsx`
- `tests/backend/test_website_bot_lookup.mjs`
- `playwright/tests/ui/chatbot-buffer.ui.spec.ts`

## Review Mode

No BMAD story file exists for this chatbot hardening change, so the standard story-bound workflow could not be applied with a valid `story_path`.
An adversarial review was performed directly against the changed source files and the validated runtime behavior.

## Findings Found During Review

1. Interest detection failed on accented PT-BR input such as `veterinária`, causing the fallback to miss the veterinary path.
Status: fixed.

2. Batched requests still grounded company lookup and KB retrieval primarily on the grouped synthetic message or the last buffered message, which could miss company references sent earlier in the batch.
Status: fixed.

3. Conversation inserts for `user` and `assistant` were racing asynchronously, which could invert message order in the inbox.
Status: fixed.

4. The admin inbox hook relied on `any` across Supabase rows and metadata parsing, leaving avoidable lint debt in touched code.
Status: fixed.

## Residual Risks

- Local validation hit an OpenRouter `401 User not found` error in the current `.env`, so runtime verification used the new deterministic grounded fallback path.
- The added Playwright UI spec exists, but the repo's Playwright test runner currently errors before executing specs in this environment. Manual browser validation was completed separately.

## Outcome

No remaining HIGH or MEDIUM issues were identified in the implemented chatbot hardening scope after fixes and re-validation.

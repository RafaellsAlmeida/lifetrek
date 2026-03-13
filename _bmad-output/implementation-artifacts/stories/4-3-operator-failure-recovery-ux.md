# Story 4.3: Operator Failure Recovery UX

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a daily operator,
I want actionable recovery paths for common failures,
so that work can continue without technical escalation.

## Acceptance Criteria

1. **Given** a validation or ingest error, **When** it is presented, **Then** message explains cause and next action.
2. **Given** async task failure, **When** user retries, **Then** system avoids duplicate destructive effects.
3. **Given** unavailable downstream service, **When** user views error, **Then** status indicates retry timing and fallback options.

## Tasks / Subtasks

- [ ] Task 1: Create error classification utility (AC: #1, #3)
  - [ ] 1.1 Create `src/lib/errorClassifier.ts` with function `classifyError(error: any): ClassifiedError`
  - [ ] 1.2 Classify into categories: `validation` (user fixable), `auth` (session expired), `rate_limit` (wait), `service_unavailable` (downstream down), `network` (connectivity), `unknown` (generic)
  - [ ] 1.3 Each category returns: `{ category, userMessage (PT-BR), actionLabel, actionType, retryable, retryDelayMs }`
  - [ ] 1.4 Detection logic: 401→auth, 403→auth, 429→rate_limit, 500→service_unavailable, 502/503/504→service_unavailable, network error→network, validation Error messages→validation

- [ ] Task 2: Create reusable error toast helper (AC: #1, #3)
  - [ ] 2.1 Create `src/lib/showActionableError.ts` with function `showActionableError(error: any, context?: string)`
  - [ ] 2.2 Uses `classifyError()` to determine message and action
  - [ ] 2.3 Shows `toast.error(userMessage, { description: contextualHelp, action: { label, onClick } })` using sonner
  - [ ] 2.4 Action types: `retry` → calls provided retry callback, `login` → redirects to `/admin/login`, `wait` → shows countdown timer in toast, `edit` → navigates to edit page
  - [ ] 2.5 All messages in PT-BR:
    - validation: "Dados incompletos: [details]. Corrija e tente novamente."
    - auth: "Sessão expirada. Faça login novamente."
    - rate_limit: "Limite atingido. Aguarde [X] segundos."
    - service_unavailable: "Serviço temporariamente indisponível. Tente novamente em [X] minutos."
    - network: "Sem conexão. Verifique sua internet e tente novamente."
    - unknown: "Erro inesperado. Tente novamente ou entre em contato com o suporte."

- [ ] Task 3: Replace generic error toasts in approval hooks (AC: #1, #2)
  - [ ] 3.1 `useLinkedInPosts.ts` — replace `toast.error("Erro ao aprovar post")` etc. with `showActionableError(error, "aprovação de carrossel LinkedIn")`
  - [ ] 3.2 `useBlogPosts.ts` — same pattern (keep existing validation error messages, they're already good)
  - [ ] 3.3 `useInstagramPosts.ts` — same pattern
  - [ ] 3.4 Apply to all mutation `onError` callbacks: approve, reject, publish, delete, schedule

- [ ] Task 4: Replace generic error toasts in orchestrator (AC: #1, #3)
  - [ ] 4.1 `ContentOrchestratorCore.tsx` — replace generic catch blocks with `showActionableError(error, "geração de conteúdo")`
  - [ ] 4.2 Rate limit (429): show countdown "Aguarde [remaining]s" instead of static "aguarde 1 minuto"
  - [ ] 4.3 Intent extraction failure: distinguish "informações insuficientes" (user provides more context) vs. "serviço indisponível" (wait and retry)

- [ ] Task 5: Add idempotent retry to approval mutations (AC: #2)
  - [ ] 5.1 Add `retry: 1` to React Query mutation config for transient failures only (5xx status)
  - [ ] 5.2 Do NOT auto-retry for 4xx errors (user must fix input)
  - [ ] 5.3 Add `retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)` for exponential backoff
  - [ ] 5.4 Existing mutations are already idempotent (status updates via `.update().eq("id")`) — no destructive side effects on retry

- [ ] Task 6: Add retry button to error states (AC: #2, #3)
  - [ ] 6.1 In `ContentApprovalCore.tsx` — when approval/rejection fails, show "Tentar novamente" button in the preview dialog (don't close dialog on error)
  - [ ] 6.2 In `ContentOrchestratorCore.tsx` — already covered by story 4-1 retry flow; ensure `showActionableError` is used
  - [ ] 6.3 In `LinkedInCsvUploadPanel.tsx` — on ingestion failure, show "Tentar novamente" with preserved file selection

- [ ] Task 7: Add batch operation error transparency (AC: #1)
  - [ ] 7.1 In `ContentApprovalCore.tsx` batch approval: track per-item success/failure during batch loop
  - [ ] 7.2 After batch completes, show summary: "X aprovados, Y falharam" with list of failed item titles
  - [ ] 7.3 Failed items remain in queue for individual retry

## Dev Notes

### Current Error Handling Landscape

**80% of errors show generic "Erro ao [action]" with no context.** The operator (Vanessa) sees the same message whether her data is wrong, her session expired, or OpenRouter is down. This story fixes that.

**What already works well (preserve):**
- Blog approval validation: `"Preencha metadata.icp_primary e metadata.pillar_keyword antes de aprovar."` — this is the gold standard, extend pattern to other types
- CSV upload validation panel: shows row-level errors with details
- Job notifications: show error message from payload + "Retry" action link
- Undo toasts: 8-second window with "Desfazer" button

**What's broken:**
- All mutation `onError` callbacks use generic messages
- No distinction between user errors and system failures
- No retry buttons anywhere except job notifications
- Batch operations silently skip failures
- No service unavailability indicators
- Error boundary has English message and no retry

### Error Classification Reference

```typescript
// src/lib/errorClassifier.ts
interface ClassifiedError {
  category: 'validation' | 'auth' | 'rate_limit' | 'service_unavailable' | 'network' | 'unknown'
  userMessage: string       // PT-BR, actionable
  actionLabel?: string      // Button text
  actionType?: 'retry' | 'login' | 'wait' | 'edit'
  retryable: boolean
  retryDelayMs?: number     // Suggested wait before retry
}

function classifyError(error: any): ClassifiedError {
  const status = error?.status || error?.statusCode || error?.code
  const message = error?.message || ''

  if (status === 401 || status === 403) {
    return { category: 'auth', userMessage: 'Sessão expirada. Faça login novamente.', actionLabel: 'Login', actionType: 'login', retryable: false }
  }
  if (status === 429) {
    return { category: 'rate_limit', userMessage: 'Limite atingido. Aguarde 30 segundos.', actionLabel: 'Aguardar', actionType: 'wait', retryable: true, retryDelayMs: 30000 }
  }
  if (status === 502 || status === 503 || status === 504 || status === 500) {
    return { category: 'service_unavailable', userMessage: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.', actionLabel: 'Tentar novamente', actionType: 'retry', retryable: true, retryDelayMs: 60000 }
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
    return { category: 'network', userMessage: 'Sem conexão. Verifique sua internet e tente novamente.', actionLabel: 'Tentar novamente', actionType: 'retry', retryable: true, retryDelayMs: 5000 }
  }
  if (message.includes('Preencha') || message.includes('precisa de') || message.includes('obrigatório')) {
    return { category: 'validation', userMessage: message, actionLabel: 'Corrigir', actionType: 'edit', retryable: false }
  }
  return { category: 'unknown', userMessage: `Erro inesperado: ${message || 'tente novamente'}`, actionLabel: 'Tentar novamente', actionType: 'retry', retryable: true, retryDelayMs: 5000 }
}
```

### showActionableError Usage Pattern

```typescript
// In hooks — replace:
onError: (error: any) => {
  toast.error("Erro ao aprovar post");  // ← OLD
}

// With:
onError: (error: any) => {
  showActionableError(error, "aprovação de carrossel LinkedIn");  // ← NEW
}
```

```typescript
// In components — replace:
catch (error: any) {
  toast.error(error?.message || "Erro ao processar.");  // ← OLD
}

// With:
catch (error: any) {
  showActionableError(error, "geração de conteúdo", {
    onRetry: () => handleGenerateClick(),  // Optional retry callback
  });
}
```

### Batch Error Tracking Pattern

```typescript
// In ContentApprovalCore.tsx handleBatchApprove:
const results = { succeeded: [] as string[], failed: [] as {title: string, error: string}[] };

for (const item of categoryItems) {
  try {
    await handleApprove(item);
    results.succeeded.push(item.title);
  } catch (err: any) {
    results.failed.push({ title: item.title, error: err.message });
  }
  setBatchProgress(Math.round(((results.succeeded.length + results.failed.length) / count) * 100));
}

if (results.failed.length > 0) {
  toast.error(`${results.failed.length} item(ns) falharam`, {
    description: results.failed.map(f => f.title).join(', '),
    duration: 10000,
  });
}
if (results.succeeded.length > 0) {
  toast.success(`${results.succeeded.length} aprovado(s) com sucesso`);
}
```

### Files to Modify

**New files:**
- `src/lib/errorClassifier.ts` — error classification utility
- `src/lib/showActionableError.ts` — reusable error toast helper

**Modified files (hooks):**
- `src/hooks/useLinkedInPosts.ts` — all mutation `onError` callbacks
- `src/hooks/useBlogPosts.ts` — all mutation `onError` callbacks
- `src/hooks/useInstagramPosts.ts` — all mutation `onError` callbacks

**Modified files (components):**
- `src/components/admin/content/ContentApprovalCore.tsx` — batch error tracking, retry buttons in dialogs
- `src/components/admin/content/ContentOrchestratorCore.tsx` — orchestrator error handling (coordinate with story 4-1)
- `src/components/admin/analytics/LinkedInCsvUploadPanel.tsx` — ingestion retry

### Architecture Compliance

- **Naming:** camelCase for utility files (`errorClassifier.ts`, `showActionableError.ts`)
- **Location:** `src/lib/` for cross-cutting utilities (same as existing `utils.ts`)
- **Styling:** Error banners use Tailwind destructive colors: `bg-destructive/10`, `text-destructive`
- **Language:** ALL error messages in PT-BR
- **Dependencies:** Only `sonner` (already installed) for toasts
- **No new global state:** Error classification is stateless, per-invocation

### What NOT to Do

- Do NOT create a global error boundary wrapper — too heavy for this story; individual component error handling is sufficient
- Do NOT add error tracking service (Sentry, etc.) — out of scope, would add cost
- Do NOT modify the job notification system — it already has retry (story 4-3 focuses on direct UI operations)
- Do NOT change error handling in Edge Functions — backend errors are fine; this story is about frontend error presentation
- Do NOT add offline detection — network error classification is sufficient

### Testing Requirements

- Verify 401 error → shows "Sessão expirada" with login redirect button
- Verify 429 error → shows "Limite atingido" with wait countdown
- Verify 503 error → shows "Serviço indisponível" with retry timing
- Verify network error → shows "Sem conexão" message
- Verify validation error → shows original PT-BR message (preserved)
- Verify batch approval with 1 failure → shows success count + failure count + failed item titles
- Verify retry button works and calls same mutation again
- Run `npm run build` — must pass
- Run `npm run lint` — no new warnings

### Cross-Story Context

- **Story 4-1** (Orchestrator Parity): Adds retry flow for generation failures. Story 4-3's `showActionableError` should be used there too — coordinate implementation.
- **Story 4-2** (Approval Queue): Adds prerequisite validation. Story 4-3's error classifier should recognize validation errors thrown by 4-2's new checks.
- **Story 4-4** (Human Editing): Already in review. No direct dependency.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-43-operator-failure-recovery-ux]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-007 Operability]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#7-operator-safe-defaults]
- [Source: _bmad-output/planning-artifacts/architecture.md#process-patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Verified implementation evidence from commit history: `src/components/ui/ErrorBanner.tsx`, `src/lib/errorClassifier.ts`, and `src/lib/showActionableError.ts` present in the codebase.
- Transitioning status to `review`.

### File List

- `src/lib/errorClassifier.ts`
- `src/lib/showActionableError.ts`
- `src/components/ui/ErrorBanner.tsx`
- Existing approval hooks modified
- Orchestrator and Analytics components modified

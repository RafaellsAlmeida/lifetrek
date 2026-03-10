# Story 4.1: Orchestrator Mode Parity UX

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a non-technical operator,
I want form and chat modes to feel equivalent,
so that I can use either mode confidently.

## Acceptance Criteria

1. **Given** user switches entry mode, **When** context persists, **Then** critical generation settings remain visible and coherent.
2. **Given** chat-derived params exist, **When** confirmation is shown, **Then** user can review and edit before generation.
3. **Given** generation fails, **When** retry is offered, **Then** prior user input is preserved.

## Tasks / Subtasks

- [x] Task 1: Add Form Entry Mode UI (AC: #1, #2)
  - [x] 1.1 Add `mode` state (`'chat' | 'form'`) and toggle tabs in `ContentOrchestratorCore.tsx`
  - [x] 1.2 Create form layout with fields: topic (required), targetAudience (required), platform dropdown, painPoint, desiredOutcome, ctaAction, proofPoints[]
  - [x] 1.3 Form validation: require topic + targetAudience before submit; show inline field-level errors in PT-BR
  - [x] 1.4 Form submit → set `pendingParams` directly (skip intent extraction step) → show review card

- [x] Task 2: Make Confirmation Card Editable (AC: #2)
  - [x] 2.1 Replace read-only summary (current lines ~236-254) with inline-editable fields for all `OrchestratorGenerationParams` properties
  - [x] 2.2 Edits update `pendingParams` in place before "Confirmar e gerar" is clicked
  - [x] 2.3 Show visual distinction between chat-extracted values and user-edited values (e.g., edited fields get a subtle highlight)

- [x] Task 3: Mode Switch State Preservation (AC: #1)
  - [x] 3.1 On chat→form switch: populate form fields from `pendingParams` if they exist; otherwise preserve any `savedFormData`
  - [x] 3.2 On form→chat switch: save current form state to `savedFormData`; optionally seed chat with topic context
  - [x] 3.3 Mode toggle does NOT clear chat message history or form data
  - [x] 3.4 Platform selection persists across mode switches (already managed by parent `SocialMediaWorkspace`)

- [x] Task 4: Retry Flow After Generation Failure (AC: #3)
  - [x] 4.1 On generation error: keep `pendingParams` and `formData`/`messages` state intact (do NOT reset)
  - [x] 4.2 Show "Tentar novamente" (Try Again) button in the review card area after failure
  - [x] 4.3 Retry button calls `onGenerate(pendingParams)` without re-extracting intent
  - [x] 4.4 If user wants to edit before retry: confirmation card remains editable

- [x] Task 5: UI Polish & Operator Safety (AC: #1, #2, #3)
  - [x] 5.1 Default mode to `'form'` (safer for non-technical operator Vanessa)
  - [x] 5.2 Mode toggle labels: "Formulário" / "Chat" — use shadcn Tabs component
  - [x] 5.3 Generation progress states: "Preparando..." → "Gerando..." → "Finalizando..." with spinner
  - [x] 5.4 All user-facing strings in PT-BR

## Dev Notes

### Current Implementation State

The orchestrator lives in **`src/components/admin/content/ContentOrchestratorCore.tsx`** — currently **chat-only**.

**What already works and MUST be preserved:**
- Intent extraction via `supabase.functions.invoke("chat", { mode: 'orchestrator_intent' })` — lines ~133-177
- Rate limiting (2-second throttle between requests) — line 66
- Error handling (401, 429, generic) — lines 85-101
- Review card (confirmation before generation) — lines ~233-254 (currently read-only, make editable)
- Platform toggle in parent `SocialMediaWorkspace` — lines 227-248
- Tab routing to approval on success — `SocialMediaWorkspace` lines 122-127

**Key Interface (do NOT change the shape):**
```typescript
interface OrchestratorGenerationParams {
  topic: string                    // REQUIRED
  targetAudience?: string         // REQUIRED in practice (validated)
  platform?: "linkedin" | "instagram"
  painPoint?: string
  desiredOutcome?: string
  ctaAction?: string
  proofPoints?: string[]
}

interface ContentOrchestratorCoreProps {
  embedded?: boolean
  onGenerate?: (params: OrchestratorGenerationParams) => Promise<void> | void
  defaultPlatform?: "linkedin" | "instagram"
}
```

**State that already exists (reuse, don't duplicate):**
- `messages` / `setMessages` — chat history
- `input` / `setInput` — current chat message text
- `isLoading` / `isGenerating` / `isPreparingGeneration` — loading states
- `pendingParams` / `setPendingParams` — extracted generation params
- `intentMeta` / `setIntentMeta` — `{ confidence, missingFields[] }`
- `lastRequestTime` — rate limit tracking

**New state to add:**
```typescript
const [mode, setMode] = useState<'chat' | 'form'>('form') // default to form
const [formData, setFormData] = useState<OrchestratorGenerationParams>({
  topic: '',
  targetAudience: '',
  platform: defaultPlatform,
  painPoint: '',
  desiredOutcome: '',
  ctaAction: '',
  proofPoints: [],
})
const [savedFormData, setSavedFormData] = useState<OrchestratorGenerationParams | null>(null)
const [generationError, setGenerationError] = useState<string | null>(null)
```

### Data Flow Equivalence

Both modes MUST converge to the same generation call:
```
Form Entry                          Chat Entry
    ↓                                  ↓
User fills structured fields    User chats, bot extracts params
    ↓                                  ↓
       setPendingParams(resolvedParams)
             ↓
       Show editable review card
             ↓
       User clicks "Confirmar e gerar"
             ↓
       onGenerate(pendingParams)
             ↓
       generate-linkedin-carousel function
```

### Mode Switch Logic

```typescript
const handleModeSwitch = (newMode: 'chat' | 'form') => {
  if (newMode === 'form' && mode === 'chat' && pendingParams) {
    // Populate form with chat-extracted params
    setFormData(prev => ({ ...prev, ...pendingParams }))
  } else if (newMode === 'form' && savedFormData) {
    setFormData(savedFormData)
  }
  if (newMode === 'chat' && mode === 'form') {
    setSavedFormData(formData)
  }
  setMode(newMode)
}
```

### Retry Logic

```typescript
const handleRetry = async () => {
  if (!pendingParams) return
  setGenerationError(null)
  try {
    await onGenerate?.(pendingParams)
  } catch (err) {
    setGenerationError(err.message || 'Erro ao gerar conteúdo')
  }
}
```

### Project Structure Notes

- **Primary file to modify:** `src/components/admin/content/ContentOrchestratorCore.tsx`
- **Parent (read-only, no changes expected):** `src/pages/Admin/SocialMediaWorkspace.tsx`
- **Approval queue (no changes needed):** `src/components/admin/content/ContentApprovalCore.tsx`
- **Edge functions (no changes):** `supabase/functions/chat/`, `supabase/functions/generate-linkedin-carousel/`
- **UI components to use:** shadcn `Tabs`, `Input`, `Textarea`, `Select`, `Button`, `Card`, `Badge` from `@/components/ui/`
- **Form validation:** use existing `zod` + `react-hook-form` pattern OR simple inline validation (prefer simplest approach)
- **Toast notifications:** use `sonner` (already in project) — `toast.error()`, `toast.success()`

### Architecture Compliance

- **Naming:** PascalCase component, camelCase state/functions, `@/` path alias
- **Styling:** Tailwind utilities only, `cn()` for conditional classes
- **State:** Local React state only, no new global context. React Query for server data (already handled by parent)
- **Language:** All user-facing strings in PT-BR
- **No new dependencies:** Use only existing shadcn/ui components
- **Event-driven:** No polling or intervals
- **Brownfield:** This modifies ONE existing component; do not restructure surrounding code

### Library & Framework Requirements

- React 18.3.1 with hooks
- shadcn/ui components (already installed in `src/components/ui/`)
- Tailwind CSS 3.4.17
- `sonner` for toasts
- TypeScript strict mode

### File Structure Requirements

All changes scoped to `src/components/admin/content/ContentOrchestratorCore.tsx`. If the component grows beyond ~400 lines, extract form and review card into sibling files:
- `src/components/admin/content/OrchestratorFormMode.tsx`
- `src/components/admin/content/OrchestratorReviewCard.tsx`

### Testing Requirements

- Verify form mode renders with all fields
- Verify chat mode still works (no regression)
- Verify mode switch preserves state in both directions
- Verify editable confirmation card updates pendingParams
- Verify retry button appears after generation failure and preserves input
- Verify default mode is form
- Run `npm run build` — must pass with zero errors
- Run `npm run lint` — no new warnings

### Previous Story Intelligence (Story 4.4)

Story 4.4 (Human Editing Surfaces) was implemented by Codex and is in `review` status.

**Relevant patterns from 4.4:**
- Edit modals and inline editing patterns were used for blog/resource editing
- Edit actions wired from approval cards (`ContentItemCard.tsx`) — similar pattern may inform the editable confirmation card
- Route context preservation when navigating from approval to editor

**Files touched by 4.4 (may have recent changes):**
- `src/pages/Admin/AdminBlog.tsx` — blog edit modal
- `src/pages/Admin/AdminResources.tsx` — resource CRUD
- `src/components/admin/content/ContentApprovalCore.tsx` — edit routing
- `src/components/admin/content/ContentItemCard.tsx` — card actions
- `src/App.tsx` — route additions

### Git Intelligence

Recent commits show:
- `1dd2eaa` — batch carousel script adjustments
- `b3d9779` — app utilities and Supabase functions updates
- `702969e` — LinkedIn analytics visibility (story 3-3)
- `4ac4f79` — admin dashboard cleanup, video studio removal

Pattern: commits are focused, single-purpose, descriptive messages.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#story-41-orchestrator-mode-parity-ux]
- [Source: _bmad-output/planning-artifacts/prd.md#FR-003 Orchestrator Form Entry]
- [Source: _bmad-output/planning-artifacts/prd.md#FR-004 Orchestrator Chat Entry]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#31-adminorchestrator]
- [Source: _bmad-output/planning-artifacts/architecture.md#frontend-architecture]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

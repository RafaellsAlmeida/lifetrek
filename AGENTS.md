# AGENTS.md - Agent Guidelines for LifeTrek

## BMAD Project Context

This project is managed using **BMAD v6**. Before implementing any story:

1. Read `_bmad-output/project-context.md` — critical implementation rules and patterns
2. Read the active story file in `_bmad-output/implementation-artifacts/stories/`
3. Follow the story's acceptance criteria exactly — do not gold-plate
4. Run code review (`/bmad-bmm-code-review`) after completing a story

**Current Focus:** Content Generation System — ideation → generation → editing → visualization
**Planning artifacts:** `_bmad-output/planning-artifacts/` (architecture, epics, stories)
**Sprint tracking:** `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Testing & Verification (REQUIRED)

**Always test and screenshot before considering anything done.**

### Test Credentials
- URL: `localhost:8080/admin/login`
- Email: `rafacrvg@icloud.com`
- Password: `Lifetrek2026`

### Environment Setup
Get the correct Supabase env vars from `.env` or `.env.backup`:
```bash
VITE_SUPABASE_URL=https://dlflpvmdzkeouhgqwqba.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key from .env>
```

For Edge Functions / scripts that need service role:
```bash
SUPABASE_URL=https://dlflpvmdzkeouhgqwqba.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from .env - NEVER commit this>
```

### Verification Process
1. Start dev server: `npm run dev:web`
2. Login to admin dashboard
3. Navigate to the feature you changed
4. Take a screenshot showing the result
5. Send screenshot for confirmation

## API Keys & Security (CRITICAL)

### NEVER expose or commit:
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- `UNIPILE_DSN` / `UNIPILE_API_KEY` - LinkedIn automation credentials
- `LOVABLE_API_KEY` - AI API key
- `OPENROUTER_API_KEY` - AI routing key

### Unipile Warnings
- **Rate limits are strict** - LinkedIn can ban accounts
- **Do NOT run automated outreach** without explicit approval
- The `execution/automation_governor.py` is DEPRECATED - do not use
- Always use the Admin UI for LinkedIn operations, not scripts

### Safe Testing
- Use the Admin UI at `/admin/orchestrator` for content generation
- Check Supabase logs after Edge Function calls
- Never run bulk operations without asking first

## Image Generation — Versioning Rule (CRITICAL)

**NEVER overwrite existing carousel images. Always create new versions.**

When regenerating carousel images (via the `regenerate-carousel-images` edge function or any script):
- Save new images with a new timestamp/filename — do NOT replace the existing `image_url` in slides
- The goal is to accumulate multiple versions so the user can compare and choose the best one
- This applies to both AI-generated and real-photo approaches

Rationale: We are always experimenting with content styles and need flexibility to pick winners.

## Visual Template System (CRITICAL — All Content Must Use These)

Approved visual references are in `GoodPostExemples/`. Treat Templates A-D below as the 4 core families, not as the entire library. Content generation MUST match one of these base families or an approved variant already present in `GoodPostExemples/`. Never invent a new visual style that is not anchored to an existing approved example.

### Template A — "Glassmorphism Card" *(default for body & CTA slides)*
Use for: insight slides, data/stat slides, CTA slides, most carousel body slides.
- **Background**: Real facility/product photo with dark blue overlay (`rgba(0,30,70,0.65)`, ~70%)
- **Card**: Glassmorphism, left-aligned, ~65% width, rounded corners, `rgba(8,18,35,0.80)` + blur
- **Label**: Small ALL CAPS above headline, Innovation Green `#1A7A3E` (e.g., "DESTAQUE", "INSIGHT", "PROXIMO PASSO")
- **Headline**: Inter Bold ~42–48px, white, 2–3 lines
- **Body**: Inter Regular ~18–22px, white, 2–4 lines max
- **Logo**: Lifetrek Medical logo top-right (white boxed version)
- **Optional**: Fine print bar at bottom (compliance/legal notes)
- Reference family examples: `GoodPostExemples/RiscoDeRecall.jpeg`, `GoodPostExemples/1772644433414.jpeg`, `GoodPostExemples/CalculeSeuCustoReal.jpeg`, `GoodPostExemples/ProgrammaticCarrousel.jpeg`

### Template B — "Full-Bleed Dark Text" *(hook & cover slides)*
Use for: first slide of carousel, strong statement slides, listicle hooks ("5 Riscos que…").
- **Background**: Real photo, dark tinted overlay — blue-to-green gradient or solid dark blue, full bleed
- **Logo**: Top-right + thin horizontal white rule line below it
- **Headline**: Very large, bold white, left-aligned, ALL CAPS or mixed — no text card
- **Bottom**: Thin accent line (green `#1A7A3E` or orange `#F07818`) + slide counter bottom-left ("1 de 7") + diamond sparkle `◆` bottom-right
- Reference family examples: `GoodPostExemples/GreatVisualAndBolding.jpeg`, `GoodPostExemples/PrototipagemRapida.jpeg`, `GoodPostExemples/ZeissPost.jpeg`

### Template C — "Split Comparison" *(educational / X vs Y)*
Use for: comparison posts, before/after, import vs local, ISO levels, metric contrasts.
- **Layout**: Vertical 50/50 split, each half has different color tint + full-bleed photo
- **Labels**: Bold text at top of each half, very large
- No text card — split + labels carry the message
- Reference family examples: `GoodPostExemples/ISO8vsISO7.jpeg`, `GoodPostExemples/90v30dias.jpeg`, `GoodPostExemples/MesmaMaquinaMesmaQualidade.jpeg`

### Template D — "Pure Photo / Equipment Showcase"
Use for: equipment showcases, facility highlights, product photography.
- High-quality real photo, minimal or no text, brand association through quality imagery
- Reference family examples: `GoodPostExemples/ZeissPost.jpeg`, `GoodPostExemples/master-showcase-v4.mp4`, `GoodPostExemples/swissturning_premium.mp4`

### Approved Variants In `GoodPostExemples/`
- `RiscoDeRecall.jpeg`, `CalculeSeuCustoReal.jpeg`, `ProgrammaticCarrousel.jpeg`: card-led educational/commercial variants inside the Template A family
- `GreatVisualAndBolding.jpeg`, `PrototipagemRapida.jpeg`: typography-first hook/cover variants inside the Template B family
- `ISO8vsISO7.jpeg`, `90v30dias.jpeg`, `MesmaMaquinaMesmaQualidade.jpeg`: comparison variants inside the Template C family
- `ZeissPost.jpeg`: metrology/equipment-led variant that can map to Template B or D depending on copy density
- `AICarrousel.jpeg`, `A:FullyAIPost.jpeg`: approved AI-assisted references for composition and mood, not the default choice when a real Lifetrek asset fits

### How To Choose
1. Pick the nearest base family (A/B/C/D)
2. Then pick the strongest approved variant from `GoodPostExemples/` for that topic
3. Reuse its composition logic, hierarchy, and pacing
4. Do not create a fifth family from scratch

### Universal Rules Across ALL Templates
- **ALWAYS use real Lifetrek photos** as backgrounds — never pure AI-generated backgrounds for final output
- Logo top-right on every slide (except Template D)
- Dominant color: Corporate Blue `#004F8F`
- Text always white, high contrast
- Accent: Green `#1A7A3E` (labels/lines) or Orange `#F07818` (CTA/energy)
- Inter font family throughout
- Image versioning: NEVER overwrite. Always append to `image_variants`.

### Background Photo Selection Logic
1. Semantic keyword match to slide content (e.g., "ZEISS" → CMM photo, "sala limpa" → clean-room)
2. Fallback to `production-floor` or `production-overview`
3. AI-generated ONLY if no real match and `allow_ai_fallback: true`

**Key files:**
- `supabase/functions/regenerate-carousel-images/handlers/hybrid.ts`
- `supabase/functions/regenerate-carousel-images/utils/assets.ts` — `getFacilityPhotoForSlide()`
- `supabase/functions/regenerate-carousel-images/generators/satori.ts`

**Available facility photos** (`product_catalog`, category='facility'):
`production-floor`, `production-overview`, `grinding-room`, `laser-marking`, `electropolish-line-new`, `polishing-manual`, `clean-room-1..7`, `cleanroom-hero`, `exterior`, `reception`, `water-treatment`

## Brand Guidelines

Follow `docs/brand/BRAND_BOOK.md` before creating any UI.

Quick reference:
- Professional, engineer-to-engineer tone
- Corporate Blue: `bg-primary` (#004F8F)
- Use partnership language ("together", "collaborate")
- No marketing clichés

## Target Users

This internal admin app is for **Technical Sales Representatives** who:
- Do LinkedIn outreach
- Create content through the orchestrator
- View and manage leads in the CRM
- Track campaign analytics

Keep the UI simple and focused on these workflows.

## Deprecated / Do Not Use

- Direct Unipile scripts in `execution/` - Use Admin UI instead
- Any script that bulk-sends LinkedIn messages without UI confirmation
- Old automation governor system was removed - do not recreate

## Quick Commands

```bash
npm run dev:web          # Start frontend
npm run test:e2e         # Run E2E tests
supabase functions serve # Local edge functions
```

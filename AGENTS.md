# AGENTS.md - Agent Guidelines for LifeTrek

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

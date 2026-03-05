# Source Tree Analysis: lifetrek

## Directory Structure

```text
lifetrek/
├── _bmad/              # BMAD Framework and workflows
├── _bmad-output/       # Generated AI artifacts and project context
├── admin/              # Admin-specific scripts or tools
├── components.json     # Shadcn UI configuration
├── docs/               # Project documentation (Scanned findings)
├── public/             # Static assets (images, icons)
├── src/                # Frontend source code
│   ├── assets/         # Brand assets and images
│   ├── components/     # React components
│   │   └── ui/         # Shadcn/Radix UI primitives
│   ├── config/         # App-wide configuration
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # External service clients (Supabase)
│   ├── lib/            # Utility libraries (cn helper)
│   ├── pages/          # Route-based page components
│   ├── types/          # TypeScript type definitions
│   └── utils/          # General helper functions
├── supabase/           # Backend configuration
│   ├── functions/      # Edge Functions (38 services)
│   ├── migrations/     # SQL schema migrations (120 files)
│   └── seed.sql        # Initial data seed
├── tests/              # Test suites
├── remotion/           # Video vignette source
├── remotion.config.ts  # Remotion configuration
├── vite.config.ts      # Vite build configuration
└── package.json        # Dependencies and scripts
```

## Critical Folders Summary

| Folder | Purpose | Key Patterns |
|--------|---------|--------------|
| `src/pages` | Entry points for all application routes | PascalCase, `.tsx` |
| `src/components` | Reusable UI logic and Shadcn components | kebab-case, `.tsx` |
| `supabase/functions`| Serverless backend logic (AI, Sync, Mail) | Deno, folder-per-function |
| `supabase/migrations`| Database schema and RLS policies | Timestamped SQL files |
| `src/integrations` | Supabase client and generated types | `client.ts` |
| `remotion` | Video automation and brand vignettes | React-based video |

## Integration Points

- **Frontend → Backend:** React Query calling Supabase Edge Functions and PostgREST.
- **AI Orchestration:** Edge functions (`chat`, `generate-blog-post`) interacting with OpenRouter/OpenAI.
- **Analytics:** `sync-ga4-analytics` and `sync-linkedin-analytics` updating Supabase tables.

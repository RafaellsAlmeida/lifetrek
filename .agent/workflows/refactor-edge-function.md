---
description: Refactor regenerate-carousel-images Edge Function into modules
---

# Refactor Edge Function

## Current State
- File: `supabase/functions/regenerate-carousel-images/index.ts`
- Size: 743 lines
- Version: v17 (deployed)

## Target Architecture

```
supabase/functions/regenerate-carousel-images/
├── index.ts              # Main handler (100 lines)
├── generators/
│   ├── nano-banana.ts    # Gemini 3 Pro image gen
│   ├── flash.ts          # Gemini Flash fallback
│   └── openrouter.ts     # OpenRouter fallback
├── prompts/
│   └── brand-prompt.ts   # Lifetrek brand prompt builder
├── utils/
│   ├── storage.ts        # Supabase Storage helpers
│   └── logging.ts        # Log capture utilities
└── types.ts              # TypeScript interfaces
```

## Steps

1. **Create shared module structure**
   ```bash
   mkdir -p supabase/functions/regenerate-carousel-images/generators
   mkdir -p supabase/functions/regenerate-carousel-images/prompts
   mkdir -p supabase/functions/regenerate-carousel-images/utils
   ```

2. **Extract types** → `types.ts`

3. **Extract generators** → `generators/*.ts`

4. **Extract prompt builder** → `prompts/brand-prompt.ts`

5. **Extract utils** → `utils/*.ts`

6. **Update index.ts** to import modules

7. **Deploy with bundled files** via MCP

## Important Notes

- Supabase uses Deno, so use `.ts` imports
- Test locally with `supabase functions serve`
- Bundle all files when deploying via MCP

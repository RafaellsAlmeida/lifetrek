---
name: Social Content Orchestrator
description: Generates high-quality social media content (LinkedIn/Instagram) using an AI Design Agency multi-agent pipeline via CLI.
---

# Social Content Orchestrator Skill

This skill allows you to generate professional B2B social media content for Lifetrek Medical using a multi-agent workflow running explicitly in your terminal.

## Architecture (AI Design Agency Pattern)

The pipeline follows the Design Agency model — specialists that each own their lane, retrieval that teaches by example, and a critic that loops until quality is met:

1. **RAG Context** — Searches knowledge base, finds similar successful carousels, loads rejection history
2. **Strategist Agent** — Plans narrative arc, hook, key messages (enriched with KB + research context)
3. **Style Brief Agent** — Analyzes top-performing past carousels to extract reusable patterns
4. **Copywriter Agent** — Writes headlines and body copy (PT-BR), guided by style brief
5. **Designer Agent** — Creates art direction per slide, guided by visual mood from style brief
6. **Analyst Agent** — Quality gate with selective re-routing (up to 3 critique rounds)
7. **Ranker Agent** — When using `--variations`, picks the best variation

## How to Run

```bash
deno run --allow-all scripts/generate_social_agent.ts "Your Topic Here"
```

## CLI Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Generate content without saving to Supabase or triggering image gen |
| `--research` | Enable Perplexity deep research for industry trends and stats |
| `--variations=N` | Generate N creative variations, ranked by a dedicated Ranker agent |

## Examples

**Basic generation:**
```bash
deno run --allow-all scripts/generate_social_agent.ts "100% CMM Inspection benefit"
```

**With deep research:**
```bash
deno run --allow-all scripts/generate_social_agent.ts "ISO 7 Cleanroom Packaging" --research
```

**3 variations with ranking (dry run):**
```bash
deno run --allow-all scripts/generate_social_agent.ts "Precisão CNC em Implantes" --variations=3 --dry-run
```

**Full pipeline with research + variations:**
```bash
deno run --allow-all scripts/generate_social_agent.ts "ANVISA Compliance" --research --variations=3
```

## Key Features

- **Critique Loop (up to 3 rounds)**: Analyst scores content and selectively routes back to only the agent that needs fixing (copywriter, designer, or both). Stops early on diminishing returns.
- **RAG Integration**: Queries knowledge base and successful past carousels before generation. Style brief extracted from top performers.
- **Rejection Feedback**: Loads admin rejection reasons from Supabase and injects them as "patterns to avoid" into all agent prompts.
- **Multi-Variation + Ranking**: Generate 3-5 creative variations with different temperatures, then a Ranker agent picks the winner.
- **Generation Metadata**: Saves pipeline version, RAG usage, critique rounds, and variation scores to `generation_metadata` JSONB column.

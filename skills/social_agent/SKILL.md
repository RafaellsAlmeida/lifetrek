---
name: Social Content Orchestrator
description: Generates high-quality social media content (LinkedIn/Instagram) using an AI Design Agency multi-agent pipeline via CLI.
---

# Social Content Orchestrator Skill

This skill allows you to generate professional B2B social media content for Lifetrek Medical using a multi-agent workflow running explicitly in your terminal.

## Pipelines

| Platform | Script | Table |
|----------|--------|-------|
| LinkedIn | `scripts/generate_social_agent.ts` | `linkedin_carousels` |
| Instagram | `scripts/generate_instagram_agent.ts` | `instagram_posts` |

Both follow the same Design Agency pattern with platform-specific adaptations.

## Architecture (AI Design Agency Pattern)

Specialists that each own their lane, retrieval that teaches by example, and a critic that loops until quality is met:

### LinkedIn Pipeline
1. **RAG Context** — Knowledge base + similar carousels + rejection history
2. **Strategist** — Narrative arc, hook, key messages
3. **Style Brief** — Learns from top-performing past carousels
4. **Copywriter** — Headlines + body (PT-BR)
5. **Designer** — Art direction per slide
6. **Analyst** — Quality gate with selective re-routing (up to 3 rounds)
7. **Ranker** — Picks best variation (when `--variations`)

### Instagram Pipeline
1. **RAG Context** — Knowledge base + similar IG posts + rejection history
2. **Strategist** — Visual-first strategy, post type selection
3. **Style Brief** — Learns from top-performing Instagram posts
4. **Copywriter** — Caption (first 125 chars = hook), slide text, CTA
5. **Designer** — Visual-first art direction (1080x1080)
6. **Hashtag Pro** — Researches 15-25 hashtags across brand/industry/niche groups
7. **Analyst** — Instagram-specific quality gate (visual impact, hook, engagement)
8. **Ranker** — Picks best variation

## How to Run

### LinkedIn
```bash
deno run --allow-all scripts/generate_social_agent.ts "Your Topic Here"
```

### Instagram
```bash
deno run --allow-all scripts/generate_instagram_agent.ts "Your Topic Here"
```

## CLI Flags

| Flag | LinkedIn | Instagram | Description |
|------|:--------:|:---------:|-------------|
| `--dry-run` | yes | yes | Generate without saving to Supabase |
| `--research` | yes | yes | Enable Perplexity deep research |
| `--variations=N` | yes | yes | Generate N variations with ranking |
| `--type=TYPE` | — | yes | Post type: `carousel` (default), `feed`, `reel` |

## Examples

### LinkedIn
```bash
# Basic generation
deno run --allow-all scripts/generate_social_agent.ts "100% CMM Inspection benefit"

# With research + 3 variations
deno run --allow-all scripts/generate_social_agent.ts "ANVISA Compliance" --research --variations=3
```

### Instagram
```bash
# Carousel (default)
deno run --allow-all scripts/generate_instagram_agent.ts "Swiss Turning process"

# Single feed post
deno run --allow-all scripts/generate_instagram_agent.ts "ISO 7 Cleanroom" --type=feed

# With research + variations (dry run)
deno run --allow-all scripts/generate_instagram_agent.ts "Precisão CNC" --research --variations=3 --dry-run
```

## Key Features

- **Critique Loop (up to 3 rounds)**: Analyst scores content and selectively routes back to only the agent(s) that need fixing. Stops early on diminishing returns.
- **RAG Integration**: Queries knowledge base and similar successful posts before generation. Style brief extracted from top performers.
- **Rejection Feedback**: Past admin rejections injected as "patterns to avoid" into all agent prompts.
- **Multi-Variation + Ranking**: Generate 3-5 creative variations with different temperatures, then a Ranker agent picks the winner.
- **Platform-Specific Agents**: Instagram adds Hashtag Pro agent (15-25 hashtags across groups) and uses visual-first criteria. LinkedIn focuses on narrative depth.
- **Generation Metadata**: Pipeline version, RAG usage, critique rounds, hashtag groups, and variation scores saved to `generation_metadata` JSONB column.

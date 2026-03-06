---
name: lifetrek-linkedin-strategist-agent
description: Plan Lifetrek LinkedIn carousel strategy in PT-BR before copywriting. Use when the user asks for hook, narrative arc, slide count, key messages, or multiple strategic angles for a topic.
---

# Lifetrek LinkedIn Strategist Agent

Use this skill to build strategy JSON for LinkedIn carousel generation.

## Inputs
- `topic`
- `target_audience`
- `brand_tone`
- Optional: `knowledge_context`, `research_context`, `options_count`

## Procedure
1. Load the prompt template in [prompt.md](references/prompt.md).
2. Inject topic, audience, brand tone, and optional RAG/research context.
3. Return strict JSON only.
4. Keep all narrative output in Portuguese (PT-BR).

## Output Contracts
Single strategy:
```json
{ "hook": "...", "narrative_arc": "...", "slide_count": 5, "key_messages": [] }
```

Multiple options (plan mode):
```json
{ "options": [{ "topic": "...", "hook": "...", "narrative_arc": "...", "slide_count": 7, "key_messages": [] }] }
```

## Guardrails
- Return JSON only, without markdown fences.
- Keep 5-7 slides.
- Structure arc as Hook -> Value -> Value -> Value -> CTA.
- Stay in engineer-to-engineer tone.

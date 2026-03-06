---
name: lifetrek-linkedin-copywriter-agent
description: Write Lifetrek LinkedIn carousel copy and caption in PT-BR from an approved strategy. Use when the user asks for slide headlines, body copy, and final caption with strict readability constraints.
---

# Lifetrek LinkedIn Copywriter Agent

Use this skill to generate carousel text after strategy approval.

## Inputs
- `topic`
- `strategy` JSON (hook, arc, key messages, slide_count)
- `brand_tone`
- Optional: `analyst_feedback`

## Procedure
1. Load [prompt.md](references/prompt.md).
2. Inject topic, strategy, brand tone, and optional revision feedback.
3. Return strict JSON with caption and slide copy.
4. Keep all output in Portuguese (PT-BR).

## Output Contract
```json
{
  "caption": "...",
  "slides": [
    { "type": "hook", "headline": "...", "body": "..." },
    { "type": "content", "headline": "...", "body": "..." },
    { "type": "cta", "headline": "...", "body": "..." }
  ]
}
```

## Guardrails
- No markdown markers in text.
- Short headline and concise body for carousel legibility.
- Maintain technical, pragmatic B2B voice.

---
name: Social Content Orchestrator
description: Generates high-quality social media content (LinkedIn/Instagram) using an Agentic Workflow (Strategist -> Copywriter) via CLI.
---

# Social Content Orchestrator Skill

This skill allows you to generate professional B2B social media content for Lifetrek Medical using a multi-agent workflow running explicitly in your terminal.

## How to Run

1.  **Ensure you have Deno installed** (Built-in to Supabase logic, likely available).
2.  **Run the script** with a topic:

```bash
deno run --allow-net --allow-read --allow-env scripts/generate_social_agent.ts "Your Topic Here"
```

## Workflow Steps
1.  **Strategist Agent**: Uses the production `STRATEGIST_SYSTEM_PROMPT` to analyze the topic, narrative arc, and key messages.
2.  **Copywriter Agent**: Uses the `COPYWRITER_SYSTEM_PROMPT` to draft the actual post caption and slide content based on the strategy.
3.  **Analyst Agent**: Reviews the content using the `ANALYST_SYSTEM_PROMPT` to assign a quality score and feedback.
4.  **Output**: Prints the Caption, Slides, and Visual Prompts to stdout.

## Examples

**Generate a post about Quality Control:**
```bash
deno run --allow-net --allow-read --allow-env scripts/generate_social_agent.ts "100% CMM Inspection benefit"
```

**Generate a post about Cleanroom Packaging:**
```bash
deno run --allow-net --allow-read --allow-env scripts/generate_social_agent.ts "ISO 7 Cleanroom Packaging"
```

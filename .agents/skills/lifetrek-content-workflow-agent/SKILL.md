---
name: lifetrek-content-workflow-agent
description: End-to-end IDE workflow for Lifetrek content operations: ideation -> strategy -> copy -> design -> analysis -> ranking -> human edit -> approval handoff.
---

# Lifetrek Content Workflow Agent

Use this skill as the IDE command center for the full content process.

## Workflow Steps
1. Ideation (`lifetrek-content-ideation-agent`)
2. Strategy (`lifetrek-linkedin-strategist-agent`)
3. Copy (`lifetrek-linkedin-copywriter-agent`)
4. Design direction (`lifetrek-linkedin-designer-agent`)
5. Quality analysis (`lifetrek-linkedin-analyst-agent`)
6. Variant ranking (`lifetrek-linkedin-ranker-agent`)
7. Human editing (`lifetrek-content-editor-agent`)
8. Newsletter adaptation (`lifetrek-linkedin-newsletter-system-agent`) when a blog/resource should feed LinkedIn newsletter distribution
9. Final approval package (JSON + publish notes)
10. Local Execution (Optional via `lifetrek-local-carousel-generator`)

## Inputs
- `campaign_goal`
- `platform`
- `topic` (optional if ideation enabled)
- `target_icp`
- `output_count`

## Procedure
1. If no topic, run ideation first.
2. Create 1-3 strategy options.
3. Generate copy + design directives for each option.
4. Score and rank outputs.
5. Apply human editorial pass.
6. If the source is a blog or resource theme, adapt it into a LinkedIn newsletter edition + feed promo using `lifetrek-linkedin-newsletter-system-agent`.
7. Produce final package for `/admin/content-approval`.

## Output Contract
```json
{
  "selected_option": 1,
  "final_payload": {
    "topic": "...",
    "platform": "linkedin",
    "strategy": {},
    "copy": {},
    "design": {},
    "qa": {}
  },
  "approval_notes": ["..."],
  "next_action": "submit_for_approval"
}
```

## Execution Modes
- **Remote (Default)**: Submit final package to `/admin/content-approval` which triggers Edge Functions.
- **Local (Developer/Fast Iteration)**: Use the `lifetrek-local-carousel-generator` skill to run scripts via Deno.

## Guardrails
- Use PT-BR output for user-facing text.
- Keep ICP and persona fields internal to strategy/approval metadata; remove raw ICP labels or codes from any client-facing deliverable.
- Strip internal editorial notes before approval handoff, including public-language guidance, claim-safety instructions, and "do not publish" notes.
- Treat the site as the canonical source for blog/resource themes; LinkedIn newsletter and feed outputs are adapted distribution assets, not copies of the full article.
- Respect Lifetrek template/brand constraints.
- Keep variant history and non-destructive edits.

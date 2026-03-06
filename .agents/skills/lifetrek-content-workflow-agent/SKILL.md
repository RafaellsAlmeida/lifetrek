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
8. Final approval package (JSON + publish notes)

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
6. Produce final package for `/admin/content-approval`.

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

## Guardrails
- Use PT-BR output for user-facing text.
- Respect Lifetrek template/brand constraints.
- Keep variant history and non-destructive edits.

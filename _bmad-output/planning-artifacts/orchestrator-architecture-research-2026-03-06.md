# Orchestrator Architecture Research (2026-03-06)

## Question
Should `/admin/orchestrator` use full multi-agent architecture for user input handling, or a conversation-to-params layer?

## Executive Recommendation
Use a **hybrid** architecture:
1. **Primary intake:** conversation-to-params (schema-constrained).
2. **Conditional escalation:** invoke specialized agents only when confidence is low, ambiguity is high, or deep research is requested.
3. **Downstream generation:** keep multi-agent pipeline for content production (strategist/copywriter/designer/analyst).

This gives lower latency and higher reliability for normal requests, while preserving multi-agent power for complex cases.

## Evidence Summary

### 1) Structured params are now highly reliable
- OpenAI reports Structured Outputs can enforce exact schema when `strict: true`, which directly fits intent-to-params extraction for orchestrator intake.
- Source: https://openai.com/index/introducing-structured-outputs-in-the-api/

### 2) Multi-agent should be used when complexity justifies it
- LangGraph guidance explicitly recommends using a simpler single-agent pattern for fewer tools/tasks, and multi-agent when one agent has too many tools/context.
- Source: https://github.com/langchain-ai/langgraph-supervisor

### 3) Multi-agent has strengths for decomposition and collaboration
- AutoGen and MetaGPT show advantages for complex collaborative workflows, role separation, and software/content planning pipelines.
- Sources:
  - https://arxiv.org/abs/2308.08155 (AutoGen)
  - https://arxiv.org/abs/2308.00352 (MetaGPT)

### 4) But multi-agent can be expensive/slow; distillation often helps
- Recent work (AgentArk) shows many scenarios where useful multi-agent behavior can be distilled into a single efficient agent.
- Source: https://arxiv.org/abs/2602.03955

## Practical Decision for Lifetrek

### Keep as default (recommended now)
- `chat(mode=orchestrator_intent)` -> strict params (`topic`, `targetAudience`, `platform`, etc.) -> user confirmation -> generation.
- Benefits: predictable UX, lower cost, simpler debugging, easier audit trail.

### Add as escalation path
Trigger specialized sub-agents only when one or more conditions are true:
1. Missing required fields after clarification attempts.
2. User explicitly asks for deep research/strategy alternatives.
3. Confidence score below threshold (e.g., `<0.65`).
4. High-impact content (campaign launch, executive post, regulated claim-sensitive content).

### Suggested architecture shape
1. **Intent Router (single):** deterministic extraction + validation.
2. **Escalation Manager:** decides whether to call research/planning agents.
3. **Generator Pipeline (multi-agent):** existing strategist -> copywriter -> designer -> analyst chain.
4. **Human checkpoint:** always confirm final params before generation.

## Operational Metrics to Compare Modes

1. Param extraction success rate (no clarification needed).
2. Clarification turns per successful generation.
3. Time-to-first-usable-draft.
4. Cost per generation request.
5. Approval-pass rate (first review cycle).

## Decision
For Lifetrek orchestrator input mode, **conversation-to-params should remain the default**. A full multi-agent intake is useful only as conditional escalation, not as the baseline path.


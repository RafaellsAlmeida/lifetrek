import { CarouselParams } from "./types.ts";

const LLM_RANKING_KEYWORDS = [
  "llm",
  "large language model",
  "language model",
  "sglang",
  "prefill",
  "ranking",
  "ranker",
  "inference",
  "latency",
  "throughput",
  "tokenization",
  "batching",
  "prefix cache",
  "kv cache",
  "scheduler",
  "grpc",
  "gpu",
  "search relevance",
  "ai search",
  "people search",
  "job search",
  "recomendação",
  "recomendacao",
  "ranqueamento",
  "prefill-only",
];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isLlmRankingTopic(params: CarouselParams): boolean {
  const merged = [
    params.topic || "",
    params.targetAudience || "",
    params.painPoint || "",
    params.desiredOutcome || "",
    ...(params.proofPoints || []),
  ].join(" ");

  const normalized = normalizeText(merged);
  return LLM_RANKING_KEYWORDS.some((keyword) => normalized.includes(normalizeText(keyword)));
}

export function getLlmRankingPlaybookContext(): string {
  return `
=== LINKEDIN CASE PLAYBOOK: SGLang FOR PREFILL-ONLY RANKING (LinkedIn Engineering, 2026-02-20) ===
Use this playbook only for AI/LLM search, ranking, relevance, latency, throughput, or inference-engineering topics.

Core framing:
1) Ranking workload is NOT chatbot generation.
2) Prefill-only ranking = run prompt understanding once, score many candidates, no decoding loop.
3) Optimization should follow production bottlenecks in sequence, not random tweaks.

Four-stage story arc (recommended):
- Stage 1: Batch everything possible (tokenization + transport + scheduler visibility).
- Stage 2: Introduce a scoring-only fast path (skip decode/sampling/KV updates not needed for scoring).
- Stage 3: Reuse shared query work (in-batch prefix KV reuse / shared-prefix amortization).
- Stage 4: Remove Python runtime bottlenecks (GC pauses, GIL contention, multiprocessing for gRPC/scheduler).

Source-backed evidence you may cite (attribute as "LinkedIn engineering reportou em 20/02/2026"):
- Async dynamic batch tokenization: P99 4583ms -> 464ms (~10x) on embedding workload.
- "Batch send" preserving batch boundaries: ~41.5% average latency reduction (70.39ms -> 41.12ms).
- Scoring-path optimization: P99 6220ms -> 454ms (13.7x) and ~25% throughput gain.
- Multi-process serving + scheduler scaling: additional ~40% throughput gain.
- End-to-end production outcome on text ranking example: 750 -> 2200 items/s/GPU (~3x) with P99 <= 500ms.

Copy guidance:
- Engineer-to-engineer tone, precise, evidence-led, no hype.
- Explain trade-offs (what was removed, why it mattered, what bottleneck appeared next).
- Prefer concrete mechanisms over buzzwords (batch boundary, CPU-GPU sync, prefix reuse, GIL).
- If metrics are used, use only the values listed above and always attribute to LinkedIn's report.
`;
}

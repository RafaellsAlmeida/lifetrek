# LinkedIn SGLang Prefill-Only Playbook

Fonte incorporada no sistema:
- LinkedIn Engineering Blog, 20/02/2026
- Título: "Scaling LLM-Based ranking systems with SGLang at LinkedIn"

## Objetivo
Usar esse case como referência técnica para carrosséis de LinkedIn sobre:
- AI Search
- LLM Ranking
- Infra de inferência
- Latência/P99 e throughput
- Otimização de serving

## Como foi integrado
- `supabase/functions/generate-linkedin-carousel/topic_playbooks.ts`
  - Detecta temas de ranking/infra LLM por palavra-chave.
  - Injeta contexto técnico e métricas permitidas no Strategist/Copywriter.
- `supabase/functions/generate-linkedin-carousel/agents.ts`
  - `strategistAgent`: recebe contexto de narrativa em estágios.
  - `strategistPlansAgent`: gera ângulos distintos para o mesmo case.
  - `copywriterAgent`: aplica regras de tom técnico e uso responsável de métricas.
- `supabase/functions/chat/index.ts`
  - Orchestrator passa a sugerir framing técnico para temas AI/LLM/search.

## Estrutura recomendada de narrativa
1. Diferença de workload: geração de texto vs prefill-only ranking.
2. Stage 1: batching (tokenização + preservação de batch boundary).
3. Stage 2: scoring-only fast path (sem decode/sampling desnecessário).
4. Stage 3: reutilização de prefixo/KV.
5. Stage 4: gargalos de runtime Python (GC, GIL, multiprocessing).
6. Encerramento com lição de produção: profile -> optimize -> repeat.

## Métricas permitidas no copy
Usar apenas quando relevante e sempre atribuir:
"LinkedIn reportou em 20/02/2026..."

- P99 4583ms -> 464ms (~10x) com async dynamic batch tokenization.
- 70.39ms -> 41.12ms (~41.5%) com batch send.
- P99 6220ms -> 454ms (13.7x) + ~25% throughput no scoring fast path.
- ~40% throughput adicional com multi-process gRPC/scheduler.
- 750 -> 2200 items/s/GPU (~3x) no exemplo de ranking textual.

## Guardrails editoriais
- Tom engenheiro-para-engenheiro, sem hype.
- Explicar mecanismo e trade-off, não só resultado.
- Não inventar métricas novas.
- Não apresentar esses benchmarks como resultados da Lifetrek.

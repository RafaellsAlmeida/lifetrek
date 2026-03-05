# Smart Regen Orchestrator Plan

Data: 2026-03-05  
Escopo: estabilizar seleção inteligente de fundo (real vs IA), troca manual e persistência de variantes no Social Media Workspace.

## Orch Agent (central)

Nome: `orch-smart-regeneration`  
Missão: coordenar execução técnica, priorização, qualidade e evidências de teste até a operação ficar estável no ambiente real.

Responsabilidades:
- quebrar trabalho em subtarefas executáveis.
- destravar dependências entre backend, UI e dados.
- aplicar critérios de aceite objetivos por rodada.
- publicar status diário (pass/fail/blockers).

## Sub-Agents

### 1) Auth & Deploy Agent

Objetivo:
- eliminar falhas `401 Invalid JWT` em `regenerate-carousel-images`.
- garantir deploy das edge functions corretas no projeto remoto.

Subtasks:
- validar estratégia de auth para functions protegidas.
- confirmar `verify_jwt` por function e compatibilidade com token de usuário.
- efetivar deploy da versão mais recente de `regenerate-carousel-images`.
- efetivar deploy de `set-slide-background`.
- registrar runbook de deploy/revert.

Critério de aceite:
- botão `Regenerar Fundo (Smart)` funciona no UI sem fallback local.

### 2) Smart Selection Agent

Objetivo:
- garantir qualidade de decisão por intenção/threshold.

Subtasks:
- validar classificação de intenção por texto.
- validar pools por intenção.
- revisar thresholds iniciais e coletar métricas.
- validar anti-repetição (consecutivo + janela curta).
- validar curated overrides (parceiro, qualidade/máquinas, cleanroom, vet/odonto).

Critério de aceite:
- resultados visuais coerentes em >= 80% dos testes de amostra.

### 3) UI Resilience Agent

Objetivo:
- manter UX funcional mesmo com falhas de backend.

Subtasks:
- fallback local para smart quando a function retorna erro de auth.
- persistência manual com histórico sem sobrescrever variantes.
- mensagens claras para usuário sobre fallback e status.
- evitar duplicação de toasts e estados inconsistentes.

Critério de aceite:
- usuário consegue trocar/regenerar fundo sem perder trabalho.

### 4) Data Integrity Agent

Objetivo:
- garantir integridade dos campos de slide e versionamento.

Subtasks:
- validar `image_url`, `image_urls[n]`, `image_variants`, `asset_source`, `selection_reason`.
- validar crescimento de variantes sem perda histórica.
- validar compatibilidade de schema entre `linkedin_carousels` e `instagram_posts`.
- validar uso de `asset_embeddings` e RPC `match_asset_candidates`.

Critério de aceite:
- queries de verificação retornam dados consistentes após refresh.

### 5) QA Agent

Objetivo:
- executar regressão focada no fluxo de design social.

Subtasks:
- rodar casos `2.1.4A`, `2.1.4B`, `2.1.4C`, `3.3` do plano de testes.
- registrar evidências (logs + screenshot).
- classificar falhas por severidade e impacto.

Critério de aceite:
- todos os casos críticos passados ou com mitigação ativa documentada.

### 6) Docs Agent

Objetivo:
- manter documentação sincronizada com comportamento real.

Subtasks:
- atualizar contratos de API.
- atualizar modelo de dados e campos de slide.
- atualizar plano de testes e troubleshooting.
- registrar status de bloqueios reais (auth/deploy).

Critério de aceite:
- qualquer dev/admin consegue reproduzir e operar o fluxo sem ambiguidades.

## Status Atual (rodada 2)

Passou:
- deploy remoto das functions `regenerate-carousel-images` e `set-slide-background`.
- auth manual de admin em ambas as functions (token + permissão admin).
- `Regenerar Fundo (Smart)` operacional no UI sem erro de JWT.
- seleção smart para `"Um Parceiro. Solucao Completa."` priorizando asset real (`rule_override`, score `0.81`).
- `Trocar Fundo` operacional com persistência e histórico.

Observação:
- fallback local permanece ativo como camada de resiliência para indisponibilidade temporária da edge function.

## Backlog Prioritário (ordem)

1. Calibrar thresholds por métricas reais (`real_asset_hit_rate`, `ai_fallback_rate`).
2. Popular/normalizar `asset_embeddings` e validar RPC semântico em produção.
3. Rodar regressão completa no Social Media Workspace (demais abas + analytics).
4. Fechar pacote de docs com runbook operacional para time não técnico.

## Definição de "bons resultados"

- `Regenerar Fundo (Smart)` operacional no UI sem erro de auth.
- `Trocar Fundo` operacional no UI com histórico preservado.
- persistência confirmada por refresh + consulta SQL.
- taxa de fallback IA controlada e justificável por threshold.

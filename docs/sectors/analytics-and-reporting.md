# Analytics e Relatórios

## Objetivo

Transformar dados de conteúdo, website e leads em sinais úteis para decisão comercial e editorial.

## Rota principal

- `/admin/analytics`

## Blocos atuais

- Website
- Conteúdo LinkedIn
- Leads
- Relatório mensal

## Fontes e funções principais

- `supabase/functions/ingest-linkedin-analytics/index.ts`
- `supabase/functions/sync-ga4-analytics/index.ts`
- `supabase/functions/sync-linkedin-analytics/index.ts`
- `src/components/admin/analytics/LinkedInCsvUploadPanel.tsx`
- `src/components/admin/analytics/ImportedAnalyticsSummary.tsx`
- `src/hooks/useImportedLinkedInAnalytics.ts`
- `src/hooks/useInternalAnalytics.ts`

## Tabelas relevantes

- `linkedin_analytics`
- `linkedin_analytics_daily`
- `analytics_events`
- `blog_analytics`
- `lead_behavior_logs`

## Fluxo principal

1. Importar ou sincronizar dados.
2. Validar estrutura e período.
3. Persistir dados normalizados.
4. Exibir resumo operacional.
5. Apoiar decisões de conteúdo e comercial.

## Regras

- A tela precisa explicar o próximo passo quando não há dados.
- O operador deve entender conflitos de período antes de importar.
- Métricas devem se conectar a decisões, não apenas a dashboards.
- Agregações pesadas devem migrar para backend quando o volume crescer.

## Riscos

- downloads client-side excessivos;
- importação com linhas rejeitadas difíceis de auditar;
- painéis que mostram números, mas não direcionam ação;
- baixa conexão entre analytics e CRM/editorial.

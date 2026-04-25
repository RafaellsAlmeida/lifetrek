# CRM e Leads

## Objetivo

Dar clareza operacional ao pipeline comercial técnico da Lifetrek.

## Rotas e superfícies

- `/admin/leads`
- `src/components/admin/LeadsCRMBoard.tsx`
- `src/components/admin/LeadsSpreadsheet.tsx`

## Fluxos principais

1. Receber lead manualmente, pelo site ou por importação.
2. Revisar lead no board ou spreadsheet.
3. Atualizar status, prioridade e contexto.
4. Exportar ou importar quando necessário.
5. Usar o pipeline para orientar follow-up comercial.

## Tabela principal

- `contact_leads`

## Status usados no board

- `new`
- `contacted`
- `in_progress`
- `quoted`
- `closed`
- `rejected`

## Prioridades

- `low`
- `medium`
- `high`

## Funções e pontos de integração

- `supabase/functions/import-leads/index.ts`
- `supabase/functions/manage-leads-csv/index.ts`
- relatórios internos em analytics

## Regras operacionais

- O CRM deve ser simples para uso diário.
- Importações devem ser seguras e auditáveis.
- Atualizações em tempo real não podem comprometer consistência do pipeline.
- O board precisa servir à ação, não só à visualização.

## Métricas úteis

- total de leads abertos;
- taxa de fechamento;
- distribuição por estágio;
- origem mais valiosa;
- tempo médio entre estágios.

## Riscos

- dados importados inconsistentes;
- prioridades mal calibradas;
- board bonito, mas pouco acionável;
- divergência entre board e visão tabular.

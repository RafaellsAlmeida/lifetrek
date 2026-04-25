# Aprovação e Publicação

## Objetivo

Esta área garante que conteúdo social e blog passem por revisão interna e, quando necessário, por revisão externa de stakeholders antes da publicação.

## Fluxo principal

1. Conteúdo é criado e validado internamente.
2. O time usa `/admin/content-approval` para revisar itens pendentes.
3. Conteúdos selecionados podem ser enviados em lote por email para stakeholders.
4. O stakeholder acessa `/review/:token`.
5. Ele aprova, rejeita ou sugere edições de copy.
6. O time vê o retorno no admin e decide a próxima ação.

## Rotas

- `/admin/content-approval`
- `/review/:token`

## Componentes e funções principais

- `src/components/admin/content/ContentApprovalCore.tsx`
- `src/components/admin/content/SendReviewModal.tsx`
- `src/hooks/useStakeholderReview.ts`
- `supabase/functions/send-stakeholder-review/index.ts`
- `supabase/functions/stakeholder-review-action/index.ts`
- `supabase/functions/_shared/stakeholderReviewEmail.ts`

## Tabelas principais

- `stakeholder_review_batches`
- `stakeholder_review_tokens`
- `stakeholder_review_items`

## Estados importantes

- `pending`
- `approved`
- `rejected`
- `stakeholder_review_pending`
- `stakeholder_approved`
- `stakeholder_rejected`

## Regras operacionais

- Só enviar para stakeholder conteúdo já aprovado internamente.
- Tokens devem expirar e ter escopo mínimo.
- Rejeição precisa gerar contexto acionável.
- Sugestões de edição devem permanecer rastreáveis.
- Aprovação externa não deve depender de login administrativo.

## Métricas úteis

- taxa de envio concluído sem falha;
- taxa de aprovação por lote;
- tempo médio entre envio e decisão;
- volume de itens com solicitação de copy edit.

## Riscos

- lote parcialmente enviado;
- token expirado sem clareza para o revisor;
- status incoerente entre item, lote e conteúdo de origem;
- aprovação sem pré-requisitos editoriais.

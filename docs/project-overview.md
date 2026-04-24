# Visão Geral do Projeto Lifetrek

## Resumo Executivo

O Lifetrek é uma aplicação interna para apoiar a operação comercial técnica da Lifetrek Medical. A plataforma concentra geração e aprovação de conteúdo, blog técnico, CRM de leads, analytics e desenho técnico em um painel administrativo único.

A documentação antiga descrevia o produto com forte ênfase em edição de imagem e vídeo dentro do app. Essa não é mais a direção principal. Recursos visuais continuam existindo como apoio ao conteúdo e à marca, mas o foco atual é operação, aprovação, conteúdo técnico, inteligência comercial e documentação técnica.

Referência padrão atual: [BMAD Standard Documentation - Lifetrek PT-BR](./bmad-standard-documentation-pt.md).

## Informações Centrais

- **Tipo:** React SPA monolítica.
- **Linguagem principal:** TypeScript.
- **Arquitetura:** frontend componentizado com Supabase Backend-as-a-Service.
- **Status:** desenvolvimento ativo com Vite/React 18.
- **Domínio:** `lifetrek-medical.com`.

## Stack Técnica

| Categoria | Tecnologia |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS |
| UI | Shadcn UI, Radix UI, Framer Motion |
| Backend | Supabase Auth, Postgres, Storage |
| Compute | Supabase Edge Functions (Deno) |
| Estado | TanStack Query e hooks dedicados |
| Testes | Playwright |
| Gráficos e visualização | Three.js, Recharts, Konva |
| CAD técnico | OpenCascade.js/WebAssembly |

Remotion e fluxos de vídeo podem existir no repositório como legado ou suporte técnico, mas não devem ser apresentados como prioridade estratégica atual.

## Usuários Principais

1. **Representantes técnicos:** acompanham leads, conteúdo e oportunidades.
2. **Marketing/conteúdo:** cria, edita e aprova materiais.
3. **Stakeholders Lifetrek:** revisam conteúdo por email e página pública.
4. **Engenharia/operação técnica:** usa o fluxo de desenho técnico.
5. **Administradores:** gerenciam acessos, dados e integrações.

## Módulos Administrativos

- `/admin/orchestrator`: orquestração de conteúdo.
- `/admin/content-approval`: aprovação interna e envio para stakeholders.
- `/admin/blog`: blog generator/editor.
- `/admin/leads`: CRM de leads.
- `/admin/analytics`: analytics unificado.
- `/admin/desenho-tecnico`: desenho técnico.
- `/admin/social`: social workspace e suporte visual.
- `/review/:token`: página pública de aprovação por email.

## Capacidades Atuais

### Aprovação por email

O sistema envia lotes de conteúdo para stakeholders por email, com links públicos seguros. Os revisores podem aprovar, rejeitar ou sugerir edições sem acessar o painel administrativo.

Arquivos relevantes:

- `src/components/admin/content/SendReviewModal.tsx`
- `supabase/functions/send-stakeholder-review/index.ts`
- `supabase/functions/stakeholder-review-action/index.ts`
- `supabase/functions/_shared/stakeholderReviewEmail.ts`

### Blog técnico

O blog combina geração assistida, edição, SEO, aprovação e publicação. O editor administra ICP, palavra-chave pilar, entity keywords, CTA, resumo, SEO title e SEO description.

Arquivos relevantes:

- `src/pages/Admin/AdminBlog.tsx`
- `src/hooks/useBlogPosts.ts`
- `src/types/blog.ts`
- `supabase/functions/generate-blog-post/index.ts`

### CRM

O CRM gerencia leads por status, prioridade, origem e empresa. Inclui importação/exportação CSV, atualização em tempo real e visão de pipeline.

Arquivos relevantes:

- `src/pages/AdminLeads.tsx`
- `src/components/admin/LeadsCRMBoard.tsx`
- `src/components/admin/LeadsSpreadsheet.tsx`
- `supabase/functions/import-leads/index.ts`

### Analytics

O analytics unificado consolida website, conteúdo LinkedIn, leads e relatórios mensais. A importação LinkedIn aceita CSV/XLS/XLSX e normaliza métricas para consulta no painel.

Arquivos relevantes:

- `src/pages/Admin/UnifiedAnalytics.tsx`
- `src/components/admin/analytics/LinkedInCsvUploadPanel.tsx`
- `src/components/admin/analytics/ImportedAnalyticsSummary.tsx`
- `supabase/functions/ingest-linkedin-analytics/index.ts`

### Desenho técnico

O fluxo de desenho técnico permite avançar de croqui ou referência para documento normalizado, validação, desenho 2D, folha A3, visualização 3D e exportação STEP.

Arquivos relevantes:

- `src/components/admin/engineering/TechnicalDrawingCore.tsx`
- `src/components/admin/engineering/EngineeringDrawing3DPreview.tsx`
- `src/lib/engineering-drawing/renderStep.ts`
- `src/lib/engineering-drawing/svg-renderer.ts`
- `supabase/functions/engineering-drawing/index.ts`

### Conteúdo e visual de apoio

O social workspace e o orquestrador continuam importantes para criação e revisão de conteúdo. Recursos de imagem devem seguir templates aprovados, usar fotos reais da Lifetrek e preservar histórico de variantes. Eles não são o centro do produto.

## Documentação BMAD

Para o ciclo atual, `_bmad-output/` segue como fonte canônica de planejamento e implementação. `docs/` funciona como navegação e documentação operacional.

- [Project Context AI Rules](../_bmad-output/project-context.md)
- [BMAD PRD](../_bmad-output/planning-artifacts/prd.md)
- [BMAD Architecture](../_bmad-output/planning-artifacts/architecture.md)
- [BMAD UX Design Specification](../_bmad-output/planning-artifacts/ux-design-specification.md)
- [BMAD Epics](../_bmad-output/planning-artifacts/epics.md)
- [BMAD Sprint Status](../_bmad-output/implementation-artifacts/sprint-status.yaml)
- [BMAD Standard Documentation - PT-BR](./bmad-standard-documentation-pt.md)

## Documentação por Setor

- [Aprovação e Publicação](./sectors/approval-and-publishing.md)
- [Blog e Editorial](./sectors/blog-and-editorial.md)
- [CRM e Leads](./sectors/crm-and-leads.md)
- [Analytics e Relatórios](./sectors/analytics-and-reporting.md)
- [Desenho Técnico](./sectors/technical-drawing.md)
- [Suporte Social e Governança Visual](./sectors/social-content-support.md)

## Acesso Administrativo

Use as credenciais de teste documentadas no guia interno do projeto. Não replique senhas em documentação compartilhável fora do repositório.

## Prioridade Atual

1. Consolidar aprovação por email como fluxo confiável.
2. Evoluir o blog generator/editor para alta qualidade editorial e SEO técnico.
3. Fortalecer CRM e analytics como base de decisões comerciais.
4. Polir o desenho técnico como diferencial operacional.
5. Manter geração visual como suporte controlado, não como promessa central.

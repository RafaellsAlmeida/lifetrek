# Plano de Testes - Admin Operations

## Objetivo

Cobrir os fluxos operacionais principais do Lifetrek por setor, em vez de testar apenas o antigo foco visual/social.

## Setores cobertos

1. Aprovação e publicação
2. Blog e editorial
3. CRM e leads
4. Analytics e relatórios
5. Desenho técnico
6. Suporte social e governança visual

## Ambiente

- Frontend: `npm run dev:web`
- Login admin: usar credenciais internas documentadas em `AGENTS.md`

## 1. Aprovação e Publicação

### Verificações

- abrir `/admin/content-approval`
- validar filas e filtros
- selecionar itens elegíveis
- abrir modal de envio
- confirmar preview do lote
- validar envio de stakeholder review
- abrir `/review/:token` com token válido
- validar aprovar, rejeitar e sugerir edição
- validar estado de token expirado

## 2. Blog e Editorial

### Verificações

- abrir `/admin/blog`
- editar artigo existente
- validar bloqueio de aprovação sem ICP ou palavra-chave pilar
- validar publicação com metadados completos
- validar abertura de edição a partir de contexto de aprovação

## 3. CRM e Leads

### Verificações

- abrir `/admin/leads`
- validar board por estágio
- editar status e prioridade
- usar busca e filtros
- importar lote de leads
- exportar CSV
- confirmar atualização em tempo real

## 4. Analytics e Relatórios

### Verificações

- abrir `/admin/analytics`
- validar estado vazio
- importar CSV/XLS/XLSX do LinkedIn
- revisar resumo do último período
- validar conflitos de período
- revisar top posts e métricas agregadas

## 5. Desenho Técnico

### Verificações

- abrir `/admin/desenho-tecnico`
- criar sessão a partir de entrada válida
- validar revisão humana e gate semântico
- gerar 2D/A3
- abrir preview 3D
- validar exportação STEP quando o estado permitir
- confirmar bloqueios quando revisão não estiver concluída

## 6. Suporte Social e Governança Visual

### Verificações

- abrir `/admin/social`
- gerar conteúdo
- abrir fluxo de design
- trocar fundo manualmente
- confirmar append em `image_variants`
- validar que a imagem anterior não foi sobrescrita
- confirmar que o fluxo continua integrado com aprovação

## Evidências mínimas

- screenshot por setor alterado;
- resultado observado;
- bloqueios ou inconsistências encontrados;
- referência do ambiente/teste usado.

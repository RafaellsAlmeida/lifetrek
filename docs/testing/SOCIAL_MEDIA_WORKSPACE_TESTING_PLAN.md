# Plano de Testes - Social Media Workspace

## Nota de escopo (2026-04-23)

O Social Media Workspace continua ativo, mas agora deve ser tratado como área de suporte ao conteúdo e à marca. Ele não representa mais o eixo principal do produto.

Para cobertura operacional completa do sistema, use também [ADMIN_OPERATIONS_TESTING_PLAN.md](./ADMIN_OPERATIONS_TESTING_PLAN.md).

## Objetivo

Validar que a área social continua funcional, integrada com aprovação e alinhada às regras de governança visual.

## Rotas e componentes

- `/admin/social`
- `ContentOrchestratorCore`
- `ImageEditorCore`
- `ContentApprovalCore`

## Casos principais

### 1. Carregamento e navegação

- abrir `/admin/social`
- validar tabs e conteúdo principal
- confirmar que o layout continua estável

### 2. Geração de conteúdo

- gerar item para LinkedIn ou Instagram
- validar que o resultado aparece no fluxo social
- confirmar integração com aprovação

### 3. Ajuste visual com histórico

- abrir aba/fluxo de design
- trocar fundo manualmente
- validar append em `image_variants`
- confirmar que a imagem anterior não foi perdida

### 4. Regras de asset-first

- usar tema compatível com asset real
- confirmar preferência por fotos reais da Lifetrek
- validar fallback somente quando necessário

### 5. Regressão de aprovação

- confirmar que itens sociais podem seguir para a fila de aprovação
- confirmar badges/estados coerentes

## Evidências mínimas

- screenshot do fluxo testado
- conteúdo/slide validado
- confirmação de que não houve sobrescrita destrutiva
- observações sobre falhas de integração

# Suporte Social e Governança Visual

## Objetivo

Manter o fluxo de conteúdo social útil para a operação, sem posicionar o Lifetrek como plataforma centrada em edição de imagem ou vídeo.

## Escopo correto

Esta área existe para:

- gerar e ajustar conteúdo para LinkedIn e Instagram;
- aplicar templates aprovados;
- usar assets reais da Lifetrek;
- apoiar aprovação e publicação.

Esta área não deve ser apresentada como:

- editor avançado de imagem;
- editor de vídeo;
- diferencial principal do produto.

## Rotas e componentes

- `/admin/social`
- `/admin/image-editor` (legado/suporte)
- `src/components/admin/content/ImageEditorCore.tsx`
- `supabase/functions/regenerate-carousel-images/index.ts`
- `supabase/functions/set-slide-background/index.ts`

## Regras visuais

- Templates aprovados apenas.
- Fotos reais da Lifetrek primeiro.
- IA visual apenas como fallback controlado.
- Histórico de variantes sempre preservado.

## Fluxo principal

1. Gerar conteúdo.
2. Ajustar slide quando necessário.
3. Trocar fundo ou regenerar variante.
4. Manter histórico.
5. Encaminhar para aprovação.

## Riscos

- escopo visual voltar a dominar o roadmap;
- prometer qualidade automática final onde ainda não há consistência;
- sobrescrever imagem antiga;
- criar estilos fora da biblioteca aprovada.

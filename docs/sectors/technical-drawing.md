# Desenho Técnico

## Objetivo

Permitir um fluxo técnico confiável entre referência inicial, revisão, validação e exportação.

## Rota principal

- `/admin/desenho-tecnico`

## Etapas do fluxo

1. Entrada por croqui, upload ou referência.
2. Estruturação do documento técnico.
3. Revisão humana.
4. Validação semântica e dimensional.
5. Geração de desenho 2D e folha A3.
6. Preview 3D.
7. Exportação técnica, incluindo STEP quando aplicável.

## Arquivos principais

- `src/components/admin/engineering/TechnicalDrawingCore.tsx`
- `src/components/admin/engineering/EngineeringDrawing3DPreview.tsx`
- `src/lib/engineering-drawing/renderStep.ts`
- `src/lib/engineering-drawing/renderA3.ts`
- `src/lib/engineering-drawing/svg-renderer.ts`
- `src/lib/engineering-drawing/validation.ts`
- `src/lib/engineering-drawing/semantic-validation.ts`
- `src/lib/engineering-drawing/repository.ts`
- `supabase/functions/engineering-drawing/index.ts`

## Tabela principal

- `engineering_drawing_sessions`

## Regras operacionais

- Ambiguidade exige revisão humana.
- Exportações devem respeitar gates de revisão.
- A interface deve priorizar fluxo técnico e legibilidade.
- O módulo deve ser tratado como sistema operacional de engenharia, não como experimento visual.

## Melhorias pendentes

- stepper principal;
- hierarquia do botão STEP;
- sobreposição de texto no 2D;
- UX de ambiguidade.

## Riscos

- exportar artefato técnico sem revisão suficiente;
- confundir preview visual com validade técnica;
- estados intermediários pouco claros para o operador.

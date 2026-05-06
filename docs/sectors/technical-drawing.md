# Desenho Técnico

## Objetivo

Permitir um fluxo técnico confiável entre referência inicial, revisão, validação e exportação.

## Rota principal

- `/admin/desenho-tecnico`

## Etapas do fluxo

1. Entrada por croqui, imagem, PDF, PPT ou PPTX.
2. Estruturação do documento técnico.
3. Revisão humana.
4. Validação semântica e dimensional.
5. Geração de desenho 2D, PPTX e folha A3.
6. Preview 3D por spec revisado ou GLB salvo.
7. Exportação técnica, incluindo STEP quando aplicável.

## Arquivos principais

- `src/components/admin/engineering/TechnicalDrawingCore.tsx`
- `src/components/admin/engineering/EngineeringDrawing3DPreview.tsx`
- `src/components/admin/engineering/EngineeringDrawingGlbPreview.tsx`
- `src/components/admin/engineering/RonaldoBatchReport.tsx`
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
- JSON/spec é artefato interno; stakeholder técnico revisa desenho, cotas, 3D e STEP, não payload bruto.
- STEP preliminar não deve ser tratado como liberação para fornecedor sem validação técnica.
- A interface deve priorizar fluxo técnico e legibilidade.
- O módulo deve ser tratado como sistema operacional de engenharia, não como experimento visual.

## Estado Ronaldo 05/05

- Lote visual publicado na rota principal com três peças: Cylinder 12s, Cylinder 20s e Step Bur 20s.
- Cada peça mostra fonte, desenho limpo, preview 3D GLB e downloads de PPTX/A3/GLB/STEP.
- O modelo de visão default da edge function é `openai/gpt-5.4`, com override por `ENGINEERING_DRAWING_VISION_MODEL`.
- Próxima validação depende do feedback do Ronaldo sobre cotas, features, formato de desenho e fidelidade 3D.

## Melhorias pendentes

- parser estrutural de PPTX/PDF;
- modelagem real de furo transversal, diamantado, canaletas e facetado;
- stepper principal;
- hierarquia do botão STEP;
- sobreposição de texto no 2D;
- UX de ambiguidade.

## Riscos

- exportar artefato técnico sem revisão suficiente;
- confundir preview visual com validade técnica;
- estados intermediários pouco claros para o operador.

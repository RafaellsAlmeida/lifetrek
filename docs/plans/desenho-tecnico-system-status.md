# Sistema de Desenho Tecnico - Estado Atual

Data: 2026-05-05

## Objetivo do sistema

Construir um fluxo rastreavel para transformar croqui, PPTX ou PDF tecnico em:

1. spec revisavel;
2. desenho 2D no padrao interno Ronaldo;
3. desenho tecnico A3;
4. preview 3D no app;
5. STEP validado para SolidWorks/fornecedor.

O objetivo final continua sendo chegar em um STEP confiavel, mas o criterio de curto prazo e mais pragmatico: Ronaldo precisa conseguir abrir o app, ver cada peça separada, revisar cotas/features visualmente e apontar erros tecnicos sem precisar ler JSON nem abrir SolidWorks.

## Onde estamos

### Produto

- Rota principal: `/admin/desenho-tecnico`.
- Upload aceita imagem, PDF, PPT e PPTX.
- PDF/PPT/PPTX entram como fonte 2D de referencia enquanto o parser estrutural nao esta pronto.
- A tela possui revisao de spec, validacao, exportacao 2D, A3, GLB e STEP.
- O lote Ronaldo 05/05 aparece no app como relatorio visual separado por peça.
- O preview 3D da tela agora abre GLB salvo quando existe `threeDAsset`, resolvendo a falha de resultados antigos que tinham arquivo 3D mas nao apareciam no canvas.

### IA

- Modelo default da edge function `engineering-drawing`: `openai/gpt-5.4`.
- Override por ambiente: `ENGINEERING_DRAWING_VISION_MODEL`.
- Prompt atual reforca regras aprendidas com Ronaldo:
  - linha inferior como fonte principal de comprimentos axiais;
  - `Ø` sempre como diametro;
  - rosca apenas quando chamada explicitamente;
  - notas como diamantado, facetado, chato e chanfro nao podem sumir;
  - ambiguidades devem bloquear ou pedir revisao, nao ser resolvidas silenciosamente.

### Lote Ronaldo 05/05

Peças publicadas no app:

| Peça | Fonte | Outputs visiveis |
| --- | --- | --- |
| Cylinder Pointed Bur 12s MCXL nova chinesa | PPTX | fonte, desenho limpo, desenho A3, PPTX, GLB, STEP |
| Cylinder Pointed Bur 20s MCXL usada | PPTX | fonte, desenho limpo, desenho A3, PPTX, GLB, STEP |
| Step Bur 20s MCXL usada | PDF/PPTX convertido | fonte, desenho limpo, desenho A3, PPTX, GLB, STEP |

Os JSONs, specs intermediarios e render specs ficam fora da interface do Ronaldo. Eles continuam em `tmp/` como material interno para debug e evolucao do sistema.

## Qualidade dos resultados atuais

O lote atual serve para revisao tecnica inicial, nao para fabricacao.

O que ja resolve:

- separacao clara entre as tres peças;
- visualizacao 3D diretamente no app via GLB;
- downloads organizados de PPTX, SVG/A3, GLB e STEP;
- registro explicito dos pontos que Ronaldo deve revisar por peça;
- base para feedback iterativo sem depender de Ronaldo abrir STEP.

O que ainda nao esta confiavel:

- STEP ainda precisa validacao no SolidWorks/fornecedor;
- furo transversal, canaletas, diamantado, facetado e acabamentos podem estar simplificados;
- divergencias entre soma de cotas parciais e comprimento total ainda exigem decisao humana;
- PPTX/PDF ainda nao sao parseados estruturalmente como shapes/textos/setas; a reconstrucao atual e orientada pelo exemplo.

## Roadmap

### P0 - Revisao com Ronaldo

- Ronaldo abre o lote no app e revisa cada peça.
- Capturar feedback objetivo por campo: cota errada, diametro vs comprimento, feature inexistente, feature faltante, posicao errada, formato de cota.
- Marcar claramente se cada erro e de:
  - leitura de entrada;
  - regra de interpretacao;
  - render 2D;
  - render 3D;
  - export STEP.

### P0 - Parser PPTX/PDF

- Ler texto, linha, seta, posicao e agrupamento do PPTX.
- Detectar cotas inferiores como cadeia axial.
- Detectar chamadas superiores/laterais como diametro, raio, rosca, chanfro, nota ou feature especial.
- Criar parser PDF para casos exportados do PowerPoint.

### P1 - Modelo geometrico

- Transformar furo transversal em geometria real no GLB/STEP.
- Modelar chanfros, transicoes, ponta conica e trechos escalonados com mais fidelidade.
- Representar diamantado/canaletas/facetado de forma acordada: geometria real, textura visual ou nota tecnica.

### P1 - Qualidade e rastreabilidade

- Persistir feedback de Ronaldo por campo.
- Criar status por artefato: rascunho, revisao interna, aprovado tecnicamente, liberado para fornecedor.
- Registrar usuario, data, fonte e versao para cada exportacao.

### P2 - Automacao de croqui

- Usar croquis legiveis como teste de limite.
- Comparar croqui -> PPTX Ronaldo -> desenho final para aprender regras.
- So permitir avanco automatico quando confianca e validacao dimensional forem suficientes.

## Links operacionais

- App: `/admin/desenho-tecnico`
- Lote Ronaldo: `/admin/desenho-tecnico#ronaldo-lote-2026-05-05`
- Assets publicos do lote: `/assets/engineering/ronaldo-2026-05-05/`
- Documento da call: `docs/plans/2026-05-05-desenho-tecnico-ronaldo-call.md`

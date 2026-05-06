# Cylinder Pointed Bur 12s MCXL nova - geração preliminar

Fonte: /Users/rafaelalmeida/Downloads/Cylinder Pointed Bur 12s MCXL nova chinesa.pptx

## Saídas geradas

- source-slide.png: prévia renderizada do PPTX original.
- cylinder-pointed-bur-12s-mcxl.desenho-fonte-limpo.svg: redesenho 2D limpo no estilo do slide.
- cylinder-pointed-bur-12s-mcxl.desenho-v1.svg: saída do renderer 2D atual do módulo.
- cylinder-pointed-bur-12s-mcxl.a3.svg: folha A3 técnica preliminar.
- cylinder-pointed-bur-12s-mcxl.glb: modelo 3D para visualização.
- cylinder-pointed-bur-12s-mcxl.step: STEP preliminar.
- cylinder-pointed-bur-12s-mcxl.spec.json: especificação estruturada usada para gerar os arquivos.
- viewer-3d.html: visualizador local do GLB.

## Validação

- 2D canExport: true
- A3 canExport: true
- 3D status: ready
- 3D bounding box: {"length":38,"width":6.5,"height":6.5}
- 3D mesh summary: {"segmentMeshCount":13,"boreSectionCount":0,"vertexCount":1066}
- STEP status: ready
- STEP shape summary: {"segmentShapeCount":13,"boreCutCount":0}
- STEP blocking reasons: nenhum

## Pontos para validar com o especialista

1. A leitura das cotas parciais não fecha de forma óbvia com o total de 38,0 mm. Ajustei o trecho do corpo para 10,40 mm para fechar o modelo.
2. Rosca M3,5 x 0,35 foi modelada como zona nominal, sem hélice real.
3. Superfície diamantada D foi modelada apenas por envelopes cilíndricos.
4. Facetado 3x a 120 graus foi modelado como cilindro Ø5,0.
5. Raios R0,3/R0,5 e chanfros 45 graus/0,2x30 graus aparecem como notas, mas não entram no STEP V1.
6. A ponta foi modelada como cone truncado preliminar; confirmar a geometria real.

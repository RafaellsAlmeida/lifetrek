# Pacote de teste Ronaldo - 2026-05-05

Fontes processadas:

- Cylinder Pointed Bur 12s MCXL nova: /Users/rafaelalmeida/Downloads/Cylinder Pointed Bur 12s MCXL nova chinesa.pptx
- Cylinder Pointed Bur 20s MCXL usada: /Users/rafaelalmeida/Downloads/Cylinder Pointed Bur 20s MCXL usada.pptx
- Step Bur 20s MCXL usada: /Users/rafaelalmeida/Downloads/Step Bur 20s MCXL usada.pdf.pptx
- Croqui 116.037: /Users/rafaelalmeida/Downloads/Untitled croquegn.png

Arquivos principais em cada pasta:

- `fonte.png`: render da fonte original.
- `*.desenho-ronaldo.svg/png/pptx`: desenho limpo preliminar no estilo de revisao do Ronaldo.
- `*.desenho-v1.svg`: saida do renderer 2D atual do modulo.
- `*.a3.svg`: folha tecnica A3 preliminar.
- `*.glb`: preview 3D.
- `*.step`: STEP preliminar.
- `*.spec.json`: leitura com ambiguidades/features pendentes.
- `*.render-spec.json`: spec usada para gerar GLB/STEP com simplificacoes.
- `viewer-3d.html`: visualizador local do GLB.

## Resultado por peça

### Cylinder Pointed Bur 12s MCXL nova

- Pasta: `cylinder-pointed-bur-12s-mcxl-nova/`
- 2D exportavel: true
- A3 exportavel: true
- 3D: ready
- STEP: ready (53967 bytes)
- Bounding box: {"length":38,"width":6.5,"height":6.5}
- Features simplificadas: Superficie diamantada D; Facetado 3x a 120 graus; Raios e chanfros finos; Canaletas Ø3,35 2x, 0,50 a 45 graus
- Perguntas para Ronaldo:
  - Confirmar por que a soma das cotas parciais fica 0,40 mm menor que o total 38,0.
  - Confirmar se a ponta final deve terminar em Ø1,20 ou fechar em ponta.
  - Confirmar como representar as duas canaletas verdes no STEP.

### Cylinder Pointed Bur 20s MCXL usada

- Pasta: `cylinder-pointed-bur-20s-mcxl-usada/`
- 2D exportavel: true
- A3 exportavel: true
- 3D: ready
- STEP: ready (66073 bytes)
- Bounding box: {"length":46,"width":6.5,"height":6.5}
- Features simplificadas: Superficie diamantada D; Facetado 3x a 120 graus; Raios e chanfros finos; Furo transversal Ø0,50
- Perguntas para Ronaldo:
  - Confirmar onde entra o residuo de 0,40 mm entre as cotas inferiores e o total 46,00.
  - Confirmar se o furo Ø0,50 e transversal e se deve ser modelado no STEP.
  - Confirmar geometria da ponta 45 graus.

### Step Bur 20s MCXL usada

- Pasta: `step-bur-20s-mcxl-usada/`
- 2D exportavel: true
- A3 exportavel: true
- 3D: ready
- STEP: ready (65987 bytes)
- Bounding box: {"length":46,"width":6.5,"height":6.5}
- Features simplificadas: Superficie diamantada D; Facetado 3x a 120 graus; Raios e chanfros finos; Furo transversal Ø0,50
- Perguntas para Ronaldo:
  - Confirmar onde entra o residuo de 0,40 mm entre as cotas inferiores e o total 46,00.
  - Confirmar se o furo Ø0,50 e transversal e se deve ser modelado no STEP.
  - Confirmar se o ultimo trecho Ø1,0 D tem exatamente 4,00 mm.

### Croqui 116.037

- Pasta: `croqui-116037/`
- 2D exportavel: true
- A3 exportavel: true
- 3D: ready
- STEP: ready (18845 bytes)
- Bounding box: {"length":3.7,"width":1.67,"height":1.67}
- Features simplificadas: Hexagono interno 1,2; Broca Ø1,2 com profundidade indefinida
- Perguntas para Ronaldo:
  - Confirmar se 116.037 e o codigo/desenho da peça.
  - Confirmar profundidade da broca Ø1,2 e do hexagono interno 1,2.
  - Confirmar comprimento da rosca direita: o croqui parece mostrar 1,5/1,8, mas o total 3,7 com 1,7 + 0,51 deixa 1,49.


## Observacao

Os STEP/GLB deste pacote sao preliminares. O objetivo e mostrar o fluxo e coletar feedback tecnico, nao liberar arquivo para fornecedor ou fabricacao.

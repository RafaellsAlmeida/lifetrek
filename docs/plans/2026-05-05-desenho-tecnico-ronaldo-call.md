# Call Ronaldo - Software 3D e Desenho Tecnico

Data: 2026-05-05  
Duração: 38 min  
Gravação: https://fathom.video/share/tkkZsDPBR7AxQGfSb6YQq6o6ujxnkSXm

## Resumo executivo

A call reposicionou o módulo de desenho técnico. O fluxo ideal continua sendo croqui -> extração -> revisão -> 2D -> 3D -> STEP, mas os primeiros testes mostraram que croquis feitos "para uso próprio" não são entrada confiável para automação direta. O padrão operacional mais confiável hoje é o PowerPoint técnico feito pelo Ronaldo, porque nele as linhas, cotas e textos estão mais estruturados e representam o jeito real como ele envia referência para alguém modelar no SolidWorks.

O objetivo final continua sendo gerar um STEP perfeito, pronto para abrir no SolidWorks e eventualmente chegar em máquina. Antes disso, o sistema precisa suportar um ciclo iterativo: Rafael gera saídas a partir dos PPTX/PDF/croquis, Ronaldo revisa tecnicamente e aponta o que está errado, e o sistema incorpora essas regras.

## Processo atual explicado pelo Ronaldo

1. Ronaldo desenha primeiro um croqui à mão.
2. Depois redesenha no PowerPoint.
3. O PowerPoint vira a referência interna para outra pessoa, como Alan, criar o 3D no SolidWorks.
4. Ronaldo não usa SolidWorks no computador dele; ele trabalha principalmente no PowerPoint.
5. Croquis feitos à mão podem estar tortos, com letra ruim e sem intenção de leitura automática. Eles foram feitos para ele mesmo transformar em PowerPoint.
6. O PowerPoint é o padrão mais importante para teste agora.

## Feedback sobre resultados anteriores

### Corpo Nano Transfer

Problemas observados:

- apareceu rosca onde não existe rosca;
- algumas cotas saíram certas;
- uma ou mais cotas saíram erradas;
- algumas features saíram em posição diferente;
- o formato de cotagem não respeita totalmente como Ronaldo espera para leitura técnica;
- houve mistura entre cota linear e cota de diâmetro.

Interpretação:

- o erro de rosca inexistente é crítico;
- o sistema não pode inferir rosca por textura, linha ou padrão visual;
- rosca só deve existir quando houver chamada explícita apontando para aquele trecho;
- valores com `Ø` devem entrar como diâmetro, não como comprimento.

## Padrão de desenho do Ronaldo

Ronaldo confirmou que os arquivos PowerPoint "Cylinder Pointed Bur" e "Step Burr" são exemplos do padrão que ele vai usar.

Características do padrão:

- cotas inferiores representam comprimento/segmentação axial;
- chamadas superiores e setas indicam diâmetros, raios, rosca, ângulo, superfície diamantada e detalhes;
- internamente, ele pode usar setas inclinadas para facilitar a montagem do desenho;
- pela norma formal de desenho, algumas dessas cotas deveriam estar retas e no padrão técnico correto;
- para uso interno e envio ao modelador SolidWorks, o formato PowerPoint dele é aceitável e mais rápido;
- para uma saída técnica mais formal, o sistema deve conseguir reorganizar as cotas.

Regra prática:

- O sistema deve separar "padrão interno Ronaldo" de "desenho técnico formal".
- O PowerPoint dele é entrada de referência e deve ser suportado.
- A saída formal deve corrigir a lógica de cotagem quando necessário.

## Norma e qualidade

Ponto importante: ISO 13485 é norma de sistema de qualidade e controle de processo, não uma norma de cotagem geométrica por si só.

O que isso implica para o sistema:

- manter rastreabilidade de fonte, revisão, aprovação e exportação;
- registrar quem confirmou dimensões e quando;
- bloquear exportação quando houver ambiguidade técnica;
- preservar histórico das correções;
- não inventar medidas ou features;
- separar rascunho, referência interna, desenho técnico revisado e arquivo liberado para fornecedor/SolidWorks.

Normas de desenho/cotagem precisam ser tratadas como outra camada: padrão interno, ISO/ASME quando aplicável, e regras de cotagem acordadas com Ronaldo.

## Novo fluxo de testes

Casos prioritários:

1. Cylinder Pointed Bur em PowerPoint.
2. Step Burr em PowerPoint/PDF.
3. Novos croquis legíveis, com foto inteira e sem corte.

Fluxo de teste:

1. Receber PPTX/PDF/croqui.
2. Extrair estrutura: trechos, comprimentos, diâmetros, roscas, chanfros, raios, detalhes.
3. Gerar desenho 2D no padrão interno.
4. Gerar desenho técnico mais formal quando possível.
5. Gerar 3D/GLB.
6. Gerar STEP.
7. Ronaldo revisa e diz exatamente o que está errado.
8. Ajustar regras e repetir.

## Regras técnicas aprendidas

- Croqui torto e letra ruim prejudicam fortemente a extração.
- Foto de croqui precisa mostrar a folha inteira, sem cortar textos laterais.
- O sistema precisa aceitar upload de PowerPoint como fonte de desenho 2D.
- O sistema precisa aceitar upload de PDF como fonte 2D.
- O sistema deve preservar a origem: croqui manual, PPTX, PDF, fixture ou ajuste manual.
- O sistema deve ter uma forma de gerar/exportar PPTX.
- Para o padrão Ronaldo, linha inferior deve ser a principal fonte de comprimentos axiais.
- Chamadas com `Ø` devem virar diâmetros.
- A seta de diâmetro deve apontar para o trecho correto.
- Diâmetro não deve virar comprimento linear.
- Rosca só deve ser criada quando houver indicação explícita.
- Superfície diamantada, facetado, chato e outras features especiais devem ser preservados como nota ou feature não suportada se o STEP V1 não conseguir modelar.
- Quando as cotas parciais não fecharem com a cota total, o sistema deve bloquear ou pedir revisão, não ajustar silenciosamente.

## Mudanças necessárias no produto

### Status implementado nesta rodada

- Registro operacional da call criado neste documento.
- Modelo de visão da edge function elevado para `openai/gpt-5.4`, com override por `ENGINEERING_DRAWING_VISION_MODEL`.
- Prompt de extração atualizado com as regras de Ronaldo: linha inferior como comprimento axial, `Ø` como diâmetro, rosca somente com chamada explícita, preservação de notas especiais e bloqueio por ambiguidade.
- Upload da fonte técnica agora aceita imagem, PDF, PPT e PPTX.
- PDF/PPT/PPTX entram como fonte 2D de referência com sessão manual até existir parser estrutural.
- Storage bucket `engineering-drawings` atualizado por migration para aceitar PDF/PPT/PPTX.
- Exportação PPTX adicionada para o desenho 2D e para o desenho A3.
- Lote Ronaldo 05/05 publicado dentro de `/admin/desenho-tecnico`, separado em tres peças: Cylinder 12s, Cylinder 20s e Step Bur 20s.
- O app agora mostra fonte, desenho limpo, A3, download PPTX, download STEP e preview 3D GLB por peça.
- JSONs/specs ficam como artefato interno de desenvolvimento, nao como material para Ronaldo revisar.
- Preview 3D antigo agora usa GLB salvo quando a sessao tiver um artefato `threeDAsset`, em vez de depender apenas do spec axisimetrico revisado.

### Estado atual dos resultados do lote Ronaldo 05/05

| Peça | Entrada | Saidas visiveis no app | Status |
| --- | --- | --- | --- |
| Cylinder Pointed Bur 12s MCXL nova chinesa | PPTX | fonte, desenho limpo, A3, PPTX, GLB, STEP | pronto para revisao tecnica, nao liberado para fornecedor |
| Cylinder Pointed Bur 20s MCXL usada | PPTX | fonte, desenho limpo, A3, PPTX, GLB, STEP | pronto para revisao tecnica, nao liberado para fornecedor |
| Step Bur 20s MCXL usada | PDF/PPTX convertido | fonte, desenho limpo, A3, PPTX, GLB, STEP | pronto para revisao tecnica, nao liberado para fornecedor |

Limites conhecidos desta rodada:

- GLB resolve a dor de visualizacao no app; Ronaldo nao precisa abrir STEP para revisar a forma inicial.
- STEP existe, mas ainda e preliminar e precisa ser validado no SolidWorks/fornecedor antes de virar saida final.
- Diamantado, facetado, canaletas, furo transversal e acabamento de superficie ainda podem estar simplificados no 3D.
- O parser estrutural de PPTX/PDF ainda nao le shapes, setas e textos de forma deterministica; esta rodada usa reconstrucao orientada pelos exemplos.

### P0 - Entrada e extração

- Aceitar imagem, PDF, PPT e PPTX no upload da fonte técnica.
- Não tentar tratar PPTX/PDF como simples imagem.
- Criar parser específico de PPTX para ler:
  - textos;
  - linhas;
  - setas;
  - posições relativas;
  - agrupamentos;
  - cotas inferiores;
  - chamadas superiores.
- Criar parser de PDF quando o PowerPoint vier exportado.
- Melhorar modelo de visão para croquis legíveis, usando modelo mais forte mesmo que seja mais caro.
- Registrar ambiguidades em vez de inventar.

### P0 - Regras de interpretação

- Implementar regra: `Ø` sempre cria diâmetro.
- Implementar regra: `Rosca`, `M3,5X0,35`, etc. cria rosca apenas se a seta/chamada apontar para o trecho.
- Implementar regra: linha inferior segmenta comprimentos axiais.
- Implementar regra: notas especiais como `D = superfície diamantada`, `facetado 3x 120°`, `chato largura` não podem sumir.
- Criar validação para divergência entre soma de trechos e comprimento total.

### P1 - Desenho 2D

- Criar modo de desenho "padrão Ronaldo" para revisão interna.
- Criar modo de desenho "técnico formal" com cotagem mais correta.
- Corrigir sobreposição de textos no A3.
- Fazer diâmetros aparecerem como chamadas de diâmetro, não como cotas lineares.
- Permitir saída exportável em PPTX.

### P1 - 3D e STEP

- Gerar GLB/STEP a partir da spec revisada.
- Marcar claramente aproximações: rosca nominal, diamantado como envelope, facetado simplificado.
- Caminho final deve ser STEP abrível no SolidWorks.
- Validar STEP com Ronaldo/Alan quando possível.

### P2 - Aprendizado com feedback

- Salvar correções do Ronaldo por campo.
- Transformar correções recorrentes em regras.
- Criar corpus de teste com Cylinder, Step Burr, Nano Transfer e croquis bons/ruins.
- Comparar saída nova contra saída esperada a cada mudança.

## Ações combinadas

### Rafael/Codex

- Processar os PPTX/PDFs recebidos: Cylinder, Pointed Bur e Step Burr.
- Enviar resultados para Ronaldo revisar.
- Adaptar o sistema para aceitar PPTX/PDF como entrada 2D.
- Melhorar modelo de visão.
- Ajustar geração 2D para o padrão de cotas esperado.
- Preparar exportação PPTX.

### Ronaldo

- Enviar arquivos PowerPoint/PDF dos desenhos padrão.
- Enviar croqui legível com foto completa, sem corte.
- Revisar as saídas e apontar erros objetivos.
- Dizer quando a cota deve ser diâmetro, comprimento, raio, rosca, chanfro ou nota.

## Observação sobre croqui anexado após a call

O croqui anexado tem informações úteis, mas ainda exige revisão humana:

- existem várias cotas axiais na linha inferior;
- há chamadas de diâmetro na parte superior;
- há indicação de 3 canais a 60 graus;
- há indicação de chato com largura 3,00;
- há região de esfera/ponta à direita;
- a foto está legível o suficiente para teste, mas a extração automática deve registrar ambiguidades porque algumas cotas e anotações podem ser interpretadas de mais de uma forma.

Este croqui é bom para testar o limite da visão, não para validar exportação sem revisão.

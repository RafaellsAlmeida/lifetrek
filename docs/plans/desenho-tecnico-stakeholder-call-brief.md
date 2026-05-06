# Roteiro da Reunião com Especialista - Desenho Técnico

Objetivo: usar a reunião para transformar a primeira versão atual da automação de desenho técnico em um roteiro de evolução baseado em revisão técnica real, envio para fornecedores e risco de fabricação.

## 1. Abertura da Reunião

Use este enquadramento no começo:

> Já temos uma primeira versão funcional de um fluxo interno de desenho técnico. Ele consegue receber um croqui ou referência, estruturar dimensões, rodar validações, gerar desenho 2D/A3, mostrar pré-visualização 3D e exportar STEP para peças axisimétricas suportadas. A reunião não é para pedir que você desenhe o software do zero. O objetivo é entender como o fluxo técnico realmente funciona, onde a saída automática ainda é arriscada ou incompleta, e quais regras precisamos documentar antes de transformar isso em uma ferramenta útil para revisão interna e pacote de instruções ao fornecedor.

Resultado esperado da reunião:

- definir o que a ferramenta pode automatizar com segurança agora;
- definir o que precisa continuar com revisão humana;
- identificar os maiores erros técnicos do resultado atual;
- entender o pacote mínimo necessário para enviar a fornecedores;
- criar um roteiro de evolução guiado por risco real de processo, não por ideias soltas de interface.

## Versão Enxuta para Usar na Conversa

Se a reunião for mais espontânea, use esta sequência curta. A ideia é deixar ele falar bastante e só puxar os tópicos quando a conversa abrir espaço.

### 1. Processo atual

1. Você pode me explicar, do começo ao fim, como é o processo hoje quando chega um desenho, croqui ou necessidade de uma peça?
2. Em que momento você entra no processo e o que exatamente você revisa?
3. Quais são os pontos em que normalmente o trabalho volta para correção?
4. O que hoje está mais na sua cabeça, por experiência, e não está escrito em checklist nenhum?

### 2. Qualidade, ISO 13485 e critérios técnicos

1. Para esse tipo de peça, o que faz um desenho estar tecnicamente bom o suficiente para seguir?
2. Quais informações são obrigatórias antes de envolver fornecedor: material, tolerância, acabamento, rugosidade, rosca, revisão, inspeção?
3. Pensando em ISO 13485 e controle de qualidade, que evidências precisam ficar registradas no processo?
4. Quais erros em desenho ou revisão poderiam virar problema de qualidade, retrabalho ou risco regulatório?

### 3. Escopo 3D e STEP

1. Para vocês, o 3D serve para quê: visualizar, cotar, fabricar, validar montagem, planejar usinagem ou controlar inspeção?
2. Quando um STEP simplificado é aceitável e quando ele passa a ser perigoso?
3. Quais detalhes precisam ser geometria real e quais podem ficar como nota no desenho, por exemplo rosca, recartilha ou luer-lock?
4. Quem deveria validar o STEP antes de ele ser enviado para fora?

### 4. Fornecedores

1. O que um fornecedor precisa receber para cotar ou executar sem ficar voltando com dúvida?
2. Quais dúvidas os fornecedores sempre fazem?
3. O que mais causa cotação errada, desenho 3D errado ou retrabalho?
4. Existem fornecedores diferentes para tipos diferentes de peça ou complexidade?

### 5. Revisão e aprovação

1. Quem pode aprovar um desenho ou modelo para envio ao fornecedor?
2. O que deveria bloquear automaticamente uma exportação ou envio?
3. Como as revisões são controladas hoje?
4. O que precisa ficar registrado para sabermos depois quem aprovou, o que mudou e por quê?

### 6. Priorização

1. Se a ferramenta só melhorasse uma coisa primeiro, o que reduziria mais risco ou tempo perdido?
2. Qual erro faria você perder confiança imediatamente na ferramenta?
3. O que seria útil mesmo que ainda fosse marcado como rascunho?
4. Na sua opinião, a prioridade deveria ser melhorar o 2D/A3, o STEP, a extração do croqui, o pacote para fornecedor ou o histórico de revisão?

### 7. Materiais para pedir

Peça no final:

- um desenho aprovado considerado bom;
- um desenho que causou retrabalho ou dúvida;
- um exemplo de pacote enviado a fornecedor;
- um exemplo de comentário de revisão;
- qualquer checklist, padrão, estrutura de pasta ou critério usado para aprovar fornecedor/desenho.

## 2. Onde Estamos Hoje

Módulo atual:

- Rota principal: `/admin/desenho-tecnico`
- Tabela principal: `engineering_drawing_sessions`
- Fluxo principal:
  1. upload ou seleção de croqui/referência;
  2. estruturação do documento técnico;
  3. revisão humana de dimensões e ambiguidades;
  4. validação dimensional e semântica/GD&T;
  5. geração de desenho 2D e folha A3;
  6. geração de pré-visualização 3D;
  7. exportação STEP quando aplicável.

O que já funciona:

- Persistência de sessões.
- Travas de revisão humana.
- Ambiguidades podem bloquear exportação.
- Revisão de GD&T pode bloquear exportação quando a norma do desenho é desconhecida.
- 2D SVG, A3 SVG/PNG, pré-visualização 3D e exportação STEP existem para a geometria atualmente suportada.
- Testes validaram fluxos axisimétricos suportados e fluxos bloqueados por revisão de GD&T.
- Geometria fora do escopo é preservada e sinalizada, em vez de ser convertida silenciosamente em um modelo enganoso.

Limitação importante:

Isto ainda não é um substituto de CAD pronto para fabricação. A versão atual é mais forte como sistema de estruturação, revisão e geração de rascunho técnico para geometrias axisimétricas suportadas.

## 3. Erros e Lacunas Já Observados

Use estes pontos como exemplos concretos durante a conversa.

### A. Risco de extração e interpretação

- A primeira extração ainda depende bastante de heurísticas, exemplos fixos de teste e correção manual.
- As correções do revisor são aplicadas na sessão, mas ainda não são reutilizadas para melhorar sugestões futuras.
- O sistema precisa de um ciclo de aprendizado com exemplos revisados antes de ficar progressivamente mais inteligente.

Perguntas que isso cria:

- Quais campos costumam ser mais mal interpretados em croquis ou desenhos antigos?
- Quais erros são incômodos, mas seguros, e quais são perigosos?
- O que sempre deve exigir confirmação humana explícita?

### B. Risco de escopo geométrico

- O suporte atual de 3D/STEP é propositalmente limitado a peças axisimétricas, cones, zonas prismáticas retas e cortes de furos axiais.
- Textura exata de recartilha ainda não é modelada.
- Geometria helicoidal real de rosca ainda não é modelada.
- Geometria luer-lock de duas entradas ainda não é modelada.
- Tela, malha ou perfurações detalhadas ainda não são modeladas.
- Alguns recursos geométricos são representados como envelopes nominais ou zonas simplificadas.

Exemplo do Nano Transfer:

- O STEP do corpo resolveu uma discrepância da fonte modelando o lábio final como 1,40 mm para a soma dos trechos fechar no comprimento total de 39,50 mm, embora uma chamada pareça indicar 1,00 mm.
- Recartilha e roscas foram representadas como geometrias simplificadas, com notas explicando a aproximação.

Perguntas que isso cria:

- Quando um STEP simplificado é útil o suficiente para cotação ou discussão com fornecedor?
- Quando a simplificação deixa de ser aceitável?
- Quais detalhes geométricos precisam estar exatos antes de um fornecedor cotar ou fabricar?

### C. Risco de apresentação do desenho

- Já foi observada sobreposição de anotações no 2D/A3: textos de dimensão podem colidir ou ficar empilhados.
- O algoritmo atual de posicionamento SVG ainda não evita completamente colisões entre textos, cotas e geometria do desenho.
- A interface também precisa deixar mais claro o fluxo por etapas e o status de exportação.

Perguntas que isso cria:

- O que torna um desenho legível o suficiente para revisão técnica?
- Quais rótulos, vistas e detalhes são obrigatórios para os tipos de peça da Lifetrek?
- O que a folha A3 sempre precisa conter antes de ser considerada revisável?

### D. Risco na experiência das travas de revisão

- Ambiguidade bloqueia exportação por desenho de segurança, mas o motivo pode não ficar claro para um operador não especialista.
- O usuário pode não entender por que precisa clicar em "Marcar como resolvida" antes de exportar.
- Feedback de erro em exportação e persistência ainda precisa melhorar.

Perguntas que isso cria:

- Quais status deveriam existir no processo?
- Como o sistema deve explicar uma exportação bloqueada?
- Que evidência deve ser salva quando um revisor limpa uma ambiguidade?

### E. Risco no envio para fornecedores

- O sistema já gera artefatos técnicos, mas ainda não documentamos completamente o que o fornecedor precisa receber.
- Precisamos entender se o fornecedor precisa de PDF, STEP, CAD fonte, imagens anotadas, histórico de revisão, notas de material, requisitos de inspeção ou tudo isso junto.

Perguntas que isso cria:

- Qual é o pacote mínimo de instruções para fornecedor?
- Quais erros fazem o fornecedor cotar errado ou produzir algo errado?
- Como as revisões do fornecedor deveriam ser rastreadas?

## 4. Perguntas Principais da Reunião

### Processo atual

1. Você pode explicar o processo atual desde o croqui/desenho inicial até o pacote pronto para fornecedor?
2. O que normalmente inicia o processo: desenho do cliente, croqui manual, foto, PDF antigo, peça física, requisito verbal ou arquivo do fornecedor?
3. Quem revisa o desenho antes de ele ir para fornecedor?
4. Quais são os pontos de decisão em que o trabalho pode ser aprovado, bloqueado ou devolvido?
5. Quais arquivos são considerados fonte da verdade hoje?
6. Como as revisões são nomeadas, armazenadas e comunicadas?
7. Como alguém sabe qual desenho/modelo é a versão final aprovada?

### Qualidade do desenho técnico

1. O que torna um desenho 2D tecnicamente aceitável para revisão?
2. O que torna um desenho aceitável para cotação com fornecedor?
3. O que torna um desenho aceitável para fabricação?
4. Quais vistas normalmente são obrigatórias: frontal, corte, superior, detalhes, roscas, notas ampliadas?
5. Quais campos do carimbo/título são obrigatórios?
6. Quais notas são obrigatórias: material, acabamento, tratamento térmico, rugosidade, norma de rosca, tolerância geral, revisão, inspeção?
7. Quais tolerâncias o sistema nunca deve inventar?
8. Quais dimensões são mais perigosas de interpretar errado?
9. Quais erros de formatação fazem você desconfiar de um desenho?

### Escopo de 3D e STEP

1. No seu fluxo, para que o arquivo 3D é usado: visualização, cotação, usinagem, planejamento de dispositivo, inspeção ou entrega final de CAD?
2. Um STEP simplificado é útil se rosca, recartilha ou luer-lock forem representados por envelope nominal?
3. Quais recursos geométricos precisam ser modelados exatamente para o STEP ser útil?
4. Quais recursos geométricos podem ficar como chamadas/notas em vez de geometria real?
5. Como o sistema deve rotular aproximações para o fornecedor não confundir com geometria final?
6. Qual formato CAD os fornecedores preferem: STEP, SolidWorks nativo, PDF, DXF, DWG ou outro?
7. Quem deve validar a integridade do STEP antes de envio externo?

### GD&T e normas

1. Quais normas aparecem normalmente nos desenhos revisados: ISO, ASME, convenções internas ou convenções do fornecedor?
2. Com que frequência desenhos chegam sem norma clara?
3. Quais chamadas de GD&T são comuns nesse tipo de trabalho?
4. Quais casos de GD&T são arriscados demais para interpretação automática?
5. O que deve acontecer quando o sistema encontra uma chamada, mas não consegue identificar a norma?
6. As referências de datum costumam ser explícitas e confiáveis?
7. Você pode mostrar exemplos em que GD&T foi mal interpretado ou causou retrabalho com fornecedor?

### Envio para fornecedor

1. O que um bom pacote para fornecedor contém?
2. O que um pacote ruim geralmente deixa faltando?
3. Quais detalhes os fornecedores perguntam repetidamente?
4. O que causa cotação errada?
5. O que causa desenho/modelo 3D errado?
6. O que causa revisão tardia?
7. Como você avalia hoje se o fornecedor entendeu a solicitação?
8. Fornecedores precisam cumprir algum checklist antes de aceitar o trabalho?
9. O que o sistema deveria gerar automaticamente para o pacote de instruções ao fornecedor?
10. O que sempre precisa ser escrito ou aprovado manualmente?

### Revisão e aprovação

1. Quais são os motivos mais comuns de revisão?
2. Como os comentários de revisão são escritos hoje?
3. Os comentários ficam em PDF, e-mail, WhatsApp, CAD, planilha ou reunião?
4. Que informação costuma se perder entre ciclos de revisão?
5. O que um histórico de revisão precisa registrar?
6. O que deveria ser impossível exportar sem revisão?
7. Quem pode aprovar um desenho para uso com fornecedor?
8. Que evidência deve ser salva depois da aprovação?

### Priorização do roteiro de evolução

1. Se melhorarmos apenas uma coisa primeiro, o que reduz mais risco?
2. Qual erro atual faria você desconfiar imediatamente da ferramenta?
3. Qual erro é aceitável se estiver claramente marcado como rascunho?
4. Qual parte do fluxo mais desperdiça tempo hoje?
5. Qual parte gera mais retrabalho com fornecedor?
6. Qual parte cria maior risco de qualidade ou regulatório?
7. Qual saída seria mais valiosa primeiro: 2D melhor, A3 melhor, STEP melhor, pacote de fornecedor melhor, rastreio de revisão melhor ou extração melhor?

## 5. Materiais para Pedir a Ele

Peça exemplos concretos:

- 2 ou 3 desenhos aprovados que representem um bom padrão.
- 2 ou 3 desenhos que causaram confusão ou retrabalho com fornecedor.
- Exemplo de pacote de instruções ao fornecedor.
- Exemplo de pedido de cotação para fornecedor.
- Exemplo de comentários de revisão.
- Exemplo de pacote final aprovado.
- Exemplo de desenho em que tolerância ou GD&T foi importante.
- Exemplo de peça em que 3D simplificado seria aceitável.
- Exemplo de peça em que 3D simplificado seria inaceitável.
- Qualquer checklist, SOP, estrutura de pastas, convenção de nomes ou critério de avaliação de fornecedor.

## 6. Decisões de Roteiro de Evolução que Precisamos Tirar da Reunião

A reunião deve ajudar a classificar o trabalho nestes blocos.

### P0 - Confiança e travas de segurança

- Definir o que bloqueia exportação.
- Definir aprovações humanas obrigatórias.
- Definir evidência mínima de revisão.
- Definir qual geometria está dentro ou fora do escopo automático.
- Validar se o STEP atual é útil e sob qual rótulo.

### P1 - Legibilidade e utilidade para fornecedor

- Corrigir sobreposição de anotações no 2D/A3.
- Melhorar carimbo, título e notas obrigatórias.
- Adicionar regras de vistas e detalhes obrigatórios.
- Tornar estados de ambiguidade e exportação bloqueada mais claros.
- Melhorar geração do pacote de fornecedor.

### P2 - Aprender com exemplos revisados

- Salvar correções do revisor como deltas por campo.
- Reutilizar decisões aceitas em desenhos futuros parecidos.
- Medir taxa de aceitação por heurística/padrão.
- Criar um corpus ouro com desenhos aprovados.

### P3 - Expansão geométrica

Decidir quais recursos geométricos avançados importam primeiro:

- roscas reais;
- recartilha;
- geometria luer-lock;
- flats/rasgos não axisimétricos;
- perfurações/telas;
- semântica avançada de GD&T.

## 7. Melhor Pergunta de Encerramento

Finalize com:

> Se este sistema gerasse um desenho ou STEP que parece convincente, mas está tecnicamente errado, onde esse erro provavelmente aconteceria?

Depois pergunte:

> O que o sistema deve obrigar um humano a revisar antes desse erro chegar a um fornecedor?

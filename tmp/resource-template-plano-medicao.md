# Template de Plano de Medição para Peças CNC Swiss Críticas

> Recurso técnico orientado a Engenharia de Manufatura, Qualidade e Metrologia.  
> Uso educacional. Não substitui desenho aprovado, avaliação de risco, MSA formal, liberação da Qualidade ou instruções internas validadas.

## Quando usar este template

Use este modelo quando uma peça usinada em processo Swiss tiver features críticas cujo risco de variação não pode ser deixado apenas para a inspeção final.

Ele é especialmente útil em situações como:

- features com impacto funcional direto no acoplamento, fixação, alinhamento ou montagem;
- peças com tolerâncias apertadas e sensibilidade a desgaste de ferramenta, fixação ou temperatura;
- lotes piloto, FAI, transferência para produção ou mudanças de processo;
- componentes em que rastreabilidade por lote e reação rápida a desvio são mandatórias.

## Princípio central

A peça não deve ser aprovada apenas porque foi medida no fim.  
Ela deve ser aprovada porque foi medida contra um plano.

Na prática, isso significa definir antes da produção:

- o que é crítico medir;
- como medir;
- com que frequência medir;
- qual evidência registrar;
- o que fazer quando o dado sair da condição esperada.

## Estrutura mínima do plano de medição

Todo plano de medição precisa responder estas perguntas:

1. Qual feature ou CTQ precisa ser controlada?
2. Qual método de medição é tecnicamente adequado para essa feature?
3. Qual equipamento será usado?
4. Em que etapa do processo a medição acontece?
5. Qual frequência e amostragem serão aplicadas?
6. Qual critério de aceite será usado?
7. O que fazer em caso de desvio?
8. Como garantir rastreabilidade do registro?

## Template preenchível

Copie o bloco abaixo e adapte para cada peça, família ou operação crítica.

### 1. Identificação

- Projeto / peça:
- Código interno:
- Revisão do desenho:
- Família de processo:
- Material:
- Operação avaliada:
- Responsável pelo plano:
- Data de emissão:

### 2. Contexto do controle

- Objetivo do controle:
- Risco principal associado à variação:
- Momento de aplicação:
  - FAI
  - Setup inicial
  - Inspeção em processo
  - Liberação final
  - Revalidação após mudança

### 3. Matriz de CTQs

Para cada feature crítica, preencher:

- CTQ / feature:
- Função da feature:
- Referência no desenho:
- Método de medição:
- Equipamento:
- Fixture / apalpador / acessório:
- Frequência:
- Plano de amostragem:
- Critério de aceite:
- Registro exigido:
- Responsável:
- Reação em caso de desvio:

## Campos recomendados por feature

### CTQ / feature

Descrever a característica de forma objetiva:

- diâmetro funcional;
- rosca;
- coaxialidade entre features;
- posição relativa;
- comprimento crítico;
- rugosidade em área funcional;
- geometria de transição ou raio crítico.

Evite descrever somente a dimensão. O ideal é vincular a feature ao risco funcional.

### Método de medição

Selecionar o método mais compatível com a necessidade da feature:

- CMM para geometrias complexas, posição, coaxialidade e inspeção tridimensional;
- medição óptica quando o acesso físico for crítico ou quando a feature pedir captura sem contato;
- comparador, relógio ou dispositivo dedicado para verificações rápidas de setup e processo;
- instrumentos universais apenas quando a capacidade metrológica for compatível com o risco.

O método escolhido deve refletir a necessidade real da feature, não apenas a disponibilidade do instrumento.

### Equipamento

Registrar o equipamento e a condição mínima de uso:

- identificação do equipamento;
- status de calibração;
- programa ou rotina de medição aplicável;
- acessório específico necessário;
- condição ambiental relevante, quando aplicável.

### Frequência

Definir a frequência a partir do risco de deriva do processo:

- 100% para etapas críticas ou lotes pequenos com alto impacto funcional;
- primeira peça, última peça e amostras intermediárias para operações com tendência conhecida;
- inspeção por setup e por troca de ferramenta quando desgaste for variável dominante;
- reforço de frequência após ajuste, manutenção, troca de matéria-prima ou desvio anterior.

### Plano de amostragem

Especificar de forma operacional:

- quantidade de peças por lote;
- momento de coleta;
- gatilho para aumento de frequência;
- regra de bloqueio em caso de tendência.

### Critério de aceite

Nunca usar texto ambíguo.

Preferir descrições como:

- conforme desenho aprovado e revisão vigente;
- conforme limite funcional definido em instrução validada;
- sem liberação quando houver dúvida sobre capacidade do método;
- peça, lote ou setup bloqueado até avaliação da Qualidade quando ocorrer desvio.

### Reação em caso de desvio

Definir o comportamento esperado antes de o problema acontecer:

- segregar peça e lote associado;
- interromper produção quando o desvio indicar risco sistêmico;
- verificar última condição conhecida conforme;
- reavaliar ferramenta, setup, fixação, programa e medição;
- registrar contenção e disposição;
- acionar Qualidade e Engenharia conforme criticidade.

## Sequência prática de implementação

### Etapa 1 — Ler o desenho com foco em risco

Antes de escrever o plano, identificar:

- quais features têm impacto funcional;
- quais features concentram risco de processo;
- quais features exigem método mais robusto que inspeção visual ou instrumento universal.

### Etapa 2 — Separar setup, processo e liberação final

O plano não deve ser um único bloco genérico.

Separar pelo menos:

- verificação de setup inicial;
- verificação em processo;
- liberação final;
- gatilhos de revalidação.

### Etapa 3 — Associar método ao CTQ

Cada CTQ deve ter método e equipamento coerentes com o risco.

Se a escolha do método for fraca, o plano parece completo, mas o controle continua frágil.

### Etapa 4 — Definir reação

Muitos planos falham porque descrevem medição, mas não descrevem reação.

Sem reação definida, o dado existe, mas o processo continua vulnerável.

### Etapa 5 — Garantir rastreabilidade

O plano deve dizer claramente:

- onde o dado é registrado;
- como o lote é identificado;
- quem aprova ou bloqueia;
- como recuperar histórico quando houver investigação.

## Exemplo de preenchimento sem expor dados sensíveis

### Feature exemplo

- CTQ / feature: furo funcional de acoplamento
- Função: garantir montagem e posicionamento corretos
- Método: CMM com rotina validada
- Equipamento: CMM ZEISS / programa da peça vigente
- Frequência: primeira peça, após ajuste e amostragem por lote
- Critério de aceite: conforme desenho aprovado
- Registro: relatório vinculado ao lote
- Reação: bloquear lote, revisar setup e confirmar última condição conforme

Esse nível de definição já cria disciplina operacional sem expor tolerâncias públicas ou dados proprietários.

## Checklist final de revisão

Antes de liberar o plano, confirme:

- todos os CTQs críticos foram identificados;
- cada CTQ tem método, equipamento e frequência definidos;
- o critério de aceite não depende de interpretação subjetiva;
- a reação ao desvio está documentada;
- a rastreabilidade por lote está clara;
- existe coerência entre risco da feature e robustez do método;
- o plano cobre setup, processo e liberação;
- o documento referencia revisão vigente de desenho e instruções aplicáveis.

## Erros comuns

- medir só no fim e chamar isso de controle;
- usar o mesmo método para features com riscos diferentes;
- definir frequência sem considerar desgaste, setup e mudança de condição;
- registrar dado sem regra de reação;
- deixar o critério de aceite implícito;
- tratar o plano como documento de auditoria, e não como ferramenta de processo.

## Perguntas frequentes

### Este template substitui um plano interno aprovado?

Não. Ele organiza a lógica mínima do controle, mas precisa ser adaptado ao desenho, processo, método e governança da empresa.

### Posso publicar tolerâncias no material?

Só se elas forem liberadas formalmente para uso externo. Na dúvida, manter a linguagem em nível de CTQ, método e critério conforme desenho aprovado.

### O template serve apenas para CMM?

Não. O ponto central é casar feature crítica com método adequado. CMM é uma das possibilidades, não a única.

### O template serve para FAI e rotina?

Sim. O valor está justamente em separar o que é verificação de setup, o que é controle em processo e o que é liberação final.

## Próximo passo

Se o objetivo for transformar este modelo em um recurso comercial, a recomendação é apresentar o material como:

- Template de Plano de Medição; ou
- Checklist de Controle Dimensional para Peças Swiss Críticas.

Esses nomes comunicam utilidade sem sugerir que o documento substitui validação interna, desenho aprovado ou instrução formal de produção.

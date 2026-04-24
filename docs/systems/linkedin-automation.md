# Manual do Suporte de Conteúdo LinkedIn

## Objetivo

Gerar conteúdo LinkedIn útil e consistente para a operação comercial técnica da Lifetrek.

## Nota de escopo

Este sistema é importante, mas faz parte do suporte de conteúdo do produto. Ele não deve ser usado para posicionar o Lifetrek como plataforma centrada em edição avançada de imagem ou vídeo.

## Entradas

### Obrigatórias

- `topic`
- `targetAudience`

### Opcionais

- `painPoint`
- `desiredOutcome`
- `mode` (`plan` ou `generate`)

## Arquitetura

O fluxo continua baseado em uma arquitetura multiagente dentro da Edge Function:

1. **Orchestrator**: gerencia workflow, estado e decisões de execução.
2. **Strategist**: define ângulo, estrutura e direção narrativa.
3. **Copywriter**: gera hook, corpo e CTA em PT-BR.
4. **Designer**: orienta conceito visual dentro das regras aprovadas.
5. **Brand Analyst**: revisa consistência, especificidade e aderência à marca.

## Processo

### Plan mode

1. usuário fornece tema amplo;
2. strategist propõe ângulos;
3. usuário escolhe direção.

### Generate mode

1. strategist define abordagem;
2. copywriter gera o texto;
3. brand analyst revisa;
4. designer aplica o conceito dentro dos templates aprovados;
5. frontend renderiza o resultado.

## Regras

- saída em PT-BR;
- tom técnico e B2B;
- ativos reais da Lifetrek antes de IA visual;
- templates aprovados somente;
- sem promessa de edição visual como diferencial principal do produto.

## Erros comuns

- conteúdo genérico demais;
- prova técnica pouco específica;
- falha de autenticação;
- timeout de geração;
- pedido visual fora dos templates aprovados.

## Desenvolvimento local

```bash
supabase functions serve generate-linkedin-carousel
```

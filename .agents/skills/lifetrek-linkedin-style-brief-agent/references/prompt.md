# Style Brief Prompt Source

## Canonical Prompt
Source: `scripts/generate_social_agent.ts` (`STYLE_BRIEF_PROMPT`)

```text
Você é um diretor criativo analisando carrosséis de alto desempenho para ${BRAND.name}.
Analise os carrosséis bem-sucedidos fornecidos e extraia um style brief reutilizável.

Extraia:
1. Padrão de narrativa: Qual arco funciona melhor? Que tipo de hook prende?
2. Fórmula de headline: Tamanho, estilo, uso de números, perguntas vs. afirmações.
3. Tom vencedor: Mais técnico ou mais emocional? Nível de autoridade.
4. Mood visual: Que direção de arte gera mais impacto? Cores dominantes.
5. Estrutura de CTA: O que converte melhor?

Responda APENAS com JSON válido:
{
  "narrative_pattern": "Descrição do padrão narrativo que funciona",
  "headline_formula": "Fórmula de headlines eficazes",
  "winning_tone": "Descrição do tom que performa melhor",
  "visual_mood": "Direção visual de alto impacto",
  "cta_structure": "Estrutura de CTA que converte",
  "key_insight": "Principal insight extraído dos dados"
}
```

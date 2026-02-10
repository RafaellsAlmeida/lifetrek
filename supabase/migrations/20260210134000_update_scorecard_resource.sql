-- Refine scorecard resource content with clearer risk definitions and executive guidance
UPDATE public.resources
SET
  title = 'Scorecard de Risco de Supply Chain 2026',
  description = 'Scorecard executivo para mapear risco da cadeia e orientar ação prática.',
  content = $$## Como usar o Scorecard
Para cada risco, atribua uma nota de 1 a 5:
1 = impacto muito baixo
5 = impacto muito alto
Some as notas para obter o score total (5 a 25).
Use a tabela de interpretação para definir o nível de risco e a ação recomendada.

## Riscos a Avaliar (1–5)
1. Dependência geográfica (1–5): ______
Quão concentrados estão seus fornecedores de componentes críticos em uma única região ou país?

2. Volatilidade cambial / matéria-prima (1–5): ______
Quanto a variação de câmbio e preço de insumos (titânio, PEEK, aços especiais) impacta suas margens?

3. Lead time e logística (1–5): ______
Seus prazos de entrega (import ou nacional) são previsíveis ou frequentemente estouram e geram ruptura?

4. Qualidade / compliance do fornecedor (1–5): ______
Seu histórico com NCs, auditorias, laudos incompletos e alinhamento com ISO 13485 / ANVISA é estável ou problemático?

5. Capital preso em estoque (1–5): ______
Você precisa manter grandes estoques “por segurança” (6–12 meses), imobilizando capital de giro?

## Interpretação do Score
Some as notas:
Score Total: ______ (mín. 5, máx. 25)

Faixas sugeridas:

5–10 pontos – Baixo risco (Verde)
Sua cadeia de suprimentos está relativamente estável.
→ Mantenha o monitoramento e revisões periódicas (pelo menos 1x/ano).

11–18 pontos – Risco moderado (Amarelo)
Há pontos sensíveis que podem gerar problemas em choques futuros.
→ Construir plano de contingência: diversificar fontes, revisar contratos, ajustar níveis de estoque.

19–25 pontos – Alto risco (Vermelho)
Alta exposição a interrupções, variação de custos e falhas de fornecimento.
→ Priorizar ações estruturais: avaliar nearshoring, fornecedores locais críticos e revisão da estratégia de importação.

## Exemplo de Scorecard Preenchido
Dependência geográfica: 2
Volatilidade cambial / matéria-prima: 1
Lead time e logística: 1
Qualidade / compliance fornecedor: 1
Capital preso em estoque: 1

Total: 6
Faixa: Baixo risco (Verde) – Manter monitoramento.

## Próximo passo sugerido
Se o score ficou em 19+, faz sentido rodar o nosso “Roadmap de 90 Dias” para migrar ao menos 1–3 SKUs críticos para produção local ISO 13485 e reduzir exposição.
$$,
  updated_at = timezone('utc'::text, now())
WHERE slug = 'scorecard-risco-supply-chain-2026';

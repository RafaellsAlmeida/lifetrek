-- Enrich DFM checklist resource with higher-value, actionable content
UPDATE public.resources
SET
  title = 'Checklist DFM para Implantes e Instrumentais',
  description = 'Checklist completo para revisar desenho, reduzir retrabalho e acelerar a cotacao antes de enviar para usinagem.',
  content = $$## Como usar este checklist (5 minutos)
Use antes de enviar o desenho para cotacao. Marque **SIM/NAO** e preencha observacoes. Se houver **2+ NAO** em blocos criticos, pare e ajuste o desenho.

## Dados de entrada (sem isso, o fornecedor chuta)
- SIM / NAO: Modelo 3D + 2D com cotas e tolerancias.
- SIM / NAO: Material especificado (liga, tratamento, norma).
- SIM / NAO: Processo esperado (Swiss, 5 eixos, EDM, etc.).
- SIM / NAO: Quantidade (protótipo, piloto, serie).

## Geometria critica
- SIM / NAO: Raios internos coerentes com ferramenta (evita canto vivo impossivel).
- SIM / NAO: Furos profundos (>= 6x diametro) com estrategia definida.
- SIM / NAO: Roscas com entrada, alivio e classe definidos.
- SIM / NAO: Parede fina com espessura minima validada por material.

## Tolerancias e GD&T
- SIM / NAO: Cotas funcionais separadas das nao criticas.
- SIM / NAO: Tolerancias criticas com referencia de datums.
- SIM / NAO: Planicidade, concentricidade e coaxialidade so onde necessario.
- SIM / NAO: Cotas de montagem protegidas contra acúmulo de tolerancia.

## Processo e fixacao
- SIM / NAO: Acesso de ferramenta confirmado (principalmente Swiss-type).
- SIM / NAO: Numero de setups minimizado (evita custo e variacao).
- SIM / NAO: Geometria permite fixacao segura sem deformar.

## Materiais, acabamento e limpeza
- SIM / NAO: Material compativel com processo e tolerancia desejada.
- SIM / NAO: Ra especificado apenas em superficies funcionais.
- SIM / NAO: Acabamento alinhado (eletropolimento/passivacao/anodizacao).
- SIM / NAO: Requisitos de limpeza/embalagem especificados.

## Inspecao e aceitacao
- SIM / NAO: Metodo de medicao definido para cotas criticas (CMM, perfilometro, projetor, etc.).
- SIM / NAO: Plano de amostragem definido (FAI, PPAP, lote piloto).
- SIM / NAO: Certificados exigidos (material, tratamento, esterilizacao).

## Red flags (se marcar SIM, revisar antes de cotar)
- SIM / NAO: Tolerancia < 10 microns sem justificativa funcional.
- SIM / NAO: Canto interno vivo em material duro.
- SIM / NAO: Furo profundo sem estrategia de usinagem.
- SIM / NAO: Geometria exige mais de 3 setups sem necessidade.

## Saida recomendada
- **0-1 NAO em blocos criticos**: Pronto para cotacao.
- **2-3 NAO**: Ajuste rapido no desenho antes de enviar.
- **4+ NAO**: Revisao DFM completa recomendada.

## Mini-brief para enviar ao fornecedor (copie/cole)
- Material: ____
- Quantidade: ____ (proto/piloto/serie)
- Tolerancias criticas: ____
- Acabamento: ____
- Inspecao: ____
- Prazo alvo: ____

**Quer uma revisao DFM rapida?** Envie o desenho + este checklist preenchido.
$$,
  updated_at = timezone('utc'::text, now())
WHERE slug = 'dfm-checklist-implantes-instrumentais';

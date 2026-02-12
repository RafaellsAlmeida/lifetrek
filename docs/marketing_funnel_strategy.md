# Lifetrek Intentional Content Strategy

## Escopo e regra inegociavel

Este funil e exclusivamente sobre **Lifetrek Medical**.

- Nao usar nomes de outros clientes/consultorias (ex: ASC, Amorim Stout Consulting).
- Nao usar exemplos que desviem da proposta de valor da Lifetrek.
- Todo conteudo deve reforcar: manufatura de precisao, qualidade, metrologia, compliance quando relevante e reducao de risco na cadeia.

## Marketing Funnel (com blogs como pilar central)

Cada conteudo precisa ter papel claro no caminho ate reuniao comercial.

```mermaid
graph TD
    TOF["TOFU: Awareness"]
    MOF["MOFU: Consideration"]
    BOF["BOFU: Decision"]

    LI["LinkedIn Carousels"]
    IG["Instagram Visuals"]
    BLOG["Blog Posts (24)"]
    RES["Resources Hub"]
    CASE["Case + Provas Tecnicas"]
    MEET["Diagnostico Tecnico / Reuniao Comercial"]

    LI --> TOF
    IG --> TOF
    TOF --> BLOG
    BLOG --> MOF
    MOF --> RES
    BLOG --> BOF
    RES --> BOF
    BOF --> CASE
    CASE --> MEET

    style TOF fill:#e1f5fe,stroke:#01579b
    style MOF fill:#fff9c4,stroke:#fbc02d
    style BOF fill:#e8f5e9,stroke:#2e7d32
```

## Distribuicao dos 24 blogs (ate 31/05/2026)

Para evitar saturacao regulatoria, o mix editorial deve ser:

- 8 posts: engenharia de manufatura e processo
- 6 posts: qualidade e metrologia
- 4 posts: supply chain, risco e mercado
- 4 posts: regulatorio (ANVISA/ISO, apenas quando tema pedir)
- 2 posts: prova social / casos / capacidades Lifetrek

Regra de sequencia:

- **Maximo 2 posts regulatorios seguidos**.
- Sempre alternar com processo, qualidade, metrologia ou supply chain.

## Mapeamento por etapa do funil

| Funnel Stage | Conteudo | Objetivo | CTA |
| :--- | :--- | :--- | :--- |
| **TOFU** | Carrossel LinkedIn + blog tecnico introdutorio | Gerar descoberta e interesse tecnico | "Acesse o artigo completo" |
| **MOFU** | Blog tecnico aprofundado + recurso (checklist/guia) | Educar e qualificar lead | "Baixar checklist / guia tecnico" |
| **BOFU** | Blog de decisao (risco, ROI, validacao, transicao de fornecedor) | Reduzir risco percebido e acelerar decisao | "Agendar diagnostico tecnico com a Lifetrek" |

## Regras de qualidade editorial dos blogs

- Linguagem tecnica, objetiva, sem hype.
- Conteudo orientado a problema real de OEM/engenharia/qualidade.
- Nao forcar ANVISA em temas que nao sao regulatorios.
- Incluir secoes de referencia com fontes validas.
- Nunca citar clientes externos nao aprovados.

## Regras SEO/AIO por blog

- `seo_title` entre 40 e 65 caracteres.
- `seo_description` entre 140 e 160 caracteres.
- 3+ keywords relevantes.
- Capa horizontal em `featured_image`.
- 4+ fontes em `metadata.sources`.
- Secao `Referencias` no conteudo.
- FAQ (3+ perguntas) quando aplicavel.

## Execucao operacional

O fluxo de execucao deve:

1. Gerar tema e angulo com intencao de funil (TOFU/MOFU/BOFU).
2. Produzir rascunho tecnico com foco em Lifetrek.
3. Validar SEO/AIO + fontes.
4. Submeter para aprovacao interna (stakeholders).
5. Publicar/agendar conforme calendario ate 31/05/2026.

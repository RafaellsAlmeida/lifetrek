/**
 * Full markdown for checklist-dfm-implantes.
 * Aligned with lifetrek-technical-claims-guardian: no unsubstantiated quant guarantees;
 * numeric examples framed as typical industry practice, not Lifetrek specifications.
 * Keep in sync with supabase/migrations/*_dfm_checklist_guardian*.sql and scripts/update_dfm_resource.ts
 */
export const CHECKLIST_DFM_IMPLANTES_FULL_MARKDOWN = `# Checklist DFM para Implantes e Instrumentais

**Para quem é:** engenheiros de produto, P&D, qualidade ou fornecedores de usinagem que preparam **desenhos de implantes ou instrumentais** (titânio, aço cirúrgico e ligas comuns) antes de **cotação e industrialização**.

**O que você ganha em ~15–20 minutos:** uma passada sistemática no desenho para reduzir surpresas de custo/ciclo, retrabalho de tolerância e risco de “desenho bonito no CAD, difícil na máquina” — sem substituir a validação formal do seu sistema de qualidade.

**Como usar:** (1) percorra os 12 itens na ordem; (2) marque riscos e anote exceções do seu processo; (3) leve o resumo para a reunião de cotação com **material, volume e método de inspeção** definidos.

---

## Nota técnica (limites deste material)

Os **valores numéricos** abaixo são **exemplos típicos** da prática de usinagem e de bibliografia de DFM — não são especificações da Lifetrek, nem substituem o desenho aprovado, o plano de inspeção nem a avaliação de risco (por exemplo, sob **ISO 14971**). Ajuste sempre ao seu fornecedor, máquina e material.

---

## Contexto normativo (referência, não consultoria jurídica)

- **ISO 13485:2016** — o sistema de gestão da qualidade para dispositivos médicos inclui requisitos para **projeto e desenvolvimento**; o desenho precisa ser compatível com o que a organização pode **verificar e validar** na produção.
- **ISO 14971** — a gestão de risco informa decisões de geometria, tolerâncias e processo.
- **FDA 21 CFR 820.30** (EUA) — *Design controls*: o fabricante deve assegurar que o projeto seja traduzido em **especificações corretas** e que o dispositivo possa ser fabricado conforme o *design* (leia o texto legal na fonte oficial).
- **ASME Y14.5** — prática comum de **cotagem e tolerâncias (GD&T)** em desenhos mecânicos; útil para separar dimensões críticas das não críticas.

**Fontes úteis (públicas):**  
[21 CFR 820.30 — Design controls (eCFR)](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-820/subpart-C/section-820.30) · [ISO 13485:2016 (resumo no site da ISO)](https://www.iso.org/standard/59752.html) · [ISO 14971 (site da ISO)](https://www.iso.org/standard/72704.html)

---

## Os 12 pontos

### 1. Raios de canto internos compatíveis com ferramenta padrão
Em fresagem, cantos muito apertados costumam forçar **microferramentas** (mais caras e sensíveis). Sempre que a função permitir, prefira raios internos que **caiam em ferramentas de catálogo** (o seu fornecedor indica o mínimo viável).

### 2. Tolerâncias críticas só onde o produto exige
Tolerância “premium” em tudo **multiplica custo de medição e retrabalho**. Reserve apertura dimensional para **interfaces funcionais**; nas regiões não críticas, use tolerâncias padrão (veja também sua convenção de **GD&T**).

### 3. Minimize reconfigurações de fixação
Cada novo **setup** pode somar erro e tempo. Quando possível, agrupe operações para reduzir manuseio — sempre alinhado ao que seu processo realmente consegue repetir.

### 4. Padronize roscas e furos
Roscas e furos “exóticos” reduzem opções de ferramenta e aumentam lead time. Prefira **padrões de mercado** sempre que não houver razão de desenho forte.

### 5. Evite paredes excessivamente finas
Paredes muito finas (ordem de **frações de milímetro**, dependendo de material e estratégia de fixação) tendem a **vibrar** na usinagem (*chatter*) e prejudicam acabamento e estabilidade. Valide com seu processo.

### 6. Profundidade vs. diâmetro em furos
Furos **profundos em relação ao diâmetro** costumam exigir estratégia de perfuração, óleo e ferramenta adequados; em muitos casos, relações **L/D elevadas** aumentam risco de instabilidade. Avalie passante, degraus ou revisão de geometria.

### 7. Superfícies 3D complexas têm custo de ciclo
Superfícies orgânicas com **5 eixos contínuos** podem elevar muito tempo de máquina. Simplifique o que **não for função** (planos, chanfros) quando o requisito clínico permitir.

### 8. Planeje o engaste desde o início
Defina cedo **onde a peça será segurada** e se há área de sacrifício/alça no blank. Isso reduz improviso na primeira série.

### 9. Acesso para acabamento e limpeza
Cavidades fechadas e zonas profundas dificultam **polimento, jateamento ou eletropolimento** homogêneo. O design deve permitir acesso às ferramentas de acabamento e inspeção visual.

### 10. Material coerente com geometria e volume
Titânio, aços inoxidáveis e processos como **MIM** têm **matrizes de decisão** diferentes (custo, ciclo, ferramenta). Escolha material e processo alinhados ao volume — não é “o melhor material”, é o **adequado ao caso**.

### 11. Cantos vivos externos e uso clínico
Arestas vivas podem ser **risco de manuseio** e concentrar tensão. Chanfros e quebras de canto **padronizados** costumam ajudar na segurança do manuseio e na usinagem.

### 12. Montagem sem ambiguidade (poka-yoke)
Em instrumentais multiparte, geometrias **assimétricas** ou guias reduzem erro de montagem na linha e no centro cirúrgico.

---

## Leitura complementar (DFM clássico)

A literatura de **Design for Manufacture and Assembly (DFM/DFMA)** formaliza trade-offs entre geometria, processo e custo — útil como **vocabulário comum** com seu fornecedor (não é endosso normativo da Lifetrek a um único método).

---

## Próximo passo com a Lifetrek

Se você quer **validar fabricabilidade** com quem produz **implantes e instrumentais** em ambiente **ISO 13485**, com usinagem de precisão e metrologia para cotas críticas, o passo natural é uma **revisão técnica do desenho + escopo de processo** antes da cotação fechada.

**[Falar com engenharia](https://lifetrek-medical.com/contact)** — descreva material, volume-alvo e tolerâncias críticas; retornamos com clareza de rota e próximos dados necessários.

*Este conteúdo é educativo. Não substitui assessoria regulatória nem aprovação de desenho pelo seu responsável legal da qualidade.*
`;

/** Seed 20260124000000 stored only 3 truncated lines with "..." — detect that placeholder. */
export function isChecklistDfmImplantesTeaserContent(markdown: string): boolean {
    const t = markdown.trim();
    return (
        t.includes("1. Considere raios de canto internos...") &&
        t.includes("2. Especifique tolerâncias críticas apenas onde necessário...") &&
        t.includes("3. Minimize setups de fixação...") &&
        t.length < 600
    );
}

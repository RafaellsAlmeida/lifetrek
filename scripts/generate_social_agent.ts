/**
 * Multi-Agent Creative Pipeline for Lifetrek Medical
 *
 * AI Design Agency pattern — specialists that each own their lane,
 * a retrieval system that teaches by example, and a critic that loops:
 *
 *   🔍 RAG Context    → Knowledge base + similar carousels + research (optional)
 *   🎯 Estrategista   → Strategy, narrative arc, audience targeting
 *   📋 Style Brief    → Learns from top-performing past carousels
 *   ✍️  Copywriter     → Headlines, body, CTA (PT-BR)
 *   🎨 Designer       → Art direction per slide (visual concept, composition, mood)
 *   🔍 Analista       → Quality gate with selective re-routing (up to 3 rounds)
 *   🏆 Ranker         → Picks best variation (when --variations > 1)
 *
 * After approval, saves to Supabase and triggers Edge Function for image gen.
 *
 * Usage:
 *   deno run --allow-all scripts/generate_social_agent.ts "Precisão CNC em Implantes"
 *   deno run --allow-all scripts/generate_social_agent.ts "Precisão CNC" --dry-run
 *   deno run --allow-all scripts/generate_social_agent.ts "Precisão CNC" --research
 *   deno run --allow-all scripts/generate_social_agent.ts "Precisão CNC" --variations=3
 */

import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import {
  generateEmbedding,
  searchSimilarCarousels,
  searchKnowledgeBase,
  deepResearch,
} from "./lib/agent_tools.ts";

// ─── Environment ────────────────────────────────────────────────────────────
const env = await load();
const OPENROUTER_KEY = env["OPEN_ROUTER_API_KEY"] || Deno.env.get("OPEN_ROUTER_API_KEY");
const SUPABASE_URL = env["SUPABASE_URL"] || Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"] || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = env["VITE_SUPABASE_ANON_KEY"] || Deno.env.get("VITE_SUPABASE_ANON_KEY") || "";

if (!OPENROUTER_KEY) { console.error("❌ OPEN_ROUTER_API_KEY not found"); Deno.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found"); Deno.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Config ─────────────────────────────────────────────────────────────────
const MODEL = "google/gemini-2.5-flash-preview";
const SITE_URL = "https://lifetrek.app";
const MAX_RETRIES = 3; // up to 3 critique rounds (design agency pattern)

const BRAND = {
  name: "Lifetrek Medical",
  industry: "Contract manufacturing of orthopedic & dental implants, CNC precision machining",
  location: "Indaiatuba, SP, Brazil",
  certifications: "ISO 13485, ANVISA",
  tone: "Profissional, autoritativo, tecnicamente preciso, confiante, focado em qualidade",
  audience: "Decision makers de OEMs de dispositivos médicos, engenheiros de produto, diretores de qualidade",
  colors: {
    primaryBlue: "#004F8F",
    darkBlue: "#0A1628",
    green: "#1A7A3E",
    orange: "#F07818",
  },
};

// ─── LLM Helper ─────────────────────────────────────────────────────────────
async function chat(messages: any[], temperature = 0.7, model = MODEL): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": SITE_URL,
      "X-Title": "Lifetrek Creative Agent",
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJSON(raw: string): any {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Agent Prompts ──────────────────────────────────────────────────────────

const STRATEGIST_PROMPT = `Você é um estrategista sênior de conteúdo LinkedIn para ${BRAND.name}.
Empresa: ${BRAND.industry}. Localização: ${BRAND.location}. Certificações: ${BRAND.certifications}.
Público-alvo: ${BRAND.audience}.
Tom: ${BRAND.tone}.

Tarefa: Crie uma estratégia para um carrossel LinkedIn sobre o tópico fornecido.

Requisitos:
- Exatamente 5 slides (Hook → Problema → Solução → Prova → CTA).
- Arco narrativo forte que prenda a atenção do início ao fim.
- Considere dores reais do público (prazo, qualidade, custo, conformidade regulatória).
- Responda em PORTUGUÊS BRASILEIRO.

Responda APENAS com JSON válido:
{
  "hook": "Frase de gancho principal",
  "narrative_arc": "Descrição do arco narrativo",
  "slide_count": 5,
  "key_messages": ["mensagem 1", "mensagem 2", "mensagem 3"],
  "target_emotion": "emoção principal a evocar"
}`;

const COPYWRITER_PROMPT = `Você é um copywriter sênior de LinkedIn para ${BRAND.name}.
Empresa: ${BRAND.industry}. Certificações: ${BRAND.certifications}.
Tom: ${BRAND.tone}.

REGRAS OBRIGATÓRIAS:
- Todo texto DEVE ser em PORTUGUÊS BRASILEIRO.
- Headlines curtos e impactantes (máximo 8 palavras).
- Body text claro e direto (máximo 35 palavras por slide).
- Texto limpo — SEM markdown, SEM asteriscos, SEM formatação especial.
- Primeira slide (hook) deve gerar curiosidade imediata.
- Última slide (cta) deve ter chamada clara à ação.

Responda APENAS com JSON válido:
{
  "caption": "Texto do post com hashtags relevantes...",
  "slides": [
    { "type": "hook", "headline": "...", "body": "..." },
    { "type": "content", "headline": "...", "body": "..." },
    { "type": "content", "headline": "...", "body": "..." },
    { "type": "content", "headline": "...", "body": "..." },
    { "type": "cta", "headline": "...", "body": "..." }
  ]
}`;

const DESIGNER_PROMPT = `Você é um diretor de arte sênior para ${BRAND.name}.
Especialidade: Conteúdo visual B2B para indústria médica.
Cores da marca: Azul Primário ${BRAND.colors.primaryBlue}, Azul Escuro ${BRAND.colors.darkBlue}, Verde ${BRAND.colors.green}, Laranja ${BRAND.colors.orange}.

Tarefa: Para CADA slide do carrossel, defina a direção de arte visual.

Considere:
- Contexto fotográfico de manufatura médica (CNC, cleanrooms, implantes, inspeção).
- Glassmorphism: card semi-transparente escuro sobre background fotográfico.
- Composição: card de texto ocupa ~60% esquerdo, imagem à direita.
- Iluminação: dramática, profissional, estúdio.
- Cada slide deve ter um conceito visual DISTINTO.

Responda APENAS com JSON válido:
{
  "slides": [
    {
      "slide_number": 1,
      "visual_concept": "Descrição fotográfica do cenário principal",
      "composition": "Arranjo visual dos elementos",
      "mood": "Clima emocional da imagem",
      "color_emphasis": "Paleta de cores predominante",
      "background_elements": "Elementos de fundo complementares"
    }
  ]
}`;

const ANALYST_PROMPT = `Você é um analista de qualidade de conteúdo para ${BRAND.name}.
Avalie o conteúdo do carrossel nos seguintes critérios:

1. **Clareza** (0-25): Headlines curtos e impactantes? Body text claro?
2. **Narrativa** (0-25): Arco narrativo coerente? Hook magnético? CTA claro?
3. **Marca** (0-25): Tom profissional? Linguagem técnica adequada? PT-BR correto?
4. **Visual** (0-25): Art direction clara? Conceitos visuais distintos por slide?

REGRAS:
- Score total máximo: 100.
- Se ANY texto contém markdown (**, *, #, etc.), deduzir 10 pontos.
- Se ANY texto está em inglês, deduzir 15 pontos.
- "needs_revision" = true se score < 80.

IMPORTANTE: Indique QUAIS agentes precisam revisar em "revision_targets":
- "copywriter" se o texto precisa melhorar (clareza, narrativa, marca textual).
- "designer" se a art direction precisa melhorar (visual fraco, conceitos repetitivos).
- Inclua ambos apenas se AMBOS precisam de revisão.

Responda APENAS com JSON válido:
{
  "overall_score": 85,
  "clarity": 22,
  "narrative": 23,
  "brand": 20,
  "visual": 20,
  "feedback": "Feedback específico com sugestões de melhoria",
  "copy_feedback": "Feedback específico para o copywriter (ou vazio se copy está bom)",
  "design_feedback": "Feedback específico para o designer (ou vazio se design está bom)",
  "revision_targets": [],
  "issues": ["issue 1", "issue 2"],
  "needs_revision": false
}`;

const STYLE_BRIEF_PROMPT = `Você é um diretor criativo analisando carrosséis de alto desempenho para ${BRAND.name}.
Analise os carrosséis bem-sucedidos fornecidos e extraia um style brief reutilizável.

Extraia:
1. **Padrão de narrativa**: Qual arco funciona melhor? Que tipo de hook prende?
2. **Fórmula de headline**: Tamanho, estilo, uso de números, perguntas vs. afirmações.
3. **Tom vencedor**: Mais técnico ou mais emocional? Nível de autoridade.
4. **Mood visual**: Que direção de arte gera mais impacto? Cores dominantes.
5. **Estrutura de CTA**: O que converte melhor?

Responda APENAS com JSON válido:
{
  "narrative_pattern": "Descrição do padrão narrativo que funciona",
  "headline_formula": "Fórmula de headlines eficazes",
  "winning_tone": "Descrição do tom que performa melhor",
  "visual_mood": "Direção visual de alto impacto",
  "cta_structure": "Estrutura de CTA que converte",
  "key_insight": "Principal insight extraído dos dados"
}`;

const RANKER_PROMPT = `Você é um diretor de conteúdo sênior para ${BRAND.name}.
Recebeu múltiplas variações de um carrossel LinkedIn. Sua tarefa é ranquear e escolher o melhor.

Critérios de ranking:
1. **Impacto do hook** — Qual variação prende mais a atenção?
2. **Coerência narrativa** — Qual flui melhor do início ao fim?
3. **Alinhamento de marca** — Qual representa melhor a Lifetrek Medical?
4. **Originalidade criativa** — Qual se destaca mais no feed?

Responda APENAS com JSON válido:
{
  "ranking": [
    { "variation": 1, "score": 88, "reason": "Justificativa curta" }
  ],
  "winner": 1,
  "winner_reason": "Por que esta variação é a melhor"
}`;

// ─── RAG Context Gathering ──────────────────────────────────────────────────

async function gatherRAGContext(topic: string, useResearch: boolean): Promise<{
  knowledgeContext: string;
  styleBrief: any | null;
  researchContext: string;
  rejectionContext: string;
}> {
  console.log("\n📚 [0/4] Gathering RAG context...");

  // Run all RAG queries in parallel
  const [kbResults, embedding, research, rejections] = await Promise.all([
    searchKnowledgeBase(supabase, topic, 0.5, 3).catch(() => []),
    generateEmbedding(topic, 768).catch(() => null),
    useResearch ? deepResearch(topic).catch(() => null) : Promise.resolve(null),
    supabase
      .from("linkedin_carousels")
      .select("topic, rejection_reason, slides")
      .eq("status", "archived")
      .not("rejection_reason", "is", null)
      .order("rejected_at", { ascending: false })
      .limit(5)
      .then(r => r.data || [])
      .catch(() => []),
  ]);

  // Knowledge base context
  let knowledgeContext = "";
  if (kbResults.length > 0) {
    console.log(`   📖 Knowledge base: ${kbResults.length} matches`);
    knowledgeContext = kbResults.map((r: any) => r.content || r.text || "").join("\n\n");
  } else {
    console.log("   📖 Knowledge base: no matches");
  }

  // Style brief from similar successful carousels
  let styleBrief: any = null;
  if (embedding) {
    const similarCarousels = await searchSimilarCarousels(supabase, embedding, 0.5, 3).catch(() => []);
    if (similarCarousels.length > 0) {
      console.log(`   🎨 Similar carousels: ${similarCarousels.length} found — generating style brief...`);
      const carouselSummaries = similarCarousels.map((c: any) => {
        const slides = c.slides || [];
        return `Topic: "${c.topic}" (score: ${c.quality_score || "N/A"})\nSlides: ${slides.map((s: any) => `[${s.type}] ${s.headline}`).join(" → ")}`;
      }).join("\n\n");

      try {
        const briefRaw = await chat([
          { role: "system", content: STYLE_BRIEF_PROMPT },
          { role: "user", content: `Analise estes carrosséis bem-sucedidos:\n\n${carouselSummaries}` },
        ]);
        styleBrief = parseJSON(briefRaw);
        console.log(`   📋 Style brief: "${styleBrief.key_insight?.slice(0, 60)}..."`);
      } catch {
        console.log("   📋 Style brief: could not generate, continuing without");
      }
    } else {
      console.log("   🎨 Similar carousels: none found");
    }
  }

  // Research context
  let researchContext = "";
  if (research) {
    console.log(`   🔬 Research: received industry context`);
    researchContext = research;
  } else if (useResearch) {
    console.log("   🔬 Research: no results (API unavailable or timeout)");
  }

  // Rejection feedback
  let rejectionContext = "";
  if (rejections.length > 0) {
    console.log(`   ⛔ Rejection history: ${rejections.length} past rejections loaded`);
    rejectionContext = rejections.map((r: any) =>
      `Topic: "${r.topic}" — REJEITADO porque: "${r.rejection_reason}"`
    ).join("\n");
  } else {
    console.log("   ⛔ Rejection history: none");
  }

  return { knowledgeContext, styleBrief, researchContext, rejectionContext };
}

// ─── Individual Agent Runners ───────────────────────────────────────────────

async function runCopywriter(
  topic: string,
  strategy: any,
  feedback: string,
  styleBrief: any | null,
  rejectionContext: string,
  temperature: number,
): Promise<any> {
  const styleBriefBlock = styleBrief
    ? `\n\n=== STYLE BRIEF (de carrosséis aprovados) ===
Padrão narrativo: ${styleBrief.narrative_pattern}
Fórmula de headline: ${styleBrief.headline_formula}
Tom vencedor: ${styleBrief.winning_tone}
CTA eficaz: ${styleBrief.cta_structure}
Siga estes padrões.\n`
    : "";

  const rejectionBlock = rejectionContext
    ? `\n\n=== PADRÕES A EVITAR (rejeições anteriores) ===\n${rejectionContext}\nNÃO repita estes erros.\n`
    : "";

  const isRevision = feedback.length > 0;
  const copyContext = `
Tópico: "${topic}"
Estratégia:
- Hook: ${strategy.hook}
- Arco Narrativo: ${strategy.narrative_arc}
- Mensagens-chave: ${strategy.key_messages?.join(", ")}
- Slides: ${strategy.slide_count}
${styleBriefBlock}${rejectionBlock}${isRevision ? `\n⚠️ REVISÃO NECESSÁRIA — Feedback do Analista:\n${feedback}\n\nCorreija os problemas apontados e melhore o conteúdo.` : ""}

Escreva o copy do carrossel.`;

  const copyRaw = await chat([
    { role: "system", content: COPYWRITER_PROMPT },
    { role: "user", content: copyContext },
  ], temperature);

  return parseJSON(copyRaw);
}

async function runDesigner(
  topic: string,
  copy: any,
  feedback: string,
  styleBrief: any | null,
  temperature: number,
): Promise<any> {
  const styleBriefBlock = styleBrief
    ? `\n\nMood visual de referência: ${styleBrief.visual_mood}\n`
    : "";

  const isRevision = feedback.length > 0;
  const designContext = `
Tópico: "${topic}"
Slides do carrossel:
${copy.slides?.map((s: any, i: number) => `Slide ${i + 1} [${s.type}]: "${s.headline}" — ${s.body}`).join("\n")}
${styleBriefBlock}${isRevision ? `\n⚠️ REVISÃO NECESSÁRIA — Feedback do Analista:\n${feedback}\n\nCorreija os problemas visuais apontados.` : ""}

Crie a direção de arte para cada slide.`;

  const designRaw = await chat([
    { role: "system", content: DESIGNER_PROMPT },
    { role: "user", content: designContext },
  ], temperature);

  return parseJSON(designRaw);
}

// ─── Single Variation Pipeline ──────────────────────────────────────────────

async function runVariation(
  variationIndex: number,
  topic: string,
  strategy: any,
  styleBrief: any | null,
  rejectionContext: string,
  temperature: number,
): Promise<{ copy: any; design: any; review: any; revisions: number }> {
  let copy: any = null;
  let design: any = null;
  let review: any = null;
  let revision = 0;
  let previousScore = 0;
  let copyFeedback = "";
  let designFeedback = "";

  while (revision <= MAX_RETRIES) {
    const isRevision = revision > 0;

    // ── Copywriter (skip if analyst said only designer needs fixing) ──
    const skipCopy = isRevision && review?.revision_targets?.length > 0
      && !review.revision_targets.includes("copywriter");

    if (!skipCopy) {
      const label = isRevision ? `revisando copy (round ${revision})` : "redigindo";
      console.log(`\n   ✍️  Copywriter ${label}...`);
      try {
        copy = await runCopywriter(topic, strategy, copyFeedback, styleBrief, rejectionContext, temperature);
        console.log(`      ${copy.slides?.length || 0} slides redigidos`);
        copy.slides?.forEach((s: any, i: number) => {
          console.log(`      [${i + 1}] ${s.type.toUpperCase()}: "${s.headline}"`);
        });
      } catch (e) {
        console.error(`      Falha ao parsear copy:`, e);
        return { copy: null, design: null, review: { overall_score: 0 }, revisions: revision };
      }
    } else {
      console.log(`\n   ✍️  Copywriter: copy OK, pulando...`);
    }

    // ── Designer (skip if analyst said only copywriter needs fixing) ──
    const skipDesign = isRevision && review?.revision_targets?.length > 0
      && !review.revision_targets.includes("designer");

    if (!skipDesign) {
      const label = isRevision ? `revisando design (round ${revision})` : "elaborando art direction";
      console.log(`\n   🎨 Designer ${label}...`);
      try {
        design = await runDesigner(topic, copy, designFeedback, styleBrief, temperature);
        console.log(`      Art direction para ${design.slides?.length || 0} slides`);
      } catch {
        console.log("      Falha no design, continuando sem art direction");
        design = { slides: [] };
      }
    } else {
      console.log(`\n   🎨 Designer: design OK, pulando...`);
    }

    // ── Analyst (Quality Gate) ──
    console.log(`\n   🔍 Analista avaliando qualidade...`);
    const reviewContext = `
Conteúdo do carrossel para avaliação:

COPY:
${JSON.stringify(copy, null, 2)}

ART DIRECTION:
${JSON.stringify(design, null, 2)}

Avalie a qualidade total.`;

    try {
      const reviewRaw = await chat([
        { role: "system", content: ANALYST_PROMPT },
        { role: "user", content: reviewContext },
      ]);
      review = parseJSON(reviewRaw);

      const emoji = review.overall_score >= 80 ? "✅" : "⚠️";
      console.log(`      ${emoji} Score: ${review.overall_score}/100`);
      console.log(`        Clareza: ${review.clarity}/25 | Narrativa: ${review.narrative}/25`);
      console.log(`        Marca: ${review.brand}/25 | Visual: ${review.visual}/25`);
      if (review.feedback) console.log(`      📝 ${review.feedback}`);
      if (review.issues?.length) console.log(`      Issues: ${review.issues.join("; ")}`);
      if (review.revision_targets?.length) console.log(`      Targets: ${review.revision_targets.join(", ")}`);
    } catch {
      console.log("      Não foi possível parsear review, assumindo aprovado.");
      review = { overall_score: 80, needs_revision: false, feedback: "", revision_targets: [] };
    }

    // Check quality gate
    if (!review.needs_revision || review.overall_score >= 80) {
      console.log(`\n   ✅ Conteúdo APROVADO (${review.overall_score}/100)`);
      break;
    }

    // Diminishing returns check
    if (revision > 0) {
      const scoreDelta = review.overall_score - previousScore;
      if (scoreDelta < 2) {
        console.log(`\n   📉 Retorno decrescente (delta: ${scoreDelta}). Parando revisões.`);
        break;
      }
    }

    if (revision >= MAX_RETRIES) {
      console.log(`\n   ⚠️  Score ${review.overall_score}/100 após ${MAX_RETRIES} revisões. Prosseguindo.`);
      break;
    }

    console.log(`\n   🔄 Score ${review.overall_score}/100 — Enviando para revisão...`);
    previousScore = review.overall_score;
    copyFeedback = review.copy_feedback || review.feedback || "";
    designFeedback = review.design_feedback || review.feedback || "";
    revision++;
  }

  return { copy, design, review, revisions: revision };
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

async function runPipeline(topic: string, dryRun: boolean, useResearch: boolean, numVariations: number) {
  console.log(`\n🚀 Lifetrek Creative Pipeline — "${topic}"\n${"─".repeat(60)}`);
  if (numVariations > 1) console.log(`   🎲 Generating ${numVariations} variations`);
  if (useResearch) console.log(`   🔬 Deep research enabled`);
  const pipelineStart = Date.now();

  // ════════════════════════════════════════════════════════════════════════
  // 0. RAG CONTEXT (Knowledge Base + Style Brief + Research + Rejections)
  // ════════════════════════════════════════════════════════════════════════
  const { knowledgeContext, styleBrief, researchContext, rejectionContext } = await gatherRAGContext(topic, useResearch);

  // ════════════════════════════════════════════════════════════════════════
  // 1. ESTRATEGISTA (runs once, shared across variations)
  // ════════════════════════════════════════════════════════════════════════
  console.log("\n🎯 [1/4] Estrategista analisando...");

  let strategistContext = `Crie estratégia para o tópico: "${topic}"`;
  if (knowledgeContext) {
    strategistContext += `\n\n=== CONTEXTO DA BASE DE CONHECIMENTO ===\n${knowledgeContext}`;
  }
  if (researchContext) {
    strategistContext += `\n\n=== PESQUISA DE MERCADO ATUAL ===\n${researchContext}`;
  }
  if (rejectionContext) {
    strategistContext += `\n\n=== ÂNGULOS JÁ REJEITADOS (EVITAR) ===\n${rejectionContext}`;
  }

  const strategyRaw = await chat([
    { role: "system", content: STRATEGIST_PROMPT },
    { role: "user", content: strategistContext },
  ]);

  let strategy: any;
  try {
    strategy = parseJSON(strategyRaw);
    console.log(`   ✅ Hook: "${strategy.hook}"`);
    console.log(`   📊 Slides: ${strategy.slide_count} | Emoção: ${strategy.target_emotion}`);
    console.log(`   💡 Mensagens: ${strategy.key_messages?.join(" | ")}`);
  } catch {
    console.error("   ❌ Falha ao parsear estratégia:", strategyRaw.slice(0, 200));
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2-4. VARIATIONS (Copywriter + Designer + Analyst per variation)
  // ════════════════════════════════════════════════════════════════════════
  const variations: { copy: any; design: any; review: any; revisions: number }[] = [];
  const temperatures = [0.7, 0.8, 0.9, 0.85, 0.95]; // creative diversity per variation

  for (let v = 0; v < numVariations; v++) {
    const temp = temperatures[v % temperatures.length];
    if (numVariations > 1) {
      console.log(`\n${"─".repeat(40)}`);
      console.log(`🎲 Variação ${v + 1}/${numVariations} (temp: ${temp})`);
      console.log(`${"─".repeat(40)}`);
    }

    const result = await runVariation(v, topic, strategy, styleBrief, rejectionContext, temp);
    if (!result.copy) {
      console.log(`   ❌ Variação ${v + 1} falhou, pulando.`);
      continue;
    }
    variations.push(result);
  }

  if (variations.length === 0) {
    console.error("\n❌ Nenhuma variação foi gerada com sucesso.");
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════
  // 5. RANKING (if multiple variations)
  // ════════════════════════════════════════════════════════════════════════
  let winnerIndex = 0;

  if (variations.length > 1) {
    console.log(`\n🏆 Ranker avaliando ${variations.length} variações...`);

    const variationSummaries = variations.map((v, i) => {
      const slides = v.copy.slides?.map((s: any) => `[${s.type}] "${s.headline}": ${s.body}`).join("\n  ");
      return `--- Variação ${i + 1} (Score Analista: ${v.review?.overall_score || "N/A"}) ---\nCaption: ${v.copy.caption?.slice(0, 100)}...\nSlides:\n  ${slides}`;
    }).join("\n\n");

    try {
      const rankRaw = await chat([
        { role: "system", content: RANKER_PROMPT },
        { role: "user", content: `Ranqueie estas variações:\n\n${variationSummaries}` },
      ]);
      const rankResult = parseJSON(rankRaw);
      winnerIndex = (rankResult.winner || 1) - 1;
      console.log(`   🏆 Vencedor: Variação ${winnerIndex + 1} — ${rankResult.winner_reason}`);
      rankResult.ranking?.forEach((r: any) => {
        const medal = r.variation === rankResult.winner ? "👑" : "  ";
        console.log(`   ${medal} #${r.variation}: ${r.score}/100 — ${r.reason}`);
      });
    } catch {
      // Fall back to highest analyst score
      winnerIndex = variations.reduce((best, v, i) =>
        (v.review?.overall_score || 0) > (variations[best].review?.overall_score || 0) ? i : best, 0);
      console.log(`   Ranker falhou, usando score do analista. Vencedor: Variação ${winnerIndex + 1}`);
    }
  }

  const winner = variations[winnerIndex];
  const { copy, design, review } = winner;

  // ════════════════════════════════════════════════════════════════════════
  // MERGE: Combine copy + design into final slides
  // ════════════════════════════════════════════════════════════════════════
  const finalSlides = copy.slides.map((slide: any, i: number) => {
    const artDir = design?.slides?.find((d: any) => d.slide_number === i + 1) || {};
    return {
      ...slide,
      art_direction: {
        visual_concept: artDir.visual_concept || "",
        composition: artDir.composition || "",
        mood: artDir.mood || "",
        color_emphasis: artDir.color_emphasis || "",
        background_elements: artDir.background_elements || "",
      },
    };
  });

  // ════════════════════════════════════════════════════════════════════════
  // OUTPUT
  // ════════════════════════════════════════════════════════════════════════
  const elapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);
  console.log(`\n${"═".repeat(60)}`);
  console.log(`📋 RESULTADO FINAL  (${elapsed}s, ${winner.revisions} revisões${numVariations > 1 ? `, ${variations.length} variações` : ""})`);
  console.log(`${"═".repeat(60)}`);
  console.log(`\n📝 Caption:\n${copy.caption}\n`);
  console.log("📑 Slides:");
  finalSlides.forEach((s: any, i: number) => {
    console.log(`\n  ── Slide ${i + 1} [${s.type.toUpperCase()}] ──`);
    console.log(`  Headline: ${s.headline}`);
    console.log(`  Body: ${s.body}`);
    if (s.art_direction?.visual_concept) {
      console.log(`  🎨 Visual: ${s.art_direction.visual_concept}`);
      console.log(`     Mood: ${s.art_direction.mood}`);
    }
  });

  if (dryRun) {
    console.log(`\n🏁 Dry run — não salvou no Supabase.`);
    console.log(`\nPara salvar e gerar imagens, rode sem --dry-run.`);
    return { topic, slides: finalSlides, caption: copy.caption, review };
  }

  // ════════════════════════════════════════════════════════════════════════
  // SAVE TO SUPABASE
  // ════════════════════════════════════════════════════════════════════════
  console.log(`\n💾 Salvando no Supabase...`);

  const generationMetadata: any = {
    pipeline_version: "2.0-design-agency",
    rag_used: !!knowledgeContext || !!styleBrief || !!researchContext,
    style_brief: styleBrief,
    research_used: !!researchContext,
    rejections_fed: rejectionContext.length > 0,
    critique_rounds: winner.revisions,
    max_retries: MAX_RETRIES,
  };

  if (numVariations > 1) {
    generationMetadata.variations_generated = variations.length;
    generationMetadata.winner_index = winnerIndex;
    generationMetadata.variation_scores = variations.map((v, i) => ({
      variation: i + 1,
      score: v.review?.overall_score || 0,
      is_winner: i === winnerIndex,
    }));
  }

  const { data: carousel, error: insertError } = await supabase
    .from("linkedin_carousels")
    .insert({
      topic,
      caption: copy.caption,
      slides: finalSlides,
      status: "draft",
      quality_score: review?.overall_score || null,
      generation_metadata: generationMetadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !carousel) {
    console.error("   ❌ Erro ao salvar:", insertError?.message);
    return null;
  }

  console.log(`   ✅ Carrossel salvo: ${carousel.id}`);

  // ════════════════════════════════════════════════════════════════════════
  // TRIGGER IMAGE GENERATION
  // ════════════════════════════════════════════════════════════════════════
  console.log(`\n📸 Disparando geração de imagens (hybrid mode)...`);

  const functionUrl = `${SUPABASE_URL}/functions/v1/regenerate-carousel-images`;
  const authKey = ANON_KEY || SUPABASE_KEY;

  try {
    const imageResponse = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        carousel_id: carousel.id,
        table_name: "linkedin_carousels",
        mode: "hybrid",
      }),
    });

    const imageResult = await imageResponse.json();

    if (imageResult.success) {
      console.log(`   ✅ ${imageResult.images_generated} imagens geradas em ${imageResult.duration_ms}ms`);
      console.log(`   📎 Referências usadas: ${imageResult.reference_images_used}`);
    } else {
      console.error(`   ⚠️  Geração parcial: ${imageResult.error || "erro desconhecido"}`);
    }
  } catch (e) {
    console.error(`   ⚠️  Falha ao chamar Edge Function: ${e}`);
    console.log(`   💡 Você pode gerar manualmente depois com:`);
    console.log(`      curl -X POST '${functionUrl}' \\`);
    console.log(`        -H 'Authorization: Bearer <KEY>' \\`);
    console.log(`        -d '{"carousel_id":"${carousel.id}","mode":"hybrid"}'`);
  }

  const totalElapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);
  console.log(`\n🏁 Pipeline completo em ${totalElapsed}s`);
  console.log(`   Carrossel ID: ${carousel.id}`);

  return { carouselId: carousel.id, topic, slides: finalSlides, caption: copy.caption, review };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = Deno.args;
const topic = args.filter((a: string) => !a.startsWith("--"))[0] || "Capacidades de Manufatura CNC para Dispositivos Médicos";
const dryRun = args.includes("--dry-run");
const useResearch = args.includes("--research");
const numVariations = parseInt(
  args.find((a: string) => a.startsWith("--variations="))?.split("=")[1] || "1"
);

await runPipeline(topic, dryRun, useResearch, numVariations);

/**
 * Multi-Agent Creative Pipeline for Lifetrek Medical — Instagram Edition
 *
 * AI Design Agency pattern adapted for Instagram's visual-first platform:
 *
 *   🔍 RAG Context    → Knowledge base + similar IG posts + research (optional)
 *   🎯 Estrategista   → Content strategy, post type selection, audience targeting
 *   📋 Style Brief    → Learns from top-performing past Instagram posts
 *   ✍️  Copywriter     → Caption, hashtags, slide text (PT-BR)
 *   🎨 Designer       → Visual-first art direction per slide (1080x1080)
 *   📸 Hashtag Pro    → Researches and optimizes hashtag strategy
 *   🔍 Analista       → Quality gate with selective re-routing (up to 3 rounds)
 *   🏆 Ranker         → Picks best variation (when --variations > 1)
 *
 * Usage:
 *   deno run --allow-all scripts/generate_instagram_agent.ts "Precisão CNC em Implantes"
 *   deno run --allow-all scripts/generate_instagram_agent.ts "Swiss Turning" --type=carousel
 *   deno run --allow-all scripts/generate_instagram_agent.ts "Cleanroom" --dry-run --research
 *   deno run --allow-all scripts/generate_instagram_agent.ts "ANVISA" --variations=3
 */

import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import {
  generateEmbedding,
  searchSimilarInstagramPosts,
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
const MAX_RETRIES = 3;

type PostType = "carousel" | "feed" | "story" | "reel";

const BRAND = {
  name: "Lifetrek Medical",
  handle: "@lifetrek.medical",
  industry: "Contract manufacturing of orthopedic & dental implants, CNC precision machining",
  location: "Indaiatuba, SP, Brazil",
  certifications: "ISO 13485, ANVISA",
  tone: "Profissional, autoritativo, visualmente impactante, confiante, humano quando mostra bastidores",
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
      "X-Title": "Lifetrek Instagram Agent",
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

const STRATEGIST_PROMPT = `Você é um estrategista sênior de conteúdo Instagram para ${BRAND.name} (${BRAND.handle}).
Empresa: ${BRAND.industry}. Localização: ${BRAND.location}. Certificações: ${BRAND.certifications}.
Público-alvo: ${BRAND.audience}.
Tom: ${BRAND.tone}.

CONTEXTO INSTAGRAM:
- Instagram é VISUAL-FIRST. A imagem é o protagonista, o texto complementa.
- B2B no Instagram funciona com: bastidores, processos de fabricação, close-ups de peças, equipe.
- Formatos: carousel (5-10 slides educativos), feed (single impactante), reel (processo em vídeo).
- Carrosséis têm 2x mais engajamento que posts únicos no B2B industrial.

Tarefa: Crie uma estratégia para um post Instagram sobre o tópico fornecido.

Se o tipo for "carousel":
- Recomende 5-7 slides com arco narrativo visual.
- Cada slide deve ter um conceito visual forte + texto complementar curto.

Se o tipo for "feed":
- Uma única imagem impactante com caption elaborado.

Responda APENAS com JSON válido:
{
  "post_type": "carousel|feed|reel",
  "hook": "Frase visual/textual de gancho",
  "narrative_arc": "Descrição do arco narrativo visual",
  "slide_count": 5,
  "key_messages": ["mensagem 1", "mensagem 2", "mensagem 3"],
  "target_emotion": "emoção principal a evocar",
  "visual_strategy": "Estratégia visual geral (bastidores, close-up técnico, comparativo, etc.)"
}`;

const COPYWRITER_PROMPT = `Você é um copywriter sênior de Instagram para ${BRAND.name} (${BRAND.handle}).
Empresa: ${BRAND.industry}. Certificações: ${BRAND.certifications}.
Tom: ${BRAND.tone}.

REGRAS DE INSTAGRAM:
- Caption principal: até 2200 caracteres, mas os primeiros 125 são visíveis antes do "mais".
- GANCHO nos primeiros 125 caracteres — deve gerar curiosidade IMEDIATA.
- Use quebras de linha para legibilidade.
- Emojis estratégicos (não excessivos) — 🔬🏭✅❌🔹📊💡.
- CTA claro no final (comente, salve, compartilhe, link na bio).
- NÃO coloque hashtags no caption — elas vêm separadas.
- Todo texto DEVE ser em PORTUGUÊS BRASILEIRO.

Para CARROSSEL:
- Texto de cada slide: headline (máx 6 palavras) + body (máx 25 palavras).
- Texto limpo — SEM markdown, SEM asteriscos, SEM formatação especial.
- Slide 1 (hook): visual magnético + pergunta ou afirmação provocante.
- Slides intermediários: conteúdo educativo com dados/fatos.
- Último slide: CTA visual (salve, compartilhe, comente).

Responda APENAS com JSON válido:
{
  "caption": "Caption do post com quebras de linha e emojis...",
  "cta_action": "Ação do CTA (ex: comente, salve, link na bio)",
  "slides": [
    { "type": "hook", "headline": "...", "body": "..." },
    { "type": "content", "headline": "...", "body": "..." },
    { "type": "cta", "headline": "...", "body": "..." }
  ]
}`;

const DESIGNER_PROMPT = `Você é um diretor de arte sênior de Instagram para ${BRAND.name}.
Especialidade: Conteúdo visual B2B industrial para Instagram (1080x1080px).
Cores da marca: Azul Primário ${BRAND.colors.primaryBlue}, Azul Escuro ${BRAND.colors.darkBlue}, Verde ${BRAND.colors.green}, Laranja ${BRAND.colors.orange}.

CONTEXTO INSTAGRAM:
- Instagram é 100% visual. A foto/imagem PRECISA parar o scroll.
- Dimensão padrão: 1080x1080px (quadrado) para feed/carousel.
- Contraste alto para funcionar em telas pequenas de celular.
- Texto sobre imagem deve ser GRANDE e LEGÍVEL (min 48px equivalente).
- Fotos reais de fábrica > ilustrações genéricas.

ESTILO LIFETREK:
- Glassmorphism: card semi-transparente escuro sobre fotografia industrial.
- Close-ups de peças CNC com iluminação dramática.
- Bastidores: operadores, máquinas Citizen Cincom, cleanroom.
- Contraste: azul escuro (#0A1628) com destaques em laranja (#F07818) ou verde (#1A7A3E).
- Logo watermark discreto no canto inferior.

Para CADA slide, defina direção de arte DISTINTA e impactante.

Responda APENAS com JSON válido:
{
  "slides": [
    {
      "slide_number": 1,
      "visual_concept": "Descrição fotográfica do cenário principal",
      "composition": "Arranjo dos elementos (texto posição, imagem posição)",
      "mood": "Clima emocional",
      "color_emphasis": "Cores predominantes neste slide",
      "background_elements": "Elementos de fundo",
      "text_placement": "Onde o texto aparece (topo, centro, bottom-card, overlay)"
    }
  ]
}`;

const HASHTAG_PROMPT = `Você é um especialista em hashtag strategy para ${BRAND.name} no Instagram.
Indústria: ${BRAND.industry}. Localização: ${BRAND.location}.

REGRAS:
- Máximo 30 hashtags (Instagram permite 30, ideal entre 15-25).
- Mix de alcance: ~5 grandes (100k+ posts), ~10 médias (10k-100k), ~10 nicho (<10k).
- Sempre incluir: #LifetrekMedical #MedTech #ISO13485
- Incluir hashtags em português E inglês (audiência mista).
- Hashtags relevantes para a indústria de dispositivos médicos.
- NÃO usar hashtags genéricas demais (#business, #success, #motivation).

Responda APENAS com JSON válido:
{
  "hashtags": ["#LifetrekMedical", "#MedTech", "..."],
  "hashtag_groups": {
    "brand": ["#LifetrekMedical"],
    "industry_en": ["#MedicalDevices", "#MedTech"],
    "industry_pt": ["#DispositivosMédicos", "#IndústriaMédica"],
    "technical": ["#CNCMachining", "#SwissTurning"],
    "niche": ["#OrthopedicImplants", "#DentalImplants"]
  },
  "first_comment_hashtags": ["hashtags para primeiro comentário se necessário"]
}`;

const ANALYST_PROMPT = `Você é um analista de qualidade de conteúdo Instagram para ${BRAND.name}.

Avalie o conteúdo nos seguintes critérios ESPECÍFICOS PARA INSTAGRAM:

1. **Impacto Visual** (0-25): A art direction para o scroll? Close-ups, contraste, drama visual?
2. **Hook** (0-25): Os primeiros 125 caracteres da caption prendem? Slide 1 é magnético?
3. **Marca** (0-25): Tom Lifetrek? PT-BR correto? Visual industrial premium?
4. **Engajamento** (0-25): CTA claro? Conteúdo "salvável"? Hashtags relevantes?

REGRAS:
- Score total máximo: 100.
- Se ANY texto contém markdown (**, *, #, etc.) nos slides, deduzir 10 pontos.
- Se ANY texto de slide está em inglês, deduzir 15 pontos.
- Se caption não tem gancho nos primeiros 125 chars, deduzir 10 pontos.
- Se art direction é genérica/corporativa (sem contexto industrial), deduzir 10 pontos.
- "needs_revision" = true se score < 80.

IMPORTANTE: Indique QUAIS agentes precisam revisar em "revision_targets":
- "copywriter" se texto/caption precisa melhorar.
- "designer" se art direction precisa melhorar.
- "hashtag" se hashtags são fracas ou genéricas.

Responda APENAS com JSON válido:
{
  "overall_score": 85,
  "visual_impact": 22,
  "hook": 23,
  "brand": 20,
  "engagement": 20,
  "feedback": "Feedback específico com sugestões",
  "copy_feedback": "Feedback para copywriter",
  "design_feedback": "Feedback para designer",
  "hashtag_feedback": "Feedback para hashtags",
  "revision_targets": [],
  "issues": ["issue 1"],
  "needs_revision": false
}`;

const STYLE_BRIEF_PROMPT = `Você é um diretor criativo analisando posts Instagram de alto desempenho para ${BRAND.name}.
Analise os posts bem-sucedidos e extraia um style brief reutilizável para Instagram.

Extraia:
1. **Visual dominante**: Que tipo de foto/imagem gera mais impacto? Close-up, bastidores, comparativo?
2. **Padrão de caption**: Tamanho ideal, uso de emojis, estrutura de gancho.
3. **Formato vencedor**: Carousel vs feed? Quantos slides?
4. **Hashtag patterns**: Quais categorias de hashtags performam melhor?
5. **CTA eficaz**: Que chamada gera mais saves/comments?

Responda APENAS com JSON válido:
{
  "dominant_visual": "Tipo de visual que mais engaja",
  "caption_pattern": "Estrutura de caption vencedora",
  "winning_format": "Formato que performa melhor",
  "hashtag_insight": "Insight sobre hashtags",
  "cta_structure": "CTA que converte",
  "key_insight": "Principal insight extraído"
}`;

const RANKER_PROMPT = `Você é um diretor de conteúdo Instagram sênior para ${BRAND.name}.
Recebeu múltiplas variações de um post Instagram. Ranqueie e escolha o melhor.

Critérios de ranking PARA INSTAGRAM:
1. **Scroll-stop power** — Qual variação para o scroll mais rápido?
2. **Coerência visual** — Qual tem a melhor narrativa visual?
3. **Alinhamento de marca** — Qual representa melhor a Lifetrek no Instagram?
4. **Potencial de save/share** — Qual conteúdo as pessoas vão salvar?

Responda APENAS com JSON válido:
{
  "ranking": [
    { "variation": 1, "score": 88, "reason": "Justificativa curta" }
  ],
  "winner": 1,
  "winner_reason": "Por que esta variação é a melhor para Instagram"
}`;

// ─── RAG Context Gathering ──────────────────────────────────────────────────

async function gatherRAGContext(topic: string, useResearch: boolean): Promise<{
  knowledgeContext: string;
  styleBrief: any | null;
  researchContext: string;
  rejectionContext: string;
}> {
  console.log("\n📚 [0/5] Gathering RAG context...");

  const [kbResults, embedding, research, rejections] = await Promise.all([
    searchKnowledgeBase(supabase, topic, 0.5, 3).catch(() => []),
    generateEmbedding(topic, 768).catch(() => null),
    useResearch ? deepResearch(topic, 15000, "instagram").catch(() => null) : Promise.resolve(null),
    supabase
      .from("instagram_posts")
      .select("topic, rejection_reason, slides, caption")
      .eq("status", "archived")
      .not("rejection_reason", "is", null)
      .order("rejected_at", { ascending: false })
      .limit(5)
      .then((r: any) => r.data || [])
      .catch(() => []),
  ]);

  // Knowledge base
  let knowledgeContext = "";
  if (kbResults.length > 0) {
    console.log(`   📖 Knowledge base: ${kbResults.length} matches`);
    knowledgeContext = kbResults.map((r: any) => r.content || r.text || "").join("\n\n");
  } else {
    console.log("   📖 Knowledge base: no matches");
  }

  // Style brief from similar successful posts
  let styleBrief: any = null;
  if (embedding) {
    const similarPosts = await searchSimilarInstagramPosts(supabase, embedding, 0.5, 3).catch(() => []);
    if (similarPosts.length > 0) {
      console.log(`   📸 Similar IG posts: ${similarPosts.length} found — generating style brief...`);
      const postSummaries = similarPosts.map((p: any) => {
        const slides = p.slides || [];
        const slideText = slides.length > 0
          ? slides.map((s: any) => `[${s.type}] ${s.headline}`).join(" → ")
          : "(single image)";
        return `Topic: "${p.topic}" (score: ${p.quality_score || "N/A"}, type: ${p.post_type})\nCaption: ${p.caption?.slice(0, 100)}...\n${slideText}`;
      }).join("\n\n");

      try {
        const briefRaw = await chat([
          { role: "system", content: STYLE_BRIEF_PROMPT },
          { role: "user", content: `Analise estes posts Instagram bem-sucedidos:\n\n${postSummaries}` },
        ]);
        styleBrief = parseJSON(briefRaw);
        console.log(`   📋 Style brief: "${styleBrief.key_insight?.slice(0, 60)}..."`);
      } catch {
        console.log("   📋 Style brief: could not generate, continuing without");
      }
    } else {
      console.log("   📸 Similar IG posts: none found");
    }
  }

  // Research
  let researchContext = "";
  if (research) {
    console.log(`   🔬 Research: received industry context`);
    researchContext = research;
  } else if (useResearch) {
    console.log("   🔬 Research: no results");
  }

  // Rejections
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

// ─── Agent Runners ──────────────────────────────────────────────────────────

async function runCopywriter(
  topic: string,
  strategy: any,
  feedback: string,
  styleBrief: any | null,
  rejectionContext: string,
  temperature: number,
): Promise<any> {
  const styleBriefBlock = styleBrief
    ? `\n\n=== STYLE BRIEF (de posts aprovados) ===
Padrão de caption: ${styleBrief.caption_pattern}
Formato vencedor: ${styleBrief.winning_format}
CTA eficaz: ${styleBrief.cta_structure}
Siga estes padrões.\n`
    : "";

  const rejectionBlock = rejectionContext
    ? `\n\n=== PADRÕES A EVITAR (rejeições anteriores) ===\n${rejectionContext}\nNÃO repita estes erros.\n`
    : "";

  const isRevision = feedback.length > 0;
  const context = `
Tópico: "${topic}"
Tipo de post: ${strategy.post_type}
Estratégia:
- Hook: ${strategy.hook}
- Arco Narrativo: ${strategy.narrative_arc}
- Estratégia Visual: ${strategy.visual_strategy}
- Mensagens-chave: ${strategy.key_messages?.join(", ")}
- Slides: ${strategy.slide_count}
${styleBriefBlock}${rejectionBlock}${isRevision ? `\n⚠️ REVISÃO NECESSÁRIA — Feedback:\n${feedback}\n` : ""}

Escreva o conteúdo do post Instagram.`;

  const raw = await chat([
    { role: "system", content: COPYWRITER_PROMPT },
    { role: "user", content: context },
  ], temperature);

  return parseJSON(raw);
}

async function runDesigner(
  topic: string,
  copy: any,
  feedback: string,
  styleBrief: any | null,
  temperature: number,
): Promise<any> {
  const styleBriefBlock = styleBrief
    ? `\n\nVisual dominante de referência: ${styleBrief.dominant_visual}\n`
    : "";

  const isRevision = feedback.length > 0;
  const context = `
Tópico: "${topic}"
Slides do post Instagram:
${copy.slides?.map((s: any, i: number) => `Slide ${i + 1} [${s.type}]: "${s.headline}" — ${s.body}`).join("\n")}
${styleBriefBlock}${isRevision ? `\n⚠️ REVISÃO NECESSÁRIA — Feedback:\n${feedback}\n` : ""}

Crie a direção de arte para cada slide (1080x1080px Instagram).`;

  const raw = await chat([
    { role: "system", content: DESIGNER_PROMPT },
    { role: "user", content: context },
  ], temperature);

  return parseJSON(raw);
}

async function runHashtagPro(
  topic: string,
  copy: any,
  feedback: string,
  temperature: number,
): Promise<any> {
  const isRevision = feedback.length > 0;
  const context = `
Tópico: "${topic}"
Caption: ${copy.caption?.slice(0, 300)}...
CTA: ${copy.cta_action}
${isRevision ? `\n⚠️ REVISÃO — Feedback:\n${feedback}\n` : ""}

Crie a estratégia de hashtags para este post.`;

  const raw = await chat([
    { role: "system", content: HASHTAG_PROMPT },
    { role: "user", content: context },
  ], temperature);

  return parseJSON(raw);
}

// ─── Single Variation Pipeline ──────────────────────────────────────────────

async function runVariation(
  variationIndex: number,
  topic: string,
  strategy: any,
  styleBrief: any | null,
  rejectionContext: string,
  temperature: number,
): Promise<{ copy: any; design: any; hashtags: any; review: any; revisions: number }> {
  let copy: any = null;
  let design: any = null;
  let hashtags: any = null;
  let review: any = null;
  let revision = 0;
  let previousScore = 0;
  let copyFeedback = "";
  let designFeedback = "";
  let hashtagFeedback = "";

  while (revision <= MAX_RETRIES) {
    const isRevision = revision > 0;

    // ── Copywriter ──
    const skipCopy = isRevision && review?.revision_targets?.length > 0
      && !review.revision_targets.includes("copywriter");

    if (!skipCopy) {
      const label = isRevision ? `revisando copy (round ${revision})` : "redigindo";
      console.log(`\n   ✍️  Copywriter ${label}...`);
      try {
        copy = await runCopywriter(topic, strategy, copyFeedback, styleBrief, rejectionContext, temperature);
        console.log(`      ${copy.slides?.length || 0} slides | CTA: ${copy.cta_action}`);
        copy.slides?.forEach((s: any, i: number) => {
          console.log(`      [${i + 1}] ${s.type.toUpperCase()}: "${s.headline}"`);
        });
      } catch (e) {
        console.error(`      Falha ao parsear copy:`, e);
        return { copy: null, design: null, hashtags: null, review: { overall_score: 0 }, revisions: revision };
      }
    } else {
      console.log(`\n   ✍️  Copywriter: copy OK, pulando...`);
    }

    // ── Designer + Hashtag Pro (run in parallel) ──
    const skipDesign = isRevision && review?.revision_targets?.length > 0
      && !review.revision_targets.includes("designer");
    const skipHashtag = isRevision && review?.revision_targets?.length > 0
      && !review.revision_targets.includes("hashtag");

    const parallelTasks: Promise<any>[] = [];
    const taskLabels: string[] = [];

    if (!skipDesign) {
      const label = isRevision ? `revisando design (round ${revision})` : "elaborando art direction";
      console.log(`\n   🎨 Designer ${label}...`);
      parallelTasks.push(
        runDesigner(topic, copy, designFeedback, styleBrief, temperature)
          .catch(() => ({ slides: [] }))
      );
      taskLabels.push("designer");
    }

    if (!skipHashtag) {
      const label = isRevision ? `revisando hashtags (round ${revision})` : "pesquisando hashtags";
      console.log(`   #️⃣  Hashtag Pro ${label}...`);
      parallelTasks.push(
        runHashtagPro(topic, copy, hashtagFeedback, temperature)
          .catch(() => ({ hashtags: [], hashtag_groups: {} }))
      );
      taskLabels.push("hashtag");
    }

    if (parallelTasks.length > 0) {
      const results = await Promise.all(parallelTasks);
      let idx = 0;
      if (taskLabels.includes("designer")) {
        design = results[idx++];
        console.log(`      Art direction para ${design?.slides?.length || 0} slides`);
      }
      if (taskLabels.includes("hashtag")) {
        hashtags = results[idx++];
        console.log(`      ${hashtags?.hashtags?.length || 0} hashtags selecionadas`);
      }
    }

    if (skipDesign) console.log(`\n   🎨 Designer: design OK, pulando...`);
    if (skipHashtag) console.log(`   #️⃣  Hashtag Pro: hashtags OK, pulando...`);

    // ── Analyst (Quality Gate) ──
    console.log(`\n   🔍 Analista avaliando qualidade...`);
    const reviewContext = `
Conteúdo do post Instagram para avaliação:

COPY:
${JSON.stringify(copy, null, 2)}

ART DIRECTION:
${JSON.stringify(design, null, 2)}

HASHTAGS:
${JSON.stringify(hashtags, null, 2)}

Avalie a qualidade total para Instagram.`;

    try {
      const reviewRaw = await chat([
        { role: "system", content: ANALYST_PROMPT },
        { role: "user", content: reviewContext },
      ]);
      review = parseJSON(reviewRaw);

      const emoji = review.overall_score >= 80 ? "✅" : "⚠️";
      console.log(`      ${emoji} Score: ${review.overall_score}/100`);
      console.log(`        Visual: ${review.visual_impact}/25 | Hook: ${review.hook}/25`);
      console.log(`        Marca: ${review.brand}/25 | Engajamento: ${review.engagement}/25`);
      if (review.feedback) console.log(`      📝 ${review.feedback}`);
      if (review.revision_targets?.length) console.log(`      Targets: ${review.revision_targets.join(", ")}`);
    } catch {
      console.log("      Não foi possível parsear review, assumindo aprovado.");
      review = { overall_score: 80, needs_revision: false, revision_targets: [] };
    }

    // Quality gate
    if (!review.needs_revision || review.overall_score >= 80) {
      console.log(`\n   ✅ Conteúdo APROVADO (${review.overall_score}/100)`);
      break;
    }

    // Diminishing returns
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
    hashtagFeedback = review.hashtag_feedback || "";
    revision++;
  }

  return { copy, design, hashtags, review, revisions: revision };
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

async function runPipeline(
  topic: string,
  postType: PostType,
  dryRun: boolean,
  useResearch: boolean,
  numVariations: number,
) {
  console.log(`\n📸 Lifetrek Instagram Pipeline — "${topic}"\n${"─".repeat(60)}`);
  console.log(`   📐 Post type: ${postType}`);
  if (numVariations > 1) console.log(`   🎲 Generating ${numVariations} variations`);
  if (useResearch) console.log(`   🔬 Deep research enabled`);
  const pipelineStart = Date.now();

  // ════════════════════════════════════════════════════════════════════════
  // 0. RAG CONTEXT
  // ════════════════════════════════════════════════════════════════════════
  const { knowledgeContext, styleBrief, researchContext, rejectionContext } = await gatherRAGContext(topic, useResearch);

  // ════════════════════════════════════════════════════════════════════════
  // 1. ESTRATEGISTA
  // ════════════════════════════════════════════════════════════════════════
  console.log("\n🎯 [1/5] Estrategista analisando...");

  let strategistContext = `Crie estratégia para o tópico: "${topic}"\nTipo de post solicitado: ${postType}`;
  if (knowledgeContext) strategistContext += `\n\n=== CONTEXTO DA BASE DE CONHECIMENTO ===\n${knowledgeContext}`;
  if (researchContext) strategistContext += `\n\n=== PESQUISA DE MERCADO ===\n${researchContext}`;
  if (rejectionContext) strategistContext += `\n\n=== ÂNGULOS REJEITADOS (EVITAR) ===\n${rejectionContext}`;

  const strategyRaw = await chat([
    { role: "system", content: STRATEGIST_PROMPT },
    { role: "user", content: strategistContext },
  ]);

  let strategy: any;
  try {
    strategy = parseJSON(strategyRaw);
    console.log(`   ✅ Hook: "${strategy.hook}"`);
    console.log(`   📐 Tipo: ${strategy.post_type} | Slides: ${strategy.slide_count}`);
    console.log(`   🎬 Visual: ${strategy.visual_strategy}`);
    console.log(`   💡 Mensagens: ${strategy.key_messages?.join(" | ")}`);
  } catch {
    console.error("   ❌ Falha ao parsear estratégia:", strategyRaw.slice(0, 200));
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2-4. VARIATIONS (Copywriter + Designer + Hashtag + Analyst)
  // ════════════════════════════════════════════════════════════════════════
  const variations: { copy: any; design: any; hashtags: any; review: any; revisions: number }[] = [];
  const temperatures = [0.7, 0.8, 0.9, 0.85, 0.95];

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
      return `--- Variação ${i + 1} (Score: ${v.review?.overall_score || "N/A"}) ---\nCaption: ${v.copy.caption?.slice(0, 150)}...\nSlides:\n  ${slides}\nHashtags: ${v.hashtags?.hashtags?.slice(0, 5).join(" ")}...`;
    }).join("\n\n");

    try {
      const rankRaw = await chat([
        { role: "system", content: RANKER_PROMPT },
        { role: "user", content: `Ranqueie estas variações de post Instagram:\n\n${variationSummaries}` },
      ]);
      const rankResult = parseJSON(rankRaw);
      winnerIndex = (rankResult.winner || 1) - 1;
      console.log(`   🏆 Vencedor: Variação ${winnerIndex + 1} — ${rankResult.winner_reason}`);
      rankResult.ranking?.forEach((r: any) => {
        const medal = r.variation === rankResult.winner ? "👑" : "  ";
        console.log(`   ${medal} #${r.variation}: ${r.score}/100 — ${r.reason}`);
      });
    } catch {
      winnerIndex = variations.reduce((best, v, i) =>
        (v.review?.overall_score || 0) > (variations[best].review?.overall_score || 0) ? i : best, 0);
      console.log(`   Ranker falhou. Vencedor por score: Variação ${winnerIndex + 1}`);
    }
  }

  const winner = variations[winnerIndex];
  const { copy, design, hashtags, review } = winner;

  // ════════════════════════════════════════════════════════════════════════
  // MERGE: Combine copy + design into final slides
  // ════════════════════════════════════════════════════════════════════════
  const finalSlides = copy.slides?.map((slide: any, i: number) => {
    const artDir = design?.slides?.find((d: any) => d.slide_number === i + 1) || {};
    return {
      ...slide,
      art_direction: {
        visual_concept: artDir.visual_concept || "",
        composition: artDir.composition || "",
        mood: artDir.mood || "",
        color_emphasis: artDir.color_emphasis || "",
        background_elements: artDir.background_elements || "",
        text_placement: artDir.text_placement || "",
      },
    };
  }) || [];

  // ════════════════════════════════════════════════════════════════════════
  // OUTPUT
  // ════════════════════════════════════════════════════════════════════════
  const elapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);
  console.log(`\n${"═".repeat(60)}`);
  console.log(`📸 RESULTADO FINAL  (${elapsed}s, ${winner.revisions} revisões${numVariations > 1 ? `, ${variations.length} variações` : ""})`);
  console.log(`${"═".repeat(60)}`);
  console.log(`\n📐 Tipo: ${strategy.post_type}`);
  console.log(`\n📝 Caption:\n${copy.caption}\n`);
  console.log(`#️⃣  Hashtags (${hashtags?.hashtags?.length || 0}):`);
  console.log(`${hashtags?.hashtags?.join(" ") || "(nenhuma)"}\n`);

  if (finalSlides.length > 0) {
    console.log("📑 Slides:");
    finalSlides.forEach((s: any, i: number) => {
      console.log(`\n  ── Slide ${i + 1} [${s.type.toUpperCase()}] ──`);
      console.log(`  Headline: ${s.headline}`);
      console.log(`  Body: ${s.body}`);
      if (s.art_direction?.visual_concept) {
        console.log(`  🎨 Visual: ${s.art_direction.visual_concept}`);
        console.log(`     Mood: ${s.art_direction.mood}`);
        console.log(`     Texto: ${s.art_direction.text_placement}`);
      }
    });
  }

  if (dryRun) {
    console.log(`\n🏁 Dry run — não salvou no Supabase.`);
    return { topic, slides: finalSlides, caption: copy.caption, hashtags: hashtags?.hashtags, review };
  }

  // ════════════════════════════════════════════════════════════════════════
  // SAVE TO SUPABASE
  // ════════════════════════════════════════════════════════════════════════
  console.log(`\n💾 Salvando no Supabase...`);

  const generationMetadata: any = {
    pipeline_version: "2.0-design-agency-instagram",
    rag_used: !!knowledgeContext || !!styleBrief || !!researchContext,
    style_brief: styleBrief,
    research_used: !!researchContext,
    rejections_fed: rejectionContext.length > 0,
    critique_rounds: winner.revisions,
    max_retries: MAX_RETRIES,
    hashtag_groups: hashtags?.hashtag_groups || {},
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

  const { data: post, error: insertError } = await supabase
    .from("instagram_posts")
    .insert({
      topic,
      caption: copy.caption,
      hashtags: hashtags?.hashtags || [],
      post_type: strategy.post_type || postType,
      target_audience: BRAND.audience,
      pain_point: strategy.key_messages?.[0] || null,
      desired_outcome: strategy.target_emotion || null,
      slides: finalSlides.length > 0 ? finalSlides : null,
      status: "draft",
      quality_score: review?.overall_score || null,
      generation_metadata: generationMetadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !post) {
    console.error("   ❌ Erro ao salvar:", insertError?.message);
    return null;
  }

  console.log(`   ✅ Post salvo: ${post.id}`);

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
        carousel_id: post.id,
        table_name: "instagram_posts",
        mode: "hybrid",
      }),
    });

    const imageResult = await imageResponse.json();

    if (imageResult.success) {
      console.log(`   ✅ ${imageResult.images_generated} imagens geradas em ${imageResult.duration_ms}ms`);
    } else {
      console.error(`   ⚠️  Geração parcial: ${imageResult.error || "erro desconhecido"}`);
    }
  } catch (e) {
    console.error(`   ⚠️  Falha ao chamar Edge Function: ${e}`);
    console.log(`   💡 Gere manualmente:`);
    console.log(`      curl -X POST '${functionUrl}' \\`);
    console.log(`        -H 'Authorization: Bearer <KEY>' \\`);
    console.log(`        -d '{"carousel_id":"${post.id}","table_name":"instagram_posts","mode":"hybrid"}'`);
  }

  const totalElapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);
  console.log(`\n🏁 Pipeline completo em ${totalElapsed}s`);
  console.log(`   Post ID: ${post.id}`);

  return { postId: post.id, topic, slides: finalSlides, caption: copy.caption, hashtags: hashtags?.hashtags, review };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = Deno.args;
const topic = args.filter((a: string) => !a.startsWith("--"))[0] || "Capacidades de Manufatura CNC para Dispositivos Médicos";
const dryRun = args.includes("--dry-run");
const useResearch = args.includes("--research");
const postType = (args.find((a: string) => a.startsWith("--type="))?.split("=")[1] || "carousel") as PostType;
const numVariations = parseInt(
  args.find((a: string) => a.startsWith("--variations="))?.split("=")[1] || "1"
);

await runPipeline(topic, postType, dryRun, useResearch, numVariations);

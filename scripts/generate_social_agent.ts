/**
 * Multi-Agent Creative Pipeline for Lifetrek Medical
 * 
 * 4-agent roundtable that crafts carousel content before image generation:
 *   🎯 Estrategista  → Strategy, narrative arc, audience targeting
 *   ✍️  Copywriter    → Headlines, body, CTA (PT-BR)
 *   🎨 Designer      → Art direction per slide (visual concept, composition, mood)
 *   🔍 Analista      → Quality gate (score ≥ 80 or revise)
 * 
 * After approval, saves to Supabase and triggers Edge Function for image gen.
 * 
 * Usage:
 *   deno run --allow-all scripts/generate_social_agent.ts "Precisão CNC em Implantes"
 *   deno run --allow-all scripts/generate_social_agent.ts "Precisão CNC" --dry-run
 */

import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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
const MAX_RETRIES = 1; // max revision rounds if quality < 80

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
async function chat(messages: any[], model = MODEL): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": SITE_URL,
      "X-Title": "Lifetrek Creative Agent",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJSON(raw: string): any {
  // Strip markdown code fences
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

Responda APENAS com JSON válido:
{
  "overall_score": 85,
  "clarity": 22,
  "narrative": 23,
  "brand": 20,
  "visual": 20,
  "feedback": "Feedback específico com sugestões de melhoria",
  "issues": ["issue 1", "issue 2"],
  "needs_revision": false
}`;

// ─── Main Pipeline ──────────────────────────────────────────────────────────

async function runPipeline(topic: string, dryRun: boolean = false) {
  console.log(`\n🚀 Lifetrek Creative Pipeline — "${topic}"\n${"─".repeat(60)}`);
  const pipelineStart = Date.now();

  // ════════════════════════════════════════════════════════════════════════
  // 1. ESTRATEGISTA
  // ════════════════════════════════════════════════════════════════════════
  console.log("\n🎯 [1/4] Estrategista analisando...");
  const strategyRaw = await chat([
    { role: "system", content: STRATEGIST_PROMPT },
    { role: "user", content: `Crie estratégia para o tópico: "${topic}"` },
  ]);

  let strategy: any;
  try {
    strategy = parseJSON(strategyRaw);
    console.log(`   ✅ Hook: "${strategy.hook}"`);
    console.log(`   📊 Slides: ${strategy.slide_count} | Emoção: ${strategy.target_emotion}`);
    console.log(`   💡 Mensagens: ${strategy.key_messages?.join(" | ")}`);
  } catch (e) {
    console.error("   ❌ Falha ao parsear estratégia:", strategyRaw.slice(0, 200));
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2. COPYWRITER (with retry loop)
  // ════════════════════════════════════════════════════════════════════════
  let copy: any = null;
  let design: any = null;
  let review: any = null;
  let revision = 0;
  let analystFeedback = "";

  while (revision <= MAX_RETRIES) {
    const isRevision = revision > 0;
    console.log(`\n✍️  [2/4] Copywriter ${isRevision ? `revisando (round ${revision})...` : "redigindo..."}`);

    const copyContext = `
Tópico: "${topic}"
Estratégia:
- Hook: ${strategy.hook}
- Arco Narrativo: ${strategy.narrative_arc}
- Mensagens-chave: ${strategy.key_messages?.join(", ")}
- Slides: ${strategy.slide_count}
${isRevision ? `\n⚠️ REVISÃO NECESSÁRIA — Feedback do Analista:\n${analystFeedback}\n\nCorreija os problemas apontados e melhore o conteúdo.` : ""}

Escreva o copy do carrossel.`;

    const copyRaw = await chat([
      { role: "system", content: COPYWRITER_PROMPT },
      { role: "user", content: copyContext },
    ]);

    try {
      copy = parseJSON(copyRaw);
      console.log(`   ✅ ${copy.slides?.length || 0} slides redigidos`);
      copy.slides?.forEach((s: any, i: number) => {
        console.log(`   [${i + 1}] ${s.type.toUpperCase()}: "${s.headline}"`);
      });
    } catch (e) {
      console.error("   ❌ Falha ao parsear copy:", copyRaw.slice(0, 200));
      return null;
    }

    // ════════════════════════════════════════════════════════════════════════
    // 3. DESIGNER
    // ════════════════════════════════════════════════════════════════════════
    console.log(`\n🎨 [3/4] Designer elaborando art direction...`);

    const designContext = `
Tópico: "${topic}"
Slides do carrossel:
${copy.slides?.map((s: any, i: number) => `Slide ${i + 1} [${s.type}]: "${s.headline}" — ${s.body}`).join("\n")}

Crie a direção de arte para cada slide.`;

    const designRaw = await chat([
      { role: "system", content: DESIGNER_PROMPT },
      { role: "user", content: designContext },
    ]);

    try {
      design = parseJSON(designRaw);
      console.log(`   ✅ Art direction para ${design.slides?.length || 0} slides`);
      design.slides?.forEach((s: any) => {
        console.log(`   [${s.slide_number}] 🖼  ${s.visual_concept?.slice(0, 60)}...`);
      });
    } catch (e) {
      console.error("   ❌ Falha ao parsear design:", designRaw.slice(0, 200));
      // Designer failure is non-blocking — continue without art direction
      design = { slides: [] };
    }

    // ════════════════════════════════════════════════════════════════════════
    // 4. ANALISTA (Quality Gate)
    // ════════════════════════════════════════════════════════════════════════
    console.log(`\n🔍 [4/4] Analista avaliando qualidade...`);

    const reviewContext = `
Conteúdo do carrossel para avaliação:

COPY:
${JSON.stringify(copy, null, 2)}

ART DIRECTION:
${JSON.stringify(design, null, 2)}

Avalie a qualidade total.`;

    const reviewRaw = await chat([
      { role: "system", content: ANALYST_PROMPT },
      { role: "user", content: reviewContext },
    ]);

    try {
      review = parseJSON(reviewRaw);
      const emoji = review.overall_score >= 80 ? "✅" : "⚠️";
      console.log(`   ${emoji} Score: ${review.overall_score}/100`);
      console.log(`     Clareza: ${review.clarity}/25 | Narrativa: ${review.narrative}/25`);
      console.log(`     Marca: ${review.brand}/25 | Visual: ${review.visual}/25`);
      if (review.feedback) console.log(`   📝 ${review.feedback}`);
      if (review.issues?.length) console.log(`   ⚠️  Issues: ${review.issues.join("; ")}`);
    } catch (e) {
      console.log("   ⚠️  Não foi possível parsear review, assumindo aprovado.");
      review = { overall_score: 80, needs_revision: false, feedback: "" };
    }

    // Check quality gate
    if (!review.needs_revision || review.overall_score >= 80) {
      console.log(`\n   ✅ Conteúdo APROVADO (${review.overall_score}/100)`);
      break;
    }

    if (revision >= MAX_RETRIES) {
      console.log(`\n   ⚠️  Score ${review.overall_score}/100 após ${MAX_RETRIES} revisões. Prosseguindo mesmo assim.`);
      break;
    }

    console.log(`\n   🔄 Score ${review.overall_score}/100 — Enviando para revisão...`);
    analystFeedback = `${review.feedback}\nIssues: ${review.issues?.join(", ") || "none"}`;
    revision++;
  }

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
  console.log(`📋 RESULTADO FINAL  (${elapsed}s, ${revision} revisões)`);
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

  const { data: carousel, error: insertError } = await supabase
    .from("linkedin_carousels")
    .insert({
      topic,
      caption: copy.caption,
      slides: finalSlides,
      status: "draft",
      quality_score: review?.overall_score || null,
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

await runPipeline(topic, dryRun);

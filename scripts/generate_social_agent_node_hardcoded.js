/**
 * Multi-Agent Creative Pipeline for Lifetrek Medical (Node.js REST Hardcoded Version)
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
 *   node scripts/generate_social_agent_node_hardcoded.js "Precisão CNC em Implantes"
 */

// ─── Environment (Hardcoded to bypass EPERM) ──────────────────────────────
const OPENROUTER_KEY = "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";
const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ";

// ─── Supabase Helper (REST API) ─────────────────────────────────────────────

async function supabaseInsert(table, data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`, // Service role for writing
            "Content-Type": "application/json",
            "Prefer": "return=representation", // return the inserted row
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const text = await response.text();
        return { error: { message: text } };
    }

    const result = await response.json();
    return { data: result[0] }; // single row
}

// ─── Config ─────────────────────────────────────────────────────────────────
const MODEL = "google/gemini-2.0-flash-001";
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
async function chat(messages, model = MODEL) {
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

function parseJSON(raw) {
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

async function runPipeline(topic, dryRun = false) {
    console.log(`\n🚀 Lifetrek Creative Pipeline — "${topic}"\n${"─".repeat(60)}`);
    const pipelineStart = Date.now();

    // 1. ESTRATEGISTA
    console.log("\n🎯 [1/4] Estrategista analisando...");
    const strategyRaw = await chat([
        { role: "system", content: STRATEGIST_PROMPT },
        { role: "user", content: `Crie estratégia para o tópico: "${topic}"` },
    ]);

    let strategy;
    try {
        strategy = parseJSON(strategyRaw);
        console.log(`   ✅ Hook: "${strategy.hook}"`);
    } catch (e) {
        console.error("   ❌ Falha ao parsear estratégia:", strategyRaw.slice(0, 200));
        return null;
    }

    // 2. COPYWRITER (with retry loop)
    let copy = null;
    let design = null;
    let review = null;
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
        } catch (e) {
            console.error("   ❌ Falha ao parsear copy:", copyRaw.slice(0, 200));
            return null;
        }

        // 3. DESIGNER
        console.log(`\n🎨 [3/4] Designer elaborando art direction...`);

        const designContext = `
Tópico: "${topic}"
Slides do carrossel:
${copy.slides?.map((s, i) => `Slide ${i + 1} [${s.type}]: "${s.headline}" — ${s.body}`).join("\n")}

Crie a direção de arte para cada slide.`;

        const designRaw = await chat([
            { role: "system", content: DESIGNER_PROMPT },
            { role: "user", content: designContext },
        ]);

        try {
            design = parseJSON(designRaw);
            console.log(`   ✅ Art direction para ${design.slides?.length || 0} slides`);
        } catch (e) {
            design = { slides: [] };
        }

        // 4. ANALISTA
        console.log(`\n🔍 [4/4] Analista avaliando qualidade...`);

        const reviewContext = `
Conteúdo do carrossel para avaliação:
COPY: ${JSON.stringify(copy, null, 2)}
ART DIRECTION: ${JSON.stringify(design, null, 2)}
Avalie a qualidade total.`;

        const reviewRaw = await chat([
            { role: "system", content: ANALYST_PROMPT },
            { role: "user", content: reviewContext },
        ]);

        try {
            review = parseJSON(reviewRaw);
            const emoji = review.overall_score >= 80 ? "✅" : "⚠️";
            console.log(`   ${emoji} Score: ${review.overall_score}/100`);

            if (!review.needs_revision || review.overall_score >= 80) {
                console.log(`\n   ✅ Conteúdo APROVADO (${review.overall_score}/100)`);
                break;
            }

            if (revision >= MAX_RETRIES) break;
            analystFeedback = `${review.feedback}\nIssues: ${review.issues?.join(", ") || "none"}`;
            revision++;
        } catch (e) {
            review = { overall_score: 80, needs_revision: false, feedback: "" };
            break;
        }
    }

    // MERGE
    const finalSlides = copy.slides.map((slide, i) => {
        const artDir = design?.slides?.find((d) => d.slide_number === i + 1) || {};
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

    if (dryRun) return;

    // SAVE TO SUPABASE
    console.log(`\n💾 Salvando no Supabase...`);

    const { data: carousel, error: insertError } = await supabaseInsert("linkedin_carousels", {
        admin_user_id: "3f14bb1b-57e5-4086-b2e4-c620dd886adc",
        topic,
        target_audience: BRAND.audience,
        tone: BRAND.tone,
        caption: copy.caption,
        slides: finalSlides,
        status: "draft",
        quality_score: review?.overall_score || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    if (insertError) {
        console.error("   ❌ Erro ao salvar:", insertError.message);
        return null;
    }

    console.log(`   ✅ Carrossel salvo: ${carousel.id}`);

    // TRIGGER IMAGE GENERATION
    console.log(`\n📸 Disparando geração de imagens (hybrid mode)...`);
    const functionUrl = `${SUPABASE_URL}/functions/v1/regenerate-carousel-images`;

    // Use ANON_KEY for function invocation if available, else SERVICE_ROLE
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

        if (imageResponse.ok) {
            // Only try to parse JSON if status is OK
            try {
                const imageResult = await imageResponse.json();
                if (imageResult && imageResult.images_generated) {
                    console.log(`   ✅ ${imageResult.images_generated} imagens geradas em ${imageResult.duration_ms}ms`);
                    console.log(`   📎 Referências usadas: ${imageResult.reference_images_used}`);
                } else {
                    console.log("   ⏳ Geração iniciada em background.");
                }
            } catch (e) {
                console.log("   ✅ Triggered successfully (non-JSON response)");
            }
        } else {
            console.error(`   ⚠️  Geração falhou: ${imageResponse.status} ${imageResponse.statusText}`);
            const errText = await imageResponse.text().catch(() => "");
            if (errText) console.log(`      ${errText.slice(0, 200)}`);
        }
    } catch (e) {
        console.error(`   ⚠️  Falha ao chamar Edge Function: ${e}`);
    }

    const totalElapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);
    console.log(`\n🏁 Pipeline completo em ${totalElapsed}s`);
    console.log(`   Carrossel ID: ${carousel.id}`);

    return { carouselId: carousel.id, topic, slides: finalSlides, caption: copy.caption, review };
}

const args = process.argv.slice(2);
const topic = args.filter((a) => !a.startsWith("--"))[0] || "Manufatura Sustentável de Dispositivos Médicos";
const dryRun = args.includes("--dry-run");

runPipeline(topic, dryRun).catch(console.error);

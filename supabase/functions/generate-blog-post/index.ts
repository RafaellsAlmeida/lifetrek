import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- CONSTANTS ---
const COMPANY_CONTEXT = `
# Lifetrek Medical - Company Context
**Mission**: "To lead in the manufacture of high-performance products... with an absolute commitment to life."
**Tone**: Technical, Ethical, Confident, Partnership-Oriented.
**Key Themes**: Risk Reduction, Precision (Micron-level), Process Reliability, Speed, Compliance (ANVISA/ISO 13485 when relevant).

## Infrastructure
- **CNC**: Citizen M32/L20 (Swiss-Type), Doosan Lynx 2100.
- **Metrology**: ZEISS Contura (3D CMM), Optical Comparator.
- **Finishing**: In-house Electropolishing, Laser Marking, ISO Class 7 Cleanrooms.

## Value Proposition
1. **Dream Outcome**: Eliminate import dependency. Audit-ready supply chain.
2. **Proof**: ISO 13485, ANVISA, supplier to leading medical OEMs.
3. **Speed**: 30 days local production vs 90 days import.
4. **Effort**: Single-source (Machining + Finishing + Metrology).
`;

// Helper: Timeout wrapper for promises
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

// Helper: Safe AI call with retry (OpenRouter)
async function callAI(apiKey: string, body: object, timeoutMs = 25000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://lifetrek.app",
        "X-Title": "Lifetrek App",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API error ${response.status}:`, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function createOpenRouterEmbedding(
  apiKey: string,
  input: string,
  model: string,
  timeoutMs = 20000
): Promise<number[] | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://lifetrek.app",
        "X-Title": "Lifetrek App",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Embedding API error ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;
    if (Array.isArray(embedding)) return embedding;

    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Embedding API error:", error);
    return null;
  }
}

function formatRagMatches(matches: any[], maxChars = 600): string {
  if (!matches?.length) return "";

  const lines = matches.map((match, index) => {
    const metadata = match.metadata || {};
    const title = metadata.title || metadata.source || match.key || `Match ${index + 1}`;
    const content = metadata.content || metadata.text || "";
    const snippet = typeof content === "string" ? content.slice(0, maxChars) : "";
    return `${index + 1}. ${title}${snippet ? ` — ${snippet}` : ""}`;
  });

  return `**RAG Context (Vector Bucket)**\n${lines.join("\n")}`;
}

function normalizeUrlList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const deduped = new Set<string>();

  for (const item of input) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed.startsWith("http")) continue;
    deduped.add(trimmed);
  }

  return Array.from(deduped);
}

function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s"')\]]+/g) || [];
  return normalizeUrlList(matches);
}

function sanitizeForbiddenClientMentions(text: string): string {
  if (!text) return text;
  return text
    .replace(/amorim\s*stout\s*consulting\s*\(asc\)/gi, "Lifetrek Medical")
    .replace(/amorim\s*stout\s*consulting/gi, "Lifetrek Medical")
    .replace(/\bmetodologia\s*4p\s*da\s*asc\b/gi, "modelo técnico de execução da Lifetrek Medical")
    .replace(/\bmetodologia\s*4p\b/gi, "modelo técnico de execução da Lifetrek Medical")
    .replace(/\bframework\s*4p\b/gi, "modelo técnico de execução")
    .replace(/\bna\s+asc\b/gi, "na Lifetrek Medical")
    .replace(/\bda\s+asc\b/gi, "da Lifetrek Medical")
    .replace(/\ba\s+asc\b/gi, "a Lifetrek Medical")
    .replace(/\bASC\b/g, "Lifetrek Medical")
    .replace(/\bCRM\b/g, "sistema interno de gestão")
    .replace(/\bintelig[eê]ncia\s*artificial\b/gi, "engenharia de processo")
    .replace(/\bAI\b/g, "engenharia de processo")
    .replace(/\bIA\b/g, "engenharia de processo");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { generateNews, topic, category, research_context, skipImage, keywords: requestedKeywords, job_id: jobIdFromReq } = body;
    const OPEN_ROUTER_API = Deno.env.get("OPEN_ROUTER_API");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const VECTOR_BUCKET_NAME = Deno.env.get("VECTOR_BUCKET_NAME");
    const VECTOR_INDEX_NAME = Deno.env.get("VECTOR_INDEX_NAME");
    const VECTOR_BUCKET_ENABLED = Deno.env.get("VECTOR_BUCKET_ENABLED") === "true";
    const EMBEDDING_MODEL = Deno.env.get("OPEN_ROUTER_EMBEDDING_MODEL") || "openai/text-embedding-3-small";

    if (!OPEN_ROUTER_API) {
      throw new Error("OPEN_ROUTER_API is not configured");
    }

    let contextToUse = research_context || "";
    let ragMetrics: Record<string, number | string | boolean> = {};
    let researchSources: string[] = [];

    // 1. DEEP RESEARCH PHASE (Perplexity sonar-pro for comprehensive research)
    if (PERPLEXITY_API_KEY && !contextToUse) {
      console.log("🔍 [Phase 1] Deep Research with Perplexity sonar-pro...");
      const researchStart = Date.now();

      try {
        const deepResearchPrompt = `Você é um pesquisador especialista em dispositivos médicos e manufatura de precisão no Brasil.

TÓPICO: ${topic || "Fabricação de Dispositivos Médicos no Brasil"}
CATEGORIA: ${category || "Geral"}

Realize uma pesquisa aprofundada incluindo:

1. **Contexto Regulatório**: 
   - Últimas atualizações da ANVISA (RDCs, INs, consultas públicas)
   - Mudanças em certificações ISO 13485, ISO 14971
   - Requisitos para registro de dispositivos médicos classe II/III/IV

2. **Tendências de Mercado**:
   - Movimentos de mercado em implantes ortopédicos/dentários no Brasil
   - Investimentos em manufatura nacional vs importação
   - Dados de mercado recentes (valor, crescimento, players)

3. **Inovações Técnicas**:
   - Avanços em usinagem CNC para implantes
   - Novas tecnologias de acabamento superficial
   - Tendências em materiais (titânio, PEEK, ligas de cobalto-cromo)

4. **Casos Relevantes**:
   - Notícias recentes do setor no Brasil
   - Lançamentos de produtos ou certificações
   - Desafios e oportunidades identificados

Forneça informações factuais com fontes quando possível. Resposta em Português do Brasil, máximo 1000 palavras.

IMPORTANTE:
- Não force foco regulatório em todos os temas.
- Se o tópico não for regulatório, priorize manufatura, qualidade, engenharia de processo, metrologia e performance operacional.
- Nunca inclua nomes de outros clientes/consultorias.`;

        const researchPromise = fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar-pro", // Using sonar-pro for deeper research
            messages: [
              { role: "system", content: "Você é um pesquisador sênior especializado em dispositivos médicos, regulamentação ANVISA e manufatura de precisão. Forneça informações atualizadas, precisas e com fontes." },
              { role: "user", content: deepResearchPrompt }
            ],
            search_recency_filter: "month", // Focus on recent content
          }),
        }).then(r => r.json());

        const pData = await withTimeout(researchPromise, 20000, { choices: [], citations: [] });
        contextToUse = pData.choices?.[0]?.message?.content || "";

        // Store citations for reference (not shown to users)
        const citations = normalizeUrlList(pData.citations || []);
        researchSources = citations;
        if (citations.length > 0) {
          console.log(`📚 Research sources: ${citations.slice(0, 5).join(", ")}`);
        }

        console.log(`✅ [Phase 1] Deep Research complete in ${Date.now() - researchStart}ms (${contextToUse.length} chars)`);
      } catch (e) {
        console.error("⚠️ Perplexity deep research failed, continuing without research", e);
      }
    }

    if (researchSources.length === 0) {
      researchSources = extractUrlsFromText(contextToUse);
    }

    // 1.5 VECTOR BUCKET RAG (Prototype)
    if (VECTOR_BUCKET_ENABLED && VECTOR_BUCKET_NAME && VECTOR_INDEX_NAME) {
      const ragStart = performance.now();
      try {
        const queryText = [topic, category].filter(Boolean).join(" - ").trim();
        if (queryText) {
          const embeddingStart = performance.now();
          const queryEmbedding = await createOpenRouterEmbedding(
            OPEN_ROUTER_API,
            queryText,
            EMBEDDING_MODEL
          );
          ragMetrics.embedding_ms = Math.round(performance.now() - embeddingStart);

          if (queryEmbedding) {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const vectorStart = performance.now();
            const { data: vectorData, error: vectorError } =
              await supabase.storage.vectors
                .from(VECTOR_BUCKET_NAME)
                .index(VECTOR_INDEX_NAME)
                .queryVectors({
                  queryVector: { float32: queryEmbedding },
                  topK: 5,
                  returnDistance: true,
                  returnMetadata: true,
                });

            ragMetrics.vector_bucket_ms = Math.round(performance.now() - vectorStart);

            if (vectorError) {
              console.warn("⚠️ Vector bucket query failed:", vectorError);
            } else if (vectorData?.vectors?.length) {
              const ragContext = formatRagMatches(vectorData.vectors, 700);
              if (ragContext) {
                contextToUse = [contextToUse, ragContext].filter(Boolean).join("\n\n");
              }
              ragMetrics.vector_bucket_hits = vectorData.vectors.length;
            }
          }
        }
      } catch (e) {
        console.warn("⚠️ Vector bucket RAG failed:", e);
      } finally {
        ragMetrics.vector_bucket_total_ms = Math.round(performance.now() - ragStart);
      }
    }

    // 2. STRATEGIST AGENT (Fast model)
    console.log("🧠 [Phase 2] Strategist is working...");
    const stratStart = Date.now();

    const stratSystemPrompt = `You are the Content Strategist for Lifetrek Medical.
    Plan a high-impact blog post that positions Lifetrek as a Technical Authority.
    
    INPUT: Topic: "${topic}", Category: "${category}".
    CONTEXT: ${contextToUse.slice(0, 800)}
    
    OUTPUT JSON:
    {
      "target_persona": "Specific role (e.g. Quality Manager at Ortho OEM)",
      "angle": "The unique technical perspective",
      "visual_concept": "Description for header image (clean, medical, no text)",
      "outline": [
        { "tag": "h2", "title": "Section Title", "key_points": "What to cover" }
      ]
    }`;

    const stratData = await callAI(OPEN_ROUTER_API, {
      model: "google/gemini-2.0-flash-001", // Fast, reliable OpenRouter model
      messages: [
        { role: "system", content: stratSystemPrompt },
        { role: "user", content: "Create the strategy. Be concise." }
      ],
      response_format: { type: "json_object" },
    }, 15000);

    let strategy;
    try {
      strategy = JSON.parse(stratData.choices[0].message.content);
    } catch {
      strategy = {
        target_persona: "Quality Manager at Medical Device OEM",
        angle: "Technical deep-dive on precision manufacturing",
        visual_concept: "Clean medical manufacturing environment",
        outline: [
          { tag: "h2", title: "Introdução", key_points: "Context and importance" },
          { tag: "h2", title: "Desenvolvimento", key_points: "Technical details" },
          { tag: "h2", title: "Conclusão", key_points: "Key takeaways" }
        ]
      };
    }
    console.log(`✅ [Phase 2] Strategy complete in ${Date.now() - stratStart}ms`);

    // 3. COPYWRITER AGENT (Main content - PRIORITY)
    // Moved BEFORE image generation to ensure content is always generated
    console.log("✍️ [Phase 3] Copywriter is working...");
    const writeStart = Date.now();
    const sourceContext = researchSources.length > 0
      ? researchSources.map((url, idx) => `${idx + 1}. ${url}`).join("\n")
      : "No external URLs available. Use only verifiable, non-numeric claims if no source is available.";

    const writerSystemPrompt = `You are a Senior Manufacturing Engineer writing for Lifetrek Medical.
    
    BASICS:
    - Tone: Expert, Technical, Educational (Not Salesy).
    - Format: Semantic HTML (No <html> or <body> tags, just content).
    - Language: Portuguese (Brazil).
    
    COMPANY DATA:
    ${COMPANY_CONTEXT}
    
    STRATEGY:
    - Persona: ${strategy.target_persona}
    - Angle: ${strategy.angle}
    - Outline: ${JSON.stringify(strategy.outline)}
    - Available external sources:
${sourceContext}
    
    INSTRUCTIONS:
    - Write a technical article (800-1200 words).
    - Keep structure natural: prefer 3-5 meaningful headings total for the whole article.
    - Avoid heading-heavy formatting ("one heading every few lines").
    - Prioritize connected paragraphs with clear transitions and practical narrative flow.
    - Use a warmer, partnership-oriented voice while staying technical and objective.
    - Use specific machine names (Citizen L20, Zeiss CMM).
    - Mention ANVISA/RDC only when the topic is directly about regulation/compliance.
    - For non-regulatory topics, focus on process, metrology, quality, manufacturing performance, and supply chain risk reduction.
    - Goal: Make reader learn something valuable about manufacturing.
    - NEVER mention other clients, consulting firms, competitors, or external brand names not explicitly provided as approved references.
    - Avoid terms unrelated to Lifetrek offering such as generic CRM/AI playbooks when not core to manufacturing execution.
    - Forbidden terms: "Amorim Stout Consulting", "ASC", "Framework 4P", "Metodologia 4P da ASC", "CRM", "AI", "IA", "inteligência artificial".
    - If a forbidden term appears in drafts, replace with "Lifetrek Medical" and rewrite the sentence to keep it technical and neutral.
    - Include one section named "Referências" with 4-8 credible links in HTML list format (<ul><li>...</li></ul>).
    - Include one section named "Perguntas frequentes" with at least 3 practical Q&A items (h3 + p).
    - Do not invent URLs. Use only available sources.
    
    OUTPUT JSON:
    {
      "title": "SEO Optimized Title (max 70 chars)",
      "seo_title": "Title tag (max 60 chars)",
      "seo_description": "Meta description (max 160 chars)",
      "excerpt": "2-3 sentence summary",
      "content": "HTML string",
      "keywords": ["tag1", "tag2", "tag3"],
      "sources": ["https://source1.com", "https://source2.com"]
    }`;

    const writerData = await callAI(OPEN_ROUTER_API, {
      model: "google/gemini-2.0-flash-001", // Standard model for quality
      messages: [
        { role: "system", content: writerSystemPrompt },
        { role: "user", content: "Write the article now." }
      ],
      response_format: { type: "json_object" },
    }, 30000);

    let finalPost;
    try {
      finalPost = JSON.parse(writerData.choices[0].message.content);
    } catch (parseError) {
      console.error("Failed to parse writer response:", parseError);
      throw new Error("Failed to generate blog content");
    }

    finalPost.title = sanitizeForbiddenClientMentions(finalPost.title || "");
    finalPost.excerpt = sanitizeForbiddenClientMentions(finalPost.excerpt || "");
    finalPost.seo_title = sanitizeForbiddenClientMentions(finalPost.seo_title || "");
    finalPost.seo_description = sanitizeForbiddenClientMentions(finalPost.seo_description || "");
    finalPost.content = sanitizeForbiddenClientMentions(finalPost.content || "");
    console.log(`✅ [Phase 3] Content complete in ${Date.now() - writeStart}ms`);

    const mergedSources = normalizeUrlList([
      ...(Array.isArray(finalPost.sources) ? finalPost.sources : []),
      ...researchSources
    ]).slice(0, 10);

    if (mergedSources.length > 0 && !/refer[eê]ncias/i.test(finalPost.content || "")) {
      const referencesHtml = mergedSources
        .map((url) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer nofollow">${url}</a></li>`)
        .join("");
      finalPost.content = `${finalPost.content || ""}\n<h2>Referências</h2>\n<ul>${referencesHtml}</ul>`;
    }

    const keywordCandidates = Array.isArray(finalPost.keywords) && finalPost.keywords.length > 0
      ? finalPost.keywords
      : (Array.isArray(requestedKeywords) ? requestedKeywords : []);
    const safeKeywords = Array.from(new Set(
      keywordCandidates
        .filter((k: unknown) => typeof k === "string")
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0)
    )).slice(0, 12);

    // 4. IMAGE GENERATION (Optional, non-blocking)
    let imageUrl = "";
    if (!skipImage) {
      console.log("🎨 [Phase 4] Attempting image generation (optional)...");
      const imgStart = Date.now();

      try {
        // Quick asset fetch
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const productsResult = await supabase
          .from("processed_product_images")
          .select("name, enhanced_url")
          .eq("is_visible", true)
          .limit(2);

        const productImages = productsResult.data?.map(p => ({ url: p.enhanced_url, name: p.name })) || [];
        const productHints = productImages.map(p => p.name).filter(Boolean).join(", ");
        const productHintLine = productHints ? `REFERENCE PRODUCTS: ${productHints}` : "";

        // Professional banner image prompt for SEO and social sharing
        const designPrompt = `Create a professional wide banner image (16:9 aspect ratio) for a medical manufacturing blog article.

TITLE: "${finalPost.title}"
VISUAL CONCEPT: ${strategy.visual_concept}

STYLE REQUIREMENTS:
- Ultra-professional, clean, premium medical aesthetic
- Color palette: Deep medical blue (#1a365d), clean white, surgical steel grey, subtle teal accents
- Composition: Modern, asymmetric layout with strong visual hierarchy
- Lighting: Soft, diffused studio lighting with subtle highlights
- Atmosphere: Sterile, precise, high-tech yet approachable

        ELEMENTS TO INCLUDE:
- Abstract representation of precision manufacturing or medical technology
- Subtle geometric patterns suggesting precision and quality
- Clean negative space for visual breathing room
- Professional gradient overlays
${productHintLine ? `\n${productHintLine}\n` : "\n"}

CRITICAL:
- NO TEXT, NO WORDS, NO LETTERS on the image
- NO logos or watermarks
- NO human faces
- Photorealistic quality, 4K detail
- Perfect for LinkedIn/Facebook Open Graph sharing

The image should convey: Trust, Precision, Innovation, Medical Excellence.`;

        // Image generation with improved model
        const imgPromise = fetch("https://openrouter.ai/api/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPEN_ROUTER_API}`,
            "HTTP-Referer": "https://lifetrek.app",
            "X-Title": "Lifetrek App",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "stabilityai/stable-diffusion-xl-base-1.0",
            prompt: designPrompt,
            n: 1,
            size: "1792x1024"
          })
        }).then(r => (r.ok ? r.json() : null));

        const imgData = await withTimeout(imgPromise, 20000, null);
        if (imgData) {
          imageUrl = imgData.data?.[0]?.url || "";
        }
        console.log(`✅ [Phase 4] Image ${imageUrl ? 'generated' : 'skipped'} in ${Date.now() - imgStart}ms`);
      } catch (e) {
        console.warn("⚠️ Image generation failed/timed out, continuing without image");
      }
    }

    // Generate slug from title
    const slug = finalPost.title
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `post-${Date.now()}`;

    // Merge results
    const result = {
      title: finalPost.title,
      seo_title: finalPost.seo_title,
      seo_description: finalPost.seo_description,
      excerpt: finalPost.excerpt || finalPost.seo_description,
      content: finalPost.content,
      keywords: safeKeywords,
      tags: safeKeywords,
      slug,
      featured_image: imageUrl,
      strategy_brief: strategy,
      sources: mergedSources,
      rag_metrics: ragMetrics
    };

    const totalTime = Date.now() - startTime;
    console.log(`🎉 [COMPLETE] Blog post generated in ${totalTime}ms`);

    // ASYNC JOB MODE: Save to DB autonomously
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const jobId = jobIdFromReq;

    if (jobId) {
      console.log(`[Job ${jobId}] Saving result to blog_posts...`);

      try {
        // Get job details to find user_id
        const { data: jobData } = await supabase.from('jobs').select('user_id').eq('id', jobId).single();
        const userId = jobData?.user_id || (await supabase.auth.getUser())?.data?.user?.id;

        if (!userId) {
          console.warn("No userId found for blog save, skipping.");
          return;
        }

        const insertData = {
          author_id: userId,
          user_id: userId, // Set both for compatibility if it exists
          title: result.title,
          content: result.content,
          excerpt: result.excerpt,
          featured_image: result.featured_image,
          category_id: body.category_id,
          status: 'pending_review',
          slug: result.slug,
          seo_title: result.seo_title,
          seo_description: result.seo_description,
          keywords: result.keywords,
          ai_generated: true,
          metadata: {
            strategy: strategy,
            generation_time_ms: totalTime,
            keywords: result.keywords || [],
            tags: result.tags || [],
            sources: result.sources || [],
            rag_metrics: ragMetrics
          }
        };

        const { data: blogRecord, error: insertError } = await supabase
          .from("blog_posts")
          .insert([insertData])
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting blog post:", insertError);
          // NEW: Save error to job record
          await supabase.from('jobs').update({
            error: `Blog Save Error: ${insertError.message} (${insertError.code})`,
            checkpoint_data: { insert_failed: true, insert_error: insertError, insert_payload: insertData }
          }).eq('id', jobId);
        } else {
          console.log(`✅ Saved blog post ${blogRecord.id} to database`);
          await supabase.from('jobs').update({
            status: 'completed',
            result: result,
            completed_at: new Date().toISOString()
          }).eq('id', jobId);
        }
      } catch (err) {
        console.error("Critical error in blog worker save:", err);
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        await supabase.from('jobs').update({
          error: `Blog Post Save Critical Error: ${errorMsg}`
        }).eq('id', jobId);
      }

      return new Response("Job Processed", { status: 200 });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Error after ${totalTime}ms:`, error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

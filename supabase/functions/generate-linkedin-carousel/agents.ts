// Story 7.2: Multi-Agent Pipeline Implementation
// Strategist → Copywriter → Designer → Brand Analyst

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  CarouselParams,
  CarouselStrategy,
  CarouselCopy,
  GeneratedImage,
  QualityReview
} from "./types.ts";
import {
  getBrandGuidelines,
  validateCarouselStructure,
  extractJSON,
  searchCompanyAssets,
  generateCarouselEmbedding,
  searchSimilarCarousels,
  searchKnowledgeBase,
  deepResearch,
  type CostTrackingContext,
} from "./agent_tools.ts";
import {
  getLlmRankingPlaybookContext,
  isLlmRankingTopic
} from "./topic_playbooks.ts";
import { executeWithCostTracking, getDefaultCostTrackingClient } from "../_shared/costTracking.ts";

// Font cache for Satori
let fontData: ArrayBuffer | null = null;
let fontDataRegular: ArrayBuffer | null = null;
let satoriRenderer: any = null;
let ResvgCtor: any = null;

async function loadFonts() {
  if (fontData && fontDataRegular) return;
  console.log("📥 Loading fonts for Satori...");
  [fontData, fontDataRegular] = await Promise.all([
    fetch("https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf").then((res) => res.arrayBuffer()),
    fetch("https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf").then((res) => res.arrayBuffer())
  ]);
}

async function loadCompositorRuntime() {
  if (satoriRenderer && ResvgCtor) return;
  const satoriModule = await import("npm:satori@0.10.11");
  const resvgModule = await import("npm:@resvg/resvg-js@2.6.2");
  satoriRenderer = satoriModule.default;
  ResvgCtor = resvgModule.Resvg;
}

const OPEN_ROUTER_API = Deno.env.get("OPEN_ROUTER_API");
const TEXT_MODEL = "google/gemini-2.0-flash-001";
const IMAGE_MODEL = "google/gemini-2.0-flash-exp:free";
const GEMINI_TEXT_MODEL = "gemini-2.0-flash";
const OPENROUTER_FALLBACK_ERROR = "__openrouter_fallback__";

function getPlatformLabel(platform?: CarouselParams["platform"]): "LinkedIn" | "Instagram" {
  return platform === "instagram" ? "Instagram" : "LinkedIn";
}

function resolveCostTrackingContext(
  costContext: CostTrackingContext | undefined,
  operation: string,
  metadata: Record<string, unknown> = {},
): CostTrackingContext | undefined {
  const supabase = costContext?.supabase ?? getDefaultCostTrackingClient();
  if (!supabase) return undefined;

  return {
    supabase,
    userId: costContext?.userId || null,
    operation: costContext?.operation || operation,
    metadata: {
      execution_source: costContext?.supabase ? "function" : "local-module",
      ...(costContext?.metadata || {}),
      ...metadata,
    },
  };
}

async function callGeminiText(
  messages: { role: string; content: string }[],
  temperature: number = 0.7,
  costContext?: CostTrackingContext,
): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  const mergedPrompt = messages
    .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
    .join("\n\n");

  const executeCall = async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: mergedPrompt }] }],
          generationConfig: { temperature }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Text Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  };

  const data = costContext?.supabase
    ? await executeWithCostTracking(
        costContext.supabase,
        {
          userId: costContext.userId || null,
          operation: costContext.operation,
          service: "gemini",
          model: GEMINI_TEXT_MODEL,
          metadata: costContext.metadata,
        },
        executeCall,
      )
    : await executeCall();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p?.text)
    ?.filter(Boolean)
    ?.join("\n") || "";

  return text;
}

async function callOpenRouter(
  messages: { role: string; content: string }[],
  temperature: number = 0.7,
  costContext?: CostTrackingContext,
): Promise<string> {
  if (!OPEN_ROUTER_API) {
    console.warn("⚠️ OPEN_ROUTER_API missing, using Gemini text fallback");
    return await callGeminiText(messages, temperature, costContext);
  }

  const executeCall = async () => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPEN_ROUTER_API}`,
        "HTTP-Referer": "https://lifetrek.app",
        "X-Title": "Lifetrek App",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: messages,
        temperature: temperature,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401 || response.status === 403 || response.status >= 500) {
        console.warn(`⚠️ OpenRouter unavailable (${response.status}), using Gemini text fallback`);
        throw new Error(OPENROUTER_FALLBACK_ERROR);
      }
      throw new Error(`OpenRouter Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  };

  try {
    const data = !costContext?.supabase
      ? await executeCall()
      : await executeWithCostTracking(
          costContext.supabase,
          {
            userId: costContext.userId || null,
            operation: costContext.operation,
            service: "openrouter",
            model: TEXT_MODEL,
            metadata: costContext.metadata,
          },
          executeCall,
        );
    return data?.choices?.[0]?.message?.content || "";
  } catch (error) {
    if (error instanceof Error && error.message === OPENROUTER_FALLBACK_ERROR) {
      return await callGeminiText(messages, temperature, costContext);
    }
    throw error;
  }
}

async function callOpenRouterImage(
  prompt: string,
  refImageUrl?: string,
  costContext?: CostTrackingContext,
): Promise<string | null> {
  try {
    console.log("🎨 OpenRouter Image: Calling generation via chat completions...");

    const userContent = refImageUrl
      ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: refImageUrl } }
      ]
      : prompt;

    const executeCall = async () => {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPEN_ROUTER_API}`,
          "HTTP-Referer": "https://lifetrek.app",
          "X-Title": "Lifetrek App",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          messages: [{ role: "user", content: userContent }],
          modalities: ["image"],
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter Image Error (${response.status}): ${errorText}`);
      }

      return await response.json();
    };

    const data = !costContext?.supabase
      ? await executeCall()
      : await executeWithCostTracking(
          costContext.supabase,
          {
            userId: costContext.userId || null,
            operation: costContext.operation,
            service: "openrouter",
            model: IMAGE_MODEL,
            metadata: costContext.metadata,
          },
          executeCall,
        );

    const parts = data?.choices?.[0]?.message?.content;
    if (Array.isArray(parts)) {
      const imagePart = parts.find((p: any) => p.type === "image_url");
      if (imagePart?.image_url?.url) return imagePart.image_url.url;
    }
    if (typeof parts === "string" && parts.startsWith("http")) return parts;
    return null;

  } catch (error) {
    console.error("OpenRouter Image Call Failed:", error);
    return null;
  }
}

async function callGeminiImage(
  prompt: string,
  costContext?: CostTrackingContext,
): Promise<string | null> {
  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not set in environment");
    }

    const executeCall = async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE"],
              imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K"
              }
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Image Error (${response.status}): ${errorText}`);
      }

      return await response.json();
    };

    const data = !costContext?.supabase
      ? await executeCall()
      : await executeWithCostTracking(
          costContext.supabase,
          {
            userId: costContext.userId || null,
            operation: costContext.operation,
            service: "gemini",
            model: "gemini-3-pro-image-preview",
            metadata: costContext.metadata,
          },
          executeCall,
        );

    const imagePart = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!imagePart) {
      throw new Error("No image generated in Gemini response");
    }

    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  } catch (error) {
    console.error("Gemini Image Call Failed:", error);
    // FALLBACK TO OPENROUTER
    console.log("⚠️ Gemini failed, switching to OpenRouter fallback...");
    return await callOpenRouterImage(prompt, undefined, costContext);
  }
}

/**
 * Agent 1: Strategist
 * Plans the carousel structure and narrative arc
 */
export async function strategistAgent(
  params: CarouselParams,
  supabase?: SupabaseClient,
  costContext?: CostTrackingContext,
): Promise<CarouselStrategy> {
  const startTime = Date.now();
  console.log("🎯 Strategist Agent: Planning carousel strategy...");

  const brand = getBrandGuidelines(params.profileType);
  let kbContext = "";
  let researchContext = "";
  const useLlmRankingPlaybook = isLlmRankingTopic(params);
  const llmRankingContext = useLlmRankingPlaybook ? `\n\n${getLlmRankingPlaybookContext()}` : "";

  // 1. Knowledge Base Search (RAG)
  if (supabase) {
    try {
      console.log(`🔍 Strategist: Searching knowledge base for "${params.topic}"...`);
      const kbResults = await searchKnowledgeBase(supabase, params.topic, 0.5, 3, costContext ? {
        ...costContext,
        operation: "content.generate-linkedin-carousel.strategist.kb-search",
        metadata: {
          ...(costContext.metadata || {}),
          topic: params.topic,
          platform: params.platform || "linkedin",
        },
      } : undefined);
      if (kbResults && kbResults.length > 0) {
        kbContext = `\n\n**Reference Material from Knowledge Base**:\n${kbResults.map(item => `[${item.category}] ${item.question}: ${item.content}`).join('\n---\n')}`;
      }
    } catch (error) {
      console.warn("⚠️ KB Search failed:", error);
    }
  }

  // 2. Industry Research (Perplexity)
  const researchLevel = params.researchLevel || 'light';
  if (researchLevel !== 'none') {
    try {
      const researchQuery = `${params.topic} trends and statistics for ${params.targetAudience} in medical device manufacturing ${new Date().getFullYear()}`;
      console.log(`🔍 Strategist: Running ${researchLevel} research...`);
      const research = await deepResearch(researchQuery, researchLevel === 'deep' ? 15000 : 8000, costContext ? {
        ...costContext,
        operation: "content.generate-linkedin-carousel.strategist.research",
        metadata: {
          ...(costContext.metadata || {}),
          topic: params.topic,
          platform: params.platform || "linkedin",
          research_level: researchLevel,
        },
      } : undefined);
      if (research) {
        researchContext = `\n\n**Industry Research Findings**:\n${research}`;
      }
    } catch (error) {
      console.warn("⚠️ Research failed:", error);
    }
  }

  const platformLabel = getPlatformLabel(params.platform);
  const systemPrompt = `You are a ${platformLabel} carousel strategy expert for ${brand.companyName}.
${kbContext}
${researchContext}
${llmRankingContext}

**Task**: Create a strategic plan for a ${platformLabel} carousel about "${params.topic}".
**Target Audience**: ${params.targetAudience}
**Brand Tone**: ${brand.tone}

**Instructions**:
- Use Reference Material (if any) to mimic successful post patterns or follow brand guidelines.
- Use Research Findings (if any) to ground the content in facts and current trends.
- Plan 5-7 slides total following: Hook → Value → Value → Value → CTA.
- Output strategy and key messages in Portuguese (PT-BR).
${useLlmRankingPlaybook ? "- For this AI/LLM ranking topic, structure key messages as a staged optimization journey (workload framing -> batching -> scoring path -> prefix reuse -> runtime bottlenecks)." : ""}

Output ONLY valid JSON: { "hook": "...", "narrative_arc": "...", "slide_count": 5, "key_messages": [] }`;

  try {
    const response = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create strategy for: ${params.topic}` }
    ], 0.7, costContext ? {
      ...costContext,
      operation: "content.generate-linkedin-carousel.strategist",
      metadata: {
        ...(costContext.metadata || {}),
        topic: params.topic,
        platform: params.platform || "linkedin",
      },
    } : undefined);

    const strategy = extractJSON(response);
    console.log(`✅ Strategist: Planned ${strategy.slide_count} slides in ${Date.now() - startTime}ms`);
    return strategy;

  } catch (error) {
    console.error("❌ Strategist Error:", error);
    throw error;
  }
}

/**
 * Agent 1B: Strategist (Plan Mode)
 * Returns multiple strategic angles for user selection
 */
export async function strategistPlansAgent(
  params: CarouselParams,
  supabase?: SupabaseClient,
  optionsCount: number = 3,
  costContext?: CostTrackingContext,
): Promise<(CarouselStrategy & { topic?: string })[]> {
  const startTime = Date.now();
  console.log("🎯 Strategist Plan Agent: Generating strategy options...");

  const brand = getBrandGuidelines(params.profileType);
  let kbContext = "";
  let researchContext = "";
  const useLlmRankingPlaybook = isLlmRankingTopic(params);
  const llmRankingContext = useLlmRankingPlaybook ? `\n\n${getLlmRankingPlaybookContext()}` : "";

  if (supabase) {
    try {
      console.log(`🔍 Strategist Plan: Searching knowledge base for "${params.topic}"...`);
      const kbResults = await searchKnowledgeBase(supabase, params.topic, 0.5, 3, costContext ? {
        ...costContext,
        operation: "content.generate-linkedin-carousel.plan.kb-search",
        metadata: {
          ...(costContext.metadata || {}),
          topic: params.topic,
          platform: params.platform || "linkedin",
          options_count: optionsCount,
        },
      } : undefined);
      if (kbResults && kbResults.length > 0) {
        kbContext = `\n\n**Reference Material from Knowledge Base**:\n${kbResults.map(item => `[${item.category}] ${item.question}: ${item.content}`).join('\n---\n')}`;
      }
    } catch (error) {
      console.warn("⚠️ Plan KB Search failed:", error);
    }
  }

  const researchLevel = params.researchLevel || 'light';
  if (researchLevel !== 'none') {
    try {
      const researchQuery = `${params.topic} trends and statistics for ${params.targetAudience} in medical device manufacturing ${new Date().getFullYear()}`;
      console.log(`🔍 Strategist Plan: Running ${researchLevel} research...`);
      const research = await deepResearch(researchQuery, researchLevel === 'deep' ? 15000 : 8000, costContext ? {
        ...costContext,
        operation: "content.generate-linkedin-carousel.plan.research",
        metadata: {
          ...(costContext.metadata || {}),
          topic: params.topic,
          platform: params.platform || "linkedin",
          options_count: optionsCount,
          research_level: researchLevel,
        },
      } : undefined);
      if (research) {
        researchContext = `\n\n**Industry Research Findings**:\n${research}`;
      }
    } catch (error) {
      console.warn("⚠️ Plan research failed:", error);
    }
  }

  const platformLabel = getPlatformLabel(params.platform);
  const systemPrompt = `You are a ${platformLabel} carousel strategy expert for ${brand.companyName}.
${kbContext}
${researchContext}
${llmRankingContext}

**Task**: Create ${optionsCount} distinct strategic angles for a ${platformLabel} carousel about "${params.topic}".
**Target Audience**: ${params.targetAudience}
**Brand Tone**: ${brand.tone}

**Instructions**:
- Each option must have a distinct angle and hook.
- Use Research Findings (if any) to ground the content in facts and current trends.
- Plan 5-7 slides total following: Hook → Value → Value → Value → CTA.
- Output all topics/hooks/key messages in Portuguese (PT-BR).
${useLlmRankingPlaybook ? "- For this AI/LLM ranking topic, produce options that highlight different perspectives: technical architecture, operational lessons, and production impact." : ""}

Output ONLY valid JSON:
{
  "options": [
    { "topic": "...", "hook": "...", "narrative_arc": "...", "slide_count": 7, "key_messages": [] }
  ]
}`;

  try {
    const response = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create strategy options for: ${params.topic}` }
    ], 0.7, costContext ? {
      ...costContext,
      operation: "content.generate-linkedin-carousel.plan",
      metadata: {
        ...(costContext.metadata || {}),
        topic: params.topic,
        platform: params.platform || "linkedin",
        options_count: optionsCount,
      },
    } : undefined);

    const result = extractJSON(response);
    const options = Array.isArray(result?.options) ? result.options : [];

    console.log(`✅ Strategist Plan: Planned ${options.length} options in ${Date.now() - startTime}ms`);
    return options.slice(0, optionsCount).map((option: any) => ({
      topic: option.topic,
      hook: option.hook,
      narrative_arc: option.narrative_arc,
      slide_count: option.slide_count || 7,
      key_messages: option.key_messages || []
    }));
  } catch (error) {
    console.error("❌ Strategist Plan Error:", error);
    throw error;
  }
}

/**
 * Agent 2: Copywriter
 * Writes headlines and body copy for each slide
 */
export async function copywriterAgent(
  params: CarouselParams,
  strategy: CarouselStrategy,
  costContext?: CostTrackingContext,
): Promise<CarouselCopy> {
  const startTime = Date.now();
  console.log("✍️ Copywriter Agent: Writing carousel copy...");

  const brand = getBrandGuidelines(params.profileType);
  const useLlmRankingPlaybook = isLlmRankingTopic(params);
  const llmRankingContext = useLlmRankingPlaybook ? getLlmRankingPlaybookContext() : "";

  const platformLabel = getPlatformLabel(params.platform);
  const platformRules = params.platform === "instagram"
    ? "- Prioritize concise captions and conversational rhythm for Instagram.\n- Keep body copy punchier (prefer <= 130 chars).\n- Include 3-6 practical hashtags in final caption."
    : "- Prioritize authority and technical clarity for LinkedIn.\n- Keep body copy clear for professional feed consumption.\n- Include optional hashtags only when they add targeting signal.";

  const prompt = `You are an expert ${platformLabel} copywriter for ${brand.companyName}.
Topic: ${params.topic}
Strategy: ${JSON.stringify(strategy)}
Brand Tone: ${brand.tone}
Platform: ${platformLabel}
${llmRankingContext}

Write compelling copy for ${strategy.slide_count} slides.

Rules:
- Output language must be Portuguese (PT-BR).
- Engineer-to-engineer tone: precise, pragmatic, no hype.
- Return JSON only (no markdown fences, no commentary).
- Use short, high-contrast writing for carousel readability.
- Keep headline <= 70 characters and body <= 170 characters.
${platformRules}
${useLlmRankingPlaybook ? "- If you cite performance metrics, use only metrics from the playbook and attribute as \"LinkedIn reportou em 20/02/2026\"." : ""}

Output JSON: { "topic": "...", "caption": "...", "slides": [{ "type": "hook", "headline": "...", "body": "..." }] }`;

  const response = await callOpenRouter([{ role: "user", content: prompt }], 0.7, costContext ? {
    ...costContext,
    operation: "content.generate-linkedin-carousel.copywriter",
    metadata: {
      ...(costContext.metadata || {}),
      topic: params.topic,
      platform: params.platform || "linkedin",
      slide_count: strategy.slide_count,
    },
  } : undefined);
  const copy = extractJSON(response);
  console.log(`✅ Copywriter: Created ${copy.slides.length} slides in ${Date.now() - startTime}ms`);
  return copy;
}

/**
 * Agent 3: Designer
 * Searches for real assets (products, facilities) first using vector RAG, 
 * generates AI images only as fallback.
 */
export async function designerAgent(
  supabase: SupabaseClient,
  params: CarouselParams,
  copy: CarouselCopy,
  costContext?: CostTrackingContext,
): Promise<GeneratedImage[]> {
  const startTime = Date.now();
  console.log("🎨 Designer Agent: Creating visual assets...");

  const brand = getBrandGuidelines(params.profileType);

  // RAG for Design Rules
  let designRules = "";
  try {
    const kbDesign = await searchKnowledgeBase(supabase, "design rules colors visual style", 0.4, 2, costContext ? {
      ...costContext,
      operation: "content.generate-linkedin-carousel.designer.kb-search",
      metadata: {
        ...(costContext.metadata || {}),
        topic: params.topic,
        platform: params.platform || "linkedin",
      },
    } : undefined);
    if (kbDesign && kbDesign.length > 0) {
      designRules = `\n\n**Visual Style Guidelines**:\n${kbDesign.map(item => item.content).join("\n")}`;
    }
  } catch (e) {
    console.warn("⚠️ Design RAG failed", e);
  }

  const images: GeneratedImage[] = [];
  const equipmentPriority = (params.selectedEquipment || []).map((item) => item.toLowerCase());
  const hasReferenceImage = Boolean(params.referenceImage);

  // Decide which slides get images (Hook and last slide always, middle one if long)
  const middleIndex = Math.floor(copy.slides.length / 2);

  for (let i = 0; i < copy.slides.length; i++) {
    const slide = copy.slides[i];
    const shouldHaveImage = i === 0 || i === middleIndex || i === copy.slides.length - 1;

    if (!shouldHaveImage) {
      images.push({ slide_index: i, image_url: "", asset_source: 'text-only' });
      continue;
    }

    // 1. Try real asset with semantic search
    // Combine headline and visual_description for better matching
    // ENHANCED: Explicitly look for metrology, equipment, and product terms if applicable
    let assetQuery = `${slide.headline} ${slide.visual_description || ""}`.trim();

    if (equipmentPriority.length > 0) {
      assetQuery += ` ${equipmentPriority.join(" ")}`;
    }

    // Add priority keywords if the topic suggests technical equipment
    if (assetQuery.toLowerCase().includes('precision') || assetQuery.toLowerCase().includes('quality')) {
      assetQuery += " metrology equipment measuring";
    }
    if (assetQuery.toLowerCase().includes('machining') || assetQuery.toLowerCase().includes('manufacturing')) {
      assetQuery += " cnc machine factory";
    }

    const realAsset = await searchCompanyAssets(supabase, assetQuery, costContext ? {
      ...costContext,
      operation: "content.generate-linkedin-carousel.designer.asset-search",
      metadata: {
        ...(costContext.metadata || {}),
        topic: params.topic,
        platform: params.platform || "linkedin",
        slide_index: i,
      },
    } : undefined);

    if (realAsset) {
      console.log(`🖼️ Designer: Using real asset "${realAsset.name}" for slide ${i}`);
      images.push({
        slide_index: i,
        image_url: realAsset.url,
        asset_source: realAsset.source as 'real',
        asset_url: realAsset.url
      });
      continue;
    }

    // 2. Fallback to AI Generation with Brand Infusion (Story 7.2)
    const isHybrid = params.style_mode === 'hybrid-composite';

    console.log(`🤖 Designer: Generating image for slide ${i} (Mode: ${params.style_mode || 'ai-native'})`);

    let prompt = "";
    if (isHybrid) {
      // Hybrid Mode: Clean background, no text
      prompt = `Professional medical engineering background. Abstract concept of: ${slide.headline}. ${designRules}. Clean, sharp, high quality, 4k. NO TEXT, NO TYPOGRAPHY, NO WORDS, clean background. Focus on materials and textures (titanium, glass, cleanroom).`.trim();
    } else {
      // AI-Native Mode (Legacy): Try to include text/composition in the image
      prompt = `Professional medical device manufacturing illustration, premium cleanroom factory setting. Abstract concept of: ${slide.headline}. ${designRules}. Clean, sharp, high quality, 4k. Text overlay: "${slide.headline}".`.trim();
    }

    if (equipmentPriority.length > 0) {
      prompt += ` Highlight these real assets/equipment concepts when possible: ${equipmentPriority.join(", ")}.`;
    }
    if (hasReferenceImage) {
      prompt += " Match composition and photographic style from the provided reference image.";
    }

    try {
      // Use the shared callOpenRouterImage function for consistency
      console.log(`🎨 Designer: Calling image generator for slide ${i}...`);
      const imageUrl = await callGeminiImage(prompt, costContext ? {
        ...costContext,
        operation: "content.generate-linkedin-carousel.designer.image",
        metadata: {
          ...(costContext.metadata || {}),
          topic: params.topic,
          platform: params.platform || "linkedin",
          slide_index: i,
        },
      } : undefined) || "";

      images.push({
        slide_index: i,
        image_url: imageUrl,
        asset_source: imageUrl ? 'ai-generated' : 'text-only'
      });
    } catch (e) {
      console.warn(`⚠️ Design generation failed for slide ${i}`, e);
      // Fallback to placeholder so design is visible even if API fails
      images.push({
        slide_index: i,
        image_url: `https://placehold.co/1024x1024/f1f5f9/334155?text=Flux+Generation+Failed+${i}`,
        asset_source: 'placeholder'
      });
    }
  }

  console.log(`✅ Designer: Created assets in ${Date.now() - startTime}ms`);
  return images;
}

/**
 * Agent 3.5: Compositor
 * Overlays text and branding on the generated backgrounds using Satori
 */
export async function compositorAgent(
  copy: CarouselCopy,
  images: GeneratedImage[]
): Promise<GeneratedImage[]> {
  const startTime = Date.now();
  console.log("🎨 Compositor Agent: Assembling final slides...");

  // Fetch Logo (assuming it's hosted publicly or in supabase storage)
  // For now, we'll search for the logo asset or use a known public URL if available.
  // Since we don't have a supabase client passed here, we might need to hardcode the URL from an env var or a known path.
  // Assuming the user has a 'logo.png' in public folder, but Satori needs an absolute URL or base64.
  // We'll use a placeholder URL that points to the project's logo if known, or a generic one.
  // BETTER: Let's assume the logo is at a standard location in Supabase storage:
  // `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/public_assets/logo.png`

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // Fetch Logo and ISO Badge using provided URLs
  const logoUrl = "https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/logo.png";
  const isoUrl = "https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/iso.jpg";

  // Helper to fetch and convert to base64
  const fetchAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        return `data:image/${url.endsWith('png') ? 'png' : 'jpeg'};base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
      }
    } catch (e) {
      console.warn(`⚠️ Failed to fetch asset ${url}:`, e);
    }
    return null;
  };

  const [logoBase64, isoBase64] = await Promise.all([
    fetchAsBase64(logoUrl),
    fetchAsBase64(isoUrl)
  ]);

  const compositedImages: GeneratedImage[] = [];

  for (let i = 0; i < copy.slides.length; i++) {
    const slide = copy.slides[i];
    const image = images.find(img => img.slide_index === i);
    const bgUrl = image ? image.image_url : "";

    // Skip composition if no background image (shouldn't happen)
    if (!bgUrl) {
      compositedImages.push(image!);
      continue;
    }

    try {
      console.log(`🎨 Compositor: Rendering Slide ${i + 1}/${copy.slides.length}`);

      // Satori JSX Template
      const element = {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            height: '100%',
            width: '100%',
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            fontFamily: 'Inter',
          },
          children: [
            // Glass Card
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'absolute',
                  left: '50px',
                  top: '100px',
                  width: '500px',
                  backgroundColor: 'rgba(0, 79, 143, 0.85)', // #004F8F
                  borderRadius: '24px',
                  padding: '60px',
                  color: 'white',
                  boxShadow: '0 20px 60px -20px rgba(0, 79, 143, 0.5)',
                },
                children: [
                  // Step Label
                  {
                    type: 'div',
                    props: {
                      style: {
                        color: '#4ade80', // Accent Green light
                        fontWeight: 700,
                        fontSize: '18px',
                        marginBottom: '10px',
                        textTransform: 'uppercase',
                      },
                      children: `PASSO ${i + 1}`,
                    },
                  },
                  // Headline
                  {
                    type: 'h1',
                    props: {
                      style: {
                        fontSize: '48px',
                        lineHeight: 1.1,
                        marginBottom: '30px',
                        fontWeight: 800,
                      },
                      children: slide.headline,
                    },
                  },
                  // Body
                  {
                    type: 'p',
                    props: {
                      style: {
                        fontSize: '24px',
                        lineHeight: 1.6,
                        marginBottom: '40px',
                        color: 'rgba(255,255,255, 0.9)',
                      },
                      children: slide.body,
                    },
                  },
                ],
              },
            },
            // Branding Line
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '12px',
                  background: 'linear-gradient(90deg, #004F8F 0%, #1A7A3E 100%)',
                },
              },
            },
            // Logo (Placeholder for now, or fetch from URL)
            // Logo
            // Logo & Trust Badges
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '50px',
                  right: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px', // Space between Logo and ISO
                },
                children: [
                  // ISO Badge (Trust Signal)
                  isoBase64 ? {
                    type: 'img',
                    props: {
                      src: isoBase64,
                      height: 60,
                      style: {
                        objectFit: 'contain',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }
                    }
                  } : null,
                  // Main Logo
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      },
                      children: logoBase64 ? [
                        {
                          type: 'img',
                          props: {
                            src: logoBase64,
                            width: 150,
                            style: { objectFit: 'contain' }
                          }
                        }
                      ] : [
                        {
                          type: 'span',
                          props: {
                            style: {
                              color: '#004F8F',
                              fontWeight: 800,
                              fontSize: '24px'
                            },
                            children: 'LIFETREK'
                          }
                        }
                      ]
                    }
                  }
                ].filter(Boolean) // Remove nulls if assets fail
              }
            }
          ],
        },
      };

      // Generate SVG
      await loadCompositorRuntime();
      await loadFonts();
      const svg = await satoriRenderer!(
        element as any,
        {
          width: 1024,
          height: 1024,
          fonts: [
            {
              name: 'Inter',
              data: fontData!,
              weight: 800,
              style: 'normal',
            },
            {
              name: 'Inter',
              data: fontDataRegular!,
              weight: 400,
              style: 'normal',
            },
          ],
        }
      );

      // Convert to PNG
      const resvg = new ResvgCtor(svg);
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      // Upload to Supabase Storage (Simplified: return base64 for now)
      const base64Png = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(pngBuffer)))}`;

      compositedImages.push({
        slide_index: image?.slide_index ?? i,
        image_url: base64Png, // Replace raw background with composited image
        asset_source: 'hybrid-generated',
        asset_url: image?.asset_url
      });

    } catch (e) {
      console.error(`❌ Compositor failed for slide ${i}:`, e);
      if (image) {
        compositedImages.push(image); // Fallback to background only
      } else {
        compositedImages.push({
          slide_index: i,
          image_url: bgUrl,
          asset_source: 'text-only'
        });
      }
    }
  }

  console.log(`✅ Compositor: Finalized ${compositedImages.length} slides in ${Date.now() - startTime}ms`);
  return compositedImages;
}

/**
 * Agent 4: Brand Analyst
 * Reviews output quality and decides if regeneration is needed
 */
export async function brandAnalystAgent(
  copy: CarouselCopy,
  images: GeneratedImage[],
  platform: CarouselParams["platform"] = "linkedin",
  costContext?: CostTrackingContext,
): Promise<QualityReview> {
  const startTime = Date.now();
  console.log("🔍 Brand Analyst: Reviewing carousel quality...");

  const platformLabel = getPlatformLabel(platform);
  const prompt = `Review this ${platformLabel} carousel.
Slides: ${JSON.stringify(copy.slides)}
Image Sources: ${images.map(img => img.asset_source).join(", ")}

Provide a quality score (0-100) and feedback in JSON.
Output JSON: { "overall_score": 85, "feedback": "...", "needs_regeneration": false }`;

  const response = await callOpenRouter([{ role: "user", content: prompt }], 0.7, costContext ? {
    ...costContext,
    operation: "content.generate-linkedin-carousel.reviewer",
    metadata: {
      ...(costContext.metadata || {}),
      platform,
      slide_count: copy.slides.length,
    },
  } : undefined);
  const review = extractJSON(response);

  review.needs_regeneration = review.overall_score < 70;
  console.log(`✅ Brand Analyst: Score ${review.overall_score}/100 in ${Date.now() - startTime}ms`);
  return review;
}

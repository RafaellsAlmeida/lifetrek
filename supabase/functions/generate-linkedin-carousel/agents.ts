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
  deepResearch
} from "./agent_tools.ts";

const OPEN_ROUTER_API = Deno.env.get("OPEN_ROUTER_API");
const TEXT_MODEL = "google/gemini-2.0-flash-001";
const IMAGE_MODEL = "black-forest-labs/flux-schnell";

async function callOpenRouter(
  messages: { role: string; content: string }[],
  temperature: number = 0.7
): Promise<string> {
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
    throw new Error(`OpenRouter Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGeminiImage(prompt: string): Promise<string | null> {
  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not set in environment");
    }

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

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

    if (!imagePart) {
      throw new Error("No image generated in Gemini response");
    }

    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  } catch (error) {
    console.error("Gemini Image Call Failed:", error);
    throw error;
  }
}

/**
 * Agent 1: Strategist
 * Plans the carousel structure and narrative arc
 */
export async function strategistAgent(
  params: CarouselParams,
  supabase?: SupabaseClient
): Promise<CarouselStrategy> {
  const startTime = Date.now();
  console.log("🎯 Strategist Agent: Planning carousel strategy...");

  const brand = getBrandGuidelines(params.profileType);
  let kbContext = "";
  let researchContext = "";

  // 1. Knowledge Base Search (RAG)
  if (supabase) {
    try {
      console.log(`🔍 Strategist: Searching knowledge base for "${params.topic}"...`);
      const kbResults = await searchKnowledgeBase(supabase, params.topic, 0.5, 3);
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
      const research = await deepResearch(researchQuery, researchLevel === 'deep' ? 15000 : 8000);
      if (research) {
        researchContext = `\n\n**Industry Research Findings**:\n${research}`;
      }
    } catch (error) {
      console.warn("⚠️ Research failed:", error);
    }
  }

  const systemPrompt = `You are a LinkedIn carousel strategy expert for ${brand.companyName}.
${kbContext}
${researchContext}

**Task**: Create a strategic plan for a LinkedIn carousel about "${params.topic}".
**Target Audience**: ${params.targetAudience}
**Brand Tone**: ${brand.tone}

**Instructions**:
- Use Reference Material (if any) to mimic successful post patterns or follow brand guidelines.
- Use Research Findings (if any) to ground the content in facts and current trends.
- Plan 5-7 slides total following: Hook → Value → Value → Value → CTA.

Output ONLY valid JSON: { "hook": "...", "narrative_arc": "...", "slide_count": 5, "key_messages": [] }`;

  try {
    const response = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create strategy for: ${params.topic}` }
    ]);

    const strategy = extractJSON(response);
    console.log(`✅ Strategist: Planned ${strategy.slide_count} slides in ${Date.now() - startTime}ms`);
    return strategy;

  } catch (error) {
    console.error("❌ Strategist Error:", error);
    throw error;
  }
}

/**
 * Agent 2: Copywriter
 * Writes headlines and body copy for each slide
 */
export async function copywriterAgent(
  params: CarouselParams,
  strategy: CarouselStrategy
): Promise<CarouselCopy> {
  const startTime = Date.now();
  console.log("✍️ Copywriter Agent: Writing carousel copy...");

  const brand = getBrandGuidelines(params.profileType);

  const prompt = `You are an expert LinkedIn copywriter for ${brand.companyName}.
Topic: ${params.topic}
Strategy: ${JSON.stringify(strategy)}
Brand Tone: ${brand.tone}

Write compelling copy for ${strategy.slide_count} slides.
Output JSON: { "topic": "...", "caption": "...", "slides": [{ "type": "hook", "headline": "...", "body": "..." }] }`;

  const response = await callOpenRouter([{ role: "user", content: prompt }]);
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
  copy: CarouselCopy
): Promise<GeneratedImage[]> {
  const startTime = Date.now();
  console.log("🎨 Designer Agent: Creating visual assets...");

  const brand = getBrandGuidelines(params.profileType);

  // RAG for Design Rules
  let designRules = "";
  try {
    const kbDesign = await searchKnowledgeBase(supabase, "design rules colors visual style", 0.4, 2);
    if (kbDesign && kbDesign.length > 0) {
      designRules = `\n\n**Visual Style Guidelines**:\n${kbDesign.map(item => item.content).join("\n")}`;
    }
  } catch (e) {
    console.warn("⚠️ Design RAG failed", e);
  }

  const images: GeneratedImage[] = [];

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
    const assetQuery = `${slide.headline} ${slide.visual_description || ""}`.trim();
    const realAsset = await searchCompanyAssets(supabase, assetQuery);

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
    console.log(`🤖 Designer: Fallback to Gemini (Nano Banana Pro) for slide ${i}`);
    const prompt = `
      Medical device manufacturing context: ${slide.headline}.
      ${designRules}.
      
      ACCEPTANCE CRITERIA:
      - Premium, photorealistic, high-end studio lighting.
      - Brand: Lifetrek (Engineering Excellence).
      - Logo: Include Lifetrek logo discrete in corner or no logo if not perfect.
      - NO spelling errors in the image.
      - Environment: CLEANROOM, Lab, or High-Tech factory.
    `.trim();

    try {
      const b64Data = await callGeminiImage(prompt);
      images.push({
        slide_index: i,
        image_url: b64Data || "",
        asset_source: b64Data ? 'ai-generated' : 'text-only'
      });
    } catch (e) {
      console.warn(`⚠️ Design generation failed for slide ${i}`, e);
      images.push({ slide_index: i, image_url: "", asset_source: 'text-only' });
    }
  }

  console.log(`✅ Designer: Created assets in ${Date.now() - startTime}ms`);
  return images;
}

/**
 * Agent 4: Brand Analyst
 * Reviews output quality and decides if regeneration is needed
 */
export async function brandAnalystAgent(
  copy: CarouselCopy,
  images: GeneratedImage[]
): Promise<QualityReview> {
  const startTime = Date.now();
  console.log("🔍 Brand Analyst: Reviewing carousel quality...");

  const prompt = `Review this LinkedIn carousel.
Slides: ${JSON.stringify(copy.slides)}
Image Sources: ${images.map(img => img.asset_source).join(", ")}

Provide a quality score (0-100) and feedback in JSON.
Output JSON: { "overall_score": 85, "feedback": "...", "needs_regeneration": false }`;

  const response = await callOpenRouter([{ role: "user", content: prompt }]);
  const review = extractJSON(response);

  review.needs_regeneration = review.overall_score < 70;
  console.log(`✅ Brand Analyst: Score ${review.overall_score}/100 in ${Date.now() - startTime}ms`);
  return review;
}

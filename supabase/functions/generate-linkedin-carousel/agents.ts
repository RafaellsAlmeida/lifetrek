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

async function callOpenRouterImage(prompt: string): Promise<string | null> {
  try {
    // OpenRouter uses the chat completions endpoint for image generation
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
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.error?.message || errorJson.message || errorText;
      } catch (e) { }
      throw new Error(`OpenRouter Image Error (${response.status}): ${errorDetail}`);
    }

    const data = await response.json();

    // OpenRouter returns images in message.images array
    const images = data.choices?.[0]?.message?.images;
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error(`OpenRouter Image Success but no images in response: ${JSON.stringify(data)}`);
    }

    // Images can be returned in various formats (URL string, or object with url property)
    // The Gemini model via OpenRouter often returns { type: "image_url", image_url: { url: "..." } }
    const firstImage = images[0];
    const imageUrl =
      (typeof firstImage === 'string' ? firstImage : null) ||
      firstImage?.image_url?.url ||
      firstImage?.imageUrl?.url ||
      firstImage?.url;

    if (!imageUrl) {
      throw new Error(`OpenRouter Image Success but no URL in image object: ${JSON.stringify(firstImage)}`);
    }

    return imageUrl;
  } catch (error) {
    console.error("OpenRouter Image Call Failed:", error);
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

  // Story 7.7: Search for similar successful carousels
  let similarCarouselsContext = "";
  if (supabase) {
    try {
      const queryEmbedding = await generateCarouselEmbedding(
        params.topic,
        [{ headline: params.topic, body: params.painPoint || "" }]
      );

      if (queryEmbedding) {
        const similarCarousels = await searchSimilarCarousels(supabase, queryEmbedding, 0.70, 3);

        if (similarCarousels && similarCarousels.length > 0) {
          similarCarouselsContext = `\n\n**Similar Successful Carousels** (for inspiration only - create something new):
${similarCarousels.map((c: any, i: number) => `${i + 1}. "${c.topic}" (Quality: ${c.quality_score}/100, ${JSON.parse(c.slides).length} slides)`).join('\n')}

Learn from their structure and quality, but create fresh content for "${params.topic}".`;
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not search similar carousels:", error);
    }

    // Story 7.2: Search for high-performance examples and brand rules in knowledge base
    try {
      console.log(`🔍 Strategist: Searching knowledge base for "${params.topic}"...`);
      const kbResults = await searchKnowledgeBase(supabase, params.topic, 0.5, 3);
      
      if (kbResults && kbResults.length > 0) {
        const kbContext = kbResults.map((item: any, i: number) => 
          `[${item.category || 'Knowledge'}] ${item.question || 'Reference'}: ${item.content}`
        ).join('\n---\n');
        
        // SimilarCarouselsContext already exists, we append to it or create a new block
        similarCarouselsContext += `\n\n**Reference Material from Knowledge Base**:
${kbContext}

Use these examples and brand rules to ensure content follows high-performance patterns and brand guidelines.`;
      }
    } catch (error) {
      console.warn("⚠️ Could not search knowledge base:", error);
    }
  }

  const researchLevel = params.researchLevel || 'light';
  let researchContext = "";

  if (researchLevel !== 'none') {
    try {
      const researchQuery = `${params.topic} trends and statistics for ${params.targetAudience} in medical device manufacturing ${new Date().getFullYear()}`;
      const maxResearchTime = researchLevel === 'deep' ? 15000 : 10000;
      const researchResults = await deepResearch(researchQuery, maxResearchTime);

      if (researchResults) {
        researchContext = `\n\n**Current Industry Research** (use to inform strategy):
${researchResults}

Use these insights to create a timely, relevant carousel that addresses current trends.`;
      }
    } catch (error) {
      console.warn("⚠️ Could not complete research:", error);
    }
  }

  const systemPrompt = `You are a LinkedIn carousel strategy expert for ${brand.companyName}.
${similarCarouselsContext}${researchContext}

**Task**: Create a strategic plan for a LinkedIn carousel about "${params.topic}".
**Target Audience**: ${params.targetAudience}
**Pain Point**: ${params.painPoint || 'Not specified'}
**Desired Outcome**: ${params.desiredOutcome || 'Engagement and thought leadership'}
**Brand Tone**: ${brand.tone}

**Requirements**:
- Plan 5-7 slides total (including hook and CTA)
- Create a compelling narrative arc
- Identify key messages for maximum impact
- Follow proven LinkedIn carousel structure: Hook → Value → Value → Value → CTA
- Output ONLY valid JSON.`;

  try {
    const response = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create strategy for topic: ${params.topic}` }
    ]);

    // Sometimes models wrap JSON in markdown blocks
    const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '');
    const strategy = extractJSON(cleanResponse);

    console.log(`✅ Strategist: Planned ${strategy.slide_count}-slide carousel in ${Date.now() - startTime}ms`);
    return strategy;

  } catch (error: unknown) {
    console.error("❌ Strategist Agent Error:", error);
    throw new Error(`Strategist failed: ${error instanceof Error ? error.message : String(error)}`);
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

**Task**: Write compelling copy for a ${strategy.slide_count}-slide LinkedIn carousel.
**Topic**: ${params.topic}
**Target Audience**: ${params.targetAudience}
**Narrative Arc**: ${strategy.narrative_arc}
**Key Messages**: ${(strategy.key_messages || []).join(', ')}
**Brand Tone**: ${brand.tone}
**CTA Action**: ${params.ctaAction || 'Contact us to learn more'}

**Slide Structure**:
1. **Hook Slide** (type: "hook"): Attention-grabbing opening
   - Headline: Short, punchy (max 60 chars)
   - Body: Compelling value proposition (max 120 chars)

2-${strategy.slide_count - 1}. **Content Slides** (type: "content"): Value delivery
   - Headline: Clear, benefit-focused (max 70 chars)
   - Body: Specific, actionable insight (max 140 chars)

${strategy.slide_count}. **CTA Slide** (type: "cta"): Clear call to action
   - Headline: Action-oriented (max 60 chars)
   - Body: Clear next step (max 120 chars)

**Output Format** (JSON only):
{
  "topic": "${params.topic}",
  "caption": "LinkedIn post caption (2-3 sentences, engaging, with 3-5 relevant hashtags)",
  "slides": [
    { "type": "hook", "headline": "...", "body": "..." },
    { "type": "content", "headline": "...", "body": "..." },
    { "type": "cta", "headline": "...", "body": "..." }
  ]
}`;

  try {
    const response = await callOpenRouter([
      { role: "user", content: prompt }
    ]);

    const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '');
    const copy: CarouselCopy = extractJSON(cleanResponse);

    console.log(`✅ Copywriter: Created ${copy.slides.length} slides in ${Date.now() - startTime}ms`);
    return copy;

  } catch (error: unknown) {
    console.error("❌ Copywriter Agent Error:", error);
    throw new Error(`Copywriter failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Agent 3: Designer
 * Searches for real assets first, generates AI images as fallback
 * MODIFIED: Uses OpenRouter (Stable Diffusion) for image generation.
 */
export async function designerAgent(
  supabase: SupabaseClient,
  params: CarouselParams,
  copy: CarouselCopy
): Promise<GeneratedImage[]> {
  const startTime = Date.now();
  console.log("🎨 Designer Agent: Creating visual assets via OpenRouter...");

  const images: GeneratedImage[] = [];

  const isSingleImage = params.format === 'single-image';
  const middleSlideIndex = Math.floor(copy.slides.length / 2);
  const lastSlideIndex = copy.slides.length - 1;

  const imagePromises = copy.slides.map(async (slide, i) => {
    // Story 7.8: Selective Visualization for Cost Optimization
    // Only generate visuals for Hook, Middle, and CTA slides in carousels
    // Always generate for single-image format
    const shouldHaveVisual = isSingleImage || i === 0 || i === middleSlideIndex || i === lastSlideIndex;

    if (!shouldHaveVisual) {
      console.log(`ℹ️ Designer: Skipping visual for non-critical slide ${i + 1} (Text-only background).`);
      return {
        slide_index: i,
        image_url: "",
        asset_source: 'text-only' as const
      };
    }

    // 1. Search for real assets
    try {
      const assetQuery = slide.headline.split(' ').slice(0, 3).join(' ');
      const realAsset = await searchCompanyAssets(supabase, assetQuery);

      if (realAsset) {
        console.log(`✅ Designer: Using real asset for slide ${i + 1}`);
        return {
          slide_index: i,
          image_url: realAsset.url,
          asset_source: 'real' as const,
          asset_url: realAsset.url
        };
      }
    } catch (e) {
      console.warn("Asset search failed", e);
    }

    // 2. Generate AI Image via OpenRouter
    const imagePrompt = `Professional high-end corporate illustration, medical device manufacturing context. ${slide.headline} - ${slide.body}. High quality, clean modern B2B aesthetic, photorealistic, 4k.`;

    console.log(`🎨 Designer: Generating image for slide ${i + 1} with ${IMAGE_MODEL}...`);
    const imageUrl = await callOpenRouterImage(imagePrompt);

    if (imageUrl) {
      console.log(`✅ Designer: Generated AI image for slide ${i + 1}`);
      return {
        slide_index: i,
        image_url: imageUrl,
        asset_source: 'ai-generated' as const
      };
    } else {
      console.warn(`⚠️ Designer: Failed to generate image for slide ${i + 1}, fallback to text-only.`);
      return {
        slide_index: i,
        image_url: "",
        asset_source: 'text-only' as const
      };
    }
  });

  const results = await Promise.all(imagePromises);
  results.sort((a, b) => a.slide_index - b.slide_index);
  return results;

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

  const brand = getBrandGuidelines();

  const prompt = `You are a strict brand quality analyst for ${brand.companyName}.

**Task**: Review this LinkedIn carousel.
**Content**: ${copy.topic} / ${copy.caption}
**Slides**: ${copy.slides.map(s => `[${s.type}] ${s.headline}`).join(', ')}

**Criteria**:
- Clarity & Value
- Engagement Potential
- Brand Alignment

**Output JSON**:
{
  "overall_score": 85,
  "feedback": "Assessment...",
  "needs_regeneration": false,
  "issues": [],
  "strengths": []
}`;

  try {
    const response = await callOpenRouter([
      { role: "user", content: prompt }
    ]);

    const cleanResponse = response.replace(/```json/g, '').replace(/```/g, '');
    const review: QualityReview = extractJSON(cleanResponse);

    if (typeof review.overall_score !== 'number') review.overall_score = 75;
    review.needs_regeneration = review.overall_score < 70;

    console.log(`✅ Brand Analyst: Score ${review.overall_score}/100 in ${Date.now() - startTime}ms`);
    return review;

  } catch (error: unknown) {
    console.error("❌ Brand Analyst Error:", error);
    return {
      overall_score: 75,
      feedback: "Review failed, defaulting to passing score.",
      needs_regeneration: false,
      issues: ["Reviewer error"],
      strengths: ["Content generated"]
    };
  }
}

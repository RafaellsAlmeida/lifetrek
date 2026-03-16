/**
 * Vision QA Scorer for carousel slide images.
 *
 * Sends each generated slide image to a vision model via OpenRouter and returns
 * a structured quality score covering brand consistency, readability,
 * composition, and content relevance.
 *
 * @module qa/vision-scorer
 */

declare const Deno: any;

import { executeWithCostTracking } from "../../_shared/costTracking.ts";
import type { SlideData } from "../types.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QAScore {
  /** Overall score 0-100 */
  total: number;
  /** Brand guideline adherence 0-25 */
  brand_consistency: number;
  /** Text legibility 0-25 */
  readability: number;
  /** Layout balance 0-25 */
  composition: number;
  /** Background / topic match 0-25 */
  content_relevance: number;
  /** Brief human-readable feedback */
  feedback: string;
}

interface ScorerOptions {
  supabase?: any;
  userId?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const VISION_MODEL = "google/gemini-2.5-flash-preview";
const ESTIMATED_COST = 0.003;
const COST_OPERATION = "content.regenerate-carousel-images.qa.vision-score";

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(slide: SlideData): string {
  return `You are a professional graphic design QA reviewer for a medical device company's LinkedIn carousel posts.

Score this slide image on 4 criteria (0-25 each):

1. **Brand Consistency** (0-25): Does the image follow brand guidelines? Check:
   - Corporate blue (#004F8F) color scheme with dark overlay
   - LifeTrek Medical logo visible and properly placed (top-right)
   - Glassmorphism card style with rounded corners
   - Professional medical/manufacturing aesthetic

2. **Readability** (0-25): Can the text be easily read? Check:
   - Sufficient contrast between text and background
   - Font size appropriate for content length
   - No text overflow or truncation
   - Hierarchy clear (headline vs body vs label)

3. **Composition** (0-25): Is the layout balanced and professional? Check:
   - Card positioned correctly (left side, not covering entire image)
   - Background image visible and adds value
   - No awkward cropping or distortion
   - Visual hierarchy guides the eye

4. **Content Relevance** (0-25): Does the background match the topic? Check:
   - The slide headline is: "${slide.headline}"
   - The slide body is: "${slide.body}"
   - Background should relate to medical device manufacturing
   - Real facility photos preferred over AI-generated images

ALSO flag if:
- Logo appears AI-generated (blurry, wrong text, distorted)
- ISO badge appears AI-generated
- Background is clearly AI-generated (not a real photo)

Respond with ONLY valid JSON:
{"total": N, "brand_consistency": N, "readability": N, "composition": N, "content_relevance": N, "feedback": "brief text"}`;
}

// ---------------------------------------------------------------------------
// Core scoring function
// ---------------------------------------------------------------------------

/**
 * Score a single slide image using a vision model.
 *
 * Returns `null` when scoring fails for any reason so that the caller can
 * decide whether to retry or simply skip.
 */
export async function scoreSlideDesign(
  imageUrl: string,
  slide: SlideData,
  options?: ScorerOptions,
): Promise<QAScore | null> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    console.warn("[vision-scorer] OPENROUTER_API_KEY not set — skipping QA scoring");
    return null;
  }

  const prompt = buildPrompt(slide);

  const callApi = async (): Promise<QAScore | null> => {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lifetrek.io",
        "X-Title": "Lifetrek QA Scorer",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              { type: "text", text: prompt },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown error");
      console.warn(
        `[vision-scorer] OpenRouter returned ${response.status}: ${errorText.slice(0, 300)}`,
      );
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("[vision-scorer] No content in model response");
      return null;
    }

    return parseScore(content);
  };

  try {
    if (options?.supabase && options?.userId) {
      return await executeWithCostTracking(
        options.supabase,
        {
          userId: options.userId,
          operation: COST_OPERATION,
          service: "openrouter",
          model: VISION_MODEL,
          estimatedCost: ESTIMATED_COST,
        },
        callApi,
      );
    }

    return await callApi();
  } catch (error) {
    console.warn("[vision-scorer] Scoring failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Batch scoring
// ---------------------------------------------------------------------------

/**
 * Score every slide in a carousel that already has an image URL.
 *
 * Results are written back into each slide's `qa_score` (total) and
 * `qa_breakdown` (full QAScore object) properties.  Slides without an image
 * URL are silently skipped.
 */
export async function scoreCarouselDesign(
  slides: SlideData[],
  options?: ScorerOptions,
): Promise<void> {
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const url = slide.imageUrl || slide.image_url;
    if (!url) continue;

    const score = await scoreSlideDesign(url, slide, options);
    if (score) {
      (slide as any).qa_score = score.total;
      (slide as any).qa_breakdown = score;
      console.log(
        `[vision-scorer] Slide ${i} scored ${score.total}/100 — ${score.feedback}`,
      );
    } else {
      console.warn(`[vision-scorer] Slide ${i} scoring returned null — skipping`);
    }
  }
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

function parseScore(raw: string): QAScore | null {
  try {
    // The model may wrap JSON in markdown fences — strip them.
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate expected shape
    if (
      typeof parsed.total !== "number" ||
      typeof parsed.brand_consistency !== "number" ||
      typeof parsed.readability !== "number" ||
      typeof parsed.composition !== "number" ||
      typeof parsed.content_relevance !== "number" ||
      typeof parsed.feedback !== "string"
    ) {
      console.warn("[vision-scorer] Unexpected score shape:", parsed);
      return null;
    }

    // Clamp values to valid ranges
    return {
      total: clamp(parsed.total, 0, 100),
      brand_consistency: clamp(parsed.brand_consistency, 0, 25),
      readability: clamp(parsed.readability, 0, 25),
      composition: clamp(parsed.composition, 0, 25),
      content_relevance: clamp(parsed.content_relevance, 0, 25),
      feedback: parsed.feedback.slice(0, 500),
    };
  } catch (error) {
    console.warn("[vision-scorer] Failed to parse score JSON:", error, raw?.slice(0, 200));
    return null;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

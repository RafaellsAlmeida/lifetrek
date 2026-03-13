/**
 * OpenRouter Image Generator
 * 
 * Final fallback using OpenRouter's model aggregation.
 * Attempts multiple models in priority order.
 * 
 * @module generators/openrouter
 */

import { executeWithCostTracking } from "../../_shared/costTracking.ts";
import type { CostTrackingContext } from "../types.ts";

declare const Deno: any;

/** Models to try in order of preference */
const MODELS_TO_TRY = [
    // Free/Preview Tier (Fastest)
    "google/gemini-2.0-flash-exp:free",
    "google/gemini-2.0-flash-001",

    // High Quality Tier
    "google/gemini-2.0-pro-exp-02-05",
    "black-forest-labs/flux-1.1-pro",
    "black-forest-labs/flux-dev",

    // Standard Tier
    "stabilityai/stable-diffusion-3-medium",
    "openai/dall-e-3",

    // Legacy/Stable Fallbacks
    "google/gemini-flash-1.5"
];

/**
 * Generate an image using OpenRouter
 * 
 * Tries multiple models in sequence until one succeeds.
 * Useful when direct Gemini API is unavailable or rate-limited.
 * 
 * @param prompt - Full brand-compliant prompt
 * @param apiKey - OpenRouter API key
 * @returns Base64 data URL or null
 */
export async function generateWithOpenRouter(
    prompt: string,
    apiKey: string,
    tracking?: CostTrackingContext,
): Promise<string | null> {
    if (!apiKey) {
        console.warn("[OPENROUTER] No API key configured, skipping");
        return null;
    }

    for (const model of MODELS_TO_TRY) {
        try {
            console.log(`[OPENROUTER] Trying model: ${model}...`);

            const executeCall = async () => {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://lifetrek.io",
                        "X-Title": "Lifetrek Content Generator"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            {
                                role: "user",
                                // Adjust prompt based on model type
                                content: model.includes('gemini') || model.includes('gpt')
                                    ? prompt + "\n\nGenerate this image. Output ONLY the image, no text."
                                    : prompt // Pure image models (Flux, SD) just need the prompt
                            }
                        ],
                        // Request image output if supported
                        response_format: { type: "image" }
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`OpenRouter Image Error (${response.status}): ${errText}`);
                }

                return await response.json();
            };

            const data = tracking?.supabase
                ? await executeWithCostTracking(
                    tracking.supabase,
                    {
                        userId: tracking.userId || null,
                        operation: tracking.operation,
                        service: "openrouter",
                        model,
                        estimatedCost: tracking.estimatedCost,
                        metadata: {
                            ...(tracking.metadata || {}),
                            fallback_provider: "openrouter",
                        },
                    },
                    executeCall,
                )
                : await executeCall();

            // Check if response contains image data
            const content = data.choices?.[0]?.message?.content;

            // Some models return base64 image directly
            if (content && typeof content === "string") {
                if (content.startsWith("data:image/")) {
                    console.log(`[OPENROUTER] ✅ Image generated with ${model}`);
                    return content;
                }
                // Check for raw base64 pattern
                if (content.match(/^[A-Za-z0-9+/=]{100,}$/)) {
                    console.log(`[OPENROUTER] ✅ Image generated with ${model} (raw base64)`);
                    return `data:image/png;base64,${content}`;
                }
            }

            // Check for image in multimodal response
            if (data.choices?.[0]?.message?.images?.[0]) {
                const imgData = data.choices[0].message.images[0];
                console.log(`[OPENROUTER] ✅ Image generated with ${model}`);
                return imgData.startsWith("data:") ? imgData : `data:image/png;base64,${imgData}`;
            }

            console.warn(`[OPENROUTER] ${model} returned no image data`);
        } catch (e) {
            console.warn(`[OPENROUTER] ${model} exception: ${e}`);
        }
    }

    console.error("[OPENROUTER] All models failed");
    return null;
}

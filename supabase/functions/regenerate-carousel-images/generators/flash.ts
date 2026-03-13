/**
 * Gemini Flash Image Generator
 * 
 * Faster alternative to Nano Banana Pro.
 * Used as fallback when Pro model fails or times out.
 * 
 * @module generators/flash
 */

import { executeWithCostTracking } from "../../_shared/costTracking.ts";
import type { CostTrackingContext } from "../types.ts";

declare const Deno: any;

/**
 * Generate an image using Gemini 2.5 Flash Image
 * 
 * This is faster than Pro but has fewer capabilities:
 * - No reference image support
 * - Simpler compositions
 * - Good for quick iterations
 * 
 * @param prompt - Full brand-compliant prompt
 * @param aspectRatio - Output aspect ratio  
 * @param apiKey - Gemini API key
 * @param fallbackFn - Fallback function (e.g., OpenRouter)
 * @returns Base64 data URL or null
 */
export async function generateWithFlash(
    prompt: string,
    aspectRatio: string,
    apiKey: string,
    fallbackFn?: (prompt: string) => Promise<string | null>,
    tracking?: CostTrackingContext,
): Promise<string | null> {
    const MODEL = "gemini-2.5-flash-image";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
            imageConfig: {
                aspectRatio: aspectRatio
            }
        }
    };

    try {
        console.log(`[FLASH] Calling Gemini Flash...`);

        const executeCall = async () => {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini Flash Image Error (${response.status}): ${errText}`);
            }

            return await response.json();
        };

        const data = tracking?.supabase
            ? await executeWithCostTracking(
                tracking.supabase,
                {
                    userId: tracking.userId || null,
                    operation: tracking.operation,
                    service: "gemini",
                    model: MODEL,
                    estimatedCost: tracking.estimatedCost,
                    metadata: {
                        ...(tracking.metadata || {}),
                        aspect_ratio: aspectRatio,
                    },
                },
                executeCall,
            )
            : await executeCall();
        const candidate = data.candidates?.[0]?.content?.parts || [];

        for (const part of candidate) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
                console.log(`[FLASH] ✅ Image generated`);
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        console.warn("[FLASH] No image in response");
        if (fallbackFn) {
            return fallbackFn(prompt);
        }
        return null;
    } catch (e) {
        console.error(`[FLASH] Exception: ${e}`);
        if (fallbackFn) {
            return fallbackFn(prompt);
        }
        return null;
    }
}

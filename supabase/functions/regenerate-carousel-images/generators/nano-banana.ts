/**
 * Nano Banana Pro Image Generator (Gemini 3 Pro Image Preview)
 * 
 * Premium image generation with:
 * - Up to 14 reference images for brand consistency
 * - 4K resolution support
 * - Advanced text rendering (glassmorphism, overlays)
 * - Thinking mode for complex compositions
 * 
 * @module generators/nano-banana
 */

import type { ReferenceImage } from "../types.ts";

declare const Deno: any;

/**
 * Generate an image using Nano Banana Pro (Gemini 3 Pro)
 * 
 * This is the primary generator for high-quality brand assets.
 * Falls back to Flash model on error.
 * 
 * @param prompt - Full brand-compliant prompt
 * @param references - Brand reference images (max 6 for optimal results)
 * @param aspectRatio - Output aspect ratio ('3:4', '16:9', '4:5', etc)
 * @param apiKey - Gemini API key
 * @param fallbackFn - Fallback function if generation fails
 * @returns Base64 data URL or null
 */
export async function generateWithNanoBanana(
    prompt: string,
    references: ReferenceImage[],
    aspectRatio: string,
    apiKey: string,
    fallbackFn?: (prompt: string) => Promise<string | null>
): Promise<string | null> {
    // Nano Banana Pro for professional asset production
    const MODEL = "gemini-3-pro-image-preview";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    // Build content parts: text prompt + reference images
    const parts: any[] = [{ text: prompt }];

    // Add reference images (up to 6 objects with high fidelity per docs)
    // More than 6 may cause confusion in the output
    for (const ref of references.slice(0, 6)) {
        parts.push({
            inlineData: {
                mimeType: ref.mimeType,
                data: ref.data
            }
        });
    }

    const requestBody = {
        contents: [{ parts }],
        generationConfig: {
            // Request both image and text output
            responseModalities: ["IMAGE", "TEXT"],
            imageConfig: {
                aspectRatio: aspectRatio
                // Default resolution (1K) to avoid huge Base64 strings crashing Satori
            }
        }
    };

    try {
        console.log(`[NANO-BANANA] Calling Gemini 3 Pro with ${references.length} references...`);

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[NANO-BANANA] API error: ${response.status} - ${errText}`);

            // Fallback to faster model
            if (fallbackFn) {
                return fallbackFn(prompt);
            }
            return null;
        }

        const data = await response.json();

        // Extract image from response
        // Skip "thought images" (part.thought === true) as they are internal
        const candidate = data.candidates?.[0]?.content?.parts || [];
        for (const part of candidate) {
            // Skip thought/planning images
            if (part.thought) continue;

            if (part.inlineData?.mimeType?.startsWith("image/")) {
                console.log(`[NANO-BANANA] ✅ Image generated successfully`);
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        console.warn("[NANO-BANANA] No image in response, trying fallback...");
        if (fallbackFn) {
            return fallbackFn(prompt);
        }
        return null;
    } catch (e) {
        console.error(`[NANO-BANANA] Exception: ${e}`);
        if (fallbackFn) {
            return fallbackFn(prompt);
        }
        return null;
    }
}

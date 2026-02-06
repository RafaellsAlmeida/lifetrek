
/**
 * Shared utility for Nano Banana Pro (Gemini 3 Pro Image)
 * Optimized for professional asset production with thinking process.
 */

export async function generateGeminiImage(prompt: string, options: {
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
    imageSize?: "1K" | "2K" | "4K";
    negativePrompt?: string;
} = {}) {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not set in environment");
    }

    // Acceptance Criteria Infusion
    const acceptancePrompt = `
    INSTRUCTIONS FOR PROFESSIONAL ASSET:
    - Target: High-end medical device manufacturing (Lifetrek Brand).
    - Identity: Premium, trust-focused, minimalist, modern.
    - Quality: No wording mistakes, direct visual impact.
    - Logo Policy: Use correct Lifetrek logo or no logo at all.
    - Environment: Cleanroom, lab, or high-tech office.
    
    PROMPT: ${prompt}
    
    ${options.negativePrompt ? `NEVATIVE CONSTRAINTS: ${options.negativePrompt}` : ""}
  `.trim();

    try {
        // Using v1beta for preview features like gemini-3-pro-image-preview
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: acceptancePrompt }]
                    }
                ],
                generationConfig: {
                    responseModalities: ["IMAGE"],
                    imageConfig: {
                        aspectRatio: options.aspectRatio || "1:1",
                        imageSize: options.imageSize || "1K"
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API Error (${response.status}):`, errorText);
            throw new Error(`Gemini Image Generation Failed: ${response.status}`);
        }

        const result = await response.json();

        // The response can contain multiple parts (thoughts + final image)
        const candidates = result.candidates || [];
        if (candidates.length === 0) throw new Error("No candidates in Gemini response");

        const parts = candidates[0].content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData);

        if (!imagePart) {
            throw new Error("No image data found in Gemini response parts");
        }

        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

    } catch (error) {
        console.error("Critical Gemini Generation Failure:", error);
        throw error;
    }
}

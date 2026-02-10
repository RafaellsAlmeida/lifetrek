/**
 * Hybrid Workflow: AI Background + Satori Overlay
 * 
 * @module workflows/hybrid
 */

import { generateWithNanoBanana } from "../generators/nano-banana.ts";
import { generateWithFlash } from "../generators/flash.ts";
import { generateWithOpenRouter } from "../generators/openrouter.ts";
import { generateOverlay } from "../generators/satori.ts";
import { buildBackgroundPrompt } from "../prompts/brand-prompt.ts";
import { loadImageAsBase64, uploadImage, getPlaceholderUrl } from "../utils/storage.ts";
import type { SlideData, ReferenceImage, PlatformConfig } from "../types.ts";

declare const Deno: any;

/**
 * Process a single slide using Hybrid Mode
 */
export async function processSlideHybrid(
    slide: SlideData,
    index: number,
    totalSlides: number,
    carouselId: string,
    platform: PlatformConfig,
    styleReference: string,
    referenceImages: ReferenceImage[],
    apiKey: string,
    openRouterKey: string,
    supabase: any
): Promise<SlideData> {
    const slideNum = index + 1;
    console.log(`[HYBRID] [${slideNum}/${totalSlides}] Processing: "${slide.headline}"`);
    const slideStart = Date.now();

    // 1. Generate Background Prompt (No Text)
    const prompt = buildBackgroundPrompt(
        slide,
        slideNum,
        totalSlides,
        platform,
        styleReference
    );

    // 2. Generate Background Image (AI)
    const createGenerator = () => {
        const openRouterFallback = (prompt: string) =>
            generateWithOpenRouter(prompt, openRouterKey || '');

        const flashFallback = (prompt: string) =>
            generateWithFlash(prompt, platform.aspectRatio, apiKey || '', openRouterFallback);

        return (prompt: string, refs: ReferenceImage[]) =>
            generateWithNanoBanana(prompt, refs, platform.aspectRatio, apiKey || '', flashFallback);
    };

    const generateImage = createGenerator();
    let imageUrl = await generateImage(prompt, referenceImages);

    if (!imageUrl) {
        console.error(`[HYBRID] [${slideNum}] ❌ Background generation failed`);
        slide.imageUrl = getPlaceholderUrl(slide.headline || 'Gen Failed');
        return slide;
    }

    // 3. Render Overlay with Satori (Text + Logo + Badge)
    try {
        console.log(`[HYBRID] [${slideNum}] Compositing text overlay...`);

        // Define sizes based on aspect ratio (Reduced to 720px width to save Edge Function memory)
        let width = 720;
        let height = 900; // 4:5 default

        if (platform.aspectRatio === "3:4") height = 960;
        if (platform.aspectRatio === "16:9") { width = 1280; height = 720; }

        const compositeBuffer = await generateOverlay(
            slide,
            imageUrl, // Pass base64 background
            width,
            height
        );

        // Convert Uint8Array back to Base64 for upload
        // We can upload Buffer directly usually, but our uploadImage util expects Base64 string currently
        // Let's modify validAssets loop to load logo/iso if needed for Satori inside generateOverlay
        // Actually generateOverlay handles downloading logos if passed as URLs.

        // Convert buffer to base64
        const binary = String.fromCharCode(...compositeBuffer);
        const base64Composite = btoa(binary);
        const finalDataUrl = `data:image/png;base64,${base64Composite}`;

        imageUrl = finalDataUrl;
        console.log(`[HYBRID] [${slideNum}] ✅ Composite created`);

    } catch (e) {
        console.error(`[HYBRID] [${slideNum}] ⚠️ Satori composite failed: ${e}`);
        // Fallback to just the AI background (better than nothing)
    }

    // 4. Upload Final Image
    const fileName = `hybrid-${carouselId.slice(0, 8)}-${platform.isBlog ? 'cover' : platform.isResource ? 'resource' : 's' + slideNum
        }-${Date.now()}.png`;

    const publicUrl = await uploadImage(supabase, imageUrl, fileName);

    if (publicUrl) {
        slide.imageUrl = publicUrl;
        slide.image_url = publicUrl;
        console.log(`[HYBRID] [${slideNum}] ✅ Done in ${Date.now() - slideStart}ms`);
    } else {
        slide.imageUrl = getPlaceholderUrl(slide.headline || 'Error');
        slide.image_url = slide.imageUrl;
    }

    return slide;
}

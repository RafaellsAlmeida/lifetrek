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

    // 2.5 Upload Background to Storage (CRITICAL FIX for Satori Stack Overflow)
    // Passing large Base64 strings to Satori's VDOM causes recursion limit errors.
    // We must upload the image first and pass a clean URL.
    const bgFileName = `hybrid-bg-${carouselId.slice(0, 8)}-${slideNum}-${Date.now()}.png`;
    const bgPublicUrl = await uploadImage(supabase, imageUrl, bgFileName);

    if (!bgPublicUrl) {
        console.error(`[HYBRID] [${slideNum}] ❌ Background upload failed, skipping overlay`);
        slide.imageUrl = getPlaceholderUrl(slide.headline || 'Upload Failed');
        return slide;
    }

    console.log(`[HYBRID] [${slideNum}] ✅ Background uploaded: ${bgPublicUrl}`);

    // 3. Render Overlay with Satori (Text + Logo + Badge)
    try {
        console.log(`[HYBRID] [${slideNum}] Compositing text overlay...`);

        // Define sizes based on aspect ratio
        let width = 720; // Reduced width
        let height = 900; // 4:5 default

        // OPTIMIZATION: Use Supabase properties to resize image for Satori
        // Satori crashes with 4K images. We transform it to ~720px width using Supabase Image Transformation.
        // URL structure: .../object/public/... -> .../render/image/public/...
        let satoriBgUrl = bgPublicUrl;
        if (bgPublicUrl.includes('/object/public/')) {
            satoriBgUrl = bgPublicUrl.replace('/object/public/', '/render/image/public/') +
                `?width=${width}&height=${height}&resize=cover&quality=60`;
        }

        console.log(`[HYBRID] [${slideNum}] Optimized BG for Satori: ${satoriBgUrl}`);

        const compositeBuffer = await generateOverlay(
            slide,
            satoriBgUrl,
            width,
            height
        );

        // Convert buffer to base64
        const binary = String.fromCharCode(...compositeBuffer);
        const base64Composite = btoa(binary);
        imageUrl = `data:image/png;base64,${base64Composite}`;
        console.log(`[HYBRID] [${slideNum}] ✅ Composite created`);

    } catch (e) {
        console.error(`[HYBRID] [${slideNum}] ⚠️ Satori composite failed: ${e}`);
        // Fallback to just the AI background (uploaded as bgPublicUrl, but we need to return it as imageUrl logic below handles it)
        // If we fail here, imageUrl is still the original Base64.
        // Or we can set it to bgPublicUrl?
        // Let's stick with original behavior: if composite fails, use the original (AI generated) image.
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

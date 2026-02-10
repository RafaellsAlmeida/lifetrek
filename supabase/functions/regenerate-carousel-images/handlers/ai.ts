/**
 * AI Handler
 * 
 * Handles "Pure AI" generation mode.
 * 
 * @module handlers/ai
 */

import { SlideData, PlatformConfig, ReferenceImage } from "../types.ts";
import { generateWithNanoBanana } from "../generators/nano-banana.ts";
import { generateWithFlash } from "../generators/flash.ts";
import { generateWithOpenRouter } from "../generators/openrouter.ts";
import { buildBrandPrompt } from "../prompts/brand-prompt.ts";
import { loadImageAsBase64, uploadImage, getPlaceholderUrl } from "../utils/storage.ts";
import { AssetLoader } from "../utils/assets.ts";

declare const Deno: any;

export async function handleAiGeneration(
    slides: SlideData[],
    carouselId: string,
    platform: PlatformConfig,
    assetLoader: AssetLoader,
    supabase: any
): Promise<SlideData[]> {
    const processedSlides: SlideData[] = [];
    const styleReference = assetLoader.getStyleReference();

    // Load reference images for AI (generic facility/equipment, NO logos)
    const brandAssetUrls = assetLoader.getBrandAssetsForGen();
    const referenceImages: ReferenceImage[] = [];

    for (const url of brandAssetUrls) {
        if (url) {
            const ref = await loadImageAsBase64(url, "reference");
            if (ref) referenceImages.push(ref);
        }
    }

    console.log(`[AI_HANDLER] Loaded ${referenceImages.length} reference images`);

    // Get API Keys
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("OPEN_ROUTER_API_KEY");

    const createGenerator = () => {
        const openRouterFallback = (prompt: string) =>
            generateWithOpenRouter(prompt, OPENROUTER_API_KEY || '');

        const flashFallback = (prompt: string) =>
            generateWithFlash(prompt, platform.aspectRatio, GEMINI_API_KEY || '', openRouterFallback);

        return (prompt: string, refs: ReferenceImage[]) =>
            generateWithNanoBanana(prompt, refs, platform.aspectRatio, GEMINI_API_KEY || '', flashFallback);
    };

    const generateImage = createGenerator();

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideNum = i + 1;

        console.log(`[AI_HANDLER] [${slideNum}/${slides.length}] Processing: "${slide.headline}"`);
        const slideStart = Date.now();

        // Build prompt (AI needs to bake in logos/badges if requested, though it's bad at it)
        const prompt = buildBrandPrompt(
            slide,
            slideNum,
            slides.length,
            platform,
            styleReference
        );

        const imageUrl = await generateImage(prompt, referenceImages);

        if (imageUrl) {
            const fileName = `ai-${carouselId.slice(0, 8)}-${platform.isBlog ? 'cover' : 's' + slideNum}-${Date.now()}.png`;
            const publicUrl = await uploadImage(supabase, imageUrl, fileName);

            if (publicUrl) {
                slide.imageUrl = publicUrl;
                slide.image_url = publicUrl;
                console.log(`[AI_HANDLER] [${slideNum}] ✅ Done in ${Date.now() - slideStart}ms`);
            } else {
                slide.imageUrl = getPlaceholderUrl(slide.headline || 'Error');
            }
        } else {
            console.error(`[AI_HANDLER] [${slideNum}] ❌ Generation failed`);
            slide.imageUrl = getPlaceholderUrl(slide.headline || 'Gen Failed');
        }

        processedSlides.push(slide);

        if (i < slides.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    return processedSlides;
}

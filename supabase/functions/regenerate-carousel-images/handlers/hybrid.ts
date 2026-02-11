/**
 * Hybrid Handler
 * 
 * Handles "Hybrid" generation mode (AI Background + Satori Overlay).
 * 
 * @module handlers/hybrid
 */

import { SlideData, PlatformConfig, ReferenceImage } from "../types.ts";
import { generateWithNanoBanana } from "../generators/nano-banana.ts";
// import { generateWithFlash } from "../generators/flash.ts"; // Unused in optimized flow but kept for consistency if needed
import { generateWithOpenRouter } from "../generators/openrouter.ts";
import { generateOverlay } from "../generators/satori.ts";
import { buildBackgroundPrompt } from "../prompts/brand-prompt.ts";
import { loadImageAsBase64, uploadImage, getPlaceholderUrl } from "../utils/storage.ts";
import { AssetLoader } from "../utils/assets.ts";
import type { createClient } from "npm:@supabase/supabase-js@2.75.0";

declare const Deno: any;

// Helper to chunk base64 data to avoid stack overflow
function chunkBase64(buffer: Uint8Array): string {
    let binary = '';
    const chunkSize = 8192;
    for (let offset = 0; offset < buffer.length; offset += chunkSize) {
        const chunk = buffer.subarray(offset, offset + chunkSize);
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binary);
}

export async function handleHybridGeneration(
    slides: SlideData[],
    carouselId: string,
    platform: PlatformConfig,
    assetLoader: AssetLoader,
    supabase: ReturnType<typeof createClient>
): Promise<SlideData[]> {
    const processedSlides: SlideData[] = [];
    const styleReference = assetLoader.getStyleReference();

    // Load reference images
    const brandAssetUrls = assetLoader.getBrandAssetsForGen();
    const referenceImages: ReferenceImage[] = [];
    for (const url of brandAssetUrls) {
        if (url) {
            const ref = await loadImageAsBase64(url, "reference");
            if (ref) referenceImages.push(ref);
        }
    }

    // Get API Keys
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("OPEN_ROUTER_API_KEY");

    // Generator factory
    const createGenerator = () => {
        const openRouterFallback = (p: string) =>
            generateWithOpenRouter(p, OPENROUTER_API_KEY || '');

        // If Gemini key is provided but looks like an OpenAI/OpenRouter key (sk-...), 
        // redirect to OpenRouter directly
        if (GEMINI_API_KEY?.startsWith('sk-') && !OPENROUTER_API_KEY) {
            console.log("[HYBRID_HANDLER] 💡 Gemini key looks like OpenRouter/OpenAI key, using for OpenRouter.");
            return (p: string, _refs: ReferenceImage[]) => generateWithOpenRouter(p, GEMINI_API_KEY);
        }

        return (prompt: string, refs: ReferenceImage[]) =>
            generateWithNanoBanana(prompt, refs, platform.aspectRatio, GEMINI_API_KEY || '', openRouterFallback);
    };

    const generateImage = createGenerator();

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideNum = i + 1;
        const isFirst = i === 0;
        const isLast = i === slides.length - 1;

        console.log(`[HYBRID_HANDLER] [${slideNum}/${slides.length}] Processing: "${slide.headline}"`);
        const slideStart = Date.now();

        // 1. Prepare Slide Metadata (Badges, Logos)
        slide.showLogo = isFirst || isLast;
        slide.showISOBadge = isLast || slide.type === 'cta';

        // Use AssetLoader to get the CORRECT assets
        const logoUrl = assetLoader.getLogo();
        const isoUrl = assetLoader.getIsoBadge("iso 13485");

        if (logoUrl) slide.logoUrl = logoUrl;
        if (isoUrl) slide.isoUrl = isoUrl;

        // 2. Generate Background (AI)
        const prompt = buildBackgroundPrompt(
            slide,
            slideNum,
            slides.length,
            platform,
            styleReference
        );

        let imageUrl = await generateImage(prompt, referenceImages);

        if (!imageUrl) {
            console.error(`[HYBRID_HANDLER] [${slideNum}] ❌ Background generation failed`);
            slide.imageUrl = getPlaceholderUrl(slide.headline || 'Gen Failed');
            processedSlides.push(slide);
            continue;
        }

        // 3. Upload Background (to get clean URL for Satori)
        const bgFileName = `hybrid-bg-${carouselId.slice(0, 8)}-${slideNum}-${Date.now()}.png`;
        const bgPublicUrl = await uploadImage(supabase, imageUrl, bgFileName);

        if (!bgPublicUrl) {
            console.error(`[HYBRID_HANDLER] ❌ Background upload failed`);
            slide.imageUrl = getPlaceholderUrl(slide.headline || 'Upload Failed');
            processedSlides.push(slide);
            continue;
        }

        // 4. Generate Overlay (Satori)
        try {
            console.log(`[HYBRID_HANDLER] Compositing overlay...`);

            // Resize for Satori optimization
            let satoriBgUrl = bgPublicUrl;
            if (bgPublicUrl.includes('/object/public/')) {
                satoriBgUrl = bgPublicUrl.replace('/object/public/', '/render/image/public/') +
                    `?width=720&height=900&resize=cover&quality=60`;
            }

            // Note: We need to update generateOverlay to accept iso/logo blobs if we want to embed them?
            // For now, Satori generator in satori.ts excludes them to avoid stack overflow. 
            // We will trust the current satori.ts implementation which renders text over BG.

            const compositeBuffer = await generateOverlay(
                slide,
                satoriBgUrl,
                720,
                900
            );

            // Convert buffer to base64
            const base64Composite = chunkBase64(compositeBuffer);
            imageUrl = `data:image/png;base64,${base64Composite}`;

            console.log(`[HYBRID_HANDLER] ✅ Composite created`);

        } catch (e) {
            console.error(`[HYBRID_HANDLER] ⚠️ Composite failed: ${e}`);
            // Fallback to background only
        }

        // 5. Upload Final
        const fileName = `hybrid-${carouselId.slice(0, 8)}-${platform.isBlog ? 'cover' : 's' + slideNum}-${Date.now()}.png`;
        const publicUrl = await uploadImage(supabase, imageUrl, fileName);

        if (publicUrl) {
            slide.imageUrl = publicUrl;
            slide.image_url = publicUrl;
            console.log(`[HYBRID_HANDLER] [${slideNum}] ✅ Done in ${Date.now() - slideStart}ms`);
        } else {
            console.error(`[HYBRID_HANDLER] ❌ Final upload failed`);
            slide.imageUrl = getPlaceholderUrl(slide.headline || 'Error');
        }

        processedSlides.push(slide);

        if (i < slides.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    return processedSlides;
}

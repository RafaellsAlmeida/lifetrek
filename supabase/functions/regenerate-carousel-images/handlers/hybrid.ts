/**
 * Hybrid Handler
 *
 * Uses real Lifetrek facility photos as backgrounds (from product_catalog),
 * then composites text overlay via Satori. No AI image generation.
 *
 * @module handlers/hybrid
 */

import { SlideData, PlatformConfig } from "../types.ts";
import { generateOverlay } from "../generators/satori.ts";
import { uploadImage, getPlaceholderUrl } from "../utils/storage.ts";
import { AssetLoader } from "../utils/assets.ts";
import type { createClient } from "npm:@supabase/supabase-js@2.75.0";

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

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const slideNum = i + 1;
        const isFirst = i === 0;
        const isLast = i === slides.length - 1;

        console.log(`[HYBRID_HANDLER] [${slideNum}/${slides.length}] Processing: "${slide.headline}"`);
        const slideStart = Date.now();

        // 1. Prepare slide metadata (badges, logos)
        slide.showLogo = isFirst || isLast;
        slide.showISOBadge = isLast || slide.type === 'cta';

        const logoUrl = assetLoader.getLogo();
        const isoUrl = assetLoader.getIsoBadge("iso 13485");
        if (logoUrl) slide.logoUrl = logoUrl;
        if (isoUrl) slide.isoUrl = isoUrl;

        // 2. Pick real facility photo (semantically matched to slide content)
        const bgPublicUrl = assetLoader.getFacilityPhotoForSlide(i, slide.headline || '', slide.body || '');

        if (!bgPublicUrl) {
            console.error(`[HYBRID_HANDLER] [${slideNum}] ❌ No facility photo found`);
            slide.imageUrl = getPlaceholderUrl(slide.headline || 'No Photo');
            processedSlides.push(slide);
            continue;
        }

        console.log(`[HYBRID_HANDLER] [${slideNum}] 📷 Background: ${bgPublicUrl.split('/').pop()}`);

        // 3. Composite Satori text overlay onto real photo
        const overlaySize = platform.aspectRatio === '1:1'
            ? { width: 1080, height: 1080 }
            : { width: 720, height: 900 };

        // Resize via Supabase image transform to avoid Satori stack overflow on large images
        let satoriBgUrl = bgPublicUrl;
        if (bgPublicUrl.includes('/object/public/')) {
            satoriBgUrl = bgPublicUrl.replace('/object/public/', '/render/image/public/') +
                `?width=${overlaySize.width}&height=${overlaySize.height}&resize=cover&quality=65`;
        }

        let finalImageData: string = bgPublicUrl; // fallback to raw photo if Satori fails

        try {
            const compositeBuffer = await generateOverlay(
                slide,
                satoriBgUrl,
                overlaySize.width,
                overlaySize.height
            );
            finalImageData = `data:image/png;base64,${chunkBase64(compositeBuffer)}`;
            console.log(`[HYBRID_HANDLER] [${slideNum}] ✅ Satori composite done`);
        } catch (e) {
            console.error(`[HYBRID_HANDLER] [${slideNum}] ⚠️ Satori failed, using raw photo: ${e}`);
        }

        // 4. Upload final image
        const fileName = `hybrid-${carouselId.slice(0, 8)}-${platform.isBlog ? 'cover' : 's' + slideNum}-${Date.now()}.png`;
        const publicUrl = await uploadImage(supabase, finalImageData, fileName);

        if (publicUrl) {
            slide.imageUrl = publicUrl;
            slide.image_url = publicUrl;
            console.log(`[HYBRID_HANDLER] [${slideNum}] ✅ Done in ${Date.now() - slideStart}ms`);
        } else {
            console.error(`[HYBRID_HANDLER] [${slideNum}] ❌ Upload failed`);
            slide.imageUrl = getPlaceholderUrl(slide.headline || 'Error');
        }

        processedSlides.push(slide);

        // Short pause between slides (no AI calls needed anymore)
        if (i < slides.length - 1) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    return processedSlides;
}

/**
 * Smart Handler
 *
 * Uses intent classification + semantic scoring to prioritize real Lifetrek assets.
 * Falls back to AI generation when similarity is below intent threshold.
 */

import { SlideData, PlatformConfig, ReferenceImage } from "../types.ts";
import { generateWithNanoBanana } from "../generators/nano-banana.ts";
import { generateWithFlash } from "../generators/flash.ts";
import { generateWithOpenRouter } from "../generators/openrouter.ts";
import { buildBrandPrompt } from "../prompts/brand-prompt.ts";
import { generateOverlay } from "../generators/satori.ts";
import { loadImageAsBase64, uploadImage, getPlaceholderUrl } from "../utils/storage.ts";
import { AssetLoader } from "../utils/assets.ts";

declare const Deno: any;

function chunkBase64(buffer: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let offset = 0; offset < buffer.length; offset += chunkSize) {
    const chunk = buffer.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export async function handleSmartGeneration(
  slides: SlideData[],
  carouselId: string,
  platform: PlatformConfig,
  assetLoader: AssetLoader,
  supabase: any,
  options: {
    topic?: string;
    allowAiFallback?: boolean;
  } = {}
): Promise<SlideData[]> {
  const processedSlides: SlideData[] = [];
  const styleReference = assetLoader.getStyleReference();
  const allowAiFallback = options.allowAiFallback !== false;

  // Build AI generator once for fallback slides.
  const brandAssetUrls = assetLoader.getBrandAssetsForGen();
  const referenceImages: ReferenceImage[] = [];
  for (const url of brandAssetUrls) {
    if (!url) continue;
    const ref = await loadImageAsBase64(url, "reference");
    if (ref) referenceImages.push(ref);
  }

  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY");
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("OPEN_ROUTER_API_KEY");

  const openRouterFallback = (prompt: string) =>
    generateWithOpenRouter(prompt, OPENROUTER_API_KEY || "");

  const flashFallback = (prompt: string) =>
    generateWithFlash(prompt, platform.aspectRatio, GEMINI_API_KEY || "", openRouterFallback);

  const generateImage = (prompt: string, refs: ReferenceImage[]) =>
    generateWithNanoBanana(prompt, refs, platform.aspectRatio, GEMINI_API_KEY || "", flashFallback);

  const usedAssetUrls: string[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideNum = i + 1;
    const isFirst = i === 0;
    const isLast = i === slides.length - 1;

    slide.showLogo = isFirst || isLast;
    slide.showISOBadge = isLast || slide.type === "cta";

    const logoUrl = assetLoader.getLogo();
    const isoUrl = assetLoader.getIsoBadge("iso 13485");
    if (logoUrl) slide.logoUrl = logoUrl;
    if (isoUrl) slide.isoUrl = isoUrl;

    console.log(`[SMART_HANDLER] [${slideNum}/${slides.length}] Processing: "${slide.headline}"`);

    const selection = await assetLoader.getSmartBackgroundForSlide({
      slideIndex: i,
      topic: options.topic,
      headline: slide.headline,
      body: slide.body,
      usedUrls: usedAssetUrls,
      allowAiFallback,
    });

    slide.selection_score = Number(selection.score.toFixed(4));
    slide.selection_reason = selection.reason;
    slide.asset_source = selection.source;
    if (selection.assetId) slide.asset_id = selection.assetId;

    let imageInput: string | null = null;

    if (!selection.useAi && selection.url) {
      usedAssetUrls.push(selection.url);

      const overlaySize =
        platform.aspectRatio === "1:1"
          ? { width: 1080, height: 1080 }
          : { width: 720, height: 900 };

      let satoriBgUrl = selection.url;
      if (selection.url.includes("/object/public/")) {
        satoriBgUrl =
          selection.url.replace("/object/public/", "/render/image/public/") +
          `?width=${overlaySize.width}&height=${overlaySize.height}&resize=cover&quality=70`;
      }

      try {
        const compositeBuffer = await generateOverlay(
          slide,
          satoriBgUrl,
          overlaySize.width,
          overlaySize.height
        );
        imageInput = `data:image/png;base64,${chunkBase64(compositeBuffer)}`;
      } catch (error) {
        console.error(`[SMART_HANDLER] [${slideNum}] Satori failed, falling back to raw selected asset`, error);
        imageInput = selection.url;
      }
    } else {
      const prompt = buildBrandPrompt(
        slide,
        slideNum,
        slides.length,
        platform,
        styleReference
      );

      const aiImage = await generateImage(prompt, referenceImages);
      if (aiImage) {
        imageInput = aiImage;
        slide.asset_source = "ai";
      }
    }

    if (!imageInput) {
      slide.imageUrl = getPlaceholderUrl(slide.headline || "No image");
      slide.image_url = slide.imageUrl;
      processedSlides.push(slide);
      continue;
    }

    const fileName = `smart-${carouselId.slice(0, 8)}-${platform.isBlog ? "cover" : `s${slideNum}`}-${Date.now()}.png`;
    const publicUrl = await uploadImage(supabase, imageInput, fileName);

    if (publicUrl) {
      slide.imageUrl = publicUrl;
      slide.image_url = publicUrl;
      const currentVariants = Array.isArray(slide.image_variants) ? slide.image_variants : [];
      slide.image_variants = [...new Set([...currentVariants, publicUrl])];
    } else {
      slide.imageUrl = getPlaceholderUrl(slide.headline || "Upload failed");
      slide.image_url = slide.imageUrl;
    }

    processedSlides.push(slide);

    if (i < slides.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return processedSlides;
}

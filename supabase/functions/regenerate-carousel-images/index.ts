/**
 * regenerate-carousel-images Edge Function
 * 
 * Main entry point for AI-powered image generation for:
 * - LinkedIn carousels
 * - Instagram posts
 * - Blog covers
 * - Resource mockups
 * 
 * Uses Nano Banana Pro (Gemini 3 Pro) with fallbacks to Flash and OpenRouter.
 * 
 * @version 18 (Refactored)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

// Local module imports
import type {
  SlideData,
  ReferenceImage,
  CarouselData,
  RegenerateRequest,
  StyleTemplate,
  CompanyAsset
} from "./types.ts";
import { initLogging, getLogs } from "./utils/logging.ts";
import { loadImageAsBase64, uploadImage, getPlaceholderUrl } from "./utils/storage.ts";
import { generateWithNanoBanana } from "./generators/nano-banana.ts";
import { generateWithFlash } from "./generators/flash.ts";
import { generateWithOpenRouter } from "./generators/openrouter.ts";
import { buildBrandPrompt, getPlatformConfig } from "./prompts/brand-prompt.ts";
import { processSlideHybrid } from "./workflows/hybrid.ts";

declare const Deno: any;

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Initialize logging for this request
  initLogging();

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const {
      carousel_id,
      batch_mode = false,
      table_name = "linkedin_carousels",
      slide_index,
      mode = "hybrid"
    }: RegenerateRequest & { mode?: 'ai' | 'hybrid' } = await req.json();

    if (!carousel_id) {
      return new Response(
        JSON.stringify({ error: "carousel_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get API keys from environment
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("OPEN_ROUTER_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY && !OPENROUTER_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY or OPENROUTER_API_KEY");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ========================================================================
    // FETCH CAROUSEL/POST DATA
    // ========================================================================
    console.log(`[REGEN] Fetching ${table_name} item ${carousel_id}...`);

    const { data: carousel, error: carouselError } = await supabase
      .from(table_name)
      .select("*")
      .eq("id", carousel_id)
      .single();

    if (carouselError || !carousel) {
      console.error(`[REGEN] Item not found: ${carouselError?.message}`);
      return new Response(
        JSON.stringify({ error: "Item not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log(`[REGEN] ✅ Found: "${carousel.topic}" with ${carousel.slides?.length || 0} slides`);

    // ========================================================================
    // LOAD BRAND ASSETS AND STYLE TEMPLATES
    // ========================================================================
    console.log("[REGEN] Loading brand assets and style templates...");

    // Fetch company assets (facilities, equipment, products)
    const { data: catalogAssets } = await supabase
      .from("product_catalog")
      .select("category, image_url, name, description, metadata")
      .in("category", ["facility", "equipment", "product", "asset"]);

    // Fetch style templates from pgvector table (text only)
    const { data: styleTemplates } = await supabase
      .from("style_embeddings")
      .select("template_name, style_type, description, prompt_used")
      .limit(3);

    // Build style reference text for prompts
    const styleReference = (styleTemplates || [])
      .map((t: StyleTemplate) => `- ${t.style_type?.toUpperCase()}: ${t.description}`)
      .join('\n');

    console.log(`[REGEN] Loaded ${styleTemplates?.length || 0} style templates`);

    // Map to internal format
    const companyAssets: CompanyAsset[] = (catalogAssets || []).map((a: any) => ({
      type: a.category,
      url: a.image_url,
      name: a.name,
      description: a.description
    }));

    // Load reference images (limit to 2 to avoid confusing AI)
    const referenceImages: ReferenceImage[] = [];

    // Filter out logos/badges (they confuse composition)
    const validAssets = companyAssets.filter(a => {
      const n = (a.name || '').toLowerCase();
      const d = (a.description || '').toLowerCase();
      return !n.includes('logo') && !n.includes('iso') && !n.includes('badge') &&
        !d.includes('logo');
    });

    // Load only 2 brand assets as references
    for (const asset of validAssets.slice(0, 2)) {
      if (asset.url) {
        const ref = await loadImageAsBase64(asset.url, asset.type);
        if (ref) referenceImages.push(ref);
      }
    }

    console.log(`[REGEN] Loaded ${referenceImages.length} reference images`);

    // Find logo and badge assets for overlay metadata
    const logoAsset = companyAssets.find(a => a.name?.toLowerCase().includes('logo'));
    const isoAsset = companyAssets.find(a =>
      a.name?.toLowerCase().includes('iso') || a.description?.includes('ISO')
    );

    // ========================================================================
    // PREPARE SLIDES
    // ========================================================================
    let slides: SlideData[] = carousel.slides || [];
    const platform = getPlatformConfig(table_name);

    // Handle specific slide regeneration
    if (typeof slide_index === 'number') {
      console.log(`[REGEN] 🎯 Regenerating specific slide index: ${slide_index}`);
      if (!slides[slide_index]) {
        throw new Error(`Slide index ${slide_index} out of bounds`);
      }
    } else if (slides.length > 5) {
      // Limit to 5 slides for batch mode
      console.log(`[REGEN] ⚠️ Truncating ${slides.length} slides to 5`);
      const hook = slides.find(s => s.type === 'hook') || slides[0];
      const cta = slides.find(s => s.type === 'cta') || slides[slides.length - 1];
      const content = slides.filter(s => s.type === 'content').slice(0, 3);
      slides = [hook, ...content, cta].filter(Boolean).slice(0, 5);
    }

    // For blogs/resources, create a pseudo-slide if none exists
    if ((platform.isBlog || platform.isResource) && slides.length === 0) {
      slides = [{
        headline: carousel.title || carousel.topic,
        body: carousel.excerpt || carousel.description || '',
        type: 'cover',
        imageUrl: carousel.cover_image || carousel.image_url
      }];
    }

    // ========================================================================
    // IMAGE GENERATION
    // ========================================================================

    /**
     * Create a fallback chain for image generation
     */
    const createGenerator = () => {
      // OpenRouter fallback
      const openRouterFallback = (prompt: string) =>
        generateWithOpenRouter(prompt, OPENROUTER_API_KEY || '');

      // Flash fallback (chains to OpenRouter)
      const flashFallback = (prompt: string) =>
        generateWithFlash(prompt, platform.aspectRatio, GEMINI_API_KEY || '', openRouterFallback);

      // Primary generator (chains to Flash)
      return (prompt: string, refs: ReferenceImage[]) =>
        generateWithNanoBanana(prompt, refs, platform.aspectRatio, GEMINI_API_KEY || '', flashFallback);
    };

    const generateImage = createGenerator();

    /**
     * Process a single slide
     */
    async function processSlide(slide: SlideData, index: number): Promise<SlideData> {
      const slideNum = index + 1;
      const isFirst = index === 0;
      const isLast = index === (typeof slide_index === 'number' ? slides.length - 1 : carousel.slides?.length - 1);

      console.log(`[REGEN] [${slideNum}/${slides.length}] Processing: "${slide.headline || carousel.title}"`);
      const slideStart = Date.now();

      // Set overlay metadata
      slide.showLogo = isFirst || isLast;
      slide.showISOBadge = isLast || slide.type === 'cta';
      if (logoAsset?.url) slide.logoUrl = logoAsset.url;
      if (isoAsset?.url) slide.isoUrl = isoAsset.url;

      // Build prompt
      const prompt = buildBrandPrompt(
        slide,
        slideNum,
        slides.length,
        platform,
        styleReference
      );

      // Generate image
      const imageUrl = await generateImage(prompt, referenceImages);

      if (imageUrl) {
        // Upload to Supabase Storage
        const fileName = `regen-${carousel_id.slice(0, 8)}-${platform.isBlog ? 'cover' : platform.isResource ? 'resource' : 's' + slideNum
          }-${Date.now()}.png`;

        const publicUrl = await uploadImage(supabase, imageUrl, fileName);

        if (publicUrl) {
          slide.imageUrl = publicUrl;
          slide.image_url = publicUrl;
          console.log(`[REGEN] [${slideNum}] ✅ Done in ${Date.now() - slideStart}ms`);
        } else {
          // Use placeholder on upload failure
          slide.imageUrl = getPlaceholderUrl(slide.headline || 'Error');
          slide.image_url = slide.imageUrl;
        }
      } else {
        // Use placeholder on generation failure
        console.error(`[REGEN] [${slideNum}] ❌ Generation failed`);
        slide.imageUrl = getPlaceholderUrl(slide.headline || 'Gen Failed');
        slide.image_url = slide.imageUrl;
      }

      return slide;
    }

    // ========================================================================
    // PROCESS ALL SLIDES
    // ========================================================================
    console.log(`[REGEN] Starting generation for ${slides.length} items (Mode: ${mode?.toUpperCase() || 'HYBRID'})...`);

    const processedSlides: SlideData[] = [];

    // Determine which slides to process
    const slidesToProcess = (platform.isBlog || platform.isResource)
      ? [slides[0]]
      : (typeof slide_index === 'number'
        ? [carousel.slides?.[slide_index]]
        : (carousel.slides || []));

    for (let i = 0; i < slidesToProcess.length; i++) {
      const slide = slidesToProcess[i];
      if (!slide) continue;

      const realIndex = (platform.isBlog || platform.isResource)
        ? 0
        : (typeof slide_index === 'number' ? slide_index : i);

      let processed: SlideData;

      if (mode === 'hybrid') {
        processed = await processSlideHybrid(
          slide,
          realIndex,
          slides.length,
          carousel_id,
          platform,
          styleReference,
          referenceImages,
          GEMINI_API_KEY || '',
          OPENROUTER_API_KEY || '',
          supabase
        );
      } else {
        processed = await processSlide(slide, realIndex);
      }

      processedSlides.push(processed);

      // Rate limit delay between slides
      if (i < slidesToProcess.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // ========================================================================
    // UPDATE DATABASE
    // ========================================================================
    let updateData: Record<string, any> = {};
    const generatedUrl = processedSlides[0]?.imageUrl || processedSlides[0]?.image_url;

    if (platform.isBlog && generatedUrl) {
      console.log(`[REGEN] Updating blog cover...`);
      updateData = {
        cover_image: generatedUrl,
        updated_at: new Date().toISOString()
      };
    } else if (platform.isResource && generatedUrl) {
      console.log(`[REGEN] Updating resource image...`);
      updateData = table_name === 'resources'
        ? { thumbnail_url: generatedUrl, updated_at: new Date().toISOString() }
        : { image_url: generatedUrl, updated_at: new Date().toISOString() };
    } else if (typeof slide_index === 'number') {
      // Single slide update
      console.log(`[REGEN] Updating slide ${slide_index}...`);
      const currentSlides = [...(carousel.slides || [])];
      if (currentSlides[slide_index]) {
        currentSlides[slide_index] = processedSlides[0];
        const currentImageUrls = carousel.image_urls || [];
        currentImageUrls[slide_index] = processedSlides[0].imageUrl;

        updateData = {
          slides: currentSlides,
          image_urls: currentImageUrls.filter(Boolean),
          updated_at: new Date().toISOString()
        };
      }
    } else {
      // Batch update
      const imageUrls = processedSlides
        .map(s => s.imageUrl || s.image_url || '')
        .filter(Boolean);

      console.log(`[REGEN] Updating ${imageUrls.length} slides...`);
      updateData = {
        slides: processedSlides,
        image_urls: imageUrls,
        updated_at: new Date().toISOString()
      };
    }

    const { error: updateError } = await supabase
      .from(table_name)
      .update(updateData)
      .eq("id", carousel_id);

    if (updateError) {
      console.error(`[REGEN] DB update failed: ${updateError.message}`);
      return new Response(
        JSON.stringify({ error: "Failed to update", details: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // ========================================================================
    // SUCCESS RESPONSE
    // ========================================================================
    const totalTime = Date.now() - startTime;
    console.log(`[REGEN] ✅✅ COMPLETE: ${processedSlides.length} items, ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        carousel_id,
        slides_regenerated: processedSlides.length,
        images_generated: processedSlides.length,
        reference_images_used: referenceImages.length,
        duration_ms: totalTime,
        logs: getLogs()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    // ========================================================================
    // ERROR RESPONSE
    // ========================================================================
    console.error(`[REGEN] FATAL: ${error}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
        logs: getLogs()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});

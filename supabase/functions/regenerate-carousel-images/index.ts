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
 * @version 19 (Refactored to separate modules)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

// Local module imports
import type {
  SlideData,
  RegenerateRequest,
} from "./types.ts";
import { initLogging, getLogs } from "./utils/logging.ts";
import { AssetLoader } from "./utils/assets.ts";
import { handleAiGeneration } from "./handlers/ai.ts";
import { handleHybridGeneration } from "./handlers/hybrid.ts";

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
    // LOAD BRAND ASSETS AND STYLE TEMPLATES (Refactored)
    // ========================================================================
    const assetLoader = new AssetLoader(supabase);
    await assetLoader.load();


    // ========================================================================
    // PREPARE SLIDES
    // ========================================================================
    let slides: SlideData[] = carousel.slides || [];

    // Determine platform config (mocked here, should move to utils/platform.ts ideally)
    const platform = {
      isBlog: table_name === 'blog_posts',
      isResource: table_name === 'resources' || table_name === 'product_catalog', // product items can be resources
      aspectRatio: table_name === 'instagram_posts' ? '1:1' : '4:5'
    };

    // Handle specific slide regeneration logic
    if (typeof slide_index === 'number') {
      console.log(`[REGEN] 🎯 Regenerating specific slide index: ${slide_index}`);
      if (!slides[slide_index] && !platform.isBlog && !platform.isResource) {
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

    // Determine which slides to process
    const slidesToProcess = (platform.isBlog || platform.isResource)
      ? [slides[0]]
      : (typeof slide_index === 'number'
        ? [carousel.slides?.[slide_index]]
        : (carousel.slides || []));

    // ========================================================================
    // DISPATCH TO HANDLERS
    // ========================================================================
    console.log(`[REGEN] Starting generation for ${slidesToProcess.length} items (Mode: ${mode.toUpperCase()})...`);

    let processedSlides: SlideData[] = [];

    if (mode === 'ai') {
      processedSlides = await handleAiGeneration(slidesToProcess, carousel_id, platform, assetLoader, supabase);
    } else {
      processedSlides = await handleHybridGeneration(slidesToProcess, carousel_id, platform, assetLoader, supabase);
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
      // Single slide update — accumulate in image_variants, never overwrite history
      console.log(`[REGEN] Updating slide ${slide_index}...`);
      const currentSlides = [...(carousel.slides || [])];

      if (currentSlides[slide_index]) {
        const newSlideData = processedSlides[0];
        const newImageUrl = newSlideData.imageUrl || newSlideData.image_url;

        // Preserve all previously generated variants
        const existingVariants: string[] = currentSlides[slide_index].image_variants || [];
        const updatedVariants = newImageUrl
          ? [...existingVariants.filter((v: string) => v !== newImageUrl), newImageUrl]
          : existingVariants;

        currentSlides[slide_index] = {
          ...newSlideData,
          image_variants: updatedVariants.filter(Boolean),
        };

        const currentImageUrls = carousel.image_urls || [];
        currentImageUrls[slide_index] = newImageUrl;

        updateData = {
          slides: currentSlides,
          image_urls: currentImageUrls.filter(Boolean),
          updated_at: new Date().toISOString()
        };
      }
    } else {
      // Batch update — accumulate variants on each slide
      const currentSlides = [...(carousel.slides || [])];
      const imageUrls: string[] = [];

      for (let i = 0; i < processedSlides.length; i++) {
        const newSlideData = processedSlides[i];
        const newImageUrl = newSlideData.imageUrl || newSlideData.image_url;
        const existingVariants: string[] = currentSlides[i]?.image_variants || [];
        const updatedVariants = newImageUrl
          ? [...existingVariants.filter((v: string) => v !== newImageUrl), newImageUrl]
          : existingVariants;

        currentSlides[i] = {
          ...newSlideData,
          image_variants: updatedVariants.filter(Boolean),
        };
        if (newImageUrl) imageUrls.push(newImageUrl);
      }

      console.log(`[REGEN] Updating ${imageUrls.length} slides (with variants)...`);
      updateData = {
        slides: currentSlides,
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
        duration_ms: totalTime,
        mode,
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

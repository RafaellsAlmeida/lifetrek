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
import { handleSmartGeneration } from "./handlers/smart.ts";
import { scoreCarouselDesign } from "./qa/vision-scorer.ts";
import { resolveImageStrategy, resolveImageCount } from "./config/image-strategy.ts";
import type { CostTrackingContext } from "./types.ts";

declare const Deno: any;

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

const isMissingUserRolesTable = (message?: string | null) =>
  Boolean(message && message.includes("Could not find the table 'public.user_roles'"));

function dedupeUrls(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
    )
  );
}

function resolveSlideImageUrl(slide: Record<string, unknown> | null | undefined): string {
  if (!slide) return "";
  const direct = typeof slide.image_url === "string" ? slide.image_url : "";
  const legacy = typeof slide.imageUrl === "string" ? slide.imageUrl : "";
  return direct || legacy || "";
}

function buildVariantSlideUpdate(
  existingSlide: Record<string, unknown>,
  newSlideData: SlideData,
  fallbackImageUrl: string
) {
  const newImageUrl = resolveSlideImageUrl(newSlideData as unknown as Record<string, unknown>);
  const oldImageUrl = resolveSlideImageUrl(existingSlide) || fallbackImageUrl;
  const existingVariants = Array.isArray(existingSlide.image_variants) ? existingSlide.image_variants : [];
  const prevImageUrls = Array.isArray(existingSlide.prev_image_urls) ? existingSlide.prev_image_urls : [];

  return {
    newImageUrl,
    updatedSlide: {
      ...existingSlide,
      ...newSlideData,
      image_url: newImageUrl,
      imageUrl: newImageUrl,
      image_variants: dedupeUrls([...existingVariants, oldImageUrl, newImageUrl]),
      prev_image_urls:
        oldImageUrl && oldImageUrl !== newImageUrl
          ? dedupeUrls([...prevImageUrls, oldImageUrl])
          : dedupeUrls(prevImageUrls),
    },
  };
}

function buildStableImageUrls(
  source: unknown,
  slides: Array<Record<string, unknown>>
): string[] {
  const existing = Array.isArray(source) ? source : [];
  const targetLength = Math.max(existing.length, slides.length);

  return Array.from({ length: targetLength }, (_, index) => {
    const slideUrl = resolveSlideImageUrl(slides[index]);
    const existingUrl = typeof existing[index] === "string" ? existing[index] : "";
    return slideUrl || existingUrl || "";
  });
}

async function assertAdminAccess(req: Request, supabase: any) {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
    throw new HttpError(401, "Missing Authorization bearer token");
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new HttpError(401, "Missing Authorization bearer token");
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    console.error("[REGEN][AUTH] Invalid token:", authError?.message);
    throw new HttpError(401, "Unauthorized");
  }

  const adminPermPromise = user.email
    ? supabase
      .from("admin_permissions")
      .select("permission_level")
      .eq("email", user.email)
      .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [adminPermResult, legacyAdminResult, roleResult] = await Promise.all([
    adminPermPromise,
    supabase.from("admin_users").select("permission_level").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .limit(1),
  ]);

  if (adminPermResult.error) {
    console.warn("[REGEN][AUTH] admin_permissions check failed:", adminPermResult.error.message);
  }
  if (legacyAdminResult.error) {
    console.warn("[REGEN][AUTH] admin_users check failed:", legacyAdminResult.error.message);
  }
  if (roleResult.error && !isMissingUserRolesTable(roleResult.error.message)) {
    console.warn("[REGEN][AUTH] user_roles check failed:", roleResult.error.message);
  }

  const hasRole = Array.isArray(roleResult.data) && roleResult.data.length > 0;
  const isAdmin = Boolean(adminPermResult.data || legacyAdminResult.data || hasRole);
  if (!isAdmin) {
    throw new HttpError(403, "Forbidden: admin access required");
  }

  return user;
}

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
    const rawBody = (await req.json()) as Record<string, unknown>;
    const deletionAttempt =
      rawBody.action === "delete-variant" ||
      rawBody.action === "remove-variant" ||
      rawBody.delete_all_variants === true ||
      Object.prototype.hasOwnProperty.call(rawBody, "delete_variant_url") ||
      Object.prototype.hasOwnProperty.call(rawBody, "remove_variant_url");

    if (deletionAttempt) {
      throw new HttpError(400, "Historical variants are immutable. Select another variant instead of deleting history.");
    }

    // Parse request body
    const {
      carousel_id,
      batch_mode = false,
      table_name = "linkedin_carousels",
      slide_index,
      mode = "hybrid",
      allow_ai_fallback = false
    }: RegenerateRequest = rawBody as unknown as RegenerateRequest;

    const requestedMode: 'ai' | 'hybrid' | 'smart' =
      mode === 'ai' || mode === 'smart' || mode === 'hybrid' ? mode : 'hybrid';

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
    const user = await assertAdminAccess(req, supabase);
    console.log(`[REGEN][AUTH] Authorized admin user ${user.id}`);

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
    const requestTrackingMetadata = {
      carousel_id,
      table_name,
      requested_mode: requestedMode,
      batch_mode: batch_mode === true,
      requested_slide_index: typeof slide_index === "number" ? slide_index : null,
      allow_ai_fallback,
    };

    const assetLoader = new AssetLoader(supabase, {
      supabase,
      userId: user.id,
      operation: "content.regenerate-carousel-images.smart.selection-embedding",
      metadata: requestTrackingMetadata,
    });
    await assetLoader.load();


    // ========================================================================
    // PREPARE SLIDES
    // ========================================================================
    let slides: SlideData[] = carousel.slides || [];

    // Determine platform config
    const platform = {
      isBlog: table_name === 'blog_posts',
      isResource: table_name === 'resources' || table_name === 'product_catalog',
      aspectRatio: table_name === 'instagram_posts' ? '1:1' : '4:5'
    };

    // Resolve image strategy based on content type / format
    const imageStrategy = resolveImageStrategy({
      format: carousel.format,
      tableName: table_name,
      platform: table_name === 'instagram_posts' ? 'instagram' : 'linkedin',
      postType: carousel.post_type,
      slideCount: slides.length,
    });
    console.log(`[REGEN] Image strategy: ${imageStrategy.description} (mode=${imageStrategy.mode}, count=${imageStrategy.imageCount})`);

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
    // If the image strategy says "ai-only" (single-image, blog, feed post),
    // force AI mode regardless of what the user requested — avoids Satori
    // overlay / "frankensteining" multiple images on a standalone post.
    const effectiveMode = imageStrategy.mode === 'ai-only' ? 'ai' : requestedMode;
    const effectiveSlideCount = resolveImageCount(imageStrategy, slidesToProcess.length);

    // For single-image posts, only process the first slide (1 image)
    const actualSlidesToProcess = effectiveSlideCount < slidesToProcess.length
      ? slidesToProcess.slice(0, effectiveSlideCount)
      : slidesToProcess;

    console.log(`[REGEN] Starting generation for ${actualSlidesToProcess.length} items (Mode: ${effectiveMode.toUpperCase()}, Strategy: ${imageStrategy.description})...`);

    let processedSlides: SlideData[] = [];
    const imageGenerationTracking: CostTrackingContext = {
      supabase,
      userId: user.id,
      operation: effectiveMode === "smart"
        ? "content.regenerate-carousel-images.smart.ai-fallback-slide"
        : "content.regenerate-carousel-images.ai.slide",
      metadata: {
        ...requestTrackingMetadata,
        topic: carousel.topic || carousel.title || null,
        total_items_in_request: actualSlidesToProcess.length,
        image_strategy: imageStrategy.description,
        image_strategy_mode: imageStrategy.mode,
      },
    };

    if (effectiveMode === 'ai') {
      processedSlides = await handleAiGeneration(
        actualSlidesToProcess,
        carousel_id,
        platform,
        assetLoader,
        supabase,
        imageGenerationTracking,
      );
    } else if (effectiveMode === 'smart') {
      processedSlides = await handleSmartGeneration(
        actualSlidesToProcess,
        carousel_id,
        platform,
        assetLoader,
        supabase,
        {
          topic: carousel.topic || carousel.title || "",
          allowAiFallback: allow_ai_fallback,
        },
        imageGenerationTracking,
      );
    } else {
      processedSlides = await handleHybridGeneration(actualSlidesToProcess, carousel_id, platform, assetLoader, supabase);
    }

    // ========================================================================
    // VISION QA SCORING (non-blocking — failures won't stop the pipeline)
    // ========================================================================
    try {
      console.log(`[REGEN] Running vision QA scoring on ${processedSlides.length} slides...`);
      await scoreCarouselDesign(processedSlides, { supabase, userId: user.id });
      const avgScore = processedSlides.reduce((sum, s) => sum + (s.qa_score || 0), 0) / processedSlides.length;
      console.log(`[REGEN] QA average score: ${avgScore.toFixed(1)}/100`);
    } catch (qaError) {
      console.warn(`[REGEN] QA scoring failed (non-blocking):`, qaError);
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
        const existingSlide = currentSlides[slide_index] || {};
        const { newImageUrl, updatedSlide } = buildVariantSlideUpdate(
          existingSlide,
          newSlideData,
          Array.isArray(carousel.image_urls) && typeof carousel.image_urls[slide_index] === "string"
            ? carousel.image_urls[slide_index]
            : ""
        );

        currentSlides[slide_index] = updatedSlide;
        const currentImageUrls = buildStableImageUrls(carousel.image_urls, currentSlides as Array<Record<string, unknown>>);
        currentImageUrls[slide_index] = newImageUrl || currentImageUrls[slide_index] || "";

        updateData = {
          slides: currentSlides,
          image_urls: currentImageUrls,
          updated_at: new Date().toISOString()
        };
      }
    } else {
      // Batch update — accumulate variants on each slide
      const currentSlides = [...(carousel.slides || [])];
      const currentImageUrls = buildStableImageUrls(carousel.image_urls, currentSlides as Array<Record<string, unknown>>);

      for (let i = 0; i < processedSlides.length; i++) {
        const newSlideData = processedSlides[i];
        const existingSlide = currentSlides[i] || {};
        const { newImageUrl, updatedSlide } = buildVariantSlideUpdate(
          existingSlide,
          newSlideData,
          typeof currentImageUrls[i] === "string" ? currentImageUrls[i] : ""
        );

        currentSlides[i] = updatedSlide;
        currentImageUrls[i] = newImageUrl || currentImageUrls[i] || "";
      }

      console.log(`[REGEN] Updating ${processedSlides.length} slides (with variants)...`);
      updateData = {
        slides: currentSlides,
        image_urls: currentImageUrls,
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
        mode: requestedMode,
        selections: processedSlides.map((slide, idx) => ({
          index: idx,
          asset_source: slide.asset_source || null,
          selection_score: slide.selection_score ?? null,
          selection_reason: slide.selection_reason || null,
          asset_id: slide.asset_id || null,
          image_url: slide.image_url || slide.imageUrl || null,
        })),
        logs: getLogs()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    // ========================================================================
    // ERROR RESPONSE
    // ========================================================================
    console.error(`[REGEN] FATAL: ${error}`);
    const status = error instanceof HttpError ? error.status : 200;

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
        logs: getLogs()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status }
    );
  }
});

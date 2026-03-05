import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SupportedTable = "linkedin_carousels" | "instagram_posts";

interface SetSlideBackgroundRequest {
  table_name: SupportedTable;
  post_id: string;
  slide_index: number;
  new_image_url: string;
  asset_id?: string;
  source?: "manual";
}

function ensureString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as SetSlideBackgroundRequest;

    const tableName = body.table_name;
    if (tableName !== "linkedin_carousels" && tableName !== "instagram_posts") {
      throw new Error("table_name must be linkedin_carousels or instagram_posts");
    }

    const postId = ensureString(body.post_id, "post_id");
    const newImageUrl = ensureString(body.new_image_url, "new_image_url");

    if (!Number.isInteger(body.slide_index) || body.slide_index < 0) {
      throw new Error("slide_index must be a non-negative integer");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: item, error: fetchError } = await supabase
      .from(tableName)
      .select("id, slides, image_urls")
      .eq("id", postId)
      .single();

    if (fetchError || !item) {
      throw new Error(`Post not found: ${fetchError?.message || "unknown error"}`);
    }

    const slides = Array.isArray(item.slides) ? [...item.slides] : [];
    if (!slides[body.slide_index]) {
      throw new Error(`slide_index ${body.slide_index} is out of bounds`);
    }

    const currentSlide = slides[body.slide_index] || {};
    const currentImageUrls = Array.isArray(item.image_urls) ? [...item.image_urls] : [];

    const oldImageUrl =
      currentSlide.image_url ||
      currentSlide.imageUrl ||
      currentImageUrls[body.slide_index] ||
      null;

    const existingVariants: string[] = Array.isArray(currentSlide.image_variants)
      ? currentSlide.image_variants.filter(Boolean)
      : [];

    const nextVariants = [
      ...existingVariants,
      ...(oldImageUrl ? [oldImageUrl] : []),
      newImageUrl,
    ];

    const dedupedVariants = Array.from(new Set(nextVariants.filter(Boolean)));

    const prevImageUrls: string[] = Array.isArray(currentSlide.prev_image_urls)
      ? currentSlide.prev_image_urls.filter(Boolean)
      : [];

    const nextPrev = oldImageUrl && oldImageUrl !== newImageUrl
      ? Array.from(new Set([...prevImageUrls, oldImageUrl]))
      : prevImageUrls;

    const updatedSlide = {
      ...currentSlide,
      image_url: newImageUrl,
      imageUrl: newImageUrl,
      image_variants: dedupedVariants,
      prev_image_urls: nextPrev,
      asset_source: body.source || "manual",
      asset_id: body.asset_id || currentSlide.asset_id || null,
      selection_reason: "Manual override from UI library",
      updated_at: new Date().toISOString(),
    };

    slides[body.slide_index] = updatedSlide;
    currentImageUrls[body.slide_index] = newImageUrl;

    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        slides,
        image_urls: currentImageUrls,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateError) {
      throw new Error(`Failed to update post: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        table_name: tableName,
        post_id: postId,
        slide_index: body.slide_index,
        old_image_url: oldImageUrl,
        new_image_url: newImageUrl,
        slide: updatedSlide,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[set-slide-background] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

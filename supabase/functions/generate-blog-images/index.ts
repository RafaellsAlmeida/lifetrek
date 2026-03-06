import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  post_ids?: string[];
  limit?: number;
  dry_run?: boolean;
}

function buildPrompt(title: string, excerpt?: string | null): string {
  const safeTitle = title || "Dispositivos médicos de precisão";
  const safeExcerpt = excerpt || "Conteúdo técnico sobre manufatura médica e confiabilidade de processo.";

  return `Create a photorealistic hero image for a technical blog post.

Title: ${safeTitle}
Context: ${safeExcerpt}

Style requirements:
- Industrial medical manufacturing environment
- Precision engineering mood
- Corporate blue visual language
- No text, no letters, no logos, no watermarks
- No human faces
- High detail, professional lighting
- 16:9 composition for blog/social preview`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPEN_ROUTER_API = Deno.env.get("OPEN_ROUTER_API");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }
    if (!OPEN_ROUTER_API) {
      throw new Error("Missing OPEN_ROUTER_API");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization bearer token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as RequestBody;
    const limit = Math.min(Math.max(Number(body.limit || 20), 1), 100);
    const dryRun = Boolean(body.dry_run);
    const postIds = Array.isArray(body.post_ids) ? body.post_ids.filter(Boolean) : [];

    let query = supabase
      .from("blog_posts")
      .select("id, title, excerpt, featured_image, hero_image_url, metadata, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (postIds.length > 0) {
      query = query.in("id", postIds);
    } else {
      query = query.in("status", ["draft", "pending_review", "approved"]);
    }

    const { data: rows, error: rowsError } = await query;
    if (rowsError) {
      throw new Error(`Failed to query blog posts: ${rowsError.message}`);
    }

    const candidates = (rows || []).filter((post: any) => !post.hero_image_url && !post.featured_image);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          candidate_count: candidates.length,
          candidates: candidates.map((post: any) => ({
            id: post.id,
            title: post.title,
            status: post.status,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updated = 0;
    const errors: Array<{ post_id: string; reason: string }> = [];

    for (const post of candidates) {
      try {
        const prompt = buildPrompt(post.title, post.excerpt);
        const imageResponse = await fetch("https://openrouter.ai/api/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPEN_ROUTER_API}`,
            "HTTP-Referer": "https://lifetrek.app",
            "X-Title": "Lifetrek App",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "stabilityai/stable-diffusion-xl-base-1.0",
            prompt,
            n: 1,
            size: "1792x1024",
          }),
        });

        if (!imageResponse.ok) {
          const text = await imageResponse.text();
          throw new Error(`Image generation failed (${imageResponse.status}): ${text}`);
        }

        const imageData = await imageResponse.json();
        const imageUrl = imageData?.data?.[0]?.url;
        if (!imageUrl) {
          throw new Error("No image url returned");
        }

        const metadata = (post.metadata && typeof post.metadata === "object")
          ? post.metadata
          : {};

        const { error: updateError } = await supabase
          .from("blog_posts")
          .update({
            featured_image: imageUrl,
            hero_image_url: imageUrl,
            metadata: {
              ...metadata,
              hero_backfilled_at: new Date().toISOString(),
              hero_backfilled_by: user.id,
              hero_backfill_source: "generate-blog-images",
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        if (updateError) {
          throw new Error(`DB update failed: ${updateError.message}`);
        }

        updated += 1;
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Unknown error";
        errors.push({ post_id: post.id, reason });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: candidates.length,
        updated_count: updated,
        failed_count: errors.length,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[generate-blog-images] error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


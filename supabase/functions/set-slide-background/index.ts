import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

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
    console.error("[set-slide-background][AUTH] Invalid token:", authError?.message);
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
    console.warn("[set-slide-background][AUTH] admin_permissions check failed:", adminPermResult.error.message);
  }
  if (legacyAdminResult.error) {
    console.warn("[set-slide-background][AUTH] admin_users check failed:", legacyAdminResult.error.message);
  }
  if (roleResult.error && !isMissingUserRolesTable(roleResult.error.message)) {
    console.warn("[set-slide-background][AUTH] user_roles check failed:", roleResult.error.message);
  }

  const hasRole = Array.isArray(roleResult.data) && roleResult.data.length > 0;
  const isAdmin = Boolean(adminPermResult.data || legacyAdminResult.data || hasRole);
  if (!isAdmin) {
    throw new HttpError(403, "Forbidden: admin access required");
  }

  return user;
}

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
    const rawBody = (await req.json()) as Record<string, unknown>;
    const deletionAttempt =
      rawBody.action === "delete-variant" ||
      rawBody.action === "remove-variant" ||
      rawBody.delete_all_variants === true ||
      Object.prototype.hasOwnProperty.call(rawBody, "delete_variant_url") ||
      Object.prototype.hasOwnProperty.call(rawBody, "remove_variant_url");

    if (deletionAttempt) {
      throw new Error("Historical variants are immutable. Select another variant instead of deleting history.");
    }

    const body = rawBody as unknown as SetSlideBackgroundRequest;

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
    const user = await assertAdminAccess(req, supabase);
    console.log(`[set-slide-background][AUTH] Authorized admin user ${user.id}`);

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
    const oldImageUrl = resolveSlideImageUrl(currentSlide) || currentImageUrls[body.slide_index] || null;
    const existingVariants = Array.isArray(currentSlide.image_variants) ? currentSlide.image_variants : [];
    const prevImageUrls = Array.isArray(currentSlide.prev_image_urls) ? currentSlide.prev_image_urls : [];

    const updatedSlide = {
      ...currentSlide,
      image_url: newImageUrl,
      imageUrl: newImageUrl,
      image_variants: dedupeUrls([...existingVariants, oldImageUrl, newImageUrl]),
      prev_image_urls:
        oldImageUrl && oldImageUrl !== newImageUrl
          ? dedupeUrls([...prevImageUrls, oldImageUrl])
          : dedupeUrls(prevImageUrls),
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
    const status = error instanceof HttpError ? error.status : 400;
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status,
      }
    );
  }
});

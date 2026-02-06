import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Capture logs for UI display
const __regenLogs: string[] = [];
const stringify = (v: unknown) => {
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
};
const record = (level: "info" | "warn" | "error", args: unknown[]) => {
  __regenLogs.push(`[${level}] ${args.map(stringify).join(" ")}`);
};

const _log = console.log.bind(console);
const _warn = console.warn.bind(console);
const _error = console.error.bind(console);
console.log = (...args: unknown[]) => { record("info", args); _log(...args); };
console.warn = (...args: unknown[]) => { record("warn", args); _warn(...args); };
console.error = (...args: unknown[]) => { record("error", args); _error(...args); };

// ============================================================================
// NANO BANANA PRO (Gemini 3 Pro Image Preview)
// - Up to 14 reference images for brand consistency
// - 4K resolution support
// - Advanced text rendering
// - Thinking mode for complex compositions
// ============================================================================

interface SlideData {
  headline: string;
  body: string;
  type: string;
  imageUrl?: string;
  image_url?: string;
  showLogo?: boolean;
  showISOBadge?: boolean;
  logoPosition?: string;
  logoUrl?: string;
  isoUrl?: string;
}

interface ReferenceImage {
  mimeType: string;
  data: string; // base64
  purpose: string;
}

serve(async (req: Request) => {
  __regenLogs.length = 0;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { carousel_id, batch_mode = false, table_name = "linkedin_carousels" } = await req.json();

    if (!carousel_id) {
      return new Response(
        JSON.stringify({ error: "carousel_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch carousel/post
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

    console.log(`[REGEN] ✅ Found item: "${carousel.topic}" with ${carousel.slides?.length || 0} slides`);

    // ========================================================================
    // LOAD REFERENCE IMAGES (Brand Assets)
    // Nano Banana Pro supports up to 14 reference images
    // ========================================================================
    console.log("[REGEN] Loading brand reference images from product_catalog...");

    // @ts-ignore
    const { data: catalogAssets } = await supabase
      .from("product_catalog")
      .select("category, image_url, name, description")
      .in("category", ["facility", "equipment", "product", "asset"]);

    // Map to expected format
    const companyAssets = (catalogAssets || []).map((a: any) => ({
      type: a.category,
      url: a.image_url,
      name: a.name,
      description: a.description
    }));

    const referenceImages: ReferenceImage[] = [];

    // Download and convert assets to base64 for Gemini API
    async function loadImageAsBase64(url: string, purpose: string): Promise<ReferenceImage | null> {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const buffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const contentType = response.headers.get("content-type") || "image/png";

        return { mimeType: contentType, data: base64, purpose };
      } catch (e) {
        console.warn(`[REGEN] Failed to load reference image: ${url}`);
        return null;
      }
    }

    // Load brand assets as references (limit to 6 for objects per Nano Banana docs)
    const assetPromises = (companyAssets || []).slice(0, 6).map(async (asset: any) => {
      if (asset.url) {
        const ref = await loadImageAsBase64(asset.url, asset.type);
        if (ref) referenceImages.push(ref);
      }
    });
    await Promise.all(assetPromises);

    console.log(`[REGEN] Loaded ${referenceImages.length} reference images for brand consistency`);

    // Basic heuristic for specific assets
    const logoAsset = companyAssets?.find((a: any) => a.name?.toLowerCase().includes('logo')) || companyAssets?.[0];
    const isoAsset = companyAssets?.find((a: any) => a.name?.toLowerCase().includes('iso') || a.description?.includes('ISO'));

    let slides: SlideData[] = carousel.slides || [];

    // Limit to 5 slides max
    if (slides.length > 5) {
      console.log(`[REGEN] ⚠️ Truncating ${slides.length} slides to 5`);
      const hook = slides.find((s) => s.type === 'hook') || slides[0];
      const cta = slides.find((s) => s.type === 'cta') || slides[slides.length - 1];
      const content = slides.filter((s) => s.type === 'content').slice(0, 3);
      slides = [hook, ...content, cta].filter(Boolean).slice(0, 5);
    }

    // Determine platform and aspect ratio
    const isInstagram = table_name === 'instagram_posts';
    const aspectRatio = isInstagram ? "4:5" : "3:4";
    const platformName = isInstagram ? "Instagram" : "LinkedIn";

    // ========================================================================
    // NANO BANANA PRO IMAGE GENERATION
    // Using gemini-3-pro-image-preview with proper config
    // ========================================================================
    async function generateImageWithNanoBanana(
      prompt: string,
      references: ReferenceImage[]
    ): Promise<string | null> {
      // Nano Banana Pro for professional asset production
      const MODEL = "gemini-3-pro-image-preview";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      // Build content parts: text prompt + reference images
      const parts: any[] = [{ text: prompt }];

      // Add reference images (up to 6 objects with high fidelity per docs)
      for (const ref of references.slice(0, 6)) {
        parts.push({
          inlineData: {
            mimeType: ref.mimeType,
            data: ref.data
          }
        });
      }

      const requestBody = {
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          // Dynamic aspect ratio
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "2K"
          }
        }
      };

      try {
        console.log(`[REGEN] Calling Nano Banana Pro API...`);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[REGEN] Nano Banana API error: ${response.status} - ${errText}`);

          // Fallback to gemini-2.5-flash-image (faster, simpler)
          return generateImageWithNanoBananaFlash(prompt);
        }

        const data = await response.json();

        // Extract image from response (skip thought images)
        const candidate = data.candidates?.[0]?.content?.parts || [];
        for (const part of candidate) {
          // Skip thought images (part.thought === true)
          if (part.thought) continue;

          if (part.inlineData?.mimeType?.startsWith("image/")) {
            console.log(`[REGEN] ✅ Image generated successfully`);
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }

        console.warn("[REGEN] No image in Nano Banana response");
        return null;
      } catch (e) {
        console.error(`[REGEN] Nano Banana API error: ${e}`);
        return null;
      }
    }

    // Fallback to Gemini 2.5 Flash Image (faster)
    async function generateImageWithNanoBananaFlash(prompt: string): Promise<string | null> {
      const MODEL = "gemini-2.5-flash-image";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: {
            aspectRatio: aspectRatio
          }
        }
      };

      try {
        console.log(`[REGEN] Falling back to Nano Banana Flash...`);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[REGEN] Nano Banana Flash error: ${response.status} - ${errText}`);
          return null;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts || [];

        for (const part of candidate) {
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            console.log(`[REGEN] ✅ Image generated with Flash`);
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }

        return null;
      } catch (e) {
        console.error(`[REGEN] Nano Banana Flash error: ${e}`);
        return null;
      }
    }

    // ========================================================================
    // BRAND-COMPLIANT PROMPT BUILDER
    // ========================================================================
    function buildBrandPrompt(slide: SlideData, slideNum: number, totalSlides: number): string {
      const isFirst = slideNum === 1;
      const isLast = slideNum === totalSlides;

      return `Create a professional ${platformName} carousel slide for Lifetrek Medical.

=== BRAND IDENTITY ===
Company: Lifetrek Medical - Medical device contract manufacturer
Industry: Orthopedic implants, dental implants, CNC precision machining
Location: Indaiatuba, São Paulo, Brazil
Certifications: ISO 13485, ANVISA registered

=== BRAND COLORS (MUST USE) ===
Primary Blue: #004F8F (corporate, trust)
Dark Blue Gradient: #0A1628 → #003052 (backgrounds)
Innovation Green: #1A7A3E (accents, success indicators)
Energy Orange: #F07818 (CTAs, highlights)
White text on dark backgrounds for maximum readability

=== VISUAL STYLE ===
- Premium glassmorphism effects with subtle transparency
- Editorial magazine quality, clean and sophisticated
- High-tech medical manufacturing aesthetic
- Photorealistic CNC machines, cleanrooms, precision parts
- Professional studio lighting with soft shadows

=== SLIDE CONTENT ===
Headline: "${slide.headline}"
Body Text: "${slide.body}"
Slide Type: ${slide.type} (${isFirst ? "FIRST/HOOK - grab attention" : isLast ? "LAST/CTA - call to action" : "CONTENT - inform and educate"})
Position: Slide ${slideNum} of ${totalSlides}

=== COMPOSITION REQUIREMENTS ===
- Format: Portrait ${aspectRatio} ratio for ${platformName} carousel
- Render the headline text "${slide.headline}" prominently in large, bold white text
- Render the body text below in smaller white text
- Text must be in PORTUGUESE (Brazilian Portuguese)
- Background: Medical manufacturing environment (CNC machines, cleanroom, titanium parts)
${isFirst || isLast ? "- Reserve space in top-right corner for company logo overlay" : ""}
${isLast ? "- Reserve space in bottom-left corner for ISO certification badge" : ""}

=== CRITICAL RULES ===
1. USE Lifetrek brand colors exactly as specified
2. Text must be READABLE - white text with high contrast on dark background
3. Professional, technical aesthetic - not generic stock photo look
4. Show REAL medical manufacturing context (not abstract graphics)
5. Text must be perfectly rendered in Portuguese
6. Do NOT include any placeholder text, font names, or technical labels`;
    }

    // ========================================================================
    // PROCESS SLIDES
    // ========================================================================
    async function processSlide(slide: SlideData, index: number): Promise<SlideData> {
      const slideNum = index + 1;
      const isFirst = index === 0;
      const isLast = index === slides.length - 1;

      console.log(`[REGEN] [Slide ${slideNum}/${slides.length}] Processing: "${slide.headline}"`);
      const slideStart = Date.now();

      // Set overlay metadata
      slide.showLogo = isFirst || isLast;
      slide.showISOBadge = isLast || slide.type === 'cta';
      if (logoAsset?.url) slide.logoUrl = logoAsset.url;
      if (isoAsset?.url) slide.isoUrl = isoAsset.url;

      // Build brand-compliant prompt
      const prompt = buildBrandPrompt(slide, slideNum, slides.length);

      // Generate image with reference images for brand consistency
      const imageUrl = await generateImageWithNanoBanana(prompt, referenceImages);

      if (imageUrl) {
        // Upload to Supabase Storage
        try {
          const base64Data = imageUrl.split(",")[1];
          const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `regen-${carousel_id.slice(0, 8)}-s${slideNum}-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from("carousel-images")
            .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from("carousel-images")
              .getPublicUrl(fileName);

            slide.imageUrl = publicUrlData.publicUrl;
            slide.image_url = publicUrlData.publicUrl;
            console.log(`[REGEN] [Slide ${slideNum}] ✅ Generated and uploaded in ${Date.now() - slideStart}ms`);
          } else {
            console.warn(`[REGEN] [Slide ${slideNum}] Upload failed: ${uploadError.message}`);
          }
        } catch (e) {
          console.error(`[REGEN] [Slide ${slideNum}] Upload error: ${e}`);
        }
      } else {
        console.error(`[REGEN] [Slide ${slideNum}] ❌ Image generation failed`);
      }

      return slide;
    }

    // ========================================================================
    // PROCESS ALL SLIDES (Sequential to avoid rate limits)
    // ========================================================================
    console.log(`[REGEN] Starting image generation for ${slides.length} slides...`);

    const processedSlides: SlideData[] = [];
    for (let i = 0; i < slides.length; i++) {
      const processed = await processSlide(slides[i], i);
      processedSlides.push(processed);

      // Delay between slides to respect rate limits
      if (i < slides.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // ========================================================================
    // UPDATE DATABASE
    // ========================================================================
    const imageUrls = processedSlides
      .map((s) => s.imageUrl || s.image_url || "")
      .filter(Boolean);

    console.log(`[REGEN] Updating database with ${imageUrls.length} images...`);

    const { error: updateError } = await supabase
      .from(table_name)
      .update({
        slides: processedSlides,
        image_urls: imageUrls,
        updated_at: new Date().toISOString()
      })
      .eq("id", carousel_id);

    if (updateError) {
      console.error(`[REGEN] DB update failed: ${updateError.message}`);
      return new Response(
        JSON.stringify({ error: "Failed to update carousel", details: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const totalTime = Date.now() - startTime;
    console.log(`[REGEN] ✅✅ COMPLETE: ${processedSlides.length} slides, ${imageUrls.length} images, ${totalTime}ms total`);

    return new Response(
      JSON.stringify({
        success: true,
        carousel_id,
        slides_regenerated: processedSlides.length,
        images_generated: imageUrls.length,
        reference_images_used: referenceImages.length,
        duration_ms: totalTime,
        logs: __regenLogs
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[REGEN] FATAL ERROR: ${error}`);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", logs: __regenLogs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

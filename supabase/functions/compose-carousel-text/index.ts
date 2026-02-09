import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import satori from "npm:satori@0.10.11";
import { Resvg } from "npm:@resvg/resvg-js@2.6.2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Brand constants
const BRAND = {
  primaryBlue: "#004F8F",
  darkBlue: "#0A1628",
  green: "#1A7A3E",
  orange: "#F07818",
  white: "#FFFFFF",
  logoUrl: "https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/logo.png",
};

interface SlideData {
  headline: string;
  body: string;
  type: string;
  imageUrl?: string;
  image_url?: string;
  composedUrl?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { carousel_id, save_mode = "both" } = await req.json();

    if (!carousel_id) {
      return new Response(
        JSON.stringify({ error: "carousel_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    // Load fonts inside handler
    console.log("[COMPOSE] Loading fonts...");
    const fontBold = await fetch("https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf").then((res) => res.arrayBuffer());
    const fontRegular = await fetch("https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf").then((res) => res.arrayBuffer());

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch carousel
    console.log(`[COMPOSE] Fetching carousel ${carousel_id}...`);
    const { data: carousel, error: carouselError } = await supabase
      .from("linkedin_carousels")
      .select("*")
      .eq("id", carousel_id)
      .single();

    if (carouselError || !carousel) {
      return new Response(
        JSON.stringify({ error: "Carousel not found", details: carouselError?.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const slides: SlideData[] = carousel.slides || [];
    console.log(`[COMPOSE] Found ${slides.length} slides to compose`);

    // Load logo
    let logoBase64 = "";
    try {
      const logoRes = await fetch(BRAND.logoUrl);
      if (logoRes.ok) {
        const logoBuffer = await logoRes.arrayBuffer();
        logoBase64 = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(logoBuffer)))}`;
        console.log("[COMPOSE] Logo loaded");
      }
    } catch (e) {
      console.warn("[COMPOSE] Could not load logo:", e);
    }

    const composedUrls: string[] = [];
    const originalUrls: string[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const bgUrl = slide.imageUrl || slide.image_url;
      const isFirst = i === 0;
      const isLast = i === slides.length - 1;

      if (!bgUrl) {
        console.warn(`[COMPOSE] Slide ${i + 1} has no background image, skipping`);
        continue;
      }

      originalUrls.push(bgUrl);
      console.log(`[COMPOSE] Composing slide ${i + 1}: "${slide.headline}"`);

      // Load background image as base64
      let bgBase64 = "";
      try {
        const bgRes = await fetch(bgUrl);
        if (!bgRes.ok) throw new Error(`Failed to fetch: ${bgRes.status}`);
        const bgBuffer = await bgRes.arrayBuffer();
        const bgMime = bgRes.headers.get("content-type") || "image/png";
        bgBase64 = `data:${bgMime};base64,${btoa(String.fromCharCode(...new Uint8Array(bgBuffer)))}`;
      } catch (e) {
        console.error(`[COMPOSE] Could not load background for slide ${i + 1}:`, e);
        continue;
      }

      // Simpler JSX structure using object notation
      const logoChildren = logoBase64
        ? [{ type: "img", props: { src: logoBase64, style: { height: "28px" } } }]
        : [{ type: "span", props: { style: { color: BRAND.primaryBlue, fontWeight: 700, fontSize: "16px" }, children: "LIFETREK" } }];

      const ctaButton = isLast ? [{
        type: "div",
        props: {
          style: {
            marginTop: "12px",
            background: BRAND.orange,
            color: "white",
            padding: "14px 28px",
            borderRadius: "10px",
            fontSize: "18px",
            fontWeight: 700,
            display: "flex",
            justifyContent: "center",
          },
          children: "Acesse o Guia Completo →",
        },
      }] : [];

      const element = {
        type: "div",
        props: {
          style: {
            width: "1080px",
            height: "1350px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            fontFamily: "Inter",
            backgroundColor: "#0A1628",
          },
          children: [
            // Background image
            {
              type: "img",
              props: {
                src: bgBase64,
                style: {
                  position: "absolute",
                  top: "0",
                  left: "0",
                  width: "1080px",
                  height: "1350px",
                  objectFit: "cover",
                },
              },
            },
            // Dark gradient overlay
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  width: "1080px",
                  height: "650px",
                  background: "linear-gradient(to top, rgba(10, 22, 40, 0.95) 0%, rgba(10, 22, 40, 0.7) 60%, transparent 100%)",
                },
              },
            },
            // Logo (first and last slides only)
            ...(isFirst || isLast ? [{
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  top: "36px",
                  right: "36px",
                  background: "white",
                  padding: "10px 20px",
                  borderRadius: "30px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                },
                children: logoChildren,
              },
            }] : []),
            // Slide number
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  top: "36px",
                  left: "36px",
                  background: BRAND.primaryBlue,
                  color: "white",
                  padding: "8px 18px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  fontWeight: 700,
                },
                children: `${i + 1}/${slides.length}`,
              },
            },
            // Content card
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  bottom: "50px",
                  left: "40px",
                  right: "40px",
                  background: "rgba(0, 79, 143, 0.88)",
                  borderRadius: "20px",
                  padding: "36px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                },
                children: [
                  // Headline
                  {
                    type: "div",
                    props: {
                      style: {
                        color: "white",
                        fontSize: slide.headline.length > 40 ? "32px" : "40px",
                        fontWeight: 700,
                        lineHeight: "1.2",
                      },
                      children: slide.headline,
                    },
                  },
                  // Body
                  {
                    type: "div",
                    props: {
                      style: {
                        color: "rgba(255, 255, 255, 0.9)",
                        fontSize: "20px",
                        fontWeight: 400,
                        lineHeight: "1.5",
                      },
                      children: slide.body,
                    },
                  },
                  // CTA button (last slide only)
                  ...ctaButton,
                ],
              },
            },
            // Brand gradient line
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  width: "1080px",
                  height: "6px",
                  background: `linear-gradient(90deg, ${BRAND.primaryBlue} 0%, ${BRAND.green} 100%)`,
                },
              },
            },
          ],
        },
      };

      try {
        // Render with Satori
        console.log(`[COMPOSE] Rendering slide ${i + 1} with Satori...`);
        const svg = await satori(element as any, {
          width: 1080,
          height: 1350,
          fonts: [
            { name: "Inter", data: fontBold, weight: 700, style: "normal" as const },
            { name: "Inter", data: fontRegular, weight: 400, style: "normal" as const },
          ],
        });

        // Convert SVG to PNG
        console.log(`[COMPOSE] Converting slide ${i + 1} to PNG...`);
        const resvg = new Resvg(svg, {
          fitTo: { mode: "width" as const, value: 1080 },
        });
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        // Upload composed image
        const fileName = `composed-${carousel_id.slice(0, 8)}-s${i + 1}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("carousel-images")
          .upload(fileName, pngBuffer, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error(`[COMPOSE] Upload failed for slide ${i + 1}:`, uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("carousel-images")
          .getPublicUrl(fileName);

        composedUrls.push(publicUrlData.publicUrl);
        slides[i].composedUrl = publicUrlData.publicUrl;
        console.log(`[COMPOSE] Slide ${i + 1} composed and uploaded: ${fileName}`);

      } catch (renderError) {
        console.error(`[COMPOSE] Render error for slide ${i + 1}:`, renderError);
        continue;
      }
    }

    // Update carousel
    const updateData: any = {
      slides,
      updated_at: new Date().toISOString()
    };

    if (save_mode === "replace" || save_mode === "both") {
      updateData.image_urls = composedUrls;
    }
    if (save_mode === "both") {
      updateData.original_image_urls = originalUrls;
    }

    const { error: updateError } = await supabase
      .from("linkedin_carousels")
      .update(updateData)
      .eq("id", carousel_id);

    if (updateError) {
      console.error("[COMPOSE] Failed to update carousel:", updateError);
    }

    console.log(`[COMPOSE] Complete: ${composedUrls.length}/${slides.length} slides composed`);

    return new Response(
      JSON.stringify({
        success: true,
        carousel_id,
        slides_composed: composedUrls.length,
        composed_urls: composedUrls,
        original_urls: originalUrls,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[COMPOSE] Fatal error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

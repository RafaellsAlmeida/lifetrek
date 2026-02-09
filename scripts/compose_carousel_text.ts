/**
 * Compose text overlay on carousel images using Satori
 *
 * Usage: deno run --allow-all scripts/compose_carousel_text.ts <carousel_id>
 */

import satori from "npm:satori@0.10.11";
import { Resvg } from "npm:@resvg/resvg-js@2.6.2";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

await load({ export: true });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

// Load fonts from reliable CDN
console.log("Loading fonts...");
const fontBold = await fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf").then((res) => res.arrayBuffer());
const fontRegular = await fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf").then((res) => res.arrayBuffer());
console.log("Fonts loaded ✓");

// Load logo
let logoBase64 = "";
try {
  const logoRes = await fetch(BRAND.logoUrl);
  if (logoRes.ok) {
    const logoBuffer = await logoRes.arrayBuffer();
    logoBase64 = `data:image/png;base64,${encodeBase64(new Uint8Array(logoBuffer))}`;
    console.log("Logo loaded ✓");
  }
} catch (e) {
  console.warn("Could not load logo:", e);
}

async function composeSlide(
  slide: SlideData,
  index: number,
  total: number,
  carouselId: string
): Promise<string | null> {
  const bgUrl = slide.imageUrl || slide.image_url;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  if (!bgUrl) {
    console.warn(`Slide ${index + 1} has no background image, skipping`);
    return null;
  }

  console.log(`\nComposing slide ${index + 1}/${total}: "${slide.headline}"`);

  // Load background image as base64
  let bgBase64 = "";
  try {
    console.log(`  Loading background from ${bgUrl.slice(0, 60)}...`);
    const bgRes = await fetch(bgUrl);
    if (!bgRes.ok) throw new Error(`Failed to fetch: ${bgRes.status}`);
    const bgBuffer = await bgRes.arrayBuffer();
    const bgMime = bgRes.headers.get("content-type") || "image/png";
    bgBase64 = `data:${bgMime};base64,${encodeBase64(new Uint8Array(bgBuffer))}`;
    console.log(`  Background loaded (${Math.round(bgBuffer.byteLength / 1024)}KB)`);
  } catch (e) {
    console.error(`  Could not load background:`, e);
    return null;
  }

  // Build JSX element
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
            children: `${index + 1}/${total}`,
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
    console.log(`  Rendering SVG with Satori...`);
    const svg = await satori(element as any, {
      width: 1080,
      height: 1350,
      fonts: [
        { name: "Inter", data: fontBold, weight: 700, style: "normal" as const },
        { name: "Inter", data: fontRegular, weight: 400, style: "normal" as const },
      ],
    });
    console.log(`  SVG rendered (${Math.round(svg.length / 1024)}KB)`);

    // Convert SVG to PNG
    console.log(`  Converting to PNG...`);
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width" as const, value: 1080 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    console.log(`  PNG generated (${Math.round(pngBuffer.length / 1024)}KB)`);

    // Upload composed image
    const fileName = `composed-${carouselId.slice(0, 8)}-s${index + 1}-${Date.now()}.png`;
    console.log(`  Uploading as ${fileName}...`);

    const { error: uploadError } = await supabase.storage
      .from("carousel-images")
      .upload(fileName, pngBuffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error(`  Upload failed:`, uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("carousel-images")
      .getPublicUrl(fileName);

    console.log(`  ✅ Uploaded: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;

  } catch (renderError) {
    console.error(`  Render error:`, renderError);
    return null;
  }
}

async function main() {
  const carouselId = Deno.args[0];

  if (!carouselId) {
    console.error("Usage: deno run --allow-all scripts/compose_carousel_text.ts <carousel_id>");
    console.error("\nExample: deno run --allow-all scripts/compose_carousel_text.ts f7e37f67-d64e-4470-9998-5d33e6943533");
    Deno.exit(1);
  }

  console.log(`\nFetching carousel ${carouselId}...`);

  const { data: carousel, error: carouselError } = await supabase
    .from("linkedin_carousels")
    .select("*")
    .eq("id", carouselId)
    .single();

  if (carouselError || !carousel) {
    console.error("Carousel not found:", carouselError?.message);
    Deno.exit(1);
  }

  const slides: SlideData[] = carousel.slides || [];
  console.log(`Found ${slides.length} slides: "${carousel.topic}"`);

  // Store original URLs
  const originalUrls = slides.map(s => s.imageUrl || s.image_url).filter(Boolean);
  const composedUrls: string[] = [];

  // Process each slide
  for (let i = 0; i < slides.length; i++) {
    const url = await composeSlide(slides[i], i, slides.length, carouselId);
    if (url) {
      composedUrls.push(url);
      slides[i].composedUrl = url;
    }
  }

  // Update carousel
  console.log(`\nUpdating carousel with ${composedUrls.length} composed images...`);

  const { error: updateError } = await supabase
    .from("linkedin_carousels")
    .update({
      slides,
      image_urls: composedUrls,
      updated_at: new Date().toISOString()
    })
    .eq("id", carouselId);

  if (updateError) {
    console.error("Failed to update carousel:", updateError);
    Deno.exit(1);
  }

  console.log(`\n✅ Complete! ${composedUrls.length}/${slides.length} slides composed.`);
  console.log("\nComposed URLs:");
  composedUrls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
}

main();

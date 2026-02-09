/**
 * Add text overlays to carousel images using Gemini image editing
 *
 * Usage: deno run --allow-all scripts/add_text_to_carousel.ts <carousel_id>
 */

import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

await load({ export: true });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  Deno.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface SlideData {
  headline: string;
  body: string;
  type: string;
  imageUrl?: string;
  image_url?: string;
}

async function addTextToImage(
  imageUrl: string,
  slide: SlideData,
  slideNum: number,
  totalSlides: number
): Promise<string | null> {
  const isFirst = slideNum === 1;
  const isLast = slideNum === totalSlides;

  // Download the image
  console.log(`  Downloading original image...`);
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    console.error(`  Failed to fetch image: ${imageRes.status}`);
    return null;
  }

  const imageBuffer = await imageRes.arrayBuffer();
  const imageMime = imageRes.headers.get("content-type") || "image/png";
  const imageBase64 = encodeBase64(new Uint8Array(imageBuffer));
  console.log(`  Image downloaded (${Math.round(imageBuffer.byteLength / 1024)}KB)`);

  // Build the prompt for Gemini
  const prompt = `Edit this image to add a professional text overlay for a LinkedIn carousel slide.

=== TEXT TO ADD ===
Headline: "${slide.headline}"
Body: "${slide.body}"
Slide number: ${slideNum} of ${totalSlides}

=== DESIGN REQUIREMENTS ===
1. Add a dark gradient overlay at the bottom (from transparent at top to 90% opacity dark blue #0A1628 at bottom)
2. Place text in the lower portion of the image
3. Headline: Large, bold, white text (approximately 40-48pt equivalent)
4. Body: Smaller, white text below headline (approximately 20-24pt equivalent)
5. Add a small badge in top-left corner showing "${slideNum}/${totalSlides}" in a blue (#004F8F) rounded pill
${isFirst || isLast ? '6. Add "LIFETREK" text or logo hint in top-right corner with white background pill' : ''}
${isLast ? '7. Add an orange (#F07818) CTA button below the body text saying "Acesse o Guia Completo →"' : ''}
8. Add a thin gradient line (blue #004F8F to green #1A7A3E) at the very bottom

=== STYLE ===
- Font: Clean, modern sans-serif (like Inter or similar)
- Professional B2B medical device company aesthetic
- High contrast, readable text
- Keep the original background image visible through the gradient

IMPORTANT: Keep the aspect ratio exactly as the original (3:4 portrait). Do NOT crop or resize the image.`;

  try {
    console.log(`  Calling Gemini API to add text...`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: imageMime,
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`  Gemini API error: ${response.status} - ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const candidates = data.candidates?.[0]?.content?.parts || [];

    for (const part of candidates) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        console.log(`  ✅ Image edited successfully`);
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    console.warn(`  No image in response`);
    return null;

  } catch (e) {
    console.error(`  Gemini error:`, e);
    return null;
  }
}

async function processSlide(
  slide: SlideData,
  index: number,
  total: number,
  carouselId: string
): Promise<string | null> {
  const bgUrl = slide.imageUrl || slide.image_url;

  if (!bgUrl) {
    console.warn(`Slide ${index + 1} has no image, skipping`);
    return null;
  }

  console.log(`\nProcessing slide ${index + 1}/${total}: "${slide.headline}"`);

  const editedDataUrl = await addTextToImage(bgUrl, slide, index + 1, total);

  if (!editedDataUrl) {
    return null;
  }

  // Upload to Supabase
  try {
    const base64Data = editedDataUrl.split(",")[1];
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `text-${carouselId.slice(0, 8)}-s${index + 1}-${Date.now()}.png`;
    console.log(`  Uploading as ${fileName}...`);

    const { error: uploadError } = await supabase.storage
      .from("carousel-images")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error(`  Upload failed:`, uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("carousel-images")
      .getPublicUrl(fileName);

    console.log(`  ✅ Uploaded: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;

  } catch (e) {
    console.error(`  Upload error:`, e);
    return null;
  }
}

async function main() {
  const carouselId = Deno.args[0];

  if (!carouselId) {
    console.error("Usage: deno run --allow-all scripts/add_text_to_carousel.ts <carousel_id>");
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

  const editedUrls: string[] = [];

  // Process each slide sequentially (to avoid rate limits)
  for (let i = 0; i < slides.length; i++) {
    const url = await processSlide(slides[i], i, slides.length, carouselId);
    if (url) {
      editedUrls.push(url);
      slides[i].imageUrl = url;
      slides[i].image_url = url;
    } else {
      // Keep original if edit failed
      editedUrls.push(slides[i].imageUrl || slides[i].image_url || "");
    }

    // Rate limit delay
    if (i < slides.length - 1) {
      console.log(`  Waiting 2s before next slide...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Update carousel
  console.log(`\nUpdating carousel with ${editedUrls.filter(Boolean).length} edited images...`);

  const { error: updateError } = await supabase
    .from("linkedin_carousels")
    .update({
      slides,
      image_urls: editedUrls,
      updated_at: new Date().toISOString()
    })
    .eq("id", carouselId);

  if (updateError) {
    console.error("Failed to update carousel:", updateError);
    Deno.exit(1);
  }

  console.log(`\n✅ Complete! ${editedUrls.filter(Boolean).length}/${slides.length} slides edited.`);
  console.log("\nEdited URLs:");
  editedUrls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
}

main();

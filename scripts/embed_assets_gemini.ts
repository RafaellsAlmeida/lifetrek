/**
 * Embed facility photos using Gemini Embedding 2 (multimodal)
 *
 * Generates image embeddings for all active assets in asset_embeddings table.
 * Uses Gemini API directly (not OpenRouter) for multimodal embedding support.
 *
 * Usage: deno run --allow-net --allow-env --allow-read scripts/embed_assets_gemini.ts
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  Deno.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY. Set it via env var.");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Gemini Embedding 2 API endpoint
const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-exp-03-07:embedContent?key=${GEMINI_API_KEY}`;

interface EmbeddingResponse {
  embedding: {
    values: number[];
  };
}

/**
 * Generate text embedding using Gemini Embedding 2
 */
async function embedText(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(GEMINI_EMBED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        },
        outputDimensionality: 768  // MRL dimension reduction
      })
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status} ${await response.text()}`);
      return null;
    }

    const data: EmbeddingResponse = await response.json();
    return data.embedding.values;
  } catch (e) {
    console.error(`Embedding error: ${e}`);
    return null;
  }
}

/**
 * Generate image embedding using Gemini Embedding 2
 * Fetches the image, converts to base64, sends to Gemini
 */
async function embedImage(imageUrl: string): Promise<number[] | null> {
  try {
    // Fetch the image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      console.error(`Failed to fetch image: ${imageUrl}`);
      return null;
    }

    const imgBuffer = await imgResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
    const mimeType = imgResponse.headers.get("content-type") || "image/jpeg";

    const response = await fetch(GEMINI_EMBED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: {
          parts: [{
            inlineData: {
              mimeType,
              data: base64
            }
          }]
        },
        outputDimensionality: 768
      })
    });

    if (!response.ok) {
      console.error(`Gemini image embed error: ${response.status} ${await response.text()}`);
      return null;
    }

    const data: EmbeddingResponse = await response.json();
    return data.embedding.values;
  } catch (e) {
    console.error(`Image embedding error: ${e}`);
    return null;
  }
}

async function main() {
  console.log("Loading assets from asset_embeddings...");

  const { data: assets, error } = await supabase
    .from("asset_embeddings")
    .select("id, asset_url, category, search_text, tags")
    .eq("active", true);

  if (error) {
    console.error("Failed to load assets:", error);
    Deno.exit(1);
  }

  console.log(`Found ${assets.length} active assets to embed`);

  let success = 0;
  let failed = 0;

  for (const asset of assets) {
    const assetName = asset.asset_url.split("/").pop() || asset.id;
    console.log(`\nEmbedding: ${assetName} (${asset.category})`);

    // For facility/equipment images, embed the actual image
    // For text-heavy assets, embed the search_text
    let embedding: number[] | null = null;

    if (["facility", "equipment", "product"].includes(asset.category) && asset.asset_url) {
      // Use a resized version to keep payload manageable
      let imageUrl = asset.asset_url;
      if (imageUrl.includes("/object/public/")) {
        imageUrl = imageUrl.replace("/object/public/", "/render/image/public/") +
          "?width=512&height=512&resize=cover&quality=70";
      }

      console.log(`  Embedding image...`);
      embedding = await embedImage(imageUrl);

      // Also create a combined embedding with text context
      if (!embedding && asset.search_text) {
        console.log(`  Image failed, falling back to text embedding...`);
        embedding = await embedText(asset.search_text);
      }
    } else if (asset.search_text) {
      console.log(`  Embedding text...`);
      embedding = await embedText(asset.search_text);
    }

    if (embedding) {
      // Format as pgvector string
      const vectorStr = `[${embedding.join(",")}]`;

      const { error: updateError } = await supabase
        .from("asset_embeddings")
        .update({
          embedding_v2: vectorStr,
          embedding_model: "gemini-embedding-exp-03-07"
        })
        .eq("id", asset.id);

      if (updateError) {
        console.error(`  Update failed: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  Embedded (${embedding.length}d)`);
        success++;
      }
    } else {
      console.log(`  No embedding generated`);
      failed++;
    }

    // Rate limiting - Gemini has 100 RPM
    await new Promise(r => setTimeout(r, 700));
  }

  console.log(`\nResults: ${success} embedded, ${failed} failed out of ${assets.length} total`);
}

main();

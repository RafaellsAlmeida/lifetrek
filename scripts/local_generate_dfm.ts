
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { AssetLoader } from "../supabase/functions/regenerate-carousel-images/utils/assets.ts";
import { handleHybridGeneration } from "../supabase/functions/regenerate-carousel-images/handlers/hybrid.ts";
import { handleAiGeneration } from "../supabase/functions/regenerate-carousel-images/handlers/ai.ts";
// Mock Deno.env for local execution if not present
if (typeof Deno === 'undefined') {
    throw new Error("Must be run with Deno");
}

// Load env vars from arguments or prompt user if missing
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ACCESS_TOKEN");
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");

if (!SUPABASE_KEY || (!GEMINI_KEY && !OPENROUTER_KEY)) {
    console.error("❌ Missing Environment Variables!");
    console.error("Usage: SUPABASE_SERVICE_ROLE_KEY=... GEMINI_API_KEY=... deno run -A scripts/local_generate_dfm.ts");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DFM_CAROUSEL_ID = "05ebeff0-834c-48c3-ac06-3ce483600fbf";

async function run() {
    console.log("🚀 Starting LOCAL Content Generation for DFM Checklist...");

    // 1. Fetch Data
    const { data: carousel, error } = await supabase
        .from("linkedin_carousels")
        .select("*")
        .eq("id", DFM_CAROUSEL_ID)
        .single();

    if (error || !carousel) {
        console.error("❌ Carousel not found:", error);
        return;
    }

    console.log(`Contents: "${carousel.topic}" (${carousel.slides.length} slides)`);

    // 2. Load Assets
    const assetLoader = new AssetLoader(supabase);
    await assetLoader.load();
    console.log("✅ Assets loaded");

    // 3. Asset Verification (Debug)
    const isoBadge = assetLoader.getIsoBadge();
    console.log(`🔎 ISO Badge Selected: ${isoBadge}`);
    if (!isoBadge?.includes("iso")) console.warn("⚠️  Warning: ISO badge might be incorrect or missing 'iso' in url");

    // 4. Run Hybrid Generation
    const platform = { isBlog: false, isResource: false, aspectRatio: "4:5" };

    console.log("\n🎨 Running Hybrid Generator...");
    const slides = await handleHybridGeneration(
        carousel.slides,
        carousel.id,
        platform,
        assetLoader,
        supabase
    );

    // 5. Update DB (Optional - maybe we just want to see results?)
    // For "do locally", we usually want to effect change.
    console.log("\n💾 Updating Supabase...");
    const { error: updateError } = await supabase
        .from("linkedin_carousels")
        .update({
            slides: slides,
            image_urls: slides.map(s => s.imageUrl),
            updated_at: new Date().toISOString()
        })
        .eq("id", DFM_CAROUSEL_ID);

    if (updateError) console.error("❌ Update failed:", updateError);
    else console.log("✅ Successfully updated carousel with new images!");
}

run();

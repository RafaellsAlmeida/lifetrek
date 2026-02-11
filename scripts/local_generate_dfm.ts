import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { config } from "https://deno.land/std@0.168.0/dotenv/mod.ts";
import { AssetLoader } from "../supabase/functions/regenerate-carousel-images/utils/assets.ts";
import { handleHybridGeneration } from "../supabase/functions/regenerate-carousel-images/handlers/hybrid.ts";
import { handleAiGeneration } from "../supabase/functions/regenerate-carousel-images/handlers/ai.ts";

// Load .env file
const env = await config({ path: ".env" });

// Mock Deno.env for local execution
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || env.SUPABASE_URL || "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || env.SUPABASE_SERVICE_ROLE_KEY || Deno.env.get("SUPABASE_ACCESS_TOKEN") || env.SUPABASE_ACCESS_TOKEN;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || env.GEMINI_API_KEY;
const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY") || env.OPENROUTER_API_KEY;

// Ensure keys are in Deno.env for the handlers to pick up
if (GEMINI_KEY) Deno.env.set("GEMINI_API_KEY", GEMINI_KEY);
if (OPENROUTER_KEY) Deno.env.set("OPENROUTER_API_KEY", OPENROUTER_KEY);
if (SUPABASE_KEY) Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY);
if (SUPABASE_URL) Deno.env.set("SUPABASE_URL", SUPABASE_URL);

if (!SUPABASE_KEY || (!GEMINI_KEY && !OPENROUTER_KEY)) {
    console.error("❌ Missing Environment Variables!");
    console.error("Please ensure .env has SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY or OPENROUTER_API_KEY");
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

    // OVERRIDE: Use hardcoded slides from user request
    const newSlides = [
        {
            headline: "Padrão é suficiente para todos os pacientes?",
            body: "Em casos complexos, implantes e instrumentais genéricos começam a falhar – clínica e mecanicamente.",
            type: "hook" as const,
            order: 1
        },
        {
            headline: "Onde o genérico não acompanha",
            body: "Deformidades, revisões, anatomias fora da curva e protocolos cirúrgicos específicos exigem soluções sob medida – ou o cirurgião precisa improvisar em campo.",
            type: "content" as const,
            order: 2
        },
        {
            headline: "Personalização séria começa no projeto",
            body: "Trabalhamos com times clínicos e de P&D para traduzir necessidades cirúrgicas em desenhos usináveis, com materiais de grau implante e critérios claros de validação mecânica.",
            type: "content" as const,
            order: 3
        },
        {
            headline: "Do conceito ao implante em mãos",
            body: "Usinagem CNC de precisão, metrologia 3D e, quando necessário, sala limpa ISO 7. Cada caso recebe plano de processo, medição e rastreabilidade completos.",
            type: "content" as const,
            order: 4
        },
        {
            headline: "Tem um caso que o “padrão” não resolve?",
            body: "Se você é OEM ou cirurgião e tem um cenário onde o catálogo não atende, podemos ajudar a avaliar viabilidade técnica e rota regulatória para uma solução personalizada. 👉 Comente “PERSONALIZADO” ou fale com nossa equipe.",
            type: "cta" as const,
            order: 5
        }
    ];

    console.log("\n🎨 Running Hybrid Generator...");
    const slides = await handleHybridGeneration(
        newSlides,
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

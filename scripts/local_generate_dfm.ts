
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

    // OVERRIDE: Use hardcoded slides from user request
    const newSlides = [
        {
            title: "Seu implante falhou no teste de fadiga?",
            content: "70% das falhas poderiam ser evitadas com um passo que a maioria pula.",
            order: 1
        },
        {
            title: "O Custo de Descobrir Tarde",
            content: "Cada falha no teste = R$50k+ em retrabalho. Meses de atraso no registro ANVISA/FDA. Time de P&D travado em loop infinito de iterações.",
            order: 2
        },
        {
            title: "Erro #1: Pular a Validação de Geometria",
            content: "Ir direto do CAD para o CNC é tentador. Mas sem validar forma e encaixe com impressão 3D médica, problemas de geometria aparecem depois de usinar titânio.",
            order: 3
        },
        {
            title: "Erro #2: Prototipar em Material Errado",
            content: "Testar fadiga com liga similar não é testar fadiga. A ASTM F136 (titânio grau cirúrgico) tem comportamento mecânico único. Trocar por outro material invalida 100% dos dados.",
            order: 4
        },
        {
            title: "Erro #3: Não Mapear Regiões Críticas",
            content: "Roscas, mudanças de seção, cantos vivos - são pontos de concentração de tensão. Sem tolerâncias definidas antes do CNC, o teste de fadiga encontra o problema por você.",
            order: 5
        },
        {
            title: "O Fluxo Que Evita Esses Erros",
            content: "Guia visual + checklist técnico para validar implantes ANTES do ensaio destrutivo. Do CAD ao teste, passo a passo.",
            order: 6
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

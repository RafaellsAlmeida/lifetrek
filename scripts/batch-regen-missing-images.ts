/**
 * Batch regenerate images for LinkedIn carousels missing them.
 * Runs BOTH modes per slide so you can compare in the UI:
 *   - hybrid: real Lifetrek facility photo + Satori text overlay (~3-5s/slide)
 *   - ai:     AI-generated background + Satori text overlay (~25-30s/slide)
 *
 * Usage: deno run --allow-net --allow-read --allow-env scripts/batch-regen-missing-images.ts
 * Options:
 *   --mode=hybrid   Run only real-photo mode
 *   --mode=ai       Run only AI mode
 *   --mode=both     Run both (default)
 *   --carousel=<id> Run a single carousel only
 */

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3Mjc2MDksImV4cCI6MjA4MzMwMzYwOX0.ALEISClMQTqYtDfRBVOQwm5vf7uEodqptSXyxIpRkCQ";

// LinkedIn carousels to process
const CAROUSELS = [
  { id: "12cc2e57-57a3-46a0-ae22-cf6748ea8e7d", topic: "CMM e qualidade para OEM", slides: 5 },
  { id: "2873319f-c9d5-47fc-ad4f-1a2fccc0982a", topic: "Importação vs Local: TCO 2026", slides: 5 },
  { id: "b4b5b8fe-a095-45e3-9c95-909ec7551fc7", topic: "Resiliência da Cadeia Local", slides: 5 },
  { id: "7b2559c1-92de-4898-8456-c9070746c2bd", topic: "Metrologia ZEISS", slides: 5 },
  { id: "da0d1c96-fe7d-49b9-81ca-59d7f72a61de", topic: "DFM: O fornecedor como co-engenheiro", slides: 5 },
  { id: "e1bdd396-fa3e-46b8-88ce-ffccc99f3a39", topic: "Time-to-Market: ciclo de prototipagem", slides: 5 },
  { id: "8a1e25c3-6b0c-49d4-af30-c178e1872d98", topic: "Swiss Turning vs Usinagem Convencional", slides: 5 },
  { id: "3fa75ac6-a3a0-4adf-864f-4929f84ebb91", topic: "Checklist de Validação ISO 13485", slides: 5 },
  { id: "f84b74a5-9a45-4fb3-8e80-a2e28ad3d444", topic: "Custo da Não-Conformidade", slides: 5 },
  { id: "05ebeff0-834c-48c3-ac06-3ce483600fbf", topic: "Checklist DFM para Implantes", slides: 5 },
  { id: "b2597cef-4140-4bfe-9384-4940e197cb5e", topic: "Checklist DFM 2026 (partial)", slides: 5 },
];

// Parse CLI flags
const args = Object.fromEntries(
  Deno.args.map(a => a.replace(/^--/, "").split("=") as [string, string])
);
const modeFlag = args.mode || "both";
const carouselFilter = args.carousel;

async function regenerateSlide(carouselId: string, slideIndex: number, mode: "hybrid" | "ai"): Promise<boolean> {
  const url = `${SUPABASE_URL}/functions/v1/regenerate-carousel-images`;
  const timeoutMs = mode === "ai" ? 120000 : 30000;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        carousel_id: carouselId,
        table_name: "linkedin_carousels",
        slide_index: slideIndex,
        mode,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error(`    ❌ [${mode}] Slide ${slideIndex}: non-JSON (${res.status}): ${text.substring(0, 150)}`);
      return false;
    }

    if (data.success) {
      console.log(`    ✅ [${mode}] Slide ${slideIndex}: done in ${data.duration_ms}ms`);
      return true;
    } else {
      console.error(`    ❌ [${mode}] Slide ${slideIndex}: ${data.error || JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    console.error(`    ❌ [${mode}] Slide ${slideIndex}: ${err}`);
    return false;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processCarousel(id: string, topic: string, slideCount: number) {
  const modes: ("hybrid" | "ai")[] = modeFlag === "both" ? ["hybrid", "ai"] :
    modeFlag === "hybrid" ? ["hybrid"] : ["ai"];

  for (const mode of modes) {
    console.log(`  → Mode: ${mode.toUpperCase()}`);
    for (let i = 0; i < slideCount; i++) {
      await regenerateSlide(id, i, mode);
      if (i < slideCount - 1) await sleep(mode === "ai" ? 2000 : 500);
    }
    if (modes.length > 1) {
      console.log(`  ⏳ Pausing 3s before next mode...`);
      await sleep(3000);
    }
  }
}

async function main() {
  const toProcess = carouselFilter
    ? CAROUSELS.filter(c => c.id.startsWith(carouselFilter))
    : CAROUSELS;

  console.log(`\n🖼️  Batch Image Regeneration`);
  console.log(`   Mode: ${modeFlag.toUpperCase()} | ${toProcess.length} carousels\n`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const { id, topic, slides } = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] "${topic}"`);
    console.log(`   ID: ${id}`);

    try {
      await processCarousel(id, topic, slides);
      succeeded++;
    } catch (e) {
      console.error(`  ❌ Fatal error: ${e}`);
      failed++;
    }

    if (i < toProcess.length - 1) {
      console.log(`  ⏳ 3s before next carousel...\n`);
      await sleep(3000);
    }
  }

  console.log(`\n📊 Summary: ${succeeded} succeeded, ${failed} failed`);
}

main();

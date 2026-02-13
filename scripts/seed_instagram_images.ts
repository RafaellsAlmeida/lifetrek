/**
 * Seeds Instagram campaign posts into the database and triggers image generation.
 *
 * 1. Checks which campaign posts already exist (by topic match)
 * 2. Inserts missing posts from instagramCampaign.ts config
 * 3. Triggers regenerate-carousel-images edge function for each post
 *
 * Usage:
 *   deno run --allow-all scripts/seed_instagram_images.ts
 *   deno run --allow-all scripts/seed_instagram_images.ts --dry-run
 *   deno run --allow-all scripts/seed_instagram_images.ts --images-only   # skip seeding, just gen images
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

// ─── Environment ────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY not set. Export it or set in env.");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Campaign Data (inline from instagramCampaign.ts to avoid TS/ESM issues) ─
const CAMPAIGN_POSTS = [
  {
    id: "ig-pinned-01-identity",
    topic: "Lifetrek Medical: The Precision Partner Behind Critical Medical Devices",
    target_audience: "Medical Device OEMs, Engineering Managers, Procurement Directors",
    pain_point: "Need a reliable, long-term manufacturing partner with proven track record",
    desired_outcome: "Establish Lifetrek brand identity as trusted precision medical manufacturer",
    post_type: "carousel",
    caption: `Precision at scale. 🏭

For over 30 years, Lifetrek Medical has been the silent partner behind the world's most critical medical devices. We aren't just a machine shop; we are an extension of your engineering team.

From Brazil to the world, we deliver ISO 13485 certified excellence for OEMs who cannot afford second-best.

🚀 Ready to scale your medical device production? Link in bio.`,
    hashtags: ["#LifetrekMedical", "#MedicalDeviceManufacturing", "#ISO13485", "#MedTech", "#SwissMachining", "#ANVISA", "#GlobalSupplyChain"],
    slides: [
      { type: "hook", headline: "O Parceiro Silencioso", body: "Por trás dos dispositivos médicos mais críticos do mundo, existe um parceiro de precisão com 30+ anos de excelência." },
      { type: "content", headline: "Extensão da Sua Equipe", body: "Não somos apenas usinagem. Somos engenharia colaborativa — do protótipo à produção em escala." },
      { type: "content", headline: "ISO 13485 Certificado", body: "Padrão global de qualidade que garante rastreabilidade total e conformidade regulatória em cada peça." },
      { type: "content", headline: "Do Brasil Para o Mundo", body: "Exportamos precisão CNC para OEMs em 3 continentes. Lead times competitivos, qualidade incomparável." },
      { type: "cta", headline: "Escale Sua Produção", body: "Pronto para um parceiro que entende dispositivos médicos? Link na bio. 🚀" },
    ],
  },
  {
    id: "ig-pinned-02-capabilities",
    topic: "From Raw Titanium to Sterile Package: One-Stop Manufacturing",
    target_audience: "CTOs de MedTech, Gerentes de Produto, Startups Médicas",
    pain_point: "Managing multiple suppliers increases cost, complexity and quality risk",
    desired_outcome: "Show Lifetrek's integrated vertical capabilities: Swiss Turning, 5-Axis, Cleanroom",
    post_type: "carousel",
    caption: `From raw titanium to sterile package. One partner. 🔄

Why manage 5 suppliers when you can trust one?
🔹 Swiss Turning: Complex micro-parts (0.5mm+) on Citizen Cincom machines.
🔹 5-Axis: For organic orthopedic geometries.
🔹 ISO 7 Cleanroom: Validated cleaning and sterile packaging.

We handle the complexity so you can focus on innovation.`,
    hashtags: ["#MedicalManufacturing", "#SwissLathe", "#Cleanroom", "#SterilePackaging", "#Orthopedics", "#DentalImplants", "#SupplyChainOptimization"],
    slides: [
      { type: "hook", headline: "5 Fornecedores ou 1?", body: "Do titânio bruto à embalagem estéril. Uma única fábrica. Zero handoffs. Máxima rastreabilidade." },
      { type: "content", headline: "Swiss Turning", body: "Micro-peças complexas a partir de 0.5mm em máquinas Citizen Cincom. Tolerâncias de ±5μm." },
      { type: "content", headline: "5-Axis CNC", body: "Geometrias orgânicas para implantes ortopédicos e dentários. Superfícies perfeitas na primeira operação." },
      { type: "content", headline: "Cleanroom ISO 7", body: "Limpeza ultrassônica validada, passivação e embalagem estéril — tudo sob o mesmo teto." },
      { type: "cta", headline: "Agende um Tour Virtual", body: "Conheça nossa fábrica de 4.000m². Agende uma visita virtual pelo link na bio. 🏭" },
    ],
  },
  {
    id: "ig-pinned-03-trust",
    topic: "Quality is Not a Department — It's Our Product",
    target_audience: "Quality Directors, Regulatory Affairs Managers, Engineering Leads",
    pain_point: "Inconsistent quality from suppliers, audit failures, traceability gaps",
    desired_outcome: "Position Lifetrek as zero-defect quality leader with CMM, traceability, and compliance",
    post_type: "carousel",
    caption: `Quality is not a department. It's our product. 🛡️

In our industry, a micron is the difference between success and failure. That's why every Lifetrek component undergoes rigorous validation:
✅ 100% CMM Inspection
✅ Full Material Traceability
✅ ANVISA & FDA Compliance Support

Sleep soundly knowing your devices are made to the highest global standards.`,
    hashtags: ["#QualityControl", "#CMM", "#Metrology", "#PatientSafety", "#MedicalDevices", "#ZeroDefect", "#ContractManufacturing"],
    slides: [
      { type: "hook", headline: "1 Mícron de Diferença", body: "Na indústria médica, um mícron separa o sucesso do fracasso. Por isso qualidade não é um departamento — é nosso produto." },
      { type: "content", headline: "100% Inspeção CMM", body: "Cada componente passa por metrologia 3D completa. Relatórios dimensionais automáticos para seu arquivo regulatório." },
      { type: "content", headline: "Rastreabilidade Total", body: "Do certificado de matéria-prima ao lote final. Cada peça tem histórico completo acessível em segundos." },
      { type: "content", headline: "ANVISA & FDA Ready", body: "Documentação técnica alinhada com requisitos regulatórios brasileiros e internacionais. Auditorias sem surpresas." },
      { type: "cta", headline: "Durma Tranquilo", body: "Seus dispositivos fabricados nos mais altos padrões globais. Baixe nosso manual de qualidade. 🛡️" },
    ],
  },
  {
    id: "ig-post-04-behind-scenes",
    topic: "Behind the Scenes: How Swiss Turning Creates Micro-Precision Medical Parts",
    target_audience: "Engenheiros de Produção, Designers de Implantes, R&D Engineers",
    pain_point: "Lack of transparency from manufacturers, difficulty understanding capabilities",
    desired_outcome: "Educate audience on Swiss Turning capabilities and build trust through transparency",
    post_type: "carousel",
    caption: `Ever wonder how a 0.5mm titanium screw is made? 🔬

This is Swiss Turning — the art of micro-precision machining.

Our Citizen Cincom machines work with tolerances tighter than a human hair. Each component is born from solid titanium and transformed into a life-saving device.

Swipe to see the process → from bar stock to finished implant component.`,
    hashtags: ["#SwissTurning", "#PrecisionEngineering", "#Micromechanics", "#MedTech", "#Manufacturing"],
    slides: [
      { type: "hook", headline: "0.5mm de Precisão", body: "Já se perguntou como um parafuso de titânio de 0.5mm é fabricado? Bem-vindo ao Swiss Turning. 🔬" },
      { type: "content", headline: "Citizen Cincom", body: "Nossas máquinas suíças trabalham com tolerâncias menores que um fio de cabelo. ±5μm de precisão." },
      { type: "content", headline: "Do Barra ao Implante", body: "Titânio sólido entra como barra. Sai como componente que salva vidas. Veja o processo completo." },
      { type: "content", headline: "Controle em Processo", body: "Sensores monitoram cada corte em tempo real. Desvios são detectados antes de se tornarem defeitos." },
      { type: "cta", headline: "Veja o Processo", body: "Arraste para ver a transformação completa. Comente 🔬 para mais bastidores!" },
    ],
  },
  {
    id: "ig-post-05-cleanroom",
    topic: "Inside Our ISO 7 Cleanroom: Where Sterile Packaging Meets Precision",
    target_audience: "Quality Managers, Regulatory Affairs, OEM Procurement",
    pain_point: "Contamination risks, separate cleanroom vendors add complexity",
    desired_outcome: "Showcase in-house cleanroom capabilities as competitive differentiator",
    post_type: "carousel",
    caption: `Welcome to our ISO 7 Cleanroom. 🧪

This is where precision meets purity. After machining, every component enters our validated cleanroom for:

🔹 Ultrasonic cleaning
🔹 Passivation
🔹 Sterile packaging

All under one roof. No handoffs. No contamination risk.

This is what integrated manufacturing looks like.`,
    hashtags: ["#Cleanroom", "#ISO7", "#SterilePackaging", "#MedicalDevices", "#QualityControl", "#Manufacturing"],
    slides: [
      { type: "hook", headline: "Bem-Vindo à Pureza", body: "ISO 7 Cleanroom: onde a precisão encontra a pureza absoluta. Zero contaminação, zero handoffs. 🧪" },
      { type: "content", headline: "Limpeza Ultrassônica", body: "Ondas ultrassônicas removem partículas invisíveis. Processo validado para implantes ortopédicos e dentários." },
      { type: "content", headline: "Passivação", body: "Tratamento químico que forma camada protetora no titânio. Aumenta biocompatibilidade e resistência à corrosão." },
      { type: "content", headline: "Embalagem Estéril", body: "Selagem em ambiente controlado. Cada lote rastreável do início ao fim. Pronto para o centro cirúrgico." },
      { type: "cta", headline: "Tudo Sob 1 Teto", body: "Sem fornecedores intermediários. Sem risco de contaminação. Agende seu tour virtual. 🏭" },
    ],
  },
  {
    id: "ig-post-06-local-vs-import",
    topic: "O Custo Real da Importação vs. Fabricação Local de Dispositivos Médicos",
    target_audience: "Diretores Financeiros, Procurement, Supply Chain Managers",
    pain_point: "Hidden costs of imports: customs, lead times, inventory lock-up, compliance delays",
    desired_outcome: "Drive awareness of TCO advantages of local manufacturing with Lifetrek",
    post_type: "carousel",
    caption: `Importar parece mais barato. Até você fazer as contas. 📊

Custos ocultos da importação:
❌ Lead time de 90-120 dias
❌ Capital parado em estoque
❌ Custos de desembaraço aduaneiro
❌ Risco de lotes retidos na ANVISA

Com fabricação local:
✅ Lead time de 15-30 dias
✅ Estoque just-in-time
✅ Suporte regulatório direto
✅ Flexibilidade para mudanças de design

Comente "TCO" para receber nosso comparativo completo.`,
    hashtags: ["#MedTechBrasil", "#SupplyChain", "#Hospitalar", "#FabricaçãoLocal", "#DispositivosMédicos"],
    slides: [
      { type: "hook", headline: "Importar é Mais Barato?", body: "Parece. Até você somar alfândega, estoque parado, lead time de 120 dias e lotes retidos na ANVISA. 📊" },
      { type: "content", headline: "Custos Ocultos", body: "Desembaraço aduaneiro + armazenagem + capital de giro congelado. A importação custa 40% mais do que o preço FOB." },
      { type: "content", headline: "Lead Time: 15 vs 120", body: "Fabricação local: 15-30 dias. Importação: 90-120 dias. Em recalls, cada dia conta." },
      { type: "content", headline: "Flexibilidade Total", body: "Mudança de design? Lote piloto? Com fabricação local, você itera em semanas, não em trimestres." },
      { type: "cta", headline: "Faça as Contas", body: "Comente 'TCO' para receber nosso comparativo completo de custos. 📊" },
    ],
  },
];

// ─── CLI args ───────────────────────────────────────────────────────────────
const args = Deno.args;
const dryRun = args.includes("--dry-run");
const imagesOnly = args.includes("--images-only");

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📸 Instagram Campaign Seeder & Image Generator`);
  console.log(`${"─".repeat(55)}`);
  if (dryRun) console.log("   🏁 DRY RUN — no changes will be made\n");

  // 1. Query existing posts
  console.log("📋 Checking existing Instagram posts...");
  const { data: existing, error: fetchError } = await supabase
    .from("instagram_posts")
    .select("id, topic, status, image_urls, slides")
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("❌ Error querying instagram_posts:", fetchError.message);
    Deno.exit(1);
  }

  console.log(`   Found ${existing?.length || 0} existing posts\n`);
  existing?.forEach((p: any, i: number) => {
    const hasImages = p.image_urls && p.image_urls.length > 0;
    const hasSlides = p.slides && p.slides.length > 0;
    const icon = hasImages ? "🖼️" : "⬜";
    console.log(`   ${icon} ${i + 1}. "${p.topic?.slice(0, 60)}..." [${p.status}] ${hasSlides ? `${p.slides.length} slides` : "no slides"} ${hasImages ? `${p.image_urls.length} images` : "no images"}`);
  });

  // 2. Seed missing campaign posts
  let postIds: string[] = (existing || []).map((p: any) => p.id);
  const postsNeedingImages: { id: string; topic: string; hasSlides: boolean }[] = [];

  if (!imagesOnly) {
    console.log("\n🌱 Seeding campaign posts...");
    const existingTopics = new Set((existing || []).map((p: any) => p.topic?.toLowerCase().trim()));

    let seeded = 0;
    for (const post of CAMPAIGN_POSTS) {
      const topicLower = post.topic.toLowerCase().trim();
      if (existingTopics.has(topicLower)) {
        console.log(`   ⏭️  Already exists: "${post.topic.slice(0, 50)}..."`);
        // Still add to image queue if missing images
        const existing_post = existing?.find((p: any) => p.topic?.toLowerCase().trim() === topicLower);
        if (existing_post && (!existing_post.image_urls || existing_post.image_urls.length === 0)) {
          postsNeedingImages.push({ id: existing_post.id, topic: post.topic, hasSlides: !!existing_post.slides?.length });
        }
        continue;
      }

      if (dryRun) {
        console.log(`   🏁 Would insert: "${post.topic.slice(0, 50)}..."`);
        seeded++;
        continue;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("instagram_posts")
        .insert({
          topic: post.topic,
          caption: post.caption,
          hashtags: post.hashtags,
          post_type: post.post_type,
          target_audience: post.target_audience,
          pain_point: post.pain_point,
          desired_outcome: post.desired_outcome,
          slides: post.slides,
          status: "draft",
          generation_metadata: {
            pipeline_version: "seed-from-campaign",
            campaign_id: post.id,
          },
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(`   ❌ Failed to insert "${post.topic.slice(0, 40)}...": ${insertError.message}`);
        continue;
      }

      console.log(`   ✅ Seeded: "${post.topic.slice(0, 50)}..." → ${inserted.id}`);
      postIds.push(inserted.id);
      postsNeedingImages.push({ id: inserted.id, topic: post.topic, hasSlides: true });
      seeded++;
    }

    console.log(`\n   📊 Seeded ${seeded} new posts`);
  }

  // 3. Collect all posts needing images
  if (imagesOnly || postsNeedingImages.length === 0) {
    // Re-query to find all posts without images
    const { data: allPosts } = await supabase
      .from("instagram_posts")
      .select("id, topic, slides, image_urls")
      .order("created_at", { ascending: true });

    for (const p of allPosts || []) {
      const hasImages = p.image_urls && p.image_urls.length > 0;
      const hasSlides = p.slides && p.slides.length > 0;
      if (!hasImages && hasSlides) {
        postsNeedingImages.push({ id: p.id, topic: p.topic, hasSlides: true });
      }
    }
  }

  if (postsNeedingImages.length === 0) {
    console.log("\n✅ All posts already have images. Nothing to generate.");
    return;
  }

  // 4. Generate images for each post
  console.log(`\n📸 Generating images for ${postsNeedingImages.length} posts...`);
  console.log(`${"─".repeat(55)}`);

  if (dryRun) {
    postsNeedingImages.forEach((p, i) => {
      console.log(`   🏁 Would generate images for: "${p.topic.slice(0, 50)}..."`);
    });
    console.log("\n🏁 Dry run complete.");
    return;
  }

  const functionUrl = `${SUPABASE_URL}/functions/v1/regenerate-carousel-images`;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < postsNeedingImages.length; i++) {
    const post = postsNeedingImages[i];
    console.log(`\n   [${i + 1}/${postsNeedingImages.length}] "${post.topic.slice(0, 50)}..."`);
    console.log(`   ID: ${post.id}`);

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carousel_id: post.id,
          table_name: "instagram_posts",
          mode: "hybrid",
          batch_mode: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`   ❌ HTTP ${response.status}: ${errText.slice(0, 200)}`);
        failCount++;
        continue;
      }

      const result = await response.json();

      if (result.success) {
        console.log(`   ✅ ${result.images_generated || result.slides_regenerated || "?"} images generated (${result.duration_ms}ms)`);
        successCount++;
      } else {
        console.error(`   ❌ ${result.error || "Unknown error"}`);
        failCount++;
      }
    } catch (e) {
      console.error(`   ❌ Network error: ${e}`);
      failCount++;
    }

    // Rate limit buffer between calls
    if (i < postsNeedingImages.length - 1) {
      console.log("   ⏳ Waiting 3s before next...");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n${"═".repeat(55)}`);
  console.log(`📊 Results: ${successCount} succeeded, ${failCount} failed out of ${postsNeedingImages.length}`);
  console.log(`${"═".repeat(55)}`);
}

await main();

#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

type CarouselConfig = {
  topic: string;
  targetAudience?: string;
  painPoint?: string;
  desiredOutcome?: string;
  ctaAction?: string;
  postType?: "value" | "commercial";
  format?: "carousel" | "single-image";
  selectedEquipment?: string[];
  referenceImage?: string;
};

const FUNCTION_URL =
  Deno.env.get("FUNCTION_URL") ||
  "https://dlflpvmdzkeouhgqwqba.supabase.co/functions/v1/generate-linkedin-carousel";
const SUPABASE_URL = Deno.env.get("REMOTE_SUPABASE_URL") || "https://dlflpvmdzkeouhgqwqba.supabase.co";
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ADMIN_USER_ID = Deno.env.get("ADMIN_USER_ID") || "3f14bb1b-57e5-4086-b2e4-c620dd886adc";

if (!KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  Deno.exit(1);
}

const inputPath = Deno.args[0] || "scripts/capabilities-posts-batch.json";
const configs = JSON.parse(await Deno.readTextFile(inputPath)) as CarouselConfig[];

async function generate(config: CarouselConfig) {
  const resp = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${KEY}`,
      "apikey": KEY,
    },
    body: JSON.stringify({
      topic: config.topic,
      targetAudience: config.targetAudience || "Geral",
      painPoint: config.painPoint || "",
      desiredOutcome: config.desiredOutcome || "",
      ctaAction: config.ctaAction || "",
      postType: config.postType || "value",
      format: config.format || "carousel",
      selectedEquipment: config.selectedEquipment || [],
      referenceImage: config.referenceImage || "",
      numberOfCarousels: 1,
      stream: false,
      batchMode: true,
      persistIdea: false,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Generate failed ${resp.status}: ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.carousel || data.carousels?.[0];
}

async function persist(carousel: any, config: CarouselConfig) {
  const imageUrls = Array.isArray(carousel.slides)
    ? carousel.slides.map((s: any) => s?.imageUrl || s?.image_url).filter(Boolean)
    : [];

  const payload = {
    admin_user_id: ADMIN_USER_ID,
    topic: config.topic,
    target_audience: config.targetAudience || "Geral",
    pain_point: config.painPoint || "",
    desired_outcome: config.desiredOutcome || "",
    proof_points: JSON.stringify(carousel.proofPoints || []),
    cta_action: config.ctaAction || "",
    caption: carousel.caption || "",
    slides: carousel.slides || [],
    format: config.format || "carousel",
    status: "pending_approval",
    generation_method: "multi_agent",
    generation_settings: {
      postType: config.postType || "value",
      selectedEquipment: config.selectedEquipment || [],
    },
    image_urls: imageUrls,
    profile_type: "company",
    tone: "Professional",
    quality_score: carousel.qualityScore || 85,
    generation_metadata: {
      modelVersions: carousel.modelVersions || null,
      source: "batch-generate-carousels-local-persist",
    },
  };

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/linkedin_carousels`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${KEY}`,
      "apikey": KEY,
      "prefer": "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    throw new Error(`Persist failed ${resp.status}: ${await resp.text()}`);
  }

  const rows = await resp.json();
  return rows?.[0]?.id as string;
}

let ok = 0;
let fail = 0;
for (let i = 0; i < configs.length; i++) {
  const cfg = configs[i];
  try {
    console.log(`\n[${i + 1}/${configs.length}] ${cfg.topic.slice(0, 70)}...`);
    const t0 = Date.now();
    const carousel = await generate(cfg);
    if (!carousel?.slides?.length) {
      throw new Error("No slides returned");
    }
    const id = await persist(carousel, cfg);
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✅ saved id=${id} slides=${carousel.slides.length} (${sec}s)`);
    ok++;
  } catch (e) {
    console.error(`❌ ${e instanceof Error ? e.message : String(e)}`);
    fail++;
  }
}

console.log(`\nDone: ok=${ok} fail=${fail}`);
if (fail > 0) Deno.exit(1);

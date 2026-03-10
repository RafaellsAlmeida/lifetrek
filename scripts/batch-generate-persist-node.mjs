#!/usr/bin/env node

import fs from 'node:fs/promises';

const FUNCTION_URL = process.env.FUNCTION_URL || 'https://dlflpvmdzkeouhgqwqba.supabase.co/functions/v1/generate-linkedin-carousel';
const SUPABASE_URL = process.env.REMOTE_SUPABASE_URL || 'https://dlflpvmdzkeouhgqwqba.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '3f14bb1b-57e5-4086-b2e4-c620dd886adc';
const inputPath = process.argv[2] || 'scripts/capabilities-posts-batch.json';

if (!KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function requestWithRetry(url, options, label, retries = 3) {
  let lastError;
  for (let i = 0; i < retries; i += 1) {
    try {
      const resp = await fetch(url, options);
      return resp;
    } catch (err) {
      lastError = err;
      const backoff = 1000 * (i + 1);
      console.warn(`⚠️ ${label} network retry ${i + 1}/${retries} in ${backoff}ms`);
      await wait(backoff);
    }
  }
  throw lastError;
}

async function generate(config) {
  const resp = await requestWithRetry(
    FUNCTION_URL,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${KEY}`,
        apikey: KEY,
      },
      body: JSON.stringify({
        topic: config.topic,
        targetAudience: config.targetAudience || 'Geral',
        painPoint: config.painPoint || '',
        desiredOutcome: config.desiredOutcome || '',
        ctaAction: config.ctaAction || '',
        postType: config.postType || 'value',
        format: config.format || 'carousel',
        selectedEquipment: config.selectedEquipment || [],
        referenceImage: config.referenceImage || '',
        numberOfCarousels: 1,
        stream: false,
        batchMode: true,
        persistIdea: false,
      }),
    },
    'generate'
  );

  if (!resp.ok) {
    throw new Error(`Generate failed ${resp.status}: ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.carousel || data.carousels?.[0];
}

async function persist(carousel, config) {
  const imageUrls = Array.isArray(carousel.slides)
    ? carousel.slides.map((s) => s?.imageUrl || s?.image_url).filter(Boolean)
    : [];

  const payload = {
    admin_user_id: ADMIN_USER_ID,
    topic: config.topic,
    target_audience: config.targetAudience || 'Geral',
    pain_point: config.painPoint || '',
    desired_outcome: config.desiredOutcome || '',
    proof_points: JSON.stringify(carousel.proofPoints || []),
    cta_action: config.ctaAction || '',
    caption: carousel.caption || '',
    slides: carousel.slides || [],
    format: config.format || 'carousel',
    status: 'pending_approval',
    generation_method: 'multi_agent',
    generation_settings: {
      postType: config.postType || 'value',
      selectedEquipment: config.selectedEquipment || [],
    },
    image_urls: imageUrls,
    profile_type: 'company',
    tone: 'Professional',
    quality_score: carousel.qualityScore || 85,
    generation_metadata: {
      modelVersions: carousel.modelVersions || null,
      source: 'batch-generate-persist-node',
    },
  };

  const resp = await requestWithRetry(
    `${SUPABASE_URL}/rest/v1/linkedin_carousels`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${KEY}`,
        apikey: KEY,
        prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    },
    'persist'
  );

  if (!resp.ok) {
    throw new Error(`Persist failed ${resp.status}: ${await resp.text()}`);
  }

  const rows = await resp.json();
  return rows?.[0]?.id;
}

const configs = JSON.parse(await fs.readFile(inputPath, 'utf8'));
let ok = 0;
let fail = 0;

for (let i = 0; i < configs.length; i += 1) {
  const cfg = configs[i];
  const started = Date.now();
  try {
    console.log(`\n[${i + 1}/${configs.length}] ${cfg.topic.slice(0, 70)}...`);
    const carousel = await generate(cfg);
    if (!carousel?.slides?.length) throw new Error('No slides returned');
    const id = await persist(carousel, cfg);
    const sec = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`✅ saved id=${id} slides=${carousel.slides.length} (${sec}s)`);
    ok += 1;
  } catch (err) {
    fail += 1;
    console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`\nDone: ok=${ok} fail=${fail}`);
if (fail > 0) process.exit(1);

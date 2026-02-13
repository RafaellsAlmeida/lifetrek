#!/usr/bin/env node
/* eslint-disable no-console */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { BLOG_PLAN, slugify } = require("./generate_blogs_from_marketing_assets.cjs");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function trimTo(value, maxLen) {
  const str = String(value || "").trim();
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim();
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const planById = new Map(BLOG_PLAN.map((item) => [item.id, item]));

  const { data: allPosts, error } = await supabase
    .from("blog_posts")
    .select("id,title,slug,seo_title,seo_description,keywords,metadata")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const usedSlugs = new Set((allPosts || []).map((p) => p.slug).filter(Boolean));
  const generated = (allPosts || []).filter((row) => row?.metadata?.marketing_assets_plan_id);
  let updates = 0;

  for (const row of generated) {
    const planId = row.metadata.marketing_assets_plan_id;
    const plan = planById.get(planId);
    if (!plan) continue;

    const desiredTitle = plan.topic;
    const desiredSeoTitle = trimTo(plan.topic, 60);
    const desiredKeywords = plan.keywords || [];

    let desiredSlug = slugify(desiredTitle) || row.slug;
    if (desiredSlug !== row.slug) {
      let idx = 2;
      let candidate = desiredSlug;
      while (usedSlugs.has(candidate)) {
        candidate = `${desiredSlug}-${idx++}`;
      }
      desiredSlug = candidate;
      usedSlugs.add(desiredSlug);
    }

    const mergedMetadata = {
      ...(row.metadata || {}),
      expected_topic: desiredTitle,
      title_aligned_at: new Date().toISOString(),
    };

    const mustUpdate =
      normalize(row.title) !== normalize(desiredTitle) ||
      normalize(row.seo_title) !== normalize(desiredSeoTitle) ||
      JSON.stringify(row.keywords || []) !== JSON.stringify(desiredKeywords) ||
      row.slug !== desiredSlug;

    if (!mustUpdate) continue;

    const payload = {
      title: desiredTitle,
      seo_title: desiredSeoTitle,
      keywords: desiredKeywords,
      slug: desiredSlug,
      metadata: mergedMetadata,
    };

    const { error: updateError } = await supabase.from("blog_posts").update(payload).eq("id", row.id);
    if (updateError) {
      console.error(`❌ ${planId}: ${updateError.message}`);
      continue;
    }

    updates += 1;
    console.log(`✅ ${planId}: "${desiredTitle}"`);
  }

  console.log(`\nDone. Updated ${updates} blog post(s).`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

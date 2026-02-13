#!/usr/bin/env node
/* eslint-disable no-console */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const BAD_SCOPE_RE = /(amorim|stout|\basc\b|framework\s*4p|metodologia\s*4p|\bcrm\b|\bai\b|\bia\b|intelig[êe]ncia\s*artificial)/i;
const REGULATORY_RE = /(anvisa|rdc|compliance regulat[oó]r|regulat[oó]ri)/i;

function hasScores(scores) {
  return (
    scores &&
    typeof scores === "object" &&
    ["MI", "OD", "VT", "HS", "CM"].every((k) => typeof scores[k] === "number")
  );
}

async function run() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,title,status,content,metadata,created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  const rows = (data || []).filter((row) => row?.metadata?.marketing_assets_plan_id);

  const counts = {
    total: rows.length,
    icpPrimary: 0,
    pillarKeyword: 0,
    ctaMode: 0,
    icpSecondary: 0,
    icpScores: 0,
    badScopeMentions: 0,
  };

  for (const row of rows) {
    const md = row.metadata || {};
    if (typeof md.icp_primary === "string" && md.icp_primary.length > 0) counts.icpPrimary += 1;
    if (typeof md.pillar_keyword === "string" && md.pillar_keyword.length > 0) counts.pillarKeyword += 1;
    if (typeof md.cta_mode === "string" && md.cta_mode.length > 0) counts.ctaMode += 1;
    if (Array.isArray(md.icp_secondary)) counts.icpSecondary += 1;
    if (hasScores(md.icp_specificity_scores)) counts.icpScores += 1;

    const merged = `${row.title || ""}\n${row.content || ""}`;
    if (BAD_SCOPE_RE.test(merged)) counts.badScopeMentions += 1;
  }

  let maxRegulatoryRun = 0;
  let currentRun = 0;
  for (const row of rows) {
    if (REGULATORY_RE.test(row.title || "")) {
      currentRun += 1;
      maxRegulatoryRun = Math.max(maxRegulatoryRun, currentRun);
    } else {
      currentRun = 0;
    }
  }

  console.log(`ICP-First Verification - ${new Date().toISOString()}`);
  console.log(`marketing_assets_posts: ${counts.total}`);
  console.log(`icp_primary_set: ${counts.icpPrimary}/${counts.total}`);
  console.log(`pillar_keyword_set: ${counts.pillarKeyword}/${counts.total}`);
  console.log(`cta_mode_set: ${counts.ctaMode}/${counts.total}`);
  console.log(`icp_secondary_set: ${counts.icpSecondary}/${counts.total}`);
  console.log(`icp_scores_set: ${counts.icpScores}/${counts.total}`);
  console.log(`bad_scope_mentions: ${counts.badScopeMentions}`);
  console.log(`max_regulatory_sequence: ${maxRegulatoryRun}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


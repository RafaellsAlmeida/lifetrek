#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Cleans the 24 Marketing Assets blog posts to keep them strictly in Lifetrek scope.
 *
 * Why this exists:
 * - Early drafts sometimes include generic management frameworks (OKR, DMAIC, Six Sigma, etc.)
 *   or off-topic industry references ("construção", "consultoria").
 * - The user explicitly wants Lifetrek-only, engineer-to-engineer content.
 * - We also enforce a visible "Referências" section (as a section heading), not just the word
 *   "referências" inside paragraphs.
 */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OFFSCOPE_BLOCK_RE =
  /(lean\s*six\s*sigma|six\s*sigma|\bdmaic\b|\bokrs?\b|\bbpi\b|business\s+process\s+improvement|framework\s+t[ée]cnico\s+de\s+4\s+pilares|\b4\s+pilares\b|modelo\s+t[ée]cnico\s+de\s+execu[cç][aã]o|sistema\s+interno\s+de\s+gest[aã]o|\bconsultoria\b|\bconstru[cç][aã]o\b)/i;

const REFERENCES_HEADING_RE = /<h2\b[^>]*>\s*refer[eê]ncias\s*<\/h2>/i;
const FAQ_HEADING_RE = /<h2\b[^>]*>\s*(perguntas\s+frequentes|faq)\s*<\/h2>/i;

const CURRENCY_RE = /\b(?:R\$|US\$)\s*\d[\d.\s]*(?:,\d+)?/g;
const PERCENT_RE = /\b\d{1,3}\s?%/g;

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function dedupe(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function removeOffscopeBlocks(html) {
  let content = String(html || "");

  const dropIfMatch = (block) => (OFFSCOPE_BLOCK_RE.test(block) ? "" : block);

  // Drop blocks that contain off-scope management/framework language.
  // Keep removals block-based to avoid breaking HTML structure.
  content = content.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, dropIfMatch);
  content = content.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, dropIfMatch);
  content = content.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, dropIfMatch);
  content = content.replace(/<h[2-4]\b[^>]*>[\s\S]*?<\/h[2-4]>/gi, dropIfMatch);

  // Remove invented/unsafe numeric marketing claims (currency + %). Keep the sentence but de-numerize it.
  content = content.replace(CURRENCY_RE, "custos relevantes");
  content = content.replace(PERCENT_RE, "um percentual relevante");

  // Normalize semantic structure: the page title is already an H1; content should start at H2.
  content = content.replace(/<h1\b([^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");

  // Normalize whitespace introduced by removals.
  content = content
    .replace(/>\s+</g, "><")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return content;
}

function buildReferencesSection(metadata) {
  const sources = Array.isArray(metadata?.sources) ? metadata.sources.filter(isHttpUrl) : [];
  const urls = dedupe(sources).slice(0, 8);
  if (urls.length === 0) return "";

  const items = urls
    .map(
      (url) =>
        `<li><a href="${url}" target="_blank" rel="noopener noreferrer nofollow">${url}</a></li>`
    )
    .join("");

  return `<h2>Referências</h2><ul>${items}</ul>`;
}

function ensureReferencesSection(content, metadata) {
  if (!content) return content;
  if (REFERENCES_HEADING_RE.test(content)) return content;

  const section = buildReferencesSection(metadata);
  if (!section) return content;

  // Prefer inserting before FAQ heading so it remains near the end.
  if (FAQ_HEADING_RE.test(content)) {
    return content.replace(FAQ_HEADING_RE, `${section}$&`);
  }

  return `${content}\n${section}`;
}

async function main() {
  const { data: rows, error } = await supabase
    .from("blog_posts")
    .select("id,title,slug,status,content,metadata")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const targets = (rows || []).filter((row) => row?.metadata?.marketing_assets_plan_id);
  console.log(`Found ${targets.length} marketing-assets blog post(s) in pending_review.`);

  let updated = 0;
  for (const row of targets) {
    const before = String(row.content || "");
    let content = removeOffscopeBlocks(before);
    content = ensureReferencesSection(content, row.metadata || {});

    if (content === before) continue;

    const nextMetadata = {
      ...(row.metadata || {}),
      cleaned_scope_terms_at: new Date().toISOString(),
      cleaned_scope_terms_version: "v2-management-framework-strip",
    };

    const { error: upErr } = await supabase
      .from("blog_posts")
      .update({ content, metadata: nextMetadata })
      .eq("id", row.id);

    if (upErr) {
      console.error(`❌ ${row.slug}: ${upErr.message}`);
      continue;
    }

    updated += 1;
    console.log(`✅ Cleaned ${row.slug}`);
  }

  console.log(`\nDone. Updated ${updated}/${targets.length} post(s).`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

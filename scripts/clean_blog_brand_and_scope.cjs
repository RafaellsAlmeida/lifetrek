#!/usr/bin/env node
/* eslint-disable no-console */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const BAD_SCOPE_RE = /(amorim|stout|\basc\b|framework\s*4p|metodologia\s*4p|\bcrm\b|intelig[êe]ncia\s*artificial|\bai\b|\bia\b)/i;

function sanitizeText(text) {
  if (!text) return text;
  return String(text)
    .replace(/amorim\s*stout\s*consulting\s*\(asc\)/gi, "Lifetrek Medical")
    .replace(/amorim\s*stout\s*consulting/gi, "Lifetrek Medical")
    .replace(/\bmetodologia\s*4p\b/gi, "modelo técnico de execução da Lifetrek Medical")
    .replace(/\bframework\s*4p\b/gi, "modelo técnico de execução")
    .replace(/\basc\b/gi, "Lifetrek Medical")
    .replace(/\bcrm\b/gi, "sistema interno de gestão")
    .replace(/\bintelig[êe]ncia\s*artificial\b/gi, "engenharia de processo")
    .replace(/\bAI\b/g, "engenharia de processo")
    .replace(/\bIA\b/g, "engenharia de processo")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function removeOfftopicHtmlBlocks(html) {
  let content = String(html || "");

  // Remove paragraphs/headings/list-items that still carry off-scope terms.
  content = content.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (block) => (BAD_SCOPE_RE.test(block) ? "" : block));
  content = content.replace(/<h[2-4]\b[^>]*>[\s\S]*?<\/h[2-4]>/gi, (block) => (BAD_SCOPE_RE.test(block) ? "" : block));
  content = content.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, (block) => (BAD_SCOPE_RE.test(block) ? "" : block));

  // Collapse excessive blank lines introduced by removals.
  content = content
    .replace(/\n{3,}/g, "\n\n")
    .replace(/>\s+</g, "><")
    .trim();

  return content;
}

function ensureOperationalSection(content) {
  if (/implementa[cç][aã]o pr[aá]tica na lifetrek medical/i.test(content)) return content;
  const section =
    "<h2>Implementação prática na Lifetrek Medical</h2>" +
    "<p>Os ganhos reais vêm de disciplina de processo, controle metrológico, validação robusta e integração entre engenharia, manufatura e qualidade. Esse é o foco operacional da Lifetrek Medical para reduzir risco técnico e aumentar previsibilidade.</p>";

  if (/<h2>Refer[eê]ncias<\/h2>/i.test(content)) {
    return content.replace(/<h2>Refer[eê]ncias<\/h2>/i, `${section}<h2>Referências</h2>`);
  }
  return `${content}\n${section}`;
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: rows, error } = await supabase
    .from("blog_posts")
    .select("id,title,excerpt,seo_title,seo_description,content,metadata,status")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const target = rows || [];
  let updated = 0;

  for (const row of target) {
    const mergedText = `${row.title || ""} ${row.excerpt || ""} ${row.seo_title || ""} ${row.seo_description || ""} ${row.content || ""}`;
    if (!BAD_SCOPE_RE.test(mergedText)) continue;

    let content = sanitizeText(row.content || "");
    content = removeOfftopicHtmlBlocks(content);
    content = ensureOperationalSection(content);

    const payload = {
      title: sanitizeText(row.title || ""),
      excerpt: sanitizeText(row.excerpt || ""),
      seo_title: sanitizeText(row.seo_title || ""),
      seo_description: sanitizeText(row.seo_description || ""),
      content,
      metadata: {
        ...(row.metadata || {}),
        cleaned_scope_terms_at: new Date().toISOString(),
      },
    };

    const { error: upErr } = await supabase.from("blog_posts").update(payload).eq("id", row.id);
    if (upErr) {
      console.error(`❌ ${row.id}: ${upErr.message}`);
      continue;
    }
    updated += 1;
    console.log(`✅ Cleaned ${row.id} :: ${payload.title}`);
  }

  console.log(`\nDone. Updated ${updated} post(s).`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

#!/usr/bin/env node
/* eslint-disable no-console */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DRIFT_SLUGS = new Set([
  "plano-de-controle-com-cmm-como-reduzir-risco-dimensional-em-features-criticas",
  "iso-7-na-pratica-pontos-de-controle-para-montagem-e-preparacao-de-kits",
  "quais-skus-migrar-primeiro-metodo-pratico-para-reduzir-risco-de-abastecimento",
  "handoff-de-engenharia-para-producao-sem-retrabalho-em-dispositivos-medicos",
  "tolerancias-funcionais-como-revisar-desenho-para-usinagem-de-precisao",
  "capa-orientado-a-processo-prevenindo-recorrencia-de-nao-conformidades",
  "single-source-partnership-quando-consolidar-fornecedores-faz-sentido",
]);

const DEAD_FDA_URL =
  "https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance";
const FDA_DESIGN_CONTROL_URL =
  "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-control-guidance-medical-device-manufacturers";

const stripHtml = (html) =>
  String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const wordCount = (html) => {
  const txt = stripHtml(html);
  return txt ? txt.split(" ").length : 0;
};

const slugTerms = (slug) =>
  String(slug || "")
    .split(/[^a-z0-9]+/i)
    .filter((x) => x && x.length >= 4)
    .slice(0, 5);

const dedupe = (arr) => Array.from(new Set(arr.filter(Boolean)));

function isValidUrl(u) {
  if (typeof u !== "string") return false;
  const s = u.trim();
  if (!/^https?:\/\//i.test(s)) return false;
  if (/\/regularizac$/i.test(s)) return false;
  if (/example\.com/i.test(s)) return false;
  return true;
}

function buildReferencesSection(sources) {
  const urls = dedupe((sources || []).filter(isValidUrl)).slice(0, 8);
  if (!urls.length) return "";
  const items = urls
    .map(
      (u) =>
        `<li><a href="${u}" target="_blank" rel="noopener noreferrer nofollow">${u}</a></li>`
    )
    .join("");
  return `<h2>Referências</h2><ul>${items}</ul>`;
}

function replaceReferences(content, referencesHtml) {
  if (!referencesHtml) return content;
  const refSectionRe =
    /<h2\b[^>]*>\s*refer[eê]ncias\s*<\/h2>[\s\S]*?(?=<h2\b[^>]*>\s*(perguntas\s+frequentes|faq)\s*<\/h2>|<h2\b[^>]*data-icp-cta="true"[^>]*>|$)/i;
  if (refSectionRe.test(content)) {
    return content.replace(refSectionRe, `${referencesHtml}\n`);
  }
  const faqRe = /<h2\b[^>]*>\s*(perguntas\s+frequentes|faq)\s*<\/h2>/i;
  if (faqRe.test(content)) return content.replace(faqRe, `${referencesHtml}\n$&`);
  const ctaRe = /<h2\b[^>]*data-icp-cta="true"[^>]*>/i;
  if (ctaRe.test(content)) return content.replace(ctaRe, `${referencesHtml}\n$&`);
  return `${content}\n${referencesHtml}`;
}

function ensureConclusionBody(content) {
  const re = /(<h[23]\b[^>]*>\s*conclus[aã]o[^<]*<\/h[23]>)([\s\S]*?)(?=<h[23]\b|<h2\b[^>]*data-icp-cta="true"[^>]*>|$)/gi;
  return content.replace(re, (full, heading, body) => {
    const hasParagraph = /<p\b[^>]*>[\s\S]*?<\/p>/i.test(body) && stripHtml(body).length >= 40;
    if (hasParagraph) return `${heading}${body}`;
    return `${heading}\n<p>Em síntese, a execução consistente depende de critérios técnicos claros, validação documentada e governança ativa entre engenharia, qualidade e operações.</p>${body}`;
  });
}

function addDepthBlock(content, slug) {
  if (/data-depth-v2="true"/i.test(content)) return content;
  const terms = slugTerms(slug).join(", ");
  const block = `
<section data-depth-v2="true">
<h2>Validação e Governança de Execução</h2>
<p>Para transformar diretriz técnica em resultado estável, o time precisa conectar escopo de engenharia, controle de processo e critérios de liberação em uma rotina única de decisão. Esse alinhamento reduz retrabalho, evita desvios recorrentes e melhora previsibilidade de prazo.</p>
<p>No contexto de ${terms || "manufatura médica"}, a recomendação é estabelecer marcos de validação por etapa, com dono técnico, evidência mínima e gatilho de contenção quando a tendência sair da faixa esperada.</p>
<h3>Controles recomendados</h3>
<ul>
  <li>Checklist de transferência técnica entre engenharia, qualidade e produção.</li>
  <li>Painel de KPI com tendência semanal para características críticas.</li>
  <li>Plano de reação formal para desvios de maior severidade.</li>
  <li>Revisão de eficácia das ações corretivas antes de ampliar escala.</li>
</ul>
</section>`;
  const refRe = /<h2\b[^>]*>\s*refer[eê]ncias\s*<\/h2>/i;
  if (refRe.test(content)) return content.replace(refRe, `${block}\n<h2>Referências</h2>`);
  return `${content}\n${block}`;
}

function normalizePhrases(content, slug) {
  let out = String(content || "");

  out = out
    .replace(new RegExp(DEAD_FDA_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), FDA_DESIGN_CONTROL_URL)
    .replace(/engenharia de processo \(engenharia de processo\)/gi, "engenharia de processo")
    .replace(/ROI\s*Estimado:/gi, "Impacto esperado:")
    .replace(/percentual relevante/gi, "de forma relevante")
    .replace(/https:\/\/www\.gov\.br\/anvisa\/pt-br\/setorregulado\/regularizac\b/gi, "https://www.gov.br/anvisa/pt-br/setorregulado/regularizacao/produtos-para-saude")
    .replace(/\bISO\s*10993\b/gi, "normas ISO aplicáveis à biocompatibilidade")
    .replace(/\bISO\s*14801\b/gi, "normas ISO aplicáveis a ensaios mecânicos de fadiga");

  if (slug === "quem-somos-em-termos-tecnicos-processo-etica-e-compromisso-com-qualidade") {
    out = out.replace(
      /A RDC 665\/2022[^.]*requisitos para o registro de dispositivos médicos no Brasil\./i,
      "A RDC 665/2022 trata de boas práticas de fabricação; requisitos de regularização e registro variam conforme classe de risco e enquadramento regulatório do produto."
    );
  }

  if (slug === "quando-internalizar-acabamento-limpeza-e-embalagem-em-projetos-medicos") {
    out = out.replace(
      /A empresa segue rigorosos padrões de controle de qualidade e está certificada[^.]*ANVISA, garantindo a segurança e a eficácia dos dispositivos médicos\./i,
      "A empresa opera com sistema de qualidade alinhado a requisitos normativos e regulatórios aplicáveis; a adequação final depende do escopo do produto, da rota regulatória e da evidência técnica disponível."
    );
  }

  return out;
}

function loadLongVariant(slug) {
  const p = path.join("tmp", "blog_length_variants", slug, "long.html");
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

async function main() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,content,metadata,status")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) throw error;
  const rows = (data || []).filter((r) => r?.metadata?.marketing_assets_plan_id);

  let updated = 0;
  const report = [];

  for (const row of rows) {
    const before = String(row.content || "");
    const beforeWords = wordCount(before);

    let content = before;
    if (DRIFT_SLUGS.has(row.slug)) {
      const variant = loadLongVariant(row.slug);
      if (variant) {
        content = variant;
        content = addDepthBlock(content, row.slug);
      }
    }

    content = normalizePhrases(content, row.slug);
    content = ensureConclusionBody(content);

    const refs = buildReferencesSection(row.metadata?.sources || []);
    content = replaceReferences(content, refs);

    content = content
      .replace(/\n{3,}/g, "\n\n")
      .replace(/>\s+\n\s+</g, ">\n<")
      .trim();

    const afterWords = wordCount(content);
    const changed = content !== before;
    report.push({
      slug: row.slug,
      changed,
      beforeWords,
      afterWords,
      deltaWords: afterWords - beforeWords,
      driftSwap: DRIFT_SLUGS.has(row.slug),
    });

    if (!changed) continue;

    const nextMetadata = {
      ...(row.metadata || {}),
      remediation_pass_at: new Date().toISOString(),
      remediation_pass_version: "v1-depth-preserve-fixes",
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
    console.log(`✅ ${row.slug} (${beforeWords}w -> ${afterWords}w)`);
  }

  const outDir = path.join("tmp", "blog_restore");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "remediation_report_v1.json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  const totals = report.reduce(
    (acc, r) => {
      acc.before += r.beforeWords;
      acc.after += r.afterWords;
      if (r.changed) acc.changed += 1;
      if (r.driftSwap) acc.driftSwaps += 1;
      return acc;
    },
    { before: 0, after: 0, changed: 0, driftSwaps: 0 }
  );

  console.log("\nSummary:");
  console.log(JSON.stringify({ updated, ...totals, report: outFile }, null, 2));
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

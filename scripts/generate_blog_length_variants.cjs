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
const OUT_DIR = path.join("tmp", "blog_length_variants");

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
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3)
    .slice(0, 6);

function pickTitle(content, fallbackTitle) {
  const m = String(content || "").match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  if (m) return m[1].replace(/<[^>]+>/g, "").trim();
  return fallbackTitle || "Guia Técnico";
}

function pickReferences(content) {
  const refMatch = String(content || "").match(
    /<h2\b[^>]*>\s*refer[eê]ncias\s*<\/h2>([\s\S]*?)(?=<h2\b|$)/i
  );
  if (!refMatch) return "";
  const links = Array.from(refMatch[1].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)).slice(
    0,
    3
  );
  if (!links.length) return "";
  return `<h2>Referências</h2><ul>${links
    .map(
      (m) =>
        `<li><a href="${m[1]}" target="_blank" rel="noopener noreferrer nofollow">${m[2].replace(
          /<[^>]+>/g,
          ""
        )}</a></li>`
    )
    .join("")}</ul>`;
}

function pickFaq(content) {
  const faqMatch = String(content || "").match(
    /<h2\b[^>]*>\s*(perguntas\s+frequentes|faq)\s*<\/h2>([\s\S]*?)(?=<h2\b|$)/i
  );
  if (!faqMatch) return "";
  const qa = Array.from(
    faqMatch[2].matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)
  ).slice(0, 2);
  if (!qa.length) return "";
  return `<h2>Perguntas frequentes</h2>${qa
    .map((m) => `<h3>${m[1].replace(/<[^>]+>/g, "").trim()}</h3><p>${m[2].trim()}</p>`)
    .join("")}`;
}

function pickCta(content, title) {
  const m = String(content || "").match(
    /<h2\b[^>]*data-icp-cta="true"[^>]*>([\s\S]*?)<\/h2>\s*<p\b[^>]*>([\s\S]*?)<\/p>/i
  );
  if (m) return `<h2 data-icp-cta="true">${m[1]}</h2><p>${m[2]}</p>`;
  return `<h2 data-icp-cta="true">Próximo passo técnico</h2><p>Se ${title.toLowerCase()} é prioridade no seu roadmap, o próximo passo é revisar escopo, riscos e critérios de validação com o time técnico.</p>`;
}

function shortVariant(row) {
  const content = String(row.content || "");
  const title = pickTitle(content, row.title);
  const terms = slugTerms(row.slug).join(", ");
  const firstP =
    (content.match(/<p\b[^>]*>[\s\S]*?<\/p>/i) || [])[0] ||
    "<p>Este guia resume decisões técnicas e operacionais para execução com menor risco.</p>";
  const references = pickReferences(content);
  const faq = pickFaq(content);
  const cta = pickCta(content, title);

  return [
    `<h2>${title}</h2>`,
    firstP,
    `<h3>Resumo executivo</h3><ul><li>Foco técnico em ${terms || "execução, qualidade e previsibilidade"}.</li><li>Decisões com maior impacto em risco, prazo e conformidade.</li><li>Critérios objetivos para avançar sem retrabalho.</li></ul>`,
    `<h3>Checklist rápido</h3><ol><li>Definir requisitos críticos e critérios de aceitação.</li><li>Executar validação com rastreabilidade de dados.</li><li>Monitorar KPIs de estabilidade nas primeiras entregas.</li></ol>`,
    references,
    faq,
    cta,
  ].join("\n");
}

function longVariant(row) {
  const content = String(row.content || "");
  const title = pickTitle(content, row.title);
  const terms = slugTerms(row.slug);
  const addBlock = `
<h2>Aprofundamento técnico</h2>
<p>Além do fluxo básico, ${title.toLowerCase()} exige controle simultâneo de variáveis de processo, capacidade metrológica e disciplina de documentação. Quando esses três eixos não evoluem no mesmo ritmo, a operação tende a mascarar risco com aparente ganho de velocidade.</p>
<p>Na prática, temas como ${terms.join(", ")} devem ser acompanhados por critérios de liberação explícitos, gatilhos de contenção e rotina de revisão cruzada entre engenharia, qualidade e operações.</p>
<h3>Riscos de execução e mitigação</h3>
<ul>
  <li>Risco de variabilidade oculta: mitigar com plano de medição e tendência por lote.</li>
  <li>Risco de retrabalho entre áreas: mitigar com critérios únicos de transferência.</li>
  <li>Risco de atraso em rampa: mitigar com marcos técnicos e janela de resposta definida.</li>
  <li>Risco regulatório: mitigar com rastreabilidade completa de decisão e evidência.</li>
</ul>
<h3>Plano de implementação em 90 dias</h3>
<ol>
  <li>Dias 1-30: consolidar escopo técnico, riscos prioritários e baseline de KPI.</li>
  <li>Dias 31-60: executar piloto com revisão semanal de desvios e ações corretivas.</li>
  <li>Dias 61-90: estabilizar processo, padronizar documentação e definir regra de escala.</li>
</ol>
<h3>Métricas recomendadas</h3>
<ul>
  <li>First-pass yield em características críticas.</li>
  <li>Tempo de fechamento de não conformidades de maior severidade.</li>
  <li>OTD em lotes de rampa.</li>
  <li>Recorrência de desvios por causa técnica.</li>
</ul>`;

  if (/<h2\b[^>]*>\s*refer[eê]ncias\s*<\/h2>/i.test(content)) {
    return content.replace(/<h2\b[^>]*>\s*refer[eê]ncias\s*<\/h2>/i, `${addBlock}\n<h2>Referências</h2>`);
  }
  return `${content}\n${addBlock}`;
}

async function main() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,content,status,metadata")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data || []).filter((r) => r?.metadata?.marketing_assets_plan_id);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = [];
  for (const row of rows) {
    const dir = path.join(OUT_DIR, row.slug);
    fs.mkdirSync(dir, { recursive: true });

    const medium = String(row.content || "");
    const short = shortVariant(row);
    const long = longVariant(row);

    fs.writeFileSync(path.join(dir, "short.html"), short);
    fs.writeFileSync(path.join(dir, "medium.html"), medium);
    fs.writeFileSync(path.join(dir, "long.html"), long);

    manifest.push({
      slug: row.slug,
      title: row.title,
      words: {
        short: wordCount(short),
        medium: wordCount(medium),
        long: wordCount(long),
      },
      files: {
        short: path.join(dir, "short.html"),
        medium: path.join(dir, "medium.html"),
        long: path.join(dir, "long.html"),
      },
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Generated variants for ${manifest.length} blog posts in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

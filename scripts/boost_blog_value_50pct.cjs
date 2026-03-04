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

const ICP_AUDIENCE = {
  CM: "Parceiros de Manufatura Contratada / OEM",
  MI: "Fabricantes de Implantes e Instrumentos Cirúrgicos",
  HS: "Instituições de Saúde",
  OD: "Tomadores de decisão em operações e supply chain",
  VT: "Times técnicos de validação e testes",
};

function stripHtml(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(html) {
  const txt = stripHtml(html);
  return txt ? txt.split(" ").length : 0;
}

function extractAudienceFromContent(content, metadata) {
  const m = String(content || "").match(
    /<strong>\s*Contexto para\s*([^:]+):\s*<\/strong>/i
  );
  if (m) return m[1].trim();
  return ICP_AUDIENCE[metadata?.icp_primary] || "times técnicos e de operações";
}

function slugTerms(slug) {
  return String(slug || "")
    .split(/[^a-z0-9]+/i)
    .filter((x) => x && x.length >= 4)
    .slice(0, 6);
}

function titleFromContentOrRow(content, fallback) {
  const m = String(content || "").match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  if (!m) return String(fallback || "Tema técnico");
  return m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function removeOldValuePack(content) {
  return String(content || "").replace(
    /<section\b[^>]*data-value-pack-v2="true"[^>]*>[\s\S]*?<\/section>/gi,
    ""
  );
}

function insertBeforeReferences(content, block) {
  const refRe = /<h2\b[^>]*>\s*refer[eê]ncias\s*<\/h2>/i;
  if (refRe.test(content)) return content.replace(refRe, `${block}\n<h2>Referências</h2>`);
  const faqRe = /<h2\b[^>]*>\s*(perguntas\s+frequentes|faq)\s*<\/h2>/i;
  if (faqRe.test(content)) return content.replace(faqRe, `${block}\n$&`);
  const ctaRe = /<h2\b[^>]*data-icp-cta="true"[^>]*>/i;
  if (ctaRe.test(content)) return content.replace(ctaRe, `${block}\n$&`);
  return `${content}\n${block}`;
}

function buildValuePack(row, iteration = 0) {
  const content = String(row.content || "");
  const metadata = row.metadata || {};
  const topic = metadata.expected_topic || row.title || "este tema";
  const pillar = metadata.pillar_keyword || "execução técnica em manufatura médica";
  const cluster = String(metadata.content_cluster || "manufatura médica")
    .replace(/_/g, " ")
    .trim();
  const audience = extractAudienceFromContent(content, metadata);
  const terms = slugTerms(row.slug);
  const termsText = terms.length ? terms.join(", ") : "qualidade, risco e previsibilidade";
  const suffix = iteration > 0 ? ` (Módulo complementar ${iteration})` : "";

  return `
<section data-value-pack-v2="true">
<h2>Guia de Valor Aplicado para ${audience}${suffix}</h2>
<p>Além da visão conceitual, este bloco traduz <strong>${topic}</strong> em plano de execução com foco no que mais importa para ${audience.toLowerCase()}: redução de risco técnico, previsibilidade de entrega e evidência objetiva para tomada de decisão. O objetivo é transformar o tema em resultados auditáveis dentro do ciclo operacional.</p>
<h3>Onde este tema gera valor em 30 dias</h3>
<ul>
  <li>Define critérios de aceitação técnicos ligados a impacto clínico e risco de operação.</li>
  <li>Reduz discussões subjetivas entre engenharia, qualidade e operações com regras objetivas.</li>
  <li>Prioriza ações de maior retorno para ${pillar}, evitando esforço disperso em tarefas de baixo impacto.</li>
  <li>Melhora velocidade de resposta a desvio crítico sem perder rastreabilidade de decisão.</li>
  <li>Cria base comparável para revisão semanal de desempenho em ${cluster}.</li>
</ul>
<h3>Checklist de due diligence técnica (reunião com stakeholders)</h3>
<ol>
  <li>Quais características críticas estão vinculadas diretamente à função do produto e ao modo de falha esperado?</li>
  <li>Quais limites de variação são aceitáveis antes de bloquear lote, reter produto ou abrir CAPA?</li>
  <li>Quais evidências mínimas liberam avanço de fase sem aumentar risco oculto?</li>
  <li>Qual é o tempo-alvo de resposta para desvio de severidade alta e quem é o dono da decisão?</li>
  <li>Quais interfaces entre times (${termsText}) mais geram retrabalho hoje e como padronizar handoff?</li>
  <li>Quais dados entram no painel executivo para diferenciar tendência real de ruído operacional?</li>
</ol>
<h3>Plano 30-60-90 para execução sem retrabalho</h3>
<ul>
  <li><strong>Dias 1-30:</strong> fechar escopo técnico, mapa de riscos e baseline de KPI com definição de dono por indicador.</li>
  <li><strong>Dias 31-60:</strong> executar piloto controlado, registrar desvios por causa raiz e validar eficácia das contenções.</li>
  <li><strong>Dias 61-90:</strong> consolidar padrão operacional, publicar critérios de liberação e formalizar regra de escala.</li>
</ul>
<h3>Métricas que comprovam valor agregado</h3>
<ul>
  <li><strong>First-pass yield:</strong> mede estabilidade real de processo em features críticas.</li>
  <li><strong>Tempo de fechamento de não conformidade crítica:</strong> mede capacidade de reação do sistema.</li>
  <li><strong>Recorrência de desvio:</strong> valida se ação corretiva atacou causa técnica ou apenas sintoma.</li>
  <li><strong>OTD em lotes prioritários:</strong> mede sincronismo entre execução técnica e compromisso comercial.</li>
  <li><strong>Lead time de mudança de engenharia:</strong> mostra maturidade de governança entre áreas.</li>
  <li><strong>Taxa de aprovação na primeira submissão regulatória/documental:</strong> mostra qualidade da evidência.</li>
</ul>
<h3>Perguntas de alto valor para conversa comercial técnica</h3>
<ul>
  <li>Qual risco o cliente está aceitando hoje por falta de integração entre qualidade e produção?</li>
  <li>Quais decisões técnicas ainda dependem de opinião em vez de dados rastreáveis?</li>
  <li>Quais KPIs o cliente apresenta para provar estabilidade, e quais não consegue defender em auditoria?</li>
  <li>Qual parte do fluxo atual mais consome tempo da equipe sem aumentar qualidade percebida?</li>
</ul>
<p>Aplicado corretamente, este framework reduz atrito entre times, aumenta confiança dos stakeholders e acelera decisões com menor exposição a risco. Isso é o que transforma conteúdo em vantagem operacional mensurável.</p>
</section>`;
}

function appendIfNeeded(content, row, targetWords) {
  let out = content;
  let guard = 0;
  while (wordCount(out) < targetWords && guard < 3) {
    guard += 1;
    out = insertBeforeReferences(out, buildValuePack(row, guard));
  }
  return out;
}

async function main() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,status,content,metadata")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data || []).filter((r) => r?.metadata?.marketing_assets_plan_id);
  const report = [];
  let updated = 0;

  for (const row of rows) {
    const before = String(row.content || "");
    const beforeWords = wordCount(before);
    const targetWords = Math.ceil(beforeWords * 1.5);

    let next = removeOldValuePack(before);
    next = insertBeforeReferences(next, buildValuePack(row));
    next = appendIfNeeded(next, row, targetWords);
    next = next
      .replace(/\n{3,}/g, "\n\n")
      .replace(/>\s+\n\s+</g, ">\n<")
      .trim();

    const afterWords = wordCount(next);
    const deltaWords = afterWords - beforeWords;
    const increasedByPct = beforeWords > 0 ? Number(((deltaWords / beforeWords) * 100).toFixed(2)) : 0;
    const changed = next !== before;

    report.push({
      slug: row.slug,
      beforeWords,
      afterWords,
      deltaWords,
      increasedByPct,
      targetWords,
      reached50Pct: afterWords >= targetWords,
      changed,
    });

    if (!changed) continue;

    const nextMetadata = {
      ...(row.metadata || {}),
      value_pack_v2_at: new Date().toISOString(),
      value_pack_v2_version: "v2-50pct-audience-execution",
    };

    const { error: upErr } = await supabase
      .from("blog_posts")
      .update({ content: next, metadata: nextMetadata })
      .eq("id", row.id);
    if (upErr) {
      console.error(`❌ ${row.slug}: ${upErr.message}`);
      continue;
    }
    updated += 1;
    console.log(`✅ ${row.slug} (${beforeWords}w -> ${afterWords}w, +${increasedByPct}%)`);
  }

  const outDir = path.join("tmp", "blog_value_boost");
  fs.mkdirSync(outDir, { recursive: true });
  const reportFile = path.join(outDir, "boost_report_v2.json");
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  const summary = report.reduce(
    (acc, r) => {
      acc.beforeWords += r.beforeWords;
      acc.afterWords += r.afterWords;
      if (r.reached50Pct) acc.reached50Pct += 1;
      if (r.changed) acc.changed += 1;
      return acc;
    },
    { total: report.length, changed: 0, beforeWords: 0, afterWords: 0, reached50Pct: 0 }
  );
  summary.deltaWords = summary.afterWords - summary.beforeWords;
  summary.avgIncreasePct =
    summary.beforeWords > 0
      ? Number((((summary.afterWords - summary.beforeWords) / summary.beforeWords) * 100).toFixed(2))
      : 0;
  summary.report = reportFile;

  console.log("\nSummary:");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

#!/usr/bin/env node
/* eslint-disable no-console */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { BLOG_PLAN } = require("./generate_blogs_from_marketing_assets.cjs");

const ICP_LABELS = {
  MI: "Fabricantes de Implantes e Instrumentos Cirúrgicos",
  OD: "Empresas de Equipamentos Odontológicos",
  VT: "Empresas Veterinárias",
  HS: "Instituições de Saúde",
  CM: "Parceiros de Manufatura Contratada / OEM",
};

const ICP_MATRIX = {
  "ma-fatigue-01": { primary: "MI", scores: { MI: 5, OD: 4, VT: 4, HS: 2, CM: 4 } },
  "ma-fatigue-02": { primary: "MI", scores: { MI: 5, OD: 4, VT: 4, HS: 2, CM: 4 } },
  "ma-fatigue-03": { primary: "CM", scores: { MI: 5, OD: 4, VT: 4, HS: 2, CM: 5 } },
  "ma-fatigue-04": { primary: "MI", scores: { MI: 5, OD: 4, VT: 4, HS: 2, CM: 4 } },
  "ma-dfm-01": { primary: "MI", scores: { MI: 5, OD: 4, VT: 4, HS: 2, CM: 5 } },
  "ma-dfm-02": { primary: "CM", scores: { MI: 5, OD: 4, VT: 4, HS: 2, CM: 5 } },
  "ma-dfm-03": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 2, CM: 5 } },
  "ma-dfm-04": { primary: "MI", scores: { MI: 5, OD: 4, VT: 4, HS: 2, CM: 4 } },
  "ma-quality-01": { primary: "CM", scores: { MI: 5, OD: 4, VT: 4, HS: 3, CM: 5 } },
  "ma-quality-02": { primary: "CM", scores: { MI: 5, OD: 4, VT: 4, HS: 3, CM: 5 } },
  "ma-quality-03": { primary: "CM", scores: { MI: 5, OD: 4, VT: 4, HS: 3, CM: 5 } },
  "ma-quality-04": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 3, CM: 5 } },
  "ma-printpack-01": { primary: "CM", scores: { MI: 5, OD: 4, VT: 4, HS: 3, CM: 5 } },
  "ma-printpack-02": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 2, CM: 5 } },
  "ma-printpack-03": { primary: "HS", scores: { MI: 4, OD: 3, VT: 4, HS: 4, CM: 4 } },
  "ma-supply-01": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 2, CM: 5 } },
  "ma-supply-02": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 2, CM: 5 } },
  "ma-supply-03": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 2, CM: 5 } },
  "ma-supply-04": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 2, CM: 5 } },
  "ma-brand-01": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 2, CM: 5 } },
  "ma-brand-02": { primary: "MI", scores: { MI: 4, OD: 3, VT: 3, HS: 3, CM: 4 } },
  "ma-brand-03": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 3, CM: 5 } },
  "ma-brand-04": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 2, CM: 5 } },
  "ma-brand-05": { primary: "CM", scores: { MI: 4, OD: 3, VT: 3, HS: 2, CM: 5 } },
};

const RESOURCE_OPTIONAL_IDS = new Set([
  "ma-fatigue-03",
  "ma-dfm-01",
  "ma-dfm-03",
  "ma-quality-02",
  "ma-quality-03",
  "ma-supply-01",
  "ma-supply-02",
  "ma-brand-05",
]);

const PILLAR_KEYWORDS = {
  fatigue_validation: "validação de fadiga em implantes",
  dfm_engineering: "DFM para dispositivos médicos",
  quality_metrology: "metrologia e qualidade em dispositivos médicos",
  print_pack_ops: "print to pack em manufatura médica",
  supply_chain_transition: "transição local de supply chain médica",
  brand_capability_scale: "parceria OEM em manufatura médica",
};

const ENTITY_KEYWORDS = {
  fatigue_validation: [
    "implantes ortopédicos",
    "ensaio dinâmico",
    "ISO 14801",
    "falha por fadiga",
    "rugosidade superficial",
  ],
  dfm_engineering: [
    "design for manufacturing",
    "usinagem CNC médica",
    "tolerâncias funcionais",
    "handoff engenharia produção",
  ],
  quality_metrology: [
    "metrologia CMM",
    "rastreabilidade de lote",
    "CAPA",
    "ISO 13485",
  ],
  print_pack_ops: [
    "sala limpa ISO 7",
    "embalagem estéril",
    "print to pack",
    "controle ambiental",
  ],
  supply_chain_transition: [
    "nacionalização de supply chain",
    "migração de SKUs",
    "qualificação de fornecedor",
    "resiliência de abastecimento",
  ],
  brand_capability_scale: [
    "OEM medical manufacturing Brazil",
    "single-source partnership",
    "capacidade produtiva",
    "manufatura médica de precisão",
  ],
};

const PAIN_INTRO_BY_ICP = {
  MI: "equipes de engenharia sofrem com iterações caras entre desenho, protótipo e validação quando processo e metrologia não entram cedo no projeto.",
  OD: "projetos odontológicos exigem repetibilidade dimensional e acabamento consistente para evitar retrabalho técnico e atraso regulatório.",
  VT: "produtos veterinários precisam de adaptação de geometria e controle de processo para manter desempenho e viabilidade de escala.",
  HS: "instituições de saúde enfrentam risco operacional quando montagem, controle ambiental e rastreabilidade não estão bem amarrados.",
  CM: "times de OEM e supply chain perdem previsibilidade quando qualificação técnica, capacidade e governança de transição não são tratadas de forma estruturada.",
};

function sanitizeForbiddenTerms(text) {
  return String(text || "")
    .replace(/amorim\s*stout\s*consulting\s*\(asc\)/gi, "Lifetrek Medical")
    .replace(/amorim\s*stout\s*consulting/gi, "Lifetrek Medical")
    .replace(/amorim\s*stout/gi, "Lifetrek Medical")
    .replace(/\bamorim\b/gi, "Lifetrek Medical")
    .replace(/\bstout\b/gi, "Lifetrek Medical")
    .replace(/\bframework\s*4p\b/gi, "modelo técnico de execução")
    .replace(/\bmetodologia\s*4p\b/gi, "modelo técnico de execução")
    .replace(/\basc\b/gi, "Lifetrek Medical")
    .replace(/\bcrm\b/gi, "sistema interno de gestão")
    .replace(/\bintelig[êe]ncia\s*artificial\b/gi, "engenharia de processo")
    .replace(/\bAI\b/g, "engenharia de processo")
    .replace(/\bIA\b/g, "engenharia de processo");
}

function sanitizeDeep(value) {
  if (typeof value === "string") return sanitizeForbiddenTerms(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeDeep(item));
  if (value && typeof value === "object") {
    const next = {};
    for (const [k, v] of Object.entries(value)) {
      next[k] = sanitizeDeep(v);
    }
    return next;
  }
  return value;
}

function dedupe(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function buildSecondaryIcps(scores, primary) {
  return Object.entries(scores)
    .filter(([code, score]) => code !== primary && Number(score) >= 3)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 2)
    .map(([code]) => code);
}

function getCtaMode(entry) {
  if (RESOURCE_OPTIONAL_IDS.has(entry.id)) return "resource_optional";
  if (entry.stage === "BOFU") return "diagnostico";
  return "article_only";
}

function buildTechnicalCta(mode, primary, title) {
  if (mode === "resource_optional") {
    return `Se fizer sentido para o seu time de ${ICP_LABELS[primary]}, este tema pode ser desdobrado em checklist técnico opcional na próxima conversa com a Lifetrek, sem substituir a avaliação prática do projeto "${title}".`;
  }
  if (mode === "diagnostico") {
    return `Se você está decidindo fornecedor ou transição para este tema, o próximo passo é um diagnóstico técnico com engenharia e qualidade da Lifetrek para revisar risco, tolerâncias e critérios de aprovação.`;
  }
  return `Se este conteúdo conversa com o seu cenário em ${ICP_LABELS[primary]}, o próximo passo é alinhar critérios técnicos do projeto com o time da Lifetrek para reduzir retrabalho desde o início.`;
}

function injectIcpIntro(content, primary) {
  if (!content || /data-icp-intro="true"/i.test(content)) return content;
  const intro = `<p data-icp-intro="true"><strong>Contexto para ${ICP_LABELS[primary]}:</strong> ${PAIN_INTRO_BY_ICP[primary]}</p>`;
  return `${intro}\n${content}`;
}

function injectTechnicalCta(content, mode, primary, title) {
  if (!content || /data-icp-cta="true"/i.test(content)) return content;
  const ctaText = buildTechnicalCta(mode, primary, title);
  const ctaHtml = `<h2 data-icp-cta="true">Próximo passo técnico</h2><p>${ctaText}</p>`;
  return `${content}\n${ctaHtml}`;
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const planById = new Map(BLOG_PLAN.map((entry) => [entry.id, entry]));

  const { data: rows, error } = await supabase
    .from("blog_posts")
    .select("id,title,status,content,metadata")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const target = (rows || []).filter((row) => row?.metadata?.marketing_assets_plan_id);
  let updated = 0;
  const missingMatrix = [];

  for (const row of target) {
    const planId = row.metadata.marketing_assets_plan_id;
    const planEntry = planById.get(planId);
    const matrix = ICP_MATRIX[planId];

    if (!planEntry || !matrix) {
      missingMatrix.push({ id: row.id, title: row.title, planId });
      continue;
    }

    const ctaMode = getCtaMode(planEntry);
    const secondary = buildSecondaryIcps(matrix.scores, matrix.primary);
    const pillarKeyword = PILLAR_KEYWORDS[planEntry.cluster] || "manufatura médica de precisão";
    const entityKeywords = ENTITY_KEYWORDS[planEntry.cluster] || [];

    const contentWithIntro = injectIcpIntro(row.content || "", matrix.primary);
    const contentWithCta = injectTechnicalCta(contentWithIntro, ctaMode, matrix.primary, row.title);

    const metadata = {
      ...sanitizeDeep(row.metadata || {}),
      icp_primary: matrix.primary,
      icp_secondary: secondary,
      icp_specificity_scores: matrix.scores,
      cta_mode: ctaMode,
      pillar_keyword: pillarKeyword,
      entity_keywords: dedupe([...(row.metadata?.entity_keywords || []), ...entityKeywords]),
      icp_first_applied_at: new Date().toISOString(),
      icp_first_plan_version: "2026-02-12",
    };

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({
        content: contentWithCta,
        metadata,
      })
      .eq("id", row.id);

    if (updateError) {
      console.error(`❌ ${planId} (${row.title}): ${updateError.message}`);
      continue;
    }

    updated += 1;
    console.log(`✅ ${planId}: ${row.title} [${matrix.primary}]`);
  }

  console.log(`\nDone. Updated ${updated} post(s).`);
  if (missingMatrix.length > 0) {
    console.log("\nMissing matrix mappings:");
    for (const item of missingMatrix) {
      console.log(`- ${item.planId}: ${item.title}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

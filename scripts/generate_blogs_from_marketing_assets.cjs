#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const SOURCE_DIR = path.join(process.cwd(), "marketing-assets", "linkedin-carousels");
const COVER_IMAGE_PATH = "/images/blog/lifetrek-blog-cover-horizontal.png";
const START_SCHEDULE_UTC = "2026-02-17T17:00:00.000Z"; // 14:00 BRT
const END_SCHEDULE_UTC = "2026-05-31T17:00:00.000Z";
const ALLOWED_SOURCE_STATUSES = new Set(["archived"]);

const SOURCE_LINKS = {
  fatigue_validation: [
    "https://www.iso.org/standard/61997.html",
    "https://pmc.ncbi.nlm.nih.gov/articles/PMC6888446/",
    "https://www.gov.br/anvisa/pt-br/setorregulado/regularizacao/produtos-para-saude/conceitos-e-definicoes/classificacao-de-implantes",
    "https://www.fda.gov/medical-devices/postmarket-requirements-devices/quality-management-system-regulation-qmsr",
  ],
  dfm_engineering: [
    "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-control-guidance-medical-device-manufacturers",
    "https://www.fda.gov/medical-devices/postmarket-requirements-devices/quality-management-system-regulation-qmsr",
    "https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/rdc-665-de-2022",
    "https://www.iso.org/standard/59752.html",
  ],
  quality_metrology: [
    "https://www.nist.gov/metrology/metrological-traceability",
    "https://www.fda.gov/medical-devices/postmarket-requirements-devices/quality-management-system-regulation-qmsr",
    "https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/rdc-665-de-2022",
    "https://www.iso.org/standard/59752.html",
  ],
  print_pack_ops: [
    "https://www.iso.org/standard/53394.html",
    "https://www.iso.org/standard/70799.html",
    "https://www.iso.org/standard/81823.html",
    "https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/rdc-665-de-2022",
  ],
  supply_chain_transition: [
    "https://www.oecd.org/en/publications/2025/06/oecd-supply-chain-resilience-review_9930d256.html",
    "https://www.fda.gov/medical-devices/medical-device-safety/medical-device-supply-chain-and-shortages",
    "https://www.fda.gov/medical-devices/medical-device-supply-chain-and-shortages/medical-device-shortages-list",
    "https://www.trade.gov/country-commercial-guides/brazil-healthcare",
  ],
  brand_capability_scale: [
    "https://www.trade.gov/country-commercial-guides/brazil-healthcare",
    "https://www.fda.gov/medical-devices/postmarket-requirements-devices/quality-management-system-regulation-qmsr",
    "https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/rdc-665-de-2022",
    "https://www.iso.org/standard/59752.html",
  ],
};

const BLOG_PLAN = [
  {
    id: "ma-fatigue-01",
    topic: "3 Erros que Fazem Seu Implante Falhar no Teste de Fadiga",
    category: "Engenharia de Processo",
    cluster: "fatigue_validation",
    sourceFolder: "3-erros-que-fazem-seu-implante-falhar-no-teste-de-fadiga--f567e3bb",
    stage: "MOFU",
    keywords: ["teste de fadiga", "implantes médicos", "validação de produto", "Lifetrek Medical"],
  },
  {
    id: "ma-fatigue-02",
    topic: "Validação de Fadiga em Implantes: do CAD ao Ensaio Dinâmico",
    category: "Engenharia de Processo",
    cluster: "fatigue_validation",
    sourceFolder: "3-erros-que-fazem-seu-implante-falhar-no-teste-de-fadiga--f567e3bb",
    stage: "MOFU",
    keywords: ["ensaio dinâmico", "ISO 14801", "engenharia de implantes", "confiabilidade"],
  },
  {
    id: "ma-fatigue-03",
    topic: "Como Reduzir Iterações Caras em Testes de Fadiga de Implantes",
    category: "Operações e Qualidade",
    cluster: "fatigue_validation",
    sourceFolder: "3-erros-que-fazem-seu-implante-falhar-no-teste-de-fadiga--f567e3bb",
    stage: "BOFU",
    keywords: ["redução de retrabalho", "teste de fadiga", "engenharia de processo", "dispositivos médicos"],
  },
  {
    id: "ma-fatigue-04",
    topic: "Geometria, Rugosidade e Transições: o que mais impacta a fadiga",
    category: "Engenharia de Produto",
    cluster: "fatigue_validation",
    sourceFolder: "3-erros-que-fazem-seu-implante-falhar-no-teste-de-fadiga--f567e3bb",
    stage: "MOFU",
    keywords: ["geometria de implante", "rugosidade superficial", "falha por fadiga", "qualidade de usinagem"],
  },
  {
    id: "ma-dfm-01",
    topic: "Checklist DFM para Implantes: 12 Pontos Antes de Congelar o Desenho",
    category: "Engenharia de Produto",
    cluster: "dfm_engineering",
    sourceFolder: "are-you-missing-a-step-checklist-dfm-para-implantes-e-instrumentais-explained--eae08c83",
    stage: "MOFU",
    keywords: ["checklist DFM", "implantes médicos", "design for manufacturing", "engenharia"],
  },
  {
    id: "ma-dfm-02",
    topic: "DFM sem Comprometer Performance: como cortar custo com segurança",
    category: "Estratégia Industrial",
    cluster: "dfm_engineering",
    sourceFolder: "are-you-missing-a-step-checklist-dfm-para-implantes-e-instrumentais-explained--eae08c83",
    stage: "BOFU",
    keywords: ["DFM", "custo de manufatura", "desempenho do implante", "engenharia médica"],
  },
  {
    id: "ma-dfm-03",
    topic: "Handoff de Engenharia para Produção sem Retrabalho em Dispositivos Médicos",
    category: "Operações e Qualidade",
    cluster: "dfm_engineering",
    sourceFolder: "are-you-missing-a-step-checklist-dfm-para-implantes-e-instrumentais-explained--eae08c83",
    stage: "BOFU",
    keywords: ["handoff engenharia", "transferência para produção", "retrabalho", "medical device manufacturing"],
  },
  {
    id: "ma-dfm-04",
    topic: "Tolerâncias Funcionais: como revisar desenho para usinagem de precisão",
    category: "Engenharia de Produto",
    cluster: "dfm_engineering",
    sourceFolder: "are-you-missing-a-step-checklist-dfm-para-implantes-e-instrumentais-explained--eae08c83",
    stage: "MOFU",
    keywords: ["tolerâncias", "usinagem de precisão", "implantes", "controle dimensional"],
  },
  {
    id: "ma-quality-01",
    topic: "Zero-Defect na Prática: metrologia que sustenta a liberação de lote",
    category: "Qualidade e Metrologia",
    cluster: "quality_metrology",
    sourceFolder: "trust-the-zero-defect-standard--919426f3",
    stage: "MOFU",
    keywords: ["zero defect", "metrologia", "liberação de lote", "qualidade médica"],
  },
  {
    id: "ma-quality-02",
    topic: "Rastreabilidade Total em Dispositivos Médicos: material, processo e inspeção",
    category: "Qualidade e Metrologia",
    cluster: "quality_metrology",
    sourceFolder: "trust-the-zero-defect-standard--919426f3",
    stage: "BOFU",
    keywords: ["rastreabilidade", "controle de processo", "dispositivos médicos", "qualidade"],
  },
  {
    id: "ma-quality-03",
    topic: "Plano de Controle com CMM: como reduzir risco dimensional em features críticas",
    category: "Qualidade e Metrologia",
    cluster: "quality_metrology",
    sourceFolder: "trust-the-zero-defect-standard--919426f3",
    stage: "MOFU",
    keywords: ["CMM", "plano de controle", "feature crítica", "inspeção dimensional"],
  },
  {
    id: "ma-quality-04",
    topic: "CAPA orientado a processo: prevenindo recorrência de não conformidades",
    category: "Qualidade e Metrologia",
    cluster: "quality_metrology",
    sourceFolder: "trust-the-zero-defect-standard--919426f3",
    stage: "BOFU",
    keywords: ["CAPA", "não conformidade", "melhoria contínua", "ISO 13485"],
  },
  {
    id: "ma-printpack-01",
    topic: "Print to Pack: fluxo integrado da usinagem à embalagem estéril",
    category: "Operações e Qualidade",
    cluster: "print_pack_ops",
    sourceFolder: "capabilities-print-to-pack--ce0080b2",
    stage: "MOFU",
    keywords: ["print to pack", "embalagem estéril", "manufatura integrada", "dispositivos médicos"],
  },
  {
    id: "ma-printpack-02",
    topic: "Quando internalizar acabamento, limpeza e embalagem em projetos médicos",
    category: "Estratégia Industrial",
    cluster: "print_pack_ops",
    sourceFolder: "capabilities-print-to-pack--ce0080b2",
    stage: "BOFU",
    keywords: ["acabamento médico", "limpeza validada", "embalagem", "decisão make or buy"],
  },
  {
    id: "ma-printpack-03",
    topic: "ISO 7 na prática: pontos de controle para montagem e preparação de kits",
    category: "Operações e Qualidade",
    cluster: "print_pack_ops",
    sourceFolder: "capabilities-print-to-pack--ce0080b2",
    stage: "MOFU",
    keywords: ["ISO 7", "sala limpa", "montagem de kits", "controle ambiental"],
  },
  {
    id: "ma-supply-01",
    topic: "Plano Piloto de 90 Dias: migrando SKUs críticos para produção local",
    category: "Supply Chain e Risco",
    cluster: "supply_chain_transition",
    sourceFolder: "lifetrek-medical-launch-vision--62b7ef53",
    stage: "BOFU",
    keywords: ["produção local", "plano de 90 dias", "migração de SKUs", "supply chain"],
  },
  {
    id: "ma-supply-02",
    topic: "Quais SKUs migrar primeiro: método prático para reduzir risco de abastecimento",
    category: "Supply Chain e Risco",
    cluster: "supply_chain_transition",
    sourceFolder: "lifetrek-medical-launch-vision--62b7ef53",
    stage: "BOFU",
    keywords: ["priorização de SKU", "risco de abastecimento", "medical devices", "planejamento"],
  },
  {
    id: "ma-supply-03",
    topic: "Governança da transição local: KPIs que importam no primeiro trimestre",
    category: "Supply Chain e Risco",
    cluster: "supply_chain_transition",
    sourceFolder: "lifetrek-medical-launch-real-asset-pt--6863ac69",
    stage: "BOFU",
    keywords: ["KPIs de supply chain", "transição local", "lead time", "resiliência"],
  },
  {
    id: "ma-supply-04",
    topic: "Modelo de qualificação técnica para parceiro local em manufatura médica",
    category: "Supply Chain e Risco",
    cluster: "supply_chain_transition",
    sourceFolder: "lifetrek-medical-launch-composited--703c5790",
    stage: "MOFU",
    keywords: ["qualificação de fornecedor", "parceiro local", "manufatura médica", "auditoria técnica"],
  },
  {
    id: "ma-brand-01",
    topic: "The Precision Partner na prática: como a Lifetrek opera com OEMs",
    category: "Capacidades Lifetrek",
    cluster: "brand_capability_scale",
    sourceFolder: "identity-the-precision-partner--2d26a929",
    stage: "TOFU",
    keywords: ["precision partner", "Lifetrek Medical", "OEM médico", "coengenharia"],
  },
  {
    id: "ma-brand-02",
    topic: "Quem Somos em termos técnicos: processo, ética e compromisso com qualidade",
    category: "Capacidades Lifetrek",
    cluster: "brand_capability_scale",
    sourceFolder: "quem-somos-lifetrek-medical--9c48c28d",
    stage: "TOFU",
    keywords: ["quem somos Lifetrek", "qualidade médica", "ética industrial", "manufatura de precisão"],
  },
  {
    id: "ma-brand-03",
    topic: "Expansão de 5.000m²: como aumentar capacidade sem perder controle",
    category: "Infraestrutura e Escala",
    cluster: "brand_capability_scale",
    sourceFolder: "lifetrek-medical-launch-real-asset-pt--6863ac69",
    stage: "TOFU",
    keywords: ["expansão industrial", "capacidade produtiva", "dispositivos médicos", "Lifetrek"],
  },
  {
    id: "ma-brand-04",
    topic: "Launch com método: readiness técnico para escalar produção médica",
    category: "Infraestrutura e Escala",
    cluster: "brand_capability_scale",
    sourceFolder: "lifetrek-medical-launch-vision--62b7ef53",
    stage: "MOFU",
    keywords: ["readiness industrial", "escala de produção", "medical manufacturing", "qualidade"],
  },
  {
    id: "ma-brand-05",
    topic: "Single-source partnership: quando consolidar fornecedores faz sentido",
    category: "Estratégia Industrial",
    cluster: "brand_capability_scale",
    sourceFolder: "lifetrek-medical-launch-composited--703c5790",
    stage: "BOFU",
    keywords: ["single source", "consolidação de fornecedores", "eficiência operacional", "medical devices"],
  },
];

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const onlyPlan = argv.includes("--plan-only");
const limitFlag = argv.find((arg) => arg.startsWith("--limit="));
const limit = limitFlag ? Number(limitFlag.split("=")[1]) : BLOG_PLAN.length;
const resumeOnly = argv.includes("--resume");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function dedupe(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8").trim();
  } catch {
    return "";
  }
}

function buildScheduleDates(count) {
  const start = new Date(START_SCHEDULE_UTC);
  const end = new Date(END_SCHEDULE_UTC);
  const dates = [];
  const cursor = new Date(start);

  while (cursor <= end && dates.length < count) {
    const day = cursor.getUTCDay();
    if (day === 2 || day === 5) {
      dates.push(new Date(cursor).toISOString());
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (dates.length < count) {
    throw new Error(`Not enough schedule slots (${dates.length}) for ${count} planned posts`);
  }
  return dates;
}

function loadSourceMap() {
  const map = new Map();
  const folders = fs.readdirSync(SOURCE_DIR).filter((name) => {
    const full = path.join(SOURCE_DIR, name);
    return fs.statSync(full).isDirectory();
  });

  for (const folder of folders) {
    const metaPath = path.join(SOURCE_DIR, folder, "metadata.json");
    const captionPath = path.join(SOURCE_DIR, folder, "caption.txt");
    const metadata = safeReadJson(metaPath);
    if (!metadata) continue;
    map.set(folder, {
      folder,
      topic: metadata.topic || folder,
      status: metadata.status || "unknown",
      id: metadata.id || null,
      caption: safeReadText(captionPath),
      slidesCount: metadata.slides_count || null,
    });
  }
  return map;
}

function buildResearchContext(entry, source) {
  const links = SOURCE_LINKS[entry.cluster] || [];
  const sourceCaptionShort = (source.caption || "").replace(/\s+/g, " ").slice(0, 900);
  const linkLines = links.map((url, idx) => `${idx + 1}. ${url}`).join("\n");

  return [
    "Origem da pauta:",
    `- Post do LinkedIn já publicado em marketing-assets (${source.folder}).`,
    `- Tópico original: ${source.topic}.`,
    sourceCaptionShort ? `- Caption original (resumo): ${sourceCaptionShort}` : "",
    "",
    "Objetivo editorial:",
    `- Expandir a ideia do post para blog técnico completo com foco em valor para audiência B2B da Lifetrek.`,
    `- Evitar foco em vídeo; foco em engenharia, qualidade, operação e decisão técnica.`,
    `- Não citar ASC ou qualquer outro cliente. Falar apenas de Lifetrek Medical.`,
    `- Não forçar ANVISA se o tema não for regulatório.`,
    "",
    "Referências sugeridas para citação:",
    linkLines,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPlanMarkdown(planWithDates, sourceMap) {
  const header = [
    "# Blog Plan — Marketing Assets (LinkedIn > Blog)",
    "",
    `Gerado em: ${new Date().toISOString()}`,
    "",
    "| Slot | Data alvo | Stage | Cluster | Fonte LinkedIn | Status da Fonte | Tema de Blog |",
    "|---|---|---|---|---|---|---|",
  ];
  const rows = planWithDates.map((row, idx) => {
    const source = sourceMap.get(row.sourceFolder);
    return `| ${String(idx + 1).padStart(2, "0")} | ${row.scheduledFor.slice(0, 10)} | ${row.stage} | ${row.cluster} | ${source?.topic || row.sourceFolder} | ${source?.status || "missing"} | ${row.topic} |`;
  });
  return `${header.join("\n")}\n${rows.join("\n")}\n`;
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const sourceMap = loadSourceMap();
  const scheduleDates = buildScheduleDates(BLOG_PLAN.length);

  const planWithDates = BLOG_PLAN.map((entry, idx) => ({
    ...entry,
    scheduledFor: scheduleDates[idx],
  }));

  const missingSources = planWithDates.filter((entry) => !sourceMap.has(entry.sourceFolder));
  if (missingSources.length > 0) {
    throw new Error(`Missing source folders: ${missingSources.map((s) => s.sourceFolder).join(", ")}`);
  }

  const invalidStatus = planWithDates.filter((entry) => {
    const source = sourceMap.get(entry.sourceFolder);
    return !ALLOWED_SOURCE_STATUSES.has(source.status);
  });
  if (invalidStatus.length > 0) {
    throw new Error(`Plan uses non-posted sources (expected archived): ${invalidStatus.map((s) => s.sourceFolder).join(", ")}`);
  }

  const planDocPath = path.join(process.cwd(), "docs", "content", "BLOG_24_FROM_MARKETING_ASSETS_PLAN.md");
  fs.writeFileSync(planDocPath, buildPlanMarkdown(planWithDates, sourceMap), "utf-8");
  console.log(`🗂️ Plan saved at ${planDocPath}`);

  if (onlyPlan || dryRun) {
    console.log(`ℹ️ Exiting in ${onlyPlan ? "--plan-only" : "--dry-run"} mode.`);
    return;
  }

  const { data: existingPosts, error: existingError } = await supabase
    .from("blog_posts")
    .select("id,title,slug,status,author_id,user_id,metadata")
    .order("created_at", { ascending: false });

  if (existingError) throw existingError;

  const existingByPlanId = new Map();
  const usedSlugs = new Set();
  let fallbackAuthorId = null;
  for (const post of existingPosts || []) {
    if (post?.slug) usedSlugs.add(post.slug);
    if (!fallbackAuthorId && post?.author_id) fallbackAuthorId = post.author_id;
    const planId = post?.metadata?.marketing_assets_plan_id;
    if (planId) existingByPlanId.set(planId, post);
  }

  const targetItems = planWithDates
    .filter((entry) => (resumeOnly ? !existingByPlanId.has(entry.id) : true))
    .slice(0, Math.max(0, limit));

  console.log(`🚀 Generating ${targetItems.length} blog(s) from marketing-assets plan...`);

  let successCount = 0;
  let skippedCount = 0;
  const failures = [];

  for (let i = 0; i < targetItems.length; i++) {
    const entry = targetItems[i];
    const source = sourceMap.get(entry.sourceFolder);

    if (existingByPlanId.has(entry.id)) {
      skippedCount += 1;
      console.log(`⏭️ Skipping existing plan id ${entry.id}`);
      continue;
    }

    const researchContext = buildResearchContext(entry, source);
    const sourceUrls = dedupe(SOURCE_LINKS[entry.cluster] || []);

    console.log(`\n[${i + 1}/${targetItems.length}] ${entry.topic}`);
    console.log(`   Source: ${source.topic}`);

    try {
      const { data: generated, error: fnError } = await supabase.functions.invoke("generate-blog-post", {
        body: {
          topic: entry.topic,
          category: entry.category,
          research_context: researchContext,
          skipImage: true,
          keywords: entry.keywords,
        },
      });

      if (fnError) {
        throw new Error(`Function error: ${fnError.message || "Unknown function error"}`);
      }
      if (!generated || generated.error) {
        throw new Error(`Generation failed: ${generated?.error || "empty response"}`);
      }

      let baseSlug = generated.slug || slugify(generated.title) || `post-${Date.now()}`;
      if (!baseSlug) baseSlug = `post-${Date.now()}`;
      let finalSlug = baseSlug;
      let suffix = 2;
      while (usedSlugs.has(finalSlug)) {
        finalSlug = `${baseSlug}-${suffix++}`;
      }
      usedSlugs.add(finalSlug);

      const metadata = {
        strategy: generated.strategy_brief || null,
        sources: dedupe([...(generated.sources || []), ...sourceUrls]),
        source_linkedin: {
          folder: source.folder,
          id: source.id,
          topic: source.topic,
          status: source.status,
          caption_excerpt: (source.caption || "").slice(0, 1200),
        },
        marketing_assets_plan_id: entry.id,
        content_cluster: entry.cluster,
        funnel_stage: entry.stage,
        target_date: entry.scheduledFor,
        generation_origin: "marketing_assets_linkedin_expansion",
      };

      const insertPayload = {
        author_id: fallbackAuthorId,
        user_id: fallbackAuthorId,
        title: generated.title,
        content: generated.content,
        excerpt: generated.excerpt,
        featured_image: generated.featured_image || COVER_IMAGE_PATH,
        status: "pending_review",
        slug: finalSlug,
        seo_title: generated.seo_title,
        seo_description: generated.seo_description,
        keywords: Array.isArray(generated.keywords) ? generated.keywords : entry.keywords,
        ai_generated: true,
        scheduled_for: entry.scheduledFor,
        metadata,
      };

      let { data: inserted, error: insertError } = await supabase
        .from("blog_posts")
        .insert([insertPayload])
        .select("id,title,slug,status")
        .single();

      // Backward compatibility for environments where scheduled_for is missing.
      if (insertError && /scheduled_for/i.test(insertError.message || "")) {
        const retryPayload = { ...insertPayload };
        delete retryPayload.scheduled_for;
        ({ data: inserted, error: insertError } = await supabase
          .from("blog_posts")
          .insert([retryPayload])
          .select("id,title,slug,status")
          .single());
      }

      if (insertError) {
        throw new Error(`Insert error: ${insertError.message}`);
      }

      successCount += 1;
      console.log(`✅ Inserted ${inserted.id} (${inserted.slug})`);

      await sleep(1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ planId: entry.id, topic: entry.topic, error: message });
      console.error(`❌ ${entry.id}: ${message}`);
      await sleep(800);
    }
  }

  console.log("\n===== SUMMARY =====");
  console.log(`Generated: ${successCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${failures.length}`);

  if (failures.length > 0) {
    const failurePath = path.join(process.cwd(), "output", "blog_generation_failures_marketing_assets.json");
    fs.mkdirSync(path.dirname(failurePath), { recursive: true });
    fs.writeFileSync(failurePath, JSON.stringify(failures, null, 2), "utf-8");
    console.log(`Failures saved at ${failurePath}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = {
  BLOG_PLAN,
  SOURCE_LINKS,
  slugify,
};

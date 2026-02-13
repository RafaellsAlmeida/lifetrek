#!/usr/bin/env node
/* eslint-disable no-console */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { BLOG_PLAN, SOURCE_LINKS } = require("./generate_blogs_from_marketing_assets.cjs");

const COVER_IMAGE_PATH = "/images/blog/lifetrek-blog-cover-horizontal.png";

const FAQ_BY_CLUSTER = {
  fatigue_validation: [
    {
      q: "Qual o erro mais comum em validação de fadiga de implantes?",
      a: "Subestimar a interação entre geometria, acabamento superficial e condição de ensaio costuma causar retrabalho caro e atrasos na qualificação.",
    },
    {
      q: "Como reduzir o número de iterações em ensaios de fadiga?",
      a: "Com revisão DFM precoce, definição clara de critérios de aceitação e plano de teste alinhado com risco e aplicação clínica pretendida.",
    },
    {
      q: "Quando envolver metrologia no fluxo de fadiga?",
      a: "Desde o protótipo inicial, para garantir que o comportamento no ensaio reflita a condição dimensional real da peça final.",
    },
  ],
  dfm_engineering: [
    {
      q: "Qual o benefício prático do DFM em implantes?",
      a: "Reduzir retrabalho de engenharia, melhorar repetibilidade no processo e encurtar o tempo entre desenho e produção estável.",
    },
    {
      q: "DFM ajuda apenas em custo?",
      a: "Não. Também melhora robustez de processo, previsibilidade de qualidade e velocidade de transferência para manufatura.",
    },
    {
      q: "Quando aplicar checklist DFM?",
      a: "Antes do congelamento do desenho e sempre que houver mudança de material, tolerância ou estratégia de usinagem.",
    },
  ],
  quality_metrology: [
    {
      q: "Por que metrologia é crítica em dispositivos médicos?",
      a: "Porque variações pequenas podem impactar acoplamento, desempenho funcional e consistência entre lotes.",
    },
    {
      q: "Rastreabilidade deve cobrir quais etapas?",
      a: "Matéria-prima, processo produtivo, inspeções críticas e histórico de liberação, formando trilha auditável ponta a ponta.",
    },
    {
      q: "Como usar CAPA sem burocracia excessiva?",
      a: "Focando em causa raiz, verificação de eficácia e prevenção de recorrência, com indicadores objetivos por processo.",
    },
  ],
  print_pack_ops: [
    {
      q: "Quando faz sentido integrar usinagem e embalagem no mesmo parceiro?",
      a: "Quando a complexidade de coordenação entre fornecedores aumenta risco, lead time e variabilidade de qualidade.",
    },
    {
      q: "Quais controles são essenciais em ambiente ISO 7?",
      a: "Monitoramento ambiental, disciplina operacional, validação de limpeza e critérios claros de liberação.",
    },
    {
      q: "Integração print-to-pack acelera projetos?",
      a: "Sim, principalmente ao reduzir handoffs e retrabalho entre etapas de manufatura, acabamento e preparação final.",
    },
  ],
  supply_chain_transition: [
    {
      q: "Qual o primeiro passo para migrar produção local?",
      a: "Selecionar SKUs críticos por impacto em risco e lead time, com plano de validação e governança semanal.",
    },
    {
      q: "Quais KPIs priorizar no primeiro trimestre?",
      a: "Lead time, taxa de aprovação em primeira passagem, estabilidade dimensional e confiabilidade de entrega.",
    },
    {
      q: "Como reduzir risco na transição de fornecedor?",
      a: "Com qualificação técnica estruturada, critérios de aceitação transparentes e controle de mudanças formal.",
    },
  ],
  brand_capability_scale: [
    {
      q: "Como avaliar capacidade real de um parceiro de manufatura médica?",
      a: "Observe maturidade de processo, controle de qualidade, integração operacional e evidências de execução consistente.",
    },
    {
      q: "Escalar capacidade sempre melhora resultado?",
      a: "Só quando a expansão vem junto de governança de processo, metrologia e disciplina de execução.",
    },
    {
      q: "O que diferencia parceria técnica de relação transacional?",
      a: "Alinhamento em risco, engenharia colaborativa e compromisso com performance ao longo de todo o ciclo de produto.",
    },
  ],
};

function ensureMetaDescription(topic, current) {
  const clean = String(current || "").replace(/\s+/g, " ").trim();
  if (clean.length >= 140 && clean.length <= 160) return clean;

  let generated = `Entenda ${topic.toLowerCase()} com foco em engenharia, qualidade e operação para decisões mais seguras em dispositivos médicos na Lifetrek Medical.`;
  generated = generated.replace(/\s+/g, " ").trim();

  if (generated.length > 160) {
    generated = `${generated.slice(0, 157).trim()}...`;
  }
  while (generated.length < 140) {
    generated += " Saiba mais.";
  }
  return generated.slice(0, 160);
}

function hasReferencesSection(content) {
  return /refer[eê]ncias/i.test(content || "");
}

function hasFaqSection(content) {
  return /(perguntas\s+frequentes|faq)/i.test(content || "");
}

function buildReferencesHtml(urls) {
  const list = (urls || []).filter((url) => /^https?:\/\//i.test(url));
  if (list.length === 0) return "";
  const items = list.map((url) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer nofollow">${url}</a></li>`).join("");
  return `<h2>Referências</h2><ul>${items}</ul>`;
}

function buildFaqHtml(cluster) {
  const faqs = FAQ_BY_CLUSTER[cluster] || FAQ_BY_CLUSTER.brand_capability_scale;
  const blocks = faqs.map((item) => `<h3>${item.q}</h3><p>${item.a}</p>`).join("");
  return `<h2>Perguntas frequentes</h2>${blocks}`;
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const planById = new Map(BLOG_PLAN.map((entry) => [entry.id, entry]));

  const { data: rows, error } = await supabase
    .from("blog_posts")
    .select("id,title,content,seo_description,keywords,featured_image,metadata")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const target = (rows || []).filter((row) => row?.metadata?.marketing_assets_plan_id);
  let updated = 0;

  for (const row of target) {
    const planId = row.metadata.marketing_assets_plan_id;
    const plan = planById.get(planId);
    if (!plan) continue;

    let content = row.content || "";
    const existingSources = Array.isArray(row?.metadata?.sources) ? row.metadata.sources : [];
    const mergedSources = Array.from(new Set([...(SOURCE_LINKS[plan.cluster] || []), ...existingSources])).slice(0, 10);

    if (!hasReferencesSection(content)) {
      content += `\n${buildReferencesHtml(mergedSources)}`;
    }
    if (!hasFaqSection(content)) {
      content += `\n${buildFaqHtml(plan.cluster)}`;
    }

    const payload = {
      content,
      seo_description: ensureMetaDescription(plan.topic, row.seo_description),
      keywords: Array.isArray(row.keywords) && row.keywords.length >= 3 ? row.keywords : plan.keywords,
      featured_image: row.featured_image || COVER_IMAGE_PATH,
      metadata: {
        ...(row.metadata || {}),
        sources: mergedSources,
        seo_enriched_at: new Date().toISOString(),
      },
    };

    const { error: updateError } = await supabase.from("blog_posts").update(payload).eq("id", row.id);
    if (updateError) {
      console.error(`❌ ${planId}: ${updateError.message}`);
      continue;
    }
    updated += 1;
    console.log(`✅ ${planId}: SEO enrichment applied`);
  }

  console.log(`\nDone. Updated ${updated} post(s).`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

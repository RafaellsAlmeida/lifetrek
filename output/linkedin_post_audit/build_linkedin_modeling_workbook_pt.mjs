import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const require = createRequire("/Users/rafaelalmeida/lifetrek/package.json");
const XLSX = require("xlsx");

const ROOT = "/Users/rafaelalmeida/lifetrek";
const OUT = path.join(ROOT, "output/linkedin_post_audit");
const OUTPUT_XLSX = path.join(OUT, "Lifetrek_Modelagem_LinkedIn_Sem_Outliers_2026-05-01.xlsx");

const hookMap = {
  Statement: "Declaração",
  Question: "Pergunta",
  List: "Lista",
  Exclamation: "Exclamação",
  Command: "Comando",
  Story: "História",
  Conditional: "Condicional",
};

const awarenessMap = {
  "Most aware": "Mais consciente",
  "Product-aware": "Consciente do produto",
  "Solution-aware": "Consciente da solução",
  "Problem-aware": "Consciente do problema",
  Unaware: "Não consciente",
};

const formatMap = {
  Image: "Imagem",
  Carousel: "Carrossel",
  Video: "Vídeo",
  "Text/Unknown": "Texto/desconhecido",
};

const clusterMap = {
  "Low impressions": "Baixas impressões",
  "Mid impressions": "Médias impressões",
  "High impressions": "Altas impressões",
  "No current impressions": "Sem impressões atuais",
};

const topicGroupMap = {
  "Metrology / Validation": "Metrologia / validação",
  "Operations / Capacity": "Operações / capacidade",
  "Institutional / Recruiting": "Institucional / recrutamento",
  "Prototype / DFM": "Protótipo / DFM",
  "Supply Chain": "Supply chain",
  Cleanroom: "Sala limpa",
  Quality: "Qualidade",
  "Specialized Product": "Produto especializado",
  Other: "Outros",
};

const topicMap = {
  "Supply Chain / Local Manufacturing": "Supply chain / manufatura local",
  "Metrology / Dimensional Validation": "Metrologia / validação dimensional",
  "Prototype-to-Scale / Industrialization": "Protótipo até escala / industrialização",
  "Cleanroom / Contamination Control": "Sala limpa / controle de contaminação",
  "Talent / Recruiting": "Talentos / recrutamento",
  "DFM / Manufacturability": "DFM / manufaturabilidade",
  "Personalized Medicine": "Medicina personalizada",
  "Port-a-cath / Implantable Devices": "Port-a-cath / dispositivos implantáveis",
  "Dimensional validation / metrology": "Validação dimensional / metrologia",
  "Institutional / Website Launch": "Institucional / lançamento do site",
  "Sustainability / Manufacturing Efficiency": "Sustentabilidade / eficiência produtiva",
  "Quality / Zero Defect": "Qualidade / zero defeito",
  "Regulatory Traceability / UDI": "Rastreabilidade regulatória / UDI",
  "Spine Components / Pedicle Screws": "Componentes de coluna / parafusos pediculares",
  "Product engineering tradeoff": "Trade-off de engenharia de produto",
  "Capacity / predictable manufacturing": "Capacidade / manufatura previsível",
  "Integrated OEM kits / supplier-risk reduction": "Kits OEM integrados / redução de risco de fornecedor",
};

const featureMap = {
  days_since_start: "dias_desde_inicio",
  caption_word_count: "palavras_na_legenda",
  hook_length_chars: "caracteres_no_gancho",
  is_carousel: "é_carrossel",
  hook_is_question: "gancho_é_pergunta",
  "awareness_Problem-aware": "consciência_problema",
  "awareness_Product-aware": "consciência_produto",
  "awareness_Solution-aware": "consciência_solução",
  "topic_Metrology / Validation": "tema_metrologia_validação",
  "topic_Operations / Capacity": "tema_operações_capacidade",
  "topic_Institutional / Recruiting": "tema_institucional_recrutamento",
  impressions: "impressões",
};

const modelMap = {
  impressions_content_time: "impressões_conteúdo_tempo",
  reactions_content_time: "reações_conteúdo_tempo",
  reactions_with_impressions_exposure: "reações_com_exposição_impressões",
};

const targetMap = {
  impressions: "impressões",
  reactions: "reações",
};

function readCsv(name) {
  const csvText = fsSync.readFileSync(path.join(OUT, name), "utf8");
  const wb = XLSX.read(csvText, { type: "string", raw: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
}

function n(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function round(value, digits = 2) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return Math.round(parsed * 10 ** digits) / 10 ** digits;
}

function pct(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return round(parsed * 100, 1);
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function outputCsv(rows, headers) {
  return [headers.join(","), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))].join("\n");
}

function translateClean(row) {
  return {
    data: row.date,
    dias_desde_inicio: n(row.days_since_start),
    mes: row.month,
    formato: formatMap[row.post_format_clean] || row.post_format_clean,
    gancho: row.hook,
    tipo_de_gancho: hookMap[row.hook_category] || row.hook_category,
    estagio_de_consciencia: awarenessMap[row.awareness_stage] || row.awareness_stage,
    tema: topicMap[row.topic_category] || row.topic_category,
    grupo_de_tema: topicGroupMap[row.topic_group] || row.topic_group,
    cluster_de_impressoes: clusterMap[row.impression_cluster] || row.impression_cluster,
    impressoes: n(row.impressions),
    reacoes: n(row.reactions),
    cliques_exportados: n(row.clicks_export),
    ctr_exportado_pct: n(row.ctr_export_pct),
    reposts: n(row.reposts_current),
    visualizacoes_video: n(row.video_views_current),
    impressoes_exportadas: n(row.impressions_export),
    reacoes_exportadas: n(row.reactions_export),
    palavras_legenda: n(row.caption_word_count),
    caracteres_gancho: n(row.hook_length_chars),
    eh_carrossel: n(row.is_carousel),
    eh_video: n(row.is_video),
    gancho_eh_pergunta: n(row.hook_is_question),
  };
}

function translateCluster(row) {
  return {
    cluster_de_impressoes: clusterMap[row.impression_cluster] || row.impression_cluster,
    posts: n(row.posts),
    impressoes_min: n(row.impressions_min),
    impressoes_max: n(row.impressions_max),
    media_impressoes: round(row.avg_impressions, 1),
    mediana_impressoes: n(row.median_impressions),
    media_reacoes: round(row.avg_reactions, 1),
    media_ctr_exportado_pct: round(row.avg_ctr_export_pct, 2),
    media_palavras_legenda: round(row.avg_caption_word_count, 1),
    share_carrossel_pct: pct(row.share_carousel),
    share_video_pct: pct(row.share_video),
    share_gancho_pergunta_pct: pct(row.share_question_hook),
    principal_estagio_consciencia: awarenessMap[row.top_awareness_stage] || row.top_awareness_stage,
    principal_grupo_tema: topicGroupMap[row.top_topic_group] || row.top_topic_group,
    exemplos_de_ganchos: row.sample_hooks,
  };
}

function translateLift(row) {
  const featureName = {
    clicks_export: "cliques_exportados",
    hook_length_chars: "caracteres_no_gancho",
    caption_word_count: "palavras_na_legenda",
    ctr_export_pct: "ctr_exportado_pct",
    post_format_clean: "formato",
    hook_category: "tipo_de_gancho",
    awareness_stage: "estágio_de_consciência",
    topic_group: "grupo_de_tema",
    days_since_start: "dias_desde_inicio",
  }[row.feature] || row.feature;
  const translatedValue =
    formatMap[row.value] ||
    hookMap[row.value] ||
    awarenessMap[row.value] ||
    topicGroupMap[row.value] ||
    (row.value === "mean" ? "média" : row.value);
  return {
    fator: featureName,
    valor: translatedValue,
    share_cluster_alto: n(row.high_cluster_share),
    share_resto: n(row.rest_share),
    diferenca: n(row.share_lift_points),
    posts_cluster_alto: n(row.top_cluster_posts),
    posts_resto: n(row.rest_posts),
  };
}

function translateWeekly(row) {
  return {
    semana_inicio: row.week_start,
    posts: n(row.posts),
    impressoes_totais: n(row.total_impressions),
    media_impressoes: round(row.avg_impressions, 1),
    reacoes_totais: n(row.total_reactions),
    media_reacoes: round(row.avg_reactions, 1),
  };
}

function translateTrend(row) {
  return {
    alvo: targetMap[row.target] || row.target,
    n: n(row.n),
    inclinacao_por_dia: round(row.slope_per_day, 4),
    inclinacao_por_semana: round(row.slope_per_week, 2),
    intercepto: round(row.intercept, 2),
    r2: round(row.r2, 3),
    primeira_data: row.first_date,
    ultima_data: row.last_date,
  };
}

function translateMetric(row) {
  return {
    modelo: modelMap[row.model] || row.model,
    alvo: targetMap[row.target] || row.target,
    n: n(row.n),
    qtd_preditores: n(row.predictor_count),
    r2_in_sample: round(row.r2_in_sample, 3),
    r2_ajustado: round(row.adjusted_r2, 3),
    erro_rmse_loocv: round(row.loocv_rmse, 2),
  };
}

function translateCoef(row) {
  return {
    modelo: modelMap[row.model] || row.model,
    alvo: targetMap[row.target] || row.target,
    fator: featureMap[row.feature] || row.feature,
    beta_padronizado: round(row.standardized_beta, 3),
    beta_abs: round(row.abs_standardized_beta, 3),
    coeficiente_bruto: round(row.raw_coefficient, 3),
    direcao: row.direction === "positive" ? "positiva" : "negativa",
  };
}

function translateTopPost(row) {
  return {
    data: row.date,
    gancho: row.hook,
    impressoes: n(row.impressions),
    reacoes: n(row.reactions),
    formato: formatMap[row.post_format_clean] || row.post_format_clean,
    tipo_de_gancho: hookMap[row.hook_category] || row.hook_category,
    estagio_de_consciencia: awarenessMap[row.awareness_stage] || row.awareness_stage,
    grupo_de_tema: topicGroupMap[row.topic_group] || row.topic_group,
    palavras_legenda: n(row.caption_word_count),
    ctr_exportado_pct: n(row.ctr_export_pct),
  };
}

function translateExcluded(row) {
  return {
    data: row.date,
    gancho: row.hook,
    tema: topicMap[row.topic_category] || row.topic_category,
    impressoes: n(row.impressions),
    reacoes: n(row.reactions),
    motivo_exclusao: "Post de lançamento/recrutamento fora do padrão editorial usado no modelo.",
  };
}

function groupSummary(rows, key, metricPrefix) {
  const groups = new Map();
  for (const row of rows) {
    const value = row[key] || "Sem classificação";
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(row);
  }
  return [...groups.entries()]
    .map(([value, group]) => {
      const avg = (field) => {
        const vals = group.map((r) => Number(r[field])).filter(Number.isFinite);
        return vals.length ? round(vals.reduce((a, b) => a + b, 0) / vals.length, 1) : "";
      };
      return {
        [metricPrefix]: value,
        posts: group.length,
        media_impressoes: avg("impressoes"),
        media_reacoes: avg("reacoes"),
        media_ctr_exportado_pct: avg("ctr_exportado_pct"),
      };
    })
    .sort((a, b) => b.posts - a.posts);
}

function finiteNumber(value) {
  if (value === "" || value === null || value === undefined) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed);
}

function numericValue(value) {
  if (!finiteNumber(value)) return null;
  return Number(value);
}

function mean(rows, key, digits = 1) {
  const vals = rows.map((row) => numericValue(row[key])).filter((value) => value !== null);
  if (!vals.length) return "";
  return round(vals.reduce((a, b) => a + b, 0) / vals.length, digits);
}

function mode(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[key] || "Sem classificação";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0]?.[0] || "";
}

function topBottomRows(clean, metricKey, metricLabel) {
  const valid = clean.filter((row) => finiteNumber(row[metricKey]));
  const groupSize = Math.max(1, Math.ceil(valid.length * 0.1));
  const top = [...valid].sort((a, b) => numericValue(b[metricKey]) - numericValue(a[metricKey])).slice(0, groupSize);
  const bottom = [...valid].sort((a, b) => numericValue(a[metricKey]) - numericValue(b[metricKey])).slice(0, groupSize);
  const toRow = (row, group, rank) => ({
    alvo: metricLabel,
    grupo: group,
    rank_no_grupo: rank,
    data: row.data,
    gancho: row.gancho,
    valor_do_alvo: n(row[metricKey]),
    impressoes: n(row.impressoes),
    reacoes: n(row.reacoes),
    formato: row.formato,
    tipo_de_gancho: row.tipo_de_gancho,
    estagio_de_consciencia: row.estagio_de_consciencia,
    grupo_de_tema: row.grupo_de_tema,
    tema: row.tema,
    palavras_legenda: n(row.palavras_legenda),
    caracteres_gancho: n(row.caracteres_gancho),
    ctr_exportado_pct: n(row.ctr_exportado_pct),
    eh_carrossel: n(row.eh_carrossel),
    eh_video: n(row.eh_video),
    gancho_eh_pergunta: n(row.gancho_eh_pergunta),
  });
  return [
    ...top.map((row, index) => toRow(row, "Top 10%", index + 1)),
    ...bottom.map((row, index) => toRow(row, "Piores 10%", index + 1)),
  ];
}

function summarizeTopBottom(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.alvo}|||${row.grupo}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].map((group) => ({
    alvo: group[0].alvo,
    grupo: group[0].grupo,
    posts: group.length,
    valor_alvo_min: Math.min(...group.map((row) => numericValue(row.valor_do_alvo)).filter((value) => value !== null)),
    valor_alvo_max: Math.max(...group.map((row) => numericValue(row.valor_do_alvo)).filter((value) => value !== null)),
    media_valor_alvo: mean(group, "valor_do_alvo", 1),
    media_impressoes: mean(group, "impressoes", 1),
    media_reacoes: mean(group, "reacoes", 1),
    formato_dominante: mode(group, "formato"),
    tipo_gancho_dominante: mode(group, "tipo_de_gancho"),
    consciencia_dominante: mode(group, "estagio_de_consciencia"),
    grupo_tema_dominante: mode(group, "grupo_de_tema"),
    share_carrossel_pct: pct(mean(group, "eh_carrossel", 4)),
    share_video_pct: pct(mean(group, "eh_video", 4)),
    share_gancho_pergunta_pct: pct(mean(group, "gancho_eh_pergunta", 4)),
    media_palavras_legenda: mean(group, "palavras_legenda", 1),
    media_caracteres_gancho: mean(group, "caracteres_gancho", 1),
    media_ctr_exportado_pct: mean(group, "ctr_exportado_pct", 2),
    exemplos_de_ganchos: group.map((row) => row.gancho).join(" | "),
  }));
}

function writeRows(sheet, cell, rows, headers) {
  sheet.getRange(cell).write([headers, ...rows.map((row) => headers.map((h) => row[h] ?? ""))]);
}

function styleHeader(sheet, range) {
  sheet.getRange(range).format = {
    fill: "#123C3F",
    font: { bold: true, color: "#FFFFFF" },
    wrapText: true,
  };
}

function setWidths(sheet, widths) {
  for (const [col, width] of Object.entries(widths)) {
    sheet.getRange(`${col}:${col}`).format.columnWidthPx = width;
  }
}

async function main() {
  const clean = readCsv("linkedin_post_modeling_clean_2026-05-01.csv").map(translateClean);
  const clusters = readCsv("linkedin_impression_cluster_summary_2026-05-01.csv").map(translateCluster);
  const lifts = readCsv("linkedin_top_cluster_driver_lifts_2026-05-01.csv").map(translateLift);
  const weekly = readCsv("linkedin_weekly_growth_2026-05-01.csv").map(translateWeekly);
  const trends = readCsv("linkedin_growth_trend_models_2026-05-01.csv").map(translateTrend);
  const metrics = readCsv("linkedin_regression_model_metrics_2026-05-01.csv").map(translateMetric);
  const coefs = readCsv("linkedin_regression_coefficients_2026-05-01.csv").map(translateCoef);
  const topPosts = readCsv("linkedin_top_posts_by_impressions_2026-05-01.csv").map(translateTopPost);
  const excluded = readCsv("linkedin_modeling_excluded_outliers_2026-05-01.csv").map(translateExcluded);
  const hookSummary = groupSummary(clean, "tipo_de_gancho", "tipo_de_gancho");
  const awarenessSummary = groupSummary(clean, "estagio_de_consciencia", "estagio_de_consciencia");
  const topBottom = [
    ...topBottomRows(clean, "impressoes", "Impressões"),
    ...topBottomRows(clean, "reacoes", "Reações"),
  ];
  const topBottomSummary = summarizeTopBottom(topBottom);

  await fs.writeFile(
    path.join(OUT, "linkedin_modelagem_limpa_sem_outliers_2026-05-01.csv"),
    outputCsv(clean, Object.keys(clean[0])),
    "utf8",
  );
  await fs.writeFile(
    path.join(OUT, "linkedin_regressao_coeficientes_pt_2026-05-01.csv"),
    outputCsv(coefs, Object.keys(coefs[0])),
    "utf8",
  );
  await fs.writeFile(
    path.join(OUT, "linkedin_top_piores_10_features_pt_2026-05-01.csv"),
    outputCsv(topBottom, Object.keys(topBottom[0])),
    "utf8",
  );
  await fs.writeFile(
    path.join(OUT, "linkedin_top_piores_10_resumo_features_pt_2026-05-01.csv"),
    outputCsv(topBottomSummary, Object.keys(topBottomSummary[0])),
    "utf8",
  );

  const workbook = Workbook.create();
  const resumo = workbook.worksheets.add("Resumo");
  const dados = workbook.worksheets.add("Dados limpos");
  const clustersSheet = workbook.worksheets.add("Clusters de impressões");
  const crescimento = workbook.worksheets.add("Crescimento");
  const regressao = workbook.worksheets.add("Regressão");
  const topPiores = workbook.worksheets.add("Top e piores 10%");
  const ganchos = workbook.worksheets.add("Resumo de ganchos");
  const consciencia = workbook.worksheets.add("Resumo de consciência");
  const excluidos = workbook.worksheets.add("Posts excluídos");
  const notas = workbook.worksheets.add("Notas");

  for (const sheet of [resumo, dados, clustersSheet, crescimento, regressao, topPiores, ganchos, consciencia, excluidos, notas]) {
    sheet.showGridLines = false;
  }

  resumo.getRange("A1:H1").merge();
  resumo.getRange("A1").values = [["Modelagem de posts do LinkedIn - Lifetrek"]];
  resumo.getRange("A1:H1").format = { fill: "#123C3F", font: { bold: true, color: "#FFFFFF", size: 16 } };
  resumo.getRange("A2:H2").merge();
  resumo.getRange("A2").values = [["Base sem outliers: Vagas de Emprego, Nosso site está no ar e o repost/LinkedIn de vaga foram removidos dos modelos."]];

  const highCluster = clusters.find((row) => row.cluster_de_impressoes === "Altas impressões") || {};
  const trendImp = trends.find((row) => row.alvo === "impressões") || {};
  const trendReact = trends.find((row) => row.alvo === "reações") || {};
  const modelImp = metrics.find((row) => row.modelo === "impressões_conteúdo_tempo") || {};
  const modelReact = metrics.find((row) => row.modelo === "reações_conteúdo_tempo") || {};
  const modelReactExposure = metrics.find((row) => row.modelo === "reações_com_exposição_impressões") || {};

  const summaryRows = [
    { item: "Posts no dataset limpo", insight: clean.length },
    { item: "Posts usados nos modelos", insight: metrics[0]?.n || "" },
    { item: "Posts excluídos", insight: `${excluded.length} posts de lançamento/recrutamento removidos para não distorcer o modelo.` },
    { item: "Cluster de altas impressões", insight: `${highCluster.posts} posts; média de ${highCluster.media_impressoes} impressões e ${highCluster.media_reacoes} reações.` },
    { item: "O que os top posts têm em comum", insight: "Ganchos declarativos, tensão operacional clara, tema de operações/capacidade ou metrologia/validação, e pouca dependência de carrossel." },
    { item: "Crescimento de impressões", insight: `${trendImp.inclinacao_por_semana} impressões/semana; R² ${trendImp.r2}. Crescimento fraco: tempo sozinho quase não explica alcance.` },
    { item: "Crescimento de reações", insight: `${trendReact.inclinacao_por_semana} reações/semana; R² ${trendReact.r2}. Há melhora leve, mas ainda pouco explicada apenas pelo tempo.` },
    { item: "Regressão de impressões", insight: `R² ${modelImp.r2_in_sample}; R² ajustado ${modelImp.r2_ajustado}. Sinal direcional, não causal.` },
    { item: "Regressão de reações", insight: `R² ${modelReact.r2_in_sample}; R² ajustado ${modelReact.r2_ajustado}. Quando adicionamos impressões, R² sobe para ${modelReactExposure.r2_in_sample}.` },
    { item: "Conclusão estatística", insight: "Reações parecem ser majoritariamente função de exposição. Para aumentar reação, primeiro precisamos aumentar alcance qualificado." },
    { item: "Top/piores 10%", insight: "A aba Top e piores 10% compara features dos 3 melhores e 3 piores posts por impressões e por reações, sempre sem os outliers removidos." },
  ];
  writeRows(resumo, "A4", summaryRows, ["item", "insight"]);
  styleHeader(resumo, "A4:B4");
  setWidths(resumo, { A: 270, B: 930 });
  resumo.getRange("A:B").format.wrapText = true;

  const suggestionRows = [
    { prioridade: 1, sugestao: "Rodar um teste de 4 semanas com 2 posts/semana em operações/capacidade e metrologia/validação, mantendo formato visual parecido para isolar o efeito do tema." },
    { prioridade: 2, sugestao: "Abrir com tensão operacional concreta: capacidade não é máquina; validação não é inspeção final; gargalo nem sempre está na usinagem." },
    { prioridade: 3, sugestao: "Separar posts institucionais, vagas e anúncios da análise editorial. Eles têm outro objetivo e poluem o modelo de conteúdo técnico." },
    { prioridade: 4, sugestao: "Não concluir ainda que carrossel é ruim. O sinal negativo pode ser amostra pequena e tema. Testar o mesmo tema em imagem única vs carrossel." },
    { prioridade: 5, sugestao: "Repetir a estrutura dos melhores posts: risco específico -> por que o processo comum falha -> evidência Lifetrek -> resultado para OEM." },
  ];
  writeRows(resumo, "A27", suggestionRows, ["prioridade", "sugestao"]);
  styleHeader(resumo, "A27:B27");

  const topImp = coefs.filter((row) => row.modelo === "impressões_conteúdo_tempo").slice(0, 8);
  const topReact = coefs.filter((row) => row.modelo === "reações_conteúdo_tempo").slice(0, 8);
  writeRows(resumo, "D4", topImp, ["modelo", "alvo", "fator", "beta_padronizado", "direcao"]);
  styleHeader(resumo, "D4:H4");
  resumo.getRange("D3:H3").merge();
  resumo.getRange("D3").values = [["Fatores mais fortes para impressões"]];
  resumo.getRange("D3:H3").format = { fill: "#E7F0F0", font: { bold: true } };
  writeRows(resumo, "D16", topReact, ["modelo", "alvo", "fator", "beta_padronizado", "direcao"]);
  styleHeader(resumo, "D16:H16");
  resumo.getRange("D15:H15").merge();
  resumo.getRange("D15").values = [["Fatores mais fortes para reações"]];
  resumo.getRange("D15:H15").format = { fill: "#E7F0F0", font: { bold: true } };
  setWidths(resumo, { D: 255, E: 100, F: 290, G: 135, H: 100 });

  writeRows(dados, "A1", clean, Object.keys(clean[0]));
  styleHeader(dados, "A1:W1");
  dados.freezePanes.freezeRows(1);
  dados.freezePanes.freezeColumns(4);
  dados.getRange("A:W").format.wrapText = true;
  setWidths(dados, { A: 95, B: 95, C: 80, D: 110, E: 420, F: 120, G: 165, H: 220, I: 160, J: 140, K: 90, L: 80, M: 95, N: 95, O: 75, P: 105, Q: 115, R: 105, S: 105, T: 105, U: 80, V: 70, W: 110 });

  writeRows(clustersSheet, "A1", clusters, Object.keys(clusters[0]));
  styleHeader(clustersSheet, "A1:O1");
  setWidths(clustersSheet, { A: 150, B: 420, C: 100, D: 100, E: 115, F: 115, G: 105, H: 115, I: 125, J: 105, K: 90, L: 120, M: 170, N: 170, O: 680 });
  clustersSheet.getRange("A:O").format.wrapText = true;
  writeRows(clustersSheet, "A7", topPosts, Object.keys(topPosts[0]));
  styleHeader(clustersSheet, `A7:${String.fromCharCode(64 + Object.keys(topPosts[0]).length)}7`);
  writeRows(clustersSheet, "A21", lifts, Object.keys(lifts[0]));
  styleHeader(clustersSheet, `A21:${String.fromCharCode(64 + Object.keys(lifts[0]).length)}21`);

  writeRows(crescimento, "A1", weekly, Object.keys(weekly[0]));
  styleHeader(crescimento, "A1:F1");
  writeRows(crescimento, "H1", trends, Object.keys(trends[0]));
  styleHeader(crescimento, "H1:O1");
  const reactionChartRows = weekly.map((row) => ({
    semana_inicio: row.semana_inicio,
    reacoes_totais: row.reacoes_totais,
    media_reacoes: row.media_reacoes,
  }));
  writeRows(crescimento, "R1", reactionChartRows, Object.keys(reactionChartRows[0]));
  styleHeader(crescimento, "R1:T1");
  setWidths(crescimento, { A: 120, B: 60, C: 120, D: 120, E: 110, F: 110, H: 120, I: 60, J: 120, K: 130, L: 100, M: 90, N: 100, O: 100 });
  const chartImp = crescimento.charts.add("line", crescimento.getRange(`A1:D${weekly.length + 1}`));
  chartImp.title = "Crescimento semanal de impressões";
  chartImp.setPosition("A16", "H32");
  const chartReact = crescimento.charts.add("line", crescimento.getRange(`R1:T${weekly.length + 1}`));
  chartReact.title = "Crescimento semanal de reações";
  chartReact.setPosition("J16", "Q32");

  writeRows(regressao, "A1", metrics, Object.keys(metrics[0]));
  styleHeader(regressao, "A1:G1");
  writeRows(regressao, "A7", coefs, Object.keys(coefs[0]));
  styleHeader(regressao, "A7:G7");
  regressao.freezePanes.freezeRows(7);
  setWidths(regressao, { A: 260, B: 105, C: 260, D: 120, E: 110, F: 130, G: 110 });

  writeRows(topPiores, "A1", topBottomSummary, Object.keys(topBottomSummary[0]));
  styleHeader(topPiores, "A1:S1");
  topPiores.getRange("A:S").format.wrapText = true;
  setWidths(topPiores, {
    A: 95,
    B: 105,
    C: 60,
    D: 100,
    E: 100,
    F: 110,
    G: 120,
    H: 110,
    I: 130,
    J: 150,
    K: 190,
    L: 170,
    M: 115,
    N: 90,
    O: 135,
    P: 130,
    Q: 140,
    R: 130,
    S: 700,
  });
  topPiores.getRange("A7:S7").merge();
  topPiores.getRange("A7").values = [["Posts que compõem cada grupo"]];
  topPiores.getRange("A7:S7").format = { fill: "#E7F0F0", font: { bold: true } };
  writeRows(topPiores, "A8", topBottom, Object.keys(topBottom[0]));
  styleHeader(topPiores, "A8:S8");
  topPiores.freezePanes.freezeRows(8);

  writeRows(ganchos, "A1", hookSummary, Object.keys(hookSummary[0]));
  styleHeader(ganchos, "A1:E1");
  setWidths(ganchos, { A: 170, B: 60, C: 120, D: 110, E: 130 });

  writeRows(consciencia, "A1", awarenessSummary, Object.keys(awarenessSummary[0]));
  styleHeader(consciencia, "A1:E1");
  setWidths(consciencia, { A: 190, B: 60, C: 120, D: 110, E: 130 });

  writeRows(excluidos, "A1", excluded, Object.keys(excluded[0]));
  styleHeader(excluidos, "A1:F1");
  setWidths(excluidos, { A: 100, B: 430, C: 240, D: 100, E: 90, F: 520 });
  excluidos.getRange("A:F").format.wrapText = true;

  const noteRows = [
    { nota: "Outliers removidos", detalhe: "Foram removidos dos modelos: repost/vaga de 2025-11-26, anúncio do site de 2026-01-09 e VAGA DE EMPREGO de 2026-01-09." },
    { nota: "Amostra", detalhe: "O modelo usa 28 posts com impressões e reações atuais. Dois posts técnicos sem impressões atuais ficam no dataset limpo, mas fora da regressão." },
    { nota: "Interpretação", detalhe: "Regressão com amostra pequena é direcional. Use como mapa de hipóteses para próximos testes, não como prova causal." },
    { nota: "Preditores", detalhe: "A regressão principal usa variáveis pré-postagem: tempo, formato, tipo/tamanho de gancho, tamanho da legenda, estágio de consciência e grupos de tema." },
    { nota: "CTR/cliques", detalhe: "Cliques e CTR ficam no dataset para inspeção, mas não entram como preditores principais porque são resultados posteriores à postagem." },
  ];
  writeRows(notas, "A1", noteRows, ["nota", "detalhe"]);
  styleHeader(notas, "A1:B1");
  notas.getRange("A:B").format.wrapText = true;
  setWidths(notas, { A: 240, B: 900 });

  const previews = [
    ["Resumo", "linkedin_modelagem_pt_resumo_preview.png", undefined],
    ["Dados limpos", "linkedin_modelagem_pt_dados_preview.png", "A1:W18"],
    ["Clusters de impressões", "linkedin_modelagem_pt_clusters_preview.png", "A1:O30"],
    ["Crescimento", "linkedin_modelagem_pt_crescimento_preview.png", "A1:Q32"],
    ["Regressão", "linkedin_modelagem_pt_regressao_preview.png", "A1:G28"],
    ["Top e piores 10%", "linkedin_modelagem_pt_top_piores_10_preview.png", "A1:S21"],
  ];
  for (const [sheetName, fileName, range] of previews) {
    const rendered = await workbook.render({ sheetName, range, autoCrop: "all", scale: 1, format: "png" });
    await fs.writeFile(path.join(OUT, fileName), new Uint8Array(await rendered.arrayBuffer()));
  }

  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: "formula error scan",
  });
  await fs.writeFile(path.join(OUT, "linkedin_modelagem_pt_formula_scan.ndjson"), errors.ndjson);

  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(OUTPUT_XLSX);
  console.log(JSON.stringify({ output: OUTPUT_XLSX, rows: clean.length, excluded: excluded.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const require = createRequire("/Users/rafaelalmeida/lifetrek/package.json");
const XLSX = require("xlsx");

const ROOT = "/Users/rafaelalmeida/lifetrek";
const OUT = path.join(ROOT, "output/linkedin_post_audit");
const OUTPUT_XLSX = path.join(OUT, "Lifetrek_LinkedIn_Post_Modeling_2026-05-01.xlsx");

function readCsv(name) {
  const file = path.join(OUT, name);
  const wb = XLSX.readFile(file, { raw: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
}

function numeric(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function normalizeRows(rows) {
  return rows.map((row) => {
    const out = {};
    for (const [key, value] of Object.entries(row)) out[key] = numeric(value);
    return out;
  });
}

function writeRows(sheet, startCell, rows, headers) {
  const values = [headers, ...rows.map((row) => headers.map((h) => row[h] ?? ""))];
  sheet.getRange(startCell).write(values);
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

function round(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return Math.round(n * 10 ** digits) / 10 ** digits;
}

async function main() {
  const clean = normalizeRows(readCsv("linkedin_post_modeling_clean_2026-05-01.csv"));
  const clusters = normalizeRows(readCsv("linkedin_impression_cluster_summary_2026-05-01.csv"));
  const lifts = normalizeRows(readCsv("linkedin_top_cluster_driver_lifts_2026-05-01.csv"));
  const weekly = normalizeRows(readCsv("linkedin_weekly_growth_2026-05-01.csv"));
  const trends = normalizeRows(readCsv("linkedin_growth_trend_models_2026-05-01.csv"));
  const metrics = normalizeRows(readCsv("linkedin_regression_model_metrics_2026-05-01.csv"));
  const coefs = normalizeRows(readCsv("linkedin_regression_coefficients_2026-05-01.csv"));
  const topPosts = normalizeRows(readCsv("linkedin_top_posts_by_impressions_2026-05-01.csv"));

  const summaryJson = JSON.parse(await fs.readFile(path.join(OUT, "linkedin_modeling_summary_2026-05-01.json"), "utf8"));

  const workbook = Workbook.create();
  const summary = workbook.worksheets.add("Summary");
  const data = workbook.worksheets.add("Clean Data");
  const clusterSheet = workbook.worksheets.add("Impression Clusters");
  const trendSheet = workbook.worksheets.add("Growth Trend");
  const regSheet = workbook.worksheets.add("Regression");
  const notes = workbook.worksheets.add("Notes");

  summary.showGridLines = false;
  summary.getRange("A1:H1").merge();
  summary.getRange("A1").values = [["Lifetrek LinkedIn Post Modeling"]];
  summary.getRange("A1:H1").format = { fill: "#123C3F", font: { bold: true, color: "#FFFFFF", size: 16 } };
  summary.getRange("A2:H2").merge();
  summary.getRange("A2").values = [["Target variables: current LinkedIn admin impressions and reactions. Updated 2026-05-01."]];

  const highCluster = clusters.find((row) => row.impression_cluster === "High impressions") || {};
  const impressionTrend = trends.find((row) => row.target === "impressions") || {};
  const reactionTrend = trends.find((row) => row.target === "reactions") || {};
  const impressionModel = metrics.find((row) => row.model === "impressions_content_time") || {};
  const reactionModel = metrics.find((row) => row.model === "reactions_content_time") || {};
  const reactionExposureModel = metrics.find((row) => row.model === "reactions_with_impressions_exposure") || {};
  const summaryRows = [
    ["Posts modeled", summaryJson.posts_in_model],
    ["Posts excluded from impression model", summaryJson.posts_without_current_impressions],
    ["High-impression cluster", `${highCluster.posts} posts; avg ${round(highCluster.avg_impressions, 0)} impressions; avg ${round(highCluster.avg_reactions, 1)} reactions`],
    ["Top-cluster pattern", "Statement hooks, no carousels, over-indexing in Operations/Capacity, Institutional/Recruiting, and Metrology/Validation."],
    ["Impression growth over time", `${round(impressionTrend.slope_per_week, 2)} impressions/week; R2 ${round(impressionTrend.r2, 3)}.`],
    ["Reaction growth over time", `${round(reactionTrend.slope_per_week, 2)} reactions/week; R2 ${round(reactionTrend.r2, 3)}.`],
    ["Impressions regression", `Content/time model R2 ${round(impressionModel.r2_in_sample, 3)}; adjusted R2 ${round(impressionModel.adjusted_r2, 3)}.`],
    ["Reactions regression", `Content/time model R2 ${round(reactionModel.r2_in_sample, 3)}; adjusted R2 ${round(reactionModel.adjusted_r2, 3)}.`],
    ["Reactions exposure model", `Adding impressions raises reaction model R2 to ${round(reactionExposureModel.r2_in_sample, 3)}; adjusted R2 ${round(reactionExposureModel.adjusted_r2, 3)}.`],
  ];
  writeRows(summary, "A4", summaryRows.map((r) => ({ item: r[0], finding: r[1] })), ["item", "finding"]);
  styleHeader(summary, "A4:B4");
  setWidths(summary, { A: 260, B: 920 });
  summary.getRange("A:B").format.wrapText = true;

  const topCoefHeaders = ["model", "target", "feature", "standardized_beta", "direction"];
  const topImpressionCoefs = coefs.filter((row) => row.model === "impressions_content_time").slice(0, 8);
  const topReactionCoefs = coefs.filter((row) => row.model === "reactions_content_time").slice(0, 8);
  writeRows(summary, "D4", topImpressionCoefs, topCoefHeaders);
  styleHeader(summary, "D4:H4");
  writeRows(summary, "D15", topReactionCoefs, topCoefHeaders);
  styleHeader(summary, "D15:H15");
  summary.getRange("D3:H3").merge();
  summary.getRange("D3").values = [["Top standardized factors for impressions"]];
  summary.getRange("D14:H14").merge();
  summary.getRange("D14").values = [["Top standardized factors for reactions"]];
  summary.getRange("D3:H3").format = { fill: "#E7F0F0", font: { bold: true } };
  summary.getRange("D14:H14").format = { fill: "#E7F0F0", font: { bold: true } };
  setWidths(summary, { D: 250, E: 120, F: 310, G: 145, H: 110 });

  const cleanHeaders = [
    "date",
    "days_since_start",
    "month",
    "post_format_clean",
    "hook",
    "hook_category",
    "awareness_stage",
    "topic_category",
    "topic_group",
    "impression_cluster",
    "impressions",
    "reactions",
    "clicks_export",
    "ctr_export_pct",
    "reposts_current",
    "video_views_current",
    "impressions_export",
    "reactions_export",
    "caption_word_count",
    "hook_length_chars",
    "is_carousel",
    "is_video",
    "hook_is_question",
  ];
  writeRows(data, "A1", clean, cleanHeaders);
  styleHeader(data, "A1:W1");
  data.freezePanes.freezeRows(1);
  data.freezePanes.freezeColumns(4);
  data.showGridLines = false;
  data.getRange("A:W").format.wrapText = true;
  setWidths(data, { A: 95, B: 95, C: 80, D: 110, E: 420, F: 110, G: 130, H: 220, I: 160, J: 140, K: 95, L: 85, M: 90, N: 90, O: 90, P: 100, Q: 110, R: 100, S: 100, T: 100, U: 80, V: 70, W: 95 });

  writeRows(clusterSheet, "A1", clusters, Object.keys(clusters[0]));
  styleHeader(clusterSheet, `A1:${String.fromCharCode(64 + Object.keys(clusters[0]).length)}1`);
  clusterSheet.showGridLines = false;
  clusterSheet.getRange("A:O").format.wrapText = true;
  setWidths(clusterSheet, { A: 150, B: 70, C: 90, D: 90, E: 115, F: 115, G: 110, H: 110, I: 130, J: 100, K: 90, L: 110, M: 150, N: 160, O: 620 });
  writeRows(clusterSheet, "A7", topPosts, Object.keys(topPosts[0]));
  styleHeader(clusterSheet, `A7:${String.fromCharCode(64 + Object.keys(topPosts[0]).length)}7`);
  const clusterChart = clusterSheet.charts.add("bar", clusterSheet.getRange("A1:G4"));
  clusterChart.title = "Impression Clusters";
  clusterChart.setPosition("Q2", "X18");

  writeRows(clusterSheet, "A20", lifts, Object.keys(lifts[0]));
  styleHeader(clusterSheet, `A20:${String.fromCharCode(64 + Object.keys(lifts[0]).length)}20`);

  writeRows(trendSheet, "A1", weekly, Object.keys(weekly[0]));
  styleHeader(trendSheet, "A1:F1");
  trendSheet.showGridLines = false;
  setWidths(trendSheet, { A: 120, B: 70, C: 130, D: 130, E: 120, F: 120 });
  writeRows(trendSheet, "H1", trends, Object.keys(trends[0]));
  styleHeader(trendSheet, "H1:O1");
  setWidths(trendSheet, { H: 110, I: 60, J: 120, K: 120, L: 100, M: 90, N: 100, O: 100 });
  const impressionsChart = trendSheet.charts.add("line", trendSheet.getRange(`A1:D${weekly.length + 1}`));
  impressionsChart.title = "Weekly Impressions";
  impressionsChart.setPosition("A16", "H32");
  const reactionsChart = trendSheet.charts.add("line", trendSheet.getRange(`A1:F${weekly.length + 1}`));
  reactionsChart.title = "Weekly Reactions";
  reactionsChart.setPosition("J16", "Q32");

  writeRows(regSheet, "A1", metrics, Object.keys(metrics[0]));
  styleHeader(regSheet, "A1:G1");
  writeRows(regSheet, "A7", coefs, Object.keys(coefs[0]));
  styleHeader(regSheet, "A7:G7");
  regSheet.showGridLines = false;
  regSheet.freezePanes.freezeRows(7);
  setWidths(regSheet, { A: 260, B: 110, C: 60, D: 110, E: 110, F: 110, G: 110 });

  const noteRows = [
    { note: "Columns removed per request", detail: "post_id, author, admin feed number, comments, follows export, full caption, and data source notes are excluded from the modeling workbook's Clean Data tab." },
    { note: "Model caution", detail: "Only 31 posts have current impressions. Regression results are directional and should be used for hypotheses, not causal certainty." },
    { note: "Predictor set", detail: "Main regressions use pre-post/content variables only: time, format, hook type/length, caption word count, awareness stage, and selected topic groups." },
    { note: "CTR/clicks", detail: "Clicks and CTR are retained in the clean table for inspection, but excluded from the main regression predictors because they are downstream performance outcomes." },
    { note: "Reaction exposure model", detail: "The separate reactions_with_impressions_exposure model includes impressions to test whether reactions are mostly a reach function." },
  ];
  writeRows(notes, "A1", noteRows, ["note", "detail"]);
  styleHeader(notes, "A1:B1");
  notes.showGridLines = false;
  notes.getRange("A:B").format.wrapText = true;
  setWidths(notes, { A: 260, B: 900 });

  const previews = [
    ["Summary", "linkedin_modeling_summary_preview.png", undefined],
    ["Clean Data", "linkedin_modeling_clean_data_preview.png", "A1:W18"],
    ["Impression Clusters", "linkedin_modeling_clusters_preview.png", "A1:O30"],
    ["Growth Trend", "linkedin_modeling_growth_preview.png", "A1:O14"],
    ["Regression", "linkedin_modeling_regression_preview.png", "A1:G28"],
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
  await fs.writeFile(path.join(OUT, "linkedin_modeling_formula_scan.ndjson"), errors.ndjson);

  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(OUTPUT_XLSX);
  console.log(JSON.stringify({ output: OUTPUT_XLSX, rows: clean.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

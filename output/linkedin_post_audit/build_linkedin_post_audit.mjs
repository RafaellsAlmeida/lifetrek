import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const require = createRequire("/Users/rafaelalmeida/lifetrek/package.json");
const XLSX = require("xlsx");

const ROOT = "/Users/rafaelalmeida/lifetrek";
const OUT = path.join(ROOT, "output/linkedin_post_audit");
const SNAPSHOT_TXT = path.join(OUT, "linkedin_admin_page_posts_2026-05-01.txt");
const OUTPUT_DATE = "2026-05-01";

const CONTENT_FILES = [
  path.join(ROOT, "lifetrek-medical_content_1775127633404.xls"),
  path.join(ROOT, "Downloaded_Lifetrek_Files/lifetrek-medical_content_1772219521830.xls"),
  path.join(ROOT, "Downloaded_Lifetrek_Files/lifetrek-medical_content_1769776652503.xls"),
  path.join(ROOT, "Downloaded_Lifetrek_Files/lifetrek-medical_content_1777119153008.xls"),
];

const SCORED_CSV = path.join(ROOT, "analysis/linkedin_analytics/linkedin_post_analytics_scored.csv");
const CURRENT_CSV = path.join(ROOT, "analysis/linkedin_analytics/linkedin_content_engagement_current_posts_2026-04-25.csv");

function norm(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseUsDate(value) {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, mm, dd, yyyy] = match;
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function parseAnyDateIso(value) {
  const raw = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const short = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (short) {
    const [, mm, dd, y] = short;
    const yyyy = y.length === 2 ? `20${y}` : y;
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  return parseUsDate(raw);
}

function daysBetween(a, b) {
  if (!a || !b) return 999;
  const aIso = parseAnyDateIso(a);
  const bIso = parseAnyDateIso(b);
  const aTime = new Date(aIso + "T00:00:00Z").getTime();
  const bTime = new Date(bIso + "T00:00:00Z").getTime();
  if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return 999;
  return Math.abs((aTime - bTime) / 86400000);
}

function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, "").replace(/%/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function pctFromRate(value) {
  const n = num(value);
  if (n === null) return null;
  return n <= 1 ? n * 100 : n;
}

function readSheetRows(file, sheetName) {
  const wb = XLSX.readFile(file, { cellDates: false });
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
  if (raw.length < 2) return [];
  const headers = raw[1].map((h) => String(h || "").trim());
  return raw.slice(2).filter((row) => row.some(Boolean)).map((row) => {
    const out = {};
    headers.forEach((h, i) => {
      out[h || `col_${i}`] = row[i] ?? "";
    });
    return out;
  });
}

function readCsv(file) {
  const wb = XLSX.readFile(file, { raw: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
}

function cleanCaption(caption) {
  return String(caption ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractHook(caption) {
  const lines = cleanCaption(caption)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== "hashtag" && !line.startsWith("#"));
  if (!lines.length) return "";
  let hook = lines[0];
  if (hook.length < 25 && lines[1] && !/[.?!:]$/.test(hook)) {
    hook = `${hook} ${lines[1]}`;
  }
  return hook.replace(/\s+/g, " ").trim();
}

function classifyHook(hook) {
  const h = hook.trim();
  const n = norm(h);
  if (/^(se|caso)\b/.test(n) || /^quando\b.*\b(entao|,)/.test(n)) return "Conditional";
  if (/[?？]/.test(h)) return "Question";
  if (/!/.test(h)) return "Exclamation";
  if (/^\d+[\s.)-]/.test(h) || /\b(3|5|cinco|tres|três)\b.*\b(perguntas|riscos|erros|pontos|frentes)\b/.test(n)) return "List";
  if (/^(reduza|valide|pare|comente|candidate se|candidate-se|fale|mande|veja|use|compare|descubra)\b/.test(n)) return "Command";
  if (/^(quando eu|quando nos|ha alguns|há alguns|uma vez|no comeco|no começo)\b/.test(n)) return "Story";
  return "Statement";
}

function topicCategory(caption, hook) {
  const text = norm(`${hook} ${caption}`);
  if (/\bvaga\b/.test(norm(hook)) || text.includes("vagas empresa") || text.includes("candidate se") || text.includes("candidate-se") || text.includes("operador de usinagem") || text.includes("descricao do cargo")) return "Talent / Recruiting";
  if (text.includes("site esta no ar") || text.includes("nosso site")) return "Institutional / Website Launch";
  if (text.includes("port a cath")) return "Port-a-cath / Implantable Devices";
  if (text.includes("medicina personalizada") || text.includes("personalizado") || text.includes("tamanho unico")) return "Personalized Medicine";
  if (text.includes("membrana") || text.includes("regeneracao ossea")) return "Fixation Components / Regeneration";
  if (/\budi\b/.test(text) || text.includes("marcacao a laser")) return "Regulatory Traceability / UDI";
  if (text.includes("sustentabilidade") || text.includes("p l")) return "Sustainability / Manufacturing Efficiency";
  if (text.includes("sala limpa") || text.includes("iso 7") || text.includes("contaminacao") || text.includes("pureza")) return "Cleanroom / Contamination Control";
  if (text.includes("supply chain") || text.includes("sourcing") || text.includes("importacao") || text.includes("nearshoring") || text.includes("cadeia global") || text.includes("cadeia de suprimentos")) return "Supply Chain / Local Manufacturing";
  if (text.includes("metrologia") || text.includes("cmm") || text.includes("zeiss") || text.includes("validacao dimensional")) return "Metrology / Dimensional Validation";
  if (text.includes("prototipo") || text.includes("escala") || text.includes("ramp up")) return "Prototype-to-Scale / Industrialization";
  if (text.includes("dfm") || text.includes("cad") || text.includes("usinavel")) return "DFM / Manufacturability";
  if (text.includes("parafuso pedicular") || text.includes("sistemas de coluna")) return "Spine Components / Pedicle Screws";
  if (text.includes("qualidade") || text.includes("zero defeito") || text.includes("capa")) return "Quality / Zero Defect";
  if (text.includes("anvisa") || text.includes("fda") || text.includes("iso 13485")) return "Regulatory / Compliance";
  return "Medical Manufacturing / OEM";
}

function awarenessStage(caption, hook) {
  const text = norm(`${hook} ${caption}`);
  const hookType = classifyHook(hook);
  if (
    text.includes("vaga de emprego") ||
    text.includes("nosso site esta no ar") ||
    text.includes("comente custo real") ||
    text.includes("entre em contato") ||
    text.includes("pronto para escalar") ||
    text.includes("precisa de seguranca absoluta") ||
    text.includes("fale com nossa equipe") ||
    text.includes("candidate se")
  ) {
    return ["Most aware", "Direct action, hiring, website, or explicit commercial CTA."];
  }
  if (
    hookType === "Question" ||
    hookType === "List" ||
    text.includes("5 riscos") ||
    text.includes("3 perguntas") ||
    text.includes("checklist") ||
    text.includes("pinos ou parafusos")
  ) {
    return ["Solution-aware", "Reader likely knows the class of solution and is evaluating how to approach it."];
  }
  if (
    (text.includes("na lifetrek medical") || text.includes("na lifetrek") || text.includes("nossa sala limpa")) &&
    (
      text.includes("citizen") ||
      text.includes("cmm") ||
      text.includes("zeiss") ||
      text.includes("sala limpa") ||
      text.includes("iso 7") ||
      text.includes("usinagem") ||
      text.includes("metrologia") ||
      text.includes("rastreabilidade") ||
      text.includes("port a cath") ||
      text.includes("kit")
    )
  ) {
    return ["Product-aware", "Reader is being shown why Lifetrek's specific capability or process is the answer."];
  }
  if (
    text.includes("risco") ||
    text.includes("gargalo") ||
    text.includes("problema") ||
    text.includes("falha") ||
    text.includes("ponto de falha") ||
    text.includes("retrabalho") ||
    text.includes("nao e suficiente") ||
    text.includes("nao e so") ||
    text.includes("nao sao detalhe") ||
    text.includes("nao esta") ||
    text.includes("parece mais barato") ||
    text.includes("desafio")
  ) {
    return ["Problem-aware", "Hook frames an operational or regulatory pain before selling a specific vendor."];
  }
  if (
    text.includes("capacidade produtiva") ||
    text.includes("producao local") ||
    text.includes("nearshoring") ||
    text.includes("dfm") ||
    text.includes("iso 7") ||
    text.includes("validacao")
  ) {
    return ["Solution-aware", "Reader likely knows the class of solution and is evaluating how to approach it."];
  }
  return ["Unaware", "Broad awareness or educational post with less explicit pain or solution intent."];
}

function inferPostFormat(segment, xlsRow) {
  const text = norm(segment);
  const xlsType = norm(xlsRow?.["Content Type"] || "");
  if (text.includes("video views") || text.includes("\nplay\n") || xlsType.includes("video")) return "Video";
  const plus = segment.match(/\+(\d+)/);
  if (plus) return `Carousel / multi-image (${Number(plus[1]) + 1}+ images visible)`;
  if (text.includes("activate to view larger image")) return "Image";
  const postType = String(xlsRow?.["Content Type"] || xlsRow?.["Post type"] || "").trim();
  return postType || "Text / unknown";
}

function parseAdminSnapshot(text) {
  const parts = text.split(/\n(?=(?:Get up to .*?\nBoost\n\n|This post type can't be boosted\.\s*\nBoost\n\n)?By [^\n]+  \d{1,2}\/\d{1,2}\/\d{4}\n\nFeed post number \d+)/g);
  const posts = [];
  for (const part of parts) {
    const header = part.match(/(?:^|\n)(?:Get up to .*?\nBoost\n\n|This post type can't be boosted\.\s*\nBoost\n\n)?By ([^\n]+?)\s+(\d{1,2}\/\d{1,2}\/\d{4})\n\nFeed post number (\d+)/);
    if (!header) continue;
    const [, authorRaw, dateRaw, feedNumberRaw] = header;
    const feedNumber = Number(feedNumberRaw);
    const lines = part.replace(/\r/g, "").split("\n").map((line) => line.trimEnd());
    const visibleIdx = lines.findIndex((line) => /Visible to anyone on or off LinkedIn/.test(line));
    if (visibleIdx < 0) continue;
    let endIdx = lines.findIndex((line, i) => i > visibleIdx && line.trim() === "…more");
    if (endIdx < 0) endIdx = lines.findIndex((line, i) => i > visibleIdx && line.trim() === "Show translation");
    if (endIdx < 0) endIdx = lines.length;
    const caption = cleanCaption(lines.slice(visibleIdx + 1, endIdx)
      .filter((line) => line.trim() !== "hashtag")
      .join("\n"));
    if (!caption || /Drive results with video/i.test(caption)) continue;
    const afterMore = lines.slice(endIdx + 1);
    const actionIdx = afterMore.findIndex((line) => /^(Like|Love|Support|Celebrate|Insightful|Comment|Repost|Tell them|Share your|Give your)/.test(line.trim()));
    const reactionBlock = actionIdx >= 0 ? afterMore.slice(0, actionIdx) : afterMore.slice(0, 30);
    const reactionCandidates = reactionBlock
      .map((line) => line.trim())
      .filter((line) => /^\d+$/.test(line))
      .map(Number);
    const commentsMatch = part.match(/(\d+)\s+comment(s)?/i);
    const repostsMatch = part.match(/(\d+)\s+repost(s)?/i);
    const impressionsMatch = part.match(/Organic impressions:\s*([\d,]+)\s+Impressions/i);
    const videoViewsMatch = part.match(/Video views:\s*([\d,]+)\s+total/i);
    posts.push({
      admin_feed_number: feedNumber,
      date: parseUsDate(dateRaw),
      author: authorRaw.replace(/\s+/g, " ").trim(),
      caption,
      admin_reactions: reactionCandidates.length ? reactionCandidates[0] : null,
      admin_comments: commentsMatch ? Number(commentsMatch[1]) : 0,
      admin_reposts: repostsMatch ? Number(repostsMatch[1]) : 0,
      admin_impressions: impressionsMatch ? Number(impressionsMatch[1].replace(/,/g, "")) : null,
      admin_video_views: videoViewsMatch ? Number(videoViewsMatch[1].replace(/,/g, "")) : null,
      admin_segment: part,
    });
  }
  return posts;
}

function readContentExports() {
  const rows = [];
  for (const file of CONTENT_FILES) {
    for (const row of readSheetRows(file, "All posts")) {
      const caption = cleanCaption(row["Post title"]);
      if (!caption) continue;
      rows.push({
        date: parseUsDate(row["Created date"]),
        author: String(row["Posted by"] || "").replace(/\s+/g, " ").trim(),
        caption,
        post_link: String(row["Post link"] || "").trim(),
        export_impressions: num(row["Impressions"]),
        export_clicks: num(row["Clicks"]),
        export_ctr_pct: pctFromRate(row["Click through rate (CTR)"]),
        export_reactions: num(row["Likes"]),
        export_comments: num(row["Comments"]),
        export_reposts: num(row["Reposts"]),
        export_follows: num(row["Follows"]),
        export_engagement_rate_pct: pctFromRate(row["Engagement rate"]),
        export_post_type: String(row["Post type"] || "").trim(),
        export_content_type: String(row["Content Type"] || "").trim(),
        source_file: path.basename(file),
      });
    }
  }
  const deduped = new Map();
  for (const row of rows) {
    const key = `${row.date}|${norm(row.caption).slice(0, 180)}`;
    const existing = deduped.get(key);
    if (!existing || (row.export_impressions ?? 0) > (existing.export_impressions ?? 0)) {
      deduped.set(key, row);
    }
  }
  return [...deduped.values()];
}

function findBestMatch(target, candidates, maxDays = 2) {
  const targetNorm = norm(target.caption);
  let best = null;
  for (const candidate of candidates) {
    const candidateNorm = norm(candidate.caption);
    const dayGap = daysBetween(target.date, candidate.date);
    const prefixHit =
      targetNorm.slice(0, 90) === candidateNorm.slice(0, 90) ||
      targetNorm.includes(candidateNorm.slice(0, 120)) ||
      candidateNorm.includes(targetNorm.slice(0, 120));
    if (!prefixHit || dayGap > maxDays) continue;
    const score = 1000 - dayGap * 100 + Math.min(targetNorm.length, candidateNorm.length) / 100;
    if (!best || score > best.score) best = { row: candidate, score };
  }
  return best?.row || null;
}

function findCsvMetric(post, rows, titleField, dateField = "date") {
  const postNorm = norm(post.caption);
  let best = null;
  for (const row of rows) {
    const date = String(row[dateField] || "");
    if (date && daysBetween(post.date, date) > 4) continue;
    const titleNorm = norm(row[titleField] || "");
    if (!titleNorm) continue;
    const words = titleNorm.split(" ").filter((w) => w.length > 3);
    const hits = words.filter((w) => postNorm.includes(w)).length;
    const score = hits / Math.max(words.length, 1);
    if (score > 0.45 && (!best || score > best.score)) best = { row, score };
  }
  return best?.row || null;
}

function sqlLiteral(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function outputCsv(rows, columns) {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((col) => csvEscape(row[col])).join(",")),
  ].join("\n");
}

function addRows(sheet, rows, headers, startCell = "A1") {
  const values = [headers, ...rows.map((row) => headers.map((h) => row[h] ?? ""))];
  sheet.getRange(startCell).write(values);
}

async function buildWorkbook(rows, summaryRows, hookRows, awarenessRows, outputXlsx) {
  const workbook = Workbook.create();
  const dash = workbook.worksheets.add("Dashboard");
  const audit = workbook.worksheets.add("Post Audit");
  const captionsSheet = workbook.worksheets.add("Full Captions");
  const hookSheet = workbook.worksheets.add("Hook Summary");
  const awarenessSheet = workbook.worksheets.add("Awareness Summary");
  const sources = workbook.worksheets.add("Sources");

  const mainHeaders = [
    "post_id",
    "date",
    "author",
    "hook",
    "hook_category",
    "awareness_stage",
    "topic_category",
    "impressions_current",
    "clicks_export",
    "ctr_export_pct",
    "reactions_current",
    "comments_current",
    "reposts_current",
    "caption_excerpt",
    "post_link",
    "data_source_notes",
  ];
  addRows(audit, rows, mainHeaders);
  audit.getRange("A1:P1").format = { fill: "#123C3F", font: { bold: true, color: "#FFFFFF" }, wrapText: true };
  audit.getRange("A:P").format.wrapText = true;
  audit.getRange("H:H").format.numberFormat = "0";
  audit.getRange("J:J").format.numberFormat = "0.0";
  audit.freezePanes.freezeRows(1);
  audit.freezePanes.freezeColumns(3);
  audit.getRange("A:A").format.columnWidthPx = 155;
  audit.getRange("B:B").format.columnWidthPx = 95;
  audit.getRange("C:C").format.columnWidthPx = 120;
  audit.getRange("D:D").format.columnWidthPx = 330;
  audit.getRange("E:G").format.columnWidthPx = 150;
  audit.getRange("H:M").format.columnWidthPx = 95;
  audit.getRange("N:N").format.columnWidthPx = 520;
  audit.getRange("O:P").format.columnWidthPx = 260;
  audit.getRange(`A1:P${rows.length + 1}`).format.rowHeightPx = 48;

  addRows(captionsSheet, rows, ["post_id", "date", "hook", "full_caption", "post_link", "data_source_notes"]);
  captionsSheet.getRange("A1:F1").format = { fill: "#123C3F", font: { bold: true, color: "#FFFFFF" }, wrapText: true };
  captionsSheet.getRange("A:F").format.wrapText = true;
  captionsSheet.freezePanes.freezeRows(1);
  captionsSheet.freezePanes.freezeColumns(2);
  captionsSheet.getRange("A:A").format.columnWidthPx = 155;
  captionsSheet.getRange("B:B").format.columnWidthPx = 95;
  captionsSheet.getRange("C:C").format.columnWidthPx = 340;
  captionsSheet.getRange("D:D").format.columnWidthPx = 900;
  captionsSheet.getRange("E:F").format.columnWidthPx = 300;
  captionsSheet.getRange(`A2:F${rows.length + 1}`).format.rowHeightPx = 180;

  const kpiRows = [
    ["Metric", "Value"],
    ["Posts captured", rows.length],
    ["Posts with current admin impressions", rows.filter((r) => r.impressions_current !== "").length],
    ["Total current impressions", rows.reduce((sum, r) => sum + (Number(r.impressions_current) || 0), 0)],
    ["Total current reactions", rows.reduce((sum, r) => sum + (Number(r.reactions_current) || 0), 0)],
    ["Avg current impressions / post", rows.length ? Math.round(rows.reduce((sum, r) => sum + (Number(r.impressions_current) || 0), 0) / rows.length) : 0],
  ];
  dash.getRange("A1").write([["Lifetrek LinkedIn Post Audit", ""], [`Updated ${OUTPUT_DATE}`, ""]]);
  dash.getRange("A1:B1").merge();
  dash.getRange("A1:B1").format = { fill: "#123C3F", font: { bold: true, color: "#FFFFFF", size: 16 } };
  dash.getRange("A3").write(kpiRows);
  dash.getRange("A3:B3").format = { fill: "#E7F0F0", font: { bold: true } };
  dash.getRange("A:B").format.columnWidthPx = 260;

  const topRows = [...rows]
    .sort((a, b) => (Number(b.impressions_current) || 0) - (Number(a.impressions_current) || 0))
    .slice(0, 10)
    .map((r) => ({ date: r.date, hook: r.hook, impressions_current: r.impressions_current, reactions_current: r.reactions_current, awareness_stage: r.awareness_stage }));
  addRows(dash, topRows, ["date", "hook", "impressions_current", "reactions_current", "awareness_stage"], "D3");
  dash.getRange("D3:H3").format = { fill: "#E7F0F0", font: { bold: true } };
  dash.getRange("D:H").format.columnWidthPx = 170;
  dash.getRange("E:E").format.columnWidthPx = 380;

  addRows(hookSheet, hookRows, ["hook_category", "posts", "avg_impressions", "avg_reactions", "avg_ctr_export_pct"]);
  hookSheet.getRange("A1:E1").format = { fill: "#123C3F", font: { bold: true, color: "#FFFFFF" } };
  hookSheet.getRange("A:E").format.columnWidthPx = 155;
  const hookChart = hookSheet.charts.add("bar", hookSheet.getRange(`A1:C${hookRows.length + 1}`));
  hookChart.title = "Average impressions by hook category";
  hookChart.setPosition("G2", "N18");

  addRows(awarenessSheet, awarenessRows, ["awareness_stage", "posts", "avg_impressions", "avg_reactions", "avg_ctr_export_pct"]);
  awarenessSheet.getRange("A1:E1").format = { fill: "#123C3F", font: { bold: true, color: "#FFFFFF" } };
  awarenessSheet.getRange("A:E").format.columnWidthPx = 160;
  const awarenessChart = awarenessSheet.charts.add("bar", awarenessSheet.getRange(`A1:C${awarenessRows.length + 1}`));
  awarenessChart.title = "Average impressions by awareness stage";
  awarenessChart.setPosition("G2", "N18");

  addRows(sources, summaryRows, ["source", "detail"]);
  sources.getRange("A1:B1").format = { fill: "#123C3F", font: { bold: true, color: "#FFFFFF" } };
  sources.getRange("A:A").format.columnWidthPx = 230;
  sources.getRange("B:B").format.columnWidthPx = 720;
  sources.getRange("A:B").format.wrapText = true;

  for (const sheet of [dash, audit, captionsSheet, hookSheet, awarenessSheet, sources]) {
    sheet.showGridLines = false;
  }

  const previews = [
    ["Dashboard", "linkedin_post_audit_dashboard_preview.png", undefined],
    ["Post Audit", "linkedin_post_audit_post_audit_preview.png", "A1:P18"],
    ["Full Captions", "linkedin_post_audit_full_captions_preview.png", "A1:F8"],
    ["Hook Summary", "linkedin_post_audit_hook_summary_preview.png", undefined],
    ["Awareness Summary", "linkedin_post_audit_awareness_summary_preview.png", undefined],
    ["Sources", "linkedin_post_audit_sources_preview.png", undefined],
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
  await fs.writeFile(path.join(OUT, "linkedin_post_audit_formula_scan.ndjson"), errors.ndjson);
  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(outputXlsx);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const adminPosts = parseAdminSnapshot(await fs.readFile(SNAPSHOT_TXT, "utf8"));
  const exportPosts = readContentExports();
  const scoredRows = readCsv(SCORED_CSV);
  const currentRows = readCsv(CURRENT_CSV);

  const usedExportRows = new Set();
  const rows = [];

  for (const admin of adminPosts) {
    const xls = findBestMatch(admin, exportPosts, 2);
    if (xls) usedExportRows.add(xls);
    const current = findCsvMetric(admin, currentRows, "post_title_short", "date");
    const scored = findCsvMetric(admin, scoredRows, "post_title", "date");
    const hook = extractHook(admin.caption);
    const [stage, stageReason] = awarenessStage(admin.caption, hook);
    const category = classifyHook(hook);
    const topic = current?.category || topicCategory(admin.caption, hook);
    const postId = crypto.createHash("sha1").update(`${admin.date}|${norm(admin.caption).slice(0, 220)}`).digest("hex").slice(0, 12);
    const exportImpressions = xls?.export_impressions ?? num(current?.impressions) ?? num(scored?.impressions);
    const exportClicks = xls?.export_clicks ?? num(current?.clicks) ?? num(scored?.clicks);
    const exportCtrPct = xls?.export_ctr_pct ?? num(current?.ctr_pct) ?? num(scored?.ctr_pct);
    const exportReactions = xls?.export_reactions ?? num(current?.reactions) ?? num(scored?.reactions);
    const exportComments = xls?.export_comments ?? num(current?.comments) ?? num(scored?.comments);
    const exportReposts = xls?.export_reposts ?? num(current?.reposts) ?? num(scored?.reposts);
    rows.push({
      post_id: postId,
      date: admin.date,
      author: admin.author,
      admin_feed_number: admin.admin_feed_number,
      post_link: xls?.post_link || "",
      post_format: inferPostFormat(admin.admin_segment, xls),
      full_caption: admin.caption,
      hook,
      hook_category: category,
      awareness_stage: stage,
      awareness_reason: stageReason,
      topic_category: topic,
      icp_primary: scored?.icp_primary || "",
      impressions_current: admin.admin_impressions ?? "",
      reactions_current: admin.admin_reactions ?? "",
      comments_current: admin.admin_comments ?? "",
      reposts_current: admin.admin_reposts ?? "",
      video_views_current: admin.admin_video_views ?? "",
      impressions_export: exportImpressions ?? "",
      clicks_export: exportClicks ?? "",
      ctr_export_pct: exportCtrPct ?? "",
      reactions_export: exportReactions ?? "",
      comments_export: exportComments ?? "",
      reposts_export: exportReposts ?? "",
      follows_export: xls?.export_follows ?? num(scored?.follows) ?? "",
      engagement_rate_export_pct: xls?.export_engagement_rate_pct ?? num(current?.engagement_rate_pct) ?? num(scored?.engagement_rate_pct) ?? "",
      data_source_notes: [
        "caption/current reactions and available current metrics from LinkedIn admin page snapshot 2026-05-01",
        xls ? `export metrics/link from ${xls.source_file}` : "no matching raw content export row",
        current ? "matched current analytics CSV" : "",
        scored ? "matched scored analytics CSV" : "",
      ].filter(Boolean).join("; "),
    });
  }

  for (const xls of exportPosts) {
    if (usedExportRows.has(xls)) continue;
    if (rows.some((r) => norm(r.full_caption).slice(0, 160) === norm(xls.caption).slice(0, 160))) continue;
    const hook = extractHook(xls.caption);
    const [stage, stageReason] = awarenessStage(xls.caption, hook);
    const postId = crypto.createHash("sha1").update(`${xls.date}|${norm(xls.caption).slice(0, 220)}`).digest("hex").slice(0, 12);
    rows.push({
      post_id: postId,
      date: xls.date,
      author: xls.author,
      admin_feed_number: "",
      post_link: xls.post_link,
      post_format: xls.export_content_type || xls.export_post_type || "Unknown",
      full_caption: xls.caption,
      hook,
      hook_category: classifyHook(hook),
      awareness_stage: stage,
      awareness_reason: stageReason,
      topic_category: topicCategory(xls.caption, hook),
      icp_primary: "",
      impressions_current: "",
      reactions_current: "",
      comments_current: "",
      reposts_current: "",
      video_views_current: "",
      impressions_export: xls.export_impressions ?? "",
      clicks_export: xls.export_clicks ?? "",
      ctr_export_pct: xls.export_ctr_pct ?? "",
      reactions_export: xls.export_reactions ?? "",
      comments_export: xls.export_comments ?? "",
      reposts_export: xls.export_reposts ?? "",
      follows_export: xls.export_follows ?? "",
      engagement_rate_export_pct: xls.export_engagement_rate_pct ?? "",
      data_source_notes: `caption/link/export metrics from ${xls.source_file}; not visible in admin snapshot`,
    });
  }

  rows.sort((a, b) => (a.date === b.date ? Number(a.admin_feed_number || 999) - Number(b.admin_feed_number || 999) : a.date < b.date ? -1 : 1));
  for (const row of rows) {
    row.caption_excerpt = row.full_caption.length > 260 ? `${row.full_caption.slice(0, 257)}...` : row.full_caption;
  }

  const aggregate = (field) => {
    const groups = new Map();
    for (const row of rows) {
      const key = row[field] || "Unclassified";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    return [...groups.entries()].map(([key, group]) => {
      const avg = (metric) => {
        const vals = group.map((r) => Number(r[metric])).filter((n) => Number.isFinite(n) && n > 0);
        return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : "";
      };
      return {
        [field]: key,
        posts: group.length,
        avg_impressions: avg("impressions_current"),
        avg_reactions: avg("reactions_current"),
        avg_ctr_export_pct: avg("ctr_export_pct"),
      };
    }).sort((a, b) => b.posts - a.posts);
  };

  const hookRows = aggregate("hook_category").map((r) => ({
    hook_category: r.hook_category,
    posts: r.posts,
    avg_impressions: r.avg_impressions,
    avg_reactions: r.avg_reactions,
    avg_ctr_export_pct: r.avg_ctr_export_pct,
  }));
  const awarenessRows = aggregate("awareness_stage").map((r) => ({
    awareness_stage: r.awareness_stage,
    posts: r.posts,
    avg_impressions: r.avg_impressions,
    avg_reactions: r.avg_reactions,
    avg_ctr_export_pct: r.avg_ctr_export_pct,
  }));

  const allColumns = [
    "post_id",
    "date",
    "author",
    "admin_feed_number",
    "post_format",
    "post_link",
    "hook",
    "hook_category",
    "awareness_stage",
    "awareness_reason",
    "topic_category",
    "icp_primary",
    "impressions_current",
    "clicks_export",
    "ctr_export_pct",
    "reactions_current",
    "comments_current",
    "reposts_current",
    "video_views_current",
    "impressions_export",
    "reactions_export",
    "comments_export",
    "reposts_export",
    "follows_export",
    "engagement_rate_export_pct",
    "full_caption",
    "data_source_notes",
  ];

  await fs.writeFile(path.join(OUT, "linkedin_post_content_audit_2026-05-01.csv"), outputCsv(rows, allColumns));
  await fs.writeFile(path.join(OUT, "linkedin_post_content_audit_2026-05-01.json"), JSON.stringify(rows, null, 2));
  await fs.writeFile(path.join(OUT, "linkedin_hook_summary_2026-05-01.csv"), outputCsv(hookRows, ["hook_category", "posts", "avg_impressions", "avg_reactions", "avg_ctr_export_pct"]));
  await fs.writeFile(path.join(OUT, "linkedin_awareness_summary_2026-05-01.csv"), outputCsv(awarenessRows, ["awareness_stage", "posts", "avg_impressions", "avg_reactions", "avg_ctr_export_pct"]));

  const analyticsRows = rows
    .filter((r) => r.post_link && r.impressions_current !== "")
    .map((r) => ({
      "post date": r.date,
      "post url": r.post_link,
      impressions: r.impressions_current,
      clicks: r.clicks_export,
      reactions: r.reactions_current,
      comments: r.comments_current,
      shares: r.reposts_current,
      "engagement rate": r.engagement_rate_export_pct,
      ctr: r.ctr_export_pct,
      "post id": r.post_id,
    }));
  await fs.writeFile(path.join(OUT, "linkedin_analytics_ingest_ready_2026-05-01.csv"), outputCsv(analyticsRows, ["post date", "post url", "impressions", "clicks", "reactions", "comments", "shares", "engagement rate", "ctr", "post id"]));

  const sqlCols = [
    "post_id",
    "posted_at",
    "author",
    "post_link",
    "post_format",
    "caption",
    "hook",
    "hook_category",
    "awareness_stage",
    "topic_category",
    "impressions_current",
    "clicks_export",
    "ctr_export_pct",
    "reactions_current",
    "comments_current",
    "reposts_current",
    "impressions_export",
    "reactions_export",
    "source_notes",
  ];
  const sql = [
    "-- Draft schema and upsert for Lifetrek LinkedIn post content audit.",
    "-- Review before running against Supabase.",
    "create table if not exists public.linkedin_post_content_audit (",
    "  post_id text primary key,",
    "  posted_at date not null,",
    "  author text,",
    "  post_link text,",
    "  post_format text,",
    "  caption text not null,",
    "  hook text,",
    "  hook_category text check (hook_category in ('Statement','List','Exclamation','Question','Command','Story','Conditional')),",
    "  awareness_stage text check (awareness_stage in ('Most aware','Product-aware','Solution-aware','Problem-aware','Unaware')),",
    "  topic_category text,",
    "  impressions_current integer,",
    "  clicks_export integer,",
    "  ctr_export_pct numeric(8,4),",
    "  reactions_current integer,",
    "  comments_current integer,",
    "  reposts_current integer,",
    "  impressions_export integer,",
    "  reactions_export integer,",
    "  source_notes text,",
    "  source_snapshot_date date not null default date '2026-05-01',",
    "  created_at timestamptz not null default timezone('utc', now()),",
    "  updated_at timestamptz not null default timezone('utc', now())",
    ");",
    "",
    `insert into public.linkedin_post_content_audit (${sqlCols.join(", ")}) values`,
    rows.map((r) => `(${[
      r.post_id,
      r.date,
      r.author,
      r.post_link,
      r.post_format,
      r.full_caption,
      r.hook,
      r.hook_category,
      r.awareness_stage,
      r.topic_category,
      r.impressions_current === "" ? null : r.impressions_current,
      r.clicks_export === "" ? null : r.clicks_export,
      r.ctr_export_pct === "" ? null : r.ctr_export_pct,
      r.reactions_current === "" ? null : r.reactions_current,
      r.comments_current === "" ? null : r.comments_current,
      r.reposts_current === "" ? null : r.reposts_current,
      r.impressions_export === "" ? null : r.impressions_export,
      r.reactions_export === "" ? null : r.reactions_export,
      r.data_source_notes,
    ].map(sqlLiteral).join(", ")})`).join(",\n"),
    "on conflict (post_id) do update set",
    "  posted_at = excluded.posted_at,",
    "  author = excluded.author,",
    "  post_link = excluded.post_link,",
    "  post_format = excluded.post_format,",
    "  caption = excluded.caption,",
    "  hook = excluded.hook,",
    "  hook_category = excluded.hook_category,",
    "  awareness_stage = excluded.awareness_stage,",
    "  topic_category = excluded.topic_category,",
    "  impressions_current = excluded.impressions_current,",
    "  clicks_export = excluded.clicks_export,",
    "  ctr_export_pct = excluded.ctr_export_pct,",
    "  reactions_current = excluded.reactions_current,",
    "  comments_current = excluded.comments_current,",
    "  reposts_current = excluded.reposts_current,",
    "  impressions_export = excluded.impressions_export,",
    "  reactions_export = excluded.reactions_export,",
    "  source_notes = excluded.source_notes,",
    "  updated_at = timezone('utc', now());",
    "",
  ].join("\n");
  await fs.writeFile(path.join(OUT, "linkedin_post_content_audit_supabase_upsert_2026-05-01.sql"), sql);

  const sources = [
    { source: "LinkedIn admin page posts", detail: `Authenticated page snapshot saved ${OUTPUT_DATE}; ${adminPosts.length} real posts parsed from /company/109570674/admin/page-posts/published/.` },
    { source: "LinkedIn content XLS exports", detail: `${CONTENT_FILES.map((f) => path.basename(f)).join(", ")}; used for post links, clicks, CTR, historical impressions, follows, and engagement rate where matched.` },
    { source: "Existing analytics CSVs", detail: `${path.basename(SCORED_CSV)} and ${path.basename(CURRENT_CSV)}; used as supplementary analytics/topic context.` },
    { source: "Screenshot evidence", detail: path.join(OUT, "screenshots/linkedin_admin_page_posts_fullpage_2026-05-01.png") },
  ];

  await buildWorkbook(rows, sources, hookRows, awarenessRows, path.join(OUT, "Lifetrek_LinkedIn_Post_Audit_2026-05-01.xlsx"));

  console.log(JSON.stringify({
    posts: rows.length,
    adminPosts: adminPosts.length,
    currentImpressionRows: rows.filter((r) => r.impressions_current !== "").length,
    files: {
      csv: path.join(OUT, "linkedin_post_content_audit_2026-05-01.csv"),
      json: path.join(OUT, "linkedin_post_content_audit_2026-05-01.json"),
      xlsx: path.join(OUT, "Lifetrek_LinkedIn_Post_Audit_2026-05-01.xlsx"),
      sql: path.join(OUT, "linkedin_post_content_audit_supabase_upsert_2026-05-01.sql"),
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

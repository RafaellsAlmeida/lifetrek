import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";

const now = new Date();
const isoDate = now.toISOString().slice(0, 10);
const runId = process.argv[2] ?? `validation-run-${isoDate}`;
const rootDir = process.cwd();
const testResultsDir = path.resolve(rootDir, "playwright/test-results");
const workDir = path.resolve(rootDir, "tmp/engineering-drawing-validation-run", runId);
const htmlPath = path.join(workDir, "engineering-drawing-validation-report.html");
const pdfPath = path.join(workDir, "engineering-drawing-validation-report.pdf");
const manifestPath = path.join(workDir, "engineering-drawing-validation-manifest.json");
const bucketName = "engineering-drawings";
const uploadPrefix = `reports/validation-runs/${runId}`;

const screenshotArtifacts = [
  {
    key: "manual_supported_3d",
    label: "Manual in-app validation: supported axisymmetric 3D flow",
    fileName: "manual-technical-drawing-supported-3d.png",
    type: "manual",
  },
  {
    key: "manual_gdt_cleared",
    label: "Manual in-app validation: GD&T gate cleared after reviewer confirmation",
    fileName: "manual-technical-drawing-gdt-cleared.png",
    type: "manual",
  },
  {
    key: "e2e_happy_path",
    label: "Automated E2E: 3D happy path",
    fileName: "technical-drawing-3d-happy-path.png",
    type: "automated",
  },
  {
    key: "e2e_gdt_review",
    label: "Automated E2E: GD&T review path",
    fileName: "technical-drawing-gdt-review.png",
    type: "automated",
  },
  {
    key: "e2e_final",
    label: "Automated E2E: final reviewed drawing state",
    fileName: "technical-drawing-final.png",
    type: "automated",
  },
];

const manualChecks = [
  {
    name: "Supported sketch -> review -> 2D -> 3D -> GLB",
    status: "passed",
    steps: [
      "Uploaded the supported threaded shaft sketch in the admin UI.",
      "Resolved the remaining ambiguity and confirmed geometry plus semantic review.",
      "Generated 2D output, then 3D preview, then verified GLB export was enabled.",
    ],
  },
  {
    name: "GD&T semantic blocking before reviewer approval",
    status: "passed",
    steps: [
      "Opened the fixture with an unknown governing standard and a pending perpendicularity callout.",
      "Confirmed the app blocked 2D generation with the expected governing-standard validation message.",
      "Selected ASME, marked the callout as confirmed, saved review, and verified the same fixture then rendered successfully.",
    ],
  },
];

const observations = [
  {
    title: "Axisymmetric happy path is stable",
    detail:
      "The supported shaft fixture now survives extraction, review, 2D rendering, 3D preview, and GLB export without bypassing validation.",
  },
  {
    title: "Semantic GD&T gating is working as intended",
    detail:
      "Unknown governing standards and review-pending callouts block rendering until a reviewer resolves them, which is the correct safety posture for internal use.",
  },
  {
    title: "3D scope is intentionally narrow and honest",
    detail:
      "Unsupported side flats and complex non-round segments still block GLB, rather than producing misleading geometry.",
  },
  {
    title: "Remaining weakness is reviewer-correction reuse",
    detail:
      "The system stores reviewed outcomes, but it does not yet turn recurring reviewer corrections into stronger first-pass suggestions.",
  },
];

const improvementPlan = [
  {
    phase: "Phase 1: Capture correction signals",
    timeframe: "1 sprint",
    goal: "Persist the exact reviewer corrections that changed extraction output.",
    actions: [
      "Store field-level deltas for standard selection, datum type changes, callout review-status changes, ambiguity resolutions, and feature-target overrides.",
      "Record the raw trigger that caused the draft suggestion: OCR text, title-block text, fixture ID, and confidence bucket.",
      "Tag each correction with a simple reason code such as standard, symbol_parse, leader_target, datum_type, tolerance_value, or unsupported_scope.",
    ],
    expectedImpact:
      "This creates a labeled correction history without introducing a new model or changing the current validation gates.",
  },
  {
    phase: "Phase 2: Example-backed suggestion memory",
    timeframe: "1 sprint",
    goal: "Use accepted past corrections to improve the next draft suggestion.",
    actions: [
      "Build a small reviewed-example store keyed by normalized raw text plus context such as standard family, feature kind, and axisymmetric flag.",
      "Before falling back to generic heuristics, check for exact or near-exact reviewed examples and reuse the accepted normalization when confidence is high.",
      "Expose the match source in the review UI as 'based on reviewed example' so reviewers can trust or reject it explicitly.",
    ],
    expectedImpact:
      "Recurring title-block formats, datum tags, and common FCF patterns should converge faster with less manual cleanup.",
  },
  {
    phase: "Phase 3: Acceptance-rate rule tuning",
    timeframe: "1 sprint",
    goal: "Promote only the suggestions that repeatedly survive review.",
    actions: [
      "Track acceptance rate per heuristic and per reviewed-example pattern.",
      "Auto-accept only patterns that stay above a strict threshold and have no conflicting reviewer history.",
      "Force low-agreement patterns back into review-required mode instead of letting them look authoritative.",
    ],
    expectedImpact:
      "Confidence becomes calibrated by observed reviewer agreement instead of only by initial OCR heuristics.",
  },
  {
    phase: "Phase 4: Corpus replay and regression gating",
    timeframe: "ongoing",
    goal: "Turn accepted drawings into a growing validation corpus.",
    actions: [
      "Export reviewed session snapshots into a gold fixture library with source image, normalized geometry, normalized semantic document, and expected render/export outcome.",
      "Replay the corpus on every extraction or validation change and compare field-level drift for standard detection, datum typing, callout parsing, and 3D readiness.",
      "Fail CI when a previously accepted reviewed fixture regresses from pass to review-required or blocked without an explicit rule change.",
    ],
    expectedImpact:
      "The system improves from its own reviewed history while staying deterministic and auditable.",
  },
];

function assertEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function formatDurationMs(durationMs) {
  if (!Number.isFinite(durationMs)) return "n/a";
  if (durationMs < 1000) return `${durationMs} ms`;
  return `${(durationMs / 1000).toFixed(1)} s`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const jsonStart = raw.indexOf("{");
    const normalized = jsonStart >= 0 ? raw.slice(jsonStart) : raw;
    return JSON.parse(normalized);
  } catch {
    return null;
  }
}

async function readArtifact(fileName) {
  const filePath = path.join(testResultsDir, fileName);
  const buffer = await fs.readFile(filePath);
  const stat = await fs.stat(filePath);
  return {
    fileName,
    filePath,
    sizeBytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    buffer,
  };
}

function summarizePlaywrightReport(label, command, report) {
  const stats = report?.stats ?? {};
  const passed = Number(stats.expected ?? 0);
  const failed = Number((stats.unexpected ?? 0) + (stats.flaky ?? 0));
  const skipped = Number(stats.skipped ?? 0);
  const duration = Number(stats.duration ?? 0);

  return {
    label,
    command,
    status: failed === 0 ? "passed" : "failed",
    passed,
    failed,
    skipped,
    durationMs: duration,
  };
}

function bytesToMb(value) {
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildReportHtml({ runSummary, screenshots }) {
  const suiteRows = runSummary.suites
    .map(
      (suite) => `
        <tr>
          <td>${escapeHtml(suite.label)}</td>
          <td>${escapeHtml(suite.status)}</td>
          <td>${suite.passed}</td>
          <td>${suite.failed}</td>
          <td>${suite.skipped}</td>
          <td>${escapeHtml(formatDurationMs(suite.durationMs))}</td>
          <td><code>${escapeHtml(suite.command)}</code></td>
        </tr>`,
    )
    .join("");

  const manualChecksHtml = manualChecks
    .map(
      (check) => `
        <section class="card">
          <h3>${escapeHtml(check.name)}</h3>
          <p><strong>Status:</strong> ${escapeHtml(check.status)}</p>
          <ul>${check.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ul>
        </section>`,
    )
    .join("");

  const observationsHtml = observations
    .map(
      (observation) => `
        <section class="card">
          <h3>${escapeHtml(observation.title)}</h3>
          <p>${escapeHtml(observation.detail)}</p>
        </section>`,
    )
    .join("");

  const planHtml = improvementPlan
    .map(
      (item) => `
        <section class="card">
          <h3>${escapeHtml(item.phase)}</h3>
          <p><strong>Timeframe:</strong> ${escapeHtml(item.timeframe)}</p>
          <p><strong>Goal:</strong> ${escapeHtml(item.goal)}</p>
          <ul>${item.actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul>
          <p><strong>Expected impact:</strong> ${escapeHtml(item.expectedImpact)}</p>
        </section>`,
    )
    .join("");

  const screenshotHtml = screenshots
    .map(
      (item) => `
        <figure class="screenshot">
          <img src="${item.dataUrl}" alt="${escapeHtml(item.label)}" />
          <figcaption>${escapeHtml(item.label)}</figcaption>
        </figure>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Engineering Drawing Validation Run</title>
    <style>
      body {
        font-family: Inter, Arial, sans-serif;
        margin: 32px;
        color: #0f172a;
        background: #f8fafc;
      }
      h1, h2, h3 { margin: 0 0 12px; }
      p, li, td, th { line-height: 1.45; font-size: 13px; }
      .header {
        padding: 24px;
        border-radius: 18px;
        background: linear-gradient(135deg, #0f3c68 0%, #134e4a 100%);
        color: white;
        margin-bottom: 24px;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-top: 18px;
      }
      .meta-card, .card {
        background: white;
        border: 1px solid #dbe4ee;
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
      }
      .meta-card {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.2);
      }
      .meta-card strong {
        display: block;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 6px;
        opacity: 0.85;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 16px;
        overflow: hidden;
      }
      th, td {
        border: 1px solid #e2e8f0;
        padding: 10px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #e0f2fe;
      }
      code {
        font-size: 11px;
        word-break: break-all;
      }
      .screenshots {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      .screenshot {
        margin: 0;
        padding: 14px;
        border-radius: 16px;
        background: white;
        border: 1px solid #dbe4ee;
      }
      .screenshot img {
        width: 100%;
        height: auto;
        border-radius: 10px;
        border: 1px solid #cbd5e1;
      }
      .screenshot figcaption {
        margin-top: 10px;
        font-size: 12px;
      }
      ul {
        margin: 10px 0 0 18px;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <section class="header">
      <h1>Engineering Drawing Validation Run</h1>
      <p>Axisymmetric sketch -> reviewed drawing -> 2D -> 3D -> GLB validation bundle.</p>
      <div class="meta-grid">
        <div class="meta-card"><strong>Run ID</strong>${escapeHtml(runSummary.runId)}</div>
        <div class="meta-card"><strong>Date</strong>${escapeHtml(runSummary.generatedAt)}</div>
        <div class="meta-card"><strong>Overall Status</strong>${escapeHtml(runSummary.overallStatus)}</div>
        <div class="meta-card"><strong>Artifacts</strong>${runSummary.uploads.length} files</div>
      </div>
    </section>

    <section class="card">
      <h2>Automated Test Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Suite</th>
            <th>Status</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
            <th>Duration</th>
            <th>Command</th>
          </tr>
        </thead>
        <tbody>${suiteRows}</tbody>
      </table>
    </section>

    <section>
      <h2>Manual Validation</h2>
      ${manualChecksHtml}
    </section>

    <section>
      <h2>Observed Results</h2>
      ${observationsHtml}
    </section>

    <section>
      <h2>Improvement Plan</h2>
      ${planHtml}
    </section>

    <section>
      <h2>Evidence Screenshots</h2>
      <div class="screenshots">${screenshotHtml}</div>
    </section>
  </body>
</html>`;
}

async function buildPdfFromHtml(html) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
  });
  await browser.close();
}

function toDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function uploadArtifact(client, targetPath, buffer, contentType) {
  const { error } = await client.storage.from(bucketName).upload(targetPath, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data, error: signedUrlError } = await client.storage.from(bucketName).createSignedUrl(targetPath, 60 * 60 * 24 * 7);
  if (signedUrlError) {
    throw signedUrlError;
  }

  return {
    path: targetPath,
    signedUrl: data?.signedUrl ?? null,
  };
}

async function ensureBucketExists(client) {
  const { data, error } = await client.storage.listBuckets();
  if (error) {
    throw error;
  }

  if (data?.some((bucket) => bucket.name === bucketName || bucket.id === bucketName)) {
    return;
  }

  const { error: createError } = await client.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "model/gltf-binary",
      "application/octet-stream",
    ],
  });

  if (createError) {
    throw createError;
  }
}

await ensureDir(workDir);

const apiReportPath = path.resolve(rootDir, "tmp/engineering-drawing-validation-run/api-results.json");
const e2eReportPath = path.resolve(rootDir, "tmp/engineering-drawing-validation-run/e2e-results.json");

const apiReport = await readJsonIfExists(apiReportPath);
const e2eReport = await readJsonIfExists(e2eReportPath);

if (!apiReport || !e2eReport) {
  throw new Error("Missing Playwright JSON reports. Expected tmp/engineering-drawing-validation-run/api-results.json and e2e-results.json.");
}

const screenshotInputs = await Promise.all(
  screenshotArtifacts.map(async (artifact) => {
    const source = await readArtifact(artifact.fileName);
    return {
      ...artifact,
      ...source,
      contentType: "image/png",
      dataUrl: toDataUrl(source.buffer, "image/png"),
    };
  }),
);

const suites = [
  summarizePlaywrightReport(
    "API validation suite",
    "npx playwright test playwright/tests/api/engineering-drawing.api.spec.ts --reporter=json",
    apiReport,
  ),
  summarizePlaywrightReport(
    "E2E validation suite",
    "TEST_ADMIN_EMAIL='rafacrvg@icloud.com' TEST_ADMIN_PASSWORD='Lifetrek2026' npx playwright test playwright/tests/e2e/technical-drawing.e2e.spec.ts --reporter=json",
    e2eReport,
  ),
];

const overallStatus = suites.every((suite) => suite.status === "passed") && manualChecks.every((check) => check.status === "passed")
  ? "passed"
  : "attention";

const draftRunSummary = {
  runId,
  generatedAt: now.toISOString(),
  overallStatus,
  suites,
  manualChecks,
  observations,
  improvementPlan,
  uploads: [],
};

const html = buildReportHtml({
  runSummary: draftRunSummary,
  screenshots: screenshotInputs,
});

await fs.writeFile(htmlPath, html, "utf8");
await buildPdfFromHtml(html);

const pdfBuffer = await fs.readFile(pdfPath);

const supabaseUrl = assertEnv("SUPABASE_URL");
const supabaseServiceRoleKey = assertEnv("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

await ensureBucketExists(supabase);

const uploads = [];

for (const artifact of screenshotInputs) {
  const targetPath = `${uploadPrefix}/${artifact.fileName}`;
  const uploaded = await uploadArtifact(supabase, targetPath, artifact.buffer, artifact.contentType);
  uploads.push({
    label: artifact.label,
    type: artifact.type,
    fileName: artifact.fileName,
    size: bytesToMb(artifact.sizeBytes),
    ...uploaded,
  });
}

const uploadedReport = await uploadArtifact(
  supabase,
  `${uploadPrefix}/engineering-drawing-validation-report.pdf`,
  pdfBuffer,
  "application/pdf",
);

uploads.push({
  label: "Validation report PDF",
  type: "report",
  fileName: "engineering-drawing-validation-report.pdf",
  size: bytesToMb(pdfBuffer.byteLength),
  ...uploadedReport,
});

const runSummary = {
  ...draftRunSummary,
  uploads,
};

await fs.writeFile(manifestPath, JSON.stringify(runSummary, null, 2), "utf8");

console.log(JSON.stringify({
  runId,
  overallStatus,
  manifestPath,
  pdfPath,
  uploads,
}, null, 2));

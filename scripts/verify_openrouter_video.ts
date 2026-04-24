/**
 * scripts/verify_openrouter_video.ts
 *
 * Zero-cost verification: queries OpenRouter's /models endpoint,
 * filters for video-capable models, probes their input schemas.
 *
 * Output: tmp/openrouter-video-models.md
 *
 * Run: npx tsx scripts/verify_openrouter_video.ts
 */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Load OPEN_ROUTER_API_KEY from .env
function loadEnvKey(): string {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const raw = readFileSync(envPath, "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("OPEN_ROUTER_API_KEY=")) {
        return trimmed.slice("OPEN_ROUTER_API_KEY=".length).replace(/^["']|["']$/g, "");
      }
      if (trimmed.startsWith("OPENROUTER_API_KEY=")) {
        return trimmed.slice("OPENROUTER_API_KEY=".length).replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // fallback to process.env
  }
  return process.env.OPEN_ROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "";
}

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

async function main() {
  const apiKey = loadEnvKey();

  if (!apiKey || apiKey.includes("your-")) {
    console.error("❌ OPEN_ROUTER_API_KEY not found in .env — add it and retry.");
    process.exit(1);
  }

  console.log("🔍 Fetching OpenRouter model catalog (zero cost)...");

  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://lifetrek.io",
      "X-Title": "Lifetrek Video Verification",
    },
  });

  if (!res.ok) {
    console.error(`❌ OpenRouter models fetch failed: ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  const payload = (await res.json()) as { data: OpenRouterModel[] };
  const models = payload.data || [];
  console.log(`   ↳ ${models.length} models total on OpenRouter.`);

  // Filter: video output capability
  const videoOutputModels = models.filter((m) => {
    const outMod = m.architecture?.output_modalities || [];
    return outMod.includes("video");
  });

  // Filter: image input + video output (image-to-video)
  const i2vModels = models.filter((m) => {
    const inMod = m.architecture?.input_modalities || [];
    const outMod = m.architecture?.output_modalities || [];
    return inMod.includes("image") && outMod.includes("video");
  });

  // Filter: text-to-video
  const t2vModels = models.filter((m) => {
    const inMod = m.architecture?.input_modalities || [];
    const outMod = m.architecture?.output_modalities || [];
    return outMod.includes("video") && !inMod.includes("image");
  });

  // Also do a keyword search on description/id for "video" to catch any
  // models that don't set proper modality flags
  const videoKeywordModels = models.filter((m) => {
    const needle = "video";
    return (
      m.id.toLowerCase().includes(needle) ||
      (m.name || "").toLowerCase().includes(needle) ||
      (m.description || "").toLowerCase().includes(needle)
    );
  });

  // Deduplicate
  const allVideoModels = Array.from(
    new Map(
      [...videoOutputModels, ...videoKeywordModels].map((m) => [m.id, m])
    ).values()
  );

  const lines: string[] = [
    "# OpenRouter Video Model Report",
    `Generated: ${new Date().toISOString()}`,
    `Total models on OpenRouter: ${models.length}`,
    "",
    "---",
    "",
    `## Image-to-Video (i2v) Models: ${i2vModels.length}`,
    i2vModels.length === 0
      ? "_None found with image input + video output modalities._"
      : i2vModels
          .map(
            (m) =>
              `- **${m.id}** — ${m.name}\n  - input: ${(m.architecture?.input_modalities || []).join(", ")}\n  - output: ${(m.architecture?.output_modalities || []).join(", ")}\n  - pricing: prompt=${m.pricing?.prompt ?? "?"}`
          )
          .join("\n"),
    "",
    `## Text-to-Video (t2v) Models: ${t2vModels.length}`,
    t2vModels.length === 0
      ? "_None found with video output modality (non-image input)._"
      : t2vModels
          .map(
            (m) =>
              `- **${m.id}** — ${m.name}\n  - input: ${(m.architecture?.input_modalities || []).join(", ")}\n  - output: ${(m.architecture?.output_modalities || []).join(", ")}\n  - pricing: prompt=${m.pricing?.prompt ?? "?"}`
          )
          .join("\n"),
    "",
    `## All Video-Related Models (keyword + modality): ${allVideoModels.length}`,
    allVideoModels.length === 0
      ? "_No models found matching 'video' in id, name, description, or modalities._"
      : allVideoModels
          .map(
            (m) =>
              `- **${m.id}**\n  - name: ${m.name}\n  - modality: ${m.architecture?.modality ?? "?"}\n  - input: ${(m.architecture?.input_modalities || []).join(", ") || "?"}\n  - output: ${(m.architecture?.output_modalities || []).join(", ") || "?"}\n  - description: ${(m.description || "").slice(0, 120)}`
          )
          .join("\n"),
    "",
    "---",
    "",
    "## Verdict",
    "",
  ];

  if (i2vModels.length > 0) {
    lines.push(
      `✅ OpenRouter **supports image-to-video** via ${i2vModels.length} model(s).`,
      `**Recommended for scene-03:** \`${i2vModels[0].id}\``,
      "",
      "→ Proceed with OpenRouter i2v as primary provider."
    );
  } else if (allVideoModels.length > 0) {
    lines.push(
      `⚠️  OpenRouter lists ${allVideoModels.length} video-related model(s), but **none confirmed i2v**.`,
      "→ Use Runway SDK (already installed) as primary provider for image-to-video.",
      "→ OpenRouter t2v models available as fallback for text-only prompts."
    );
  } else {
    lines.push(
      "❌ OpenRouter does **not** appear to support video generation at this time.",
      "→ Fall back to Runway SDK (`@runwayml/sdk ^3.11.0`) — already installed.",
      "→ All clip generation will use Runway Gen-3 Turbo image-to-video."
    );
  }

  const report = lines.join("\n");
  console.log("\n" + report);

  mkdirSync(resolve(process.cwd(), "tmp"), { recursive: true });
  const outPath = resolve(process.cwd(), "tmp/openrouter-video-models.md");
  writeFileSync(outPath, report, "utf-8");
  console.log(`\n📄 Report saved → ${outPath}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

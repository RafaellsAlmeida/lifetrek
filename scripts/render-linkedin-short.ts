import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

type LinkedInShortSlide = {
  text: string;
  subtext?: string;
  backgroundImage?: string;
};

type LinkedInShortBrief = {
  topic: string;
  accentColor?: string;
  durationInFrames?: number;
  slides: LinkedInShortSlide[];
};

const MIN_DURATION = 900;
const MAX_DURATION = 1350;

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let i = 2; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      args.set(key, "true");
      continue;
    }
    args.set(key, value);
    i += 1;
  }
  return args;
}

function assertBriefShape(value: unknown): asserts value is LinkedInShortBrief {
  if (!value || typeof value !== "object") {
    throw new Error("Brief must be a JSON object.");
  }
  const brief = value as Record<string, unknown>;
  if (typeof brief.topic !== "string" || brief.topic.trim().length === 0) {
    throw new Error("Brief requires a non-empty `topic`.");
  }
  if (!Array.isArray(brief.slides) || brief.slides.length === 0) {
    throw new Error("Brief requires a non-empty `slides` array.");
  }
}

function clampDuration(value?: number) {
  const raw = typeof value === "number" ? value : 1050;
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, raw));
}

function main() {
  const args = parseArgs(process.argv);
  const briefPath = args.get("brief");
  const outputPath = args.get("out") || "tmp/linkedin-short.mp4";

  if (!briefPath) {
    throw new Error(
      "Missing --brief.\nUsage: npx tsx scripts/render-linkedin-short.ts --brief scripts/briefs/linkedin-short-citizen-l20.json --out tmp/linkedin-short-citizen.mp4",
    );
  }

  const resolvedBriefPath = resolve(process.cwd(), briefPath);
  const resolvedOutputPath = resolve(process.cwd(), outputPath);

  const briefRaw = readFileSync(resolvedBriefPath, "utf-8");
  const parsed = JSON.parse(briefRaw) as unknown;
  assertBriefShape(parsed);

  const normalizedBrief: LinkedInShortBrief = {
    ...parsed,
    durationInFrames: clampDuration((parsed as LinkedInShortBrief).durationInFrames),
    slides: (parsed.slides as LinkedInShortSlide[]).map((slide) => ({
      text: slide.text,
      subtext: slide.subtext,
      backgroundImage: slide.backgroundImage,
    })),
  };

  mkdirSync(dirname(resolvedOutputPath), { recursive: true });

  const renderResult = spawnSync(
    "npx",
    [
      "remotion",
      "render",
      "LinkedInShort",
      resolvedOutputPath,
      "--props",
      JSON.stringify(normalizedBrief),
    ],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  if (renderResult.status !== 0) {
    throw new Error(`Remotion render failed with exit code ${renderResult.status ?? "unknown"}.`);
  }

  console.log(`Rendered LinkedInShort: ${resolvedOutputPath}`);
}

main();

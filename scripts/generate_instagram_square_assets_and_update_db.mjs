import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, "public", "images", "lifetrek-logo-full.png");
const BG_DIR = path.join(ROOT, "output", "imagegen", "pinned_lifetrek_v2", "ai_bg");

const BUCKET = "carousel-images";

function readEnvFile() {
  const envText = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const env = {};
  for (const rawLine of envText.split(/\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx < 0) continue;
    const k = line.slice(0, idx);
    let v = line.slice(idx + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[k] = v;
  }
  return env;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toDataUrl(p) {
  const buf = fs.readFileSync(p);
  const ext = path.extname(p).toLowerCase();
  const mime =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function safeJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function pickBgFiles() {
  const files = fs
    .readdirSync(BG_DIR)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort();
  if (!files.length) throw new Error(`No backgrounds found in ${BG_DIR}`);
  return files.map((f) => path.join(BG_DIR, f));
}

function hashToInt(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function labelForSlide(slide) {
  if (slide?.type === "hook") return "DESTAQUE";
  if (slide?.type === "cta") return "PROXIMO PASSO";
  return "INSIGHT";
}

function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildSlideHtml({ title, body, label, bgDataUrl, logoDataUrl }) {
  // Style inspired by marketing_assets/image copy.png (glass card + brand blues).
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --primary: #004F8F;
      --bg0: #0A1628;
      --bg1: #003052;
      --green: #1A7A3E;
      --orange: #F07818;
      --white: #FFFFFF;
      --gray: #E0E0E0;
    }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }

    #slide-capture {
      width: 1080px;
      height: 1080px;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, var(--bg0), var(--bg1));
      color: var(--white);
    }
    .bg {
      position: absolute;
      inset: 0;
      background-image: url("${bgDataUrl}");
      background-size: cover;
      background-position: center;
      transform: scale(1.03);
      filter: saturate(1.06) contrast(1.02);
    }
    .wash {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(115deg, rgba(0, 79, 143, 0.78) 0%, rgba(0, 61, 117, 0.55) 45%, rgba(26, 122, 62, 0.20) 100%),
        linear-gradient(180deg, rgba(10,22,40,0.15) 0%, rgba(10,22,40,0.78) 76%, rgba(10,22,40,0.90) 100%);
    }
    .logo {
      position: absolute;
      top: 34px;
      right: 36px;
      width: 170px;
      filter: drop-shadow(0 10px 28px rgba(0,0,0,0.45));
      opacity: 0.98;
      z-index: 3;
    }
    .card {
      position: absolute;
      left: 64px;
      top: 50%;
      transform: translateY(-50%);
      width: 62%;
      background: rgba(10, 22, 40, 0.74);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 28px;
      padding: 54px 52px 48px;
      box-shadow: 0 28px 70px rgba(0,0,0,0.38);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 2;
    }
    .label {
      display: inline-block;
      color: var(--green);
      font-weight: 800;
      letter-spacing: 0.12em;
      font-size: 16px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    h1 {
      margin: 0 0 18px;
      font-size: 64px;
      line-height: 1.02;
      letter-spacing: -0.02em;
      font-weight: 800;
      text-wrap: balance;
    }
    p {
      margin: 0;
      font-size: 30px;
      line-height: 1.25;
      color: rgba(224,224,224,0.96);
      font-weight: 500;
      max-width: 96%;
    }
    .accent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 10px;
      background: linear-gradient(90deg, var(--primary), var(--orange));
      opacity: 0.9;
      z-index: 4;
    }
  </style>
</head>
<body>
  <div id="slide-capture">
    <div class="bg"></div>
    <div class="wash"></div>
    <img class="logo" src="${logoDataUrl}" alt="Lifetrek Medical" />
    <div class="card">
      <div class="label">${escapeHtml(label)}</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(body)}</p>
    </div>
    <div class="accent"></div>
  </div>
</body>
</html>`;
}

function tailorHashtags(topic) {
  const t = (topic || "").toLowerCase();
  const base = ["#LifetrekMedical", "#MedicalDeviceManufacturing", "#ISO13485", "#CNC", "#MedTech"];
  if (t.includes("cleanroom") || t.includes("iso 7") || t.includes("sala limpa")) base.push("#Cleanroom", "#SterilePackaging");
  if (t.includes("swiss") || t.includes("usinagem") || t.includes("torneamento")) base.push("#SwissTurning", "#PrecisionMachining");
  if (t.includes("importa") || t.includes("import")) base.push("#SupplyChain", "#Procurement");
  if (t.includes("fda") || t.includes("anvisa") || t.includes("conformidade")) base.push("#RegulatoryAffairs");
  // Keep <= 11 to avoid hashtag spam.
  return Array.from(new Set(base)).slice(0, 11);
}

function tailorCaption(post) {
  // Tight, engineer-to-engineer; avoid generic CRM/IA.
  const topic = post.topic || "";
  const slides = safeJsonArray(post.slides);
  const hook = slides.find((s) => s?.type === "hook") || slides[0] || {};
  const headline = hook.headline || topic;

  const lines = [
    headline,
    "",
    "Se a sua equipe precisa de previsibilidade (qualidade, prazo e rastreabilidade), o ponto nao e prometer: e ter processo e dados.",
    "",
    "Quer que a gente avalie seu desenho/roteiro e te diga onde o risco esta antes de escalar?",
    "",
    "Fale com a Lifetrek Medical.",
  ];
  return lines.join("\n");
}

async function uploadPngToBucket(supabase, absolutePngPath, storagePath) {
  const bytes = fs.readFileSync(absolutePngPath);
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (upErr) throw new Error(`Upload failed (${storagePath}): ${upErr.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function uploadPngBytesToBucket(supabase, pngBytes, storagePath) {
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, pngBytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (upErr) throw new Error(`Upload failed (${storagePath}): ${upErr.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function run() {
  if (!fs.existsSync(LOGO_PATH)) throw new Error(`Missing logo: ${LOGO_PATH}`);
  if (!fs.existsSync(BG_DIR)) throw new Error(`Missing backgrounds dir: ${BG_DIR}`);

  const env = readEnvFile();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const bgFiles = pickBgFiles();
  const logoDataUrl = toDataUrl(LOGO_PATH);

  const { data: posts, error } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const candidates = posts.filter((p) => {
    const meta = p.generation_metadata || {};
    const already = meta && typeof meta === "object" && meta.square_v1_generated_at;
    return !already;
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const post of candidates) {
    const slides = safeJsonArray(post.slides);
    if (!slides.length) continue;

    const existingUrls = safeJsonArray(post.image_urls);
    const newUrls = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i] || {};
      const bg = bgFiles[(hashToInt(`${post.id}:${i}`) % bgFiles.length + bgFiles.length) % bgFiles.length];
      const html = buildSlideHtml({
        title: slide.headline || post.topic || "Lifetrek Medical",
        body: slide.body || "",
        label: labelForSlide(slide),
        bgDataUrl: toDataUrl(bg),
        logoDataUrl,
      });

      // Avoid writing large files to disk: render in-memory and upload bytes.
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.waitForSelector("#slide-capture");
      const pngBytes = await page.locator("#slide-capture").screenshot(); // Buffer

      const storagePath = `instagram/${post.id}/square_v1/slide_${i + 1}.png`;
      const publicUrl = await uploadPngBytesToBucket(supabase, pngBytes, storagePath);
      newUrls.push(publicUrl);
    }

    const nextMeta = typeof post.generation_metadata === "object" && post.generation_metadata ? { ...post.generation_metadata } : {};
    if (!nextMeta.prev_image_urls && existingUrls.length) nextMeta.prev_image_urls = existingUrls;
    nextMeta.square_v1_image_urls = newUrls;
    nextMeta.square_v1_generated_at = new Date().toISOString();
    nextMeta.square_v1_dimensions = "1080x1080";

    const caption = tailorCaption(post);
    const hashtags = tailorHashtags(post.topic);

    const { error: upErr } = await supabase
      .from("instagram_posts")
      .update({
        image_urls: newUrls,
        caption,
        hashtags,
        generation_metadata: nextMeta,
        ai_generated: false,
      })
      .eq("id", post.id);

    if (upErr) throw new Error(`DB update failed (${post.id}): ${upErr.message}`);
  }

  await browser.close();
  console.log(`OK: generated square assets for ${candidates.length} instagram_posts (uploaded to ${BUCKET})`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

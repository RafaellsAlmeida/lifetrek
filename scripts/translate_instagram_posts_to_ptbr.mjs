import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const ROOT = process.cwd();

function readEnvFile() {
  const envText = fs.readFileSync(`${ROOT}/.env`, "utf8");
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

function looksEnglish(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.toLowerCase();
  // Heuristic: common English tokens/patterns
  return /\b(the|and|from|to|behind|scale|sleep|ever wonder|swipe|raw titanium|one-stop|quality is not|we deliver|ready to)\b/i.test(t);
}

function normalizeSlides(value) {
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

async function translate(openai, text) {
  const resp = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content:
          "Voce e um tradutor tecnico. Traduza para PT-BR com tom engenheiro-para-engenheiro. Preserve quebras de linha, emojis, e o tamanho aproximado (nao expanda). Nao invente informacao, nao adicione paragrafos, nao explique, nao crie artigo. Retorne APENAS a traducao do texto de entrada. Preserve nomes de marca/produtos (Lifetrek Medical, ISO 13485, ANVISA, FDA, Swiss Turning). Nao traduza hashtags (deixe como estao).",
      },
      { role: "user", content: text },
    ],
  });

  const out = resp.output_text?.trim();
  if (!out) throw new Error("OpenAI: empty translation");
  return out;
}

async function run() {
  const env = readEnvFile();
  if (!env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY in .env");
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase creds in .env");

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: posts, error } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  let updated = 0;

  for (const post of posts) {
    const patch = {};
    const slides = normalizeSlides(post.slides);
    const nextSlides = slides.map((s) => ({ ...s }));

    // Translate top-level fields if they look English
    for (const key of ["topic", "caption", "target_audience", "pain_point", "desired_outcome", "cta_action"]) {
      const v = post[key];
      if (looksEnglish(v)) {
        patch[key] = await translate(openai, v);
      }
    }

    // Translate slides
    let slideChanged = false;
    for (let i = 0; i < nextSlides.length; i++) {
      const s = nextSlides[i];
      if (looksEnglish(s?.headline)) {
        s.headline = await translate(openai, s.headline);
        slideChanged = true;
      }
      if (looksEnglish(s?.body)) {
        s.body = await translate(openai, s.body);
        slideChanged = true;
      }
    }
    if (slideChanged) patch.slides = nextSlides;

    if (Object.keys(patch).length === 0) continue;

    const meta = post.generation_metadata && typeof post.generation_metadata === "object" ? { ...post.generation_metadata } : {};
    meta.translated_to_ptbr_at = new Date().toISOString();
    patch.generation_metadata = meta;

    const { error: upErr } = await supabase.from("instagram_posts").update(patch).eq("id", post.id);
    if (upErr) throw new Error(`Update failed (${post.id}): ${upErr.message}`);
    updated++;
  }

  console.log(`OK: translated ${updated} instagram_posts fields to PT-BR (heuristic-based)`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

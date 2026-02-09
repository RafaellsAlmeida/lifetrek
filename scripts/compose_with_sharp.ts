/**
 * Compose text overlay on carousel images using Sharp
 * Usage: deno run --allow-all scripts/compose_with_sharp.ts <carousel_id>
 *
 * Improved version with:
 * - Larger, more readable fonts (60-64px headlines, 28px body)
 * - Better text wrapping
 * - Larger card with more padding
 * - More prominent CTA button
 */
import sharp from "npm:sharp@0.33.5";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

await load({ export: true });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BRAND = { blue: "#004F8F", dark: "#0A1628", green: "#1A7A3E", orange: "#F07818" };

interface Slide { headline: string; body: string; type: string; imageUrl?: string; image_url?: string; }

// Word wrap function for SVG text
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function svg(s: Slide, n: number, t: number, w: number, h: number): string {
  const esc = (x: string) => x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const isLast = n === t;

  // Larger fonts for better readability on LinkedIn
  const headlineFontSize = s.headline.length > 35 ? 52 : 64;
  const bodyFontSize = 28;
  const lineHeight = 40;

  // Wrap headline (max 22-28 chars per line for large font)
  const headlineLines = wrapText(s.headline, s.headline.length > 35 ? 28 : 22);
  const bodyLines = wrapText(s.body, 42);

  // Calculate card height based on content
  const headlineHeight = headlineLines.length * (headlineFontSize + 12);
  const bodyHeight = Math.min(bodyLines.length, 5) * lineHeight;
  const ctaHeight = isLast ? 90 : 0;
  const padding = 100;
  const cardHeight = headlineHeight + bodyHeight + ctaHeight + padding;

  // Position card in lower-middle area (not at very bottom)
  const cardY = h - cardHeight - 100;
  const gradientHeight = cardHeight + 300;

  // Build headline text elements
  let headlineY = cardY + 70;
  const headlineElements = headlineLines.map((line, i) => {
    const y = headlineY + i * (headlineFontSize + 12);
    return `<text x="80" y="${y}" font-family="Arial, sans-serif" font-size="${headlineFontSize}" font-weight="bold" fill="white">${esc(line)}</text>`;
  }).join('\n');

  // Build body text elements (max 5 lines)
  const bodyStartY = headlineY + headlineLines.length * (headlineFontSize + 12) + 25;
  const bodyElements = bodyLines.slice(0, 5).map((line, i) => {
    const y = bodyStartY + i * lineHeight;
    return `<text x="80" y="${y}" font-family="Arial, sans-serif" font-size="${bodyFontSize}" fill="rgba(255,255,255,0.92)">${esc(line)}</text>`;
  }).join('\n');

  // CTA button for last slide
  const ctaY = bodyStartY + Math.min(bodyLines.length, 5) * lineHeight + 30;
  const ctaElement = isLast ? `
<rect x="80" y="${ctaY}" width="420" height="65" rx="14" fill="${BRAND.orange}"/>
<text x="290" y="${ctaY + 44}" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">Acesse o Guia Completo →</text>` : '';

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="g1" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="rgb(10,22,40)" stop-opacity="0"/>
    <stop offset="35%" stop-color="rgb(10,22,40)" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="rgb(10,22,40)" stop-opacity="0.95"/>
  </linearGradient>
  <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="${BRAND.blue}"/>
    <stop offset="100%" stop-color="${BRAND.green}"/>
  </linearGradient>
</defs>

<!-- Dark gradient overlay -->
<rect x="0" y="${h - gradientHeight}" width="${w}" height="${gradientHeight}" fill="url(#g1)"/>

<!-- Slide number badge (larger) -->
<rect x="40" y="40" width="100" height="52" rx="26" fill="${BRAND.blue}"/>
<text x="90" y="76" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${n}/${t}</text>

<!-- Content card with rounded corners -->
<rect x="40" y="${cardY}" width="${w - 80}" height="${cardHeight}" rx="28" fill="rgba(0,79,143,0.92)"/>

<!-- Headline -->
${headlineElements}

<!-- Body text -->
${bodyElements}

<!-- CTA button (last slide only) -->
${ctaElement}

<!-- Brand gradient line at bottom -->
<rect x="0" y="${h - 10}" width="${w}" height="10" fill="url(#g2)"/>
</svg>`;
}

async function proc(s: Slide, i: number, t: number, cid: string): Promise<string|null> {
  const url = s.imageUrl || s.image_url;
  if (!url) return null;
  console.log(`\n[${i+1}/${t}] ${s.headline.slice(0,40)}`);
  const res = await fetch(url);
  if (!res.ok) { console.error("Fetch failed"); return null; }
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const w = meta.width || 1080, h = meta.height || 1350;
  const overlay = Buffer.from(svg(s, i+1, t, w, h));
  const out = await sharp(buf).composite([{input: overlay, top: 0, left: 0}]).png().toBuffer();
  const fn = `final-${cid.slice(0,8)}-s${i+1}-${Date.now()}.png`;
  const { error } = await supabase.storage.from("carousel-images").upload(fn, out, { contentType: "image/png", upsert: true });
  if (error) { console.error("Upload failed:", error); return null; }
  const { data } = supabase.storage.from("carousel-images").getPublicUrl(fn);
  console.log(`✅ ${fn}`);
  return data.publicUrl;
}

const cid = Deno.args[0];
if (!cid) { console.error("Usage: deno run --allow-all scripts/compose_with_sharp.ts <carousel_id>"); Deno.exit(1); }
const { data: c } = await supabase.from("linkedin_carousels").select("*").eq("id", cid).single();
if (!c) { console.error("Not found"); Deno.exit(1); }
const slides: Slide[] = c.slides || [];
console.log(`Found ${slides.length} slides`);
const urls: string[] = [];
for (let i = 0; i < slides.length; i++) {
  const u = await proc(slides[i], i, slides.length, cid);
  urls.push(u || slides[i].imageUrl || slides[i].image_url || "");
  if (u) { slides[i].imageUrl = u; slides[i].image_url = u; }
}
await supabase.from("linkedin_carousels").update({ slides, image_urls: urls }).eq("id", cid);
console.log("\n✅ Done!");
urls.forEach((u,i) => console.log(`${i+1}. ${u.slice(-50)}`));

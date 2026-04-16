/**
 * Generate a single-image LinkedIn overlay (1080x1350) using Satori + Resvg.
 *
 * Usage:
 * deno run --allow-all scripts/generate_linkedin_single_overlay.ts
 * deno run --allow-all scripts/generate_linkedin_single_overlay.ts --bg /path/to/image.png --out output/my-post.png
 */

import satori from "npm:satori@0.10.11";
import { Resvg } from "npm:@resvg/resvg-js@2.6.2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const W = 1080;
const H = 1350;

const BRAND = {
  primaryBlue: "#004F8F",
  green: "#1A7A3E",
  orange: "#F07818",
  white: "#FFFFFF",
  logoUrl:
    "https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/logo.png",
};

const DEFAULT_BG =
  "/Users/rafaelalmeida/.cursor/projects/Users-rafaelalmeida-lifetrek/assets/image-6959e0fa-b3c5-4133-ba77-eb77ae5df400.png";
const DEFAULT_OUT =
  "output/linkedin_validacao_dimensional_single_olympus_v1.png";

type SatoriNode = Record<string, unknown>;

function parseArgs() {
  let bgPath = DEFAULT_BG;
  let outPath = DEFAULT_OUT;

  for (let i = 0; i < Deno.args.length; i++) {
    const arg = Deno.args[i];
    if (arg === "--bg") bgPath = Deno.args[++i] ?? bgPath;
    if (arg === "--out") outPath = Deno.args[++i] ?? outPath;
  }

  return { bgPath, outPath };
}

async function loadFonts() {
  const fontBold = await fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
  ).then((r) => r.arrayBuffer());
  const fontRegular = await fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
  ).then((r) => r.arrayBuffer());
  return { fontBold, fontRegular };
}

async function imageDataUrl(path: string): Promise<string> {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load URL image: ${path}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${encodeBase64(buf)}`;
  }

  const bytes = await Deno.readFile(path);
  const ext = path.split(".").pop()?.toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg"
    ? "image/jpeg"
    : ext === "webp"
    ? "image/webp"
    : "image/png";
  return `data:${mime};base64,${encodeBase64(bytes)}`;
}

async function logoDataUrl(): Promise<string | null> {
  try {
    return await imageDataUrl("tmp/instagram-this-or-that/logo-nobg-rembg.png");
  } catch {
    try {
      return await imageDataUrl(BRAND.logoUrl);
    } catch {
      return null;
    }
  }
}

function logoCorner(logoData: string | null): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        top: "36px",
        right: "36px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "10px",
      },
      children: [
        logoData
          ? {
            type: "img",
            props: {
              src: logoData,
              style: { height: "48px", objectFit: "contain" },
            },
          }
          : {
            type: "span",
            props: {
              style: {
                color: BRAND.white,
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.02em",
              },
              children: "LIFETREK MEDICAL",
            },
          },
        {
          type: "div",
          props: {
            style: {
              width: "150px",
              height: "2px",
              backgroundColor: "rgba(255,255,255,0.9)",
            },
          },
        },
      ],
    },
  };
}

function buildNode(bgData: string, logoData: string | null): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        width: `${W}px`,
        height: `${H}px`,
        display: "flex",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter",
      },
      children: [
        {
          type: "img",
          props: {
            src: bgData,
            style: {
              position: "absolute",
              left: "0",
              top: "0",
              width: `${W}px`,
              height: `${H}px`,
              objectFit: "cover",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              inset: "0",
              background:
                "linear-gradient(180deg, rgba(0,30,70,0.32) 0%, rgba(0,30,70,0.76) 58%, rgba(0,30,70,0.88) 100%)",
            },
          },
        },
        logoCorner(logoData),
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              left: "64px",
              right: "64px",
              bottom: "160px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.green,
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  },
                  children: "Qualidade e Metrologia",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.white,
                    fontSize: "76px",
                    fontWeight: 700,
                    lineHeight: "1.04",
                    maxWidth: "920px",
                  },
                  children: "5 erros de validacao dimensional",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.white,
                    fontSize: "44px",
                    fontWeight: 400,
                    lineHeight: "1.15",
                    maxWidth: "900px",
                  },
                  children: "que geram retrabalho invisivel",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              left: "0",
              bottom: "0",
              width: `${W}px`,
              height: "8px",
              background:
                `linear-gradient(90deg, ${BRAND.primaryBlue} 0%, ${BRAND.orange} 58%, ${BRAND.green} 100%)`,
            },
          },
        },
      ],
    },
  };
}

async function renderPng(
  node: SatoriNode,
  fonts: { fontBold: ArrayBuffer; fontRegular: ArrayBuffer },
): Promise<Uint8Array> {
  const svg = await satori(node as never, {
    width: W,
    height: H,
    fonts: [
      { name: "Inter", data: fonts.fontBold, weight: 700, style: "normal" },
      { name: "Inter", data: fonts.fontRegular, weight: 400, style: "normal" },
    ],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: W } });
  return resvg.render().asPng();
}

async function ensureOutputParent(outPath: string) {
  const parts = outPath.split("/");
  if (parts.length <= 1) return;
  const parent = parts.slice(0, -1).join("/");
  await Deno.mkdir(parent, { recursive: true });
}

async function main() {
  const { bgPath, outPath } = parseArgs();
  console.log(`Background: ${bgPath}`);
  console.log(`Output: ${outPath}`);

  const bgData = await imageDataUrl(bgPath);
  const logoData = await logoDataUrl();
  const fonts = await loadFonts();

  const node = buildNode(bgData, logoData);
  const png = await renderPng(node, fonts);

  await ensureOutputParent(outPath);
  await Deno.writeFile(outPath, png);
  console.log(`✅ Rendered ${outPath} (${Math.round(png.length / 1024)} KB)`);
}

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});

/**
 * Gera carrossel estilo "Este ou Aquele" (6 slides) com marca Lifetrek — Satori + Resvg.
 *
 * Uso:
 *   deno run --allow-all scripts/generate_instagram_this_or_that_carousel.ts
 *   deno run --allow-all scripts/generate_instagram_this_or_that_carousel.ts --out tmp/me-carrossel
 *   deno run --allow-all scripts/generate_instagram_this_or_that_carousel.ts --pin-img ./pin.png --screw-img ./parafuso.png
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
  lightSurface: "#E8EEF4",
  white: "#FFFFFF",
  text: "#0A0A0A",
  muted: "#525252",
  logoUrl: "https://dlflpvmdzkeouhgqwqba.supabase.co/storage/v1/object/public/assets/logo.png",
};

const DEFAULT_PRODUCTS = {
  pin: "tmp/instagram-this-or-that/pin-nobg-rembg.png",
  screw: "tmp/instagram-this-or-that/new-screw-nobg.png",
};

type SatoriNode = Record<string, unknown>;

function parseArgs() {
  const args = Deno.args;
  let outDir = "tmp/instagram-this-or-that";
  let pinImg: string | undefined;
  let screwImg: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out") outDir = args[++i] ?? outDir;
    else if (args[i] === "--pin-img") pinImg = args[++i];
    else if (args[i] === "--screw-img") screwImg = args[++i];
  }
  return { outDir, pinImg, screwImg };
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

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(BRAND.logoUrl);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return `data:image/png;base64,${encodeBase64(new Uint8Array(buf))}`;
  } catch {
    return null;
  }
}

async function optionalImageDataUrl(path: string | undefined): Promise<string | null> {
  if (!path) return null;
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const res = await fetch(path);
      if (!res.ok) return null;
      const buf = new Uint8Array(await res.arrayBuffer());
      const mime = res.headers.get("content-type") || "image/png";
      return `data:${mime};base64,${encodeBase64(buf)}`;
    }
    const bytes = await Deno.readFile(path);
    const ext = path.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png" ? "image/png"
        : ext === "jpg" || ext === "jpeg" ? "image/jpeg"
        : ext === "webp" ? "image/webp"
        : "image/png";
    return `data:${mime};base64,${encodeBase64(bytes)}`;
  } catch (e) {
    console.warn(`⚠️ Não leu imagem ${path}:`, e);
    return null;
  }
}

function logoCorner(logoData: string | null, opts: { inverted?: boolean } = {}): SatoriNode {
  const { inverted } = opts;
  const children = logoData
    ? [{ type: "img", props: { src: logoData, style: { height: "52px", objectFit: "contain" as const } } }]
    : [{
      type: "span",
      props: {
        style: {
          color: inverted ? BRAND.white : BRAND.primaryBlue,
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "0.02em",
        },
        children: "LIFETREK MEDICAL",
      },
    }];
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        top: "40px",
        right: "40px",
        display: "flex",
        alignItems: "center",
        padding: inverted ? "8px 14px" : "0",
        backgroundColor: inverted ? "rgba(255,255,255,0.12)" : "transparent",
        borderRadius: inverted ? "12px" : "0",
      },
      children,
    },
  };
}

function brandBarBottom(): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: `${W}px`,
        height: "6px",
        background: `linear-gradient(90deg, ${BRAND.primaryBlue} 0%, ${BRAND.orange} 55%, ${BRAND.green} 100%)`,
      },
    },
  };
}

function circle(
  size: number,
  bg: string,
  inner: SatoriNode[],
): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${size / 2}px`,
        backgroundColor: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      },
      children: inner,
    },
  };
}

function carouselUiOverlay(
  activeDot: number,
  total = 5,
  arrowColor: string = BRAND.orange,
): SatoriNode {
  const dots = Array.from({ length: total }).map((_, i) => ({
    type: "div",
    props: {
      style: {
        width: "10px",
        height: "10px",
        borderRadius: "5px",
        backgroundColor: i === activeDot ? BRAND.white : "rgba(255,255,255,0.55)",
      },
    },
  }));

  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        left: "0",
        top: "0",
        width: `${W}px`,
        height: `${H}px`,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "52px",
              height: "52px",
              borderRadius: "26px",
              backgroundColor: "rgba(255,255,255,0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#BDBDBD",
              fontSize: "30px",
              fontWeight: 700,
            },
            children: "‹",
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "52px",
              height: "52px",
              borderRadius: "26px",
              backgroundColor: "rgba(255,255,255,0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: arrowColor,
              fontSize: "32px",
              fontWeight: 700,
            },
            children: "›",
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "60px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "8px",
            },
            children: dots,
          },
        },
      ],
    },
  };
}

function slide01(
  pinData: string | null,
  screwData: string | null,
  logoData: string | null,
): SatoriNode {
  const half = H / 2;

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: `${W}px`,
        height: `${H}px`,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: BRAND.white,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              width: `${W}px`,
              height: `${half}px`,
              background: `radial-gradient(circle at 50% 90%, rgba(26,122,62,0.25) 0%, ${BRAND.lightSurface} 55%)`,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "0",
              left: "0",
              width: `${W}px`,
              height: `${half}px`,
              background: `linear-gradient(180deg, ${BRAND.primaryBlue} 0%, #003B6B 100%)`,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "54px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "24px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    position: "relative",
                    width: "470px",
                    height: "470px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          position: "absolute",
                          width: "470px",
                          height: "470px",
                          borderRadius: "235px",
                          backgroundColor: BRAND.primaryBlue,
                        },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          position: "absolute",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "14px",
                          zIndex: 10,
                        },
                        children: [
                          pinData
                            ? {
                              type: "img",
                              props: {
                                src: pinData,
                                style: { width: "420px", height: "420px", objectFit: "contain", marginTop: "-60px" },
                              },
                            }
                            : {
                              type: "span",
                              props: {
                                style: { color: BRAND.white, fontSize: "30px", fontWeight: 700 },
                                children: "Produto A",
                              },
                            },
                          {
                            type: "span",
                            props: {
                              style: { color: BRAND.white, fontSize: "52px", fontWeight: 700, marginTop: "-40px" },
                              children: "ESTE",
                            },
                          },
                          {
                            type: "span",
                            props: { style: { color: BRAND.white, fontSize: "40px", fontWeight: 700 }, children: "Pinos" },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    marginTop: "-42px",
                    marginBottom: "-42px",
                    width: "120px",
                    height: "120px",
                    borderRadius: "60px",
                    backgroundColor: BRAND.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { fontSize: "44px", fontWeight: 700, color: BRAND.primaryBlue, lineHeight: "1" },
                        children: "ou",
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    position: "relative",
                    width: "470px",
                    height: "470px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          position: "absolute",
                          width: "470px",
                          height: "470px",
                          borderRadius: "235px",
                          backgroundColor: BRAND.lightSurface,
                        },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          position: "absolute",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "14px",
                          zIndex: 10,
                        },
                        children: [
                          {
                            type: "span",
                            props: { style: { color: BRAND.primaryBlue, fontSize: "52px", fontWeight: 700, marginBottom: "-20px" }, children: "AQUELE?" },
                          },
                          screwData
                            ? {
                              type: "img",
                              props: {
                                src: screwData,
                                style: { width: "420px", height: "420px", objectFit: "contain", marginBottom: "-20px" },
                              },
                            }
                            : {
                              type: "span",
                              props: {
                                style: { color: BRAND.primaryBlue, fontSize: "30px", fontWeight: 700 },
                                children: "Produto B",
                              },
                            },
                          {
                            type: "span",
                            props: { style: { color: BRAND.primaryBlue, fontSize: "40px", fontWeight: 700 }, children: "Parafusos" },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        logoCorner(logoData),
        brandBarBottom(),
      ],
    },
  };
}

function slide02(logoData: string | null): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: `${W}px`,
        height: `${H}px`,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: BRAND.white,
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
      },
      children: [
        logoCorner(logoData),
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "60px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.primaryBlue,
                    fontSize: "72px",
                    fontWeight: 800,
                    lineHeight: "1.1",
                  },
                  children: "Fixar membranas com PINOS ou PARAFUSOS?",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.green,
                    fontSize: "40px",
                    fontWeight: 600,
                    lineHeight: "1.3",
                    padding: "40px 50px",
                    backgroundColor: BRAND.lightSurface,
                    borderRadius: "24px",
                  },
                  children: "3 decisões de engenharia influenciam o desempenho clínico e o custo do kit.",
                },
              },
            ],
          },
        },
        brandBarBottom(),
      ],
    },
  };
}

function slide03_pinos(pinData: string | null, logoData: string | null): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: `${W}px`,
        height: `${H}px`,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: BRAND.white,
      },
      children: [
        logoCorner(logoData),
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              width: `${W}px`,
              height: `${H / 2}px`,
              backgroundColor: BRAND.lightSurface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            },
            children: [
              pinData
                ? {
                  type: "img",
                  props: {
                    src: pinData,
                    style: { width: "700px", height: "700px", objectFit: "contain" },
                  },
                }
                : { type: "span", props: { children: "Pino" } },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "0",
              left: "0",
              width: `${W}px`,
              height: `${H / 2}px`,
              backgroundColor: BRAND.primaryBlue,
              display: "flex",
              flexDirection: "column",
              padding: "80px",
              paddingTop: "100px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.white,
                    fontSize: "52px",
                    fontWeight: 700,
                    lineHeight: "1.1",
                    marginBottom: "40px",
                  },
                  children: "Quando PINOS fazem mais sentido",
                },
              },
              ...[
                "Menor perfil e abordagem menos invasiva em certos cenários.",
                "Diâmetros muito pequenos exigem controle dimensional rigoroso.",
                "Boa escolha quando a prioridade é mínimo volume de metal.",
              ].map((b) => ({
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    gap: "18px",
                    marginBottom: "24px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { color: BRAND.green, fontSize: "34px", fontWeight: 700, flexShrink: 0 },
                        children: "✓",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { color: BRAND.white, fontSize: "32px", fontWeight: 400, lineHeight: "1.4" },
                        children: b,
                      },
                    },
                  ],
                },
              })),
            ],
          },
        },
        brandBarBottom(),
      ],
    },
  };
}

function slide04_parafusos(screwData: string | null, logoData: string | null): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: `${W}px`,
        height: `${H}px`,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: BRAND.white,
      },
      children: [
        logoCorner(logoData),
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              width: `${W}px`,
              height: `${H / 2}px`,
              backgroundColor: BRAND.lightSurface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            },
            children: [
              screwData
                ? {
                  type: "img",
                  props: {
                    src: screwData,
                    style: { width: "700px", height: "700px", objectFit: "contain" },
                  },
                }
                : { type: "span", props: { children: "Parafuso" } },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "0",
              left: "0",
              width: `${W}px`,
              height: `${H / 2}px`,
              backgroundColor: BRAND.white,
              display: "flex",
              flexDirection: "column",
              padding: "80px",
              paddingTop: "100px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.primaryBlue,
                    fontSize: "52px",
                    fontWeight: 700,
                    lineHeight: "1.1",
                    marginBottom: "40px",
                  },
                  children: "Quando PARAFUSOS vencem",
                },
              },
              ...[
                "Maior estabilidade inicial em determinados enxertos.",
                "Facilidade de remoção e ajuste/reaperto no procedimento.",
                "Podem reduzir mobilização da membrana em osso de pior qualidade.",
              ].map((b) => ({
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    gap: "18px",
                    marginBottom: "24px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { color: BRAND.orange, fontSize: "34px", fontWeight: 700, flexShrink: 0 },
                        children: "✓",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { color: BRAND.text, fontSize: "32px", fontWeight: 400, lineHeight: "1.4" },
                        children: b,
                      },
                    },
                  ],
                },
              })),
            ],
          },
        },
        brandBarBottom(),
      ],
    },
  };
}

function finalValueSlide(logoData: string | null, bgData: string | null): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: `${W}px`,
        height: `${H}px`,
        position: "relative",
        fontFamily: "Inter",
        backgroundColor: BRAND.white,
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              width: `${W}px`,
              height: "450px",
              display: "flex",
            },
            children: [
              bgData ? {
                type: "img",
                props: {
                  src: bgData,
                  style: { width: "100%", height: "100%", objectFit: "cover" },
                }
              } : { type: "div" }
            ]
          }
        },
        logoCorner(logoData, { inverted: true }),
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "450px",
              left: "0",
              width: `${W}px`,
              height: `${H - 450}px`,
              padding: "20px 72px",
              display: "flex",
              flexDirection: "column",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.primaryBlue,
                    fontSize: "56px",
                    fontWeight: 800,
                    lineHeight: "1.1",
                    marginBottom: "24px",
                  },
                  children: "Onde entra a Lifetrek",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.text,
                    fontSize: "32px",
                    fontWeight: 600,
                    lineHeight: "1.3",
                    marginBottom: "32px",
                  },
                  children: "Pinos e parafusos de precisão para kits de regeneração óssea com foco em desempenho e consistência de lote.",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  },
                  children: [
                    "• Torneamento suíço para diâmetros finos e geometrias complexas.",
                    "• Controle de rugosidade e dimensões para contato com tecido.",
                    "• Rastreabilidade e documentação alinhadas à ISO 13485 e ANVISA.",
                  ].map((line) => ({
                    type: "div",
                    props: {
                      style: {
                        color: BRAND.text,
                        fontSize: "28px",
                        fontWeight: 500,
                        lineHeight: "1.3",
                      },
                      children: line,
                    },
                  })),
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    marginTop: "auto",
                    marginBottom: "40px",
                    background: `linear-gradient(90deg, ${BRAND.primaryBlue} 0%, ${BRAND.orange} 55%, ${BRAND.green} 100%)`,
                    color: BRAND.white,
                    borderRadius: "16px",
                    padding: "24px 32px",
                    fontSize: "28px",
                    fontWeight: 700,
                    textAlign: "center",
                  },
                  children: "Seu time de P&D escolhe o melhor conceito clínico. A manufatura acompanha.",
                },
              },
            ],
          },
        },
        brandBarBottom(),
      ],
    },
  };
}

async function renderPng(
  node: SatoriNode,
  fonts: { fontBold: ArrayBuffer; fontRegular: ArrayBuffer },
): Promise<Uint8Array> {
  const svg = await satori(node as any, {
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

async function main() {
  const { outDir, pinImg, screwImg } = parseArgs();
  console.log("Carregando fontes Inter…");
  const fonts = await loadFonts();
  const logoData = await optionalImageDataUrl("tmp/instagram-this-or-that/logo-nobg-rembg.png") || await loadLogoDataUrl();
  const pinData = await optionalImageDataUrl(pinImg ?? DEFAULT_PRODUCTS.pin);
  const screwData = await optionalImageDataUrl(screwImg ?? DEFAULT_PRODUCTS.screw);
  const slide5ImgPath = "/Users/rafaelalmeida/.cursor/projects/Users-rafaelalmeida-lifetrek/assets/lifetrek_parafusos-65f4e18b-8a4d-4c48-919e-00c20e4af945.png";
  const slide5Data = await optionalImageDataUrl(slide5ImgPath);

  await Deno.mkdir(outDir, { recursive: true });

  const slides: { name: string; node: SatoriNode }[] = [
    { name: "01-este-ou-aquele", node: slide01(pinData, screwData, logoData) },
    { name: "02-pergunta", node: slide02(logoData) },
    {
      name: "03-quando-pinos",
      node: slide03_pinos(pinData, logoData),
    },
    {
      name: "04-quando-parafusos",
      node: slide04_parafusos(screwData, logoData),
    },
    { name: "05-onde-entra-lifetrek", node: finalValueSlide(logoData, slide5Data) },
  ];

  for (const { name, node } of slides) {
    const path = `${outDir}/${name}.png`;
    console.log(`Renderizando ${path}…`);
    const png = await renderPng(node, fonts);
    await Deno.writeFile(path, png);
    console.log(`  OK (${Math.round(png.length / 1024)} KB)`);
  }

  const caption = `Em regeneração óssea guiada, a escolha entre pinos ou parafusos para fixar membranas não é detalhe de catálogo; é decisão de engenharia que impacta tempo cirúrgico, estabilidade do enxerto e aceitação do kit pelo cirurgião.

Pinos oferecem perfil baixo e mínima quantidade de metal, mas exigem controle rigoroso em diâmetros muito pequenos.
Parafusos trazem maior estabilidade inicial e podem facilitar remoção/ajuste, ao custo de geometrias mais complexas e roscas críticas.

Na Lifetrek Medical, produzimos ambos em torneamento suíço, com foco em:
• controle dimensional em diâmetros finos,
• roscas e superfícies adequadas a contato com tecido,
• rastreabilidade e documentação alinhadas à ISO 13485 e ANVISA.

Assim, seu time de P&D ganha liberdade para escolher o melhor conceito clínico, sem abrir mão de precisão e consistência na manufatura.`;
  await Deno.writeTextFile(`${outDir}/caption-linkedin-ptbr.txt`, caption);

  console.log(`\n✅ ${slides.length} slides em: ${outDir}/`);
}

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});

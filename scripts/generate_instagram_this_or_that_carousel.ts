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
    ? [{ type: "img", props: { src: logoData, style: { height: "32px", objectFit: "contain" as const } } }]
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
        background: `linear-gradient(90deg, ${BRAND.primaryBlue} 0%, ${BRAND.green} 100%)`,
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

function slide01(
  pinData: string | null,
  screwData: string | null,
  logoData: string | null,
): SatoriNode {
  const half = H / 2;
  const imgBox = (data: string | null, fallbackLabel: string): SatoriNode[] => {
    if (data) {
      return [{
        type: "img",
        props: {
          src: data,
          style: { width: "220px", height: "220px", objectFit: "contain" as const },
        },
      }];
    }
    return [{
      type: "span",
      props: {
        style: { fontSize: "22px", fontWeight: 700, opacity: 0.85 },
        children: fallbackLabel,
      },
    }];
  };

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
              height: `${half}px`,
              backgroundColor: BRAND.lightSurface,
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
              backgroundColor: BRAND.primaryBlue,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "120px",
              left: "0",
              width: `${W}px`,
              height: `${H - 240}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "28px",
                  },
                  children: [
                    circle(340, BRAND.primaryBlue, [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                          },
                          children: [
                            {
                              type: "span",
                              props: {
                                style: {
                                  color: BRAND.white,
                                  fontSize: "56px",
                                  fontWeight: 700,
                                  lineHeight: "1",
                                },
                                children: "ESTE",
                              },
                            },
                            ...imgBox(pinData, "Pinos"),
                          ],
                        },
                      },
                    ]),
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "26px",
                          fontWeight: 700,
                          color: BRAND.primaryBlue,
                          backgroundColor: BRAND.white,
                          padding: "10px 18px",
                          borderRadius: "999px",
                        },
                        children: "ou",
                      },
                    },
                    circle(340, BRAND.lightSurface, [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                          },
                          children: [
                            {
                              type: "span",
                              props: {
                                style: {
                                  color: BRAND.primaryBlue,
                                  fontSize: "44px",
                                  fontWeight: 700,
                                  lineHeight: "1.05",
                                  textAlign: "center",
                                },
                                children: "AQUELE?",
                              },
                            },
                            ...imgBox(screwData, "Parafusos"),
                          ],
                        },
                      },
                    ]),
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    gap: "120px",
                    marginTop: "16px",
                    justifyContent: "center",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { fontSize: "24px", fontWeight: 700, color: BRAND.primaryBlue },
                        children: "Pinos",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { fontSize: "24px", fontWeight: 700, color: BRAND.white },
                        children: "Parafusos",
                      },
                    },
                  ],
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
              justifyContent: "center",
              height: "100%",
              padding: "80px",
              gap: "36px",
            },
            children: [
              circle(300, BRAND.primaryBlue, [{
                type: "span",
                props: {
                  style: { color: BRAND.white, fontSize: "36px", fontWeight: 700 },
                  children: "Pinos",
                },
              }]),
              {
                type: "div",
                props: {
                  style: {
                    textAlign: "center",
                    color: BRAND.text,
                    fontSize: "38px",
                    fontWeight: 700,
                    lineHeight: "1.25",
                    maxWidth: "900px",
                  },
                  children:
                    "O seu projeto pede pino de precisão ou parafuso com rosca complexa?",
                },
              },
              circle(300, BRAND.lightSurface, [{
                type: "span",
                props: {
                  style: { color: BRAND.primaryBlue, fontSize: "36px", fontWeight: 700 },
                  children: "Parafusos",
                },
              }]),
            ],
          },
        },
        brandBarBottom(),
      ],
    },
  };
}

function slide03(logoData: string | null): SatoriNode {
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
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "72px",
              gap: "40px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "520px",
                    height: "520px",
                    borderRadius: "260px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          flex: 1,
                          backgroundColor: BRAND.primaryBlue,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        },
                        children: [{
                          type: "span",
                          props: {
                            style: { color: BRAND.white, fontSize: "64px", fontWeight: 700 },
                            children: "ISSO",
                          },
                        }],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          flex: 1,
                          backgroundColor: BRAND.lightSurface,
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        },
                        children: [
                          {
                            type: "span",
                            props: {
                              style: {
                                position: "absolute",
                                top: "-22px",
                                backgroundColor: BRAND.white,
                                color: BRAND.primaryBlue,
                                fontSize: "22px",
                                fontWeight: 700,
                                padding: "6px 16px",
                                borderRadius: "999px",
                              },
                              children: "e",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: { color: BRAND.primaryBlue, fontSize: "64px", fontWeight: 700 },
                              children: "AQUILO!",
                            },
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
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    fontSize: "36px",
                    fontWeight: 700,
                    color: BRAND.text,
                    lineHeight: "1.3",
                  },
                  children: [
                    {
                      type: "div",
                      props: { style: { marginBottom: "8px" }, children: "Com a Lifetrek Medical," },
                    },
                    {
                      type: "div",
                      props: { children: "você não precisa escolher um lado." },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: BRAND.green,
                    fontSize: "34px",
                    fontWeight: 700,
                  },
                  children: "Você pode ter os dois. →",
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

function bulletSlide(
  title: string,
  titleColor: string,
  bullets: string[],
  accent: "green" | "blue",
  productImg: string | null,
  logoData: string | null,
): SatoriNode {
  const check = accent === "green" ? BRAND.green : BRAND.primaryBlue;
  const bulletNodes: SatoriNode[] = bullets.map((b) => ({
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "row",
        gap: "14px",
        marginBottom: "18px",
        maxWidth: "620px",
      },
      children: [
        {
          type: "span",
          props: {
            style: { color: check, fontSize: "26px", fontWeight: 700, flexShrink: 0 },
            children: "✓",
          },
        },
        {
          type: "span",
          props: {
            style: { color: BRAND.text, fontSize: "24px", fontWeight: 400, lineHeight: "1.45" },
            children: b,
          },
        },
      ],
    },
  }));

  const productBlock: SatoriNode = productImg
    ? {
      type: "img",
      props: {
        src: productImg,
        style: {
          position: "absolute",
          right: "20px",
          bottom: "80px",
          width: "420px",
          height: "520px",
          objectFit: "contain" as const,
        },
      },
    }
    : {
      type: "div",
      props: {
        style: {
          position: "absolute",
          right: "60px",
          bottom: "120px",
          width: "320px",
          height: "400px",
          borderRadius: "24px",
          background: `linear-gradient(145deg, ${BRAND.lightSurface}, ${BRAND.white})`,
          border: `2px solid ${BRAND.primaryBlue}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: BRAND.muted,
          fontSize: "20px",
          fontWeight: 600,
          textAlign: "center",
          padding: "24px",
        },
        children: "Substitua por foto do produto (--pin-img / --screw-img)",
      },
    };

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
              display: "flex",
              flexDirection: "column",
              paddingTop: "100px",
              paddingLeft: "72px",
              paddingRight: "480px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: titleColor,
                    fontSize: "56px",
                    fontWeight: 700,
                    lineHeight: "1.1",
                    marginBottom: "36px",
                  },
                  children: title,
                },
              },
              ...bulletNodes,
            ],
          },
        },
        productBlock,
        brandBarBottom(),
      ],
    },
  };
}

function slide06(logoData: string | null): SatoriNode {
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
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "80px",
              gap: "32px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    color: BRAND.green,
                    fontSize: "48px",
                    fontWeight: 700,
                    lineHeight: "1.2",
                    maxWidth: "880px",
                    whiteSpace: "pre-line",
                  },
                  children: "Qual solução entra\nno seu roadmap primeiro?",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: BRAND.lightSurface,
                    padding: "22px 48px",
                    borderRadius: "8px",
                  },
                  children: [{
                    type: "span",
                    props: {
                      style: { color: BRAND.text, fontSize: "28px", fontWeight: 700 },
                      children: "Conte nos comentários.",
                    },
                  }],
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
  const logoData = await loadLogoDataUrl();
  const pinData = await optionalImageDataUrl(pinImg);
  const screwData = await optionalImageDataUrl(screwImg);

  await Deno.mkdir(outDir, { recursive: true });

  const slides: { name: string; node: SatoriNode }[] = [
    { name: "01-este-ou-aquele", node: slide01(pinData, screwData, logoData) },
    { name: "02-pergunta", node: slide02(logoData) },
    { name: "03-isso-e-aquilo", node: slide03(logoData) },
    {
      name: "04-pinos",
      node: bulletSlide(
        "Pinos de precisão",
        BRAND.primaryBlue,
        [
          "Geometrias exigentes em diâmetros pequenos, com controle dimensional rigoroso.",
          "Processos alinhados a rastreabilidade e consistência de lote.",
          "Ideal quando o desenho exige encaixe crítico e acabamento controlado.",
        ],
        "green",
        pinData,
        logoData,
      ),
    },
    {
      name: "05-parafusos",
      node: bulletSlide(
        "Parafusos de fixação",
        "#6B7280",
        [
          "Roscas e perfis desafiadores em torno suíço de alta rigidez.",
          "Inspeção com CMM integrada ao seu controle de qualidade.",
          "Da prototipagem à escala, com documentação para dispositivo médico.",
        ],
        "blue",
        screwData,
        logoData,
      ),
    },
    { name: "06-comentarios", node: slide06(logoData) },
  ];

  for (const { name, node } of slides) {
    const path = `${outDir}/${name}.png`;
    console.log(`Renderizando ${path}…`);
    const png = await renderPng(node, fonts);
    await Deno.writeFile(path, png);
    console.log(`  OK (${Math.round(png.length / 1024)} KB)`);
  }

  console.log(`\n✅ ${slides.length} slides em: ${outDir}/`);
}

main().catch((e) => {
  console.error(e);
  Deno.exit(1);
});

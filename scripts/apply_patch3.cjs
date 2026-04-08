const fs = require('fs');
let content = fs.readFileSync('scripts/generate_instagram_this_or_that_carousel.ts', 'utf8');

// Replace slide03 with slide03_pinos
const oldSlide03 = `function slide03(logoData: string | null): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: \`\$\{W\}px\`,
        height: \`\$\{H\}px\`,
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
                          background: \`linear-gradient(180deg, \$\{BRAND.primaryBlue\} 0%, \$\{BRAND.orange\} 100%)\`,
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
                    color: BRAND.orange,
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
}`;

const newSlide03 = `function slide03_pinos(pinData: string | null, logoData: string | null): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: \`\$\{W\}px\`,
        height: \`\$\{H\}px\`,
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
              width: \`\$\{W\}px\`,
              height: \`\$\{H / 2\}px\`,
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
              width: \`\$\{W\}px\`,
              height: \`\$\{H / 2\}px\`,
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
}`;

const oldBulletSlide = `function bulletSlide(
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
          background: \`linear-gradient(145deg, \$\{BRAND.lightSurface\}, \$\{BRAND.white\})\`,
          border: \`2px solid \$\{BRAND.primaryBlue\}\`,
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
        width: \`\$\{W\}px\`,
        height: \`\$\{H\}px\`,
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
}`;

const newSlide04 = `function slide04_parafusos(screwData: string | null, logoData: string | null): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: \`\$\{W\}px\`,
        height: \`\$\{H\}px\`,
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
              width: \`\$\{W\}px\`,
              height: \`\$\{H / 2\}px\`,
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
              width: \`\$\{W\}px\`,
              height: \`\$\{H / 2\}px\`,
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
}`;

content = content.replace(oldSlide03, newSlide03);
content = content.replace(oldBulletSlide, newSlide04);

fs.writeFileSync('scripts/generate_instagram_this_or_that_carousel.ts', content);

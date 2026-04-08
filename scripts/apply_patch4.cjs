const fs = require('fs');
let content = fs.readFileSync('scripts/generate_instagram_this_or_that_carousel.ts', 'utf8');

// The previous replace failed because of exact string match. Let's use regex or just append the functions and remove the old ones.

// 1. Append slide03_pinos and slide04_parafusos before finalValueSlide
const newFuncs = `
function slide03_pinos(pinData: string | null, logoData: string | null): SatoriNode {
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
}

function slide04_parafusos(screwData: string | null, logoData: string | null): SatoriNode {
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
}
`;

content = content.replace('function finalValueSlide', newFuncs + '\nfunction finalValueSlide');

fs.writeFileSync('scripts/generate_instagram_this_or_that_carousel.ts', content);

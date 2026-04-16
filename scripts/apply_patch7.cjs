const fs = require('fs');
let content = fs.readFileSync('scripts/generate_instagram_this_or_that_carousel.ts', 'utf8');

// 1. Fix slide01 image sizes (460px -> 260px)
content = content.replace(/width: "460px", height: "460px"/g, 'width: "260px", height: "260px"');

// 2. Replace slide02 completely
const oldSlide02Regex = /function slide02[\s\S]*?function slide03_pinos/;
const newSlide02 = `function slide02(logoData: string | null): SatoriNode {
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

function slide03_pinos`;
content = content.replace(oldSlide02Regex, newSlide02);

// 3. Replace finalValueSlide completely
const oldFinalValueSlideRegex = /function finalValueSlide[\s\S]*?async function renderPng/;
const newFinalValueSlide = `function finalValueSlide(logoData: string | null, bgData: string | null): SatoriNode {
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
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              width: \`\$\{W\}px\`,
              height: "550px",
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
              top: "550px",
              left: "0",
              width: \`\$\{W\}px\`,
              height: \`\$\{H - 550\}px\`,
              padding: "60px 72px",
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
                    background: \`linear-gradient(90deg, \$\{BRAND.primaryBlue\} 0%, \$\{BRAND.orange\} 55%, \$\{BRAND.green\} 100%)\`,
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

async function renderPng`;
content = content.replace(oldFinalValueSlideRegex, newFinalValueSlide);

// 4. Update main function to load the new image and pass it
content = content.replace(
  /const screwData = await optionalImageDataUrl\(screwImg \?\? DEFAULT_PRODUCTS\.screw\);/,
  `const screwData = await optionalImageDataUrl(screwImg ?? DEFAULT_PRODUCTS.screw);
  const slide5ImgPath = "/Users/rafaelalmeida/.cursor/projects/Users-rafaelalmeida-lifetrek/assets/lifetrek_parafusos-65f4e18b-8a4d-4c48-919e-00c20e4af945.png";
  const slide5Data = await optionalImageDataUrl(slide5ImgPath);`
);

content = content.replace(
  /\{ name: "05-onde-entra-lifetrek", node: finalValueSlide\(logoData\) \},/,
  `{ name: "05-onde-entra-lifetrek", node: finalValueSlide(logoData, slide5Data) },`
);

fs.writeFileSync('scripts/generate_instagram_this_or_that_carousel.ts', content);

const fs = require('fs');
let content = fs.readFileSync('scripts/generate_instagram_this_or_that_carousel.ts', 'utf8');

// 1. Update DEFAULT_PRODUCTS to use rembg outputs
content = content.replace(
  /const DEFAULT_PRODUCTS = \{[\s\S]*?\};/,
  `const DEFAULT_PRODUCTS = {
  pin: "tmp/instagram-this-or-that/pin-nobg-rembg.png",
  screw: "tmp/instagram-this-or-that/screw-nobg-rembg.png",
};`
);

// 2. Fix slide01 layout so images are bigger and overlap the circles
// We need to change how the circles and images are structured in slide01.
// Currently:
// circle(470, BRAND.primaryBlue, [ { type: "div", ... children: [ img, "ESTE", "Pinos" ] } ])
// We will replace the whole slide01 function.

const oldSlide01Regex = /function slide01[\s\S]*?function slide02/;
const newSlide01 = `function slide01(
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
              height: \`\$\{half\}px\`,
              background: \`radial-gradient(circle at 50% 90%, rgba(26,122,62,0.25) 0%, \$\{BRAND.lightSurface\} 55%)\`,
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
              width: \`\$\{W\}px\`,
              height: \`\$\{half\}px\`,
              background: \`linear-gradient(180deg, \$\{BRAND.primaryBlue\} 0%, #003B6B 100%)\`,
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

function slide02`;

content = content.replace(oldSlide01Regex, newSlide01);

// 3. In slide05, move content up 20%.
// Currently: padding: "60px 72px"
// Let's change the top spacing of the content block in finalValueSlide.
content = content.replace(/padding: "60px 72px",/g, 'padding: "20px 72px",');

// Also, the user said: "remova o background da logo tbm."
// So we should pass the rembg logo to the script.
// Let's update the main function to use logo-nobg-rembg.png if it exists.
content = content.replace(
  /const logoData = await loadLogoDataUrl\(\);/,
  `const logoData = await optionalImageDataUrl("tmp/instagram-this-or-that/logo-nobg-rembg.png") || await loadLogoDataUrl();`
);

fs.writeFileSync('scripts/generate_instagram_this_or_that_carousel.ts', content);

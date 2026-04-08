const fs = require('fs');
let content = fs.readFileSync('scripts/generate_instagram_this_or_that_carousel.ts', 'utf8');

// 1. Remove carouselUiOverlay from slide01
content = content.replace('carouselUiOverlay(0, 5, BRAND.orange),', '');

// 2. Increase image size in slide01
content = content.replace(/width: "230px", height: "230px"/g, 'width: "460px", height: "460px"');

// 3. Update slide02 gradients to green and adjust spacing
content = content.replace(/radial-gradient\(circle at 50% 90%, rgba\(240,120,24,0\.35\) 0%, \$\{BRAND\.primaryBlue\} 52%\)/g, 'radial-gradient(circle at 50% 90%, rgba(26,122,62,0.35) 0%, ${BRAND.primaryBlue} 52%)');
content = content.replace(/radial-gradient\(circle at 50% 10%, rgba\(240,120,24,0\.14\) 0%, \$\{BRAND\.lightSurface\} 62%\)/g, 'radial-gradient(circle at 50% 10%, rgba(26,122,62,0.14) 0%, ${BRAND.lightSurface} 62%)');
content = content.replace(/top: "650px",/g, 'top: "680px",');
content = content.replace(/top: "740px",/g, 'top: "770px",');

// 4. Update slide05 (finalValueSlide)
content = content.replace(/paddingTop: "120px",/g, 'justifyContent: "center", height: "100%",');
content = content.replace(/background: `linear-gradient\(90deg, \$\{BRAND\.orange\} 0%, \$\{BRAND\.primaryBlue\} 100%\)`,/g, 'background: `linear-gradient(90deg, ${BRAND.primaryBlue} 0%, ${BRAND.orange} 55%, ${BRAND.green} 100%)`,');
// Remove the top 16px gradient bar
content = content.replace(/\{\s*type: "div",\s*props: \{\s*style: \{\s*position: "absolute",\s*left: "0",\s*top: "0",\s*width: \`\$\{W\}px\`,\s*height: "16px",\s*background: `linear-gradient\(90deg, \$\{BRAND\.orange\} 0%, \$\{BRAND\.primaryBlue\} 55%, \$\{BRAND\.green\} 100%\)`,\s*\},\s*\},\s*\},/g, '');

fs.writeFileSync('scripts/generate_instagram_this_or_that_carousel.ts', content);

const fs = require('fs');
let content = fs.readFileSync('scripts/generate_instagram_this_or_that_carousel.ts', 'utf8');

// Replace slide 3 and 4 calls
const oldSlide3 = `      node: bulletSlide(
        "Quando PINOS fazem mais sentido",
        BRAND.primaryBlue,
        [
          "Menor perfil e abordagem menos invasiva em certos cenários.",
          "Diâmetros muito pequenos exigem controle dimensional rigoroso.",
          "Boa escolha quando a prioridade é mínimo volume de metal.",
        ],
        "green",
        pinData,
        logoData,
      ),`;
const newSlide3 = `      node: slide03_pinos(pinData, logoData),`;

const oldSlide4 = `      node: bulletSlide(
        "Quando PARAFUSOS vencem",
        "#6B7280",
        [
          "Maior estabilidade inicial em determinados enxertos.",
          "Facilidade de remoção e ajuste/reaperto no procedimento.",
          "Podem reduzir mobilização da membrana em osso de pior qualidade.",
        ],
        "blue",
        screwData,
        logoData,
      ),`;
const newSlide4 = `      node: slide04_parafusos(screwData, logoData),`;

content = content.replace(oldSlide3, newSlide3);
content = content.replace(oldSlide4, newSlide4);

fs.writeFileSync('scripts/generate_instagram_this_or_that_carousel.ts', content);

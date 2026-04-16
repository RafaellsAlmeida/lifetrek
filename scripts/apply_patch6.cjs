const fs = require('fs');
let content = fs.readFileSync('scripts/generate_instagram_this_or_that_carousel.ts', 'utf8');

// Update DEFAULT_PRODUCTS
content = content.replace(
  /const DEFAULT_PRODUCTS = \{[\s\S]*?\};/,
  `const DEFAULT_PRODUCTS = {
  pin: "tmp/instagram-this-or-that/pin-nobg.png",
  screw: "tmp/instagram-this-or-that/screw-nobg.png",
};`
);

fs.writeFileSync('scripts/generate_instagram_this_or_that_carousel.ts', content);

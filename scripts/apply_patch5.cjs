const fs = require('fs');
let content = fs.readFileSync('scripts/generate_instagram_this_or_that_carousel.ts', 'utf8');

// The previous patch failed because slide04_parafusos was already declared. Let's just remove the first declarations and keep the second ones.
// We can just use regex to remove the old ones.
content = content.replace(/function slide04_parafusos[\s\S]*?function slide03_pinos/m, 'function slide03_pinos');
content = content.replace(/function bulletSlide[\s\S]*?function slide03_pinos/m, 'function slide03_pinos');

fs.writeFileSync('scripts/generate_instagram_this_or_that_carousel.ts', content);

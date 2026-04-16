const fs = require('fs');
let content = fs.readFileSync('scripts/generate_instagram_this_or_that_carousel.ts', 'utf8');

// Fix the zIndex unit error
content = content.replace(/zIndex: "10px"/g, 'zIndex: 10');
content = content.replace(/zIndex: "20px"/g, 'zIndex: 20');

// In slide05, move content up even more (20% up). Currently it's top: 550px.
// Let's make the image height 450px and the content top 450px.
content = content.replace(/height: "550px",/g, 'height: "450px",');
content = content.replace(/top: "550px",/g, 'top: "450px",');
content = content.replace(/height: \`\$\{H - 550\}px\`,/g, 'height: `${H - 450}px`,');

fs.writeFileSync('scripts/generate_instagram_this_or_that_carousel.ts', content);

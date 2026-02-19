
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://dlflpvmdzkeouhgqwqba.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmxwdm1kemtlb3VoZ3F3cWJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcyNzYwOSwiZXhwIjoyMDgzMzAzNjA5fQ.QT2RDwGP92JhDFb3fGRgMuViKW-AioTIu44x_g0hw5o";

const ASSETS_PATH = "/Users/rafaelalmeida/lifetrek/tmp/assets";
const LOGO_SRC = `file://${ASSETS_PATH}/logo.png`;
const ISO_SRC = `file://${ASSETS_PATH}/iso.jpg`;

async function run() {
    console.log("🚀 Generating HTML Previews for March 2026...");

    const response = await fetch(`${SUPABASE_URL}/rest/v1/linkedin_carousels?select=*&scheduled_date=gt.2026-03-01`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    const carousels = await response.json();

    if (!carousels || carousels.length === 0) {
        console.error("❌ No carousels found.");
        return;
    }

    const outputDir = path.join(__dirname, "../tmp/march_html");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    for (const carousel of carousels) {
        const slug = carousel.topic.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30);
        const fileName = `${slug}.html`;
        const filePath = path.join(outputDir, fileName);

        let slidesHtml = "";
        carousel.slides.forEach((slide, i) => {
            // High-quality placeholder background related to medical/manufacturing

            // Asset mapping based on carousel topic
            const productsPath = path.join(__dirname, '../src/assets/products');
            const equipmentPath = path.join(__dirname, '../src/assets/equipment');

            let assetFilename = 'product-display.png'; // Default
            let assetFolder = productsPath;



            const lowerTitle = (carousel.topic || '').toLowerCase();

            // Default asset list
            let assetImages = ['product-display.png'];

            if (lowerTitle.includes('não-conformidade')) {
                assetImages = [
                    'surgical-parts-optimized.webp',
                    'surgical-instruments-measuring.png',
                    'medical-screw-hero.webp',
                    'surgical-instruments-new.webp',
                    'surgical-parts-optimized.webp'
                ];
            } else if (lowerTitle.includes('iso 13485')) {
                assetImages = [
                    'surgical-instruments-measuring.png',
                    'measuring-tools-optimized.webp',
                    'laser-marking.webp',
                    'dental-components-correct.webp',
                    'surgical-instruments-set-2.png'
                ];
            } else if (lowerTitle.includes('swiss turning')) {
                assetImages = [
                    'citizen-l20.webp',
                    'tornos-gt26.webp',
                    'citizen-l32.webp',
                    'citizen-new.png',
                    'tornos-g13.png'
                ];
            } else if (lowerTitle.includes('time-to-market')) {
                assetImages = [
                    'medical-screw-hero.webp',
                    'spinal-implants-optimized.webp',
                    'surgical-instruments-new.webp',
                    'dental-implants-diagram.webp',
                    'product-display.png'
                ];
            } else if (lowerTitle.includes('dfm')) {
                assetImages = [
                    'medical-implants-diagram-enhanced.webp',
                    'dental-implants-diagram.webp',
                    'medical-screw-hero.webp',
                    'orthopedic-screws-optimized.webp',
                    'medical-implants-diagram.webp'
                ];
            } else if (lowerTitle.includes('zeiss')) {
                assetImages = [
                    'measuring-tools-optimized.webp',
                    'surgical-instruments-measuring.png',
                    'micro-instruments-optimized.webp',
                    'dental-brocas.png',
                    'measuring-tools.jpg'
                ];
            } else if (lowerTitle.includes('resiliência') || lowerTitle.includes('local')) {
                assetImages = [
                    'citizen-new.png',
                    'surgical-instruments-set.png',
                    'orthopedic-components-2.png',
                    'surgical-drills.png',
                    'product-applications.png'
                ];
            } else if (lowerTitle.includes('importação')) {
                assetImages = [
                    'surgical-instruments-set.png',
                    'dental-angulados.png',
                    'medical-screw.png',
                    'surgical-pins.jpg',
                    'product-display.png'
                ];
            }

            // Select image based on slide index
            assetFilename = assetImages[i % assetImages.length];

            // Determine folder (Equipment vs Products)
            let finalAssetPath;
            // Keywords that imply equipment/machinery
            const equipmentKeywords = ['citizen', 'tornos', 'doosan', 'robodrill', 'laser', 'electropolish', 'walter', 'mounting'];

            if (equipmentKeywords.some(k => assetFilename.toLowerCase().includes(k))) {
                finalAssetPath = path.join(equipmentPath, assetFilename);
            } else {
                finalAssetPath = path.join(productsPath, assetFilename);
            }

            const bgUrl = `file://${finalAssetPath}`;

            slidesHtml += `
            <div class="slide" style="background-image: url('${bgUrl}')">
                <div class="glass-card">
                    <div class="step">PASSOS ${i + 1}</div>
                    <h1>${slide.headline}</h1>
                    <p>${slide.body}</p>
                </div>
                <div class="branding-line"></div>
                <div class="top-branding">
                    <div class="logo-box">
                        <img src="${LOGO_SRC}" class="logo" />
                    </div>
                </div>
            </div>
            `;
        });

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #111; }
                .slide { 
                    width: 1080px; height: 1080px; 
                    position: relative; 
                    background-size: cover; 
                    background-position: center;
                    overflow: hidden;
                    margin-bottom: 24px;
                }
                .glass-card {
                    position: absolute;
                    left: 60px; top: 120px;
                    width: 540px;
                    background: rgba(0, 79, 143, 0.9);
                    border-radius: 32px;
                    padding: 60px;
                    color: white;
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.5);
                }
                .step {
                    color: #4ade80;
                    font-weight: 800;
                    font-size: 20px;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                    letter-spacing: 1px;
                }
                h1 {
                    font-size: 52px;
                    line-height: 1.1;
                    margin: 0 0 32px 0;
                    font-weight: 900;
                }
                p {
                    font-size: 26px;
                    line-height: 1.5;
                    margin: 0;
                    color: rgba(255,255,255,0.9);
                    font-weight: 400;
                }
                .branding-line {
                    position: absolute;
                    bottom: 0; left: 0;
                    width: 100%; height: 15px;
                    background: linear-gradient(90deg, #004F8F 0%, #1A7A3E 100%);
                }
                .top-branding {
                    position: absolute;
                    top: 60px; right: 60px;
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }
                .iso-badge {
                    height: 70px;
                    border-radius: 4px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                .logo-box {
                    background: white;
                    padding: 12px 24px;
                    border-radius: 16px;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center; justify-content: center;
                }
                .logo {
                    width: 160px;
                    object-fit: contain;
                }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet">
        </head>
        <body>
            ${slidesHtml}
        </body>
        </html>
        `;

        fs.writeFileSync(filePath, html);
        console.log(`✅ Generated: ${fileName}`);
    }
}

run();

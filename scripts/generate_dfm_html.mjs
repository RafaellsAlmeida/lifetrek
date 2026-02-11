
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Configuration ──────────────────────────────────────────────────────────
const OUTPUT_DIR = 'generated_content';
const BRAND_COLORS = {
    primary: '#004daa', // Deep Blue
    accent: '#00a8e8',  // Light Blue/Cyan
    text: '#ffffff',
    bg: '#0a192f'       // Dark Navy
};

// Local Asset Path (User provided)
const ISO_BADGE_PATH = 'src/assets/certifications/iso.jpg';

// Content for DFM Checklist (Simulated or AI generated)
const SLIDES_CONTENT = [
    {
        title: "DFM Checklist: 7 Essential Checks",
        body: "Ensure your medical device design is ready for manufacturing. Avoid costly rework.",
        type: "cover"
    },
    {
        title: "1. Wall Thickness Consistency",
        body: "Uniform walls prevent cooling warping. Aim for 2-3mm for injection molding.",
        type: "content"
    },
    {
        title: "2. Draft Angles",
        body: "Include 1-2 degrees draft on vertical walls for easy ejection.",
        type: "content"
    },
    {
        title: "3. Undercuts & Side Actions",
        body: "Minimize undercuts to reduce tooling cost and complexity.",
        type: "content"
    }
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function getBase64Image(filePath) {
    const fullPath = path.resolve(rootDir, filePath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️  Warning: File not found: ${fullPath}`);
        return null; // Return null if not found
    }
    const ext = path.extname(fullPath).slice(1);
    const data = fs.readFileSync(fullPath);
    return `data:image/${ext};base64,${data.toString('base64')}`;
}

// ─── HTML Template Generator ────────────────────────────────────────────────
function generateHtml(slide, isoBadgeDataUrl) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; }
            .glass-card {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .iso-badge {
                position: absolute;
                top: 40px;
                right: 40px;
                width: 120px;
                height: auto;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
                border-radius: 8px; /* Optional: in case it's square */
            }
        </style>
    </head>
    <body class="bg-gray-900 text-white flex items-center justify-center min-h-screen">
        <!-- Slide Container (1080x1350) -->
        <div id="slide" class="relative w-[1080px] h-[1350px] overflow-hidden bg-gradient-to-br from-[#0a192f] to-[#004daa] flex flex-col p-20">
            
            <!-- Background Elements -->
            <div class="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#0a192f] via-transparent to-transparent opacity-90"></div>

            <!-- Header / Logo Area -->
            <div class="relative z-10 flex justify-between items-start mb-20">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center font-bold text-2xl">LM</div>
                    <span class="text-xl font-medium tracking-wider uppercase opacity-80">Lifetrek Medical</span>
                </div>
                <!-- ISO BADGE INJECTION -->
                ${isoBadgeDataUrl ? `<img src="${isoBadgeDataUrl}" class="iso-badge" alt="ISO 13485" />` : '<!-- NO ISO BADGE FOUND -->'}
            </div>

            <!-- Content -->
            <div class="relative z-10 flex-1 flex flex-col justify-center">
                <div class="glass-card p-16 rounded-3xl">
                    <span class="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold mb-6 uppercase tracking-wider">
                        ${slide.type === 'cover' ? 'Guide' : 'Checklist Item'}
                    </span>
                    <h1 class="text-7xl font-bold leading-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                        ${slide.title}
                    </h1>
                    <p class="text-3xl text-gray-300 leading-relaxed font-light">
                        ${slide.body}
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div class="relative z-10 mt-auto pt-12 border-t border-white/10 flex justify-between items-center opacity-60">
                <span class="text-xl">lifetrek-medical.com</span>
                <span class="text-xl">Excellence in Manufacturing</span>
            </div>

        </div>
    </body>
    </html>
    `;
}

// ─── Main Execution ─────────────────────────────────────────────────────────
function run() {
    console.log("🚀 Starting Local HTML Generation (No Deps)...");

    // 1. Prepare Output Directory
    const outputDir = path.resolve(rootDir, OUTPUT_DIR);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 2. Load Assets
    console.log(`📥 Loading ISO badge from: ${ISO_BADGE_PATH}`);
    const isoBadge = getBase64Image(ISO_BADGE_PATH);
    if (isoBadge) console.log("✅ ISO Badge loaded successfully.");
    else console.error("❌ ISO Badge NOT FOUND. Slide will generate without it.");

    // 3. Generate Slides HTML
    for (let i = 0; i < SLIDES_CONTENT.length; i++) {
        const slide = SLIDES_CONTENT[i];
        console.log(`🎨 Generating Slide HTML ${i + 1}: ${slide.title}...`);

        const htmlContent = generateHtml(slide, isoBadge);
        const outputPath = path.join(outputDir, `slide_${i + 1}.html`);

        fs.writeFileSync(outputPath, htmlContent);
        console.log(`   ✅ Saved HTML to: ${outputPath}`);
    }

    console.log("\n✅ HTML Generation Complete! Check 'generated_content/' folder.");
}

run();

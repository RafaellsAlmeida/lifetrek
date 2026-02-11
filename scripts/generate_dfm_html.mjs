
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
        title: "Seu implante falhou no teste de fadiga?",
        body: "70% das falhas poderiam ser evitadas com um passo que a maioria pula.",
        type: "cover"
    },
    {
        title: "O Custo de Descobrir Tarde",
        body: "Cada falha no teste = R$50k+ em retrabalho. Meses de atraso no registro ANVISA/FDA. Time de P&D travado em loop infinito de iterações.",
        type: "content"
    },
    {
        title: "Erro #1: Pular a Validação de Geometria",
        body: "Ir direto do CAD para o CNC é tentador. Mas sem validar forma e encaixe com impressão 3D médica, problemas de geometria aparecem depois de usinar titânio.",
        type: "content"
    },
    {
        title: "Erro #2: Prototipar em Material Errado",
        body: "Testar fadiga com liga similar não é testar fadiga. A ASTM F136 (titânio grau cirúrgico) tem comportamento mecânico único. Trocar por outro material invalida 100% dos dados.",
        type: "content"
    },
    {
        title: "Erro #3: Não Mapear Regiões Críticas",
        body: "Roscas, mudanças de seção, cantos vivos - são pontos de concentração de tensão. Sem tolerâncias definidas antes do CNC, o teste de fadiga encontra o problema por você.",
        type: "content"
    },
    {
        title: "O Fluxo Que Evita Esses Erros",
        body: "Guia visual + checklist técnico para validar implantes ANTES do ensaio destrutivo. Do CAD ao teste, passo a passo.",
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
                <div class="glass-card p-12 rounded-3xl border-t border-white/20">
                    <span class="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold mb-6 uppercase tracking-wider border border-blue-500/30">
                        ${slide.type === 'cover' ? 'Guia Essencial' : 'Ponto de Atenção'}
                    </span>
                    <h1 class="text-6xl font-extrabold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                        ${slide.title}
                    </h1>
                    <div class="w-20 h-1 bg-blue-500 mb-8 rounded-full"></div>
                    <p class="text-3xl text-gray-200 leading-relaxed font-light">
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

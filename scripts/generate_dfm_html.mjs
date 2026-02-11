import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Configuration ───────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const OUTPUT_DIR = 'generated_content';

// Content for Personalized Medicine LinkedIn Carousel
const SLIDES_CONTENT = [
  {
    title: 'Padrão é suficiente para todos os pacientes?',
    body: 'Em casos complexos, implantes e instrumentais genéricos começam a falhar - clínica e mecanicamente.',
    type: 'cover'
  },
  {
    title: 'Onde o genérico não acompanha',
    body: 'Deformidades, revisões, anatomias fora da curva e protocolos cirúrgicos específicos exigem soluções sob medida - ou o cirurgião precisa improvisar em campo.',
    type: 'content'
  },
  {
    title: 'Personalização séria começa no projeto',
    body: 'Trabalhamos com times clínicos e de P&D para traduzir necessidades cirúrgicas em desenhos usináveis, com materiais de grau implante e critérios claros de validação mecânica.',
    type: 'content'
  },
  {
    title: 'Do conceito ao implante em mãos',
    body: 'Usinagem CNC de precisão, metrologia 3D e, quando necessário, sala limpa ISO 7. Cada caso recebe plano de processo, medição e rastreabilidade completos.',
    type: 'content'
  },
  {
    title: 'Tem um caso que o "padrão" não resolve?',
    body: 'Se você é OEM ou cirurgião e tem um cenário onde o catálogo não atende, podemos ajudar a avaliar viabilidade técnica e rota regulatória para uma solução personalizada. Comente "PERSONALIZADO" ou fale com nossa equipe.',
    type: 'cta'
  }
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function loadLogoDataUrl() {
  const logoCandidates = [
    path.resolve(rootDir, 'public/images/lifetrek-logo-full.png'),
    path.resolve(rootDir, 'src/assets/logo.png')
  ];

  for (const logoPath of logoCandidates) {
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
  }

  return null;
}

function loadImageDataUrl(...imageCandidates) {
  for (const imagePath of imageCandidates) {
    if (fs.existsSync(imagePath)) {
      const buffer = fs.readFileSync(imagePath);
      const extension = path.extname(imagePath).toLowerCase();
      const mimeType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png';
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }
  }

  return null;
}

function loadBackgrounds() {
  const highResBg = loadImageDataUrl(
    path.resolve(rootDir, 'public/images/high-res-bg.png'),
    path.resolve(rootDir, 'src/assets/gradient-bg.png')
  );

  const slideBg = loadImageDataUrl(
    path.resolve(rootDir, 'public/images/slide-background.png'),
    path.resolve(rootDir, 'src/assets/gradient-bg.png')
  );

  return {
    cover: highResBg,
    content: slideBg,
    cta: highResBg
  };
}

// ─── Template Function ────────────────────────────────────────────────────────
function stylizeHeadline(title) {
  const keywords = [
    'PADRÃO',
    'PACIENTES',
    'GENÉRICO',
    'PERSONALIZAÇÃO',
    'PROJETO',
    'CONCEITO',
    'IMPLANTE',
    'MÃOS',
    'CASO',
    'RESOLVE'
  ];

  let styled = escapeHtml(title).toUpperCase();
  for (const keyword of keywords) {
    styled = styled.replaceAll(keyword, `<strong>${keyword}</strong>`);
  }

  return styled;
}

function generateHtml(slide, logoDataUrl, slideIndex, slideTotal, backgrounds) {
  const title = escapeHtml(slide.title);
  const styledHeadline = stylizeHeadline(slide.title);
  const body = escapeHtml(slide.body);
  const variantClass = `variant-${slide.type}`;
  const backgroundDataUrl = backgrounds[slide.type] || backgrounds.content || '';
  const backgroundCss = backgroundDataUrl ? `url("${backgroundDataUrl}")` : 'none';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --brand-primary: #004F8F;
      --brand-primary-hover: #003D75;
      --brand-accent-orange: #F07818;
      --brand-accent-green: #1A7A3E;
      --headline-light: #f6fbff;
      --headline-muted: rgba(246, 251, 255, 0.85);
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #ecf1f7;
    }

    body {
      display: grid;
      place-items: center;
    }

    #slide-capture {
      width: 1080px;
      height: 1350px;
      position: relative;
      overflow: hidden;
      color: var(--headline-light);
    }

    .bg-photo {
      position: absolute;
      inset: 0;
      background-image: ${backgroundCss};
      background-size: cover;
      background-position: center;
      transform: scale(1.02);
      filter: saturate(1.12) contrast(1.04);
    }

    .bg-overlay {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(146deg, rgba(0, 79, 143, 0.84) 0%, rgba(0, 61, 117, 0.74) 42%, rgba(26, 122, 62, 0.30) 100%),
        linear-gradient(180deg, rgba(2, 16, 34, 0.16) 0%, rgba(2, 16, 34, 0.76) 68%, rgba(2, 16, 34, 0.88) 100%);
    }

    .logo-raw {
      position: absolute;
      top: 42px;
      right: 46px;
      z-index: 3;
    }

    .logo-raw img {
      width: 186px;
      height: auto;
      display: block;
      object-fit: contain;
      filter: drop-shadow(0 4px 16px rgba(2, 8, 22, 0.45));
      margin-left: auto;
    }

    .logo-fallback {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #ffffff;
      display: block;
      text-align: right;
    }

    .content-wrap {
      position: absolute;
      top: 152px;
      left: 46px;
      right: 46px;
      bottom: 52px;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 38px;
    }

    .content-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 940px;
    }

    h1 {
      margin: 0;
      font-size: 92px;
      font-weight: 300;
      line-height: 1.02;
      letter-spacing: -0.015em;
      text-transform: uppercase;
      color: var(--headline-light);
      max-width: 920px;
      text-wrap: balance;
      text-shadow: 0 8px 28px rgba(2, 12, 24, 0.46);
    }

    h1 strong {
      font-weight: 800;
      color: #ffffff;
      text-shadow: 0 10px 28px rgba(2, 12, 24, 0.55);
    }

    .body-panel {
      background: linear-gradient(145deg, rgba(1, 19, 38, 0.74) 0%, rgba(1, 17, 34, 0.64) 100%);
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 20px;
      padding: 34px 34px 30px;
      box-shadow: 0 24px 52px rgba(0, 7, 19, 0.42);
      backdrop-filter: blur(9px);
      -webkit-backdrop-filter: blur(9px);
    }

    .body-copy {
      margin: 0;
      font-size: 43px;
      font-weight: 500;
      line-height: 1.33;
      color: var(--headline-muted);
      text-shadow: 0 6px 20px rgba(2, 12, 24, 0.28);
    }

    .variant-cover h1 {
      font-size: 98px;
    }

    .variant-content h1 {
      font-size: 90px;
    }

    .variant-cta h1 {
      font-size: 88px;
    }

    .variant-cta .body-panel {
      border-color: rgba(240, 120, 24, 0.45);
    }
  </style>
</head>
<body>
  <div id="slide-capture" class="${variantClass}">
    <div class="bg-photo"></div>
    <div class="bg-overlay"></div>
    <div class="logo-raw">
      ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Lifetrek Medical Logo">` : '<span class="logo-fallback">Lifetrek Medical</span>'}
    </div>

    <main class="content-wrap">
      <section class="content-card">
        <h1>${styledHeadline}</h1>
      </section>

      <section class="body-panel">
        <p class="body-copy">${body}</p>
      </section>
    </main>
  </div>
</body>
</html>`;
}

// ─── Main Execution ─────────────────────────────────────────────────────────
function run() {
  console.log('🚀 Starting Official Brand HTML Generation...');

  const outputDir = path.resolve(rootDir, OUTPUT_DIR);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let logoDataUrl = null;
  let backgrounds = { cover: null, content: null, cta: null };
  try {
    logoDataUrl = loadLogoDataUrl();
    if (logoDataUrl) {
      console.log('✅ Loaded official logo asset');
    } else {
      console.warn('⚠️ Could not find official logo asset');
    }
  } catch (error) {
    console.warn('⚠️ Could not load official logo asset:', error.message);
  }

  try {
    backgrounds = loadBackgrounds();
    if (!backgrounds.cover || !backgrounds.content || !backgrounds.cta) {
      console.warn('⚠️ One or more background images were not found, using fallback when possible');
    } else {
      console.log('✅ Loaded original background images');
    }
  } catch (error) {
    console.warn('⚠️ Could not load background images:', error.message);
  }

  SLIDES_CONTENT.forEach((slide, index) => {
    const slideNum = index + 1;
    process.stdout.write(`🎨 Generating Official Slide ${slideNum}: ${slide.title.slice(0, 30)}...\r`);

    const html = generateHtml(slide, logoDataUrl, slideNum, SLIDES_CONTENT.length, backgrounds);
    const fileName = `slide_${slideNum}.html`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, html);
    console.log(`\n   ✅ Saved HTML to: ${filePath}`);
  });

  console.log('\n✅ OFFICIAL BRAND Generation Complete!');
}

run();

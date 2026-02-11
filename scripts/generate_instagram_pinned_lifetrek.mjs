import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(rootDir, 'marketing_assets/instagram/03_pinned_o_que_e_lifetrek');

const SLIDES = [
  {
    title: 'O que é a Lifetrek?',
    body: 'Somos um parceiro de engenharia e manufatura para dispositivos médicos e odontológicos de alta precisão, com foco em previsibilidade técnica e execução consistente.',
    background: 'src/assets/facility/factory-exterior-hero.webp',
    hero: 'src/assets/products/medical-screw-hero.webp',
    thumbs: [
      'src/assets/facility/cleanroom-hero.webp',
      'src/assets/products/surgical-instruments-new.webp',
      'src/assets/equipment/citizen-l32.webp'
    ]
  },
  {
    title: 'Precisão para dispositivos críticos',
    body: 'Transformamos requisitos clínicos em peças usinadas com tolerâncias rigorosas, acabamento controlado e repetibilidade para ambientes regulados.',
    background: 'src/assets/facility/production-floor.jpg',
    hero: 'src/assets/products/surgical-instruments-new.webp',
    thumbs: [
      'src/assets/products/medical-implants-diagram-enhanced.webp',
      'src/assets/products/medical-screw-raw.png',
      'src/assets/products/orthopedic-components-2.png'
    ]
  },
  {
    title: 'Qualidade em cada etapa',
    body: 'A qualidade é incorporada ao processo: planos de inspeção, metrologia dedicada, rastreabilidade e critérios objetivos de aprovação.',
    background: 'src/assets/facility/clean-room-3.png',
    hero: 'src/assets/metrology/metrology-overview.png',
    thumbs: [
      'src/assets/metrology/zeiss-contura.webp',
      'src/assets/metrology/hardness-tester.png',
      'src/assets/metrology/olympus-microscope.png'
    ]
  },
  {
    title: 'Da engenharia ao produto final',
    body: 'Integramos engenharia, usinagem, acabamento e preparação para esterilização em um fluxo técnico contínuo, reduzindo retrabalho e lead time.',
    background: 'src/assets/facility/clean-room-1.png',
    hero: 'src/assets/products/product-display.png',
    thumbs: [
      'src/assets/facility/electropolishing-passivation.png',
      'src/assets/facility/laser-marking.png',
      'src/assets/products/surgical-instruments-set-2.png'
    ]
  },
  {
    title: 'Escala com infraestrutura real',
    body: 'Com parque fabril moderno e equipe técnica próxima ao cliente, suportamos de protótipos a produção recorrente sem perder controle de processo.',
    background: 'src/assets/facility/exterior-hero.webp',
    hero: 'src/assets/equipment/doosan-new.png',
    thumbs: [
      'src/assets/equipment/robodrill.webp',
      'src/assets/equipment/citizen-l20.webp',
      'src/assets/equipment/wire-edm.jpg'
    ]
  },
  {
    title: 'Seu projeto médico merece previsibilidade',
    body: 'Se você está avaliando um novo componente ou migração de fornecedor, vamos discutir requisitos técnicos e construir um plano de fabricação sólido.',
    background: 'src/assets/facility/reception-hero.webp',
    hero: 'src/assets/products/medical-screw-raw.png',
    thumbs: [
      'src/assets/facility/office-visit.png',
      'src/assets/products/dental-angulados.png',
      'src/assets/products/veterinary-implant-2.jpg'
    ]
  }
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stylizeHeadline(text) {
  const keywords = [
    'LIFETREK',
    'PRECISÃO',
    'CRÍTICOS',
    'QUALIDADE',
    'ENGENHARIA',
    'INFRAESTRUTURA',
    'PREVISIBILIDADE',
    'PROJETO',
    'MÉDICO'
  ];

  let styled = escapeHtml(text).toUpperCase();
  for (const token of keywords) {
    styled = styled.replaceAll(token, `<strong>${token}</strong>`);
  }

  return styled;
}

function loadImageDataUrl(relativePath) {
  const absolutePath = path.resolve(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Asset not found: ${relativePath}`);
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
  const buffer = fs.readFileSync(absolutePath);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function buildSlideHtml(slide, index, total, logoDataUrl) {
  const bg = loadImageDataUrl(slide.background);
  const hero = loadImageDataUrl(slide.hero);
  const thumbs = slide.thumbs.map((item) => loadImageDataUrl(item));
  const headline = stylizeHeadline(slide.title);
  const body = escapeHtml(slide.body);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(slide.title)}</title>
  <style>
    :root {
      --brand-primary: #004F8F;
      --brand-primary-hover: #003D75;
      --brand-accent: #F07818;
      --text-light: #F4F8FD;
      --text-soft: rgba(244, 248, 253, 0.88);
    }

    * { box-sizing: border-box; }

    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #06294a;
    }

    #slide-capture {
      width: 1080px;
      height: 1080px;
      position: relative;
      overflow: hidden;
      color: var(--text-light);
    }

    .bg-photo {
      position: absolute;
      inset: 0;
      background-image: url("${bg}");
      background-size: cover;
      background-position: center;
      transform: scale(1.05);
      filter: saturate(1.08) contrast(1.02);
    }

    .bg-overlay {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(144deg, rgba(0, 79, 143, 0.86) 0%, rgba(0, 61, 117, 0.72) 45%, rgba(26, 122, 62, 0.30) 100%),
        linear-gradient(180deg, rgba(4, 18, 36, 0.15) 0%, rgba(4, 18, 36, 0.84) 72%, rgba(4, 18, 36, 0.92) 100%);
    }

    .logo {
      position: absolute;
      top: 34px;
      right: 34px;
      z-index: 4;
      width: 180px;
      height: auto;
      filter: drop-shadow(0 6px 20px rgba(1, 9, 20, 0.5));
    }

    .content {
      position: relative;
      z-index: 3;
      height: 100%;
      padding: 80px 44px 34px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    h1 {
      margin: 0;
      max-width: 660px;
      font-size: 88px;
      line-height: 0.98;
      letter-spacing: -0.015em;
      text-transform: uppercase;
      font-weight: 300;
      text-wrap: balance;
      text-shadow: 0 10px 30px rgba(1, 10, 24, 0.45);
    }

    h1 strong {
      font-weight: 800;
      color: #ffffff;
    }

    .body-panel {
      margin-top: auto;
      background: linear-gradient(145deg, rgba(2, 21, 41, 0.78) 0%, rgba(2, 19, 36, 0.66) 100%);
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 20px;
      padding: 28px 28px 26px;
      box-shadow: 0 20px 44px rgba(0, 8, 20, 0.4);
      backdrop-filter: blur(9px);
      -webkit-backdrop-filter: blur(9px);
      max-width: 1000px;
    }

    .body-panel p {
      margin: 0;
      font-size: 53px;
      line-height: 1.2;
      letter-spacing: -0.01em;
      font-weight: 500;
      color: var(--text-soft);
    }

    .hero-card {
      position: absolute;
      right: 44px;
      top: 318px;
      width: 236px;
      height: 236px;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.28);
      box-shadow: 0 20px 40px rgba(0, 10, 26, 0.42);
      background: rgba(0, 0, 0, 0.2);
      z-index: 4;
    }

    .hero-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .thumb-row {
      display: flex;
      gap: 14px;
      margin-top: 14px;
    }

    .thumb {
      width: 86px;
      height: 86px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.26);
      overflow: hidden;
      background: rgba(0, 0, 0, 0.2);
      box-shadow: 0 10px 24px rgba(0, 10, 24, 0.35);
    }

    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .meta {
      position: absolute;
      left: 44px;
      bottom: 36px;
      z-index: 5;
      font-size: 24px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(244, 248, 253, 0.88);
      font-weight: 700;
    }

    .meta b {
      color: #fff;
    }

    .slide-2 h1, .slide-3 h1, .slide-4 h1, .slide-5 h1, .slide-6 h1 {
      font-size: 74px;
    }

    .slide-6 h1 {
      font-size: 68px;
    }
  </style>
</head>
<body>
  <div id="slide-capture" class="slide-${index}">
    <div class="bg-photo"></div>
    <div class="bg-overlay"></div>
    ${logoDataUrl ? `<img class="logo" src="${logoDataUrl}" alt="Lifetrek Medical">` : ''}

    <div class="hero-card"><img src="${hero}" alt="Asset principal"></div>

    <main class="content">
      <h1>${headline}</h1>

      <section class="body-panel">
        <p>${body}</p>
        <div class="thumb-row">
          <div class="thumb"><img src="${thumbs[0]}" alt="Asset 1"></div>
          <div class="thumb"><img src="${thumbs[1]}" alt="Asset 2"></div>
          <div class="thumb"><img src="${thumbs[2]}" alt="Asset 3"></div>
        </div>
      </section>
    </main>

    <div class="meta"><b>O que é a Lifetrek?</b>  •  ${index}/${total}</div>
  </div>
</body>
</html>`;
}

function run() {
  ensureDir(OUTPUT_DIR);

  const logoDataUrl = loadImageDataUrl('public/images/lifetrek-logo-full.png');

  SLIDES.forEach((slide, idx) => {
    const slideIndex = idx + 1;
    const html = buildSlideHtml(slide, slideIndex, SLIDES.length, logoDataUrl);
    const filePath = path.join(OUTPUT_DIR, `slide_${slideIndex}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`✅ HTML generated: ${filePath}`);
  });

  const caption = [
    'O que é a Lifetrek?',
    '',
    'Um parceiro técnico para transformar requisitos clínicos em fabricação previsível.',
    'Da engenharia à produção recorrente, com foco em precisão, qualidade e rastreabilidade.',
    '',
    '#Lifetrek #MedicalDevices #Engenharia #CNC #ManufaturaMedica'
  ].join('\n');

  fs.writeFileSync(path.join(OUTPUT_DIR, 'caption.txt'), caption);
  console.log(`✅ Caption saved: ${path.join(OUTPUT_DIR, 'caption.txt')}`);
}

run();

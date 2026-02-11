import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(rootDir, 'marketing_assets/instagram/03_pinned_o_que_e_lifetrek_v2');
const AI_BG_DIR = path.resolve(rootDir, 'output/imagegen/pinned_lifetrek_v2/ai_bg');

const BG = [
  '001-premium-cinematic-photo-of-a-modern-medical-precision-manufa.png',
  '002-inside-a-swiss-type-cnc-machining-area-for-medical-component.png',
  '003-metrology-quality-lab-with-zeiss-style-cmm-machine-and-inspe.png',
  '004-iso-cleanroom-inspired-environment-for-medical-device-packag.png',
  '005-electropolishing-and-finishing-process-area-for-medical-comp.png',
  '006-engineering-team-collaboration-scene-in-a-medical-manufactur.png',
  '007-curated-layout-of-high-precision-medical-and-dental-metal-co.png',
  '008-confident-final-scene-symbolizing-reliable-medical-manufactu.png'
];

const SLIDES = [
  {
    title: 'O que é a Lifetrek?',
    body: 'Somos um parceiro de engenharia e manufatura para dispositivos médicos e odontológicos de alta precisão.',
    kicker: 'PARCEIRO TÉCNICO'
  },
  {
    title: 'Precisão para dispositivos críticos',
    body: 'Transformamos requisitos clínicos em peças usinadas com tolerâncias rigorosas e repetibilidade de processo.',
    kicker: 'MICRO USINAGEM'
  },
  {
    title: 'Qualidade incorporada ao processo',
    body: 'Metrologia dedicada, critérios objetivos de inspeção e rastreabilidade para decisões técnicas confiáveis.',
    kicker: 'QUALIDADE'
  },
  {
    title: 'Ambiente limpo quando o projeto exige',
    body: 'Estrutura orientada a fluxos controlados para suportar etapas de preparo e acondicionamento de componentes.',
    kicker: 'CLEANROOM'
  },
  {
    title: 'Acabamento técnico com consistência',
    body: 'Processos de acabamento e preparação são tratados como parte crítica da performance final do componente.',
    kicker: 'FINISHING'
  },
  {
    title: 'Engenharia próxima do cliente',
    body: 'Equipe técnica colabora desde o desenho até a industrialização para reduzir retrabalho e risco de escala.',
    kicker: 'CO-DESENVOLVIMENTO'
  },
  {
    title: 'Portfólio real de componentes médicos',
    body: 'Produzimos peças e conjuntos para aplicações médicas e odontológicas com foco em previsibilidade de entrega.',
    kicker: 'PORTFÓLIO'
  },
  {
    title: 'Seu projeto merece previsibilidade',
    body: 'Se você está avaliando novo componente ou migração de fornecedor, podemos estruturar uma rota técnica sólida.',
    kicker: 'CTA'
  }
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function loadImageDataUrl(absolutePath) {
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Asset not found: ${absolutePath}`);
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
  const buffer = fs.readFileSync(absolutePath);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function stylizeHeadline(text) {
  const tokens = ['LIFETREK', 'PRECISÃO', 'CRÍTICOS', 'QUALIDADE', 'LIMPO', 'CONSISTÊNCIA', 'ENGENHARIA', 'PREVISIBILIDADE', 'PORTFÓLIO', 'PROJETO'];
  let styled = escapeHtml(text).toUpperCase();
  for (const token of tokens) {
    styled = styled.replaceAll(token, `<strong>${token}</strong>`);
  }
  return styled;
}

function buildHtml(slide, index, total, bgDataUrl, logoDataUrl) {
  const headline = stylizeHeadline(slide.title);
  const body = escapeHtml(slide.body);
  const kicker = escapeHtml(slide.kicker);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(slide.title)}</title>
<style>
  :root {
    --blue: #004F8F;
    --blue-dark: #003D75;
    --orange: #F07818;
    --txt: #F6FBFF;
    --txt-soft: rgba(246, 251, 255, 0.9);
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }

  #slide-capture {
    width: 1080px;
    height: 1080px;
    position: relative;
    overflow: hidden;
    color: var(--txt);
    background: #032448;
  }

  .bg {
    position: absolute;
    inset: 0;
    background-image: url("${bgDataUrl}");
    background-size: cover;
    background-position: center;
    transform: scale(1.04);
    filter: saturate(1.04) contrast(1.02);
  }

  .overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(145deg, rgba(0, 79, 143, 0.86) 0%, rgba(0, 61, 117, 0.74) 44%, rgba(26, 122, 62, 0.28) 100%),
      linear-gradient(180deg, rgba(2, 16, 34, 0.14) 0%, rgba(2, 16, 34, 0.82) 72%, rgba(2, 16, 34, 0.91) 100%);
  }

  .logo {
    position: absolute;
    top: 34px;
    right: 36px;
    width: 172px;
    z-index: 4;
    filter: drop-shadow(0 8px 24px rgba(0, 9, 22, 0.52));
  }

  .content {
    position: relative;
    z-index: 3;
    height: 100%;
    padding: 56px 46px 38px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .kicker {
    display: inline-block;
    width: fit-content;
    margin-top: 2px;
    background: rgba(0, 22, 47, 0.48);
    border: 1px solid rgba(255, 255, 255, 0.26);
    color: rgba(246, 251, 255, 0.94);
    border-radius: 999px;
    padding: 7px 14px;
    font-size: 16px;
    letter-spacing: 0.09em;
    font-weight: 700;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    max-width: 740px;
    font-size: 84px;
    line-height: 0.98;
    text-transform: uppercase;
    letter-spacing: -0.015em;
    font-weight: 300;
    text-wrap: balance;
    text-shadow: 0 10px 30px rgba(1, 10, 24, 0.48);
  }

  h1 strong { font-weight: 800; color: #fff; }

  .body-panel {
    margin-top: auto;
    background: linear-gradient(145deg, rgba(1, 18, 36, 0.79) 0%, rgba(1, 17, 33, 0.7) 100%);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 20px;
    padding: 30px 30px 24px;
    box-shadow: 0 20px 44px rgba(0, 8, 20, 0.43);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    max-width: 1000px;
  }

  .body-panel p {
    margin: 0;
    font-size: 51px;
    line-height: 1.19;
    letter-spacing: -0.01em;
    font-weight: 500;
    color: var(--txt-soft);
  }

  .meta {
    margin-top: 14px;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.075em;
    text-transform: uppercase;
    color: rgba(246, 251, 255, 0.92);
  }

  .meta b { color: #fff; }

  .slide-2 h1, .slide-3 h1, .slide-4 h1, .slide-5 h1, .slide-6 h1, .slide-7 h1, .slide-8 h1 { font-size: 72px; }
  .slide-8 h1 { font-size: 68px; }
</style>
</head>
<body>
  <div id="slide-capture" class="slide-${index}">
    <div class="bg"></div>
    <div class="overlay"></div>
    <img class="logo" src="${logoDataUrl}" alt="Lifetrek Medical" />

    <main class="content">
      <div class="kicker">${kicker}</div>
      <h1>${headline}</h1>

      <section class="body-panel">
        <p>${body}</p>
        <div class="meta"><b>O QUE É A LIFETREK?</b> • ${index}/${total}</div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function run() {
  ensureDir(OUTPUT_DIR);

  const logoDataUrl = loadImageDataUrl(path.resolve(rootDir, 'public/images/lifetrek-logo-full.png'));

  SLIDES.forEach((slide, idx) => {
    const bgName = BG[idx];
    const bgDataUrl = loadImageDataUrl(path.join(AI_BG_DIR, bgName));
    const slideNum = idx + 1;
    const html = buildHtml(slide, slideNum, SLIDES.length, bgDataUrl, logoDataUrl);
    const outPath = path.join(OUTPUT_DIR, `slide_${slideNum}.html`);
    fs.writeFileSync(outPath, html);
    console.log(`✅ ${outPath}`);
  });

  const caption = [
    'O que é a Lifetrek?',
    '',
    'Uma visão objetiva da nossa proposta técnica: engenharia, precisão e previsibilidade para dispositivos médicos.',
    '',
    'Se fizer sentido para seu roadmap, vamos discutir seu cenário técnico.',
    '',
    '#Lifetrek #MedicalDevices #CNC #Engenharia #ManufaturaMedica'
  ].join('\n');

  fs.writeFileSync(path.join(OUTPUT_DIR, 'caption.txt'), caption);
  console.log(`✅ ${path.join(OUTPUT_DIR, 'caption.txt')}`);
}

run();

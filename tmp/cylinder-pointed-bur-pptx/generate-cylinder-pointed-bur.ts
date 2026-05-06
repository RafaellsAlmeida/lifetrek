import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { render2D } from "../../src/lib/engineering-drawing/render2d";
import { render3D } from "../../src/lib/engineering-drawing/render3d";
import { renderA3 } from "../../src/lib/engineering-drawing/renderA3";
import { renderStep } from "../../src/lib/engineering-drawing/renderStep";
import {
  createEmptySemanticDocument,
  type AxisymmetricPartSpec,
  type AxisymmetricSegment,
} from "../../src/lib/engineering-drawing/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, "outputs");

const spec: AxisymmetricPartSpec = {
  partName: "Cylinder Pointed Bur 12s MCXL nova",
  drawingNumber: "CPB-12S-MCXL-NOVA-PRELIM",
  unit: "mm",
  totalLengthMm: 38,
  segments: [
    {
      id: "thread-m35",
      label: "Rosca M3,5 x 0,35",
      kind: "thread",
      lengthMm: 5.2,
      startDiameterMm: 3.5,
      endDiameterMm: 3.5,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: "M3,5",
      threadPitchMm: 0.35,
      chamferStartMm: null,
      chamferStartAngleDeg: null,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: null,
      filletEndRadiusMm: null,
      note: "Rosca modelada como zona cilíndrica nominal; hélice real não modelada nesta versão.",
      confidence: 0.7,
    },
    {
      id: "shaft-before-groove",
      label: "Corpo cilíndrico antes dos rebaixos",
      kind: "cylinder",
      lengthMm: 5,
      startDiameterMm: 3.5,
      endDiameterMm: 3.5,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: null,
      chamferStartAngleDeg: null,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: null,
      filletEndRadiusMm: null,
      note: null,
      confidence: 0.66,
    },
    {
      id: "groove-1",
      label: "Rebaixo 1 Ø3,35",
      kind: "cylinder",
      lengthMm: 0.5,
      startDiameterMm: 3.35,
      endDiameterMm: 3.35,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: 0.5,
      chamferStartAngleDeg: 45,
      chamferEndMm: 0.5,
      chamferEndAngleDeg: 45,
      filletStartRadiusMm: null,
      filletEndRadiusMm: null,
      note: "Detalhe fonte indica 0,50 e 45 graus; chanfros não entram no STEP V1.",
      confidence: 0.58,
    },
    {
      id: "shaft-between-grooves",
      label: "Corpo entre rebaixos",
      kind: "cylinder",
      lengthMm: 2.4,
      startDiameterMm: 3.5,
      endDiameterMm: 3.5,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: null,
      chamferStartAngleDeg: null,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: null,
      filletEndRadiusMm: null,
      note: "Comprimento alocado para reconciliar as cotas parciais com o total de 38,0 mm.",
      confidence: 0.52,
    },
    {
      id: "groove-2",
      label: "Rebaixo 2 Ø3,35",
      kind: "cylinder",
      lengthMm: 0.5,
      startDiameterMm: 3.35,
      endDiameterMm: 3.35,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: 0.5,
      chamferStartAngleDeg: 45,
      chamferEndMm: 0.5,
      chamferEndAngleDeg: 45,
      filletStartRadiusMm: null,
      filletEndRadiusMm: null,
      note: "Segundo rebaixo Ø3,35 indicado como 2x no desenho fonte.",
      confidence: 0.58,
    },
    {
      id: "shaft-after-grooves",
      label: "Corpo cilíndrico antes do cone",
      kind: "cylinder",
      lengthMm: 2,
      startDiameterMm: 3.7,
      endDiameterMm: 3.7,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: null,
      chamferStartAngleDeg: null,
      chamferEndMm: 0.2,
      chamferEndAngleDeg: 30,
      filletStartRadiusMm: null,
      filletEndRadiusMm: null,
      note: "Cota Ø3,70 lida no trecho antes do cone; validar com especialista.",
      confidence: 0.62,
    },
    {
      id: "front-cone",
      label: "Cone 10 graus",
      kind: "taper",
      lengthMm: 7.2,
      startDiameterMm: 3.7,
      endDiameterMm: 6.5,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: 0.2,
      chamferStartAngleDeg: 30,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: null,
      filletEndRadiusMm: null,
      note: "Cone interpretado a partir das cotas 7,20, 10 graus e Ø6,50.",
      confidence: 0.72,
    },
    {
      id: "thin-flange",
      label: "Flange fino Ø6,50",
      kind: "cylinder",
      lengthMm: 0.4,
      startDiameterMm: 6.5,
      endDiameterMm: 6.5,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: null,
      chamferStartAngleDeg: null,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: null,
      filletEndRadiusMm: null,
      note: "Flange fino indicado como 0,40.",
      confidence: 0.68,
    },
    {
      id: "faceted-zone",
      label: "Zona facetada Ø5,0",
      kind: "cylinder",
      lengthMm: 1.2,
      startDiameterMm: 5,
      endDiameterMm: 5,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: null,
      chamferStartAngleDeg: null,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: 0.5,
      filletEndRadiusMm: null,
      note: "Facetado 3x a 120 graus modelado como envelope cilíndrico Ø5,0.",
      confidence: 0.5,
    },
    {
      id: "diamond-235",
      label: "Superfície diamantada Ø2,35",
      kind: "cylinder",
      lengthMm: 1.6,
      startDiameterMm: 2.35,
      endDiameterMm: 2.35,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: null,
      chamferStartAngleDeg: null,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: null,
      filletEndRadiusMm: 0.3,
      note: "D = superfície diamantada; textura não modelada no STEP V1.",
      confidence: 0.68,
    },
    {
      id: "diamond-215",
      label: "Superfície diamantada Ø2,15",
      kind: "cylinder",
      lengthMm: 4,
      startDiameterMm: 2.15,
      endDiameterMm: 2.15,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: null,
      chamferStartAngleDeg: null,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: 0.3,
      filletEndRadiusMm: null,
      note: "D = superfície diamantada; textura não modelada no STEP V1.",
      confidence: 0.72,
    },
    {
      id: "diamond-175",
      label: "Superfície diamantada Ø1,75",
      kind: "cylinder",
      lengthMm: 6.8,
      startDiameterMm: 1.75,
      endDiameterMm: 1.75,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: null,
      chamferStartAngleDeg: null,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: null,
      filletEndRadiusMm: null,
      note: "Parte reta da região final diamantada; a cota 8,00 foi interpretada como trecho final incluindo ponta.",
      confidence: 0.64,
    },
    {
      id: "pointed-tip",
      label: "Ponta 45 graus",
      kind: "taper",
      lengthMm: 1.2,
      startDiameterMm: 1.75,
      endDiameterMm: 1.2,
      externalShape: "round",
      acrossFlatsMm: null,
      threadDesignation: null,
      threadPitchMm: null,
      chamferStartMm: 1.2,
      chamferStartAngleDeg: 45,
      chamferEndMm: null,
      chamferEndAngleDeg: null,
      filletStartRadiusMm: null,
      filletEndRadiusMm: 0.5,
      note: "Ponta modelada como cone truncado preliminar; validar geometria real da ponta.",
      confidence: 0.56,
    },
  ],
  axialBores: [],
  notes: [
    "Modelo preliminar extraído do PPTX Cylinder Pointed Bur 12s MCXL nova chinesa.",
    "A soma dos trechos foi ajustada para fechar o comprimento total de 38,0 mm.",
    "Rosca, superfície diamantada, raios, chanfros e facetado foram simplificados nesta versão.",
    "Usar como material de conversa com especialista, não como arquivo liberado para fabricação.",
  ],
  unsupportedFeatures: [],
};

const semanticDocument = createEmptySemanticDocument(spec.partName);
semanticDocument.documentMetadata.governingStandard = {
  system: "ISO",
  edition: null,
  source: "manual",
};
semanticDocument.reviewDecision = {
  approved: false,
  approvedWithWarnings: true,
  reviewerId: "codex-preliminar",
  reviewedAt: new Date().toISOString(),
  comments: "Documento preliminar para conversa com especialista.",
};

function formatMm(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 2 : 2,
    maximumFractionDigits: 2,
  });
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function segmentPoints(segments: AxisymmetricSegment[], x0: number, y0: number, xScale: number, yScale: number) {
  let cursor = 0;
  const top: string[] = [];
  const bottom: string[] = [];
  const bounds: Array<{ id: string; label: string; x1: number; x2: number; d1: number; d2: number; length: number }> = [];

  segments.forEach((segment) => {
    const length = segment.lengthMm ?? 0;
    const d1 = segment.startDiameterMm ?? 0;
    const d2 = segment.endDiameterMm ?? d1;
    const x1 = x0 + cursor * xScale;
    const x2 = x0 + (cursor + length) * xScale;
    top.push(`${x1},${y0 - (d1 * yScale) / 2}`, `${x2},${y0 - (d2 * yScale) / 2}`);
    bottom.unshift(`${x2},${y0 + (d2 * yScale) / 2}`, `${x1},${y0 + (d1 * yScale) / 2}`);
    bounds.push({ id: segment.id, label: segment.label, x1, x2, d1, d2, length });
    cursor += length;
  });

  return {
    outline: [...top, ...bottom].join(" "),
    bounds,
    drawingRight: x0 + cursor * xScale,
  };
}

function line(x1: number, y1: number, x2: number, y2: number, attrs = "") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;
}

function text(x: number, y: number, value: string, attrs = "") {
  return `<text x="${x}" y="${y}" ${attrs}>${escapeXml(value)}</text>`;
}

function dim(x1: number, x2: number, y: number, label: string, color = "#f97316") {
  const mid = (x1 + x2) / 2;
  return `
    ${line(x1, y - 22, x1, y + 22, `stroke="${color}" stroke-width="1.2"`)}
    ${line(x2, y - 22, x2, y + 22, `stroke="${color}" stroke-width="1.2"`)}
    ${line(x1, y, x2, y, `stroke="${color}" stroke-width="1.4" marker-start="url(#arrow-orange)" marker-end="url(#arrow-orange)"`)}
    ${text(mid, y - 8, label, `text-anchor="middle" font-size="18" fill="#111827"`)}
  `;
}

function leader(x1: number, y1: number, x2: number, y2: number, label: string, color = "#f97316") {
  const marker = color === "#22c55e" ? "green" : "orange";
  return `
    ${line(x1, y1, x2, y2, `stroke="${color}" stroke-width="1.5" marker-end="url(#arrow-${marker})"`)}
    ${text(x1, y1 - 8, label, `text-anchor="middle" font-size="18" fill="#111827"`)}
  `;
}

function buildSourceStyleSvg() {
  const width = 1680;
  const height = 920;
  const x0 = 70;
  const y0 = 430;
  const xScale = 37;
  const yScale = 29;
  const { outline, bounds, drawingRight } = segmentPoints(spec.segments, x0, y0, xScale, yScale);
  const byId = new Map(bounds.map((bound) => [bound.id, bound]));
  const get = (id: string) => {
    const value = byId.get(id);
    if (!value) throw new Error(`Segmento ausente: ${id}`);
    return value;
  };

  const topNotes = `
    ${text(1030, 60, "Cylinder Pointed Bur 12s", 'text-anchor="middle" font-size="34" font-weight="700"')}
    ${text(1030, 105, "MCXL nova", 'text-anchor="middle" font-size="34" font-weight="700"')}
    ${text(1030, 155, "Ø5,0 com 2,10 centro ao facetado (3x) 120°", 'text-anchor="middle" font-size="22"')}
  `;

  const dims = `
    ${dim(get("thread-m35").x1, get("thread-m35").x2, 620, "5,20")}
    ${dim(get("shaft-before-groove").x1, get("shaft-after-grooves").x2, 650, "10,40*")}
    ${dim(get("front-cone").x1, get("front-cone").x2, 620, "7,20")}
    ${dim(get("thin-flange").x1, get("thin-flange").x2, 720, "0,40")}
    ${dim(get("faceted-zone").x1, get("faceted-zone").x2, 680, "1,20")}
    ${dim(get("diamond-235").x1, get("diamond-235").x2, 680, "1,60")}
    ${dim(get("diamond-215").x1, get("diamond-215").x2, 650, "4,00")}
    ${dim(get("diamond-175").x1, get("pointed-tip").x2, 620, "8,00")}
    ${dim(x0, drawingRight, 805, "38,0")}
  `;

  const labels = `
    ${leader(125, 260, get("thread-m35").x1 + 90, y0 - 55, "Rosca\\nM3,5X0,35")}
    ${leader(360, 245, get("groove-1").x1 + 8, y0 - 50, "Ø3,35 (2x)", "#22c55e")}
    ${leader(510, 300, (get("shaft-after-grooves").x1 + get("shaft-after-grooves").x2) / 2, y0 - 65, "Ø 3,70")}
    ${leader(690, 215, get("thin-flange").x1 + 4, y0 - 100, "Ø6,50")}
    ${leader(790, 235, (get("faceted-zone").x1 + get("faceted-zone").x2) / 2, y0 - 75, "Ø5,0 / facetado")}
    ${leader(860, 315, (get("diamond-235").x1 + get("diamond-235").x2) / 2, y0 - 35, "Ø 2,35 D")}
    ${leader(1010, 330, (get("diamond-215").x1 + get("diamond-215").x2) / 2, y0 - 30, "Ø 2,15 D")}
    ${leader(1240, 335, (get("diamond-175").x1 + get("diamond-175").x2) / 2, y0 - 20, "Ø 1,75 D")}
    ${leader(1510, 355, get("pointed-tip").x2 - 35, y0 - 16, "45°")}
    ${text(1030, 880, "D = superfície diamantada", 'text-anchor="middle" font-size="30" font-weight="700"')}
  `;

  const grooveDetail = `
    <g transform="translate(220 95)">
      <path d="M0 40 L45 40 L65 78 L125 78 L145 40 L190 40" fill="none" stroke="#111827" stroke-width="3"/>
      ${dim(45, 145, 15, "0,50", "#22c55e")}
      ${text(18, 100, "45°", 'font-size="20" fill="#22c55e"')}
    </g>
  `;

  const boundsLines = bounds
    .map((bound) => line(bound.x1, y0 - 130, bound.x1, y0 + 170, 'stroke="#e5e7eb" stroke-width="0.8" stroke-dasharray="5 5"'))
    .join("\n");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <marker id="arrow-orange" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M10 0 L0 5 L10 10 z" fill="#f97316"/>
        </marker>
        <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M10 0 L0 5 L10 10 z" fill="#22c55e"/>
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="white"/>
      ${topNotes}
      ${grooveDetail}
      ${boundsLines}
      ${line(x0 - 20, y0, drawingRight + 20, y0, 'stroke="#94a3b8" stroke-width="1" stroke-dasharray="8 6"')}
      <polygon points="${outline}" fill="none" stroke="#083344" stroke-width="3"/>
      ${dims}
      ${labels.replaceAll("\\n", " ")}
      ${text(80, 850, "* 10,40 foi usado para fechar a cota total de 38,0 mm. Validar contra a leitura original 10,00 / 10,20 c.", 'font-size="15" fill="#b45309"')}
      ${text(80, 875, "Arquivo preliminar: rosca, diamantado, raios, chanfros e facetado foram simplificados para conversa técnica.", 'font-size="15" fill="#b45309"')}
    </svg>
  `.trim();
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const sourcePreview = resolve(__dirname, "preview/Cylinder Pointed Bur 12s MCXL nova chinesa.pptx.png");
  await copyFile(sourcePreview, resolve(outputDir, "source-slide.png"));

  const sourceStyleSvg = buildSourceStyleSvg();
  const v1Drawing = render2D(spec, semanticDocument);
  const a3Drawing = renderA3(spec, semanticDocument);
  const model3d = await render3D(spec, semanticDocument);
  const step = await renderStep(spec, semanticDocument);

  await writeFile(resolve(outputDir, "cylinder-pointed-bur-12s-mcxl.spec.json"), JSON.stringify(spec, null, 2));
  await writeFile(resolve(outputDir, "cylinder-pointed-bur-12s-mcxl.desenho-fonte-limpo.svg"), sourceStyleSvg);
  await writeFile(resolve(outputDir, "cylinder-pointed-bur-12s-mcxl.desenho-v1.svg"), v1Drawing.drawingSvg);
  await writeFile(resolve(outputDir, "cylinder-pointed-bur-12s-mcxl.a3.svg"), a3Drawing.drawingSvg);

  if (model3d.glbBase64) {
    await writeFile(resolve(outputDir, "cylinder-pointed-bur-12s-mcxl.glb"), Buffer.from(model3d.glbBase64, "base64"));
  }

  if (step.stepText) {
    await writeFile(resolve(outputDir, "cylinder-pointed-bur-12s-mcxl.step"), step.stepText);
  }

  const viewerHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cylinder Pointed Bur 12s MCXL nova - 3D</title>
    <style>
      html,
      body {
        margin: 0;
        width: 100%;
        height: 100%;
        background: #f8fafc;
        font-family: Arial, Helvetica, sans-serif;
      }
      #app {
        width: 100vw;
        height: 100vh;
      }
      .label {
        position: fixed;
        left: 24px;
        top: 20px;
        color: #0f172a;
        line-height: 1.35;
      }
      .label h1 {
        margin: 0 0 6px;
        font-size: 20px;
      }
      .label p {
        margin: 0;
        font-size: 13px;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <div class="label">
      <h1>Cylinder Pointed Bur 12s MCXL nova</h1>
      <p>Modelo 3D preliminar. Diamantado, rosca e facetado simplificados.</p>
    </div>
    <script type="importmap">
      {
        "imports": {
          "three": "/node_modules/three/build/three.module.js"
        }
      }
    </script>
    <script type="module">
      import * as THREE from "/node_modules/three/build/three.module.js";
      import { OrbitControls } from "/node_modules/three/examples/jsm/controls/OrbitControls.js";
      import { GLTFLoader } from "/node_modules/three/examples/jsm/loaders/GLTFLoader.js";

      const app = document.getElementById("app");
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#f8fafc");

      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(36, 18, 28);

      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      app.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, 0, 0);

      scene.add(new THREE.HemisphereLight("#ffffff", "#94a3b8", 2.2));
      const key = new THREE.DirectionalLight("#ffffff", 2.5);
      key.position.set(20, 30, 15);
      scene.add(key);

      const grid = new THREE.GridHelper(48, 24, "#cbd5e1", "#e2e8f0");
      grid.rotation.z = Math.PI / 2;
      scene.add(grid);

      const loader = new GLTFLoader();
      loader.load("./cylinder-pointed-bur-12s-mcxl.glb", (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: "#64748b",
              metalness: 0.45,
              roughness: 0.28,
            });
          }
        });
        scene.add(model);
      });

      function animate() {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }

      animate();

      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    </script>
  </body>
</html>`;
  await writeFile(resolve(outputDir, "viewer-3d.html"), viewerHtml);

  const report = `# Cylinder Pointed Bur 12s MCXL nova - geração preliminar

Fonte: /Users/rafaelalmeida/Downloads/Cylinder Pointed Bur 12s MCXL nova chinesa.pptx

## Saídas geradas

- source-slide.png: prévia renderizada do PPTX original.
- cylinder-pointed-bur-12s-mcxl.desenho-fonte-limpo.svg: redesenho 2D limpo no estilo do slide.
- cylinder-pointed-bur-12s-mcxl.desenho-v1.svg: saída do renderer 2D atual do módulo.
- cylinder-pointed-bur-12s-mcxl.a3.svg: folha A3 técnica preliminar.
- cylinder-pointed-bur-12s-mcxl.glb: modelo 3D para visualização.
- cylinder-pointed-bur-12s-mcxl.step: STEP preliminar.
- cylinder-pointed-bur-12s-mcxl.spec.json: especificação estruturada usada para gerar os arquivos.
- viewer-3d.html: visualizador local do GLB.

## Validação

- 2D canExport: ${v1Drawing.validationReport.canExport}
- A3 canExport: ${a3Drawing.validationReport.canExport}
- 3D status: ${model3d.previewStatus}
- 3D bounding box: ${JSON.stringify(model3d.boundingBoxMm)}
- 3D mesh summary: ${JSON.stringify(model3d.meshSummary)}
- STEP status: ${step.previewStatus}
- STEP shape summary: ${JSON.stringify(step.shapeSummary)}
- STEP blocking reasons: ${step.blockingReasons.length ? step.blockingReasons.join("; ") : "nenhum"}

## Pontos para validar com o especialista

1. A leitura das cotas parciais não fecha de forma óbvia com o total de 38,0 mm. Ajustei o trecho do corpo para 10,40 mm para fechar o modelo.
2. Rosca M3,5 x 0,35 foi modelada como zona nominal, sem hélice real.
3. Superfície diamantada D foi modelada apenas por envelopes cilíndricos.
4. Facetado 3x a 120 graus foi modelado como cilindro Ø5,0.
5. Raios R0,3/R0,5 e chanfros 45 graus/0,2x30 graus aparecem como notas, mas não entram no STEP V1.
6. A ponta foi modelada como cone truncado preliminar; confirmar a geometria real.
`;
  await writeFile(resolve(outputDir, "relatorio-geracao.md"), report);

  console.log(JSON.stringify({
    outputDir,
    canExport: v1Drawing.validationReport.canExport,
    model3d: {
      status: model3d.previewStatus,
      boundingBoxMm: model3d.boundingBoxMm,
      meshSummary: model3d.meshSummary,
    },
    step: {
      status: step.previewStatus,
      shapeSummary: step.shapeSummary,
      bytes: step.stepText?.length ?? 0,
    },
  }, null, 2));
}

await main();

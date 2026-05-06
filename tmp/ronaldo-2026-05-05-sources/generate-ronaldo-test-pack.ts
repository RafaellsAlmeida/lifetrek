import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import pptxgenjs from "pptxgenjs";

import { render2D } from "../../src/lib/engineering-drawing/render2d";
import { renderA3 } from "../../src/lib/engineering-drawing/renderA3";
import { render3D } from "../../src/lib/engineering-drawing/render3d";
import { renderStep } from "../../src/lib/engineering-drawing/renderStep";
import { createEmptySemanticDocument, type AxisymmetricPartSpec, type AxisymmetricSegment } from "../../src/lib/engineering-drawing/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, "outputs");
const renderDir = resolve(__dirname, "renders");

type CaseDefinition = {
  slug: string;
  spec: AxisymmetricPartSpec;
  sourceFile: string;
  sourcePreview: string | null;
  reviewNotes: string[];
};

function segment(args: Partial<AxisymmetricSegment> & Pick<AxisymmetricSegment, "id" | "label" | "kind" | "lengthMm" | "startDiameterMm">): AxisymmetricSegment {
  return {
    endDiameterMm: args.endDiameterMm ?? args.startDiameterMm,
    externalShape: args.externalShape ?? "round",
    acrossFlatsMm: args.acrossFlatsMm ?? null,
    threadDesignation: args.threadDesignation ?? null,
    threadPitchMm: args.threadPitchMm ?? null,
    chamferStartMm: args.chamferStartMm ?? null,
    chamferStartAngleDeg: args.chamferStartAngleDeg ?? null,
    chamferEndMm: args.chamferEndMm ?? null,
    chamferEndAngleDeg: args.chamferEndAngleDeg ?? null,
    filletStartRadiusMm: args.filletStartRadiusMm ?? null,
    filletEndRadiusMm: args.filletEndRadiusMm ?? null,
    note: args.note ?? null,
    confidence: args.confidence ?? 0.65,
    ...args,
  };
}

const commonUnsupported = [
  {
    id: "diamond-surface",
    label: "Superficie diamantada D",
    note: "Textura diamantada preservada como nota; STEP V1 usa envelope geometrico sem textura.",
    confidence: 0.8,
  },
  {
    id: "faceted-zone",
    label: "Facetado 3x a 120 graus",
    note: "Facetado indicado como Ø5,0 com 2,10 centro ao facetado; modelado como envelope cilindrico nesta versao.",
    confidence: 0.65,
  },
  {
    id: "radii-and-chamfers",
    label: "Raios e chanfros finos",
    note: "R0,3/R0,5 e chanfros aparecem no desenho, mas nao sao aplicados na geometria STEP V1.",
    confidence: 0.7,
  },
];

const cases: CaseDefinition[] = [
  {
    slug: "cylinder-pointed-bur-12s-mcxl-nova",
    sourceFile: "/Users/rafaelalmeida/Downloads/Cylinder Pointed Bur 12s MCXL nova chinesa.pptx",
    sourcePreview: resolve(renderDir, "Cylinder Pointed Bur 12s MCXL nova chinesa.pptx.png"),
    spec: {
      partName: "Cylinder Pointed Bur 12s MCXL nova",
      drawingNumber: "RONALDO-CYL-12S-MCXL-NOVA-PRELIM",
      unit: "mm",
      totalLengthMm: 38,
      segments: [
        segment({ id: "thread", label: "Rosca M3,5 x 0,35", kind: "thread", lengthMm: 5.2, startDiameterMm: 3.5, threadDesignation: "M3,5", threadPitchMm: 0.35, confidence: 0.82 }),
        segment({ id: "body", label: "Corpo Ø3,50 ate cone", kind: "cylinder", lengthMm: 10.4, startDiameterMm: 3.5, note: "Fonte mostra 10,00; foi usado 10,40 para fechar o total 38,0. Validar.", confidence: 0.45 }),
        segment({ id: "cone", label: "Cone 10 graus", kind: "taper", lengthMm: 7.2, startDiameterMm: 3.7, endDiameterMm: 6.5, confidence: 0.75 }),
        segment({ id: "flange", label: "Flange Ø6,50", kind: "cylinder", lengthMm: 0.4, startDiameterMm: 6.5, confidence: 0.75 }),
        segment({ id: "facet-envelope", label: "Envelope facetado Ø5,0", kind: "cylinder", lengthMm: 1.2, startDiameterMm: 5, note: "Facetado 3x 120 graus simplificado.", confidence: 0.55 }),
        segment({ id: "diamond-235", label: "D Ø2,35", kind: "cylinder", lengthMm: 1.6, startDiameterMm: 2.35, confidence: 0.72 }),
        segment({ id: "diamond-215", label: "D Ø2,15", kind: "cylinder", lengthMm: 4, startDiameterMm: 2.15, confidence: 0.72 }),
        segment({ id: "diamond-175", label: "D Ø1,75", kind: "cylinder", lengthMm: 6.8, startDiameterMm: 1.75, note: "A cota 8,00 inclui este trecho mais a ponta de 1,20.", confidence: 0.68 }),
        segment({ id: "tip", label: "Ponta 45 graus", kind: "taper", lengthMm: 1.2, startDiameterMm: 1.75, endDiameterMm: 1.2, filletEndRadiusMm: 0.5, confidence: 0.58 }),
      ],
      axialBores: [],
      notes: [
        "Preliminar gerado do PPTX padrao Ronaldo.",
        "A cota inferior de 10,00 nao fecha com o total 38,0 quando combinada com as demais cotas; ajuste marcado para revisao.",
        "D = superficie diamantada.",
      ],
      unsupportedFeatures: [
        ...commonUnsupported,
        {
          id: "green-grooves",
          label: "Canaletas Ø3,35 2x, 0,50 a 45 graus",
          note: "Detalhe verde preservado como nota; nao foi subdividido na geometria para evitar inventar posicao.",
          confidence: 0.72,
        },
      ],
    },
    reviewNotes: [
      "Confirmar por que a soma das cotas parciais fica 0,40 mm menor que o total 38,0.",
      "Confirmar se a ponta final deve terminar em Ø1,20 ou fechar em ponta.",
      "Confirmar como representar as duas canaletas verdes no STEP.",
    ],
  },
  {
    slug: "cylinder-pointed-bur-20s-mcxl-usada",
    sourceFile: "/Users/rafaelalmeida/Downloads/Cylinder Pointed Bur 20s MCXL usada.pptx",
    sourcePreview: resolve(renderDir, "Cylinder Pointed Bur 20s MCXL usada.pptx.png"),
    spec: {
      partName: "Cylinder Pointed Bur 20s MCXL usada",
      drawingNumber: "RONALDO-CYL-20S-MCXL-USADA-PRELIM",
      unit: "mm",
      totalLengthMm: 46,
      segments: [
        segment({ id: "thread", label: "Rosca M3,5 x 0,35", kind: "thread", lengthMm: 4.5, startDiameterMm: 3.5, threadDesignation: "M3,5", threadPitchMm: 0.35, confidence: 0.82 }),
        segment({ id: "body", label: "Corpo Ø3,50", kind: "cylinder", lengthMm: 10.8, startDiameterMm: 3.5, confidence: 0.8 }),
        segment({ id: "cone", label: "Cone 10 graus", kind: "taper", lengthMm: 7.2, startDiameterMm: 3.7, endDiameterMm: 6.5, confidence: 0.78 }),
        segment({ id: "flange", label: "Flange Ø6,50", kind: "cylinder", lengthMm: 0.4, startDiameterMm: 6.5, confidence: 0.75 }),
        segment({ id: "residual", label: "Trecho residual para fechar total", kind: "cylinder", lengthMm: 0.4, startDiameterMm: 6.5, note: "Cotas inferiores somam 45,60; este trecho fecha 46,00 e precisa ser validado.", confidence: 0.35 }),
        segment({ id: "facet-envelope", label: "Envelope facetado Ø5,0", kind: "cylinder", lengthMm: 1.2, startDiameterMm: 5, confidence: 0.55 }),
        segment({ id: "diamond-235", label: "D Ø2,35", kind: "cylinder", lengthMm: 5.5, startDiameterMm: 2.35, confidence: 0.76 }),
        segment({ id: "diamond-215", label: "D Ø2,15", kind: "cylinder", lengthMm: 4, startDiameterMm: 2.15, confidence: 0.78 }),
        segment({ id: "diamond-175", label: "D Ø1,75", kind: "cylinder", lengthMm: 4, startDiameterMm: 1.75, confidence: 0.78 }),
        segment({ id: "diamond-135", label: "D Ø1,35", kind: "cylinder", lengthMm: 7, startDiameterMm: 1.35, note: "A cota 8,00 inclui este trecho mais a ponta de 1,00.", confidence: 0.65 }),
        segment({ id: "tip", label: "Ponta 45 graus", kind: "taper", lengthMm: 1, startDiameterMm: 1.35, endDiameterMm: 0.9, confidence: 0.55 }),
      ],
      axialBores: [],
      notes: [
        "Preliminar gerado do PPTX padrao Ronaldo.",
        "Cotas inferiores somam 45,60 mm; total informado e 46,00 mm. Residuo de 0,40 mm marcado como validacao.",
        "D = superficie diamantada.",
      ],
      unsupportedFeatures: [
        ...commonUnsupported,
        {
          id: "cross-hole",
          label: "Furo transversal Ø0,50",
          note: "Furo transversal indicado no desenho, mas o schema/STEP V1 so suporta furo axial simples.",
          confidence: 0.8,
        },
      ],
    },
    reviewNotes: [
      "Confirmar onde entra o residuo de 0,40 mm entre as cotas inferiores e o total 46,00.",
      "Confirmar se o furo Ø0,50 e transversal e se deve ser modelado no STEP.",
      "Confirmar geometria da ponta 45 graus.",
    ],
  },
  {
    slug: "step-bur-20s-mcxl-usada",
    sourceFile: "/Users/rafaelalmeida/Downloads/Step Bur 20s MCXL usada.pdf.pptx",
    sourcePreview: resolve(renderDir, "Step Bur 20s MCXL usada.pdf.pptx.png"),
    spec: {
      partName: "Step Bur 20s MCXL usada",
      drawingNumber: "RONALDO-STEP-20S-MCXL-USADA-PRELIM",
      unit: "mm",
      totalLengthMm: 46,
      segments: [
        segment({ id: "thread", label: "Rosca M3,5 x 0,35", kind: "thread", lengthMm: 4.5, startDiameterMm: 3.5, threadDesignation: "M3,5", threadPitchMm: 0.35, confidence: 0.82 }),
        segment({ id: "body", label: "Corpo Ø3,50", kind: "cylinder", lengthMm: 10.8, startDiameterMm: 3.5, confidence: 0.8 }),
        segment({ id: "cone", label: "Cone 10 graus", kind: "taper", lengthMm: 7.2, startDiameterMm: 3.7, endDiameterMm: 6.5, confidence: 0.78 }),
        segment({ id: "flange", label: "Flange Ø6,50", kind: "cylinder", lengthMm: 0.4, startDiameterMm: 6.5, confidence: 0.75 }),
        segment({ id: "residual", label: "Trecho residual para fechar total", kind: "cylinder", lengthMm: 0.4, startDiameterMm: 6.5, note: "Cotas inferiores somam 45,60; este trecho fecha 46,00 e precisa ser validado.", confidence: 0.35 }),
        segment({ id: "facet-envelope", label: "Envelope facetado Ø5,0", kind: "cylinder", lengthMm: 1.2, startDiameterMm: 5, confidence: 0.55 }),
        segment({ id: "diamond-235", label: "D Ø2,35", kind: "cylinder", lengthMm: 5.5, startDiameterMm: 2.35, confidence: 0.76 }),
        segment({ id: "diamond-215", label: "D Ø2,15", kind: "cylinder", lengthMm: 4, startDiameterMm: 2.15, confidence: 0.78 }),
        segment({ id: "diamond-175", label: "D Ø1,75", kind: "cylinder", lengthMm: 4, startDiameterMm: 1.75, confidence: 0.78 }),
        segment({ id: "diamond-135", label: "D Ø1,35", kind: "cylinder", lengthMm: 4, startDiameterMm: 1.35, confidence: 0.78 }),
        segment({ id: "diamond-100", label: "D Ø1,00", kind: "cylinder", lengthMm: 4, startDiameterMm: 1, confidence: 0.78 }),
      ],
      axialBores: [],
      notes: [
        "Preliminar gerado do PDF/PPTX padrao Ronaldo.",
        "Cotas inferiores somam 45,60 mm; total informado e 46,00 mm. Residuo de 0,40 mm marcado como validacao.",
        "D = superficie diamantada.",
      ],
      unsupportedFeatures: [
        ...commonUnsupported,
        {
          id: "cross-hole",
          label: "Furo transversal Ø0,50",
          note: "Furo transversal indicado no desenho, mas o schema/STEP V1 so suporta furo axial simples.",
          confidence: 0.8,
        },
      ],
    },
    reviewNotes: [
      "Confirmar onde entra o residuo de 0,40 mm entre as cotas inferiores e o total 46,00.",
      "Confirmar se o furo Ø0,50 e transversal e se deve ser modelado no STEP.",
      "Confirmar se o ultimo trecho Ø1,0 D tem exatamente 4,00 mm.",
    ],
  },
  {
    slug: "croqui-116037",
    sourceFile: "/Users/rafaelalmeida/Downloads/Untitled croquegn.png",
    sourcePreview: "/Users/rafaelalmeida/Downloads/Untitled croquegn.png",
    spec: {
      partName: "Croqui 116.037",
      drawingNumber: "116.037-PRELIM",
      unit: "mm",
      totalLengthMm: 3.7,
      segments: [
        segment({ id: "head", label: "Cabeca/corpo Ø1,666", kind: "cylinder", lengthMm: 1.7, startDiameterMm: 1.666, note: "Croqui tambem indica hexagono/furo interno; profundidade nao definida.", confidence: 0.48 }),
        segment({ id: "neck", label: "Pescoço Ø1,0", kind: "cylinder", lengthMm: 0.51, startDiameterMm: 1, confidence: 0.58 }),
        segment({ id: "thread", label: "Rosca M1,4 x 0,3", kind: "thread", lengthMm: 1.49, startDiameterMm: 1.4, threadDesignation: "M1,4", threadPitchMm: 0.3, confidence: 0.62 }),
      ],
      axialBores: [],
      notes: [
        "Preliminar extraido do croqui 116.037.",
        "Hexagono 1,2 e broca 1,2 aparecem no croqui, mas a profundidade da broca esta marcada como pergunta.",
        "Nao liberar STEP sem Ronaldo confirmar profundidade do furo/hexagono.",
      ],
      unsupportedFeatures: [
        {
          id: "internal-hex",
          label: "Hexagono interno 1,2",
          note: "Vista frontal indica hexagono 1,2 com tolerancias +0,025/+0,010; profundidade nao legivel.",
          confidence: 0.7,
        },
        {
          id: "drill-depth",
          label: "Broca Ø1,2 com profundidade indefinida",
          note: "Croqui pergunta 'prof. broca?'. Deve bloquear liberacao de fabricacao.",
          confidence: 0.8,
        },
      ],
    },
    reviewNotes: [
      "Confirmar se 116.037 e o codigo/desenho da peça.",
      "Confirmar profundidade da broca Ø1,2 e do hexagono interno 1,2.",
      "Confirmar comprimento da rosca direita: o croqui parece mostrar 1,5/1,8, mas o total 3,7 com 1,7 + 0,51 deixa 1,49.",
    ],
  },
];

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatMm(value: number | null) {
  if (typeof value !== "number") return "?";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: value % 1 === 0 ? 2 : 2, maximumFractionDigits: 2 });
}

function line(x1: number, y1: number, x2: number, y2: number, attrs = "") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;
}

function text(x: number, y: number, value: string, attrs = "") {
  return `<text x="${x}" y="${y}" ${attrs}>${escapeXml(value)}</text>`;
}

function buildOutline(spec: AxisymmetricPartSpec, x0: number, y0: number, xScale: number, yScale: number) {
  let cursor = 0;
  const top: string[] = [];
  const bottom: string[] = [];
  const bounds: Array<{ segment: AxisymmetricSegment; x1: number; x2: number; d1: number; d2: number }> = [];

  spec.segments.forEach((item) => {
    const length = item.lengthMm ?? 0;
    const d1 = item.startDiameterMm ?? 0;
    const d2 = item.endDiameterMm ?? d1;
    const x1 = x0 + cursor * xScale;
    const x2 = x0 + (cursor + length) * xScale;
    top.push(`${x1},${y0 - (d1 * yScale) / 2}`, `${x2},${y0 - (d2 * yScale) / 2}`);
    bottom.unshift(`${x2},${y0 + (d2 * yScale) / 2}`, `${x1},${y0 + (d1 * yScale) / 2}`);
    bounds.push({ segment: item, x1, x2, d1, d2 });
    cursor += length;
  });

  return { outline: [...top, ...bottom].join(" "), bounds, xEnd: x0 + cursor * xScale };
}

function dim(x1: number, x2: number, y: number, label: string) {
  const mid = (x1 + x2) / 2;
  return `
    ${line(x1, y - 20, x1, y + 20, 'stroke="#f97316" stroke-width="1.2"')}
    ${line(x2, y - 20, x2, y + 20, 'stroke="#f97316" stroke-width="1.2"')}
    ${line(x1, y, x2, y, 'stroke="#f97316" stroke-width="1.4" marker-start="url(#arrow-orange)" marker-end="url(#arrow-orange)"')}
    ${text(mid, y - 8, label, 'text-anchor="middle" font-size="20" fill="#111827"')}
  `;
}

function leader(x1: number, y1: number, x2: number, y2: number, label: string, color = "#f97316") {
  const marker = color === "#0ea5e9" ? "blue" : "orange";
  return `
    ${line(x1, y1, x2, y2, `stroke="${color}" stroke-width="1.6" marker-end="url(#arrow-${marker})"`)}
    ${text(x1, y1 - 8, label, 'text-anchor="middle" font-size="20" fill="#111827"')}
  `;
}

function buildRonaldoStyleSvg(definition: CaseDefinition) {
  const { spec } = definition;
  const width = 1800;
  const height = 1040;
  const x0 = 80;
  const y0 = 470;
  const total = spec.totalLengthMm ?? spec.segments.reduce((sum, item) => sum + (item.lengthMm ?? 0), 0);
  const xScale = 1360 / total;
  const maxDiameter = Math.max(...spec.segments.flatMap((item) => [item.startDiameterMm ?? 0, item.endDiameterMm ?? item.startDiameterMm ?? 0]));
  const yScale = maxDiameter > 3 ? 78 : 190;
  const { outline, bounds, xEnd } = buildOutline(spec, x0, y0, xScale, yScale);
  const title = spec.partName;

  const bottomDims = bounds
    .map((bound, index) => {
      const y = 690 + (index % 3) * 44;
      const label = `${formatMm(bound.segment.lengthMm)}${bound.segment.confidence !== null && bound.segment.confidence < 0.5 ? "*" : ""}`;
      return dim(bound.x1, bound.x2, y, label);
    })
    .join("\n");

  const diameterLeaders = bounds
    .filter((bound, index) => {
      if (index === 0) return true;
      const prev = bounds[index - 1];
      return Math.abs(bound.d1 - prev.d2) > 0.05 || bound.segment.kind === "thread" || bound.segment.label.includes("D ");
    })
    .map((bound, index) => {
      const targetX = (bound.x1 + bound.x2) / 2;
      const targetY = y0 - (Math.max(bound.d1, bound.d2) * yScale) / 2;
      const label =
        bound.segment.kind === "thread"
          ? bound.segment.threadDesignation
            ? `Rosca ${bound.segment.threadDesignation}x${String(bound.segment.threadPitchMm).replace(".", ",")}`
            : bound.segment.label
          : `Ø ${formatMm(bound.d1).replace(",00", "")}`;
      return leader(Math.min(Math.max(targetX, 130), 1540), 250 + (index % 4) * 42, targetX, targetY - 8, label, bound.segment.label.includes("facet") ? "#0ea5e9" : "#f97316");
    })
    .join("\n");

  const notes = [...spec.notes, ...definition.reviewNotes.map((item) => `Validar: ${item}`)]
    .slice(0, 7)
    .map((item, index) => text(70, 895 + index * 22, `- ${item}`, 'font-size="16" fill="#92400e"'))
    .join("\n");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <marker id="arrow-orange" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M10 0 L0 5 L10 10 z" fill="#f97316"/>
        </marker>
        <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M10 0 L0 5 L10 10 z" fill="#0ea5e9"/>
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="white"/>
      ${text(1420, 70, title, 'text-anchor="middle" font-size="34" font-weight="700"')}
      ${line(x0 - 20, y0, xEnd + 20, y0, 'stroke="#94a3b8" stroke-width="1" stroke-dasharray="8 6"')}
      <polygon points="${outline}" fill="none" stroke="#083344" stroke-width="3"/>
      ${bounds.map((bound) => line(bound.x1, y0 - 170, bound.x1, 820, 'stroke="#e5e7eb" stroke-width="0.7" stroke-dasharray="5 5"')).join("\n")}
      ${bottomDims}
      ${dim(x0, xEnd, 840, formatMm(spec.totalLengthMm))}
      ${diameterLeaders}
      ${text(1420, 970, "D = superficie diamantada quando indicado", 'text-anchor="middle" font-size="28" font-weight="700"')}
      ${notes}
    </svg>
  `.trim();
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function writePptx(svg: string, filePath: string, title: string) {
  const PptxGen = typeof pptxgenjs === "function" ? pptxgenjs : (pptxgenjs as { default: typeof pptxgenjs }).default;
  const pptx = new PptxGen();
  pptx.defineLayout({ name: "RONALDO_TECH", width: 13.333, height: 7.704 });
  pptx.layout = "RONALDO_TECH";
  pptx.author = "Lifetrek Medical";
  pptx.company = "Lifetrek Medical";
  pptx.subject = "Desenho tecnico preliminar";
  pptx.title = title;
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addImage({ data: svgToDataUri(svg), x: 0, y: 0, w: 13.333, h: 7.704 });
  await pptx.writeFile({ fileName: filePath });
}

function buildViewerHtml(slug: string, title: string) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeXml(title)} - 3D</title>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; }
      #app { width: 100vw; height: 100vh; }
      .label { position: fixed; left: 24px; top: 20px; color: #0f172a; line-height: 1.35; }
      .label h1 { margin: 0 0 6px; font-size: 20px; }
      .label p { margin: 0; font-size: 13px; color: #475569; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <div class="label"><h1>${escapeXml(title)}</h1><p>Modelo preliminar. Validar com Ronaldo antes de fabricar.</p></div>
    <script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script>
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
      scene.add(new THREE.HemisphereLight("#ffffff", "#94a3b8", 2.2));
      const key = new THREE.DirectionalLight("#ffffff", 2.5);
      key.position.set(20, 30, 15);
      scene.add(key);
      const grid = new THREE.GridHelper(56, 28, "#cbd5e1", "#e2e8f0");
      grid.rotation.z = Math.PI / 2;
      scene.add(grid);
      new GLTFLoader().load("./${slug}.glb", (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) child.material = new THREE.MeshStandardMaterial({ color: "#64748b", metalness: 0.45, roughness: 0.28 });
        });
        scene.add(gltf.scene);
      });
      function animate() { controls.update(); renderer.render(scene, camera); requestAnimationFrame(animate); }
      animate();
      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    </script>
  </body>
</html>`;
}

async function processCase(definition: CaseDefinition) {
  const caseDir = resolve(outputDir, definition.slug);
  await mkdir(caseDir, { recursive: true });

  if (definition.sourcePreview) {
    await copyFile(definition.sourcePreview, resolve(caseDir, "fonte.png")).catch(() => undefined);
  }

  const semanticDocument = createEmptySemanticDocument(definition.spec.partName);
  semanticDocument.documentMetadata.drawingNumber = definition.spec.drawingNumber;
  semanticDocument.documentMetadata.governingStandard = { system: "ISO", edition: null, source: "manual" };
  semanticDocument.reviewDecision = {
    approved: false,
    approvedWithWarnings: true,
    reviewerId: "codex-preliminar",
    reviewedAt: new Date().toISOString(),
    comments: "Gerado para revisao do Ronaldo. Nao liberar para fabricacao.",
  };

  const cleanSvg = buildRonaldoStyleSvg(definition);
  const drawing2d = render2D(definition.spec, semanticDocument);
  const drawingA3 = renderA3(definition.spec, semanticDocument);
  const renderableSpec: AxisymmetricPartSpec = {
    ...definition.spec,
    notes: [
      ...definition.spec.notes,
      ...definition.spec.unsupportedFeatures.map((feature) => `Simplificado no 3D/STEP preliminar: ${feature.label}. ${feature.note}`),
    ],
    unsupportedFeatures: [],
  };
  const model3d = await render3D(renderableSpec, semanticDocument);
  const step = await renderStep(renderableSpec, semanticDocument);

  await writeFile(resolve(caseDir, `${definition.slug}.spec.json`), JSON.stringify(definition.spec, null, 2));
  await writeFile(resolve(caseDir, `${definition.slug}.render-spec.json`), JSON.stringify(renderableSpec, null, 2));
  await writeFile(resolve(caseDir, `${definition.slug}.desenho-ronaldo.svg`), cleanSvg);
  await writeFile(resolve(caseDir, `${definition.slug}.desenho-v1.svg`), drawing2d.drawingSvg);
  await writeFile(resolve(caseDir, `${definition.slug}.a3.svg`), drawingA3.drawingSvg);
  await writeFile(resolve(caseDir, `viewer-3d.html`), buildViewerHtml(definition.slug, definition.spec.partName));
  await writePptx(cleanSvg, resolve(caseDir, `${definition.slug}.desenho-ronaldo.pptx`), definition.spec.partName).catch(async (error) => {
    await writeFile(resolve(caseDir, `${definition.slug}.pptx-error.txt`), error instanceof Error ? error.stack ?? error.message : String(error));
  });

  if (model3d.glbBase64) {
    await writeFile(resolve(caseDir, `${definition.slug}.glb`), Buffer.from(model3d.glbBase64, "base64"));
  }
  if (step.stepText) {
    await writeFile(resolve(caseDir, `${definition.slug}.step`), step.stepText);
  }

  return {
    slug: definition.slug,
    title: definition.spec.partName,
    canExport2d: drawing2d.validationReport.canExport,
    canExportA3: drawingA3.validationReport.canExport,
    model3dStatus: model3d.previewStatus,
    stepStatus: step.previewStatus,
    stepBytes: step.stepText?.length ?? 0,
    boundingBoxMm: model3d.boundingBoxMm,
    reviewNotes: definition.reviewNotes,
    unsupportedFeatures: definition.spec.unsupportedFeatures.map((item) => item.label),
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const results = [];

  for (const definition of cases) {
    results.push(await processCase(definition));
  }

  const report = `# Pacote de teste Ronaldo - 2026-05-05

Fontes processadas:

${cases.map((item) => `- ${item.spec.partName}: ${item.sourceFile}`).join("\n")}

Arquivos principais em cada pasta:

- \`fonte.png\`: render da fonte original.
- \`*.desenho-ronaldo.svg/png/pptx\`: desenho limpo preliminar no estilo de revisao do Ronaldo.
- \`*.desenho-v1.svg\`: saida do renderer 2D atual do modulo.
- \`*.a3.svg\`: folha tecnica A3 preliminar.
- \`*.glb\`: preview 3D.
- \`*.step\`: STEP preliminar.
- \`*.spec.json\`: leitura com ambiguidades/features pendentes.
- \`*.render-spec.json\`: spec usada para gerar GLB/STEP com simplificacoes.
- \`viewer-3d.html\`: visualizador local do GLB.

## Resultado por peça

${results
  .map(
    (item) => `### ${item.title}

- Pasta: \`${item.slug}/\`
- 2D exportavel: ${item.canExport2d}
- A3 exportavel: ${item.canExportA3}
- 3D: ${item.model3dStatus}
- STEP: ${item.stepStatus} (${item.stepBytes} bytes)
- Bounding box: ${JSON.stringify(item.boundingBoxMm)}
- Features simplificadas: ${item.unsupportedFeatures.join("; ") || "nenhuma"}
- Perguntas para Ronaldo:
${item.reviewNotes.map((note) => `  - ${note}`).join("\n")}
`,
  )
  .join("\n")}

## Observacao

Os STEP/GLB deste pacote sao preliminares. O objetivo e mostrar o fluxo e coletar feedback tecnico, nao liberar arquivo para fornecedor ou fabricacao.
`;
  await writeFile(resolve(outputDir, "relatorio-lote.md"), report);
  console.log(JSON.stringify({ outputDir, results }, null, 2));
}

await main();

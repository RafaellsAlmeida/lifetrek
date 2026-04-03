import { escapeXml, formatMm, getResolvedTotalLength, resolveEndDiameter } from "./format";
import { buildRenderResult, validateAxisymmetricPartSpec } from "./validation";
import type { AxisymmetricPartSpec, AxisymmetricSegment, TechnicalDrawingRenderResult } from "./types";

type SegmentGeometry = {
  segment: AxisymmetricSegment;
  xStart: number;
  xEnd: number;
  yTopStart: number;
  yTopEnd: number;
  yBottomStart: number;
  yBottomEnd: number;
  width: number;
};

function svgLine(x1: number, y1: number, x2: number, y2: number, extra = "") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra} />`;
}

function svgText(x: number, y: number, value: string, extra = "") {
  return `<text x="${x}" y="${y}" ${extra}>${escapeXml(value)}</text>`;
}

function arrowMarker(id: string, color: string) {
  return `
    <marker id="${id}" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="${color}" />
    </marker>
  `;
}

function shapePoints(shape: "hex" | "square", cx: number, cy: number, acrossFlatsPx: number): string {
  if (shape === "square") {
    const half = acrossFlatsPx / 2;
    return `${cx - half},${cy - half} ${cx + half},${cy - half} ${cx + half},${cy + half} ${cx - half},${cy + half}`;
  }

  const radius = acrossFlatsPx / Math.sqrt(3);
  return Array.from({ length: 6 }, (_, index) => {
    const angle = ((60 * index - 30) * Math.PI) / 180;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");
}

function buildSegmentGeometry(spec: AxisymmetricPartSpec, scale: number, viewLeft: number, centerY: number): SegmentGeometry[] {
  let cursor = viewLeft;

  return spec.segments.map((segment) => {
    const length = (segment.lengthMm ?? 0) * scale;
    const startDiameter = (segment.startDiameterMm ?? 0) * scale;
    const endDiameter = (resolveEndDiameter(segment) ?? 0) * scale;
    const geometry: SegmentGeometry = {
      segment,
      xStart: cursor,
      xEnd: cursor + length,
      yTopStart: centerY - startDiameter / 2,
      yTopEnd: centerY - endDiameter / 2,
      yBottomStart: centerY + startDiameter / 2,
      yBottomEnd: centerY + endDiameter / 2,
      width: length,
    };

    cursor += length;
    return geometry;
  });
}

function buildSegmentOutline(geometry: SegmentGeometry): string {
  const { segment, xStart, xEnd, yTopStart, yTopEnd, yBottomStart, yBottomEnd } = geometry;

  const points = [
    `${xStart},${yTopStart}`,
    `${xEnd},${yTopEnd}`,
    `${xEnd},${yBottomEnd}`,
    `${xStart},${yBottomStart}`,
  ].join(" ");

  const outline = `<polygon points="${points}" fill="none" stroke="#0f172a" stroke-width="2.4" />`;

  if (segment.kind !== "thread") {
    return outline;
  }

  const zigTopY = Math.min(yTopStart, yTopEnd) + 8;
  const zigBottomY = Math.max(yBottomStart, yBottomEnd) - 8;
  const step = Math.max(6, geometry.width / 10);
  const topPath: string[] = [];
  const bottomPath: string[] = [];

  for (let x = xStart; x <= xEnd; x += step) {
    const nextX = Math.min(x + step, xEnd);
    const midX = x + (nextX - x) / 2;
    topPath.push(`${x},${zigTopY}`, `${midX},${zigTopY - 6}`, `${nextX},${zigTopY}`);
    bottomPath.push(`${x},${zigBottomY}`, `${midX},${zigBottomY + 6}`, `${nextX},${zigBottomY}`);
  }

  return `${outline}
    <polyline points="${topPath.join(" ")}" fill="none" stroke="#0f172a" stroke-width="1.2" />
    <polyline points="${bottomPath.join(" ")}" fill="none" stroke="#0f172a" stroke-width="1.2" />
  `;
}

function buildDimensionLine(xStart: number, xEnd: number, y: number, label: string, labelYOffset = -10) {
  const mid = xStart + (xEnd - xStart) / 2;
  return `
    ${svgLine(xStart, y - 16, xStart, y + 16, 'stroke="#2563eb" stroke-width="1"')}
    ${svgLine(xEnd, y - 16, xEnd, y + 16, 'stroke="#2563eb" stroke-width="1"')}
    ${svgLine(
      xStart,
      y,
      xEnd,
      y,
      'stroke="#2563eb" stroke-width="1.2" marker-start="url(#arrow-blue)" marker-end="url(#arrow-blue)"',
    )}
    ${svgText(mid, y + labelYOffset, label, 'text-anchor="middle" font-size="14" fill="#1d4ed8" font-weight="600"')}
  `;
}

export function render2D(spec: AxisymmetricPartSpec): TechnicalDrawingRenderResult {
  const validation = validateAxisymmetricPartSpec(spec);
  const totalLengthMm = getResolvedTotalLength(spec) ?? Math.max(spec.segments.length, 1);
  const maxDiameterMm = spec.segments.reduce((largest, segment) => {
    const values = [segment.startDiameterMm, resolveEndDiameter(segment), segment.acrossFlatsMm].filter(
      (value): value is number => typeof value === "number" && value > 0,
    );
    return values.length === 0 ? largest : Math.max(largest, ...values);
  }, 1);

  const width = 1200;
  const height = 760;
  const viewLeft = 120;
  const viewTop = 180;
  const viewWidth = 720;
  const centerY = 320;
  const viewHeight = 260;
  const scale = Math.min(viewWidth / Math.max(totalLengthMm, 1), viewHeight / Math.max(maxDiameterMm, 1));
  const geometry = buildSegmentGeometry(spec, scale, viewLeft, centerY);
  const drawingRight = geometry.length > 0 ? geometry[geometry.length - 1].xEnd : viewLeft + viewWidth;

  const segmentOutlines = geometry.map((item) => buildSegmentOutline(item)).join("\n");
  const segmentGuides = geometry
    .flatMap((item) => [
      svgLine(item.xStart, centerY - 140, item.xStart, centerY + 140, 'stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 4"'),
      svgLine(item.xEnd, centerY - 140, item.xEnd, centerY + 140, 'stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 4"'),
    ])
    .join("\n");

  const lengthDimensions = geometry
    .map((item, index) =>
      buildDimensionLine(
        item.xStart,
        item.xEnd,
        520 + (index % 2) * 34,
        `${formatMm(item.segment.lengthMm)} mm`,
        -10,
      ),
    )
    .join("\n");

  const overallDimension = buildDimensionLine(viewLeft, drawingRight, 620, `${formatMm(totalLengthMm)} mm`, -10);

  const diameterLeaders = geometry
    .map((item, index) => {
      const mid = item.xStart + item.width / 2;
      const yAnchor = Math.min(item.yTopStart, item.yTopEnd);
      const yText = 110 + (index % 3) * 38;
      const label =
        item.segment.kind === "thread"
          ? `${item.segment.threadDesignation ?? "Rosca"} x ${formatMm(item.segment.threadPitchMm)}`
          : `Ø${formatMm(item.segment.startDiameterMm)}${
              resolveEndDiameter(item.segment) !== item.segment.startDiameterMm
                ? ` → Ø${formatMm(resolveEndDiameter(item.segment))}`
                : ""
            }`;

      return `
        ${svgLine(mid, yAnchor, mid, yText + 8, 'stroke="#ea580c" stroke-width="1.2" marker-end="url(#arrow-orange)"')}
        ${svgText(mid, yText, label, 'text-anchor="middle" font-size="14" fill="#c2410c" font-weight="600"')}
      `;
    })
    .join("\n");

  const boreNotes = spec.axialBores
    .map(
      (bore, index) =>
        `${index + 1}. ${bore.label}: Ø${formatMm(bore.diameterMm)} mm x ${formatMm(bore.depthMm)} mm (${bore.startFrom === "left" ? "esquerda" : "direita"})`,
    )
    .join(" • ");

  const featureNotes = spec.segments.flatMap((segment, index) => {
    const notes: string[] = [];
    if (segment.filletStartRadiusMm) notes.push(`Trecho ${index + 1}: raio inicial R${formatMm(segment.filletStartRadiusMm)}`);
    if (segment.filletEndRadiusMm) notes.push(`Trecho ${index + 1}: raio final R${formatMm(segment.filletEndRadiusMm)}`);
    if (segment.chamferStartMm) {
      notes.push(`Trecho ${index + 1}: chanfro inicial ${formatMm(segment.chamferStartMm)} x ${formatMm(segment.chamferStartAngleDeg)}°`);
    }
    if (segment.chamferEndMm) {
      notes.push(`Trecho ${index + 1}: chanfro final ${formatMm(segment.chamferEndMm)} x ${formatMm(segment.chamferEndAngleDeg)}°`);
    }
    if (segment.externalShape !== "round" && segment.acrossFlatsMm) {
      notes.push(
        `Trecho ${index + 1}: ${segment.externalShape === "hex" ? "sextavado" : "quadrado"} ${formatMm(
          segment.acrossFlatsMm,
        )} mm entre faces`,
      );
    }
    if (segment.note) notes.push(`Trecho ${index + 1}: ${segment.note}`);
    return notes;
  });

  const noteLines = [
    ...spec.notes,
    ...(boreNotes ? [boreNotes] : []),
    ...featureNotes,
  ];

  const topViewSegment = spec.segments.find((segment) => segment.externalShape !== "round" && segment.acrossFlatsMm);
  const topView =
    topViewSegment && topViewSegment.acrossFlatsMm
      ? `
        <g transform="translate(900 160)">
          ${svgText(0, -20, "Vista superior", 'text-anchor="middle" font-size="16" fill="#0f172a" font-weight="700"')}
          <polygon
            points="${shapePoints(topViewSegment.externalShape as "hex" | "square", 0, 0, topViewSegment.acrossFlatsMm * scale)}"
            fill="none"
            stroke="#0f172a"
            stroke-width="2"
          />
          <circle cx="0" cy="0" r="${((topViewSegment.startDiameterMm ?? 0) * scale) / 2}" fill="none" stroke="#94a3b8" stroke-width="1.4" />
          ${buildDimensionLine(
            -((topViewSegment.acrossFlatsMm * scale) / 2),
            (topViewSegment.acrossFlatsMm * scale) / 2,
            110,
            `${topViewSegment.externalShape === "hex" ? "SW" : "SQ"} ${formatMm(topViewSegment.acrossFlatsMm)} mm`,
            -12,
          )}
        </g>
      `
      : "";

  const warningPanel = validation.issues.length
    ? `
      <g transform="translate(820 360)">
        <rect x="0" y="0" width="320" height="170" rx="16" fill="#fff7ed" stroke="#fdba74" />
        ${svgText(20, 30, "Validação", 'font-size="18" fill="#9a3412" font-weight="700"')}
        ${validation.issues
          .slice(0, 6)
          .map((issue, index) =>
            svgText(
              20,
              58 + index * 20,
              `${issue.severity === "error" ? "Erro" : issue.severity === "warning" ? "Aviso" : "Info"}: ${issue.message}`,
              'font-size="13" fill="#7c2d12"',
            ),
          )
          .join("")}
      </g>
    `
    : `
      <g transform="translate(820 360)">
        <rect x="0" y="0" width="320" height="92" rx="16" fill="#ecfdf5" stroke="#86efac" />
        ${svgText(20, 32, "Validação", 'font-size="18" fill="#166534" font-weight="700"')}
        ${svgText(20, 62, "Sem conflitos bloqueantes. Desenho pronto para revisão.", 'font-size="13" fill="#166534"')}
      </g>
    `;

  const unsupportedPanel = spec.unsupportedFeatures.length
    ? `
      <g transform="translate(820 550)">
        <rect x="0" y="0" width="320" height="${76 + spec.unsupportedFeatures.length * 20}" rx="16" fill="#fefce8" stroke="#fde047" />
        ${svgText(20, 30, "Features fora do escopo", 'font-size="18" fill="#854d0e" font-weight="700"')}
        ${spec.unsupportedFeatures
          .map((feature, index) =>
            svgText(20, 58 + index * 20, `${feature.label}: ${feature.note}`, 'font-size="13" fill="#854d0e"'),
          )
          .join("")}
      </g>
    `
    : "";

  const notesBlock = noteLines.length
    ? `
      <g transform="translate(120 680)">
        ${svgText(0, 0, "Notas", 'font-size="16" fill="#0f172a" font-weight="700"')}
        ${noteLines
          .slice(0, 6)
          .map((line, index) => svgText(0, 24 + index * 18, `• ${line}`, 'font-size="13" fill="#334155"'))
          .join("")}
      </g>
    `
    : "";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Desenho técnico preliminar">
      <defs>
        ${arrowMarker("arrow-blue", "#2563eb")}
        ${arrowMarker("arrow-orange", "#ea580c")}
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
      <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="20" fill="none" stroke="#cbd5e1" stroke-width="1.4" />
      ${svgText(40, 60, spec.partName || "Desenho técnico preliminar", 'font-size="28" fill="#0f172a" font-weight="700"')}
      ${svgText(40, 88, `Unidade: ${spec.unit.toUpperCase()} • Status: preliminar • Renderer determinístico 2D`, 'font-size="13" fill="#475569"')}
      ${svgLine(viewLeft - 24, centerY, drawingRight + 24, centerY, 'stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="6 6"')}
      ${segmentGuides}
      ${segmentOutlines}
      ${lengthDimensions}
      ${overallDimension}
      ${diameterLeaders}
      ${topView}
      ${warningPanel}
      ${unsupportedPanel}
      ${notesBlock}
      <g transform="translate(820 120)">
        <rect x="0" y="0" width="320" height="160" rx="16" fill="#f8fafc" stroke="#cbd5e1" />
        ${svgText(20, 34, "Legenda rápida", 'font-size="18" fill="#0f172a" font-weight="700"')}
        ${svgText(20, 64, "Linha azul: cotas", 'font-size="13" fill="#334155"')}
        ${svgText(20, 84, "Líder laranja: diâmetros e rosca", 'font-size="13" fill="#334155"')}
        ${svgText(20, 104, "Linhas cinza tracejadas: limites de trecho", 'font-size="13" fill="#334155"')}
        ${svgText(20, 124, "Perfis não suportados são sinalizados, nunca inventados.", 'font-size="13" fill="#334155"')}
      </g>
    </svg>
  `.trim();

  return buildRenderResult(spec, svg);
}

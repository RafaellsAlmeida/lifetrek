/**
 * A3 Technical Drawing Compositor
 *
 * Produces a full-format A3 engineering drawing SVG from a validated spec,
 * including: border with zone markers, title block, main cross-section view,
 * top view, detail views, GD&T callouts, dimension lines, and notes.
 *
 * Modelled after ISO 7200 / ASME Y14.1 drawing standards.
 */
import { escapeXml, formatMm, getResolvedTotalLength, resolveEndDiameter } from "./format";
import { buildRenderResult, validateAxisymmetricPartSpec } from "./validation";
import type {
  AxisymmetricPartSpec,
  AxisymmetricSegment,
  EngineeringDrawingSemanticDocument,
  GdtCallout,
  TechnicalDrawingRenderResult,
} from "./types";

// --- A3 canvas constants (landscape, 420×297 mm at ~3x pixel ratio) ---
const A3_WIDTH = 1260;
const A3_HEIGHT = 891;
const BORDER_MARGIN = 20;
const INNER_LEFT = BORDER_MARGIN + 10;
const INNER_TOP = BORDER_MARGIN + 10;
const INNER_RIGHT = A3_WIDTH - BORDER_MARGIN - 10;
const INNER_BOTTOM = A3_HEIGHT - BORDER_MARGIN - 10;
const INNER_WIDTH = INNER_RIGHT - INNER_LEFT;
const INNER_HEIGHT = INNER_BOTTOM - INNER_TOP;

// Title block dimensions (bottom-right, ISO 7200 proportions)
const TB_WIDTH = 360;
const TB_HEIGHT = 160;
const TB_LEFT = INNER_RIGHT - TB_WIDTH;
const TB_TOP = INNER_BOTTOM - TB_HEIGHT;

// Zone row/col labels
const ZONE_COLS = ["4", "3", "2", "1"];
const ZONE_ROWS = ["A", "B", "C", "D"];

// Colors
const LINE_COLOR = "#1a1a1a";
const DIM_COLOR = "#1a1a1a";
const THIN_LINE = 0.8;
const THICK_LINE = 2;
const DIM_LINE = 0.6;
const FONT_FAMILY = "Arial, Helvetica, sans-serif";

// ── SVG primitives ──────────────────────────────────────────────────────

function line(x1: number, y1: number, x2: number, y2: number, sw = THIN_LINE, extra = "") {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${LINE_COLOR}" stroke-width="${sw}" ${extra}/>`;
}

function dashedLine(x1: number, y1: number, x2: number, y2: number, sw = THIN_LINE) {
  return line(x1, y1, x2, y2, sw, 'stroke-dasharray="6 3"');
}

function chainLine(x1: number, y1: number, x2: number, y2: number) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${LINE_COLOR}" stroke-width="0.4" stroke-dasharray="12 3 3 3"/>`;
}

function rect(x: number, y: number, w: number, h: number, sw = THIN_LINE, fill = "none") {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${LINE_COLOR}" stroke-width="${sw}"/>`;
}

function text(x: number, y: number, value: string, size = 10, anchor = "start", weight = "normal") {
  return `<text x="${x}" y="${y}" font-family="${FONT_FAMILY}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" fill="${LINE_COLOR}">${escapeXml(value)}</text>`;
}

function textSmall(x: number, y: number, value: string, anchor = "start") {
  return text(x, y, value, 8, anchor);
}

function textLabel(x: number, y: number, value: string, anchor = "start") {
  return `<text x="${x}" y="${y}" font-family="${FONT_FAMILY}" font-size="${7}" text-anchor="${anchor}" fill="#555">${escapeXml(value)}</text>`;
}

// ── Arrow markers ───────────────────────────────────────────────────────

function arrowDefs() {
  return `
    <marker id="dim-arrow-l" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
      <path d="M8,0 L0,3 L8,6" fill="none" stroke="${DIM_COLOR}" stroke-width="0.8"/>
    </marker>
    <marker id="dim-arrow-r" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6" fill="none" stroke="${DIM_COLOR}" stroke-width="0.8"/>
    </marker>
    <marker id="leader-dot" markerWidth="4" markerHeight="4" refX="2" refY="2">
      <circle cx="2" cy="2" r="1.5" fill="${DIM_COLOR}"/>
    </marker>
  `;
}

// ── Border with zone markers ────────────────────────────────────────────

function buildBorder() {
  const parts: string[] = [];
  // Outer border
  parts.push(rect(BORDER_MARGIN, BORDER_MARGIN, A3_WIDTH - 2 * BORDER_MARGIN, A3_HEIGHT - 2 * BORDER_MARGIN, THICK_LINE));
  // Inner border
  parts.push(rect(INNER_LEFT, INNER_TOP, INNER_WIDTH, INNER_HEIGHT, THIN_LINE));

  // Zone column markers (top and bottom)
  const colWidth = INNER_WIDTH / ZONE_COLS.length;
  for (let i = 0; i < ZONE_COLS.length; i++) {
    const x = INNER_LEFT + i * colWidth;
    // Top tick
    parts.push(line(x, BORDER_MARGIN, x, INNER_TOP));
    // Bottom tick
    parts.push(line(x, INNER_BOTTOM, x, A3_HEIGHT - BORDER_MARGIN));
    // Labels
    const cx = x + colWidth / 2;
    parts.push(text(cx, BORDER_MARGIN + 12, ZONE_COLS[i], 9, "middle"));
    parts.push(text(cx, A3_HEIGHT - BORDER_MARGIN - 4, ZONE_COLS[i], 9, "middle"));
  }
  // Last column divider
  parts.push(line(INNER_RIGHT, BORDER_MARGIN, INNER_RIGHT, INNER_TOP));
  parts.push(line(INNER_RIGHT, INNER_BOTTOM, INNER_RIGHT, A3_HEIGHT - BORDER_MARGIN));

  // Zone row markers (left and right)
  const rowHeight = INNER_HEIGHT / ZONE_ROWS.length;
  for (let i = 0; i < ZONE_ROWS.length; i++) {
    const y = INNER_TOP + i * rowHeight;
    // Left tick
    parts.push(line(BORDER_MARGIN, y, INNER_LEFT, y));
    // Right tick
    parts.push(line(INNER_RIGHT, y, A3_WIDTH - BORDER_MARGIN, y));
    // Labels
    const cy = y + rowHeight / 2 + 3;
    parts.push(text(BORDER_MARGIN + 5, cy, ZONE_ROWS[i], 9, "start"));
    parts.push(text(A3_WIDTH - BORDER_MARGIN - 5, cy, ZONE_ROWS[i], 9, "end"));
  }
  // Last row divider
  parts.push(line(BORDER_MARGIN, INNER_BOTTOM, INNER_LEFT, INNER_BOTTOM));
  parts.push(line(INNER_RIGHT, INNER_BOTTOM, A3_WIDTH - BORDER_MARGIN, INNER_BOTTOM));

  // Center marks (fold marks)
  const midX = A3_WIDTH / 2;
  const midY = A3_HEIGHT / 2;
  parts.push(line(midX, BORDER_MARGIN, midX, BORDER_MARGIN - 6, THIN_LINE));
  parts.push(line(midX, A3_HEIGHT - BORDER_MARGIN, midX, A3_HEIGHT - BORDER_MARGIN + 6, THIN_LINE));
  parts.push(line(BORDER_MARGIN, midY, BORDER_MARGIN - 6, midY, THIN_LINE));
  parts.push(line(A3_WIDTH - BORDER_MARGIN, midY, A3_WIDTH - BORDER_MARGIN + 6, midY, THIN_LINE));

  return parts.join("\n");
}

// ── Title block ─────────────────────────────────────────────────────────

interface TitleBlockData {
  partName: string;
  drawingNumber: string | null;
  material: string;
  scale: string;
  toleranceStandard: string;
  drafter: string;
  date: string;
  revision: string;
  standard: string; // ISO or ASME marker
  sheetSize: string;
}

function buildTitleBlock(data: TitleBlockData) {
  const parts: string[] = [];
  const l = TB_LEFT;
  const t = TB_TOP;
  const w = TB_WIDTH;
  const h = TB_HEIGHT;

  // Outer box
  parts.push(rect(l, t, w, h, THICK_LINE));

  // Row dividers — 4 rows
  const rowH = h / 4;
  for (let i = 1; i < 4; i++) {
    parts.push(line(l, t + i * rowH, l + w, t + i * rowH));
  }

  // Row 1: DRAWN BY + SCALE
  const col1 = l + w * 0.55;
  parts.push(line(col1, t, col1, t + rowH));
  parts.push(textLabel(l + 4, t + 10, "DRAWN BY:"));
  parts.push(text(l + 4, t + 28, data.drafter, 11));
  parts.push(textSmall(l + 4, t + rowH - 4, `DATE: ${data.date}`));
  parts.push(textLabel(col1 + 4, t + 10, "SCALE:"));
  parts.push(text(col1 + 4, t + 28, data.scale, 14, "start", "bold"));

  // Row 2: MATERIAL + TITLE
  const row2Top = t + rowH;
  parts.push(line(col1, row2Top, col1, row2Top + rowH));
  parts.push(textLabel(l + 4, row2Top + 10, "MATERIAL:"));
  parts.push(text(l + 4, row2Top + 26, data.material, 10));
  parts.push(textLabel(col1 + 4, row2Top + 10, "TITLE:"));
  parts.push(text(col1 + 4, row2Top + 28, data.partName, 13, "start", "bold"));

  // Row 3: TOLERANCE + PART NO
  const row3Top = t + 2 * rowH;
  parts.push(line(col1, row3Top, col1, row3Top + rowH));
  parts.push(textLabel(l + 4, row3Top + 10, "TOLERANCE:"));
  parts.push(text(l + 4, row3Top + 26, data.toleranceStandard, 10));
  parts.push(textLabel(col1 + 4, row3Top + 10, "PART NO:"));
  parts.push(text(col1 + 4, row3Top + 28, data.drawingNumber ?? "—", 13, "start", "bold"));

  // Row 4: Standard marker + Sheet size
  const row4Top = t + 3 * rowH;
  const col2 = l + w * 0.75;
  parts.push(line(col2, row4Top, col2, row4Top + rowH));
  parts.push(textLabel(l + 4, row4Top + 10, "REV:"));
  parts.push(text(l + 4, row4Top + 26, data.revision, 12, "start", "bold"));
  parts.push(text(col1 + 4, row4Top + 20, data.standard, 11));
  parts.push(line(col1, row4Top, col1, row4Top + rowH));
  parts.push(text(col2 + 4, row4Top + 20, data.sheetSize, 11, "start", "bold"));

  return parts.join("\n");
}

// ── Segment geometry (shared with render2d) ─────────────────────────────

interface SegmentGeo {
  segment: AxisymmetricSegment;
  xStart: number;
  xEnd: number;
  yTopStart: number;
  yTopEnd: number;
  yBotStart: number;
  yBotEnd: number;
  width: number;
}

function computeSegmentGeometry(
  spec: AxisymmetricPartSpec,
  scale: number,
  originX: number,
  centerY: number,
): SegmentGeo[] {
  let cursor = originX;
  return spec.segments.map((seg) => {
    const len = (seg.lengthMm ?? 0) * scale;
    const dStart = (seg.startDiameterMm ?? 0) * scale;
    const dEnd = (resolveEndDiameter(seg) ?? 0) * scale;
    const geo: SegmentGeo = {
      segment: seg,
      xStart: cursor,
      xEnd: cursor + len,
      yTopStart: centerY - dStart / 2,
      yTopEnd: centerY - dEnd / 2,
      yBotStart: centerY + dStart / 2,
      yBotEnd: centerY + dEnd / 2,
      width: len,
    };
    cursor += len;
    return geo;
  });
}

// ── Cross-section view (main front view) ────────────────────────────────

function buildCrossSectionView(
  spec: AxisymmetricPartSpec,
  geometry: SegmentGeo[],
  centerY: number,
  viewLabel: string,
) {
  const parts: string[] = [];
  if (geometry.length === 0) return "";

  const firstX = geometry[0].xStart;
  const lastX = geometry[geometry.length - 1].xEnd;

  // Center axis (chain line)
  parts.push(chainLine(firstX - 20, centerY, lastX + 20, centerY));

  // Segment outlines
  for (const geo of geometry) {
    const { xStart, xEnd, yTopStart, yTopEnd, yBotStart, yBotEnd, segment } = geo;

    // Main outline — thick lines
    parts.push(line(xStart, yTopStart, xEnd, yTopEnd, THICK_LINE));
    parts.push(line(xStart, yBotStart, xEnd, yBotEnd, THICK_LINE));
    parts.push(line(xStart, yTopStart, xStart, yBotStart, THICK_LINE));
    parts.push(line(xEnd, yTopEnd, xEnd, yBotEnd, THICK_LINE));

    // Thread zigzag
    if (segment.kind === "thread") {
      const zigTopY = Math.min(yTopStart, yTopEnd) + 6;
      const zigBotY = Math.max(yBotStart, yBotEnd) - 6;
      const step = Math.max(4, geo.width / 12);
      const topPts: string[] = [];
      const botPts: string[] = [];
      for (let x = xStart; x <= xEnd; x += step) {
        const nx = Math.min(x + step, xEnd);
        const mx = x + (nx - x) / 2;
        topPts.push(`${x},${zigTopY}`, `${mx},${zigTopY - 4}`, `${nx},${zigTopY}`);
        botPts.push(`${x},${zigBotY}`, `${mx},${zigBotY + 4}`, `${nx},${zigBotY}`);
      }
      parts.push(`<polyline points="${topPts.join(" ")}" fill="none" stroke="${LINE_COLOR}" stroke-width="${THIN_LINE}"/>`);
      parts.push(`<polyline points="${botPts.join(" ")}" fill="none" stroke="${LINE_COLOR}" stroke-width="${THIN_LINE}"/>`);
    }

    // Section hatching for non-thread solid segments
    if (segment.kind !== "thread") {
      const hatchSpacing = 6;
      const topY = Math.min(yTopStart, yTopEnd);
      const botY = Math.max(yBotStart, yBotEnd);
      const hatchLines: string[] = [];
      for (let offset = hatchSpacing; offset < geo.width + (botY - topY); offset += hatchSpacing) {
        const x1 = xStart + offset;
        const y1 = topY;
        const x2 = xStart + offset - (botY - topY);
        const y2 = botY;
        // Clip to segment bounds
        const clippedX1 = Math.max(xStart, Math.min(xEnd, x1));
        const clippedX2 = Math.max(xStart, Math.min(xEnd, x2));
        if (clippedX1 > xStart || clippedX2 < xEnd) {
          const t1 = x1 === x2 ? 0 : (clippedX1 - x2) / (x1 - x2);
          const t2 = x1 === x2 ? 1 : (clippedX2 - x2) / (x1 - x2);
          const cy1 = y2 + t1 * (y1 - y2);
          const cy2 = y2 + t2 * (y1 - y2);
          hatchLines.push(`<line x1="${clippedX1}" y1="${cy1}" x2="${clippedX2}" y2="${cy2}" stroke="${LINE_COLOR}" stroke-width="0.3" opacity="0.3"/>`);
        }
      }
      parts.push(hatchLines.join("\n"));
    }
  }

  // Bore hatching (if bores exist, show them as dashed internal lines)
  for (const bore of spec.axialBores) {
    const boreDiaPx = (bore.diameterMm ?? 0) * (geometry[0].width / (geometry[0].segment.lengthMm ?? 1));
    // Approximate scale from first segment
    const firstSeg = geometry[0];
    const approxScale = firstSeg.width / (firstSeg.segment.lengthMm ?? 1);
    const boreRadPx = ((bore.diameterMm ?? 0) * approxScale) / 2;
    const boreDepthPx = (bore.depthMm ?? 0) * approxScale;

    if (bore.startFrom === "left") {
      const bx = firstSeg.xStart;
      parts.push(dashedLine(bx, centerY - boreRadPx, bx + boreDepthPx, centerY - boreRadPx));
      parts.push(dashedLine(bx, centerY + boreRadPx, bx + boreDepthPx, centerY + boreRadPx));
      parts.push(dashedLine(bx + boreDepthPx, centerY - boreRadPx, bx + boreDepthPx, centerY + boreRadPx));
    } else {
      const bx = geometry[geometry.length - 1].xEnd;
      parts.push(dashedLine(bx, centerY - boreRadPx, bx - boreDepthPx, centerY - boreRadPx));
      parts.push(dashedLine(bx, centerY + boreRadPx, bx - boreDepthPx, centerY + boreRadPx));
      parts.push(dashedLine(bx - boreDepthPx, centerY - boreRadPx, bx - boreDepthPx, centerY + boreRadPx));
    }
  }

  // View label below
  const midX = (firstX + lastX) / 2;
  const botY = Math.max(...geometry.map((g) => Math.max(g.yBotStart, g.yBotEnd)));
  parts.push(text(midX, botY + 50, viewLabel, 11, "middle", "bold"));

  return parts.join("\n");
}

// ── Dimension lines for cross-section ──────────────────────────────────

function buildDimensions(
  spec: AxisymmetricPartSpec,
  geometry: SegmentGeo[],
  centerY: number,
) {
  const parts: string[] = [];
  if (geometry.length === 0) return "";

  const firstX = geometry[0].xStart;
  const lastX = geometry[geometry.length - 1].xEnd;
  const botY = Math.max(...geometry.map((g) => Math.max(g.yBotStart, g.yBotEnd)));

  // Per-segment length dimensions (below the part) — stagger rows to avoid overlap
  let dimY = botY + 16;
  for (let i = 0; i < geometry.length; i++) {
    const geo = geometry[i];
    // Alternate between 3 rows (0, 1, 2) with 20px spacing to prevent overlap on short segments
    const y = dimY + (i % 3) * 20;
    // Extension lines
    parts.push(line(geo.xStart, geo.yBotStart + 2, geo.xStart, y + 4, DIM_LINE));
    parts.push(line(geo.xEnd, geo.yBotEnd + 2, geo.xEnd, y + 4, DIM_LINE));
    // Dimension line with arrows
    parts.push(`<line x1="${geo.xStart}" y1="${y}" x2="${geo.xEnd}" y2="${y}" stroke="${DIM_COLOR}" stroke-width="${DIM_LINE}" marker-start="url(#dim-arrow-l)" marker-end="url(#dim-arrow-r)"/>`);
    // Value
    const mid = (geo.xStart + geo.xEnd) / 2;
    parts.push(text(mid, y - 3, formatMm(geo.segment.lengthMm), 8, "middle"));
  }

  // Overall length dimension (below all per-segment dims — 3 rows * 20px + buffer)
  const overallY = dimY + 72;
  parts.push(line(firstX, botY + 2, firstX, overallY + 4, DIM_LINE));
  parts.push(line(lastX, botY + 2, lastX, overallY + 4, DIM_LINE));
  parts.push(`<line x1="${firstX}" y1="${overallY}" x2="${lastX}" y2="${overallY}" stroke="${DIM_COLOR}" stroke-width="${DIM_LINE}" marker-start="url(#dim-arrow-l)" marker-end="url(#dim-arrow-r)"/>`);
  const totalLen = getResolvedTotalLength(spec);
  parts.push(text((firstX + lastX) / 2, overallY - 3, formatMm(totalLen), 9, "middle", "bold"));

  // Diameter leaders (above the part) — stagger with horizontal offsets when segments are narrow
  const topY = Math.min(...geometry.map((g) => Math.min(g.yTopStart, g.yTopEnd)));
  const leaderBaseY = topY - 14;
  for (let i = 0; i < geometry.length; i++) {
    const geo = geometry[i];
    const seg = geo.segment;
    const midX = (geo.xStart + geo.xEnd) / 2;
    const anchorY = Math.min(geo.yTopStart, geo.yTopEnd);
    // Alternate between 2 vertical tiers, but also shift text horizontally for narrow segments
    const tier = i % 2;
    const leaderY = leaderBaseY - tier * 20 - Math.floor(i / 2) * 14;

    let label: string;
    if (seg.kind === "thread") {
      label = `${seg.threadDesignation ?? "M?"} x ${formatMm(seg.threadPitchMm)}`;
    } else if (seg.externalShape !== "round" && seg.acrossFlatsMm) {
      label = `${seg.externalShape === "hex" ? "hex SW" : "SQ"} ${formatMm(seg.acrossFlatsMm)}`;
    } else {
      const endD = resolveEndDiameter(seg);
      label = endD !== seg.startDiameterMm
        ? `\u00D8${formatMm(seg.startDiameterMm)} \u2192 \u00D8${formatMm(endD)}`
        : `\u00D8${formatMm(seg.startDiameterMm)}`;
    }

    // Leader line from part to label
    parts.push(line(midX, anchorY, midX, leaderY + 4, DIM_LINE));
    parts.push(text(midX, leaderY, label, 8, "middle"));
  }

  // Tolerance annotations for segments with tolerances
  for (let i = 0; i < geometry.length; i++) {
    const geo = geometry[i];
    const seg = geo.segment;
    // Show fit class on diameter if we have one (e.g. H7, g6)
    if (seg.note && /[A-Za-z]\d/.test(seg.note)) {
      const midX = (geo.xStart + geo.xEnd) / 2;
      const y = Math.min(geo.yTopStart, geo.yTopEnd) - 4;
      parts.push(textSmall(midX + 20, y, seg.note, "start"));
    }
  }

  return parts.join("\n");
}

// ── Top view ────────────────────────────────────────────────────────────

function buildTopView(
  spec: AxisymmetricPartSpec,
  scale: number,
  originX: number,
  originY: number,
  maxRadiusPx = 80,
) {
  const parts: string[] = [];

  // Find the hex/square segment for the top view — prefer hex over square
  const hexSeg = spec.segments.find((s) => s.externalShape === "hex" && s.acrossFlatsMm);
  const squareSeg = spec.segments.find((s) => s.externalShape === "square" && s.acrossFlatsMm);
  const prismSeg = hexSeg ?? squareSeg;

  // Use the prism segment's diameter for the outer circle (not max part diameter)
  const topViewDia = prismSeg
    ? Math.max(prismSeg.startDiameterMm ?? 0, resolveEndDiameter(prismSeg) ?? 0, prismSeg.acrossFlatsMm ?? 0)
    : spec.segments.reduce((max, s) => Math.max(max, s.startDiameterMm ?? 0, resolveEndDiameter(s) ?? 0), 0);

  // Cap top view size so it doesn't dominate the layout
  const maxTopViewRadiusPx = maxRadiusPx;
  const rawTopViewRadius = (topViewDia * scale) / 2;
  const topViewScale = rawTopViewRadius > maxTopViewRadiusPx ? maxTopViewRadiusPx / rawTopViewRadius : 1;
  const viewRadius = rawTopViewRadius * topViewScale;

  // Outer circle (max diameter)
  parts.push(`<circle cx="${originX}" cy="${originY}" r="${viewRadius}" fill="none" stroke="${LINE_COLOR}" stroke-width="${THICK_LINE}"/>`);

  // Inner bore circle (if exists)
  for (const bore of spec.axialBores) {
    const boreR = ((bore.diameterMm ?? 0) * scale * topViewScale) / 2;
    parts.push(`<circle cx="${originX}" cy="${originY}" r="${boreR}" fill="none" stroke="${LINE_COLOR}" stroke-width="${THIN_LINE}"/>`);
  }

  // Center cross
  parts.push(chainLine(originX - viewRadius - 12, originY, originX + viewRadius + 12, originY));
  parts.push(chainLine(originX, originY - viewRadius - 12, originX, originY + viewRadius + 12));

  // Hex or square outline
  if (prismSeg && prismSeg.acrossFlatsMm) {
    const afPx = prismSeg.acrossFlatsMm * scale * topViewScale;
    if (prismSeg.externalShape === "hex") {
      const r = afPx / Math.sqrt(3);
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = ((60 * i - 30) * Math.PI) / 180;
        return `${originX + r * Math.cos(angle)},${originY + r * Math.sin(angle)}`;
      }).join(" ");
      parts.push(`<polygon points="${pts}" fill="none" stroke="${LINE_COLOR}" stroke-width="${THICK_LINE}"/>`);
    } else {
      const half = afPx / 2;
      parts.push(rect(originX - half, originY - half, afPx, afPx, THICK_LINE));
    }

    // Dimension line for across-flats
    const afHalf = afPx / 2;
    const dimY = originY + viewRadius + 24;
    parts.push(line(originX - afHalf, originY + viewRadius + 4, originX - afHalf, dimY + 4, DIM_LINE));
    parts.push(line(originX + afHalf, originY + viewRadius + 4, originX + afHalf, dimY + 4, DIM_LINE));
    parts.push(`<line x1="${originX - afHalf}" y1="${dimY}" x2="${originX + afHalf}" y2="${dimY}" stroke="${DIM_COLOR}" stroke-width="${DIM_LINE}" marker-start="url(#dim-arrow-l)" marker-end="url(#dim-arrow-r)"/>`);
    const afLabel = `${prismSeg.externalShape === "hex" ? "hex SW" : "SQ"} ${formatMm(prismSeg.acrossFlatsMm)}`;
    parts.push(text(originX, dimY - 3, afLabel, 8, "middle"));
  }

  // View label
  parts.push(text(originX, originY + viewRadius + 48, "B) TOP VIEW", 10, "middle", "bold"));

  return parts.join("\n");
}

// ── Detail view (thread/bore closeup) ───────────────────────────────────

function buildDetailView(
  label: string,
  spec: AxisymmetricPartSpec,
  geometry: SegmentGeo[],
  segmentIndex: number,
  originX: number,
  originY: number,
  detailScale: number,
) {
  const parts: string[] = [];
  const geo = geometry[segmentIndex];
  if (!geo) return "";

  const seg = geo.segment;
  const len = (seg.lengthMm ?? 0) * detailScale;
  const dStart = (seg.startDiameterMm ?? 0) * detailScale;
  const dEnd = (resolveEndDiameter(seg) ?? 0) * detailScale;

  const cx = originX;
  const cy = originY;

  // Enlarged outline
  const x1 = cx - len / 2;
  const x2 = cx + len / 2;
  const yts = cy - dStart / 2;
  const yte = cy - dEnd / 2;
  const ybs = cy + dStart / 2;
  const ybe = cy + dEnd / 2;

  parts.push(line(x1, yts, x2, yte, THICK_LINE));
  parts.push(line(x1, ybs, x2, ybe, THICK_LINE));
  parts.push(line(x1, yts, x1, ybs, THICK_LINE));
  parts.push(line(x2, yte, x2, ybe, THICK_LINE));

  // Center axis
  parts.push(chainLine(x1 - 10, cy, x2 + 10, cy));

  // Thread zigzag if thread
  if (seg.kind === "thread") {
    const zigTop = Math.min(yts, yte) + 5;
    const zigBot = Math.max(ybs, ybe) - 5;
    const step = Math.max(4, len / 10);
    const topPts: string[] = [];
    const botPts: string[] = [];
    for (let x = x1; x <= x2; x += step) {
      const nx = Math.min(x + step, x2);
      const mx = x + (nx - x) / 2;
      topPts.push(`${x},${zigTop}`, `${mx},${zigTop - 3}`, `${nx},${zigTop}`);
      botPts.push(`${x},${zigBot}`, `${mx},${zigBot + 3}`, `${nx},${zigBot}`);
    }
    parts.push(`<polyline points="${topPts.join(" ")}" fill="none" stroke="${LINE_COLOR}" stroke-width="${THIN_LINE}"/>`);
    parts.push(`<polyline points="${botPts.join(" ")}" fill="none" stroke="${LINE_COLOR}" stroke-width="${THIN_LINE}"/>`);
  }

  // Dimension annotations
  // Length
  const dimLenY = ybe + 14;
  parts.push(line(x1, ybe + 2, x1, dimLenY + 4, DIM_LINE));
  parts.push(line(x2, ybe + 2, x2, dimLenY + 4, DIM_LINE));
  parts.push(`<line x1="${x1}" y1="${dimLenY}" x2="${x2}" y2="${dimLenY}" stroke="${DIM_COLOR}" stroke-width="${DIM_LINE}" marker-start="url(#dim-arrow-l)" marker-end="url(#dim-arrow-r)"/>`);
  parts.push(text(cx, dimLenY - 2, formatMm(seg.lengthMm), 8, "middle"));

  // Diameter
  const dimDiaX = x2 + 14;
  parts.push(line(x2 + 2, yte, dimDiaX + 4, yte, DIM_LINE));
  parts.push(line(x2 + 2, ybe, dimDiaX + 4, ybe, DIM_LINE));
  parts.push(`<line x1="${dimDiaX}" y1="${yte}" x2="${dimDiaX}" y2="${ybe}" stroke="${DIM_COLOR}" stroke-width="${DIM_LINE}" marker-start="url(#dim-arrow-l)" marker-end="url(#dim-arrow-r)"/>`);
  parts.push(text(dimDiaX + 6, cy + 3, `\u00D8${formatMm(seg.startDiameterMm)}`, 8, "start"));

  if (seg.kind === "thread") {
    parts.push(text(cx, dimLenY + 14, `${seg.threadDesignation ?? "M?"}`, 9, "middle", "bold"));
  }

  // Detail label
  parts.push(text(cx, cy - Math.max(dStart, dEnd) / 2 - 14, `${label}) DETAIL`, 10, "middle", "bold"));

  return parts.join("\n");
}

// ── GD&T callout rendering ──────────────────────────────────────────────

function buildGdtCallouts(
  semanticDoc: EngineeringDrawingSemanticDocument | null | undefined,
  originX: number,
  originY: number,
) {
  if (!semanticDoc || semanticDoc.gdtCallouts.length === 0) return "";

  const parts: string[] = [];
  let y = originY;

  for (const callout of semanticDoc.gdtCallouts) {
    for (const seg of callout.segments) {
      // Feature control frame box
      const frameW = 140;
      const frameH = 18;
      parts.push(rect(originX, y, frameW, frameH, THIN_LINE));

      // Characteristic symbol cell
      const symW = 22;
      parts.push(line(originX + symW, y, originX + symW, y + frameH, THIN_LINE));

      // GD&T symbol
      const symMap: Record<string, string> = {
        flatness: "\u23E4",
        straightness: "\u2014",
        circularity: "\u25CB",
        cylindricity: "\u232D",
        perpendicularity: "\u27C2",
        parallelism: "\u2225",
        angularity: "\u2220",
        position: "\u2316",
        circular_runout: "\u2197",
        total_runout: "\u2197\u2197",
        concentricity_legacy: "\u25CE",
        symmetry_legacy: "\u2261",
        profile_line: "\u2312",
        profile_surface: "\u2313",
      };
      const sym = symMap[seg.characteristic] ?? "?";
      parts.push(text(originX + symW / 2, y + 13, sym, 11, "middle"));

      // Tolerance value cell
      const tolX = originX + symW;
      const tolW = 40;
      parts.push(line(tolX + tolW, y, tolX + tolW, y + frameH, THIN_LINE));
      const zonePrefix = seg.zoneDiameter ? "\u00D8" : "";
      const tolText = seg.toleranceValue !== null ? `${zonePrefix}${formatMm(seg.toleranceValue)}` : "—";
      parts.push(text(tolX + tolW / 2, y + 13, tolText, 9, "middle"));

      // Datum references
      let datumX = tolX + tolW;
      for (const datum of seg.datumReferences) {
        const datumW = 22;
        parts.push(line(datumX + datumW, y, datumX + datumW, y + frameH, THIN_LINE));
        parts.push(text(datumX + datumW / 2, y + 13, datum.datumLabel, 9, "middle", "bold"));
        datumX += datumW;
      }

      y += frameH + 6;
    }
  }

  return parts.join("\n");
}

// ── Notes section ───────────────────────────────────────────────────────

function buildNotes(
  spec: AxisymmetricPartSpec,
  semanticDoc: EngineeringDrawingSemanticDocument | null | undefined,
  x: number,
  y: number,
  maxWidth: number,
) {
  const parts: string[] = [];
  parts.push(text(x, y, "NOTES:", 10, "start", "bold"));

  const notes: string[] = [];
  notes.push(`1. DIMENSÕES EM ${spec.unit.toUpperCase()}.`);

  // Surface finish from semantic doc
  const hasSurfaceFinish = spec.notes.some((n) => /[Rr]a\s*[\d,.]/.test(n));
  if (hasSurfaceFinish) {
    notes.push(`2. ACABAMENTO DE SUPERFÍCIE ${spec.notes.find((n) => /[Rr]a/.test(n)) ?? "Ra 0.4"}.`);
  }

  // Thread notes
  const threadSegs = spec.segments.filter((s) => s.kind === "thread");
  if (threadSegs.length > 0) {
    const threadNote = threadSegs.map((s) => `ROSCA ${s.threadDesignation} ESPECIFICADA PELO USUÁRIO`).join("; ");
    notes.push(`${notes.length + 1}. ${threadNote}.`);
  }

  // Extra notes from spec
  for (const note of spec.notes) {
    if (!notes.some((n) => n.includes(note))) {
      notes.push(`${notes.length + 1}. ${note.toUpperCase()}`);
    }
  }

  let lineY = y + 16;
  for (const note of notes) {
    parts.push(textSmall(x, lineY, note));
    lineY += 14;
  }

  return parts.join("\n");
}

// ── Conflict / validation callout ───────────────────────────────────────

function buildConflictNote(
  spec: AxisymmetricPartSpec,
  geometry: SegmentGeo[],
  semanticDoc: EngineeringDrawingSemanticDocument | null | undefined,
) {
  const parts: string[] = [];

  // Check for dimension conflicts
  const validation = validateAxisymmetricPartSpec(spec);
  const conflicts = validation.issues.filter((i) => i.severity === "error");

  if (conflicts.length === 0) return "";

  // Place a callout near the relevant geometry
  const lastGeo = geometry[geometry.length - 1];
  if (!lastGeo) return "";

  const x = lastGeo.xEnd + 20;
  const y = lastGeo.yTopEnd;

  parts.push(text(x, y, "CONFLITO DE DIMENSÃO —", 8, "start", "bold"));
  let lineY = y + 12;
  for (const conflict of conflicts.slice(0, 4)) {
    parts.push(textSmall(x, lineY, conflict.message.toUpperCase()));
    lineY += 12;
  }

  return parts.join("\n");
}

// ── Main A3 render function ─────────────────────────────────────────────

export interface A3DrawingOptions {
  drafter?: string;
  material?: string;
  toleranceStandard?: string;
  revision?: string;
  date?: string;
}

export function renderA3(
  spec: AxisymmetricPartSpec,
  semanticDocument?: EngineeringDrawingSemanticDocument | null,
  options?: A3DrawingOptions,
): TechnicalDrawingRenderResult {
  const totalLengthMm = getResolvedTotalLength(spec) ?? Math.max(spec.segments.length, 1);
  const maxDiameterMm = spec.segments.reduce((largest, segment) => {
    const vals = [segment.startDiameterMm, resolveEndDiameter(segment), segment.acrossFlatsMm].filter(
      (v): v is number => typeof v === "number" && v > 0,
    );
    return vals.length === 0 ? largest : Math.max(largest, ...vals);
  }, 1);

  // Compute scale so the main view fits in the left ~55% of the drawing
  const mainViewWidth = INNER_WIDTH * 0.52;
  const mainViewHeight = INNER_HEIGHT * 0.40;
  const scale = Math.min(
    mainViewWidth / Math.max(totalLengthMm, 1),
    mainViewHeight / Math.max(maxDiameterMm, 1),
  );

  // Main cross-section view position (left portion, vertically centered in upper 60%)
  const mainOriginX = INNER_LEFT + 80;
  const mainCenterY = INNER_TOP + INNER_HEIGHT * 0.34;

  const geometry = computeSegmentGeometry(spec, scale, mainOriginX, mainCenterY);

  // Top view position (upper-right area)
  const topViewX = INNER_RIGHT - 140;
  const topViewY = INNER_TOP + 80;

  // Detail view D — pick the thread segment or last segment (mid-right, below top view)
  const threadIdx = spec.segments.findIndex((s) => s.kind === "thread");
  const detailIdx = threadIdx >= 0 ? threadIdx : spec.segments.length - 1;
  const detailViewX = INNER_RIGHT - 280;
  const detailViewY = INNER_TOP + INNER_HEIGHT * 0.52;
  const detailScale = scale * 1.8; // 1.8x enlargement

  // Second detail view E for bore/square drive (if applicable)
  const squareIdx = spec.segments.findIndex((s) => s.externalShape === "square");
  const hasSecondDetail = squareIdx >= 0 && squareIdx !== detailIdx;
  // Place Detail E in the lower-left quadrant, well clear of the main view and its dimensions
  const detail2X = INNER_LEFT + 100;
  const detail2Y = INNER_BOTTOM - 80;

  // Governing standard
  const govStd = semanticDocument?.documentMetadata.governingStandard;
  const stdLabel = govStd ? (govStd.system !== "UNKNOWN" ? govStd.system : "ISO") : "ISO";

  const titleData: TitleBlockData = {
    partName: spec.partName.toUpperCase(),
    drawingNumber: spec.drawingNumber,
    material: options?.material ?? "Aço Inoxidável",
    scale: "1:1",
    toleranceStandard: options?.toleranceStandard ?? "ISO 2768-m",
    drafter: options?.drafter ?? "A.Expert",
    date: options?.date ?? new Date().toISOString().slice(0, 10),
    revision: options?.revision ?? "A",
    standard: stdLabel,
    sheetSize: "A3",
  };

  const svgParts: string[] = [];

  // Background
  svgParts.push(`<rect x="0" y="0" width="${A3_WIDTH}" height="${A3_HEIGHT}" fill="#ffffff"/>`);

  // Border
  svgParts.push(buildBorder());

  // Title block
  svgParts.push(buildTitleBlock(titleData));

  // "VER DETALHE" leader (pointing to the detail segment in main view)
  if (detailIdx >= 0 && geometry[detailIdx]) {
    const dGeo = geometry[detailIdx];
    const midX = (dGeo.xStart + dGeo.xEnd) / 2;
    const dTopY = Math.min(dGeo.yTopStart, dGeo.yTopEnd);
    // Circle around detail area — cap radius so it doesn't dominate the drawing
    const rawRadius = Math.max(dGeo.width, Math.abs(dGeo.yBotStart - dGeo.yTopStart)) / 2 + 6;
    const cappedRadius = Math.min(rawRadius, 50);
    const cy = (dGeo.yTopStart + dGeo.yBotStart) / 2;
    svgParts.push(`<circle cx="${midX}" cy="${cy}" r="${cappedRadius}" fill="none" stroke="${LINE_COLOR}" stroke-width="${THIN_LINE}" stroke-dasharray="4 2"/>`);
    svgParts.push(text(midX, dTopY - cappedRadius - 6, 'VER DETALHE "D"', 8, "middle"));
  }

  // Main cross-section
  svgParts.push(buildCrossSectionView(spec, geometry, mainCenterY, "A) MAIN CROSS-SECTION VIEW (FRONTA)"));

  // Dimensions
  svgParts.push(buildDimensions(spec, geometry, mainCenterY));

  // Top view
  svgParts.push(buildTopView(spec, scale, topViewX, topViewY));

  // Detail view D (thread or last segment)
  svgParts.push(buildDetailView("D", spec, geometry, detailIdx, detailViewX, detailViewY, detailScale));

  // Detail view E (square drive if exists)
  if (hasSecondDetail) {
    svgParts.push(buildDetailView("E", spec, geometry, squareIdx, detail2X, detail2Y, detailScale));
  }

  // GD&T callouts (to the right of the detail view)
  if (semanticDocument) {
    svgParts.push(buildGdtCallouts(semanticDocument, detailViewX - 60, detailViewY + 80));
  }

  // Conflict note
  svgParts.push(buildConflictNote(spec, geometry, semanticDocument));

  // Notes section (above title block)
  svgParts.push(buildNotes(spec, semanticDocument, TB_LEFT, TB_TOP - 100, TB_WIDTH));

  // Surface finish symbol near main view
  const raNote = spec.notes.find((n) => /[Rr]a/.test(n));
  if (raNote) {
    const lastGeo = geometry[geometry.length - 1];
    if (lastGeo) {
      // Place Ra symbol near the bottom of the last segment
      svgParts.push(text(lastGeo.xEnd + 8, lastGeo.yBotEnd - 4, "Ra 0.4", 8, "start"));
    }
  }

  // Material detail in the material cell (row 2, left column)
  // Row 2 starts at TB_TOP + rowH (rowH = TB_HEIGHT/4 = 40)
  // Already has "MATERIAL:" label at +10 and material text at +26
  // Add sub-detail only if it fits below the material text
  const matRow2Top = TB_TOP + TB_HEIGHT / 4;
  svgParts.push(textSmall(
    TB_LEFT + 4,
    matRow2Top + 36,
    "Barra exportado em CAD para manufatura de precisão.",
  ));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${A3_WIDTH}" height="${A3_HEIGHT}" viewBox="0 0 ${A3_WIDTH} ${A3_HEIGHT}" role="img" aria-label="Desenho técnico A3 — ${escapeXml(spec.partName)}">
  <defs>${arrowDefs()}</defs>
  ${svgParts.join("\n")}
</svg>`.trim();

  return buildRenderResult(spec, svg, semanticDocument);
}

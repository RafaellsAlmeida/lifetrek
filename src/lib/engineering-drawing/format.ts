import type { AxisymmetricPartSpec, AxisymmetricSegment } from "./types";

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatMm(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return roundTo(value)
    .toFixed(2)
    .replace(".", ",")
    .replace(/,00$/, "");
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function resolveEndDiameter(segment: AxisymmetricSegment): number | null {
  return segment.endDiameterMm ?? segment.startDiameterMm;
}

export function sumSegmentLengths(spec: AxisymmetricPartSpec): number {
  return spec.segments.reduce((total, segment) => total + (segment.lengthMm ?? 0), 0);
}

export function getResolvedTotalLength(spec: AxisymmetricPartSpec): number | null {
  if (spec.totalLengthMm !== null && spec.totalLengthMm !== undefined) {
    return spec.totalLengthMm;
  }

  const total = sumSegmentLengths(spec);
  return total > 0 ? total : null;
}

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[/\\]/g, "-")
    .replace(/[^a-z0-9\-_.]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function fileNameFromPath(path: string | null | undefined): string {
  if (!path) return "";
  return path.split("/").pop() ?? path;
}

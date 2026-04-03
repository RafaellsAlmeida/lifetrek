import { build3DModel } from "./model3d";
import {
  formatMm,
  getResolvedTotalLength,
  resolveEndDiameter,
  sumSegmentLengths,
} from "./format";
import type {
  AxisymmetricPartSpec,
  DimensionEntry,
  TechnicalDrawingRenderResult,
  ValidationIssue,
  ValidationReport,
} from "./types";

function pushIssue(
  issues: ValidationIssue[],
  severity: ValidationIssue["severity"],
  code: string,
  message: string,
  fieldPath: string | null,
  blocking = severity === "error",
) {
  issues.push({ code, severity, message, fieldPath, blocking });
}

export function validateAxisymmetricPartSpec(spec: AxisymmetricPartSpec): ValidationReport {
  const issues: ValidationIssue[] = [];

  if (!spec.partName.trim()) {
    pushIssue(issues, "error", "missing-part-name", "Defina o nome da peça.", "partName");
  }

  if (spec.segments.length === 0) {
    pushIssue(
      issues,
      "error",
      "missing-segments",
      "Adicione pelo menos um trecho para gerar o desenho técnico.",
      "segments",
    );
  }

  spec.segments.forEach((segment, index) => {
    const basePath = `segments.${index}`;
    const resolvedEnd = resolveEndDiameter(segment);

    if (!segment.label.trim()) {
      pushIssue(issues, "warning", "missing-segment-label", "Trecho sem rótulo.", `${basePath}.label`, false);
    }

    if (segment.lengthMm === null || segment.lengthMm <= 0) {
      pushIssue(
        issues,
        "error",
        "invalid-segment-length",
        `O trecho ${index + 1} precisa ter comprimento maior que zero.`,
        `${basePath}.lengthMm`,
      );
    }

    if (segment.startDiameterMm === null || segment.startDiameterMm <= 0) {
      pushIssue(
        issues,
        "error",
        "invalid-start-diameter",
        `O trecho ${index + 1} precisa ter diâmetro inicial válido.`,
        `${basePath}.startDiameterMm`,
      );
    }

    if (resolvedEnd === null || resolvedEnd <= 0) {
      pushIssue(
        issues,
        "error",
        "invalid-end-diameter",
        `O trecho ${index + 1} precisa ter diâmetro final válido.`,
        `${basePath}.endDiameterMm`,
      );
    }

    if (segment.externalShape !== "round" && (segment.acrossFlatsMm === null || segment.acrossFlatsMm <= 0)) {
      pushIssue(
        issues,
        "error",
        "missing-across-flats",
        `Informe a medida entre faces do trecho ${index + 1}.`,
        `${basePath}.acrossFlatsMm`,
      );
    }

    if (segment.kind === "thread") {
      if (!segment.threadDesignation?.trim()) {
        pushIssue(
          issues,
          "error",
          "missing-thread-designation",
          `O trecho ${index + 1} é roscado e precisa da designação da rosca.`,
          `${basePath}.threadDesignation`,
        );
      }

      if (segment.threadPitchMm === null || segment.threadPitchMm <= 0) {
        pushIssue(
          issues,
          "error",
          "missing-thread-pitch",
          `O trecho ${index + 1} é roscado e precisa do passo da rosca.`,
          `${basePath}.threadPitchMm`,
        );
      }
    }
  });

  const resolvedTotalLength = getResolvedTotalLength(spec);
  const sumOfSegments = sumSegmentLengths(spec);

  if (resolvedTotalLength === null || resolvedTotalLength <= 0) {
    pushIssue(issues, "error", "missing-total-length", "Informe o comprimento total da peça.", "totalLengthMm");
  } else if (Math.abs(resolvedTotalLength - sumOfSegments) > 0.05) {
    pushIssue(
      issues,
      "error",
      "total-length-conflict",
      `A soma dos trechos (${formatMm(sumOfSegments)} mm) não bate com o comprimento total (${formatMm(
        resolvedTotalLength,
      )} mm).`,
      "totalLengthMm",
    );
  }

  const smallestOuterDiameter = spec.segments.reduce((smallest, segment) => {
    const diameters = [segment.startDiameterMm, resolveEndDiameter(segment)].filter(
      (value): value is number => typeof value === "number" && value > 0,
    );

    return diameters.length === 0 ? smallest : Math.min(smallest, ...diameters);
  }, Number.POSITIVE_INFINITY);

  spec.axialBores.forEach((bore, index) => {
    const basePath = `axialBores.${index}`;

    if (bore.diameterMm === null || bore.diameterMm <= 0) {
      pushIssue(issues, "error", "invalid-bore-diameter", "Furo axial com diâmetro inválido.", `${basePath}.diameterMm`);
    }

    if (bore.depthMm === null || bore.depthMm <= 0) {
      pushIssue(issues, "error", "invalid-bore-depth", "Furo axial com profundidade inválida.", `${basePath}.depthMm`);
    }

    if (
      bore.diameterMm !== null &&
      Number.isFinite(smallestOuterDiameter) &&
      bore.diameterMm >= smallestOuterDiameter
    ) {
      pushIssue(
        issues,
        "error",
        "bore-larger-than-outer",
        `O furo axial ${index + 1} é maior ou igual ao menor diâmetro externo da peça.`,
        `${basePath}.diameterMm`,
      );
    }
  });

  spec.unsupportedFeatures.forEach((feature, index) => {
    pushIssue(
      issues,
      "warning",
      "unsupported-feature",
      `Feature fora do escopo da V1: ${feature.label}. ${feature.note}`,
      `unsupportedFeatures.${index}`,
      false,
    );
  });

  const blockingIssueCount = issues.filter((issue) => issue.blocking).length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const infoCount = issues.filter((issue) => issue.severity === "info").length;

  return {
    issues,
    blockingIssueCount,
    warningCount,
    infoCount,
    canRender: spec.segments.length > 0,
    canExport: blockingIssueCount === 0,
  };
}

export function buildDimensionTable(spec: AxisymmetricPartSpec): DimensionEntry[] {
  const rows: DimensionEntry[] = [];
  const totalLength = getResolvedTotalLength(spec);

  if (totalLength !== null) {
    rows.push({
      id: "total-length",
      label: "Comprimento total",
      value: `${formatMm(totalLength)} mm`,
      source: "spec.totalLengthMm",
    });
  }

  spec.segments.forEach((segment, index) => {
    rows.push({
      id: `${segment.id}-length`,
      label: `Trecho ${index + 1} • ${segment.label} • Comprimento`,
      value: `${formatMm(segment.lengthMm)} mm`,
      source: `segments.${index}.lengthMm`,
    });

    rows.push({
      id: `${segment.id}-diameter-start`,
      label: `Trecho ${index + 1} • ${segment.label} • Ø inicial`,
      value: `${formatMm(segment.startDiameterMm)} mm`,
      source: `segments.${index}.startDiameterMm`,
    });

    rows.push({
      id: `${segment.id}-diameter-end`,
      label: `Trecho ${index + 1} • ${segment.label} • Ø final`,
      value: `${formatMm(resolveEndDiameter(segment))} mm`,
      source: `segments.${index}.endDiameterMm`,
    });

    if (segment.externalShape !== "round" && segment.acrossFlatsMm !== null) {
      rows.push({
        id: `${segment.id}-af`,
        label: `Trecho ${index + 1} • ${segment.label} • Entre faces`,
        value: `${formatMm(segment.acrossFlatsMm)} mm`,
        source: `segments.${index}.acrossFlatsMm`,
      });
    }

    if (segment.kind === "thread") {
      rows.push({
        id: `${segment.id}-thread`,
        label: `Trecho ${index + 1} • ${segment.label} • Rosca`,
        value: `${segment.threadDesignation ?? "—"} x ${formatMm(segment.threadPitchMm)} mm`,
        source: `segments.${index}.threadDesignation`,
      });
    }
  });

  spec.axialBores.forEach((bore, index) => {
    rows.push({
      id: `${bore.id}-diameter`,
      label: `Furo axial ${index + 1} • Diâmetro`,
      value: `${formatMm(bore.diameterMm)} mm`,
      source: `axialBores.${index}.diameterMm`,
    });
    rows.push({
      id: `${bore.id}-depth`,
      label: `Furo axial ${index + 1} • Profundidade`,
      value: `${formatMm(bore.depthMm)} mm`,
      source: `axialBores.${index}.depthMm`,
    });
  });

  return rows;
}

export function buildRenderResult(spec: AxisymmetricPartSpec, drawingSvg: string): TechnicalDrawingRenderResult {
  const validationReport = validateAxisymmetricPartSpec(spec);
  return {
    drawingSvg,
    dimensionTable: buildDimensionTable(spec),
    validationReport,
    planned3DModel: build3DModel(spec),
  };
}

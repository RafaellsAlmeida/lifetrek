import {
  createDefaultValidationReport,
} from "./types";
import type {
  EngineeringDrawingSemanticDocument,
  GdtCharacteristic,
  ValidationIssue,
  ValidationReport,
} from "./types";

function pushIssue(
  issues: ValidationIssue[],
  severity: ValidationIssue["severity"],
  code: string,
  message: string,
  fieldPath: string | null,
  blocking = severity === "error" || severity === "review-required",
) {
  issues.push({ code, severity, message, fieldPath, blocking });
}

function characteristicNeedsDatum(characteristic: GdtCharacteristic) {
  return (
    characteristic === "parallelism" ||
    characteristic === "perpendicularity" ||
    characteristic === "angularity" ||
    characteristic === "position" ||
    characteristic === "circular_runout" ||
    characteristic === "total_runout"
  );
}

function characteristicIsForm(characteristic: GdtCharacteristic) {
  return (
    characteristic === "straightness" ||
    characteristic === "flatness" ||
    characteristic === "circularity" ||
    characteristic === "cylindricity"
  );
}

export function semanticDocumentHasGdt(document: EngineeringDrawingSemanticDocument | null | undefined) {
  if (!document) return false;
  return document.gdtCallouts.length > 0 || document.datumFeatures.length > 0;
}

export function validateSemanticDocument(document: EngineeringDrawingSemanticDocument | null): ValidationReport {
  const base = createDefaultValidationReport();
  if (!document) return base;

  const issues: ValidationIssue[] = [];
  const hasGdt = semanticDocumentHasGdt(document);

  if (hasGdt && document.documentMetadata.governingStandard.system === "UNKNOWN") {
    pushIssue(
      issues,
      "review-required",
      "semantic-standard-required",
      "Norma do desenho obrigatória para interpretar GD&T.",
      "documentMetadata.governingStandard",
    );
  }

  document.ambiguityFlags.forEach((ambiguity, index) => {
    pushIssue(
      issues,
      "review-required",
      ambiguity.id || `semantic-ambiguity-${index}`,
      ambiguity.question,
      ambiguity.fieldPath,
    );
  });

  document.gdtCallouts.forEach((callout, calloutIndex) => {
    const calloutPath = `gdtCallouts.${calloutIndex}`;

    if (callout.supportStatus === "unsupported") {
      pushIssue(
        issues,
        "review-required",
        "semantic-unsupported-callout",
        `Callout GD&T fora do escopo automático: ${callout.rawText || "sem texto bruto"}.`,
        calloutPath,
      );
    } else if (callout.supportStatus === "partial") {
      pushIssue(
        issues,
        "review-required",
        "semantic-partial-callout",
        `Callout GD&T parcial e dependente de revisão: ${callout.rawText || "sem texto bruto"}.`,
        calloutPath,
      );
    }

    if (callout.reviewStatus === "needs_review") {
      pushIssue(
        issues,
        "review-required",
        "semantic-callout-needs-review",
        `Revisão humana pendente para o callout: ${callout.rawText || "sem texto bruto"}.`,
        calloutPath,
      );
    }

    callout.segments.forEach((segment, segmentIndex) => {
      const segmentPath = `${calloutPath}.segments.${segmentIndex}`;

      if (segment.characteristic === "unknown" || segment.toleranceValue === null) {
        pushIssue(
          issues,
          "error",
          "semantic-incomplete-fcf",
          "Quadro geométrico incompleto: falta característica ou valor de tolerância.",
          segmentPath,
        );
      }

      if (characteristicIsForm(segment.characteristic) && segment.datumReferences.length > 0) {
        pushIssue(
          issues,
          "error",
          "semantic-form-with-datum",
          "Tolerâncias de forma não devem referenciar datum.",
          `${segmentPath}.datumReferences`,
        );
      }

      if (characteristicNeedsDatum(segment.characteristic) && segment.datumReferences.length === 0) {
        pushIssue(
          issues,
          "error",
          "semantic-missing-datum",
          "Este controle geométrico exige datum de referência.",
          `${segmentPath}.datumReferences`,
        );
      }

      if (
        (segment.characteristic === "circular_runout" || segment.characteristic === "total_runout") &&
        document.documentMetadata.isAxisymmetric !== true
      ) {
        pushIssue(
          issues,
          "review-required",
          "semantic-runout-axisymmetric",
          "Batimento exige confirmação de geometria rotacional/axisimétrica.",
          segmentPath,
        );
      }

      if (
        document.documentMetadata.governingStandard.system === "ASME" &&
        document.documentMetadata.governingStandard.edition === "2018" &&
        (segment.characteristic === "concentricity_legacy" || segment.characteristic === "symmetry_legacy")
      ) {
        pushIssue(
          issues,
          "error",
          "semantic-asme-2018-legacy-symbol",
          "Concentricidade/simetria devem ser revisadas em ASME Y14.5-2018.",
          segmentPath,
        );
      }
    });
  });

  const blockingIssueCount = issues.filter((issue) => issue.blocking && issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const reviewRequiredCount = issues.filter((issue) => issue.severity === "review-required").length;
  const infoCount = issues.filter((issue) => issue.severity === "info").length;

  return {
    issues,
    blockingIssueCount,
    warningCount,
    reviewRequiredCount,
    infoCount,
    canRender: true,
    canExport: blockingIssueCount === 0 && reviewRequiredCount === 0,
  };
}

export function mergeValidationReports(...reports: Array<ValidationReport | null | undefined>): ValidationReport {
  const resolved = reports.filter((report): report is ValidationReport => Boolean(report));
  if (resolved.length === 0) return createDefaultValidationReport();

  const issues = resolved.flatMap((report) => report.issues);
  return {
    issues,
    blockingIssueCount: issues.filter((issue) => issue.blocking && issue.severity === "error").length,
    warningCount: issues.filter((issue) => issue.severity === "warning").length,
    reviewRequiredCount: issues.filter((issue) => issue.severity === "review-required").length,
    infoCount: issues.filter((issue) => issue.severity === "info").length,
    canRender: resolved.every((report) => report.canRender),
    canExport: resolved.every((report) => report.canExport),
  };
}

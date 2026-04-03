export type SegmentKind = "cylinder" | "taper" | "thread";
export type ExternalShape = "round" | "hex" | "square";
export type ReviewMode = "supabase" | "local";
export type ExtractionSource = "ai" | "fixture" | "manual";
export type SessionStatus = "draft" | "extracted" | "reviewed" | "rendered";
export type IssueSeverity = "error" | "warning" | "info";

export interface AxisymmetricSegment {
  id: string;
  label: string;
  kind: SegmentKind;
  lengthMm: number | null;
  startDiameterMm: number | null;
  endDiameterMm: number | null;
  externalShape: ExternalShape;
  acrossFlatsMm: number | null;
  threadDesignation: string | null;
  threadPitchMm: number | null;
  chamferStartMm: number | null;
  chamferStartAngleDeg: number | null;
  chamferEndMm: number | null;
  chamferEndAngleDeg: number | null;
  filletStartRadiusMm: number | null;
  filletEndRadiusMm: number | null;
  note: string | null;
  confidence: number | null;
}

export interface AxisymmetricBore {
  id: string;
  label: string;
  diameterMm: number | null;
  depthMm: number | null;
  startFrom: "left" | "right";
  confidence: number | null;
}

export interface UnsupportedFeature {
  id: string;
  label: string;
  note: string;
  confidence: number | null;
}

export interface AxisymmetricPartSpec {
  partName: string;
  drawingNumber: string | null;
  unit: "mm";
  totalLengthMm: number | null;
  segments: AxisymmetricSegment[];
  axialBores: AxisymmetricBore[];
  notes: string[];
  unsupportedFeatures: UnsupportedFeature[];
}

export interface DrawingAmbiguity {
  id: string;
  fieldPath: string;
  question: string;
  reason: string;
  confidence: number | null;
  suggestedAction: string | null;
}

export interface ConfidenceSummary {
  high: number;
  medium: number;
  low: number;
}

export interface ValidationIssue {
  code: string;
  severity: IssueSeverity;
  message: string;
  fieldPath: string | null;
  blocking: boolean;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  blockingIssueCount: number;
  warningCount: number;
  infoCount: number;
  canRender: boolean;
  canExport: boolean;
}

export interface DimensionEntry {
  id: string;
  label: string;
  value: string;
  source: string;
}

export interface Planned3DModel {
  status: "planned" | "partial";
  readyForImplementation: boolean;
  message: string;
  unsupportedFeatures: string[];
}

export interface TechnicalDrawingRenderResult {
  drawingSvg: string;
  dimensionTable: DimensionEntry[];
  validationReport: ValidationReport;
  planned3DModel: Planned3DModel;
}

export interface ExtractionResult {
  specDraft: AxisymmetricPartSpec;
  ambiguities: DrawingAmbiguity[];
  confidenceSummary: ConfidenceSummary;
  sourceSketchSummary: string;
  extractionSource: ExtractionSource;
}

export interface ReviewState {
  reviewConfirmed: boolean;
  ambiguities: DrawingAmbiguity[];
  confidenceSummary: ConfidenceSummary;
  sourceSketchSummary: string;
  extractionSource: ExtractionSource;
  mode: ReviewMode;
}

export interface EngineeringDrawingSessionRecord {
  id: string;
  title: string;
  status: SessionStatus;
  unit: "mm";
  notes: string | null;
  sourceImagePath: string | null;
  sourceImageName: string | null;
  sourceImageUrl: string | null;
  rawExtraction: ExtractionResult | null;
  normalizedSpec: AxisymmetricPartSpec | null;
  reviewState: ReviewState | null;
  validationReport: ValidationReport | null;
  drawingSvg: string | null;
  renderMetadata: Record<string, unknown>;
  exports: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  reviewedBy: string | null;
  backendMode: ReviewMode;
  fixtureId: string | null;
}

export function createSegment(overrides: Partial<AxisymmetricSegment> = {}): AxisymmetricSegment {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    label: overrides.label ?? "Novo trecho",
    kind: overrides.kind ?? "cylinder",
    lengthMm: overrides.lengthMm ?? null,
    startDiameterMm: overrides.startDiameterMm ?? null,
    endDiameterMm: overrides.endDiameterMm ?? null,
    externalShape: overrides.externalShape ?? "round",
    acrossFlatsMm: overrides.acrossFlatsMm ?? null,
    threadDesignation: overrides.threadDesignation ?? null,
    threadPitchMm: overrides.threadPitchMm ?? null,
    chamferStartMm: overrides.chamferStartMm ?? null,
    chamferStartAngleDeg: overrides.chamferStartAngleDeg ?? null,
    chamferEndMm: overrides.chamferEndMm ?? null,
    chamferEndAngleDeg: overrides.chamferEndAngleDeg ?? null,
    filletStartRadiusMm: overrides.filletStartRadiusMm ?? null,
    filletEndRadiusMm: overrides.filletEndRadiusMm ?? null,
    note: overrides.note ?? null,
    confidence: overrides.confidence ?? null,
  };
}

export function createBore(overrides: Partial<AxisymmetricBore> = {}): AxisymmetricBore {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    label: overrides.label ?? "Furo axial",
    diameterMm: overrides.diameterMm ?? null,
    depthMm: overrides.depthMm ?? null,
    startFrom: overrides.startFrom ?? "left",
    confidence: overrides.confidence ?? null,
  };
}

export function createEmptySpec(partName = "Nova peça"): AxisymmetricPartSpec {
  return {
    partName,
    drawingNumber: null,
    unit: "mm",
    totalLengthMm: null,
    segments: [createSegment({ label: "Trecho 1" })],
    axialBores: [],
    notes: [],
    unsupportedFeatures: [],
  };
}

export function createDefaultConfidenceSummary(): ConfidenceSummary {
  return { high: 0, medium: 0, low: 0 };
}

export function createDefaultReviewState(
  mode: ReviewMode,
  extractionSource: ExtractionSource = "manual",
): ReviewState {
  return {
    reviewConfirmed: false,
    ambiguities: [],
    confidenceSummary: createDefaultConfidenceSummary(),
    sourceSketchSummary: "",
    extractionSource,
    mode,
  };
}

export type SegmentKind = "cylinder" | "taper" | "thread";
export type ExternalShape = "round" | "hex" | "square";
export type ReviewMode = "supabase" | "local";
export type ExtractionSource = "ai" | "fixture" | "manual";
export type SessionStatus = "draft" | "extracted" | "reviewed" | "rendered_2d" | "rendered_3d";
export type IssueSeverity = "error" | "warning" | "review-required" | "info";
export type GoverningStandardSystem = "ASME" | "ISO" | "UNKNOWN";
export type GoverningStandardSource = "title_block" | "manual" | "inferred" | "unresolved";
export type SemanticSupportStatus = "supported" | "partial" | "unsupported";
export type SemanticReviewStatus =
  | "auto_accepted"
  | "needs_review"
  | "human_confirmed"
  | "human_corrected"
  | "rejected";
export type FeatureKind =
  | "face"
  | "surface_patch"
  | "cylinder_od"
  | "cylinder_id"
  | "cone"
  | "radius"
  | "hole"
  | "hole_pattern"
  | "slot"
  | "center_plane"
  | "unknown";
export type DatumFeatureType = "plane" | "axis" | "center_plane" | "point" | "common" | "unknown";
export type GdtCharacteristic =
  | "straightness"
  | "flatness"
  | "circularity"
  | "cylindricity"
  | "profile_line"
  | "profile_surface"
  | "parallelism"
  | "perpendicularity"
  | "angularity"
  | "position"
  | "circular_runout"
  | "total_runout"
  | "coaxiality_legacy"
  | "concentricity_legacy"
  | "symmetry_legacy"
  | "unknown";
export type ToleranceZoneShape = "parallel_planes" | "cylinder" | "circle" | "profile_band" | "unknown";
export type MaterialCondition = "MMC" | "LMC" | "RFS";
export type DatumMaterialBoundary = "MMB" | "LMB" | "RMB";
export type FeatureControlFrameStyle = "single" | "stacked" | "composite" | "combined_pattern" | "unknown";
export type ThreeDPreviewStatus = "ready" | "partial" | "blocked";

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

export interface GoverningStandard {
  system: GoverningStandardSystem;
  edition: string | null;
  source: GoverningStandardSource;
}

export interface SemanticFeatureRef {
  id: string;
  kind: FeatureKind;
  label: string | null;
  topologyRef: string | null;
  isFeatureOfSize: boolean | null;
  confidence: number | null;
}

export interface SizeDimension {
  id: string;
  featureRefId: string | null;
  kind: "diameter" | "radius" | "linear" | "angle" | "depth" | "thread";
  nominal: number | null;
  upperTol: number | null;
  lowerTol: number | null;
  basic: boolean;
  rawText: string;
  supportStatus: SemanticSupportStatus;
  confidence: number | null;
}

export interface DatumFeature {
  id: string;
  label: string;
  featureRefId: string | null;
  datumType: DatumFeatureType;
  rawTagText: string;
  materialBoundary: DatumMaterialBoundary | null;
  confidence: number | null;
  needsHumanConfirmation: boolean;
}

export interface DatumReference {
  precedence: number;
  datumLabel: string;
  referenceType: "single" | "common" | "derived" | "unknown";
  materialBoundary: DatumMaterialBoundary | null;
}

export interface FeatureControlFrameSegment {
  characteristic: GdtCharacteristic;
  toleranceValue: number | null;
  zoneShape: ToleranceZoneShape;
  zoneDiameter: boolean;
  materialCondition: MaterialCondition | null;
  datumReferences: DatumReference[];
  extendedModifiers: string[];
}

export interface GdtCallout {
  id: string;
  featureRefIds: string[];
  leaderTargetKind: "feature" | "dimension" | "note" | "unknown";
  frameStyle: FeatureControlFrameStyle;
  rawText: string;
  normalizedText: string | null;
  segments: FeatureControlFrameSegment[];
  supportStatus: SemanticSupportStatus;
  reviewStatus: SemanticReviewStatus;
  unsupportedReasonCodes: string[];
  confidence: number | null;
}

export interface SemanticDocumentMetadata {
  partName: string;
  drawingNumber: string | null;
  units: "mm" | "inch" | "mixed" | "unknown";
  governingStandard: GoverningStandard;
  generalToleranceBlockRaw: string | null;
  isAxisymmetric: boolean | null;
  axisymmetricConfidence: number | null;
}

export interface EngineeringDrawingSemanticDocument {
  schemaVersion: "gdt-doc/v1";
  documentMetadata: SemanticDocumentMetadata;
  features: SemanticFeatureRef[];
  sizeDimensions: SizeDimension[];
  datumFeatures: DatumFeature[];
  gdtCallouts: GdtCallout[];
  ambiguityFlags: DrawingAmbiguity[];
  validationReport: ValidationReport | null;
  reviewDecision: {
    approved: boolean;
    approvedWithWarnings: boolean;
    reviewerId: string | null;
    reviewedAt: string | null;
    comments: string | null;
  };
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
  reviewRequiredCount: number;
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
  status: ThreeDPreviewStatus;
  readyForImplementation: boolean;
  message: string;
  unsupportedFeatures: string[];
  blockingReasons: string[];
}

export interface TechnicalDrawingRenderResult {
  drawingSvg: string;
  dimensionTable: DimensionEntry[];
  validationReport: ValidationReport;
  planned3DModel: Planned3DModel;
}

export interface ExtractionResult {
  geometryDraft: AxisymmetricPartSpec;
  semanticDraft: EngineeringDrawingSemanticDocument;
  specDraft?: AxisymmetricPartSpec;
  ambiguities: DrawingAmbiguity[];
  confidenceSummary: ConfidenceSummary;
  sourceSketchSummary: string;
  extractionSource: ExtractionSource;
}

export interface TechnicalDrawing3DAsset {
  format: "glb";
  path: string | null;
  url: string | null;
  updatedAt: string | null;
}

export interface TechnicalDrawing3DResult {
  previewStatus: ThreeDPreviewStatus;
  glbBase64: string | null;
  fileName: string | null;
  meshSummary: {
    segmentMeshCount: number;
    boreSectionCount: number;
    vertexCount: number;
  };
  boundingBoxMm: {
    length: number;
    width: number;
    height: number;
  };
  validationReport: ValidationReport;
  blockingReasons: string[];
}

export interface ReviewState {
  reviewConfirmed: boolean;
  semanticReviewConfirmed: boolean;
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
  normalizedDocument: EngineeringDrawingSemanticDocument | null;
  reviewState: ReviewState | null;
  validationReport: ValidationReport | null;
  drawingSvg: string | null;
  threeDPreviewStatus: ThreeDPreviewStatus | null;
  threeDAsset: TechnicalDrawing3DAsset | null;
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

export function createEmptySemanticDocument(partName = "Nova peça"): EngineeringDrawingSemanticDocument {
  return {
    schemaVersion: "gdt-doc/v1",
    documentMetadata: {
      partName,
      drawingNumber: null,
      units: "mm",
      governingStandard: {
        system: "UNKNOWN",
        edition: null,
        source: "unresolved",
      },
      generalToleranceBlockRaw: null,
      isAxisymmetric: true,
      axisymmetricConfidence: null,
    },
    features: [],
    sizeDimensions: [],
    datumFeatures: [],
    gdtCallouts: [],
    ambiguityFlags: [],
    validationReport: null,
    reviewDecision: {
      approved: false,
      approvedWithWarnings: false,
      reviewerId: null,
      reviewedAt: null,
      comments: null,
    },
  };
}

export function createDefaultConfidenceSummary(): ConfidenceSummary {
  return { high: 0, medium: 0, low: 0 };
}

export function createDefaultValidationReport(): ValidationReport {
  return {
    issues: [],
    blockingIssueCount: 0,
    warningCount: 0,
    reviewRequiredCount: 0,
    infoCount: 0,
    canRender: true,
    canExport: true,
  };
}

export function createDefaultReviewState(
  mode: ReviewMode,
  extractionSource: ExtractionSource = "manual",
): ReviewState {
  return {
    reviewConfirmed: false,
    semanticReviewConfirmed: false,
    ambiguities: [],
    confidenceSummary: createDefaultConfidenceSummary(),
    sourceSketchSummary: "",
    extractionSource,
    mode,
  };
}

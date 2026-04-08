import {
  createBore,
  createDefaultConfidenceSummary,
  createDefaultReviewState,
  createEmptySemanticDocument,
  createEmptySpec,
  createSegment,
} from "./types";
import type {
  AxisymmetricPartSpec,
  EngineeringDrawingSemanticDocument,
  EngineeringDrawingSessionRecord,
  ExtractionResult,
  GdtCharacteristic,
  ReviewState,
} from "./types";

export interface EngineeringDrawingFixture {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  fileAliases: string[];
  extractionResult: ExtractionResult;
  sourceType: "internal" | "synthetic" | "public";
  provenance: {
    label: string;
    license: string;
    sourceUrl: string | null;
    notes: string;
  };
  expectedOutcome: {
    twoD: "pass" | "blocked";
    threeD: "pass" | "blocked";
    reviewRequired: boolean;
  };
}

function buildReview(
  mode: ReviewState["mode"],
  extraction: ExtractionResult,
): ReviewState {
  return {
    ...createDefaultReviewState(mode, extraction.extractionSource),
    ambiguities: extraction.ambiguities,
    confidenceSummary: extraction.confidenceSummary,
    sourceSketchSummary: extraction.sourceSketchSummary,
  };
}

function buildFeatureIndex(spec: AxisymmetricPartSpec, drawingNumber: string | null = null) {
  const features = spec.segments.map((segment) => ({
    id: segment.id,
    kind: segment.externalShape === "round" ? ("cylinder_od" as const) : ("surface_patch" as const),
    label: segment.label,
    topologyRef: segment.id,
    isFeatureOfSize: true,
    confidence: segment.confidence,
  }));

  const sizeDimensions = spec.segments.flatMap((segment) => {
    const rows = [
      {
        id: `${segment.id}-length`,
        featureRefId: segment.id,
        kind: "linear" as const,
        nominal: segment.lengthMm,
        upperTol: null,
        lowerTol: null,
        basic: false,
        rawText: `${segment.label} L ${segment.lengthMm ?? "?"}`,
        supportStatus: "supported" as const,
        confidence: segment.confidence,
      },
      {
        id: `${segment.id}-diameter`,
        featureRefId: segment.id,
        kind: "diameter" as const,
        nominal: segment.startDiameterMm,
        upperTol: null,
        lowerTol: null,
        basic: false,
        rawText: `Ø${segment.startDiameterMm ?? "?"}`,
        supportStatus: "supported" as const,
        confidence: segment.confidence,
      },
    ];

    if (segment.externalShape !== "round" && segment.acrossFlatsMm) {
      rows.push({
        id: `${segment.id}-af`,
        featureRefId: segment.id,
        kind: "linear" as const,
        nominal: segment.acrossFlatsMm,
        upperTol: null,
        lowerTol: null,
        basic: false,
        rawText: `SW ${segment.acrossFlatsMm}`,
        supportStatus: "supported" as const,
        confidence: segment.confidence,
      });
    }

    return rows;
  });

  return {
    schemaVersion: "gdt-doc/v1" as const,
    documentMetadata: {
      ...createEmptySemanticDocument(spec.partName).documentMetadata,
      partName: spec.partName,
      drawingNumber,
      units: "mm" as const,
      isAxisymmetric: spec.unsupportedFeatures.length === 0,
      axisymmetricConfidence: spec.unsupportedFeatures.length === 0 ? 0.96 : 0.4,
    },
    features,
    sizeDimensions,
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

function withSingleDatumCallout(args: {
  base: EngineeringDrawingSemanticDocument;
  datumLabel: string;
  datumType: "plane" | "axis";
  featureRefId: string;
  characteristic: GdtCharacteristic;
  toleranceValue: number;
  rawText: string;
  governingStandardSystem: "ASME" | "ISO" | "UNKNOWN";
  edition?: string | null;
  reviewRequired?: boolean;
  supportStatus?: "supported" | "partial" | "unsupported";
}) {
  return {
    ...args.base,
    documentMetadata: {
      ...args.base.documentMetadata,
      governingStandard: {
        system: args.governingStandardSystem,
        edition: args.edition ?? null,
        source: args.governingStandardSystem === "UNKNOWN" ? "unresolved" : "manual",
      },
    },
    datumFeatures: [
      {
        id: `datum-${args.datumLabel.toLowerCase()}`,
        label: args.datumLabel,
        featureRefId: args.featureRefId,
        datumType: args.datumType,
        rawTagText: args.datumLabel,
        materialBoundary: null,
        confidence: 0.92,
        needsHumanConfirmation: args.reviewRequired ?? false,
      },
    ],
    gdtCallouts: [
      {
        id: "callout-1",
        featureRefIds: [args.featureRefId],
        leaderTargetKind: "feature" as const,
        frameStyle: "single" as const,
        rawText: args.rawText,
        normalizedText: args.rawText,
        supportStatus: args.supportStatus ?? "supported",
        reviewStatus: args.reviewRequired ? "needs_review" : "human_confirmed",
        unsupportedReasonCodes: [],
        confidence: 0.87,
        segments: [
          {
            characteristic: args.characteristic,
            toleranceValue: args.toleranceValue,
            zoneShape:
              args.characteristic === "flatness"
                ? "parallel_planes"
                : args.characteristic === "circular_runout" || args.characteristic === "total_runout"
                  ? "circle"
                  : "cylinder",
            zoneDiameter:
              args.characteristic === "position" ||
              args.characteristic === "perpendicularity" ||
              args.characteristic === "circular_runout" ||
              args.characteristic === "total_runout",
            materialCondition: null,
            datumReferences:
              args.characteristic === "flatness"
                ? []
                : [
                    {
                      precedence: 1,
                      datumLabel: args.datumLabel,
                      referenceType: "single",
                      materialBoundary: null,
                    },
                  ],
            extendedModifiers: [],
          },
        ],
      },
    ],
  };
}

const fixtureOneSpec: AxisymmetricPartSpec = {
  partName: "Hexágono M12",
  drawingNumber: "115.188-A",
  unit: "mm",
  totalLengthMm: 8.4,
  segments: [
    createSegment({
      label: "Acionamento quadrado",
      kind: "cylinder",
      lengthMm: 1.5,
      startDiameterMm: 6,
      endDiameterMm: 6,
      externalShape: "square",
      acrossFlatsMm: 6,
      confidence: 0.78,
    }),
    createSegment({
      label: "Transição esquerda",
      kind: "taper",
      lengthMm: 1.6,
      startDiameterMm: 6,
      endDiameterMm: 15,
      externalShape: "round",
      confidence: 0.62,
    }),
    createSegment({
      label: "Corpo sextavado",
      kind: "cylinder",
      lengthMm: 2,
      startDiameterMm: 15,
      endDiameterMm: 15,
      externalShape: "hex",
      acrossFlatsMm: 11.5,
      confidence: 0.86,
    }),
    createSegment({
      label: "Pescoço",
      kind: "cylinder",
      lengthMm: 0.85,
      startDiameterMm: 12,
      endDiameterMm: 12,
      externalShape: "round",
      filletStartRadiusMm: 0.5,
      confidence: 0.8,
    }),
    createSegment({
      label: "Rosca externa",
      kind: "thread",
      lengthMm: 2.45,
      startDiameterMm: 12,
      endDiameterMm: 12,
      externalShape: "round",
      threadDesignation: "M12",
      threadPitchMm: 1.75,
      chamferEndMm: 0.2,
      chamferEndAngleDeg: 45,
      confidence: 0.82,
    }),
  ],
  axialBores: [createBore({ label: "Furo esquerdo", diameterMm: 4, depthMm: 1, confidence: 0.58 })],
  notes: ["Fixture de teste baseada no croqui inicial do hexágono M12."],
  unsupportedFeatures: [],
};

const fixtureTwoSpec: AxisymmetricPartSpec = {
  partName: "Eixo roscado M2",
  drawingNumber: null,
  unit: "mm",
  totalLengthMm: 6.5,
  segments: [
    createSegment({
      label: "Cabeça sextavada",
      kind: "cylinder",
      lengthMm: 0.5,
      startDiameterMm: 2.3,
      endDiameterMm: 2.3,
      externalShape: "hex",
      acrossFlatsMm: 1.2,
      chamferStartMm: 0.15,
      chamferStartAngleDeg: 20,
      confidence: 0.92,
    }),
    createSegment({
      label: "Pescoço",
      kind: "cylinder",
      lengthMm: 0.6,
      startDiameterMm: 2,
      endDiameterMm: 2,
      externalShape: "round",
      confidence: 0.94,
    }),
    createSegment({
      label: "Haste principal",
      kind: "cylinder",
      lengthMm: 3.2,
      startDiameterMm: 1.45,
      endDiameterMm: 1.45,
      externalShape: "round",
      filletStartRadiusMm: 0.5,
      confidence: 0.95,
    }),
    createSegment({
      label: "Rosca externa",
      kind: "thread",
      lengthMm: 1.7,
      startDiameterMm: 2,
      endDiameterMm: 2,
      externalShape: "round",
      threadDesignation: "M2",
      threadPitchMm: 0.4,
      confidence: 0.96,
    }),
    createSegment({
      label: "Ponta",
      kind: "cylinder",
      lengthMm: 0.5,
      startDiameterMm: 1.4,
      endDiameterMm: 1.4,
      externalShape: "round",
      chamferEndMm: 0.2,
      chamferEndAngleDeg: 45,
      confidence: 0.9,
    }),
  ],
  axialBores: [createBore({ label: "Broca", diameterMm: 1.2, depthMm: 1, confidence: 0.73 })],
  notes: ["Fixture de teste equivalente ao croqui intermediário com rosca M2x0,4."],
  unsupportedFeatures: [],
};

const fixtureThreeSpec: AxisymmetricPartSpec = {
  partName: "Peça com chato lateral",
  drawingNumber: null,
  unit: "mm",
  totalLengthMm: 11.48,
  segments: [
    createSegment({
      label: "Corpo largo",
      kind: "cylinder",
      lengthMm: 5.03,
      startDiameterMm: 4,
      endDiameterMm: 4,
      externalShape: "round",
      confidence: 0.72,
    }),
    createSegment({
      label: "Pescoço 1",
      kind: "cylinder",
      lengthMm: 1.24,
      startDiameterMm: 4.16,
      endDiameterMm: 4.16,
      externalShape: "round",
      confidence: 0.64,
    }),
    createSegment({
      label: "Corpo central",
      kind: "cylinder",
      lengthMm: 2.01,
      startDiameterMm: 3.34,
      endDiameterMm: 3.34,
      externalShape: "round",
      confidence: 0.62,
    }),
    createSegment({
      label: "Flange",
      kind: "cylinder",
      lengthMm: 0.5,
      startDiameterMm: 4.74,
      endDiameterMm: 4.74,
      externalShape: "round",
      confidence: 0.6,
    }),
    createSegment({
      label: "Pescoço 2",
      kind: "cylinder",
      lengthMm: 0.6,
      startDiameterMm: 4.18,
      endDiameterMm: 4.18,
      externalShape: "round",
      confidence: 0.58,
    }),
    createSegment({
      label: "Canal",
      kind: "cylinder",
      lengthMm: 0.4,
      startDiameterMm: 3.38,
      endDiameterMm: 3.38,
      externalShape: "round",
      confidence: 0.55,
    }),
    createSegment({
      label: "Ponta",
      kind: "cylinder",
      lengthMm: 1.7,
      startDiameterMm: 2,
      endDiameterMm: 2,
      externalShape: "round",
      chamferEndMm: 0.2,
      chamferEndAngleDeg: 45,
      confidence: 0.74,
    }),
  ],
  axialBores: [createBore({ label: "Rosca/broca interna", diameterMm: 1.5, depthMm: 4, confidence: 0.41 })],
  notes: ["Fixture de teste com cotagem densa e feature lateral fora do escopo da V1."],
  unsupportedFeatures: [
    {
      id: crypto.randomUUID(),
      label: "Chato lateral",
      note: "Croqui indica “chato largura 3,00”; a V1 sinaliza a feature, mas não gera geometria 3D/2D não axisimétrica automaticamente.",
      confidence: 0.91,
    },
  ],
};

function extractionResultFor(
  spec: AxisymmetricPartSpec,
  semanticDraft: EngineeringDrawingSemanticDocument,
  summary: string,
  ambiguities: ExtractionResult["ambiguities"],
  extractionSource: ExtractionResult["extractionSource"] = "fixture",
): ExtractionResult {
  const confidences = spec.segments
    .map((segment) => segment.confidence)
    .concat(spec.axialBores.map((bore) => bore.confidence))
    .concat(semanticDraft.gdtCallouts.map((callout) => callout.confidence))
    .filter((value): value is number => typeof value === "number");

  const confidenceSummary = confidences.reduce(
    (summaryAccumulator, confidence) => {
      if (confidence >= 0.85) summaryAccumulator.high += 1;
      else if (confidence >= 0.65) summaryAccumulator.medium += 1;
      else summaryAccumulator.low += 1;
      return summaryAccumulator;
    },
    createDefaultConfidenceSummary(),
  );

  return {
    geometryDraft: spec,
    semanticDraft: {
      ...semanticDraft,
      ambiguityFlags: ambiguities,
    },
    specDraft: spec,
    ambiguities,
    confidenceSummary,
    sourceSketchSummary: summary,
    extractionSource,
  };
}

function createSyntheticSpec(id: number): AxisymmetricPartSpec {
  const headLength = 1.4;
  const bodyLength = 4.2;
  const threadLength = 2.2;
  return {
    partName: `Eixo sintético ${id.toString().padStart(2, "0")}`,
    drawingNumber: `SYN-${id.toString().padStart(3, "0")}`,
    unit: "mm",
    totalLengthMm: headLength + bodyLength + threadLength,
    segments: [
      createSegment({
        label: "Cabeça",
        kind: "cylinder",
        lengthMm: headLength,
        startDiameterMm: 3.2 + id * 0.05,
        endDiameterMm: 3.2 + id * 0.05,
        externalShape: id % 3 === 0 ? "hex" : "round",
        acrossFlatsMm: id % 3 === 0 ? 2.4 + id * 0.05 : null,
        confidence: 0.93,
      }),
      createSegment({
        label: "Corpo",
        kind: id % 4 === 0 ? "taper" : "cylinder",
        lengthMm: bodyLength,
        startDiameterMm: 2.4,
        endDiameterMm: id % 4 === 0 ? 1.8 : 2.4,
        externalShape: "round",
        confidence: 0.9,
      }),
      createSegment({
        label: "Rosca",
        kind: "thread",
        lengthMm: threadLength,
        startDiameterMm: 2,
        endDiameterMm: 2,
        externalShape: "round",
        threadDesignation: "M2",
        threadPitchMm: 0.4,
        confidence: 0.91,
      }),
    ],
    axialBores: id % 2 === 0 ? [createBore({ label: "Broca", diameterMm: 1.1, depthMm: 1.4, confidence: 0.86 })] : [],
    notes: [`Fixture sintética suportada ${id}.`],
    unsupportedFeatures: [],
  };
}

function createSyntheticSupportedFixtures(): EngineeringDrawingFixture[] {
  return Array.from({ length: 10 }, (_, index) => {
    const id = index + 1;
    const spec = createSyntheticSpec(id);
    const semantic = buildFeatureIndex(spec, spec.drawingNumber);

    return {
      id: `synthetic-supported-${id.toString().padStart(2, "0")}`,
      title: spec.partName,
      description: "Caso sintético suportado para validação completa 2D + 3D.",
      imageUrl: "/engineering-drawing/fixtures/synthetic-axisymmetric-sketch.svg",
      fileAliases: [`synthetic-supported-${id.toString().padStart(2, "0")}.svg`],
      extractionResult: extractionResultFor(
        spec,
        semantic,
        "Fixture sintética suportada, com geometria axisimétrica pronta para 2D e GLB.",
        [],
      ),
      sourceType: "synthetic",
      provenance: {
        label: "Synthetic axisymmetric template",
        license: "internal-generated",
        sourceUrl: null,
        notes: "Gerada a partir de template determinístico com ground truth no próprio fixture.",
      },
      expectedOutcome: {
        twoD: "pass",
        threeD: "pass",
        reviewRequired: false,
      },
    };
  });
}

function createSyntheticReviewFixtures(): EngineeringDrawingFixture[] {
  const baseSpec = createSyntheticSpec(11);
  const baseSemantic = buildFeatureIndex(baseSpec, baseSpec.drawingNumber);

  const reviewCases = [
    {
      id: "synthetic-review-standard",
      title: "Perpendicularidade com norma pendente",
      callout: withSingleDatumCallout({
        base: baseSemantic,
        datumLabel: "A",
        datumType: "plane",
        featureRefId: baseSpec.segments[1].id,
        characteristic: "perpendicularity",
        toleranceValue: 0.05,
        rawText: "⟂ ⌀0,05 | A",
        governingStandardSystem: "UNKNOWN",
        reviewRequired: true,
      }),
      ambiguities: [
        {
          id: crypto.randomUUID(),
          fieldPath: "documentMetadata.governingStandard",
          question: "Selecione a norma aplicável ao desenho.",
          reason: "Há GD&T presente e a norma não foi confirmada.",
          confidence: 0.52,
          suggestedAction: "Escolher ASME ou ISO antes da aprovação.",
        },
      ],
    },
    {
      id: "synthetic-review-runout",
      title: "Batimento com datum a confirmar",
      callout: withSingleDatumCallout({
        base: baseSemantic,
        datumLabel: "A",
        datumType: "axis",
        featureRefId: baseSpec.segments[2].id,
        characteristic: "circular_runout",
        toleranceValue: 0.03,
        rawText: "BAT. CIRC. 0,03 | A",
        governingStandardSystem: "ASME",
        edition: "2018",
        reviewRequired: true,
      }),
      ambiguities: [
        {
          id: crypto.randomUUID(),
          fieldPath: "datumFeatures.0.datumType",
          question: "Confirmar se o datum A representa um eixo derivado.",
          reason: "O leader e a cota de tamanho estão muito próximos no sketch.",
          confidence: 0.61,
          suggestedAction: "Confirmar o datum antes da exportação.",
        },
      ],
    },
    {
      id: "synthetic-review-flatness",
      title: "Planicidade com face a confirmar",
      callout: withSingleDatumCallout({
        base: baseSemantic,
        datumLabel: "A",
        datumType: "plane",
        featureRefId: baseSpec.segments[0].id,
        characteristic: "flatness",
        toleranceValue: 0.02,
        rawText: "⌔ 0,02",
        governingStandardSystem: "ISO",
        edition: "1101:2017",
        reviewRequired: true,
      }),
      ambiguities: [
        {
          id: crypto.randomUUID(),
          fieldPath: "gdtCallouts.0.featureRefIds",
          question: "A planicidade controla a face frontal ou a face oposta do cabeçote?",
          reason: "A associação automática da face ainda não é robusta.",
          confidence: 0.55,
          suggestedAction: "Selecionar a face controlada.",
        },
      ],
    },
    {
      id: "synthetic-review-position",
      title: "Posição com datum comum",
      callout: withSingleDatumCallout({
        base: baseSemantic,
        datumLabel: "A-B",
        datumType: "common",
        featureRefId: baseSpec.segments[1].id,
        characteristic: "position",
        toleranceValue: 0.1,
        rawText: "⌖ ⌀0,10 | A-B",
        governingStandardSystem: "ISO",
        edition: "1101:2017",
        reviewRequired: true,
        supportStatus: "partial",
      }),
      ambiguities: [
        {
          id: crypto.randomUUID(),
          fieldPath: "gdtCallouts.0.segments.0.datumReferences",
          question: "A-B deve ser tratado como datum comum único?",
          reason: "A referência composta exige confirmação humana.",
          confidence: 0.5,
          suggestedAction: "Confirmar o datum comum antes da aprovação.",
        },
      ],
    },
    {
      id: "synthetic-review-composite",
      title: "Quadro composto não suportado",
      callout: {
        ...baseSemantic,
        documentMetadata: {
          ...baseSemantic.documentMetadata,
          governingStandard: {
            system: "ASME",
            edition: "2018",
            source: "manual",
          },
        },
        gdtCallouts: [
          {
            id: "callout-composite",
            featureRefIds: [baseSpec.segments[1].id],
            leaderTargetKind: "feature",
            frameStyle: "composite",
            rawText: "⌖ ⌀0,20 | A | B | C / 0,05 | A | B",
            normalizedText: "COMPOSITE POSITION",
            supportStatus: "unsupported",
            reviewStatus: "needs_review",
            unsupportedReasonCodes: ["composite-frame-v3-only"],
            confidence: 0.72,
            segments: [
              {
                characteristic: "position",
                toleranceValue: 0.2,
                zoneShape: "cylinder",
                zoneDiameter: true,
                materialCondition: null,
                datumReferences: [
                  { precedence: 1, datumLabel: "A", referenceType: "single", materialBoundary: null },
                  { precedence: 2, datumLabel: "B", referenceType: "single", materialBoundary: null },
                  { precedence: 3, datumLabel: "C", referenceType: "single", materialBoundary: null },
                ],
                extendedModifiers: [],
              },
              {
                characteristic: "position",
                toleranceValue: 0.05,
                zoneShape: "cylinder",
                zoneDiameter: true,
                materialCondition: null,
                datumReferences: [
                  { precedence: 1, datumLabel: "A", referenceType: "single", materialBoundary: null },
                  { precedence: 2, datumLabel: "B", referenceType: "single", materialBoundary: null },
                ],
                extendedModifiers: [],
              },
            ],
          },
        ],
      },
      ambiguities: [
        {
          id: crypto.randomUUID(),
          fieldPath: "gdtCallouts.0.frameStyle",
          question: "Quadro composto confirmado?",
          reason: "A V1 não automatiza semântica composta.",
          confidence: 0.69,
          suggestedAction: "Manter como review-required.",
        },
      ],
    },
    {
      id: "synthetic-review-legacy",
      title: "Concentricidade legada",
      callout: withSingleDatumCallout({
        base: baseSemantic,
        datumLabel: "A",
        datumType: "axis",
        featureRefId: baseSpec.segments[2].id,
        characteristic: "concentricity_legacy",
        toleranceValue: 0.02,
        rawText: "◎ ⌀0,02 | A",
        governingStandardSystem: "ASME",
        edition: "2018",
        reviewRequired: true,
        supportStatus: "unsupported",
      }),
      ambiguities: [],
    },
  ];

  return reviewCases.map((item) => ({
    id: item.id,
    title: item.title,
    description: "Caso sintético com GD&T para revisão obrigatória.",
    imageUrl: "/engineering-drawing/fixtures/synthetic-gdt-sketch.svg",
    fileAliases: [`${item.id}.svg`],
    extractionResult: extractionResultFor(
      baseSpec,
      item.callout,
      "Fixture sintética com GD&T e revisão humana obrigatória.",
      item.ambiguities,
    ),
    sourceType: "synthetic",
    provenance: {
      label: "Synthetic GD&T template",
      license: "internal-generated",
      sourceUrl: null,
      notes: "Caso sintético gerado a partir de template determinístico para validação semântica.",
    },
    expectedOutcome: {
      twoD: "pass",
      threeD: "blocked",
      reviewRequired: true,
    },
  }));
}

function createSyntheticUnsupportedFixtures(): EngineeringDrawingFixture[] {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `synthetic-unsupported-${index + 1}`,
    title: `Caso não axisimétrico ${index + 1}`,
    description: "Caso sintético fora do escopo do 3D v1.",
    imageUrl: "/engineering-drawing/fixtures/synthetic-unsupported-sketch.svg",
    fileAliases: [`synthetic-unsupported-${index + 1}.svg`],
    extractionResult: extractionResultFor(
      fixtureThreeSpec,
      buildFeatureIndex(fixtureThreeSpec),
      "Fixture sintética fora do escopo axisimétrico.",
      [
        {
          id: crypto.randomUUID(),
          fieldPath: "unsupportedFeatures.0",
          question: "Validar manualmente a feature lateral antes de aprovar.",
          reason: "A feature fora do escopo bloqueia o 3D.",
          confidence: 0.9,
          suggestedAction: "Manter o bloqueio de export 3D.",
        },
      ],
    ),
    sourceType: "synthetic",
    provenance: {
      label: "Synthetic unsupported template",
      license: "internal-generated",
      sourceUrl: null,
      notes: "Usado para garantir que geometrias fora do escopo permaneçam preservadas e bloqueadas.",
    },
    expectedOutcome: {
      twoD: "pass",
      threeD: "blocked",
      reviewRequired: true,
    },
  }));
}

function createPublicReferenceFixtures(): EngineeringDrawingFixture[] {
  const spec = createSyntheticSpec(12);
  const semantic = withSingleDatumCallout({
    base: buildFeatureIndex(spec, spec.drawingNumber),
    datumLabel: "A",
    datumType: "plane",
    featureRefId: spec.segments[1].id,
    characteristic: "perpendicularity",
    toleranceValue: 0.04,
    rawText: "⟂ ⌀0,04 | A",
    governingStandardSystem: "ASME",
    edition: "2018",
    reviewRequired: true,
  });

  const publicSources = [
    {
      id: "public-nist-ctc1",
      title: "NIST CAD PMI reference 1",
      url: "https://pages.nist.gov/CAD-PMI-Testing/models.html",
      notes: "Referência pública oficial para corpus e revisão manual; imagem não versionada no repositório.",
    },
    {
      id: "public-nist-results",
      title: "NIST CAD PMI results reference",
      url: "https://pages.nist.gov/CAD-PMI-Testing/results.html",
      notes: "Referência pública oficial para casos PMI/FCF; usada como origem documental do corpus.",
    },
    {
      id: "public-nist-validation",
      title: "NIST PMI validation program",
      url: "https://www.nist.gov/ctl/smart-connected-systems-division/smart-connected-manufacturing-systems-group/mbe-pmi-validation",
      notes: "Referência pública oficial para validação semântica PMI; fixture mantido como manifesto.",
    },
    {
      id: "public-nist-conceptual-datum",
      title: "NIST datum model reference",
      url: "https://nvlpubs.nist.gov/nistpubs/jres/104/4/html/j44mac.htm",
      notes: "Referência pública oficial para datum systems; fixture mantido como manifesto.",
    },
  ];

  return publicSources.map((item) => ({
    id: item.id,
    title: item.title,
    description: "Referência pública oficial mantida como fixture de manifesto/revisão.",
    imageUrl: "/engineering-drawing/fixtures/synthetic-gdt-sketch.svg",
    fileAliases: [],
    extractionResult: extractionResultFor(
      spec,
      semantic,
      "Fixture de manifesto público para referência documental e revisão manual.",
      [
        {
          id: crypto.randomUUID(),
          fieldPath: "documentMetadata.governingStandard",
          question: "Confirmar se a referência pública deve entrar no corpus executável local.",
          reason: "O repositório mantém apenas o manifesto e a origem oficial.",
          confidence: null,
          suggestedAction: "Baixar/localizar o material somente quando a licença estiver clara.",
        },
      ],
    ),
    sourceType: "public",
    provenance: {
      label: item.title,
      license: "public-reference-manifest-only",
      sourceUrl: item.url,
      notes: item.notes,
    },
    expectedOutcome: {
      twoD: "blocked",
      threeD: "blocked",
      reviewRequired: true,
    },
  }));
}

const internalFixtures: EngineeringDrawingFixture[] = [
  {
    id: "hexagono-m12",
    title: "Hexágono M12",
    description: "Caso base com corpo sextavado, furo axial e rosca externa M12.",
    imageUrl: "/engineering-drawing/fixtures/hexagono-m12-sketch.jpeg",
    fileAliases: ["hexagono-m12-sketch.jpeg", "whatsapp-image-2026-04-02-at-14.31.26.jpeg"],
    extractionResult: extractionResultFor(
      fixtureOneSpec,
      buildFeatureIndex(fixtureOneSpec, fixtureOneSpec.drawingNumber),
      "Croqui base interpretado como peça predominantemente axisimétrica com corpo sextavado central, acionamento quadrado e rosca externa.",
      [
        {
          id: crypto.randomUUID(),
          fieldPath: "geometryDraft.axialBores.0.depthMm",
          question: "Confirmar profundidade do furo esquerdo.",
          reason: "O croqui mostra o furo, mas a profundidade não está completamente legível.",
          confidence: 0.58,
          suggestedAction: "Revisar a profundidade antes da exportação.",
        },
      ],
    ),
    sourceType: "internal",
    provenance: {
      label: "Internal fixture",
      license: "internal",
      sourceUrl: null,
      notes: "Fixture fotográfico real já usado no fluxo atual.",
    },
    expectedOutcome: {
      twoD: "pass",
      threeD: "blocked",
      reviewRequired: true,
    },
  },
  {
    id: "eixo-roscado",
    title: "Eixo roscado M2",
    description: "Caso positivo completo para 2D com cabeça sextavada e rosca M2x0,4.",
    imageUrl: "/engineering-drawing/fixtures/eixo-roscado-sketch.jpg",
    fileAliases: ["eixo-roscado-sketch.jpg"],
    extractionResult: extractionResultFor(
      fixtureTwoSpec,
      buildFeatureIndex(fixtureTwoSpec),
      "Croqui bem formado, com cabeça sextavada, haste principal e rosca externa curta.",
      [
        {
          id: crypto.randomUUID(),
          fieldPath: "geometryDraft.axialBores.0.diameterMm",
          question: "Confirmar o diâmetro da broca interna.",
          reason: "A anotação do furo é legível, mas aparece com menor confiança do que as cotas externas.",
          confidence: 0.73,
          suggestedAction: "Revisar a broca antes da exportação final.",
        },
      ],
    ),
    sourceType: "internal",
    provenance: {
      label: "Internal fixture",
      license: "internal",
      sourceUrl: null,
      notes: "Caso base positivo para o fluxo completo 2D + 3D.",
    },
    expectedOutcome: {
      twoD: "pass",
      threeD: "pass",
      reviewRequired: false,
    },
  },
  {
    id: "chato-complexo",
    title: "Peça com chato lateral",
    description: "Caso de estresse com cotagem densa e feature não axisimétrica fora do escopo da V1.",
    imageUrl: "/engineering-drawing/fixtures/chato-complexo-sketch.jpg",
    fileAliases: ["chato-complexo-sketch.jpg"],
    extractionResult: extractionResultFor(
      fixtureThreeSpec,
      buildFeatureIndex(fixtureThreeSpec),
      "Croqui complexo com múltiplos degraus e indicação explícita de chato lateral.",
      [
        {
          id: crypto.randomUUID(),
          fieldPath: "geometryDraft.unsupportedFeatures.0",
          question: "Validar o chato lateral manualmente.",
          reason: "A V1 não aproxima geometrias não axisimétricas sem confirmação humana.",
          confidence: 0.91,
          suggestedAction: "Manter como alerta e seguir com 2D preliminar.",
        },
      ],
    ),
    sourceType: "internal",
    provenance: {
      label: "Internal fixture",
      license: "internal",
      sourceUrl: null,
      notes: "Caso de estresse para bloquear 3D e manter review obrigatório.",
    },
    expectedOutcome: {
      twoD: "pass",
      threeD: "blocked",
      reviewRequired: true,
    },
  },
];

export const engineeringDrawingFixtures: EngineeringDrawingFixture[] = [
  ...internalFixtures,
  ...createSyntheticSupportedFixtures(),
  ...createSyntheticReviewFixtures(),
  ...createSyntheticUnsupportedFixtures(),
  ...createPublicReferenceFixtures(),
];

export function findFixtureByFileName(fileName: string): EngineeringDrawingFixture | null {
  const normalized = fileName.trim().toLowerCase();
  return (
    engineeringDrawingFixtures.find((fixture) =>
      fixture.fileAliases.some((alias) => alias.toLowerCase() === normalized),
    ) ?? null
  );
}

export function findFixtureById(id: string): EngineeringDrawingFixture | null {
  return engineeringDrawingFixtures.find((fixture) => fixture.id === id) ?? null;
}

export function createManualExtraction(partName: string, note?: string): ExtractionResult {
  const geometryDraft = createEmptySpec(partName || "Nova peça");
  const semanticDraft = createEmptySemanticDocument(partName || "Nova peça");

  return {
    geometryDraft,
    semanticDraft,
    specDraft: geometryDraft,
    ambiguities: [
      {
        id: crypto.randomUUID(),
        fieldPath: "geometryDraft.segments",
        question: "Extrair manualmente os trechos do croqui.",
        reason: note ?? "A extração IA não está disponível neste ambiente ou o sketch não faz parte do corpus oficial de teste.",
        confidence: null,
        suggestedAction: "Preencher a tabela de revisão antes de gerar o 2D.",
      },
    ],
    confidenceSummary: createDefaultConfidenceSummary(),
    sourceSketchSummary: note ?? "Draft manual iniciado sem inferir medidas.",
    extractionSource: "manual",
  };
}

export function buildFixtureSession(
  fixture: EngineeringDrawingFixture,
  mode: EngineeringDrawingSessionRecord["backendMode"] = "local",
): EngineeringDrawingSessionRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: fixture.title,
    status: "extracted",
    unit: "mm",
    notes: fixture.description,
    sourceImagePath: fixture.imageUrl,
    sourceImageName: fixture.fileAliases[0] ?? fixture.id,
    sourceImageUrl: fixture.imageUrl,
    rawExtraction: fixture.extractionResult,
    normalizedSpec: fixture.extractionResult.geometryDraft,
    normalizedDocument: fixture.extractionResult.semanticDraft,
    reviewState: buildReview(mode, fixture.extractionResult),
    validationReport: null,
    drawingSvg: null,
    threeDPreviewStatus: null,
    threeDAsset: null,
    renderMetadata: { fixtureId: fixture.id, fixtureMetadata: fixture.expectedOutcome },
    exports: {},
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    reviewedBy: null,
    backendMode: mode,
    fixtureId: fixture.id,
  };
}

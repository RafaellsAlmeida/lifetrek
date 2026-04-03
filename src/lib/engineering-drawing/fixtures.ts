import {
  createBore,
  createDefaultConfidenceSummary,
  createDefaultReviewState,
  createEmptySpec,
  createSegment,
} from "./types";
import type {
  AxisymmetricPartSpec,
  EngineeringDrawingSessionRecord,
  ExtractionResult,
  ReviewState,
} from "./types";

export interface EngineeringDrawingFixture {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  fileAliases: string[];
  extractionResult: ExtractionResult;
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

function extractionResultFor(spec: AxisymmetricPartSpec, summary: string, ambiguities: ExtractionResult["ambiguities"]): ExtractionResult {
  const confidences = spec.segments
    .map((segment) => segment.confidence)
    .concat(spec.axialBores.map((bore) => bore.confidence))
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
    specDraft: spec,
    ambiguities,
    confidenceSummary,
    sourceSketchSummary: summary,
    extractionSource: "fixture",
  };
}

export const engineeringDrawingFixtures: EngineeringDrawingFixture[] = [
  {
    id: "hexagono-m12",
    title: "Hexágono M12",
    description: "Caso base com corpo sextavado, furo axial e rosca externa M12.",
    imageUrl: "/engineering-drawing/fixtures/hexagono-m12-sketch.jpeg",
    fileAliases: ["hexagono-m12-sketch.jpeg", "whatsapp-image-2026-04-02-at-14.31.26.jpeg"],
    extractionResult: extractionResultFor(
      fixtureOneSpec,
      "Croqui base interpretado como peça predominantemente axisimétrica com corpo sextavado central, acionamento quadrado e rosca externa.",
      [
        {
          id: crypto.randomUUID(),
          fieldPath: "axialBores.0.depthMm",
          question: "Confirmar profundidade do furo esquerdo.",
          reason: "O croqui mostra o furo, mas a profundidade não está completamente legível.",
          confidence: 0.58,
          suggestedAction: "Revisar a profundidade antes da exportação.",
        },
      ],
    ),
  },
  {
    id: "eixo-roscado",
    title: "Eixo roscado M2",
    description: "Caso positivo completo para 2D com cabeça sextavada e rosca M2x0,4.",
    imageUrl: "/engineering-drawing/fixtures/eixo-roscado-sketch.jpg",
    fileAliases: ["eixo-roscado-sketch.jpg"],
    extractionResult: extractionResultFor(
      fixtureTwoSpec,
      "Croqui bem formado, com cabeça sextavada, haste principal e rosca externa curta.",
      [
        {
          id: crypto.randomUUID(),
          fieldPath: "axialBores.0.diameterMm",
          question: "Confirmar o diâmetro da broca interna.",
          reason: "A anotação do furo é legível, mas aparece com menor confiança do que as cotas externas.",
          confidence: 0.73,
          suggestedAction: "Revisar a broca antes da exportação final.",
        },
      ],
    ),
  },
  {
    id: "chato-complexo",
    title: "Peça com chato lateral",
    description: "Caso de estresse com cotagem densa e feature não axisimétrica fora do escopo da V1.",
    imageUrl: "/engineering-drawing/fixtures/chato-complexo-sketch.jpg",
    fileAliases: ["chato-complexo-sketch.jpg"],
    extractionResult: extractionResultFor(
      fixtureThreeSpec,
      "Croqui complexo com múltiplos degraus e indicação explícita de chato lateral.",
      [
        {
          id: crypto.randomUUID(),
          fieldPath: "unsupportedFeatures.0",
          question: "Validar o chato lateral manualmente.",
          reason: "A V1 não aproxima geometrias não axisimétricas sem confirmação humana.",
          confidence: 0.91,
          suggestedAction: "Manter como alerta e seguir com 2D preliminar.",
        },
      ],
    ),
  },
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
  const specDraft = createEmptySpec(partName || "Nova peça");
  return {
    specDraft,
    ambiguities: [
      {
        id: crypto.randomUUID(),
        fieldPath: "segments",
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
    sourceImageName: fixture.fileAliases[0],
    sourceImageUrl: fixture.imageUrl,
    rawExtraction: fixture.extractionResult,
    normalizedSpec: fixture.extractionResult.specDraft,
    reviewState: buildReview(mode, fixture.extractionResult),
    validationReport: null,
    drawingSvg: null,
    renderMetadata: {},
    exports: {},
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    reviewedBy: null,
    backendMode: mode,
    fixtureId: fixture.id,
  };
}

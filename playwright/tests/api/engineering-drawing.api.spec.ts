import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { expect, test } from "../../support/merged-fixtures";

import { engineeringDrawingFixtures, findFixtureById } from "../../../src/lib/engineering-drawing/fixtures";
import { render3D } from "../../../src/lib/engineering-drawing/render3d";
import { validateEngineeringDrawing } from "../../../src/lib/engineering-drawing/validation";
import {
  createBore,
  createEmptySemanticDocument,
  createEmptySpec,
  createSegment,
} from "../../../src/lib/engineering-drawing/types";
import type {
  AxisymmetricPartSpec,
  EngineeringDrawingSemanticDocument,
  GdtCharacteristic,
} from "../../../src/lib/engineering-drawing/types";

function buildBaseSpec(partName = "Spec de teste"): AxisymmetricPartSpec {
  return {
    ...createEmptySpec(partName),
    totalLengthMm: 10,
    segments: [
      createSegment({
        label: "Corpo",
        kind: "cylinder",
        lengthMm: 10,
        startDiameterMm: 4,
        endDiameterMm: 4,
        externalShape: "round",
      }),
    ],
  };
}

function buildSemanticDocument(
  spec: AxisymmetricPartSpec,
  characteristic: GdtCharacteristic,
  options: {
    standard?: EngineeringDrawingSemanticDocument["documentMetadata"]["governingStandard"];
    datum?: { label: string; datumType: "plane" | "axis" | "common" | "center_plane" | "point" | "unknown" };
    reviewStatus?: EngineeringDrawingSemanticDocument["gdtCallouts"][number]["reviewStatus"];
    supportStatus?: EngineeringDrawingSemanticDocument["gdtCallouts"][number]["supportStatus"];
    datumReferences?: Array<{ precedence: number; datumLabel: string }>;
  } = {},
) {
  const document = createEmptySemanticDocument(spec.partName);
  document.documentMetadata.governingStandard = options.standard ?? {
    system: "ASME",
    edition: "2018",
    source: "manual",
  };
  document.datumFeatures = options.datum
    ? [
        {
          id: `datum-${options.datum.label.toLowerCase()}`,
          label: options.datum.label,
          featureRefId: spec.segments[0]?.id ?? null,
          datumType: options.datum.datumType,
          rawTagText: options.datum.label,
          materialBoundary: null,
          confidence: 0.92,
          needsHumanConfirmation: false,
        },
      ]
    : [];
  document.gdtCallouts = [
    {
      id: "callout-1",
      featureRefIds: [spec.segments[0]?.id ?? "feature-1"],
      leaderTargetKind: "feature",
      frameStyle: "single",
      rawText: characteristic,
      normalizedText: characteristic,
      supportStatus: options.supportStatus ?? "supported",
      reviewStatus: options.reviewStatus ?? "human_confirmed",
      unsupportedReasonCodes: [],
      confidence: 0.9,
      segments: [
        {
          characteristic,
          toleranceValue: 0.05,
          zoneShape:
            characteristic === "flatness"
              ? "parallel_planes"
              : characteristic === "circular_runout" || characteristic === "total_runout"
                ? "circle"
                : "cylinder",
          zoneDiameter:
            characteristic === "perpendicularity" ||
            characteristic === "position" ||
            characteristic === "circular_runout" ||
            characteristic === "total_runout",
          materialCondition: null,
          datumReferences:
            options.datumReferences?.map((reference) => ({
              ...reference,
              referenceType: "single" as const,
              materialBoundary: null,
            })) ?? [],
          extendedModifiers: [],
        },
      ],
    },
  ];

  return document;
}

async function parseGlb(base64: string) {
  const loader = new GLTFLoader();
  const glb = Buffer.from(base64, "base64");
  return await new Promise<{ scene: { children: unknown[] } }>((resolve, reject) => {
    loader.parse(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), "", resolve, reject);
  });
}

test.describe("Engineering drawing contracts and validators", () => {
  test("accepts a supported axisymmetric part with no GD&T", () => {
    const spec = buildBaseSpec("Sem GD&T");
    const document = createEmptySemanticDocument(spec.partName);

    const report = validateEngineeringDrawing(spec, document);

    expect(report.blockingIssueCount).toBe(0);
    expect(report.reviewRequiredCount).toBe(0);
    expect(report.canExport).toBe(true);
  });

  test("accepts flatness without datum", () => {
    const spec = buildBaseSpec("Planicidade");
    const document = buildSemanticDocument(spec, "flatness");

    const report = validateEngineeringDrawing(spec, document);

    expect(report.issues.some((issue) => issue.code === "semantic-missing-datum")).toBe(false);
    expect(report.blockingIssueCount).toBe(0);
    expect(report.canExport).toBe(true);
  });

  test("accepts perpendicularity with datum", () => {
    const spec = buildBaseSpec("Perpendicularidade");
    const document = buildSemanticDocument(spec, "perpendicularity", {
      datum: { label: "A", datumType: "plane" },
      datumReferences: [{ precedence: 1, datumLabel: "A" }],
    });

    const report = validateEngineeringDrawing(spec, document);

    expect(report.blockingIssueCount).toBe(0);
    expect(report.reviewRequiredCount).toBe(0);
    expect(report.canExport).toBe(true);
  });

  test("blocks runout without datum", () => {
    const spec = buildBaseSpec("Batimento");
    const document = buildSemanticDocument(spec, "circular_runout");

    const report = validateEngineeringDrawing(spec, document);

    expect(report.issues.some((issue) => issue.code === "semantic-missing-datum")).toBe(true);
    expect(report.canExport).toBe(false);
  });

  test("forces review when governing standard is unknown and GD&T exists", () => {
    const spec = buildBaseSpec("Norma pendente");
    const document = buildSemanticDocument(spec, "position", {
      standard: { system: "UNKNOWN", edition: null, source: "unresolved" },
      datum: { label: "A", datumType: "axis" },
      datumReferences: [{ precedence: 1, datumLabel: "A" }],
    });

    const report = validateEngineeringDrawing(spec, document);

    expect(report.reviewRequiredCount).toBeGreaterThan(0);
    expect(report.issues.some((issue) => issue.code === "semantic-standard-required")).toBe(true);
    expect(report.canExport).toBe(false);
  });

  test("preserves unsupported composite or legacy callouts as review-required", () => {
    const fixture = findFixtureById("synthetic-review-composite");
    expect(fixture).not.toBeNull();

    const report = validateEngineeringDrawing(
      fixture!.extractionResult.geometryDraft,
      fixture!.extractionResult.semanticDraft,
    );

    expect(report.reviewRequiredCount).toBeGreaterThan(0);
    expect(report.issues.some((issue) => issue.code === "semantic-unsupported-callout")).toBe(true);
    expect(report.canExport).toBe(false);
  });
});

test.describe("Engineering drawing 3D and GLB", () => {
  test("builds a straight shaft and exports a loadable GLB", async () => {
    const result = await render3D(buildBaseSpec("Eixo reto"), createEmptySemanticDocument("Eixo reto"));

    expect(result.previewStatus).toBe("ready");
    expect(result.glbBase64).toBeTruthy();
    expect(result.meshSummary.segmentMeshCount).toBeGreaterThan(0);
    expect(result.boundingBoxMm.length).toBeCloseTo(10, 3);
    expect(result.boundingBoxMm.width).toBeCloseTo(4, 3);
    expect(result.boundingBoxMm.height).toBeCloseTo(4, 3);

    const parsed = await parseGlb(result.glbBase64!);
    expect(parsed.scene.children.length).toBeGreaterThan(0);
  });

  test("builds taper plus chamfer geometry without blocking GLB", async () => {
    const spec: AxisymmetricPartSpec = {
      ...createEmptySpec("Taper com chanfro"),
      totalLengthMm: 8,
      segments: [
        createSegment({
          label: "Taper",
          kind: "taper",
          lengthMm: 8,
          startDiameterMm: 6,
          endDiameterMm: 3,
          externalShape: "round",
          chamferEndMm: 0.5,
          chamferEndAngleDeg: 45,
        }),
      ],
    };

    const result = await render3D(spec, createEmptySemanticDocument(spec.partName));

    expect(result.previewStatus).toBe("ready");
    expect(result.glbBase64).toBeTruthy();
    expect(result.boundingBoxMm.length).toBeCloseTo(8, 3);
  });

  test("keeps threaded segments exportable as placeholder geometry", async () => {
    const spec: AxisymmetricPartSpec = {
      ...createEmptySpec("Rosca"),
      totalLengthMm: 6,
      segments: [
        createSegment({
          label: "Rosca",
          kind: "thread",
          lengthMm: 6,
          startDiameterMm: 4,
          endDiameterMm: 4,
          externalShape: "round",
          threadDesignation: "M4",
          threadPitchMm: 0.7,
        }),
      ],
    };

    const result = await render3D(spec, createEmptySemanticDocument(spec.partName));

    expect(result.previewStatus).toBe("ready");
    expect(result.meshSummary.segmentMeshCount).toBe(1);
    expect(result.glbBase64).toBeTruthy();
  });

  test("subtracts axial bores while keeping the outer envelope", async () => {
    const spec: AxisymmetricPartSpec = {
      ...buildBaseSpec("Com furo"),
      axialBores: [createBore({ label: "Broca", diameterMm: 2, depthMm: 4 })],
    };

    const result = await render3D(spec, createEmptySemanticDocument(spec.partName));

    expect(result.previewStatus).toBe("ready");
    expect(result.meshSummary.boreSectionCount).toBeGreaterThan(0);
    expect(result.boundingBoxMm.length).toBeCloseTo(10, 3);
    expect(result.boundingBoxMm.width).toBeCloseTo(4, 3);
  });

  test("blocks 3D when unsupported side flats remain in the spec", async () => {
    const fixture = findFixtureById("chato-complexo");
    expect(fixture).not.toBeNull();

    const result = await render3D(
      fixture!.extractionResult.geometryDraft,
      fixture!.extractionResult.semanticDraft,
    );

    expect(result.previewStatus).toBe("blocked");
    expect(result.blockingReasons.some((reason) => reason.includes("fora do escopo axisimétrico"))).toBe(true);
    expect(result.glbBase64).toBeNull();
  });
});

test.describe("Engineering drawing fixture corpus", () => {
  test("keeps the minimum 24-fixture corpus with declared expectations", () => {
    expect(engineeringDrawingFixtures.length).toBeGreaterThanOrEqual(24);

    const counts = engineeringDrawingFixtures.reduce(
      (summary, fixture) => {
        summary[fixture.sourceType] += 1;
        if (fixture.expectedOutcome.threeD === "pass") summary.threeDPass += 1;
        if (fixture.expectedOutcome.reviewRequired) summary.reviewRequired += 1;
        expect(fixture.provenance.license).toBeTruthy();
        return summary;
      },
      {
        internal: 0,
        synthetic: 0,
        public: 0,
        threeDPass: 0,
        reviewRequired: 0,
      },
    );

    expect(counts.synthetic).toBeGreaterThanOrEqual(20);
    expect(counts.public).toBeGreaterThanOrEqual(4);
    expect(counts.threeDPass).toBeGreaterThan(0);
    expect(counts.reviewRequired).toBeGreaterThan(0);
  });
});

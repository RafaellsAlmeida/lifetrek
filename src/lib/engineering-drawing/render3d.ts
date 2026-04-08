import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import { getResolvedTotalLength, resolveEndDiameter, roundTo } from "./format";
import { build3DModel } from "./model3d";
import { validateEngineeringDrawing } from "./validation";
import type {
  AxisymmetricPartSpec,
  EngineeringDrawingSemanticDocument,
  TechnicalDrawing3DResult,
} from "./types";

type SegmentSection = {
  segmentId: string;
  label: string;
  kind: "cylinder" | "taper" | "thread";
  externalShape: "round" | "hex" | "square";
  xStart: number;
  xEnd: number;
  startRadius: number;
  endRadius: number;
  acrossFlatsMm: number | null;
};

type BoreInterval = {
  xStart: number;
  xEnd: number;
  radius: number;
};

type SectionPiece = SegmentSection & {
  innerRadius: number;
};

type BuiltGroupResult = {
  group: THREE.Group;
  meshSummary: TechnicalDrawing3DResult["meshSummary"];
  boundingBoxMm: TechnicalDrawing3DResult["boundingBoxMm"];
};

function ensureFileReader() {
  if (typeof globalThis.FileReader !== "undefined") {
    return;
  }

  class MinimalFileReader {
    result: string | ArrayBuffer | null = null;
    error: Error | null = null;
    onload: ((event: Event) => void) | null = null;
    onloadend: ((event: Event) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    async readAsArrayBuffer(blob: Blob) {
      try {
        this.result = await blob.arrayBuffer();
        const event = new Event("load");
        this.onload?.(event);
        this.onloadend?.(event);
      } catch (error) {
        this.error = error instanceof Error ? error : new Error(String(error));
        const event = new Event("error");
        this.onerror?.(event);
        this.onloadend?.(event);
      }
    }

    async readAsDataURL(blob: Blob) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        const chunkSize = 0x8000;

        for (let index = 0; index < bytes.length; index += chunkSize) {
          binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
        }

        this.result = `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
        const event = new Event("load");
        this.onload?.(event);
        this.onloadend?.(event);
      } catch (error) {
        this.error = error instanceof Error ? error : new Error(String(error));
        const event = new Event("error");
        this.onerror?.(event);
        this.onloadend?.(event);
      }
    }
  }

  globalThis.FileReader = MinimalFileReader as typeof FileReader;
}

function buildSegmentSections(spec: AxisymmetricPartSpec): SegmentSection[] {
  let cursor = 0;
  return spec.segments.map((segment) => {
    const length = Math.max(segment.lengthMm ?? 0, 0);
    const section: SegmentSection = {
      segmentId: segment.id,
      label: segment.label,
      kind: segment.kind,
      externalShape: segment.externalShape,
      xStart: cursor,
      xEnd: cursor + length,
      startRadius: Math.max((segment.startDiameterMm ?? 0) / 2, 0),
      endRadius: Math.max((resolveEndDiameter(segment) ?? 0) / 2, 0),
      acrossFlatsMm: segment.acrossFlatsMm,
    };
    cursor += length;
    return section;
  });
}

function buildBoreIntervals(spec: AxisymmetricPartSpec): BoreInterval[] {
  const totalLength = getResolvedTotalLength(spec) ?? 0;
  return spec.axialBores
    .filter((bore) => typeof bore.diameterMm === "number" && bore.diameterMm > 0 && typeof bore.depthMm === "number" && bore.depthMm > 0)
    .map((bore) => {
      const depth = bore.depthMm ?? 0;
      const xStart = bore.startFrom === "left" ? 0 : Math.max(totalLength - depth, 0);
      return {
        xStart,
        xEnd: Math.min(xStart + depth, totalLength),
        radius: (bore.diameterMm ?? 0) / 2,
      };
    });
}

function interpolateRadius(section: SegmentSection, x: number) {
  if (section.xEnd === section.xStart) return section.startRadius;
  const ratio = (x - section.xStart) / (section.xEnd - section.xStart);
  return section.startRadius + (section.endRadius - section.startRadius) * ratio;
}

function splitSection(section: SegmentSection, bores: BoreInterval[]): SectionPiece[] {
  const boundaries = new Set<number>([section.xStart, section.xEnd]);

  bores.forEach((bore) => {
    if (bore.xStart > section.xStart && bore.xStart < section.xEnd) boundaries.add(bore.xStart);
    if (bore.xEnd > section.xStart && bore.xEnd < section.xEnd) boundaries.add(bore.xEnd);
  });

  const sorted = Array.from(boundaries).sort((left, right) => left - right);
  const pieces: SectionPiece[] = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const xStart = sorted[index];
    const xEnd = sorted[index + 1];
    const midpoint = xStart + (xEnd - xStart) / 2;
    const overlappingBores = bores.filter((bore) => midpoint >= bore.xStart && midpoint <= bore.xEnd);
    const innerRadius = overlappingBores.reduce((largest, bore) => Math.max(largest, bore.radius), 0);

    pieces.push({
      ...section,
      xStart,
      xEnd,
      startRadius: interpolateRadius(section, xStart),
      endRadius: interpolateRadius(section, xEnd),
      innerRadius,
    });
  }

  return pieces;
}

function pushVertex(target: number[], x: number, y: number, z: number) {
  target.push(x, y, z);
}

function createRevolvedSectionGeometry(piece: SectionPiece, radialSegments = 40) {
  const positions: number[] = [];
  const indices: number[] = [];
  const startOuterIndex = 0;
  const endOuterIndex = radialSegments;
  const hasInner = piece.innerRadius > 0.0001;
  const startInnerIndex = radialSegments * 2;
  const endInnerIndex = radialSegments * 3;
  const length = piece.xEnd - piece.xStart;

  for (let index = 0; index < radialSegments; index += 1) {
    const angle = (index / radialSegments) * Math.PI * 2;
    const y0 = Math.cos(angle) * piece.startRadius;
    const z0 = Math.sin(angle) * piece.startRadius;
    const y1 = Math.cos(angle) * piece.endRadius;
    const z1 = Math.sin(angle) * piece.endRadius;

    pushVertex(positions, 0, y0, z0);
    pushVertex(positions, length, y1, z1);
  }

  if (hasInner) {
    for (let index = 0; index < radialSegments; index += 1) {
      const angle = (index / radialSegments) * Math.PI * 2;
      const y0 = Math.cos(angle) * piece.innerRadius;
      const z0 = Math.sin(angle) * piece.innerRadius;
      pushVertex(positions, 0, y0, z0);
      pushVertex(positions, length, y0, z0);
    }
  }

  for (let index = 0; index < radialSegments; index += 1) {
    const next = (index + 1) % radialSegments;
    const startA = startOuterIndex + index * 2;
    const endA = startA + 1;
    const startB = startOuterIndex + next * 2;
    const endB = startB + 1;
    indices.push(startA, endA, startB);
    indices.push(startB, endA, endB);
  }

  if (hasInner) {
    for (let index = 0; index < radialSegments; index += 1) {
      const next = (index + 1) % radialSegments;
      const startA = startInnerIndex + index * 2;
      const endA = startA + 1;
      const startB = startInnerIndex + next * 2;
      const endB = startB + 1;
      indices.push(startA, startB, endA);
      indices.push(startB, endB, endA);
    }
  }

  const startCenterIndex = positions.length / 3;
  if (!hasInner) {
    pushVertex(positions, 0, 0, 0);
    pushVertex(positions, length, 0, 0);
  }

  for (let index = 0; index < radialSegments; index += 1) {
    const next = (index + 1) % radialSegments;
    const outerStartA = startOuterIndex + index * 2;
    const outerStartB = startOuterIndex + next * 2;
    const outerEndA = outerStartA + 1;
    const outerEndB = outerStartB + 1;

    if (hasInner) {
      const innerStartA = startInnerIndex + index * 2;
      const innerStartB = startInnerIndex + next * 2;
      const innerEndA = innerStartA + 1;
      const innerEndB = innerStartB + 1;

      indices.push(outerStartA, innerStartB, innerStartA);
      indices.push(outerStartA, outerStartB, innerStartB);

      indices.push(outerEndA, innerEndA, innerEndB);
      indices.push(outerEndA, innerEndB, outerEndB);
    } else {
      indices.push(startCenterIndex, outerStartB, outerStartA);
      indices.push(startCenterIndex + 1, outerEndA, outerEndB);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.translate(piece.xStart, 0, 0);
  return geometry;
}

function polygonPoints(shape: "hex" | "square", acrossFlats: number) {
  if (shape === "square") {
    const half = acrossFlats / 2;
    return [
      new THREE.Vector2(-half, -half),
      new THREE.Vector2(half, -half),
      new THREE.Vector2(half, half),
      new THREE.Vector2(-half, half),
    ];
  }

  const radius = acrossFlats / Math.sqrt(3);
  return Array.from({ length: 6 }, (_, index) => {
    const angle = ((60 * index - 30) * Math.PI) / 180;
    return new THREE.Vector2(radius * Math.cos(angle), radius * Math.sin(angle));
  });
}

function createPrismaticSectionGeometry(piece: SectionPiece) {
  const shape = new THREE.Shape(polygonPoints(piece.externalShape as "hex" | "square", piece.acrossFlatsMm ?? 0));
  if (piece.innerRadius > 0.0001) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, piece.innerRadius, 0, Math.PI * 2);
    shape.holes.push(hole);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: piece.xEnd - piece.xStart,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(piece.xStart, 0, 0);
  return geometry;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function exportGroupToGlbBase64(group: THREE.Group): Promise<string> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (result) => {
        if (!(result instanceof ArrayBuffer)) {
          reject(new Error("Falha ao gerar GLB binário."));
          return;
        }

        resolve(toBase64(new Uint8Array(result)));
      },
      (error) => reject(error),
      { binary: true, onlyVisible: false },
    );
  });
}

function createSegmentMaterial(piece: SectionPiece) {
  if (piece.kind === "thread") {
    return new THREE.MeshStandardMaterial({
      color: "#475569",
      metalness: 0.45,
      roughness: 0.35,
    });
  }

  return new THREE.MeshStandardMaterial({
    color: piece.externalShape === "round" ? "#94a3b8" : "#64748b",
    metalness: 0.35,
    roughness: 0.45,
  });
}

export function buildTechnicalDrawingGroup(spec: AxisymmetricPartSpec): BuiltGroupResult {
  const group = new THREE.Group();
  const readiness = build3DModel(spec);
  if (!readiness.readyForImplementation) {
    throw new Error(readiness.blockingReasons[0] ?? readiness.message);
  }

  const sections = buildSegmentSections(spec);
  const bores = buildBoreIntervals(spec);
  let vertexCount = 0;
  let segmentMeshCount = 0;
  let boreSectionCount = 0;

  sections.flatMap((section) => splitSection(section, bores)).forEach((piece) => {
    const geometry =
      piece.externalShape === "round"
        ? createRevolvedSectionGeometry(piece)
        : createPrismaticSectionGeometry(piece);

    if (piece.innerRadius > 0.0001) {
      boreSectionCount += 1;
    }

    vertexCount += geometry.getAttribute("position").count;
    segmentMeshCount += 1;

    const mesh = new THREE.Mesh(geometry, createSegmentMaterial(piece));
    group.add(mesh);
  });

  group.position.set(-(getResolvedTotalLength(spec) ?? 0) / 2, 0, 0);

  const boundingBox = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  return {
    group,
    meshSummary: {
      segmentMeshCount,
      boreSectionCount,
      vertexCount,
    },
    boundingBoxMm: {
      length: roundTo(size.x),
      width: roundTo(size.y),
      height: roundTo(size.z),
    },
  };
}

export async function render3D(
  spec: AxisymmetricPartSpec,
  semanticDocument?: EngineeringDrawingSemanticDocument | null,
): Promise<TechnicalDrawing3DResult> {
  ensureFileReader();
  const readiness = build3DModel(spec);
  const validationReport = validateEngineeringDrawing(spec, semanticDocument ?? null);
  const blockingReasons = [
    ...readiness.blockingReasons,
    ...validationReport.issues
      .filter((issue) => issue.blocking)
      .map((issue) => issue.message),
  ];

  if (!readiness.readyForImplementation || !validationReport.canExport) {
    return {
      previewStatus: readiness.status === "partial" ? "partial" : "blocked",
      glbBase64: null,
      fileName: null,
      meshSummary: {
        segmentMeshCount: 0,
        boreSectionCount: 0,
        vertexCount: 0,
      },
      boundingBoxMm: {
        length: 0,
        width: 0,
        height: 0,
      },
      validationReport,
      blockingReasons,
    };
  }

  const { group, meshSummary, boundingBoxMm } = buildTechnicalDrawingGroup(spec);
  const glbBase64 = await exportGroupToGlbBase64(group);

  return {
    previewStatus: "ready",
    glbBase64,
    fileName: null,
    meshSummary,
    boundingBoxMm,
    validationReport,
    blockingReasons: [],
  };
}

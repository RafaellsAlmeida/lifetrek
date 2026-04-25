import { getResolvedTotalLength, resolveEndDiameter, sanitizeFilename } from "./format";
import { build3DModel } from "./model3d";
import { validateEngineeringDrawing } from "./validation";
import type {
  AxisymmetricPartSpec,
  EngineeringDrawingSemanticDocument,
  TechnicalDrawingStepResult,
} from "./types";

type OpenCascadeObject = Record<string, unknown>;

type OpenCascadeRuntime = Record<string, unknown> & {
  FS: {
    analyzePath: (path: string) => { exists: boolean };
    cwd: () => string;
    readFile: (path: string, options: { encoding: "utf8" }) => string;
    readdir: (path: string) => string[];
    unlink: (path: string) => void;
  };
};

type Constructor<T> = new (...args: unknown[]) => T;
type Callable<T> = (...args: unknown[]) => T;

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
  startFrom: "left" | "right";
};

type DirectorySnapshot = Map<string, Set<string>>;

let openCascadeRuntimePromise: Promise<OpenCascadeRuntime> | null = null;
const OPENCASCADE_WASM_URL = "https://cdn.jsdelivr.net/npm/opencascade.js@1.1.1/dist/opencascade.wasm.wasm";

async function loadOpenCascadeRuntime(): Promise<OpenCascadeRuntime> {
  if (!openCascadeRuntimePromise) {
    openCascadeRuntimePromise = import("opencascade.js/dist/opencascade.wasm.js").then(async ({ default: createOpenCascade }) => {
      const runtime = (await new createOpenCascade({
        locateFile(path) {
          return path.endsWith(".wasm") ? OPENCASCADE_WASM_URL : path;
        },
      })) as OpenCascadeRuntime;
      if (!runtime.FS) {
        throw new Error("OpenCascade.js carregou sem filesystem virtual.");
      }
      return runtime;
    });
  }

  return openCascadeRuntimePromise;
}

function construct<T extends OpenCascadeObject>(
  oc: OpenCascadeRuntime,
  className: string,
  ...args: unknown[]
): T {
  const constructor = oc[className];
  if (typeof constructor !== "function") {
    throw new Error(`OpenCascade.js não expôs ${className}.`);
  }

  return new (constructor as Constructor<T>)(...args);
}

function call<T>(target: OpenCascadeObject, methodName: string, ...args: unknown[]): T {
  const method = target[methodName];
  if (typeof method !== "function") {
    throw new Error(`OpenCascade.js não expôs o método ${methodName}.`);
  }

  return (method as Callable<T>).apply(target, args);
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
        startFrom: bore.startFrom,
      };
    });
}

function getBoreOverlap(section: SegmentSection, bore: BoreInterval): BoreInterval | null {
  const xStart = Math.max(section.xStart, bore.xStart);
  const xEnd = Math.min(section.xEnd, bore.xEnd);

  if (xEnd - xStart <= 0.0001) {
    return null;
  }

  return {
    ...bore,
    xStart,
    xEnd,
  };
}

function makeXAxis(oc: OpenCascadeRuntime, xStart: number) {
  const origin = construct(oc, "gp_Pnt_3", xStart, 0, 0);
  const direction = construct(oc, "gp_Dir_4", 1, 0, 0);
  return construct(oc, "gp_Ax2_3", origin, direction);
}

function ensureDone(builder: OpenCascadeObject, label: string) {
  const isDone = call<boolean>(builder, "IsDone");
  if (!isDone) {
    throw new Error(`${label} não foi concluído pelo OpenCascade.js.`);
  }
}

function createRoundSectionShape(oc: OpenCascadeRuntime, section: SegmentSection): OpenCascadeObject {
  const length = section.xEnd - section.xStart;
  const axis = makeXAxis(oc, section.xStart);
  const sameRadius = Math.abs(section.startRadius - section.endRadius) < 0.0001;
  const builder = sameRadius
    ? construct(oc, "BRepPrimAPI_MakeCylinder_3", axis, section.startRadius, length)
    : construct(oc, "BRepPrimAPI_MakeCone_3", axis, section.startRadius, section.endRadius, length);

  const shape = call<OpenCascadeObject>(builder, "Shape");
  ensureDone(builder, section.label);
  return shape;
}

function polygonPoints(section: SegmentSection) {
  const acrossFlats = section.acrossFlatsMm ?? 0;

  if (section.externalShape === "square") {
    const half = acrossFlats / 2;
    return [
      [half, half],
      [-half, half],
      [-half, -half],
      [half, -half],
    ];
  }

  const radius = acrossFlats / Math.sqrt(3);
  return Array.from({ length: 6 }, (_, index) => {
    const angle = ((60 * index - 30) * Math.PI) / 180;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  });
}

function createPrismaticSectionShape(oc: OpenCascadeRuntime, section: SegmentSection): OpenCascadeObject {
  const length = section.xEnd - section.xStart;
  const polygon = construct(oc, "BRepBuilderAPI_MakePolygon_1");

  polygonPoints(section).forEach(([y, z]) => {
    call<void>(polygon, "Add_1", construct(oc, "gp_Pnt_3", section.xStart, y, z));
  });
  call<void>(polygon, "Close");
  ensureDone(polygon, section.label);

  const wire = call<OpenCascadeObject>(polygon, "Wire");
  const faceBuilder = construct(oc, "BRepBuilderAPI_MakeFace_15", wire, true);
  ensureDone(faceBuilder, `${section.label} face`);

  const vector = construct(oc, "gp_Vec_4", length, 0, 0);
  const prismBuilder = construct(
    oc,
    "BRepPrimAPI_MakePrism_1",
    call<OpenCascadeObject>(faceBuilder, "Face"),
    vector,
    true,
    true,
  );
  ensureDone(prismBuilder, `${section.label} prisma`);

  return call<OpenCascadeObject>(prismBuilder, "Shape");
}

function createSectionShape(oc: OpenCascadeRuntime, section: SegmentSection): OpenCascadeObject {
  if (section.externalShape === "round") {
    return createRoundSectionShape(oc, section);
  }

  return createPrismaticSectionShape(oc, section);
}

function createCompoundShape(oc: OpenCascadeRuntime, shapes: OpenCascadeObject[]): OpenCascadeObject {
  if (shapes.length === 0) {
    throw new Error("Nenhum segmento válido para exportar STEP.");
  }

  if (shapes.length === 1) {
    return shapes[0];
  }

  const compound = construct(oc, "TopoDS_Compound");
  const builder = construct(oc, "BRep_Builder");
  call<void>(builder, "MakeCompound", compound);
  shapes.forEach((shape) => call<void>(builder, "Add", compound, shape));
  return compound;
}

function createBoreCutShape(oc: OpenCascadeRuntime, bore: BoreInterval): OpenCascadeObject {
  const cutPadMm = 0.05;
  const xStart = bore.xStart - cutPadMm;
  const length = Math.max(bore.xEnd - bore.xStart + cutPadMm * 2, cutPadMm);
  const axis = makeXAxis(oc, xStart);
  const builder = construct(oc, "BRepPrimAPI_MakeCylinder_3", axis, bore.radius, length);
  const shape = call<OpenCascadeObject>(builder, "Shape");
  ensureDone(builder, "furo axial");
  return shape;
}

function cutShape(
  oc: OpenCascadeRuntime,
  baseShape: OpenCascadeObject,
  toolShape: OpenCascadeObject,
): OpenCascadeObject {
  const argumentsList = construct(oc, "TopTools_ListOfShape_1");
  const toolsList = construct(oc, "TopTools_ListOfShape_1");
  call<void>(argumentsList, "Append_1", baseShape);
  call<void>(toolsList, "Append_1", toolShape);

  const cutBuilder = construct(oc, "BRepAlgoAPI_Cut_1");
  call<void>(cutBuilder, "SetArguments", argumentsList);
  call<void>(cutBuilder, "SetTools", toolsList);
  call<void>(cutBuilder, "Build");
  ensureDone(cutBuilder, "subtração de furo axial");
  return call<OpenCascadeObject>(cutBuilder, "Shape");
}

function trackedDirectoryPaths(): string[] {
  return ["/", "/tmp", "/home/web_user"];
}

function snapshotDirectories(oc: OpenCascadeRuntime): DirectorySnapshot {
  return new Map(
    trackedDirectoryPaths().map((directoryPath) => {
      try {
        return [directoryPath, new Set(oc.FS.readdir(directoryPath))] as const;
      } catch {
        return [directoryPath, new Set<string>()] as const;
      }
    }),
  );
}

function joinVirtualPath(directoryPath: string, fileName: string): string {
  return directoryPath === "/" ? `/${fileName}` : `${directoryPath}/${fileName}`;
}

function readStepIfPresent(oc: OpenCascadeRuntime, virtualPath: string): string | null {
  if (!oc.FS.analyzePath(virtualPath).exists) {
    return null;
  }

  try {
    const stepText = oc.FS.readFile(virtualPath, { encoding: "utf8" });
    if (stepText.startsWith("ISO-10303-21")) {
      oc.FS.unlink(virtualPath);
      return stepText;
    }
  } catch {
    return null;
  }

  return null;
}

function readNewStepFile(oc: OpenCascadeRuntime, before: DirectorySnapshot): string | null {
  for (const directoryPath of trackedDirectoryPaths()) {
    let currentEntries: string[];
    try {
      currentEntries = oc.FS.readdir(directoryPath);
    } catch {
      continue;
    }

    const previousEntries = before.get(directoryPath) ?? new Set<string>();
    for (const entry of currentEntries) {
      if (entry === "." || entry === ".." || previousEntries.has(entry)) {
        continue;
      }

      const stepText = readStepIfPresent(oc, joinVirtualPath(directoryPath, entry));
      if (stepText) {
        return stepText;
      }
    }
  }

  return null;
}

function writeStepFile(
  oc: OpenCascadeRuntime,
  shape: OpenCascadeObject,
  fileName: string,
): string {
  const writer = construct(oc, "STEPControl_Writer_1");
  const stepModelType = oc.STEPControl_StepModelType as Record<string, unknown> | undefined;
  const transferMode = stepModelType?.STEPControl_AsIs;
  if (!transferMode) {
    throw new Error("OpenCascade.js não expôs STEPControl_AsIs.");
  }

  const transferStatus = call<unknown>(writer, "Transfer", shape, transferMode, true);

  const virtualBaseName = sanitizeFilename(fileName) || `step-export-${Date.now()}.step`;
  const candidatePaths = [
    `/tmp/${virtualBaseName}`,
    `/home/web_user/${virtualBaseName}`,
    virtualBaseName,
    `/${virtualBaseName}`,
  ];
  const writeStatuses: string[] = [];

  for (const candidatePath of candidatePaths) {
    if (oc.FS.analyzePath(candidatePath).exists) {
      oc.FS.unlink(candidatePath);
    }

    const beforeWrite = snapshotDirectories(oc);
    const writeStatus = call<unknown>(writer, "Write", candidatePath);
    writeStatuses.push(`${candidatePath}:${String(writeStatus)}`);

    const exactStepText = readStepIfPresent(oc, candidatePath);
    if (exactStepText) {
      return exactStepText;
    }

    const discoveredStepText = readNewStepFile(oc, beforeWrite);
    if (discoveredStepText) {
      return discoveredStepText;
    }
  }

  throw new Error(
    `OpenCascade.js não gravou o arquivo STEP. Transfer=${String(transferStatus)} Write=${writeStatuses.join(" | ")} CWD=${oc.FS.cwd()}.`,
  );
}

export async function renderStep(
  spec: AxisymmetricPartSpec,
  semanticDocument?: EngineeringDrawingSemanticDocument | null,
): Promise<TechnicalDrawingStepResult> {
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
      stepText: null,
      fileName: null,
      shapeSummary: {
        segmentShapeCount: 0,
        boreCutCount: 0,
      },
      validationReport,
      blockingReasons,
    };
  }

  const oc = await loadOpenCascadeRuntime();
  const sections = buildSegmentSections(spec);
  const bores = buildBoreIntervals(spec);
  let boreCutCount = 0;
  const sectionShapes = sections.map((section) => {
    let sectionShape = createSectionShape(oc, section);
    bores.forEach((bore) => {
      const overlap = getBoreOverlap(section, bore);
      if (!overlap) return;
      sectionShape = cutShape(oc, sectionShape, createBoreCutShape(oc, overlap));
      boreCutCount += 1;
    });
    return sectionShape;
  });
  const finalShape = createCompoundShape(oc, sectionShapes);
  const fileName = `${sanitizeFilename(spec.partName || "desenho-tecnico") || "desenho-tecnico"}.step`;
  const stepText = writeStepFile(oc, finalShape, fileName);

  return {
    previewStatus: "ready",
    stepText,
    fileName,
    shapeSummary: {
      segmentShapeCount: sectionShapes.length,
      boreCutCount,
    },
    validationReport,
    blockingReasons: [],
  };
}

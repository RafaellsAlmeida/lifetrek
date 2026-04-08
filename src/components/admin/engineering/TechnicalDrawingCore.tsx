import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Cuboid,
  Download,
  FileImage,
  Layers3,
  Loader2,
  PencilRuler,
  RefreshCw,
  Ruler,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

import { EngineeringDrawing3DPreview } from "@/components/admin/engineering/EngineeringDrawing3DPreview";
import {
  createManualExtraction,
  findFixtureByFileName,
  findFixtureById,
  engineeringDrawingFixtures,
} from "@/lib/engineering-drawing/fixtures";
import { formatMm, sanitizeFilename } from "@/lib/engineering-drawing/format";
import { render2D } from "@/lib/engineering-drawing/render2d";
import { render3D } from "@/lib/engineering-drawing/render3d";
import { validateEngineeringDrawing } from "@/lib/engineering-drawing/validation";
import {
  createBore,
  createEmptySemanticDocument,
  createDefaultReviewState,
  createEmptySpec,
  createSegment,
} from "@/lib/engineering-drawing/types";
import type {
  AxisymmetricPartSpec,
  AxisymmetricSegment,
  DrawingAmbiguity,
  EngineeringDrawingSemanticDocument,
  EngineeringDrawingSessionRecord,
  ExtractionResult,
  GdtCallout,
  ReviewState,
  TechnicalDrawing3DResult,
  TechnicalDrawingRenderResult,
} from "@/lib/engineering-drawing/types";
import {
  createEngineeringDrawingSessionFromFixture,
  createEngineeringDrawingSessionFromUpload,
  listEngineeringDrawingSessions,
  persistEngineeringDrawingExport,
  updateEngineeringDrawingSession,
} from "@/lib/engineering-drawing/repository";

function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

function downloadUrl(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noreferrer";
  anchor.target = "_blank";
  anchor.click();
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

function parseSvgDimension(rawValue: string | null): number | null {
  if (!rawValue) return null;
  const parsed = Number.parseFloat(rawValue.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function getSvgCanvasSize(svgMarkup: string) {
  const parser = new DOMParser();
  const document = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svg = document.documentElement;
  const viewBox = svg.getAttribute("viewBox");

  if (viewBox) {
    const values = viewBox
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value));

    if (values.length === 4) {
      return { width: values[2], height: values[3] };
    }
  }

  return {
    width: parseSvgDimension(svg.getAttribute("width")) ?? 1200,
    height: parseSvgDimension(svg.getAttribute("height")) ?? 760,
  };
}

async function svgMarkupToPngDataUrl(svgMarkup: string, pixelRatio = 2) {
  const { width, height } = getSvgCanvasSize(svgMarkup);
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const instance = new Image();
      instance.onload = () => resolve(instance);
      instance.onerror = () => reject(new Error("Falha ao carregar o SVG para exportação."));
      instance.src = blobUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Falha ao inicializar o canvas de exportação.");
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function extractionToReviewState(
  extraction: ExtractionResult,
  mode: EngineeringDrawingSessionRecord["backendMode"],
  reviewConfirmed = false,
  semanticReviewConfirmed = false,
) {
  return {
    ...createDefaultReviewState(mode, extraction.extractionSource),
    reviewConfirmed,
    semanticReviewConfirmed,
    ambiguities: extraction.ambiguities,
    confidenceSummary: extraction.confidenceSummary,
    sourceSketchSummary: extraction.sourceSketchSummary,
  };
}

function cloneSpec(spec: AxisymmetricPartSpec): AxisymmetricPartSpec {
  return JSON.parse(JSON.stringify(spec)) as AxisymmetricPartSpec;
}

function cloneSemanticDocument(document: EngineeringDrawingSemanticDocument): EngineeringDrawingSemanticDocument {
  return JSON.parse(JSON.stringify(document)) as EngineeringDrawingSemanticDocument;
}

function mergeAmbiguities(...lists: Array<DrawingAmbiguity[] | null | undefined>) {
  const merged = new Map<string, DrawingAmbiguity>();

  lists.flat().forEach((ambiguity) => {
    if (!ambiguity) return;
    const key = ambiguity.id || `${ambiguity.fieldPath}:${ambiguity.question}`;
    if (!merged.has(key)) {
      merged.set(key, ambiguity);
    }
  });

  return Array.from(merged.values());
}

function hydrateSemanticDocument(
  spec: AxisymmetricPartSpec,
  document: EngineeringDrawingSemanticDocument | null | undefined,
  reviewAmbiguities: DrawingAmbiguity[] | null | undefined,
) {
  const base = document ? cloneSemanticDocument(document) : createEmptySemanticDocument(spec.partName);
  return {
    ...base,
    documentMetadata: {
      ...base.documentMetadata,
      partName: spec.partName,
      drawingNumber: spec.drawingNumber,
      units: "mm" as const,
      isAxisymmetric: spec.unsupportedFeatures.length === 0,
      axisymmetricConfidence:
        base.documentMetadata.axisymmetricConfidence ??
        (spec.unsupportedFeatures.length === 0 ? 0.96 : 0.42),
    },
    ambiguityFlags: mergeAmbiguities(base.ambiguityFlags, reviewAmbiguities),
  } satisfies EngineeringDrawingSemanticDocument;
}

function semanticReviewRequired(document: EngineeringDrawingSemanticDocument) {
  return (
    document.gdtCallouts.length > 0 ||
    document.datumFeatures.length > 0 ||
    document.ambiguityFlags.length > 0
  );
}

function clearResolvedAmbiguity(reviewState: ReviewState | null, ambiguityId: string) {
  if (!reviewState) return reviewState;
  return {
    ...reviewState,
    ambiguities: reviewState.ambiguities.filter((ambiguity) => ambiguity.id !== ambiguityId),
  };
}

function updateSegmentAt(
  spec: AxisymmetricPartSpec,
  segmentId: string,
  patch: Partial<AxisymmetricSegment>,
): AxisymmetricPartSpec {
  return {
    ...spec,
    segments: spec.segments.map((segment) => (segment.id === segmentId ? { ...segment, ...patch } : segment)),
  };
}

function parseNullableNumber(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function withUpdatedNotes(spec: AxisymmetricPartSpec, rawValue: string): AxisymmetricPartSpec {
  return {
    ...spec,
    notes: rawValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

function withUpdatedTotalLength(spec: AxisymmetricPartSpec, rawValue: string): AxisymmetricPartSpec {
  return { ...spec, totalLengthMm: parseNullableNumber(rawValue) };
}

function buildSessionPatch(
  session: EngineeringDrawingSessionRecord,
  spec: AxisymmetricPartSpec,
  semanticDocument: EngineeringDrawingSemanticDocument,
  reviewConfirmed: boolean,
  semanticReviewConfirmed: boolean,
) {
  const reviewReady = reviewConfirmed && (!semanticReviewRequired(semanticDocument) || semanticReviewConfirmed);
  return {
    normalizedSpec: spec,
    normalizedDocument: semanticDocument,
    reviewState: session.reviewState
      ? { ...session.reviewState, reviewConfirmed, semanticReviewConfirmed }
      : { ...createDefaultReviewState(session.backendMode), reviewConfirmed, semanticReviewConfirmed },
    status: reviewReady ? ("reviewed" as const) : session.status,
  };
}

export function TechnicalDrawingCore() {
  const [sessions, setSessions] = useState<EngineeringDrawingSessionRecord[]>([]);
  const [activeSession, setActiveSession] = useState<EngineeringDrawingSessionRecord | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [semanticReviewConfirmed, setSemanticReviewConfirmed] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestSpecRef = useRef<AxisymmetricPartSpec>(createEmptySpec("Nova peça"));
  const latestSemanticRef = useRef<EngineeringDrawingSemanticDocument>(createEmptySemanticDocument("Nova peça"));

  const spec = activeSession?.normalizedSpec ?? createEmptySpec(titleInput || "Nova peça");
  const semanticDocument = useMemo(
    () => hydrateSemanticDocument(spec, activeSession?.normalizedDocument, activeSession?.reviewState?.ambiguities),
    [activeSession?.normalizedDocument, activeSession?.reviewState?.ambiguities, spec],
  );
  const semanticReviewNeeded = useMemo(() => semanticReviewRequired(semanticDocument), [semanticDocument]);
  const reviewReady = reviewConfirmed && (!semanticReviewNeeded || semanticReviewConfirmed);
  const fallbackRenderResult = useMemo(() => render2D(spec, semanticDocument), [semanticDocument, spec]);
  const renderResult: TechnicalDrawingRenderResult | null = activeSession?.drawingSvg
    ? {
        drawingSvg: activeSession.drawingSvg,
        validationReport:
          activeSession.validationReport ??
          fallbackRenderResult.validationReport,
        dimensionTable:
          Array.isArray(activeSession.renderMetadata?.dimensionTable)
            ? (activeSession.renderMetadata.dimensionTable as TechnicalDrawingRenderResult["dimensionTable"])
            : fallbackRenderResult.dimensionTable,
        planned3DModel:
          activeSession.renderMetadata?.planned3DModel &&
          typeof activeSession.renderMetadata.planned3DModel === "object"
            ? (activeSession.renderMetadata.planned3DModel as TechnicalDrawingRenderResult["planned3DModel"])
            : fallbackRenderResult.planned3DModel,
      }
    : null;
  const currentThreeDResult = useMemo(() => {
    const maybeResult = activeSession?.renderMetadata?.threeDResult;
    if (maybeResult && typeof maybeResult === "object") {
      return maybeResult as Omit<TechnicalDrawing3DResult, "glbBase64" | "fileName">;
    }
    return null;
  }, [activeSession?.renderMetadata]);

  const currentValidation = useMemo(() => {
    if (renderResult?.validationReport) return renderResult.validationReport;
    return validateEngineeringDrawing(spec, semanticDocument);
  }, [renderResult?.validationReport, semanticDocument, spec]);

  useEffect(() => {
    latestSpecRef.current = spec;
  }, [spec]);

  useEffect(() => {
    latestSemanticRef.current = semanticDocument;
  }, [semanticDocument]);

  useEffect(() => {
    void (async () => {
      try {
        const loadedSessions = await listEngineeringDrawingSessions();
        setSessions(loadedSessions);
        if (loadedSessions[0]) {
          setActiveSession(loadedSessions[0]);
          setTitleInput(loadedSessions[0].title);
          setNotesInput(loadedSessions[0].notes ?? "");
          setReviewConfirmed(loadedSessions[0].reviewState?.reviewConfirmed ?? false);
          setSemanticReviewConfirmed(loadedSessions[0].reviewState?.semanticReviewConfirmed ?? false);
        }
      } finally {
        setLoadingSessions(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    setTitleInput(activeSession.title);
    setNotesInput(activeSession.notes ?? "");
    setReviewConfirmed(activeSession.reviewState?.reviewConfirmed ?? false);
    setSemanticReviewConfirmed(activeSession.reviewState?.semanticReviewConfirmed ?? false);
  }, [activeSession]);

  const refreshSessions = async (preferredId?: string) => {
    const loaded = await listEngineeringDrawingSessions();
    setSessions(loaded);

    if (!loaded.length) return;
    const preferred = preferredId ? loaded.find((session) => session.id === preferredId) : null;
    if (preferred) {
      setActiveSession(preferred);
      return;
    }
    if (!activeSession || !loaded.some((session) => session.id === activeSession.id)) {
      setActiveSession(loaded[0]);
    }
  };

  const persistActiveSession = async (patch: Parameters<typeof updateEngineeringDrawingSession>[1]) => {
    if (!activeSession) return null;
    const updated = await updateEngineeringDrawingSession(activeSession, patch);
    setActiveSession(updated);
    await refreshSessions(updated.id);
    return updated;
  };

  const updateDraftSpec = (nextSpec: AxisymmetricPartSpec) => {
    latestSpecRef.current = nextSpec;
    if (activeSession) {
      setActiveSession({ ...activeSession, normalizedSpec: nextSpec });
    }
  };

  const updateDraftSemantic = (nextDocument: EngineeringDrawingSemanticDocument) => {
    latestSemanticRef.current = nextDocument;
    if (activeSession) {
      setActiveSession({ ...activeSession, normalizedDocument: nextDocument });
    }
  };

  const applyExtraction = async (session: EngineeringDrawingSessionRecord, extraction: ExtractionResult) => {
    const geometryDraft = extraction.geometryDraft ?? extraction.specDraft ?? createEmptySpec(session.title);
    const semanticDraft = hydrateSemanticDocument(
      geometryDraft,
      extraction.semanticDraft,
      extraction.ambiguities,
    );
    const reviewState = extractionToReviewState(extraction, session.backendMode);
    const updated = await updateEngineeringDrawingSession(session, {
      rawExtraction: extraction,
      normalizedSpec: geometryDraft,
      normalizedDocument: semanticDraft,
      reviewState,
      status: "extracted",
      title: geometryDraft.partName || session.title,
      notes: session.notes,
    });
    setActiveSession(updated);
    setReviewConfirmed(false);
    setSemanticReviewConfirmed(false);
    await refreshSessions(updated.id);
    toast.success(
      extraction.extractionSource === "fixture"
        ? "Fixture oficial carregada para revisão."
        : extraction.extractionSource === "manual"
          ? "Draft manual criado para revisão."
          : "Extração IA concluída.",
    );
    return updated;
  };

  const runExtraction = async (session: EngineeringDrawingSessionRecord, imageUrl: string, fileName: string) => {
    const fixture = findFixtureByFileName(sanitizeFilename(fileName));
    if (fixture) {
      return applyExtraction(session, fixture.extractionResult);
    }

    try {
      const { data, error } = await supabase.functions.invoke("engineering-drawing", {
        body: {
          action: "extract",
          imageUrl,
          title: session.title,
          notes: session.notes,
        },
      });

      if (error) throw error;
      return applyExtraction(session, data as ExtractionResult);
    } catch (error) {
      console.warn("[engineering-drawing] extract fallback:", error);
      const manualFallback = createManualExtraction(
        session.title,
        "A edge function ainda não está disponível neste ambiente.",
      );
      return applyExtraction(session, manualFallback);
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsBusy(true);
    try {
      const session = await createEngineeringDrawingSessionFromUpload({
        file,
        title: titleInput.trim() || file.name.replace(/\.[^.]+$/, ""),
        notes: notesInput.trim() || undefined,
      });
      setActiveSession(session);
      await refreshSessions(session.id);
      await runExtraction(session, session.sourceImageUrl ?? "", file.name);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao criar sessão a partir do upload.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleFixtureSelect = async (fixtureId: string) => {
    const fixture = findFixtureById(fixtureId);
    if (!fixture) return;

    setIsBusy(true);
    try {
      const session = await createEngineeringDrawingSessionFromFixture({
        title: fixture.title,
        notes: fixture.description,
        imageUrl: fixture.imageUrl,
        sourceImageName: fixture.fileAliases[0],
        fixtureId: fixture.id,
      });
      setActiveSession(session);
      await refreshSessions(session.id);
      await applyExtraction(session, fixture.extractionResult);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao carregar fixture.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveReview = async () => {
    if (!activeSession) return;
    setIsBusy(true);
    try {
      const currentSpec = cloneSpec(latestSpecRef.current);
      const currentSemantic = hydrateSemanticDocument(
        currentSpec,
        latestSemanticRef.current,
        activeSession.reviewState?.ambiguities,
      );
      currentSemantic.validationReport = validateEngineeringDrawing(currentSpec, currentSemantic);
      currentSemantic.reviewDecision = {
        approved:
          reviewConfirmed &&
          (!semanticReviewRequired(currentSemantic) || semanticReviewConfirmed) &&
          currentSemantic.validationReport.canExport,
        approvedWithWarnings:
          reviewConfirmed &&
          (!semanticReviewRequired(currentSemantic) || semanticReviewConfirmed) &&
          currentSemantic.validationReport.canExport &&
          currentSemantic.validationReport.warningCount > 0,
        reviewerId: activeSession.reviewedBy,
        reviewedAt: new Date().toISOString(),
        comments: null,
      };
      const updated = await persistActiveSession({
        title: titleInput.trim() || activeSession.title,
        notes: notesInput.trim() || null,
        validationReport: currentSemantic.validationReport,
        ...buildSessionPatch(
          activeSession,
          currentSpec,
          currentSemantic,
          reviewConfirmed,
          semanticReviewConfirmed,
        ),
      });
      if (updated) {
        toast.success("Revisão salva.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao salvar revisão.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRender = async () => {
    if (!activeSession) return;
    if (!reviewReady) {
      toast.error("Confirme a revisão geométrica e, quando houver GD&T, a revisão semântica antes de gerar o 2D.");
      return;
    }

    setIsBusy(true);
    try {
      const currentSpec = cloneSpec(latestSpecRef.current);
      const currentSemantic = hydrateSemanticDocument(
        currentSpec,
        latestSemanticRef.current,
        activeSession.reviewState?.ambiguities,
      );
      let result: TechnicalDrawingRenderResult;
      try {
        const { data, error } = await supabase.functions.invoke("engineering-drawing", {
          body: { action: "render2d", spec: currentSpec, semanticDocument: currentSemantic },
        });
        if (error) throw error;
        result = data as TechnicalDrawingRenderResult;
      } catch (error) {
        console.warn("[engineering-drawing] render fallback:", error);
        result = render2D(currentSpec, currentSemantic);
      }

      currentSemantic.validationReport = result.validationReport;
      currentSemantic.reviewDecision = {
        approved: result.validationReport.canExport,
        approvedWithWarnings: result.validationReport.canExport && result.validationReport.warningCount > 0,
        reviewerId: activeSession.reviewedBy,
        reviewedAt: new Date().toISOString(),
        comments: null,
      };

      const updated = await persistActiveSession({
        title: titleInput.trim() || activeSession.title,
        notes: notesInput.trim() || null,
        normalizedSpec: currentSpec,
        normalizedDocument: currentSemantic,
        reviewState: activeSession.reviewState
          ? { ...activeSession.reviewState, reviewConfirmed, semanticReviewConfirmed }
          : extractionToReviewState(
              {
                geometryDraft: currentSpec,
                semanticDraft: currentSemantic,
                specDraft: currentSpec,
                ambiguities: [],
                confidenceSummary: { high: 0, medium: 0, low: 0 },
                sourceSketchSummary: "",
                extractionSource: "manual",
              },
              activeSession.backendMode,
              reviewConfirmed,
              semanticReviewConfirmed,
            ),
        validationReport: result.validationReport,
        drawingSvg: result.drawingSvg,
        renderMetadata: {
          ...activeSession.renderMetadata,
          dimensionTable: result.dimensionTable,
          planned3DModel: result.planned3DModel,
        },
        status: "rendered_2d",
      });

      if (updated) {
        toast.success(
          result.validationReport.blockingIssueCount > 0 || result.validationReport.reviewRequiredCount > 0
            ? "2D gerado, mas ainda há pendências que bloqueiam a exportação."
            : "Desenho 2D gerado com sucesso.",
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao gerar o desenho 2D.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRender3D = async () => {
    if (!activeSession) return;
    if (!reviewReady) {
      toast.error("Conclua a revisão antes de gerar o preview 3D.");
      return;
    }

    setIsBusy(true);
    try {
      const currentSpec = cloneSpec(latestSpecRef.current);
      const currentSemantic = hydrateSemanticDocument(
        currentSpec,
        latestSemanticRef.current,
        activeSession.reviewState?.ambiguities,
      );
      let result: TechnicalDrawing3DResult;

      try {
        const { data, error } = await supabase.functions.invoke("engineering-drawing", {
          body: { action: "render3d", spec: currentSpec, semanticDocument: currentSemantic },
        });
        if (error) throw error;
        result = data as TechnicalDrawing3DResult;
      } catch (error) {
        console.warn("[engineering-drawing] render3d fallback:", error);
        result = await render3D(currentSpec, currentSemantic);
      }

      currentSemantic.validationReport = result.validationReport;
      const summaryResult = {
        previewStatus: result.previewStatus,
        meshSummary: result.meshSummary,
        boundingBoxMm: result.boundingBoxMm,
        validationReport: result.validationReport,
        blockingReasons: result.blockingReasons,
      };

      const updatedSession = await persistActiveSession({
        title: titleInput.trim() || activeSession.title,
        notes: notesInput.trim() || null,
        normalizedSpec: currentSpec,
        normalizedDocument: currentSemantic,
        validationReport: result.validationReport,
        reviewState: activeSession.reviewState
          ? { ...activeSession.reviewState, reviewConfirmed, semanticReviewConfirmed }
          : extractionToReviewState(
              {
                geometryDraft: currentSpec,
                semanticDraft: currentSemantic,
                specDraft: currentSpec,
                ambiguities: [],
                confidenceSummary: { high: 0, medium: 0, low: 0 },
                sourceSketchSummary: "",
                extractionSource: "manual",
              },
              activeSession.backendMode,
              reviewConfirmed,
              semanticReviewConfirmed,
            ),
        threeDPreviewStatus: result.previewStatus,
        threeDAsset:
          result.previewStatus === "ready" && result.glbBase64
            ? {
                format: "glb",
                path: null,
                url: `data:model/gltf-binary;base64,${result.glbBase64}`,
                updatedAt: new Date().toISOString(),
              }
            : activeSession.threeDAsset,
        renderMetadata: {
          ...activeSession.renderMetadata,
          planned3DModel: render2D(currentSpec, currentSemantic).planned3DModel,
          threeDResult: summaryResult,
        },
        status: result.previewStatus === "ready" ? "rendered_3d" : activeSession.status,
      });

      if (result.previewStatus === "ready" && result.glbBase64) {
        const fileName = `${sanitizeFilename(activeSession.title || "desenho-tecnico")}.glb`;
        const blob = base64ToBlob(result.glbBase64, "model/gltf-binary");
        const persisted = await persistEngineeringDrawingExport({
          session: updatedSession ?? activeSession,
          fileName,
          blob,
          exportType: "glb",
        });
        setActiveSession(persisted);
        await refreshSessions(persisted.id);
        toast.success("Preview 3D e GLB gerados com sucesso.");
        return;
      }

      if (updatedSession) {
        toast.error(result.blockingReasons[0] ?? "O preview 3D continua bloqueado.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao gerar o preview 3D.");
    } finally {
      setIsBusy(false);
    }
  };

  const exportDisabled =
    !activeSession?.drawingSvg || !reviewReady || !(activeSession.validationReport?.canExport ?? false);

  const handleExport = async (exportType: "png" | "pdf") => {
    if (!activeSession?.drawingSvg) return;
    if (exportDisabled) {
      toast.error("Corrija os conflitos e confirme a revisão antes de exportar.");
      return;
    }

    setIsBusy(true);
    try {
      const pngDataUrl = await svgMarkupToPngDataUrl(activeSession.drawingSvg, 3);

      if (exportType === "png") {
        const fileName = `${sanitizeFilename(activeSession.title || "desenho-tecnico")}.png`;
        downloadDataUrl(pngDataUrl, fileName);
        const blob = await dataUrlToBlob(pngDataUrl);
        const updated = await persistEngineeringDrawingExport({
          session: activeSession,
          fileName,
          blob,
          exportType: "png",
        });
        setActiveSession(updated);
      } else {
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: "a3",
        });
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        pdf.addImage(pngDataUrl, "PNG", 24, 24, width - 48, height - 48, undefined, "FAST");
        const fileName = `${sanitizeFilename(activeSession.title || "desenho-tecnico")}.pdf`;
        pdf.save(fileName);

        const blob = pdf.output("blob");
        const updated = await persistEngineeringDrawingExport({
          session: activeSession,
          fileName,
          blob,
          exportType: "pdf",
        });
        setActiveSession(updated);
      }

      toast.success(`Export ${exportType.toUpperCase()} concluído.`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao exportar o desenho.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleDownloadGlb = () => {
    if (!activeSession?.threeDAsset?.url) {
      toast.error("Gere o preview 3D antes de baixar o GLB.");
      return;
    }

    downloadUrl(
      activeSession.threeDAsset.url,
      `${sanitizeFilename(activeSession.title || "desenho-tecnico")}.glb`,
    );
  };

  const dimensionTable = useMemo(() => {
    const maybeTable = activeSession?.renderMetadata?.dimensionTable;
    if (Array.isArray(maybeTable)) return maybeTable as Array<{ id: string; label: string; value: string; source: string }>;
    return fallbackRenderResult.dimensionTable;
  }, [activeSession?.renderMetadata, fallbackRenderResult.dimensionTable]);

  const planned3DModel = useMemo(() => {
    const maybePlanned = activeSession?.renderMetadata?.planned3DModel;
    if (maybePlanned && typeof maybePlanned === "object") {
      return maybePlanned as {
        status: string;
        readyForImplementation: boolean;
        message: string;
        unsupportedFeatures: string[];
        blockingReasons?: string[];
      };
    }
    return fallbackRenderResult.planned3DModel;
  }, [activeSession?.renderMetadata, fallbackRenderResult.planned3DModel]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Desenho Técnico 2D</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            V1 interna para ir do croqui ao desenho técnico preliminar, com revisão humana obrigatória e mesma arquitetura já
            preparada para um preview 3D futuro.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 border-slate-300 text-slate-700">
            <Layers3 className="h-3.5 w-3.5" />
            Persistência {activeSession?.backendMode === "supabase" ? "Supabase" : "local"}
          </Badge>
          <Badge variant="outline" className="gap-1 border-slate-300 text-slate-700">
            <Ruler className="h-3.5 w-3.5" />
            Unidade padrão: mm
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-sky-600" />
              Croqui
            </CardTitle>
            <CardDescription>Upload, seleção do corpus oficial e contexto da sessão antes da revisão.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
              <div className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
                  <div className="space-y-2">
                    <Label htmlFor="drawing-title">Título da peça</Label>
                    <Input
                      id="drawing-title"
                      value={titleInput}
                      onChange={(event) => {
                        setTitleInput(event.target.value);
                        if (activeSession?.normalizedSpec) {
                          const nextSpec = { ...activeSession.normalizedSpec, partName: event.target.value };
                          updateDraftSpec(nextSpec);
                          updateDraftSemantic({
                            ...semanticDocument,
                            documentMetadata: {
                              ...semanticDocument.documentMetadata,
                              partName: event.target.value,
                            },
                          });
                          setActiveSession((current) =>
                            current
                              ? {
                                  ...current,
                                  title: event.target.value,
                                  normalizedSpec: { ...(current.normalizedSpec ?? nextSpec), partName: event.target.value },
                                  normalizedDocument: {
                                    ...(current.normalizedDocument ?? semanticDocument),
                                    documentMetadata: {
                                      ...(current.normalizedDocument?.documentMetadata ?? semanticDocument.documentMetadata),
                                      partName: event.target.value,
                                    },
                                  },
                                }
                              : current,
                          );
                        }
                      }}
                      placeholder="Ex.: Hexágono M12"
                    />
                  </div>

                  <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <div>
                      <p className="font-medium text-slate-900">Upload do croqui</p>
                      <p className="text-xs text-slate-500">
                        Se a edge function ainda não estiver publicada, a tela cai para modo manual ou fixture.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isBusy}
                      className="w-full gap-2"
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
                      Enviar sketch
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUploadFile(file);
                        event.currentTarget.value = "";
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drawing-notes">Observações</Label>
                  <Textarea
                    id="drawing-notes"
                    value={notesInput}
                    onChange={(event) => setNotesInput(event.target.value)}
                    placeholder="Anotações livres do time antes da revisão."
                    className="min-h-[96px]"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Corpus oficial de teste</Label>
                    <Badge variant="secondary">{engineeringDrawingFixtures.length} sketches</Badge>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {engineeringDrawingFixtures.map((fixture) => (
                      <button
                        key={fixture.id}
                        type="button"
                        onClick={() => void handleFixtureSelect(fixture.id)}
                        disabled={isBusy}
                        data-testid={`engineering-drawing-fixture-${fixture.id}`}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-sky-300 hover:shadow-md"
                      >
                        <div className="grid grid-cols-[112px_minmax(0,1fr)]">
                          <img src={fixture.imageUrl} alt={fixture.title} className="h-full w-full object-cover" />
                          <div className="space-y-2 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-slate-900">{fixture.title}</p>
                                <p className="text-xs text-slate-500">{fixture.description}</p>
                              </div>
                              <Sparkles className="mt-0.5 h-4 w-4 text-sky-600 transition group-hover:scale-110" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">Fixture local</Badge>
                              <Badge variant="outline">2D pronto</Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Sessões recentes</Label>
                    {loadingSessions ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
                  </div>
                  <ScrollArea className="h-[240px] rounded-2xl border border-slate-200 bg-slate-50">
                    <div className="space-y-2 p-3">
                      {sessions.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhuma sessão salva ainda.</p>
                      ) : (
                        sessions.map((session) => (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => setActiveSession(session)}
                            className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                              activeSession?.id === session.id
                                ? "border-sky-300 bg-sky-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{session.title}</p>
                                <p className="text-xs text-slate-500">{new Date(session.updatedAt).toLocaleString("pt-BR")}</p>
                              </div>
                              <Badge variant="outline">{session.backendMode}</Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge
                                variant={
                                  session.status === "rendered_2d" || session.status === "rendered_3d"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {session.status}
                              </Badge>
                              {session.fixtureId ? <Badge variant="outline">fixture</Badge> : null}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {activeSession?.sourceImageUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Sketch ativo</Label>
                      <Badge variant="outline">{activeSession.sourceImageName ?? "croqui"}</Badge>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img
                        src={activeSession.sourceImageUrl}
                        alt={activeSession.title}
                        className="h-[420px] w-full object-contain bg-slate-50"
                      />
                    </div>
                    {activeSession.reviewState?.sourceSketchSummary ? (
                      <p className="text-xs text-slate-600">{activeSession.reviewState.sourceSketchSummary}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PencilRuler className="h-5 w-5 text-emerald-600" />
              Revisão
            </CardTitle>
            <CardDescription>Confirmar medidas, resolver ambiguidades e travar o spec antes do desenho.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Comprimento total</p>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    data-testid="total-length-input"
                    value={spec.totalLengthMm === null ? "" : String(spec.totalLengthMm).replace(".", ",")}
                    onChange={(event) => {
                      const nextSpec = withUpdatedTotalLength(spec, event.target.value);
                      updateDraftSpec(nextSpec);
                    }}
                    placeholder="0,00"
                  />
                  <Badge variant="outline">mm</Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Confiança alta / média / baixa</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="bg-emerald-600">{activeSession?.reviewState?.confidenceSummary.high ?? 0}</Badge>
                  <Badge className="bg-amber-500">{activeSession?.reviewState?.confidenceSummary.medium ?? 0}</Badge>
                  <Badge className="bg-rose-600">{activeSession?.reviewState?.confidenceSummary.low ?? 0}</Badge>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Modo de revisão</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{activeSession?.reviewState?.extractionSource ?? "manual"}</Badge>
                  <Badge variant="outline">{activeSession?.backendMode ?? "local"}</Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Status da sessão</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    variant={
                      activeSession?.status === "rendered_2d" || activeSession?.status === "rendered_3d"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {activeSession?.status ?? "draft"}
                  </Badge>
                  {activeSession?.fixtureId ? <Badge variant="outline">fixture</Badge> : null}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Trechos externos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!activeSession) return;
                    updateDraftSpec({
                      ...spec,
                      segments: [
                        ...spec.segments,
                        createSegment({ label: `Trecho ${spec.segments.length + 1}` }),
                      ],
                    });
                  }}
                >
                  Adicionar trecho
                </Button>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-[1100px] divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-slate-600">
                      <th className="px-3 py-2 font-medium">Rótulo</th>
                      <th className="px-3 py-2 font-medium">Tipo</th>
                      <th className="px-3 py-2 font-medium">Comprimento</th>
                      <th className="px-3 py-2 font-medium">Ø inicial</th>
                      <th className="px-3 py-2 font-medium">Ø final</th>
                      <th className="px-3 py-2 font-medium">Forma</th>
                      <th className="px-3 py-2 font-medium">Entre faces</th>
                      <th className="px-3 py-2 font-medium">Rosca</th>
                      <th className="px-3 py-2 font-medium">Passo</th>
                      <th className="px-3 py-2 font-medium">Conf.</th>
                      <th className="px-3 py-2 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {spec.segments.map((segment) => (
                      <tr key={segment.id}>
                        <td className="px-3 py-2">
                          <Input
                            value={segment.label}
                            onChange={(event) => {
                              const nextSpec = updateSegmentAt(spec, segment.id, { label: event.target.value });
                              updateDraftSpec(nextSpec);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={segment.kind}
                            onValueChange={(value) => {
                              const nextSpec = updateSegmentAt(spec, segment.id, {
                                kind: value as AxisymmetricSegment["kind"],
                              });
                              updateDraftSpec(nextSpec);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cylinder">Cilíndrico</SelectItem>
                              <SelectItem value="taper">Taper</SelectItem>
                              <SelectItem value="thread">Rosca</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={segment.lengthMm === null ? "" : String(segment.lengthMm).replace(".", ",")}
                            onChange={(event) => {
                              const nextSpec = updateSegmentAt(spec, segment.id, {
                                lengthMm: parseNullableNumber(event.target.value),
                              });
                              updateDraftSpec(nextSpec);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={segment.startDiameterMm === null ? "" : String(segment.startDiameterMm).replace(".", ",")}
                            onChange={(event) => {
                              const nextSpec = updateSegmentAt(spec, segment.id, {
                                startDiameterMm: parseNullableNumber(event.target.value),
                              });
                              updateDraftSpec(nextSpec);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={segment.endDiameterMm === null ? "" : String(segment.endDiameterMm).replace(".", ",")}
                            onChange={(event) => {
                              const nextSpec = updateSegmentAt(spec, segment.id, {
                                endDiameterMm: parseNullableNumber(event.target.value),
                              });
                              updateDraftSpec(nextSpec);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={segment.externalShape}
                            onValueChange={(value) => {
                              const nextSpec = updateSegmentAt(spec, segment.id, {
                                externalShape: value as AxisymmetricSegment["externalShape"],
                              });
                              updateDraftSpec(nextSpec);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="round">Redondo</SelectItem>
                              <SelectItem value="hex">Sextavado</SelectItem>
                              <SelectItem value="square">Quadrado</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={segment.acrossFlatsMm === null ? "" : String(segment.acrossFlatsMm).replace(".", ",")}
                            onChange={(event) => {
                              const nextSpec = updateSegmentAt(spec, segment.id, {
                                acrossFlatsMm: parseNullableNumber(event.target.value),
                              });
                              updateDraftSpec(nextSpec);
                            }}
                            placeholder="SW/SQ"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={segment.threadDesignation ?? ""}
                            onChange={(event) => {
                              const nextSpec = updateSegmentAt(spec, segment.id, {
                                threadDesignation: event.target.value || null,
                              });
                              updateDraftSpec(nextSpec);
                            }}
                            placeholder="M12"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={segment.threadPitchMm === null ? "" : String(segment.threadPitchMm).replace(".", ",")}
                            onChange={(event) => {
                              const nextSpec = updateSegmentAt(spec, segment.id, {
                                threadPitchMm: parseNullableNumber(event.target.value),
                              });
                              updateDraftSpec(nextSpec);
                            }}
                            placeholder="1,75"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{segment.confidence === null ? "—" : segment.confidence.toFixed(2)}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!activeSession) return;
                              updateDraftSpec({
                                ...spec,
                                segments: spec.segments.filter((item) => item.id !== segment.id),
                              });
                            }}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Furos axiais</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!activeSession) return;
                        updateDraftSpec({
                          ...spec,
                          axialBores: [...spec.axialBores, createBore({ label: `Furo ${spec.axialBores.length + 1}` })],
                        });
                      }}
                    >
                      Adicionar furo
                    </Button>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {spec.axialBores.length === 0 ? (
                      <p className="text-sm text-slate-500">Nenhum furo axial cadastrado.</p>
                    ) : (
                      spec.axialBores.map((bore) => (
                        <div key={bore.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-4">
                          <Input
                            value={bore.label}
                            onChange={(event) => {
                              if (!activeSession) return;
                              updateDraftSpec({
                                ...spec,
                                axialBores: spec.axialBores.map((item) =>
                                  item.id === bore.id ? { ...item, label: event.target.value } : item,
                                ),
                              });
                            }}
                          />
                          <Input
                            value={bore.diameterMm === null ? "" : String(bore.diameterMm).replace(".", ",")}
                            onChange={(event) => {
                              if (!activeSession) return;
                              updateDraftSpec({
                                ...spec,
                                axialBores: spec.axialBores.map((item) =>
                                  item.id === bore.id ? { ...item, diameterMm: parseNullableNumber(event.target.value) } : item,
                                ),
                              });
                            }}
                            placeholder="Ø"
                          />
                          <Input
                            value={bore.depthMm === null ? "" : String(bore.depthMm).replace(".", ",")}
                            onChange={(event) => {
                              if (!activeSession) return;
                              updateDraftSpec({
                                ...spec,
                                axialBores: spec.axialBores.map((item) =>
                                  item.id === bore.id ? { ...item, depthMm: parseNullableNumber(event.target.value) } : item,
                                ),
                              });
                            }}
                            placeholder="Profundidade"
                          />
                          <div className="flex gap-2">
                            <Select
                              value={bore.startFrom}
                              onValueChange={(value) => {
                                if (!activeSession) return;
                                updateDraftSpec({
                                  ...spec,
                                  axialBores: spec.axialBores.map((item) =>
                                    item.id === bore.id ? { ...item, startFrom: value as "left" | "right" } : item,
                                  ),
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Esquerda</SelectItem>
                                <SelectItem value="right">Direita</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                if (!activeSession) return;
                                updateDraftSpec({
                                  ...spec,
                                  axialBores: spec.axialBores.filter((item) => item.id !== bore.id),
                                });
                              }}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <Label>Notas da peça</Label>
                    <Badge variant="outline">{spec.notes.length} nota(s)</Badge>
                  </div>
                  <Textarea
                    value={spec.notes.join("\n")}
                    onChange={(event) => {
                      if (!activeSession) return;
                      updateDraftSpec(withUpdatedNotes(spec, event.target.value));
                    }}
                    placeholder="Uma nota por linha."
                    className="min-h-[180px] bg-white"
                  />
                </div>

                <div
                  className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  data-testid="gdt-review-panel"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>GD&T e datums</Label>
                      <p className="mt-1 text-xs text-slate-500">
                        Camada semântica revisável, separada da geometria axisimétrica.
                      </p>
                    </div>
                    <Badge variant={semanticReviewNeeded ? "outline" : "secondary"}>
                      {semanticDocument.gdtCallouts.length} callout(s)
                    </Badge>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_180px]">
                    <div className="space-y-2">
                      <Label>Norma</Label>
                      <Select
                        value={semanticDocument.documentMetadata.governingStandard.system}
                        onValueChange={(value) => {
                          const nextDocument = hydrateSemanticDocument(spec, semanticDocument, activeSession?.reviewState?.ambiguities);
                          nextDocument.documentMetadata.governingStandard = {
                            ...nextDocument.documentMetadata.governingStandard,
                            system: value as EngineeringDrawingSemanticDocument["documentMetadata"]["governingStandard"]["system"],
                            source: value === "UNKNOWN" ? "unresolved" : "manual",
                          };
                          nextDocument.ambiguityFlags = nextDocument.ambiguityFlags.filter(
                            (ambiguity) => ambiguity.fieldPath !== "documentMetadata.governingStandard",
                          );
                          updateDraftSemantic(nextDocument);
                          if (activeSession?.reviewState) {
                            setActiveSession({
                              ...activeSession,
                              reviewState: {
                                ...activeSession.reviewState,
                                ambiguities: activeSession.reviewState.ambiguities.filter(
                                  (ambiguity) => ambiguity.fieldPath !== "documentMetadata.governingStandard",
                                ),
                              },
                              normalizedDocument: nextDocument,
                            });
                          }
                        }}
                      >
                        <SelectTrigger data-testid="gdt-standard-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNKNOWN">Não definida</SelectItem>
                          <SelectItem value="ASME">ASME</SelectItem>
                          <SelectItem value="ISO">ISO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Edição / referência</Label>
                      <Input
                        value={semanticDocument.documentMetadata.governingStandard.edition ?? ""}
                        onChange={(event) => {
                          updateDraftSemantic({
                            ...semanticDocument,
                            documentMetadata: {
                              ...semanticDocument.documentMetadata,
                              governingStandard: {
                                ...semanticDocument.documentMetadata.governingStandard,
                                edition: event.target.value || null,
                              },
                            },
                          });
                        }}
                        placeholder="Ex.: 2018 ou 1101:2017"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Axisimetria</Label>
                      <Badge
                        variant={semanticDocument.documentMetadata.isAxisymmetric ? "secondary" : "outline"}
                        className="w-full justify-center py-2"
                      >
                        {semanticDocument.documentMetadata.isAxisymmetric ? "Confirmada" : "Pendente / fora do escopo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Datums extraídos</Label>
                      <Badge variant="outline">{semanticDocument.datumFeatures.length}</Badge>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-left text-slate-600">
                          <tr>
                            <th className="px-3 py-2 font-medium">Datum</th>
                            <th className="px-3 py-2 font-medium">Tipo</th>
                            <th className="px-3 py-2 font-medium">Feature</th>
                            <th className="px-3 py-2 font-medium">Conf.</th>
                            <th className="px-3 py-2 font-medium">Revisão</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {semanticDocument.datumFeatures.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                                Nenhum datum extraído neste sketch.
                              </td>
                            </tr>
                          ) : (
                            semanticDocument.datumFeatures.map((datum) => (
                              <tr key={datum.id}>
                                <td className="px-3 py-2 font-medium text-slate-900">{datum.label}</td>
                                <td className="px-3 py-2">
                                  <Select
                                    value={datum.datumType}
                                    onValueChange={(value) => {
                                      updateDraftSemantic({
                                        ...semanticDocument,
                                        datumFeatures: semanticDocument.datumFeatures.map((item) =>
                                          item.id === datum.id
                                            ? {
                                                ...item,
                                                datumType: value as typeof item.datumType,
                                                needsHumanConfirmation: false,
                                              }
                                            : item,
                                        ),
                                      });
                                    }}
                                  >
                                    <SelectTrigger data-testid={`datum-type-${datum.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unknown">Pendente</SelectItem>
                                      <SelectItem value="plane">Plano</SelectItem>
                                      <SelectItem value="axis">Eixo</SelectItem>
                                      <SelectItem value="center_plane">Plano mediano</SelectItem>
                                      <SelectItem value="common">Comum</SelectItem>
                                      <SelectItem value="point">Ponto</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {semanticDocument.features.find((feature) => feature.id === datum.featureRefId)?.label ??
                                    datum.featureRefId ??
                                    "Não associado"}
                                </td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline">
                                    {datum.confidence === null ? "—" : datum.confidence.toFixed(2)}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2">
                                  <Badge variant={datum.needsHumanConfirmation ? "outline" : "secondary"}>
                                    {datum.needsHumanConfirmation ? "Pendente" : "Confirmado"}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Feature control frames</Label>
                      <Badge variant="outline">{semanticDocument.gdtCallouts.length}</Badge>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-left text-slate-600">
                          <tr>
                            <th className="px-3 py-2 font-medium">Texto bruto</th>
                            <th className="px-3 py-2 font-medium">Característica</th>
                            <th className="px-3 py-2 font-medium">Datums</th>
                            <th className="px-3 py-2 font-medium">Suporte</th>
                            <th className="px-3 py-2 font-medium">Revisão</th>
                            <th className="px-3 py-2 font-medium">Conf.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {semanticDocument.gdtCallouts.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                                Nenhum quadro de controle geométrico extraído.
                              </td>
                            </tr>
                          ) : (
                            semanticDocument.gdtCallouts.map((callout) => (
                              <tr key={callout.id}>
                                <td className="px-3 py-2 font-medium text-slate-900">{callout.rawText || "—"}</td>
                                <td className="px-3 py-2 text-slate-600">
                                  {callout.segments.map((segment) => segment.characteristic).join(" / ")}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {callout.segments
                                    .flatMap((segment) => segment.datumReferences.map((reference) => reference.datumLabel))
                                    .join(" | ") || "—"}
                                </td>
                                <td className="px-3 py-2">
                                  <Badge
                                    variant={
                                      callout.supportStatus === "supported"
                                        ? "secondary"
                                        : callout.supportStatus === "partial"
                                          ? "outline"
                                          : "destructive"
                                    }
                                  >
                                    {callout.supportStatus}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2">
                                  <Select
                                    value={callout.reviewStatus}
                                    onValueChange={(value) => {
                                      updateDraftSemantic({
                                        ...semanticDocument,
                                        gdtCallouts: semanticDocument.gdtCallouts.map((item) =>
                                          item.id === callout.id
                                            ? { ...item, reviewStatus: value as GdtCallout["reviewStatus"] }
                                            : item,
                                        ),
                                      });
                                    }}
                                  >
                                    <SelectTrigger data-testid={`callout-review-${callout.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="needs_review">Pendente</SelectItem>
                                      <SelectItem value="human_confirmed">Confirmado</SelectItem>
                                      <SelectItem value="human_corrected">Corrigido</SelectItem>
                                      <SelectItem value="rejected">Rejeitado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline">
                                    {callout.confidence === null ? "—" : callout.confidence.toFixed(2)}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <Label>Ambiguidades</Label>
                    <Badge variant="secondary">{semanticDocument.ambiguityFlags.length}</Badge>
                  </div>
                  <div className="mt-3 space-y-3">
                    {semanticDocument.ambiguityFlags.length === 0 ? (
                      <p className="text-sm text-slate-500">Nenhuma ambiguidade registrada.</p>
                    ) : (
                      semanticDocument.ambiguityFlags.map((ambiguity) => (
                        <div key={ambiguity.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <p className="text-sm font-medium text-amber-950">{ambiguity.question}</p>
                          <p className="mt-1 text-xs text-amber-900">{ambiguity.reason}</p>
                          {ambiguity.suggestedAction ? (
                            <p className="mt-2 text-xs text-amber-800">Ação sugerida: {ambiguity.suggestedAction}</p>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => {
                              const nextDocument = {
                                ...semanticDocument,
                                ambiguityFlags: semanticDocument.ambiguityFlags.filter((item) => item.id !== ambiguity.id),
                              };
                              updateDraftSemantic(nextDocument);
                              if (activeSession?.reviewState) {
                                setActiveSession({
                                  ...activeSession,
                                  normalizedDocument: nextDocument,
                                  reviewState: clearResolvedAmbiguity(activeSession.reviewState, ambiguity.id),
                                });
                              }
                            }}
                          >
                            Marcar como resolvida
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {spec.unsupportedFeatures.length > 0 ? (
                  <div
                    className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4"
                    data-testid="unsupported-features-panel"
                  >
                    <div className="flex items-center gap-2 text-yellow-900">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Features fora do escopo</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {spec.unsupportedFeatures.map((feature) => (
                        <div key={feature.id} className="rounded-xl border border-yellow-200 bg-white p-3 text-sm text-yellow-900">
                          <p className="font-medium">{feature.label}</p>
                          <p className="text-xs">{feature.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-3 text-sm font-medium text-slate-900">
                    <input
                      type="checkbox"
                      data-testid="review-confirm-checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                      checked={reviewConfirmed}
                      onChange={(event) => setReviewConfirmed(event.target.checked)}
                    />
                    <span>Revisão humana concluída. Nenhuma medida foi inventada.</span>
                  </label>
                  <label className="mt-4 flex items-start gap-3 text-sm font-medium text-slate-900">
                    <input
                      type="checkbox"
                      data-testid="semantic-review-confirm-checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                      checked={semanticReviewConfirmed}
                      onChange={(event) => setSemanticReviewConfirmed(event.target.checked)}
                      disabled={!semanticReviewNeeded}
                    />
                    <span>
                      Revisão semântica de GD&T concluída.
                      {!semanticReviewNeeded ? " Nenhum datum/callout exige confirmação nesta sessão." : ""}
                    </span>
                  </label>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleSaveReview()}
                      disabled={!activeSession || isBusy}
                      data-testid="save-review-button"
                      className="w-full"
                    >
                      {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar revisão
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleRender()}
                      disabled={!activeSession || isBusy}
                      data-testid="generate-2d-button"
                      className="w-full"
                    >
                      {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Gerar desenho 2D
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void handleRender3D()}
                      disabled={!activeSession || isBusy}
                      data-testid="generate-3d-button"
                      className="w-full"
                    >
                      {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cuboid className="mr-2 h-4 w-4" />}
                      Gerar preview 3D
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-violet-600" />
              Desenho 2D
            </CardTitle>
            <CardDescription>Preview SVG, validação, export PNG/PDF e arquitetura pronta para 3D.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={currentValidation.blockingIssueCount > 0 ? "destructive" : "secondary"}>
                  {currentValidation.blockingIssueCount > 0
                    ? `${currentValidation.blockingIssueCount} conflito(s) bloqueante(s)`
                    : "Sem conflitos bloqueantes"}
                </Badge>
                <Badge variant={currentValidation.reviewRequiredCount > 0 ? "outline" : "secondary"}>
                  {currentValidation.reviewRequiredCount} item(ns) para revisão
                </Badge>
                <Badge variant="outline">{currentValidation.warningCount} aviso(s)</Badge>
                <Badge variant="outline">{currentValidation.infoCount} info(s)</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleExport("png")}
                  disabled={exportDisabled || isBusy}
                  data-testid="export-png-button"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleExport("pdf")}
                  disabled={exportDisabled || isBusy}
                  data-testid="export-pdf-button"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadGlb}
                  disabled={!activeSession?.threeDAsset?.url || isBusy}
                  data-testid="export-glb-button"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar GLB
                </Button>
              </div>
            </div>

            <div
              ref={previewRef}
              className="overflow-auto rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-inner"
              data-testid="engineering-drawing-preview"
            >
              {activeSession?.drawingSvg ? (
                <div className="min-h-[760px]" dangerouslySetInnerHTML={{ __html: activeSession.drawingSvg }} />
              ) : (
                <div className="flex min-h-[760px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                  Gere o 2D após concluir a revisão humana.
                </div>
              )}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Tabela de dimensões</h3>
                <div className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Item</th>
                        <th className="px-3 py-2 font-medium">Valor</th>
                        <th className="px-3 py-2 font-medium">Origem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dimensionTable.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-3 py-2 text-slate-900">{entry.label}</td>
                          <td className="px-3 py-2">{entry.value}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{entry.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Validação</h3>
                    {currentValidation.blockingIssueCount === 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    {currentValidation.issues.length === 0 ? (
                      <p className="text-sm text-slate-600">Nenhum problema detectado.</p>
                    ) : (
                      currentValidation.issues.map((issue) => (
                        <div
                          key={`${issue.code}-${issue.fieldPath ?? "root"}`}
                          className={`rounded-xl border px-3 py-2 text-sm ${
                            issue.severity === "error"
                              ? "border-rose-200 bg-rose-50 text-rose-900"
                              : issue.severity === "review-required"
                                ? "border-sky-200 bg-sky-50 text-sky-900"
                              : issue.severity === "warning"
                                ? "border-amber-200 bg-amber-50 text-amber-900"
                                : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          <p className="font-medium">{issue.message}</p>
                          {issue.fieldPath ? <p className="text-xs opacity-80">{issue.fieldPath}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Prontidão 3D</h3>
                    <Badge
                      variant={
                        activeSession?.threeDPreviewStatus === "ready"
                          ? "secondary"
                          : planned3DModel.readyForImplementation
                            ? "outline"
                            : "destructive"
                      }
                    >
                      {activeSession?.threeDPreviewStatus ?? planned3DModel.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{planned3DModel.message}</p>
                  <div className="mt-3 space-y-2">
                    {(currentThreeDResult?.blockingReasons ?? planned3DModel.blockingReasons ?? []).map((reason) => (
                      <div key={reason} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                        {reason}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {planned3DModel.unsupportedFeatures.map((feature) => (
                      <Badge key={feature} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  {currentThreeDResult ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                      <p>
                        Malhas: {currentThreeDResult.meshSummary.segmentMeshCount} | Bores: {currentThreeDResult.meshSummary.boreSectionCount}
                      </p>
                      <p>
                        Bounding box: {formatMm(currentThreeDResult.boundingBoxMm.length)} x {formatMm(currentThreeDResult.boundingBoxMm.width)} x{" "}
                        {formatMm(currentThreeDResult.boundingBoxMm.height)} mm
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Preview 3D</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    O sólido 3D é gerado apenas a partir do spec axisimétrico revisado. GD&T permanece como camada de revisão e validação.
                  </p>
                  <div className="mt-4" data-testid="engineering-drawing-3d-preview">
                    {planned3DModel.readyForImplementation ? (
                      <EngineeringDrawing3DPreview spec={spec} />
                    ) : (
                      <div className="flex h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                        O preview 3D está bloqueado pelas restrições de geometria ou pela revisão pendente.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

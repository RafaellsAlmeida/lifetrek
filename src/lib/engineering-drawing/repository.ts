import { supabase } from "@/integrations/supabase/client";
import { fileNameFromPath, sanitizeFilename } from "./format";
import type {
  AxisymmetricPartSpec,
  EngineeringDrawingSemanticDocument,
  EngineeringDrawingSessionRecord,
  ExtractionResult,
  ReviewState,
  TechnicalDrawing3DAsset,
  ThreeDPreviewStatus,
  ValidationReport,
} from "./types";

const LOCAL_STORAGE_KEY = "engineering-drawing-sessions-v1";
const STORAGE_BUCKET = "engineering-drawings";
type EngineeringDrawingExportType = "svg" | "png" | "pdf" | "glb" | "step" | "a3_svg" | "a3_png" | "a3_pdf";

type PersistedLocalSession = EngineeringDrawingSessionRecord;

type SessionUpdatePayload = {
  title?: string;
  status?: EngineeringDrawingSessionRecord["status"];
  notes?: string | null;
  rawExtraction?: ExtractionResult | null;
  normalizedSpec?: AxisymmetricPartSpec | null;
  normalizedDocument?: EngineeringDrawingSemanticDocument | null;
  reviewState?: ReviewState | null;
  validationReport?: ValidationReport | null;
  drawingSvg?: string | null;
  threeDPreviewStatus?: ThreeDPreviewStatus | null;
  threeDAsset?: TechnicalDrawing3DAsset | null;
  renderMetadata?: Record<string, unknown>;
  exports?: Record<string, unknown>;
  sourceImagePath?: string | null;
  sourceImageName?: string | null;
  sourceImageUrl?: string | null;
  reviewedBy?: string | null;
  fixtureId?: string | null;
};

function readLocalSessions(): PersistedLocalSession[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PersistedLocalSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalSessions(sessions: PersistedLocalSession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
}

function upsertLocalSession(session: EngineeringDrawingSessionRecord): EngineeringDrawingSessionRecord {
  const current = readLocalSessions();
  const next = [session, ...current.filter((item) => item.id !== session.id)].slice(0, 20);
  writeLocalSessions(next);
  return session;
}

function updateLocalSession(id: string, patch: SessionUpdatePayload): EngineeringDrawingSessionRecord | null {
  const current = readLocalSessions();
  let updatedSession: EngineeringDrawingSessionRecord | null = null;
  const next = current.map((session) => {
    if (session.id !== id) return session;
    updatedSession = {
      ...session,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return updatedSession;
  });
  writeLocalSessions(next);
  return updatedSession;
}

function removeLocalSession(id: string) {
  const current = readLocalSessions();
  writeLocalSessions(current.filter((session) => session.id !== id));
}

function looksLikeMissingSchema(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("relation") ||
    normalized.includes("does not exist") ||
    normalized.includes("bucket") ||
    normalized.includes("not found")
  );
}

async function trySignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

function normalizeSessionRow(row: any, sourceImageUrl: string | null): EngineeringDrawingSessionRecord {
  const renderMetadata = (row.render_metadata as Record<string, unknown> | null) ?? {};
  const exports = (row.exports as Record<string, unknown> | null) ?? {};
  const threeDAsset = (exports.glb as TechnicalDrawing3DAsset | undefined) ?? null;

  return {
    id: row.id,
    title: row.title,
    status: row.status,
    unit: row.unit ?? "mm",
    notes: row.notes ?? null,
    sourceImagePath: row.source_image_path ?? null,
    sourceImageName: row.source_image_name ?? fileNameFromPath(row.source_image_path),
    sourceImageUrl,
    rawExtraction: (row.raw_extraction as ExtractionResult | null) ?? null,
    normalizedSpec: (row.normalized_spec as AxisymmetricPartSpec | null) ?? null,
    normalizedDocument: (row.normalized_document as EngineeringDrawingSemanticDocument | null) ?? null,
    reviewState: (row.review_flags as ReviewState | null) ?? null,
    validationReport: (row.validation_report as ValidationReport | null) ?? null,
    drawingSvg: row.drawing_svg ?? null,
    threeDPreviewStatus: (renderMetadata.threeDPreviewStatus as ThreeDPreviewStatus | undefined) ?? null,
    threeDAsset,
    renderMetadata,
    exports,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? null,
    reviewedBy: row.reviewed_by ?? null,
    backendMode: "supabase",
    fixtureId: (row.render_metadata?.fixtureId as string | undefined) ?? null,
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function createRemoteSessionBase(args: {
  id: string;
  title: string;
  notes?: string;
  sourceImagePath?: string | null;
  sourceImageName?: string | null;
  sourceImageUrl?: string | null;
  fixtureId?: string | null;
}) {
  const userId = await getCurrentUserId();

  const insertPayload = {
    id: args.id,
    title: args.title,
    notes: args.notes ?? null,
    status: "draft",
    unit: "mm",
    source_image_path: args.sourceImagePath ?? null,
    source_image_name: args.sourceImageName ?? null,
    created_by: userId,
    render_metadata: args.fixtureId ? { fixtureId: args.fixtureId } : {},
  };

  const { data, error } = await supabase
    .from("engineering_drawing_sessions")
    .insert(insertPayload as never)
    .select("*")
    .single();

  if (error) throw error;

  return normalizeSessionRow(data, args.sourceImageUrl ?? (await trySignedUrl(args.sourceImagePath ?? null)));
}

async function uploadSourceImage(sessionId: string, file: File): Promise<{ sourceImagePath: string; sourceImageUrl: string | null }> {
  const filePath = `sessions/${sessionId}/source/${Date.now()}-${sanitizeFilename(file.name)}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) throw error;

  return {
    sourceImagePath: filePath,
    sourceImageUrl: await trySignedUrl(filePath),
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

export async function listEngineeringDrawingSessions(): Promise<EngineeringDrawingSessionRecord[]> {
  try {
    const { data, error } = await supabase
      .from("engineering_drawing_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) throw error;

    const sessions = await Promise.all(
      (data ?? []).map(async (row) => normalizeSessionRow(row, await trySignedUrl(row.source_image_path ?? null))),
    );

    return sessions;
  } catch (error) {
    console.warn("[engineering-drawing] Falling back to local sessions:", error);
    return readLocalSessions();
  }
}

export async function createEngineeringDrawingSessionFromUpload(args: {
  file: File;
  title: string;
  notes?: string;
}): Promise<EngineeringDrawingSessionRecord> {
  const id = crypto.randomUUID();

  try {
    const upload = await uploadSourceImage(id, args.file);
    return await createRemoteSessionBase({
      id,
      title: args.title,
      notes: args.notes,
      sourceImageName: args.file.name,
      sourceImagePath: upload.sourceImagePath,
      sourceImageUrl: upload.sourceImageUrl,
    });
  } catch (error) {
    console.warn("[engineering-drawing] Upload session fallback to local mode:", error);

    const localSession: EngineeringDrawingSessionRecord = {
      id,
      title: args.title,
      status: "draft",
      unit: "mm",
      notes: args.notes ?? null,
      sourceImagePath: null,
      sourceImageName: args.file.name,
      sourceImageUrl: await fileToDataUrl(args.file),
      rawExtraction: null,
      normalizedSpec: null,
      normalizedDocument: null,
      reviewState: null,
      validationReport: null,
      drawingSvg: null,
      threeDPreviewStatus: null,
      threeDAsset: null,
      renderMetadata: {},
      exports: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: null,
      reviewedBy: null,
      backendMode: "local",
      fixtureId: null,
    };

    return upsertLocalSession(localSession);
  }
}

export async function createEngineeringDrawingSessionFromFixture(args: {
  title: string;
  notes?: string;
  imageUrl: string;
  sourceImageName: string;
  fixtureId: string;
}): Promise<EngineeringDrawingSessionRecord> {
  const id = crypto.randomUUID();

  try {
    return await createRemoteSessionBase({
      id,
      title: args.title,
      notes: args.notes,
      sourceImageName: args.sourceImageName,
      sourceImagePath: args.imageUrl,
      sourceImageUrl: args.imageUrl,
      fixtureId: args.fixtureId,
    });
  } catch (error) {
    console.warn("[engineering-drawing] Fixture session fallback to local mode:", error);
    const localSession: EngineeringDrawingSessionRecord = {
      id,
      title: args.title,
      status: "draft",
      unit: "mm",
      notes: args.notes ?? null,
      sourceImagePath: args.imageUrl,
      sourceImageName: args.sourceImageName,
      sourceImageUrl: args.imageUrl,
      rawExtraction: null,
      normalizedSpec: null,
      normalizedDocument: null,
      reviewState: null,
      validationReport: null,
      drawingSvg: null,
      threeDPreviewStatus: null,
      threeDAsset: null,
      renderMetadata: { fixtureId: args.fixtureId },
      exports: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: null,
      reviewedBy: null,
      backendMode: "local",
      fixtureId: args.fixtureId,
    };
    return upsertLocalSession(localSession);
  }
}

export async function updateEngineeringDrawingSession(
  session: EngineeringDrawingSessionRecord,
  patch: SessionUpdatePayload,
): Promise<EngineeringDrawingSessionRecord> {
  if (session.backendMode === "local") {
    const updated = updateLocalSession(session.id, patch);
    if (!updated) throw new Error("Sessão local não encontrada.");
    return updated;
  }

  const userId = await getCurrentUserId();
  const updatePayload = {
    title: patch.title ?? session.title,
    status: patch.status ?? session.status,
    notes: patch.notes ?? session.notes,
    raw_extraction: patch.rawExtraction ?? session.rawExtraction,
    normalized_spec: patch.normalizedSpec ?? session.normalizedSpec,
    normalized_document: patch.normalizedDocument ?? session.normalizedDocument,
    review_flags: patch.reviewState ?? session.reviewState,
    validation_report: patch.validationReport ?? session.validationReport,
    drawing_svg: patch.drawingSvg ?? session.drawingSvg,
    render_metadata: {
      ...(session.renderMetadata ?? {}),
      ...(patch.renderMetadata ?? {}),
      threeDPreviewStatus: patch.threeDPreviewStatus ?? session.threeDPreviewStatus ?? null,
    },
    exports: {
      ...(session.exports ?? {}),
      ...(patch.exports ?? {}),
      ...(patch.threeDAsset ? { glb: patch.threeDAsset } : {}),
    },
    source_image_path: patch.sourceImagePath ?? session.sourceImagePath,
    source_image_name: patch.sourceImageName ?? session.sourceImageName,
    reviewed_by:
      patch.reviewedBy ??
      (patch.status === "reviewed" || patch.status === "rendered_2d" || patch.status === "rendered_3d"
        ? userId
        : session.reviewedBy),
  };

  try {
    const { data, error } = await supabase
      .from("engineering_drawing_sessions")
      .update(updatePayload as never)
      .eq("id", session.id)
      .select("*")
      .single();

    if (error) throw error;

    return normalizeSessionRow(
      data,
      patch.sourceImageUrl ?? session.sourceImageUrl ?? (await trySignedUrl(updatePayload.source_image_path ?? null)),
    );
  } catch (error) {
    console.warn("[engineering-drawing] Update fallback to local mode:", error);

    if (looksLikeMissingSchema(error instanceof Error ? error.message : String(error))) {
      removeLocalSession(session.id);
      const localSession: EngineeringDrawingSessionRecord = {
        ...session,
        ...patch,
        sourceImageUrl: patch.sourceImageUrl ?? session.sourceImageUrl,
        threeDPreviewStatus: patch.threeDPreviewStatus ?? session.threeDPreviewStatus,
        threeDAsset: patch.threeDAsset ?? session.threeDAsset,
        backendMode: "local",
        updatedAt: new Date().toISOString(),
      };
      return upsertLocalSession(localSession);
    }

    throw error;
  }
}

export async function persistEngineeringDrawingExport(args: {
  session: EngineeringDrawingSessionRecord;
  fileName: string;
  blob: Blob;
  exportType: EngineeringDrawingExportType;
  storageKey?: string;
}): Promise<EngineeringDrawingSessionRecord> {
  if (args.session.backendMode === "local") {
    return args.session;
  }

  const filePath = args.storageKey
    ? `sessions/${args.session.id}/exports/${args.storageKey}`
    : `sessions/${args.session.id}/exports/${Date.now()}-${sanitizeFilename(args.fileName)}`;
  const contentTypeByExport: Record<EngineeringDrawingExportType, string> = {
    svg: "image/svg+xml;charset=utf-8",
    png: "image/png",
    pdf: "application/pdf",
    glb: "model/gltf-binary",
    step: "model/step",
    a3_svg: "image/svg+xml;charset=utf-8",
    a3_png: "image/png",
    a3_pdf: "application/pdf",
  };
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, args.blob, {
    contentType: contentTypeByExport[args.exportType],
    upsert: true,
  });

  if (error) {
    console.warn("[engineering-drawing] Export persistence failed:", error);
    return args.session;
  }

  const signedUrl = await trySignedUrl(filePath);
  return updateEngineeringDrawingSession(args.session, {
    exports: {
      ...args.session.exports,
      [args.exportType]: {
        format: args.exportType,
        fileName: args.fileName,
        path: filePath,
        url: signedUrl,
        updatedAt: new Date().toISOString(),
      },
    },
    threeDAsset:
      args.exportType === "glb"
        ? {
            format: "glb",
            path: filePath,
            url: signedUrl,
            updatedAt: new Date().toISOString(),
          }
        : args.session.threeDAsset,
  });
}

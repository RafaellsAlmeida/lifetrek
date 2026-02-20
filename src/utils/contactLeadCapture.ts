import { supabase } from "@/integrations/supabase/client";

export type ContactLeadPayload = {
  name: string;
  email: string;
  company?: string;
  company_size?: string;
  business_challenges?: string;
  phone: string;
  project_type: string;
  project_types?: string[];
  technical_requirements?: string;
  annual_volume?: string;
  message?: string;
  source?: string;
  status?: string;
  priority?: string;
  lead_score?: number;
};

export type LeadSaveResult = {
  status: "saved" | "queued";
  reason?: string;
};

type PendingLeadQueueItem = {
  id: string;
  payload: ContactLeadPayload;
  attempts: number;
  reason: string;
  lastError?: string;
  nextRetryAt: string;
  createdAt: string;
  updatedAt: string;
};

const PENDING_LEADS_KEY = "lifetrek_pending_contact_leads_v1";
const RETRY_DELAYS_MS = [30_000, 120_000, 600_000, 1_800_000, 7_200_000, 28_800_000];
const MAX_COMPAT_ATTEMPTS = 12;
const MAX_QUEUE_ATTEMPTS = RETRY_DELAYS_MS.length + 2;

let flushInFlight: Promise<void> | null = null;

const randomId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `pending-${Date.now()}`);

const normalizeErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return "unknown_error";
  const maybeError = error as { message?: string; details?: string; hint?: string; code?: string };
  return maybeError.message || maybeError.details || maybeError.hint || maybeError.code || "unknown_error";
};

const extractMissingColumnName = (error: unknown) => {
  const message = normalizeErrorMessage(error);
  const quoted = message.match(/'([^']+)' column/i);
  if (quoted?.[1]) return quoted[1];

  const bare = message.match(/column\s+([a-z0-9_]+)\s+/i);
  return bare?.[1];
};

const isMissingColumnError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string };
  if (maybeError.code === "PGRST204") return true;
  return /column/i.test(normalizeErrorMessage(error)) && /schema cache/i.test(normalizeErrorMessage(error));
};

const isDuplicateEmailError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string; details?: string };
  if (maybeError.code === "23505") return true;
  const combined = `${maybeError.message || ""} ${maybeError.details || ""}`.toLowerCase();
  return combined.includes("duplicate key") || combined.includes("unique constraint");
};

const isEnumValueError = (error: unknown) => {
  const message = normalizeErrorMessage(error).toLowerCase();
  return message.includes("invalid input value for enum");
};

const isNotNullViolation = (error: unknown) => {
  const message = normalizeErrorMessage(error).toLowerCase();
  return message.includes("null value in column") && message.includes("not-null constraint");
};

const extractNotNullColumnName = (error: unknown) => {
  const message = normalizeErrorMessage(error);
  const quoted = message.match(/column\s+"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const bare = message.match(/column\s+([a-z0-9_]+)/i);
  return bare?.[1];
};

const applyNotNullFallback = (payload: ContactLeadPayload, column: string) => {
  const mutable = payload as ContactLeadPayload & Record<string, unknown>;
  const defaults: Record<string, unknown> = {
    phone: "Nao informado",
    project_type: "Orcamento",
    business_challenges: "Nao informado",
    company_size: "Nao informado",
    technical_requirements: "Nao informado",
  };

  if (!(column in defaults)) {
    return false;
  }

  if (mutable[column] !== undefined && mutable[column] !== null && mutable[column] !== "") {
    return false;
  }

  mutable[column] = defaults[column];
  return true;
};

const applyEnumFallback = (payload: ContactLeadPayload) => {
  const mutable = payload as ContactLeadPayload & { project_types?: string[] };
  if (Array.isArray(mutable.project_types) && mutable.project_types.length > 0) {
    delete mutable.project_types;
    return true;
  }

  if (mutable.project_type === "other_medical") {
    mutable.project_type = "Orcamento";
    return true;
  }

  if (mutable.project_type === "medical_devices") {
    mutable.project_type = "Dispositivos Médicos";
    return true;
  }

  if (mutable.project_type !== "Dispositivos Médicos") {
    mutable.project_type = "Dispositivos Médicos";
    return true;
  }

  return false;
};

const withoutUndefined = (payload: ContactLeadPayload, removedColumns = new Set<string>()) => {
  const entries = Object.entries(payload).filter(([key, value]) => value !== undefined && !removedColumns.has(key));
  return Object.fromEntries(entries) as Record<string, unknown>;
};

const loadQueue = (): PendingLeadQueueItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_LEADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingLeadQueueItem[]) : [];
  } catch (error) {
    console.error("Failed to parse pending leads queue:", error);
    return [];
  }
};

const saveQueue = (items: PendingLeadQueueItem[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_LEADS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save pending leads queue:", error);
  }
};

const computeNextRetryAt = (attempts: number) => {
  const index = Math.min(Math.max(attempts - 1, 0), RETRY_DELAYS_MS.length - 1);
  return new Date(Date.now() + RETRY_DELAYS_MS[index]).toISOString();
};

const queueKey = (payload: ContactLeadPayload) =>
  `${payload.email.toLowerCase()}|${payload.project_type}|${payload.message || ""}`;

type PersistResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

const updateExistingLeadByEmail = async (
  payload: ContactLeadPayload,
  removedColumns: Set<string>
): Promise<PersistResult> => {
  const mutablePayload: ContactLeadPayload = { ...payload };
  const email = mutablePayload.email;
  const { data, error } = await supabase
    .from("contact_leads")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (error) {
    return { ok: false, error: normalizeErrorMessage(error) };
  }

  const targetLeadId = Array.isArray(data) ? data[0]?.id : undefined;

  if (!targetLeadId) {
    return { ok: false, error: "duplicate_email_without_row_access" };
  }

  const localRemoved = new Set(removedColumns);

  for (let attempt = 0; attempt < MAX_COMPAT_ATTEMPTS; attempt += 1) {
    const updatePayload = withoutUndefined(mutablePayload, localRemoved);
    delete updatePayload.email;

    if (Object.keys(updatePayload).length === 0) {
      return { ok: true };
    }

    const { error: updateError } = await supabase
      .from("contact_leads")
      .update(updatePayload)
      .eq("id", targetLeadId);

    if (!updateError) {
      return { ok: true };
    }

    if (isEnumValueError(updateError) && applyEnumFallback(mutablePayload)) {
      continue;
    }

    if (isNotNullViolation(updateError)) {
      const notNullColumn = extractNotNullColumnName(updateError);
      if (notNullColumn && applyNotNullFallback(mutablePayload, notNullColumn)) {
        continue;
      }
    }

    const missingColumn = extractMissingColumnName(updateError);
    if (isMissingColumnError(updateError) && missingColumn && !localRemoved.has(missingColumn)) {
      localRemoved.add(missingColumn);
      continue;
    }

    return { ok: false, error: normalizeErrorMessage(updateError) };
  }

  return { ok: false, error: "max_update_compat_attempts_reached" };
};

const persistLead = async (payload: ContactLeadPayload): Promise<PersistResult> => {
  const mutablePayload: ContactLeadPayload = { ...payload };
  const removedColumns = new Set<string>();

  for (let attempt = 0; attempt < MAX_COMPAT_ATTEMPTS; attempt += 1) {
    const insertPayload = withoutUndefined(mutablePayload, removedColumns);
    const { error } = await supabase.from("contact_leads").insert(insertPayload);

    if (!error) {
      return { ok: true };
    }

    if (isEnumValueError(error) && applyEnumFallback(mutablePayload)) {
      continue;
    }

    if (isNotNullViolation(error)) {
      const notNullColumn = extractNotNullColumnName(error);
      if (notNullColumn && applyNotNullFallback(mutablePayload, notNullColumn)) {
        continue;
      }
    }

    const missingColumn = extractMissingColumnName(error);
    if (isMissingColumnError(error) && missingColumn && !removedColumns.has(missingColumn)) {
      removedColumns.add(missingColumn);
      continue;
    }

    if (isDuplicateEmailError(error)) {
      return updateExistingLeadByEmail(mutablePayload, removedColumns);
    }

    return { ok: false, error: normalizeErrorMessage(error) };
  }

  return { ok: false, error: "max_insert_compat_attempts_reached" };
};

export const queuePendingLead = (
  payload: ContactLeadPayload,
  reason: string,
  attemptOffset = 0
): PendingLeadQueueItem => {
  const queue = loadQueue();
  const key = queueKey(payload);
  const now = new Date().toISOString();

  const existingIndex = queue.findIndex((item) => queueKey(item.payload) === key);
  const attempts = attemptOffset > 0 ? attemptOffset : existingIndex >= 0 ? queue[existingIndex].attempts + 1 : 1;

  const nextItem: PendingLeadQueueItem = {
    id: existingIndex >= 0 ? queue[existingIndex].id : randomId(),
    payload,
    attempts,
    reason,
    lastError: reason,
    nextRetryAt: computeNextRetryAt(attempts),
    createdAt: existingIndex >= 0 ? queue[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    queue[existingIndex] = nextItem;
  } else {
    queue.push(nextItem);
  }

  saveQueue(queue);
  return nextItem;
};

export const saveLeadWithCompat = async (rawPayload: ContactLeadPayload): Promise<LeadSaveResult> => {
  const payload: ContactLeadPayload = {
    source: "website",
    status: "new",
    priority: "medium",
    business_challenges: "Nao informado",
    company_size: "Nao informado",
    ...rawPayload,
  };

  if (!payload.name || !payload.email) {
    return { status: "queued", reason: "missing_required_fields" };
  }

  try {
    const result = await persistLead(payload);
    if (result.ok) {
      return { status: "saved" };
    }

    queuePendingLead(payload, result.error);
    return { status: "queued", reason: result.error };
  } catch (error) {
    const reason = normalizeErrorMessage(error);
    queuePendingLead(payload, reason);
    return { status: "queued", reason };
  }
};

const shouldRetry = (item: PendingLeadQueueItem, nowMs: number) => {
  const retryAt = Date.parse(item.nextRetryAt);
  if (Number.isNaN(retryAt)) return true;
  return retryAt <= nowMs;
};

const doFlushPendingLeads = async () => {
  const queue = loadQueue();
  if (!queue.length) return;

  const remaining: PendingLeadQueueItem[] = [];
  const now = Date.now();

  for (const item of queue) {
    if (!shouldRetry(item, now)) {
      remaining.push(item);
      continue;
    }

    const result = await persistLead(item.payload);
    if (result.ok) {
      continue;
    }

    const attempts = item.attempts + 1;
    if (attempts > MAX_QUEUE_ATTEMPTS) {
      console.error("Dropping pending lead after max retry attempts:", item.payload.email, result.error);
      continue;
    }

    remaining.push({
      ...item,
      attempts,
      reason: result.error,
      lastError: result.error,
      nextRetryAt: computeNextRetryAt(attempts),
      updatedAt: new Date().toISOString(),
    });
  }

  saveQueue(remaining);
};

export const flushPendingLeads = async (): Promise<void> => {
  if (flushInFlight) {
    return flushInFlight;
  }

  flushInFlight = doFlushPendingLeads().finally(() => {
    flushInFlight = null;
  });

  return flushInFlight;
};

export const pendingLeadsStorageKey = PENDING_LEADS_KEY;

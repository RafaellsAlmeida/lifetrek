import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Clock3,
  FileText,
  ImageIcon,
  Loader2,
  Lock,
  MessageSquareWarning,
  PencilLine,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";

import logo from "@/assets/logo-optimized.webp";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ReviewItemSlide = {
  index: number;
  headline: string;
  body: string;
};

type ReviewItem = {
  item_id: string;
  content_type: "linkedin_carousel" | "instagram_post" | "blog_post";
  content_id: string;
  status: "pending" | "approved" | "rejected" | "edit_suggested";
  title: string;
  caption: string;
  thumbnail_url: string | null;
  slides: ReviewItemSlide[];
  reviewer_comment?: string | null;
  copy_edits?: unknown;
  content?: string | null;
};

type ReviewFetchResponse = {
  data: {
    reviewer_name: string;
    reviewer_email: string;
    expires_at: string;
    notes?: string | null;
    items: ReviewItem[];
  };
};

type ExpandedMode = "none" | "reject" | "edit";

type DraftState = {
  comment: string;
  caption: string;
  title: string;
  excerpt: string;
  slides: ReviewItemSlide[];
};

type ActionResponse = {
  data: {
    success: boolean;
    item_id: string;
    status: ReviewItem["status"];
    reviewer_comment?: string | null;
    already_reviewed?: boolean;
  };
};

class ReviewRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ReviewRequestError";
    this.status = status;
  }
}

const reviewBaseUrl = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stakeholder-review-action`
  : "";
const reviewApiKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const contentTypeMeta: Record<
  ReviewItem["content_type"],
  { label: string; className: string }
> = {
  linkedin_carousel: {
    label: "LinkedIn",
    className: "border-transparent bg-[#EAF2FB] text-[#004F8F]",
  },
  instagram_post: {
    label: "Instagram",
    className: "border-transparent bg-[#FFF1F2] text-[#C24177]",
  },
  blog_post: {
    label: "Blog",
    className: "border-transparent bg-[#ECFDF3] text-[#166534]",
  },
};

const statusMeta: Record<
  ReviewItem["status"],
  { label: string; className: string; icon: typeof Check }
> = {
  pending: {
    label: "Pendente",
    className: "border-transparent bg-[#EEF2FF] text-[#4338CA]",
    icon: Clock3,
  },
  approved: {
    label: "Aprovado",
    className: "border-transparent bg-[#ECFDF3] text-[#166534]",
    icon: Check,
  },
  rejected: {
    label: "Rejeitado",
    className: "border-transparent bg-[#FEF2F2] text-[#B91C1C]",
    icon: X,
  },
  edit_suggested: {
    label: "Sugestão enviada",
    className: "border-transparent bg-[#FFF7ED] text-[#C2410C]",
    icon: PencilLine,
  },
};

function formatExpiry(expiresAt: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(expiresAt));
}

function createDefaultDraft(item: ReviewItem): DraftState {
  return {
    comment: item.reviewer_comment ?? "",
    caption: item.content_type === "blog_post" ? "" : item.caption,
    title: item.content_type === "blog_post" ? item.title : "",
    excerpt: item.content_type === "blog_post" ? item.caption : "",
    slides: item.slides.map((slide) => ({ ...slide })),
  };
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({} as Record<string, unknown>));

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && typeof (payload as { error?: unknown }).error === "string"
        ? String((payload as { error: unknown }).error)
        : "Falha ao carregar a revisão.";
    throw new ReviewRequestError(message, response.status);
  }

  return payload as T;
}

async function fetchReview(token: string): Promise<ReviewFetchResponse> {
  if (!reviewBaseUrl || !reviewApiKey) {
    throw new ReviewRequestError("Variáveis do Supabase não estão configuradas neste ambiente.", 500);
  }

  const response = await fetch(
    `${reviewBaseUrl}?token=${encodeURIComponent(token)}&action=fetch`,
    {
      headers: {
        apikey: reviewApiKey,
      },
    },
  );

  return parseApiResponse<ReviewFetchResponse>(response);
}

async function postReviewAction(
  token: string,
  payload: Record<string, unknown>,
): Promise<ActionResponse> {
  if (!reviewBaseUrl || !reviewApiKey) {
    throw new ReviewRequestError("Variáveis do Supabase não estão configuradas neste ambiente.", 500);
  }

  const response = await fetch(reviewBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: reviewApiKey,
    },
    body: JSON.stringify({
      token,
      ...payload,
    }),
  });

  return parseApiResponse<ActionResponse>(response);
}

function ErrorShell({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#B91C1C]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{message}</p>
        {onRetry ? (
          <Button className="mt-6" onClick={onRetry}>
            <RefreshCcw className="h-4 w-4" />
            {retryLabel ?? "Tentar novamente"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function StakeholderReviewPage() {
  const { token = "" } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const targetItemId = searchParams.get("item");
  const queryClient = useQueryClient();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const didScrollToTargetRef = useRef(false);

  const [expandedModes, setExpandedModes] = useState<Record<string, ExpandedMode>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const reviewQuery = useQuery({
    queryKey: ["stakeholder-review", token],
    queryFn: () => fetchReview(token),
    enabled: Boolean(token),
    retry: false,
  });

  const reviewData = reviewQuery.data?.data;
  const items = reviewData?.items ?? [];

  const reviewedCount = useMemo(
    () => items.filter((item) => item.status !== "pending").length,
    [items],
  );
  const progressValue = items.length > 0 ? Math.round((reviewedCount / items.length) * 100) : 0;

  useEffect(() => {
    if (!reviewData) {
      return;
    }

    setDrafts((current) => {
      const next = { ...current };
      let hasChange = false;

      for (const item of reviewData.items) {
        if (!next[item.item_id]) {
          next[item.item_id] = createDefaultDraft(item);
          hasChange = true;
        }
      }

      return hasChange ? next : current;
    });
  }, [reviewData]);

  useEffect(() => {
    if (!reviewData || !targetItemId || didScrollToTargetRef.current) {
      return;
    }

    const scrollToTarget = () => {
      const targetNode = cardRefs.current[targetItemId];
      if (!targetNode) {
        return;
      }

      didScrollToTargetRef.current = true;
      targetNode.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const frameId = window.requestAnimationFrame(scrollToTarget);
    const timeoutId = window.setTimeout(scrollToTarget, 180);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [reviewData, targetItemId, items.length]);

  const ensureDraft = (item: ReviewItem) => {
    setDrafts((current) => {
      if (current[item.item_id]) {
        return current;
      }

      return {
        ...current,
        [item.item_id]: createDefaultDraft(item),
      };
    });
  };

  const patchItem = (itemId: string, patch: Partial<ReviewItem>) => {
    queryClient.setQueryData<ReviewFetchResponse | undefined>(
      ["stakeholder-review", token],
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          data: {
            ...current.data,
            items: current.data.items.map((item) =>
              item.item_id === itemId ? { ...item, ...patch } : item,
            ),
          },
        };
      },
    );
  };

  const updateDraft = (
    itemId: string,
    updater: (draft: DraftState) => DraftState,
  ) => {
    setDrafts((current) => ({
      ...current,
      [itemId]: updater(
        current[itemId] ?? {
          comment: "",
          caption: "",
          title: "",
          excerpt: "",
          slides: [],
        },
      ),
    }));
  };

  const toggleMode = (item: ReviewItem, mode: ExpandedMode) => {
    if (item.status !== "pending") {
      return;
    }

    ensureDraft(item);
    setMutationError(null);
    setExpandedModes((current) => ({
      ...current,
      [item.item_id]: current[item.item_id] === mode ? "none" : mode,
    }));
  };

  const submitApprove = async (item: ReviewItem) => {
    setMutationError(null);
    setSubmittingItemId(item.item_id);

    try {
      const result = await postReviewAction(token, {
        item_id: item.item_id,
        action: "approve",
      });

      patchItem(item.item_id, {
        status: result.data.status,
      });
      setExpandedModes((current) => ({ ...current, [item.item_id]: "none" }));
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Falha ao aprovar o conteúdo.");
    } finally {
      setSubmittingItemId(null);
    }
  };

  const submitReject = async (item: ReviewItem) => {
    setMutationError(null);
    setSubmittingItemId(item.item_id);

    const comment = drafts[item.item_id]?.comment?.trim() ?? "";

    try {
      const result = await postReviewAction(token, {
        item_id: item.item_id,
        action: "reject",
        comment,
      });

      patchItem(item.item_id, {
        status: result.data.status,
        reviewer_comment: result.data.reviewer_comment ?? (comment || null),
      });
      setExpandedModes((current) => ({ ...current, [item.item_id]: "none" }));
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Falha ao registrar a rejeição.");
    } finally {
      setSubmittingItemId(null);
    }
  };

  const submitEditSuggestion = async (item: ReviewItem) => {
    setMutationError(null);
    setSubmittingItemId(item.item_id);

    const draft = drafts[item.item_id] ?? createDefaultDraft(item);
    const copyEdits =
      item.content_type === "blog_post"
        ? {
            title: draft.title.trim(),
            excerpt: draft.excerpt.trim(),
          }
        : {
            caption: draft.caption.trim(),
            slides: draft.slides.map((slide) => ({
              index: slide.index,
              headline: slide.headline.trim(),
              body: slide.body.trim(),
            })),
          };

    try {
      const result = await postReviewAction(token, {
        item_id: item.item_id,
        action: "edit_suggest",
        copy_edits: copyEdits,
      });

      patchItem(item.item_id, {
        status: result.data.status,
        copy_edits: copyEdits,
      });
      setExpandedModes((current) => ({ ...current, [item.item_id]: "none" }));
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Falha ao enviar a sugestão de cópia.");
    } finally {
      setSubmittingItemId(null);
    }
  };

  const queryError = reviewQuery.error instanceof ReviewRequestError ? reviewQuery.error : null;
  const isTokenFailure = queryError?.status === 404 || queryError?.status === 410;

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F3F7FB]">
        <ErrorShell title="Link inválido." message="Este link de revisão não é válido." />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#F4F8FC_0%,#EEF3F8_55%,#F7F9FC_100%)] text-slate-900">
      <header className="relative overflow-hidden bg-[#004F8F] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(26,122,62,0.25),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex rounded-2xl border border-white/20 bg-white/10 px-4 py-2 shadow-[0_12px_30px_rgba(2,6,23,0.15)] backdrop-blur-sm">
                <img
                  src={logo}
                  alt="Lifetrek Medical"
                  className="h-10 w-auto sm:h-12"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-transparent bg-white/12 px-3 py-1 text-white hover:bg-white/12">
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  Revisão externa
                </Badge>
                {reviewData ? (
                  <Badge className="border-transparent bg-white/12 px-3 py-1 text-white hover:bg-white/12">
                    <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                    Expira em {formatExpiry(reviewData.expires_at)}
                  </Badge>
                ) : null}
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                {reviewData ? `Olá, ${reviewData.reviewer_name}.` : "Revisão de conteúdo Lifetrek"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                Revise os conteúdos deste lote, aprove com um clique ou envie observações para que a equipe ajuste a cópia antes da publicação.
              </p>
            </div>

            <div className="w-full max-w-sm rounded-[24px] border border-white/15 bg-white/10 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.16)] backdrop-blur-sm">
              {reviewData ? (
                <>
                  <div className="flex items-center justify-between gap-3 text-sm text-white/80">
                    <span>Progresso</span>
                    <span className="font-semibold text-white">{reviewedCount} de {items.length}</span>
                  </div>
                  <Progress
                    value={progressValue}
                    className="mt-3 h-2.5 bg-white/20 [&>div]:bg-[#7FD49B]"
                  />
                  <p className="mt-3 text-sm text-white/85">
                    {items.length > 0
                      ? `${reviewedCount} de ${items.length} posts revisados`
                      : "Nenhum item disponível neste lote"}
                  </p>
                  {reviewedCount === items.length && items.length > 0 ? (
                    <div className="mt-4 rounded-2xl bg-white/12 px-4 py-3 text-sm text-white">
                      <div className="flex items-center gap-2 font-semibold">
                        <Sparkles className="h-4 w-4" />
                        Revisão completa! Obrigado, {reviewData.reviewer_name}.
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex min-h-[112px] items-center justify-center">
                  {reviewQuery.isLoading ? <LoadingSpinner /> : <span className="text-sm text-white/80">Preparando lote...</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {reviewQuery.isLoading ? (
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/70 bg-white/95 px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <LoadingSpinner />
            <p className="text-sm text-slate-600">Carregando seu lote de revisão...</p>
          </div>
        </div>
      ) : null}

      {!reviewQuery.isLoading && isTokenFailure ? (
        <ErrorShell
          title={queryError?.status === 410 ? "Este link expirou." : "Link inválido."}
          message={queryError?.message ?? "Não foi possível abrir este lote de revisão."}
        />
      ) : null}

      {!reviewQuery.isLoading && !isTokenFailure ? (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {queryError ? (
            <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-[#F5C2C7] bg-[#FFF5F5] p-5 text-[#8A1C2C] shadow-[0_16px_40px_rgba(239,68,68,0.08)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Não foi possível carregar a revisão.</p>
                <p className="mt-1 text-sm opacity-90">{queryError.message}</p>
              </div>
              <Button variant="outline" className="border-[#D97787] bg-white text-[#8A1C2C] hover:bg-white/90" onClick={() => reviewQuery.refetch()}>
                <RefreshCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {mutationError ? (
            <div className="mb-6 rounded-[22px] border border-[#FDE68A] bg-[#FFFBEB] px-5 py-4 text-sm text-[#92400E] shadow-[0_14px_30px_rgba(245,158,11,0.1)]">
              <div className="flex items-start gap-3">
                <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{mutationError}</p>
              </div>
            </div>
          ) : null}

          {reviewData?.notes ? (
            <div className="mb-6 rounded-[26px] border border-[#DCE6F5] bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#004F8F]">Observações do lote</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{reviewData.notes}</p>
            </div>
          ) : null}

          {reviewData && items.length === 0 ? (
            <div className="rounded-[28px] border border-white/70 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECFDF3] text-[#166534]">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Nenhum conteúdo disponível para revisão neste lote.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Se você esperava ver itens aqui, peça a Rafael para gerar um novo envio de revisão.
              </p>
            </div>
          ) : null}

          <div className="space-y-5">
            {items.map((item) => {
              const typeMeta = contentTypeMeta[item.content_type];
              const itemStatusMeta = statusMeta[item.status];
              const StatusIcon = itemStatusMeta.icon;
              const isTarget = targetItemId === item.item_id;
              const isSubmitting = submittingItemId === item.item_id;
              const expandedMode = expandedModes[item.item_id] ?? "none";
              const draft = drafts[item.item_id] ?? createDefaultDraft(item);

              return (
                <section
                  key={item.item_id}
                  ref={(node) => {
                    cardRefs.current[item.item_id] = node;
                  }}
                  className={cn(
                    "overflow-hidden rounded-[30px] border bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all sm:p-6",
                    isTarget
                      ? "border-[#F07818] ring-2 ring-[#F07818]/30 ring-offset-4 ring-offset-[#F4F8FC]"
                      : "border-white/70",
                  )}
                >
                  <div className="flex flex-col gap-5 lg:flex-row">
                    <div className="w-full shrink-0 lg:w-[170px]">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="h-44 w-full rounded-[22px] object-cover lg:h-[170px] lg:w-[170px]"
                        />
                      ) : (
                        <div className="flex h-44 w-full items-center justify-center rounded-[22px] bg-[#EEF4FA] text-[#5B6B81] lg:h-[170px] lg:w-[170px]">
                          <div className="text-center">
                            <ImageIcon className="mx-auto h-8 w-8" />
                            <p className="mt-3 text-sm font-medium">Sem thumbnail</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn("px-3 py-1", typeMeta.className)}>{typeMeta.label}</Badge>
                        <Badge className={cn("px-3 py-1", itemStatusMeta.className)}>
                          <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                          {itemStatusMeta.label}
                        </Badge>
                        {item.status !== "pending" ? (
                          <Badge variant="outline" className="border-slate-300 px-3 py-1 text-slate-600">
                            <Lock className="mr-1.5 h-3.5 w-3.5" />
                            Já revisado
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <h2 className="break-words text-2xl font-semibold tracking-tight text-slate-900">
                          {item.title}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                          ID do conteúdo: <span className="font-medium text-slate-700">{item.content_id}</span>
                        </p>
                      </div>

                      <div className="mt-5 rounded-[22px] bg-[#F6F9FC] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#004F8F]">
                          {item.content_type === "blog_post" ? "Resumo atual" : "Legenda atual"}
                        </p>
                        <p className="mt-3 break-words text-sm italic leading-6 text-slate-700">
                          {item.caption || "Sem texto complementar cadastrado."}
                        </p>
                      </div>

                      {item.slides.length > 0 ? (
                        <div className="mt-5 rounded-[24px] border border-[#E3ECF6] bg-[#FBFCFE] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Estrutura dos slides
                          </p>
                          <div className="mt-4 space-y-3">
                            {item.slides.map((slide) => (
                              <div key={`${item.item_id}-${slide.index}`} className="rounded-2xl border border-[#EAF0F7] bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#004F8F]">
                                  Slide {slide.index + 1}
                                </p>
                                <p className="mt-2 break-words text-sm font-semibold text-slate-900">
                                  {slide.headline || "Sem headline"}
                                </p>
                                <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                                  {slide.body || "Sem corpo cadastrado."}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {item.content && item.content_type === "blog_post" ? (
                        <div className="mt-5 rounded-[24px] border border-[#E3ECF6] bg-[#FBFCFE] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Conteúdo do Artigo
                          </p>
                          <div
                            className="prose prose-sm prose-slate mt-4 max-w-none break-words"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                          />
                        </div>
                      ) : null}

                      {item.status === "edit_suggested" && item.copy_edits ? (
                        <div className="mt-5 rounded-[22px] border border-[#FED7AA] bg-[#FFF7ED] p-4 text-sm text-[#9A3412]">
                          Sugestão de cópia registrada com sucesso.
                        </div>
                      ) : null}

                      {item.status === "rejected" && item.reviewer_comment ? (
                        <div className="mt-5 rounded-[22px] border border-[#FECACA] bg-[#FEF2F2] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B91C1C]">
                            Comentário enviado
                          </p>
                          <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                            {item.reviewer_comment}
                          </p>
                        </div>
                      ) : null}

                      {item.status === "pending" ? (
                        <>
                          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Button
                              className="sm:flex-1"
                              disabled={isSubmitting}
                              onClick={() => submitApprove(item)}
                            >
                              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              Aprovar
                            </Button>
                            <Button
                              variant="destructive"
                              className="sm:flex-1"
                              disabled={isSubmitting}
                              onClick={() => toggleMode(item, "reject")}
                            >
                              <X className="h-4 w-4" />
                              Rejeitar
                            </Button>
                            <Button
                              variant="outline"
                              className="sm:flex-1"
                              disabled={isSubmitting}
                              onClick={() => toggleMode(item, "edit")}
                            >
                              <PencilLine className="h-4 w-4" />
                              Editar cópia
                            </Button>
                          </div>

                          {expandedMode === "reject" ? (
                            <div className="mt-5 rounded-[24px] border border-[#FECACA] bg-[#FFF7F7] p-4">
                              <p className="text-sm font-semibold text-slate-900">Explique a rejeição</p>
                              <p className="mt-1 text-sm text-slate-600">
                                O comentário é opcional, mas ajuda a equipe a entender o ajuste necessário.
                              </p>
                              <Textarea
                                className="mt-4 min-h-[120px] bg-white text-sm"
                                placeholder="Ex.: O posicionamento técnico está correto, mas a legenda precisa ficar mais objetiva."
                                value={draft.comment}
                                onChange={(event) =>
                                  updateDraft(item.item_id, (current) => ({
                                    ...current,
                                    comment: event.target.value,
                                  }))
                                }
                              />
                              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <Button
                                  variant="destructive"
                                  className="sm:flex-1"
                                  disabled={isSubmitting}
                                  onClick={() => submitReject(item)}
                                >
                                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                  Enviar rejeição
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="sm:flex-1"
                                  disabled={isSubmitting}
                                  onClick={() => setExpandedModes((current) => ({ ...current, [item.item_id]: "none" }))}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : null}

                          {expandedMode === "edit" ? (
                            <div className="mt-5 rounded-[24px] border border-[#DCE6F5] bg-[#F8FBFF] p-4">
                              <p className="text-sm font-semibold text-slate-900">Sugestão de cópia</p>
                              <p className="mt-1 text-sm text-slate-600">
                                Envie a versão sugerida. O item será travado como revisado depois do envio.
                              </p>

                              {item.content_type === "blog_post" ? (
                                <div className="mt-4 space-y-4">
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                      Título sugerido
                                    </label>
                                    <Input
                                      value={draft.title}
                                      onChange={(event) =>
                                        updateDraft(item.item_id, (current) => ({
                                          ...current,
                                          title: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                      Resumo sugerido
                                    </label>
                                    <Textarea
                                      className="min-h-[120px] bg-white text-sm"
                                      value={draft.excerpt}
                                      onChange={(event) =>
                                        updateDraft(item.item_id, (current) => ({
                                          ...current,
                                          excerpt: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 space-y-4">
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                      Legenda sugerida
                                    </label>
                                    <Textarea
                                      className="min-h-[120px] bg-white text-sm"
                                      value={draft.caption}
                                      onChange={(event) =>
                                        updateDraft(item.item_id, (current) => ({
                                          ...current,
                                          caption: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>

                                  <div className="space-y-3">
                                    {draft.slides.map((slide, slideIndex) => (
                                      <div key={`${item.item_id}-draft-${slide.index}`} className="rounded-[22px] border border-[#E3ECF6] bg-white p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#004F8F]">
                                          Slide {slideIndex + 1}
                                        </p>
                                        <div className="mt-3 space-y-3">
                                          <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                              Headline
                                            </label>
                                            <Input
                                              value={slide.headline}
                                              onChange={(event) =>
                                                updateDraft(item.item_id, (current) => ({
                                                  ...current,
                                                  slides: current.slides.map((currentSlide) =>
                                                    currentSlide.index === slide.index
                                                      ? { ...currentSlide, headline: event.target.value }
                                                      : currentSlide,
                                                  ),
                                                }))
                                              }
                                            />
                                          </div>
                                          <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                              Corpo
                                            </label>
                                            <Textarea
                                              className="min-h-[96px] bg-white text-sm"
                                              value={slide.body}
                                              onChange={(event) =>
                                                updateDraft(item.item_id, (current) => ({
                                                  ...current,
                                                  slides: current.slides.map((currentSlide) =>
                                                    currentSlide.index === slide.index
                                                      ? { ...currentSlide, body: event.target.value }
                                                      : currentSlide,
                                                  ),
                                                }))
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <Button
                                  className="sm:flex-1"
                                  disabled={isSubmitting}
                                  onClick={() => submitEditSuggestion(item)}
                                >
                                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
                                  Enviar sugestão
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="sm:flex-1"
                                  disabled={isSubmitting}
                                  onClick={() => setExpandedModes((current) => ({ ...current, [item.item_id]: "none" }))}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      ) : null}
    </div>
  );
}

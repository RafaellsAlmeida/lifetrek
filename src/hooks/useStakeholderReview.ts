import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { showActionableError } from "@/lib/showActionableError";

export type StakeholderContentType = "linkedin_carousel" | "instagram_post" | "blog_post";
export type StakeholderQueueStatus =
  | "stakeholder_review_pending"
  | "stakeholder_approved"
  | "stakeholder_rejected";
export type StakeholderReviewState = "pending" | "approved" | "rejected" | "edit_suggested";
export type StakeholderUiContentType = "linkedin" | "instagram" | "blog";

export interface StakeholderReviewItem {
  id: string;
  batch_id: string;
  content_type: StakeholderContentType;
  content_id: string;
  status: StakeholderReviewState;
  reviewed_by_email: string | null;
  reviewer_comment: string | null;
  copy_edits: Record<string, unknown> | null;
  reviewed_at: string | null;
  created_at: string | null;
}

export interface StakeholderCardItem {
  id: string;
  type: StakeholderUiContentType;
  title: string;
  content_preview: string;
  status: string;
  created_at: string;
  approved_at?: string | null;
  ai_generated?: boolean;
  full_data: Record<string, unknown>;
  stakeholderReviewItem?: StakeholderReviewItem | null;
}

const approvalQueryKeys = [
  ["content_approval_items"],
  ["content-approval-items"],
  ["approved_content_items"],
  ["rejected_content_items"],
  ["linkedin_carousels"],
  ["linkedin_carousel_full"],
  ["instagram_posts"],
  ["instagram_post"],
  ["blog-posts"],
  ["blog-post"],
  ["resources"],
  ["stakeholder-review-items"],
  ["stakeholder-review-status-items"],
  ["stakeholder-review-suggestion-items"],
] as const;

function invalidateApprovalQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all(
    approvalQueryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] })),
  );
}

export function stakeholderContentTypeFromUiType(
  type: StakeholderUiContentType | "resource" | null | undefined,
): StakeholderContentType | null {
  if (type === "linkedin") return "linkedin_carousel";
  if (type === "instagram") return "instagram_post";
  if (type === "blog") return "blog_post";
  return null;
}

function uiTypeFromStakeholderContentType(type: StakeholderContentType): StakeholderUiContentType {
  if (type === "linkedin_carousel") return "linkedin";
  if (type === "instagram_post") return "instagram";
  return "blog";
}

function contentTableFromType(type: StakeholderContentType): "linkedin_carousels" | "instagram_posts" | "blog_posts" {
  if (type === "linkedin_carousel") return "linkedin_carousels";
  if (type === "instagram_post") return "instagram_posts";
  return "blog_posts";
}

function normalizeSocialSlides(rawSlides: unknown): Record<string, unknown>[] {
  if (Array.isArray(rawSlides)) {
    return rawSlides.filter((slide) => slide && typeof slide === "object") as Record<string, unknown>[];
  }

  if (
    rawSlides &&
    typeof rawSlides === "object" &&
    Array.isArray((rawSlides as { slides?: unknown[] }).slides)
  ) {
    return ((rawSlides as { slides: unknown[] }).slides).filter(
      (slide) => slide && typeof slide === "object",
    ) as Record<string, unknown>[];
  }

  return [];
}

function mergeSuggestedSlides(
  currentSlides: Record<string, unknown>[],
  suggestedSlides: unknown,
): Record<string, unknown>[] {
  const normalizedSuggestions = Array.isArray(suggestedSlides)
    ? suggestedSlides.filter((slide) => slide && typeof slide === "object")
    : [];

  if (normalizedSuggestions.length === 0) {
    return currentSlides;
  }

  return currentSlides.map((slide, index) => {
    const match = normalizedSuggestions.find((candidate) => {
      const record = candidate as Record<string, unknown>;
      const candidateIndex = typeof record.index === "number" ? record.index : Number(record.index);
      return Number.isFinite(candidateIndex) ? candidateIndex === index : false;
    }) as Record<string, unknown> | undefined;

    if (!match) {
      return slide;
    }

    return {
      ...slide,
      headline: typeof match.headline === "string" ? match.headline : slide.headline,
      body: typeof match.body === "string" ? match.body : slide.body,
      copy: typeof match.body === "string" ? match.body : slide.copy,
    };
  });
}

function buildStakeholderCardItem(
  type: StakeholderContentType,
  row: Record<string, unknown>,
  stakeholderReviewItem?: StakeholderReviewItem | null,
): StakeholderCardItem {
  const resolvedStatus =
    stakeholderReviewItem?.status === "edit_suggested"
      ? stakeholderReviewItem.status
      : String(row.status ?? stakeholderReviewItem?.status ?? "");

  if (type === "linkedin_carousel") {
    const slides = normalizeSocialSlides(row.slides);
    return {
      id: String(row.id),
      type: "linkedin",
      title: String(row.topic ?? "Post LinkedIn"),
      content_preview:
        String(slides[0]?.headline ?? "") || String(row.caption ?? "").slice(0, 120),
      status: resolvedStatus,
      created_at: String(row.created_at ?? new Date().toISOString()),
      approved_at: typeof row.approved_at === "string" ? row.approved_at : null,
      ai_generated: true,
      full_data: row,
      stakeholderReviewItem,
    };
  }

  if (type === "instagram_post") {
    return {
      id: String(row.id),
      type: "instagram",
      title: String(row.topic ?? "Post Instagram"),
      content_preview: String(row.caption ?? "").slice(0, 120),
      status: resolvedStatus,
      created_at: String(row.created_at ?? new Date().toISOString()),
      approved_at: typeof row.approved_at === "string" ? row.approved_at : null,
      ai_generated: true,
      full_data: row,
      stakeholderReviewItem,
    };
  }

  return {
    id: String(row.id),
    type: "blog",
    title: String(row.title ?? "Blog Post"),
    content_preview: String(row.excerpt ?? row.content ?? "").slice(0, 160),
    status: resolvedStatus,
    created_at: String(row.created_at ?? new Date().toISOString()),
    approved_at: typeof row.approved_at === "string" ? row.approved_at : null,
    ai_generated: Boolean(row.ai_generated),
    full_data: row,
    stakeholderReviewItem,
  };
}

export function useStakeholderReviewItems(
  contentType: StakeholderContentType | null | undefined,
  contentId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["stakeholder-review-items", contentType, contentId],
    enabled: Boolean(contentType && contentId),
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("stakeholder_review_items" as any)
        .select("id, batch_id, content_type, content_id, status, reviewed_by_email, reviewer_comment, copy_edits, reviewed_at, created_at")
        .eq("content_type", contentType!)
        .eq("content_id", contentId!)
        .order("reviewed_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }) as any);

      if (error) throw error;
      return (data ?? []) as StakeholderReviewItem[];
    },
  });
}

export function useStakeholderStatusItems(status: StakeholderQueueStatus) {
  return useQuery({
    queryKey: ["stakeholder-review-status-items", status],
    queryFn: async () => {
      const [linkedInResult, instagramResult, blogResult] = await Promise.all([
        supabase
          .from("linkedin_carousels")
          .select("id, topic, status, created_at, target_audience, caption, slides, generation_metadata, image_urls, approved_at")
          .eq("status", status)
          .order("created_at", { ascending: false }),
        (supabase
          .from("instagram_posts" as any)
          .select("id, topic, status, created_at, caption, image_urls, hashtags, approved_at")
          .eq("status", status)
          .order("created_at", { ascending: false }) as any),
        supabase
          .from("blog_posts")
          .select("id, title, excerpt, content, status, created_at, hero_image_url, featured_image, approved_at, ai_generated")
          .eq("status", status)
          .order("created_at", { ascending: false }),
      ]);

      if (linkedInResult.error) throw linkedInResult.error;
      if (instagramResult.error) throw instagramResult.error;
      if (blogResult.error) throw blogResult.error;

      const items = [
        ...(linkedInResult.data ?? []).map((row) => buildStakeholderCardItem("linkedin_carousel", row as Record<string, unknown>)),
        ...((instagramResult.data ?? []) as Record<string, unknown>[]).map((row) =>
          buildStakeholderCardItem("instagram_post", row),
        ),
        ...(blogResult.data ?? []).map((row) => buildStakeholderCardItem("blog_post", row as Record<string, unknown>)),
      ];

      return items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    },
  });
}

export function useStakeholderSuggestionItems() {
  return useQuery({
    queryKey: ["stakeholder-review-suggestion-items"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("stakeholder_review_items" as any)
        .select("id, batch_id, content_type, content_id, status, reviewed_by_email, reviewer_comment, copy_edits, reviewed_at, created_at")
        .eq("status", "edit_suggested")
        .not("copy_edits", "is", null)
        .order("reviewed_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }) as any);

      if (error) throw error;

      const latestByContent = new Map<string, StakeholderReviewItem>();
      for (const item of (data ?? []) as StakeholderReviewItem[]) {
        const key = `${item.content_type}:${item.content_id}`;
        if (!latestByContent.has(key)) {
          latestByContent.set(key, item);
        }
      }

      const groupedIds = {
        linkedin_carousel: [] as string[],
        instagram_post: [] as string[],
        blog_post: [] as string[],
      };

      for (const item of latestByContent.values()) {
        groupedIds[item.content_type].push(item.content_id);
      }

      const [linkedInResult, instagramResult, blogResult] = await Promise.all([
        groupedIds.linkedin_carousel.length
          ? supabase
              .from("linkedin_carousels")
              .select("id, topic, status, created_at, target_audience, caption, slides, generation_metadata, image_urls, approved_at")
              .in("id", groupedIds.linkedin_carousel)
          : Promise.resolve({ data: [], error: null }),
        groupedIds.instagram_post.length
          ? ((supabase
              .from("instagram_posts" as any)
              .select("id, topic, status, created_at, caption, image_urls, hashtags, approved_at, slides")
              .in("id", groupedIds.instagram_post) as any) as Promise<{ data: Record<string, unknown>[]; error: any }>)
          : Promise.resolve({ data: [], error: null }),
        groupedIds.blog_post.length
          ? supabase
              .from("blog_posts")
              .select("id, title, excerpt, content, status, created_at, hero_image_url, featured_image, approved_at, ai_generated")
              .in("id", groupedIds.blog_post)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (linkedInResult.error) throw linkedInResult.error;
      if (instagramResult.error) throw instagramResult.error;
      if (blogResult.error) throw blogResult.error;

      const rowsByKey = new Map<string, Record<string, unknown>>();
      for (const row of (linkedInResult.data ?? []) as Record<string, unknown>[]) {
        rowsByKey.set(`linkedin_carousel:${String(row.id)}`, row);
      }
      for (const row of (instagramResult.data ?? []) as Record<string, unknown>[]) {
        rowsByKey.set(`instagram_post:${String(row.id)}`, row);
      }
      for (const row of (blogResult.data ?? []) as Record<string, unknown>[]) {
        rowsByKey.set(`blog_post:${String(row.id)}`, row);
      }

      return Array.from(latestByContent.values())
        .map((reviewItem) => {
          const row = rowsByKey.get(`${reviewItem.content_type}:${reviewItem.content_id}`);
          if (!row) {
            return null;
          }

          return buildStakeholderCardItem(reviewItem.content_type, row, reviewItem);
        })
        .filter((item): item is StakeholderCardItem => item !== null)
        .sort((a, b) => {
          const aReviewedAt = a.stakeholderReviewItem?.reviewed_at ?? a.created_at;
          const bReviewedAt = b.stakeholderReviewItem?.reviewed_at ?? b.created_at;
          return new Date(bReviewedAt).getTime() - new Date(aReviewedAt).getTime();
        });
    },
  });
}

export function useApplyCopyEditSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewItem: StakeholderReviewItem) => {
      const copyEdits = reviewItem.copy_edits;
      if (!copyEdits || typeof copyEdits !== "object" || Array.isArray(copyEdits)) {
        throw new Error("Nenhuma sugestão disponível para aplicar.");
      }

      const tableName = contentTableFromType(reviewItem.content_type);

      if (reviewItem.content_type === "blog_post") {
        const { data: currentContent, error: currentContentError } = await supabase
          .from("blog_posts")
          .select("id, title, excerpt")
          .eq("id", reviewItem.content_id)
          .single();

        if (currentContentError) throw currentContentError;

        const updates = {
          title:
            typeof copyEdits.title === "string" && copyEdits.title.trim().length > 0
              ? copyEdits.title.trim()
              : currentContent.title,
          excerpt:
            typeof copyEdits.excerpt === "string" && copyEdits.excerpt.trim().length > 0
              ? copyEdits.excerpt.trim()
              : currentContent.excerpt,
        };

        const { data: updatedContent, error: updateError } = await supabase
          .from("blog_posts")
          .update(updates)
          .eq("id", reviewItem.content_id)
          .select("*")
          .single();

        if (updateError) throw updateError;

        const { error: reviewItemError } = await (supabase
          .from("stakeholder_review_items" as any)
          .update({ copy_edits: null })
          .eq("id", reviewItem.id) as any);

        if (reviewItemError) throw reviewItemError;

        return updatedContent;
      }

      const { data: currentContent, error: currentContentError } = await (supabase
        .from(tableName as any)
        .select("id, caption, slides")
        .eq("id", reviewItem.content_id)
        .single() as any);

      if (currentContentError) throw currentContentError;

      const nextSlides = mergeSuggestedSlides(
        normalizeSocialSlides(currentContent.slides),
        copyEdits.slides,
      );
      const nextCaption =
        typeof copyEdits.caption === "string" && copyEdits.caption.trim().length > 0
          ? copyEdits.caption.trim()
          : currentContent.caption;

      const { data: updatedContent, error: updateError } = await (supabase
        .from(tableName as any)
        .update({
          caption: nextCaption,
          slides: nextSlides,
        })
        .eq("id", reviewItem.content_id)
        .select("*")
        .single() as any);

      if (updateError) throw updateError;

      const { error: reviewItemError } = await (supabase
        .from("stakeholder_review_items" as any)
        .update({ copy_edits: null })
        .eq("id", reviewItem.id) as any);

      if (reviewItemError) throw reviewItemError;

      return updatedContent;
    },
    onSuccess: async () => {
      await invalidateApprovalQueries(queryClient);
      toast.success("Sugestão aplicada com sucesso.");
    },
    onError: (error) => {
      showActionableError(error, "aplicação de sugestão de cópia");
    },
  });
}

export function useDismissCopyEditSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewItemId: string) => {
      const { error } = await (supabase
        .from("stakeholder_review_items" as any)
        .update({ copy_edits: null })
        .eq("id", reviewItemId) as any);

      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidateApprovalQueries(queryClient);
      toast.success("Sugestão descartada.");
    },
    onError: (error) => {
      showActionableError(error, "descarte de sugestão de cópia");
    },
  });
}

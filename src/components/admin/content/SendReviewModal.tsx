import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ReviewableContentItem = {
  id: string;
  type: "linkedin" | "instagram" | "blog";
  title: string;
  full_data?: Record<string, unknown>;
};

interface SendReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posts: ReviewableContentItem[];
  onSent?: () => Promise<void> | void;
}

function contentTypeToFunctionType(type: ReviewableContentItem["type"]) {
  if (type === "linkedin") return "linkedin_carousel";
  if (type === "instagram") return "instagram_post";
  return "blog_post";
}

function getPostBadgeClass(type: ReviewableContentItem["type"]) {
  if (type === "linkedin") return "border-transparent bg-[#EAF2FB] text-[#004F8F]";
  if (type === "instagram") return "border-transparent bg-[#FFF1F2] text-[#BE185D]";
  return "border-transparent bg-[#ECFDF3] text-[#166534]";
}

function getPostBadgeLabel(type: ReviewableContentItem["type"]) {
  if (type === "linkedin") return "LinkedIn";
  if (type === "instagram") return "Instagram";
  return "Blog";
}

function getThumbnail(item: ReviewableContentItem) {
  const fullData = item.full_data ?? {};
  if (Array.isArray(fullData.image_urls)) {
    const firstImage = fullData.image_urls.find(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
    if (typeof firstImage === "string") {
      return firstImage;
    }
  }

  if (Array.isArray(fullData.slides)) {
    const firstSlide = fullData.slides.find((slide) => slide && typeof slide === "object") as
      | Record<string, unknown>
      | undefined;
    if (typeof firstSlide?.image_url === "string" && firstSlide.image_url.trim().length > 0) {
      return firstSlide.image_url;
    }
    if (typeof firstSlide?.imageUrl === "string" && firstSlide.imageUrl.trim().length > 0) {
      return firstSlide.imageUrl;
    }
  }

  if (typeof fullData.hero_image_url === "string" && fullData.hero_image_url.trim().length > 0) {
    return fullData.hero_image_url;
  }

  if (typeof fullData.featured_image === "string" && fullData.featured_image.trim().length > 0) {
    return fullData.featured_image;
  }

  return null;
}

export function SendReviewModal({
  open,
  onOpenChange,
  posts,
  onSent,
}: SendReviewModalProps) {
  const [notes, setNotes] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewRecipients, setPreviewRecipients] = useState<string[]>([]);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErrorMessage(null);
      setNotes("");
    } else {
      setPreviewError(null);
      setPreviewRecipients([]);
      setPreviewSubject(null);
    }
  }, [open]);

  const postRefs = useMemo(
    () =>
      posts.map((post) => ({
        content_type: contentTypeToFunctionType(post.type),
        content_id: post.id,
      })),
    [posts],
  );
  const postRefsKey = useMemo(() => JSON.stringify(postRefs), [postRefs]);

  useEffect(() => {
    if (!open || posts.length === 0) {
      setIsPreviewLoading(false);
      setPreviewError(null);
      setPreviewRecipients([]);
      setPreviewSubject(null);
      return;
    }

    let cancelled = false;

    async function loadEmailPreview() {
      setIsPreviewLoading(true);
      setPreviewError(null);
      const previewPostRefs = JSON.parse(postRefsKey);

      const { data, error } = await supabase.functions.invoke("send-stakeholder-review", {
        body: {
          post_refs: previewPostRefs,
          dry_run: true,
        },
      });

      if (cancelled) return;

      setIsPreviewLoading(false);

      if (error) {
        setPreviewRecipients([]);
        setPreviewSubject(null);
        setPreviewError(error.message || "Não foi possível validar o email antes do envio.");
        return;
      }

      const previewData = data?.data ?? {};
      const recipients = Array.isArray(previewData.sent_to)
        ? previewData.sent_to.filter((email: unknown): email is string => typeof email === "string" && email.trim().length > 0)
        : [];

      setPreviewRecipients(recipients);
      setPreviewSubject(typeof previewData.subject === "string" ? previewData.subject : null);
    }

    void loadEmailPreview();

    return () => {
      cancelled = true;
    };
  }, [open, posts.length, postRefsKey]);

  const handleConfirm = async () => {
    if (posts.length === 0) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    const { data, error } = await supabase.functions.invoke("send-stakeholder-review", {
      body: {
        post_refs: postRefs,
        notes: notes.trim() ? notes.trim() : undefined,
      },
    });

    setIsSending(false);

    if (error) {
      setErrorMessage(error.message || "Falha ao enviar o lote para aprovação.");
      return;
    }

    const sendResults = Array.isArray(data?.data?.send_results) ? data.data.send_results : [];
    const sendFailures = sendResults.filter(
      (result: { error?: string }) => typeof result.error === "string" && result.error.trim().length > 0,
    );

    if (sendFailures.length > 0) {
      setErrorMessage("Houve falha no envio para um ou mais revisores. Nenhum status foi consolidado.");
      return;
    }

    const sentTo = Array.isArray(data?.data?.sent_to)
      ? data.data.sent_to.filter((email: unknown): email is string => typeof email === "string")
      : previewRecipients;
    const reviewerCount = sentTo.length || sendResults.length || previewRecipients.length;
    toast.success(`Email enviado com sucesso para ${reviewerCount} ${reviewerCount === 1 ? "revisor" : "revisores"}.`);
    onOpenChange(false);
    await onSent?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar para Aprovação</DialogTitle>
          <DialogDescription>
            Enviar {posts.length} {posts.length === 1 ? "post" : "posts"} para revisão externa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Enviar {posts.length} {posts.length === 1 ? "post" : "posts"} para:
            </div>
            <div className="mt-3 space-y-2">
              {isPreviewLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Validando revisores configurados...</span>
                </div>
              ) : previewRecipients.length > 0 ? (
                previewRecipients.map((email) => (
                  <div key={email} className="flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{email}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Revisores configurados no servidor</span>
                </div>
              )}
              {previewSubject ? (
                <div className="rounded-lg border border-primary/10 bg-white/70 px-3 py-2 text-xs leading-5 text-slate-600">
                  <span className="font-semibold text-slate-800">Assunto:</span> {previewSubject}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Send className="h-4 w-4 text-primary" />
              Conteúdos selecionados
            </div>
            <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
              {posts.map((post) => {
                const thumbnail = getThumbnail(post);
                return (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-3 py-3"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn("px-2.5 py-0.5 text-[10px]", getPostBadgeClass(post.type))}>
                          {getPostBadgeLabel(post.type)}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-900">{post.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MessageSquareText className="h-4 w-4 text-primary" />
              Adicionar nota para os revisores (opcional)
            </div>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-[120px]"
              placeholder="Contexto adicional, observações de prioridade ou instruções específicas para o lote."
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
          {previewError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {previewError}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="gap-2 bg-[#004F8F] hover:bg-[#003c6d]"
            disabled={isSending || isPreviewLoading || !!previewError || posts.length === 0}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Confirmar envio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Save,
  Download,
  ArrowLeft,
  Sparkles,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Search,
  History,
} from "lucide-react";

const FILTER_TEMPLATES = {
  identity: { bg: "/assets/templates/identity_bg.png", textColor: "#ffffff" },
  capabilities: { bg: "/assets/templates/capabilities_bg.png", textColor: "#ffffff" },
  trust: { bg: "/assets/templates/trust_bg.png", textColor: "#ffffff" },
};

const URLImage = ({ src, x, y, width, height }: any) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} x={x} y={y} width={width} height={height} />;
};

interface ImageEditorCoreProps {
  postId?: string | null;
  postType?: "template" | "linkedin" | "instagram";
  slideIndex?: number;
  onBack?: () => void;
  embedded?: boolean;
}

type SlideIntent =
  | "company_trust"
  | "quality_machines_metrology"
  | "cleanroom_iso"
  | "vet_odonto_product"
  | "generic";

interface LibraryAsset {
  id: string;
  assetId?: string;
  url: string;
  name: string;
  category: string;
  type: "environment" | "product";
}

interface Suggestion extends LibraryAsset {
  score: number;
  reason: string;
  passThreshold: boolean;
}

const INTENT_THRESHOLDS: Record<SlideIntent, number> = {
  company_trust: 0.68,
  quality_machines_metrology: 0.66,
  cleanroom_iso: 0.64,
  vet_odonto_product: 0.62,
  generic: 0.7,
};

function normalizeText(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function dedupeUrls(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
    )
  );
}

function resolveSlideImageUrl(slide: Record<string, unknown> | null | undefined): string {
  if (!slide) return "";
  const direct = typeof slide.image_url === "string" ? slide.image_url : "";
  const legacy = typeof slide.imageUrl === "string" ? slide.imageUrl : "";
  return direct || legacy || "";
}

function classifyIntent(query: string): SlideIntent {
  const text = normalizeText(query);
  const has = (items: string[]) => items.some((k) => text.includes(k));

  if (has(["parceiro", "solucao completa", "solucao", "partnership", "trust", "quem somos"])) {
    return "company_trust";
  }
  if (has(["qualidade", "maquina", "maquinas", "metrologia", "zeiss", "cmm", "cnc", "usinagem"])) {
    return "quality_machines_metrology";
  }
  if (has(["sala limpa", "clean room", "cleanroom", "iso", "anvisa", "fda", "compliance"])) {
    return "cleanroom_iso";
  }
  if (has(["vet", "veterin", "odonto", "dental", "implante", "ortoped"])) {
    return "vet_odonto_product";
  }
  return "generic";
}

function mapPostToTable(postType: "template" | "linkedin" | "instagram") {
  if (postType === "linkedin") return "linkedin_carousels";
  if (postType === "instagram") return "instagram_posts";
  return "content_templates";
}

function toPublicUrl(rawPath?: string): string {
  if (!rawPath) return "";
  if (/^https?:\/\//i.test(rawPath)) return rawPath;

  const candidateBuckets = ["content_assets", "content-assets", "carousel-images", "processed-product-images", "product-images"];
  for (const bucket of candidateBuckets) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(rawPath);
    if (data?.publicUrl) return data.publicUrl;
  }
  return rawPath;
}

function scoreAsset(query: string, intent: SlideIntent, asset: LibraryAsset, neighborUrls: string[]) {
  const queryTokens = new Set(tokenize(query));
  const assetTokens = new Set(tokenize(`${asset.name} ${asset.category}`));

  let overlap = 0;
  queryTokens.forEach((t) => {
    if (assetTokens.has(t)) overlap += 1;
  });

  let lexical = Math.min(0.55, overlap * 0.08);

  if (intent === "company_trust" && ["facility", "asset", "template"].includes(asset.category)) lexical += 0.12;
  if (intent === "quality_machines_metrology" && ["equipment", "facility"].includes(asset.category)) lexical += 0.12;
  if (intent === "cleanroom_iso" && normalizeText(asset.name).includes("clean")) lexical += 0.2;
  if (intent === "vet_odonto_product" && asset.category === "product") lexical += 0.18;

  const q = normalizeText(query);
  const n = normalizeText(asset.name);

  let curated = 0;
  if (
    intent === "company_trust" &&
    (q.includes("parceiro") || q.includes("solucao")) &&
    ["exterior", "reception", "production-overview", "office"].some((h) => n.includes(h))
  ) {
    curated = 0.2;
  }

  if (
    intent === "quality_machines_metrology" &&
    ["qualidade", "maquina", "metrologia", "cmm", "zeiss"].some((h) => q.includes(h)) &&
    ["zeiss", "cmm", "production-floor", "water-treatment", "grinding", "laser"].some((h) => n.includes(h))
  ) {
    curated = Math.max(curated, 0.18);
  }

  if (
    intent === "cleanroom_iso" &&
    ["clean-room", "cleanroom", "iso 7", "iso"].some((h) => n.includes(h))
  ) {
    curated = Math.max(curated, 0.2);
  }

  const repetitionPenalty = neighborUrls.includes(asset.url) ? 0.08 : 0;
  const score = Math.max(0, Math.min(0.99, lexical + curated - repetitionPenalty));

  return {
    score,
    reason: `lexical=${lexical.toFixed(2)}, curated=${curated.toFixed(2)}, penalty=${repetitionPenalty.toFixed(2)}`,
  };
}

function buildSmartSuggestions(
  assets: LibraryAsset[],
  query: string,
  neighborUrls: string[],
): Suggestion[] {
  if (!assets.length) return [];

  const intent = classifyIntent(query);
  const threshold = INTENT_THRESHOLDS[intent];

  const byIntent = (() => {
    if (intent === "company_trust") {
      return assets.filter((a) => {
        const n = normalizeText(a.name);
        return (
          a.category === "facility" ||
          ["exterior", "reception", "production-overview", "office"].some((h) => n.includes(h))
        );
      });
    }
    if (intent === "quality_machines_metrology") {
      return assets.filter((a) => {
        const n = normalizeText(a.name);
        return (
          ["equipment", "facility"].includes(a.category) ||
          ["zeiss", "cmm", "production-floor", "water-treatment", "laser", "grinding"].some((h) => n.includes(h))
        );
      });
    }
    if (intent === "cleanroom_iso") {
      return assets.filter((a) => {
        const n = normalizeText(a.name);
        return n.includes("clean") || n.includes("iso") || a.category === "facility";
      });
    }
    if (intent === "vet_odonto_product") {
      const products = assets.filter((a) => a.category === "product");
      return products.length ? products : assets;
    }
    return assets;
  })();

  return byIntent
    .map((asset) => {
      const scored = scoreAsset(query, intent, asset, neighborUrls);
      return {
        ...asset,
        score: Number(scored.score.toFixed(4)),
        reason: `${intent} | ${scored.reason}`,
        passThreshold: scored.score >= threshold,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export function ImageEditorCore({ postId, postType = "template", slideIndex = 0, onBack, embedded = false }: ImageEditorCoreProps) {
  const stageRef = useRef<any>(null);

  const [post, setPost] = useState<any>(null);
  const [text, setText] = useState("Headline Goes Here");
  const [headlinePosition, setHeadlinePosition] = useState({ x: 100, y: 300 });
  const [canvasSize] = useState({ width: 1080, height: 1080 });
  const [bgUrl, setBgUrl] = useState("https://placehold.co/1080x1080/1a1a1a/FFF?text=Background");

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isApplyingBackground, setIsApplyingBackground] = useState(false);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState("suggestions");
  const [assetSearch, setAssetSearch] = useState("");
  const [assetCategoryFilter, setAssetCategoryFilter] = useState("all");
  const [showVersions, setShowVersions] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Suggestion | null>(null);

  useEffect(() => {
    if (postId) {
      void loadPost();
    }
  }, [postId, postType, slideIndex]);

  useEffect(() => {
    if (isLibraryOpen && libraryAssets.length === 0) {
      void loadAssetLibrary();
    }
  }, [isLibraryOpen]);

  const activeSlide = useMemo(() => {
    if (!post) return null;
    if (!Array.isArray(post.slides) || post.slides.length === 0) return null;
    return post.slides[slideIndex] || post.slides[0] || null;
  }, [post, slideIndex]);

  const activeVariants = useMemo(() => {
    const fromSlide = Array.isArray(activeSlide?.image_variants) ? activeSlide.image_variants : [];
    const current = activeSlide?.image_url || activeSlide?.imageUrl || bgUrl;
    return Array.from(new Set([...fromSlide, ...(current ? [current] : [])].filter(Boolean)));
  }, [activeSlide, bgUrl]);

  const suggestionQuery = useMemo(() => {
    const baseTopic = post?.topic || post?.title || "";
    const headline = activeSlide?.headline || text || "";
    const body = activeSlide?.body || activeSlide?.copy || activeSlide?.content || "";
    return `${baseTopic} ${headline} ${body}`.trim();
  }, [post, activeSlide, text]);

  const neighborSlideUrls = useMemo(() => {
    if (!Array.isArray(post?.slides)) return [];
    const prev = post.slides[slideIndex - 1];
    const next = post.slides[slideIndex + 1];
    const prevUrl = prev?.image_url || prev?.imageUrl;
    const nextUrl = next?.image_url || next?.imageUrl;
    return [prevUrl, nextUrl].filter(Boolean);
  }, [post, slideIndex]);

  const suggestions = useMemo(
    () => buildSmartSuggestions(libraryAssets, suggestionQuery, neighborSlideUrls as string[]),
    [libraryAssets, suggestionQuery, neighborSlideUrls],
  );

  const filteredLibraryAssets = useMemo(() => {
    return libraryAssets.filter((asset) => {
      const matchSearch =
        normalizeText(asset.name).includes(normalizeText(assetSearch)) ||
        normalizeText(asset.category).includes(normalizeText(assetSearch));
      const matchCategory = assetCategoryFilter === "all" || asset.category === assetCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [libraryAssets, assetSearch, assetCategoryFilter]);

  const loadAssetLibrary = async (): Promise<LibraryAsset[]> => {
    setIsLoadingAssets(true);
    try {
      const catalogResult = await supabase
        .from("product_catalog")
        .select("id, image_url, name, category")
        .not("image_url", "is", null)
        .order("created_at", { ascending: false });

      const nextAssets: LibraryAsset[] = [];

      if (!catalogResult.error) {
        nextAssets.push(
          ...((catalogResult.data || []) as any[]).map((row) => {
            const category = String(row.category || "asset").toLowerCase();
            return {
              id: `pc-${row.id}`,
              assetId: row.id,
              url: toPublicUrl(row.image_url),
              name: row.name || row.image_url?.split("/").pop() || "asset",
              category,
              type: category === "product" ? "product" : "environment",
            } as LibraryAsset;
          })
        );
      }

      const deduped = Array.from(new Map(nextAssets.map((a) => [a.url, a])).values());
      setLibraryAssets(deduped);
      return deduped;
    } catch (error: any) {
      console.error("[ImageEditor] Failed to load asset library", error);
      toast.error(`Falha ao carregar biblioteca: ${error.message}`);
      return [];
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const loadPost = async () => {
    if (!postId) return;

    const tableName = mapPostToTable(postType);
    const { data, error } = await supabase
      .from(tableName as any)
      .select("*")
      .eq("id", postId)
      .single();

    if (error) {
      toast.error(`Erro ao carregar post: ${error.message}`);
      return;
    }

    setPost(data);

    if (postType === "linkedin" || postType === "instagram") {
      const slides = Array.isArray(data.slides) ? data.slides : [];
      const slide = slides[slideIndex] || slides[0];

      if (slide) {
        setText(slide.headline || data.topic || data.title || "Post");
        const variants = Array.isArray(slide.image_variants) ? slide.image_variants : [];
        const preferredImage =
          variants[variants.length - 1] ||
          slide.imageUrl ||
          slide.image_url ||
          (Array.isArray(data.image_urls) ? data.image_urls[slideIndex] || data.image_urls[0] : "") ||
          "https://placehold.co/1080x1080/1a1a1a/FFF?text=SlideBackground";
        setBgUrl(preferredImage);
      } else {
        setText(data.topic || data.title || "Post");
        const fallbackImage =
          (Array.isArray(data.image_urls) ? data.image_urls[slideIndex] || data.image_urls[0] : "") ||
          "https://placehold.co/1080x1080/1a1a1a/FFF?text=Background";
        setBgUrl(fallbackImage);
      }
      return;
    }

    setText(data.title || "New Post");
    if (data.pillar === "Identity") setBgUrl(FILTER_TEMPLATES.identity.bg);
    else setBgUrl(data.image_url || "https://placehold.co/1080x1080/1a1a1a/FFF?text=Background");
  };

  const updateSlideBackgroundFallback = async ({
    tableName,
    targetPostId,
    targetSlideIndex,
    newImageUrl,
    assetId,
    selectionReason,
  }: {
    tableName: "linkedin_carousels" | "instagram_posts";
    targetPostId: string;
    targetSlideIndex: number;
    newImageUrl: string;
    assetId?: string;
    selectionReason?: string;
  }) => {
    const { data: row, error: loadError } = await supabase
      .from(tableName as any)
      .select("*")
      .eq("id", targetPostId)
      .single();

    if (loadError) throw loadError;

    const currentRow = (row || {}) as any;
    const slides = Array.isArray(currentRow.slides) ? [...currentRow.slides] : [];
    while (slides.length <= targetSlideIndex) slides.push({});

    const currentSlide = slides[targetSlideIndex] ? { ...slides[targetSlideIndex] } : {};
    const imageUrls = Array.isArray(currentRow.image_urls) ? [...currentRow.image_urls] : [];
    const prevImageUrl = resolveSlideImageUrl(currentSlide) || imageUrls[targetSlideIndex] || "";
    const variants = Array.isArray(currentSlide.image_variants) ? currentSlide.image_variants : [];
    const prevImageUrls = Array.isArray(currentSlide.prev_image_urls) ? currentSlide.prev_image_urls : [];

    const nextSlide: Record<string, any> = {
      ...currentSlide,
      image_url: newImageUrl,
      imageUrl: newImageUrl,
      image_variants: dedupeUrls([...variants, prevImageUrl, newImageUrl]),
      prev_image_urls:
        prevImageUrl && prevImageUrl !== newImageUrl
          ? dedupeUrls([...prevImageUrls, prevImageUrl])
          : dedupeUrls(prevImageUrls),
      asset_source: "manual",
      selection_score: 1,
      selection_reason: selectionReason || "manual override (ui fallback)",
    };

    if (assetId) {
      nextSlide.asset_id = assetId;
    }

    slides[targetSlideIndex] = nextSlide;
    imageUrls[targetSlideIndex] = newImageUrl;

    const payload: Record<string, any> = {
      slides,
      image_urls: imageUrls,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from(tableName as any)
      .update(payload)
      .eq("id", targetPostId);

    if (updateError) throw updateError;
  };

  const persistSlideBackground = async ({
    tableName,
    targetPostId,
    targetSlideIndex,
    newImageUrl,
    assetId,
    selectionReason,
  }: {
    tableName: "linkedin_carousels" | "instagram_posts";
    targetPostId: string;
    targetSlideIndex: number;
    newImageUrl: string;
    assetId?: string;
    selectionReason?: string;
  }): Promise<"edge" | "fallback"> => {
    try {
      const { data, error } = await supabase.functions.invoke("set-slide-background", {
        body: {
          table_name: tableName,
          post_id: targetPostId,
          slide_index: targetSlideIndex,
          new_image_url: newImageUrl,
          asset_id: assetId,
          source: "manual",
        },
      });

      if (error || data?.success === false) {
        throw new Error(error?.message || data?.error || "Failed to apply background");
      }

      return "edge";
    } catch (invokeError) {
      console.warn("[ImageEditor] set-slide-background unavailable, using fallback update", invokeError);
      await updateSlideBackgroundFallback({
        tableName,
        targetPostId,
        targetSlideIndex,
        newImageUrl,
        assetId,
        selectionReason,
      });
      return "fallback";
    }
  };

  const applySlideBackground = async (candidate: { url: string; assetId?: string; reason?: string }) => {
    if (!candidate?.url) return;

    if (postType === "template" || !postId) {
      setBgUrl(candidate.url);
      setIsLibraryOpen(false);
      return;
    }

    setIsApplyingBackground(true);
    try {
      const tableName = mapPostToTable(postType) as "linkedin_carousels" | "instagram_posts";
      const mode = await persistSlideBackground({
        tableName,
        targetPostId: postId,
        targetSlideIndex: slideIndex,
        newImageUrl: candidate.url,
        assetId: candidate.assetId,
        selectionReason: candidate.reason,
      });

      toast.success("Fundo aplicado com sucesso");
      if (mode === "fallback") {
        toast.info("Salvo em modo local (fallback) enquanto a edge function não está publicada.");
      }
      setBgUrl(candidate.url);
      setIsLibraryOpen(false);
      await loadPost();
    } catch (error: any) {
      console.error("[ImageEditor] applySlideBackground error", error);
      toast.error(`Erro ao aplicar fundo: ${error.message}`);
    } finally {
      setIsApplyingBackground(false);
    }
  };

  const handleIAAssist = async () => {
    if (!bgUrl || bgUrl.includes("placehold.co")) {
      toast.info("Selecione um fundo real ou asset para melhorar com IA.");
      return;
    }

    setIsEnhancing(true);
    const toastId = toast.loading("O Nano Banana Pro está processando sua imagem...");

    try {
      const { data, error } = await supabase.functions.invoke("enhance-product-image", {
        body: {
          imageData: bgUrl,
          prompt: `Melhore esta imagem para um catálogo médico premium da Lifetrek.
Mantenha o produto central mas adicione iluminação dramática e ambiente de cleanroom de alta tecnologia.
Texto da Imagem: ${text}`,
        },
      });

      if (error) throw error;
      if (data?.enhancedImage) {
        setBgUrl(data.enhancedImage);
        toast.success("Imagem aprimorada com Nano Banana Pro!");
      }
    } catch (e: any) {
      toast.error(`Erro IA: ${e.message}`);
    } finally {
      setIsEnhancing(false);
      toast.dismiss(toastId);
    }
  };

  const handleRegenerateBackground = async (mode: "smart" | "ai" = "smart") => {
    if (!postId || postType === "template") return;

    setIsRegenerating(true);
    const toastId = toast.loading(mode === "smart" ? "Selecionando melhor fundo (smart)..." : "Gerando fundo com IA...");

    try {
      const tableName = mapPostToTable(postType);

      const { data, error } = await supabase.functions.invoke("regenerate-carousel-images", {
        body: {
          carousel_id: postId,
          slide_index: slideIndex,
          table_name: tableName,
          mode,
          allow_ai_fallback: mode === "smart",
        },
      });

      if (error || data?.success === false) {
        throw new Error(error?.message || data?.error || "Falha ao regenerar");
      }

      await loadPost();
      toast.success(mode === "smart" ? "Fundo atualizado via seleção inteligente" : "Novo fundo gerado com IA");
    } catch (e: any) {
      console.error(e);
      const message = String(e?.message || "");
      const isAuthFailure =
        message.toLowerCase().includes("non-2xx") ||
        message.toLowerCase().includes("401") ||
        message.toLowerCase().includes("invalid jwt");

      if (mode === "smart" && isAuthFailure) {
        try {
          const assets = libraryAssets.length ? libraryAssets : await loadAssetLibrary();
          const localSuggestions = buildSmartSuggestions(assets, suggestionQuery, neighborSlideUrls as string[]);
          const fallbackCandidate = localSuggestions.find((s) => s.passThreshold) || localSuggestions[0];

          if (!fallbackCandidate) {
            throw new Error("Não foi possível selecionar candidato local para fallback smart.");
          }

          await applySlideBackground({
            url: fallbackCandidate.url,
            assetId: fallbackCandidate.assetId,
            reason: `smart_local_fallback | ${fallbackCandidate.reason}`,
          });
          toast.info("Smart fallback local aplicado (edge function indisponível para JWT atual).");
        } catch (fallbackError: any) {
          toast.error(`Erro ao regenerar (fallback local): ${fallbackError.message}`);
        }
      } else {
        toast.error(`Erro ao regenerar: ${e.message}`);
      }
    } finally {
      setIsRegenerating(false);
      toast.dismiss(toastId);
    }
  };

  const handleDownload = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = `post-${postId || "new"}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!postId || !post) {
      toast.error("Nenhum post selecionado para salvar.");
      return;
    }

    try {
      const uri = stageRef.current.toDataURL();
      const blob = await (await fetch(uri)).blob();
      const fileName = `posts/${postId}_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("content_assets")
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("content_assets")
        .getPublicUrl(fileName);

      if (postType === "linkedin" || postType === "instagram") {
        const tableName = mapPostToTable(postType) as "linkedin_carousels" | "instagram_posts";
        const mode = await persistSlideBackground({
          tableName,
          targetPostId: postId,
          targetSlideIndex: slideIndex,
          newImageUrl: publicUrl,
          selectionReason: "manual save from editor",
        });

        if (mode === "fallback") {
          toast.info("Salvo em modo local (fallback) enquanto a edge function não está publicada.");
        }
      } else {
        const { error: updateError } = await supabase
          .from("content_templates")
          .update({ image_url: publicUrl })
          .eq("id", postId);

        if (updateError) throw updateError;
      }

      toast.success("Imagem salva e vinculada ao post!");
      await loadPost();
    } catch (e: any) {
      toast.error(`Erro ao salvar imagem: ${e.message}`);
    }
  };

  return (
    <div className={`flex ${embedded ? "h-full bg-transparent" : "h-screen bg-background"}`}>
      <div className={`${embedded ? "w-72" : "w-96"} border-r p-4 space-y-6 bg-muted/10 h-full overflow-y-auto`}>
        <div className="flex items-center gap-2 mb-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h2 className="font-bold text-lg">Editor de Imagem</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Texto da Headline</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>URL do Fundo</Label>
            <Input value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={handleSave}>
                <Save className="w-4 h-4" />
                Salvar
              </Button>
              <Button
                variant="secondary"
                className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleIAAssist}
                disabled={isEnhancing || isRegenerating || isApplyingBackground}
              >
                {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                IA Assist
              </Button>
            </div>

            <Button
              variant="secondary"
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => handleRegenerateBackground("smart")}
              disabled={isRegenerating || isEnhancing || isApplyingBackground || postType === "template"}
            >
              {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerar Fundo (Smart)
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                setIsLibraryOpen(true);
                setSelectedCandidate(null);
                setShowVersions(false);
              }}
              disabled={postType === "template"}
            >
              <ImageIcon className="w-4 h-4" />
              Trocar Fundo
            </Button>

            <Button variant="outline" className="w-full gap-2" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Baixar PNG
            </Button>
          </div>
        </div>

        {activeSlide && (
          <div className="p-3 bg-muted/20 rounded-lg text-xs space-y-2">
            <h3 className="font-semibold uppercase tracking-wider text-muted-foreground">Slide Atual</h3>
            <p>
              <strong>Headline:</strong> {activeSlide.headline || "N/A"}
            </p>
            <p>
              <strong>Fonte:</strong> {activeSlide.asset_source || "N/A"}
            </p>
            {typeof activeSlide.selection_score === "number" && (
              <p>
                <strong>Score:</strong> {activeSlide.selection_score.toFixed(3)}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto pt-6">
          <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Templates Rápidos</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(FILTER_TEMPLATES).map(([name, tmpl]) => (
              <button
                key={name}
                onClick={() => setBgUrl(tmpl.bg)}
                className="h-16 rounded border bg-muted flex items-center justify-center text-[10px] font-medium hover:border-primary transition-colors"
              >
                {name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-zinc-900/50 overflow-auto p-4 lg:p-12">
        <div className="shadow-2xl border-4 border-zinc-800 rounded-lg overflow-hidden bg-white">
          <Stage width={canvasSize.width * 0.5} height={canvasSize.height * 0.5} scaleX={0.5} scaleY={0.5} ref={stageRef}>
            <Layer>
              <URLImage src={bgUrl} x={0} y={0} width={canvasSize.width} height={canvasSize.height} />

              <Text
                text={text}
                x={headlinePosition.x}
                y={headlinePosition.y}
                width={880}
                fontSize={80}
                fontFamily="Arial"
                fontStyle="bold"
                fill="white"
                shadowColor="black"
                shadowBlur={10}
                shadowOffset={{ x: 2, y: 2 }}
                shadowOpacity={0.8}
                align="center"
                draggable
                onDragMove={(event) => {
                  const node = event.target;
                  setHeadlinePosition({ x: node.x(), y: node.y() });
                }}
                onDragEnd={(event) => {
                  const node = event.target;
                  setHeadlinePosition({ x: node.x(), y: node.y() });
                }}
              />
            </Layer>
          </Stage>
        </div>
      </div>

      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="max-w-6xl h-[86vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Trocar Fundo do Slide</DialogTitle>
          </DialogHeader>

          <Tabs value={activeAssetTab} onValueChange={setActiveAssetTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-2 w-[360px]">
              <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
              <TabsTrigger value="library">Biblioteca</TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="mt-4 min-h-0 flex-1">
              {isLoadingAssets ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[56vh] border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">Query: {suggestionQuery || "(vazio)"}</Badge>
                    <Badge variant="secondary">Intent: {classifyIntent(suggestionQuery)}</Badge>
                  </div>

                  {suggestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem sugestões no momento.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {suggestions.map((item) => (
                        <button
                          key={`suggestion-${item.id}`}
                          type="button"
                          className={`text-left border rounded-lg overflow-hidden transition-all ${
                            selectedCandidate?.url === item.url ? "ring-2 ring-primary border-primary" : "hover:border-primary/60"
                          }`}
                          onClick={() => setSelectedCandidate(item)}
                        >
                          <div className="aspect-square bg-slate-100">
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-2 space-y-1">
                            <p className="text-xs font-semibold truncate">{item.name}</p>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                              <Badge className={`text-[10px] ${item.passThreshold ? "bg-green-600" : "bg-amber-600"}`}>
                                {item.score.toFixed(3)}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{item.reason}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="library" className="mt-4 min-h-0 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Buscar por nome ou categoria"
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                  />
                </div>
                <select
                  value={assetCategoryFilter}
                  onChange={(e) => setAssetCategoryFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="facility">Facility</option>
                  <option value="equipment">Equipment</option>
                  <option value="product">Product</option>
                </select>
              </div>

              <ScrollArea className="h-[56vh] border rounded-lg p-4 bg-muted/20">
                {isLoadingAssets ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredLibraryAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum asset encontrado.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {filteredLibraryAssets.map((item) => (
                      <button
                        key={`library-${item.id}`}
                        type="button"
                        className={`text-left border rounded-lg overflow-hidden transition-all ${
                          selectedCandidate?.url === item.url ? "ring-2 ring-primary border-primary" : "hover:border-primary/60"
                        }`}
                        onClick={() =>
                          setSelectedCandidate({
                            ...item,
                            score: 0,
                            reason: "Manual library selection",
                            passThreshold: true,
                          })
                        }
                      >
                        <div className="aspect-square bg-slate-100">
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2 space-y-1">
                          <p className="text-xs font-semibold truncate">{item.name}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {item.category}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="border rounded-lg p-3 bg-muted/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Versões</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowVersions((v) => !v)}>
                {showVersions ? "Ocultar" : "Ver versões"}
              </Button>
            </div>

            {showVersions && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Histórico imutável. Selecione uma versão para reativá-la; exclusão não é permitida.
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {activeVariants.map((url, idx) => (
                    <button
                      key={`variant-${idx}`}
                      type="button"
                      className={`w-20 h-20 rounded border overflow-hidden shrink-0 ${
                        selectedCandidate?.url === url ? "ring-2 ring-primary border-primary" : "hover:border-primary/60"
                      }`}
                      onClick={() =>
                        setSelectedCandidate({
                          id: `variant-${idx}`,
                          assetId: undefined,
                          url,
                          name: `Variante ${idx + 1}`,
                          category: "variant",
                          type: "environment",
                          score: 0,
                          reason: "Historical variant selection",
                          passThreshold: true,
                        })
                      }
                    >
                      <img src={url} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {!activeVariants.length && <p className="text-xs text-muted-foreground">Sem versões salvas.</p>}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsLibraryOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={isApplyingBackground || isRegenerating}
              onClick={async () => {
                await handleRegenerateBackground("ai");
              }}
            >
              {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Gerar com IA
            </Button>
            <Button
              disabled={!selectedCandidate || isApplyingBackground}
              onClick={async () => {
                if (!selectedCandidate) return;
                await applySlideBackground(selectedCandidate);
              }}
            >
              {isApplyingBackground ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

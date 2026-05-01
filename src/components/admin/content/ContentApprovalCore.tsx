
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResourcePreview } from './ResourcePreview';
import { Loader2, Check, X, Eye, Trash2, RefreshCw, ThumbsUp, ThumbsDown, Clock, Instagram, Linkedin, FileText, CheckCircle, Sparkles, BookOpen, Globe, Trash, Send } from "lucide-react";
import { toast } from "sonner";
import { showActionableError } from "@/lib/showActionableError";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import ReactMarkdown from "react-markdown";
import {
    useContentApprovalItems,
    useRejectedContentItems,
    useApprovedContentItems,
    useApproveLinkedInPost,
    useRejectLinkedInPost,
    useLinkedInCarouselFull,
    useApproveResource,
    useRejectResource,
} from "@/hooks/useLinkedInPosts";
import {
    useApproveBlogPost,
    useUpdateBlogPost
} from "@/hooks/useBlogPosts";
import {
    useApproveInstagramPost,
    useRejectInstagramPost,
    useInstagramPost,
} from "@/hooks/useInstagramPosts";
// BookOpen already imported above
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImageWithFallback } from "@/components/ui/ImageFallback";
import { InstagramPostPreview } from "./InstagramPostPreview";
import { ContentItemCard } from "./ContentItemCard";
import { SendReviewModal } from "./SendReviewModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    AlertCircle,
    ChevronRight,
    ShieldCheck,
    Image as ImageIcon,
    Search,
    ListFilter,
    ArrowUpDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    ContentApprovalSort,
    ContentApprovalViewState,
    loadApprovalViewState,
    saveApprovalViewState,
    serializeApprovalStateToQuery
} from "./contentApprovalState";
import { getApprovalBlockers } from "./approvalBlockers";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    StakeholderReviewItem,
    stakeholderContentTypeFromUiType,
    useApplyCopyEditSuggestion,
    useDismissCopyEditSuggestion,
    useStakeholderReviewItems,
    useStakeholderStatusItems,
    useStakeholderSuggestionItems,
} from "@/hooks/useStakeholderReview";

interface ContentApprovalCoreProps {
    embedded?: boolean;
}

function isStakeholderSendEligible(item: any) {
    const status = item?.status || item?.full_data?.status;
    return ["linkedin", "instagram", "blog"].includes(item?.type) && ["approved", "admin_approved"].includes(status);
}

function getSelectedContentData(selectedItem: any, fullCarouselData: any, fullInstagramData: any) {
    if (!selectedItem) return null;
    const localData = selectedItem.full_data || {};
    if (selectedItem.type === "linkedin") return { ...(fullCarouselData || {}), ...localData };
    if (selectedItem.type === "instagram") return { ...(fullInstagramData || {}), ...localData };
    return localData;
}

function buildSelectedItemFromUpdatedContent(item: any, updatedContent: any) {
    const contentPreview =
        item?.type === "blog"
            ? updatedContent?.excerpt || updatedContent?.content?.substring?.(0, 150) || ""
            : item?.type === "linkedin"
                ? updatedContent?.slides?.[0]?.headline || updatedContent?.caption?.substring?.(0, 100) || ""
                : updatedContent?.caption?.substring?.(0, 100) || "";

    const title =
        item?.type === "blog"
            ? updatedContent?.title || item?.title
            : item?.type === "linkedin"
                ? updatedContent?.topic || item?.title
                : updatedContent?.topic || item?.title || "Post Instagram";

    return {
        ...item,
        title,
        content_preview: contentPreview,
        full_data: {
            ...(item?.full_data || {}),
            ...(updatedContent || {}),
        },
    };
}

const newsletterDistributionSteps = [
    {
        title: "Fonte canônica",
        label: "Blog ou recurso",
        description: "A versão completa fica no site, com SEO, FAQ, checklist e referência para vendas.",
    },
    {
        title: "Edição LinkedIn",
        label: "Newsletter",
        description: "Adaptar o tema para leitura editorial: risco real, 3 blocos narrativos e CTA único.",
    },
    {
        title: "Distribuição",
        label: "Feed",
        description: "Publicar um post curto com uma ideia forte para puxar leitura e assinatura.",
    },
];

function NewsletterDistributionSystemCard() {
    return (
        <Card className="overflow-hidden border-[#004F8F]/20 bg-gradient-to-br from-white via-blue-50/70 to-white shadow-sm">
            <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#004F8F] text-white">
                            <Linkedin className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg text-slate-950">Sistema Boletim Lifetrek</CardTitle>
                            <CardDescription className="max-w-3xl text-sm leading-relaxed text-slate-600">
                                Aprove blogs e recursos pensando no sistema: site como fonte canônica, newsletter como adaptação editorial e feed como distribuição.
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary" className="w-fit border border-[#004F8F]/15 bg-white text-[#004F8F]">
                        Cadência mensal
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start">
                    {newsletterDistributionSteps.map((step, index) => (
                        <div key={step.title} className="contents">
                            <div className="flex gap-3 rounded-lg bg-white/65 p-3 ring-1 ring-slate-200/70">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#004F8F]/10 text-xs font-bold text-[#004F8F]">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                                    <p className="text-xs font-medium uppercase tracking-wide text-[#004F8F]">{step.label}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                                </div>
                            </div>
                            {index < newsletterDistributionSteps.length - 1 && (
                                <div className="hidden justify-center pt-5 text-slate-400 md:flex">
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-2 border-t border-[#004F8F]/10 pt-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[#004F8F]" />
                        <span>Primeira sequência: rastreabilidade, primeiro lote controlado e fornecedor ISO 13485.</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Revisar antes de aprovar conteúdo
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

export function ContentApprovalCore({ embedded = false }: ContentApprovalCoreProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const {
        data: items,
        isLoading,
        error: errorPending,
        refetch: refetchPending,
    } = useContentApprovalItems();
    const {
        data: rejectedItems,
        isLoading: isLoadingRejected,
        error: errorRejected,
        refetch: refetchRejected,
    } = useRejectedContentItems();
    const {
        data: approvedItems,
        isLoading: isLoadingApproved,
        error: errorApproved,
        refetch: refetchApproved,
    } = useApprovedContentItems();
    const approveLinkedIn = useApproveLinkedInPost();
    const rejectLinkedIn = useRejectLinkedInPost();
    const approveBlog = useApproveBlogPost();
    const updateBlog = useUpdateBlogPost();
    const approveResource = useApproveResource();
    const rejectResource = useRejectResource();
    const approveInstagram = useApproveInstagramPost();
    const rejectInstagram = useRejectInstagramPost();

    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [schedulingItem, setSchedulingItem] = useState<any | null>(null);
    const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
    const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [acceptanceCriteria, setAcceptanceCriteria] = useState({
        correctLogo: false,
        brandIdentity: false,
        noWordingMistakes: false,
        hasAssets: false
    });
    const [isRegenerating, setIsRegenerating] = useState(false);
    const initialState = useMemo<ContentApprovalViewState>(() => {
        const fallback = loadApprovalViewState() || { tab: "all", query: "", sort: "newest" as ContentApprovalSort };
        if (embedded) return fallback;

        return {
            tab: searchParams.get("tab") || fallback.tab,
            query: searchParams.get("q") || fallback.query,
            sort: (searchParams.get("sort") as ContentApprovalSort) || fallback.sort,
            anchor: searchParams.get("anchor") || fallback.anchor
        };
    }, [embedded, searchParams]);

    const [activeTab, setActiveTab] = useState(
        initialState.tab === "linkedin" || initialState.tab === "instagram"
            ? "all"
            : (initialState.tab || "all"),
    );
    const [searchTerm, setSearchTerm] = useState(initialState.query || "");
    const [sortBy, setSortBy] = useState<ContentApprovalSort>(initialState.sort || "newest");
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedSendIds, setSelectedSendIds] = useState<Set<string>>(new Set());
    const [sendReviewModalOpen, setSendReviewModalOpen] = useState(false);
    const [approvalConfirmItem, setApprovalConfirmItem] = useState<any | null>(null);
    const [batchApprovalConfirmItems, setBatchApprovalConfirmItems] = useState<any[] | null>(null);
    const [batchRejectDialogOpen, setBatchRejectDialogOpen] = useState(false);
    const [batchRejectReason, setBatchRejectReason] = useState("");
    const [linkedInChecklistForType, setLinkedInChecklistForType] = useState({
        correctLogo: false,
        brandIdentity: false,
        textQuality: false,
        slideRelevance: false,
    });
    const [blogChecklist, setBlogChecklist] = useState({
        seoFields: false,
        textQuality: false,
        featuredImage: false,
        contentComplete: false,
    });
    const [resourceChecklist, setResourceChecklist] = useState({
        textQuality: false,
        contentComplete: false,
        interactiveElements: false,
    });

    const isAccepted = Object.values(acceptanceCriteria).every(v => v);

    const selectedLinkedInId = selectedItem?.type === 'linkedin' ? selectedItem.id : null;
    const { data: fullCarouselData, isLoading: isLoadingCarousel } = useLinkedInCarouselFull(selectedLinkedInId);

    const selectedInstagramId = selectedItem?.type === 'instagram' ? selectedItem.id : null;
    const { data: fullInstagramData, isLoading: isLoadingInstagram } = useInstagramPost(selectedInstagramId);
    const previewApprovalBlockers = useMemo(
        () => getApprovalBlockers(selectedItem, { carousel: fullCarouselData, instagram: fullInstagramData }),
        [selectedItem, fullCarouselData, fullInstagramData],
    );
    const selectedStakeholderContentType = stakeholderContentTypeFromUiType(selectedItem?.type);
    const { data: stakeholderReviewItems = [] } = useStakeholderReviewItems(selectedStakeholderContentType, selectedItem?.id);
    const { data: stakeholderPendingItems = [] } = useStakeholderStatusItems("stakeholder_review_pending");
    const { data: stakeholderApprovedItems = [] } = useStakeholderStatusItems("stakeholder_approved");
    const { data: stakeholderRejectedItems = [] } = useStakeholderStatusItems("stakeholder_rejected");
    const { data: stakeholderSuggestionItems = [] } = useStakeholderSuggestionItems();
    const applyCopyEditSuggestion = useApplyCopyEditSuggestion();
    const dismissCopyEditSuggestion = useDismissCopyEditSuggestion();

    const handleSyncResources = async () => {
        setIsSyncing(true);
        try {
            toast.info("Sincronizando recursos...");
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
        } catch (error: any) {
            showActionableError(error, 'sincronização de recursos');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCleanDuplicates = async () => {
        setIsCleaning(true);
        try {
            // Logic to find duplicates in allPending
            // We'll dedupe by title/type for now
            const seen = new Set();
            const duplicates = allPending.filter(item => {
                const key = `${item.type}-${item.title}`;
                if (seen.has(key)) return true;
                seen.add(key);
                return false;
            });

            if (duplicates.length === 0) {
                toast.success("Nenhum duplicado encontrado.");
                return;
            }

            for (const dup of duplicates) {
                const tableName = dup.type === 'linkedin' ? 'linkedin_carousels' :
                    dup.type === 'blog' ? 'blog_posts' :
                        dup.type === 'instagram' ? 'instagram_posts' : 'resources';

                await supabase.from(tableName as any).delete().eq('id', dup.id);
            }

            toast.success(`${duplicates.length} duplicados removidos.`);
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
        } catch (error: any) {
            showActionableError(error, 'limpeza de duplicatas');
        } finally {
            setIsCleaning(false);
        }
    };

    const handlePreview = (item: any) => {
        setSelectedItem(item);
        setPreviewDialogOpen(true);
    };

    const getNavigationQuery = () => {
        const state: ContentApprovalViewState = {
            tab: activeTab,
            query: searchTerm,
            sort: sortBy,
            anchor: Math.round(window.scrollY)
        };
        return serializeApprovalStateToQuery(state);
    };

    useEffect(() => {
        const state: ContentApprovalViewState = {
            tab: activeTab,
            query: searchTerm,
            sort: sortBy,
            anchor: Math.round(window.scrollY)
        };
        saveApprovalViewState(state);

        if (!embedded) {
            const next = new URLSearchParams(searchParams);
            next.set("tab", activeTab);
            if (searchTerm) next.set("q", searchTerm);
            else next.delete("q");
            next.set("sort", sortBy);
            setSearchParams(next, { replace: true });
        }
    }, [activeTab, searchTerm, sortBy, embedded]);

    useEffect(() => {
        if (embedded) return;
        const anchor = initialState.anchor;
        if (!anchor) return;
        const value = typeof anchor === "string" ? Number(anchor) : anchor;
        if (!Number.isFinite(value)) return;
        window.requestAnimationFrame(() => window.scrollTo({ top: Number(value), behavior: "auto" }));
    }, [embedded]);

    const handleEdit = (item: any) => {
        const navigationQuery = getNavigationQuery();
        const encodedState = encodeURIComponent(navigationQuery);

        if (item.type === "blog") {
            navigate(`/admin/blog?edit=${item.id}&returnTo=/admin/content-approval&stateKey=${encodedState}`);
            return;
        }

        if (item.type === "resource") {
            navigate(`/admin/resources?edit=${item.id}&returnTo=/admin/content-approval&stateKey=${encodedState}`);
            return;
        }

        navigate(`/admin/social?tab=design&id=${item.id}&type=${item.type}&slide=0&returnTo=/admin/content-approval&stateKey=${encodedState}`);
    };

    const requestApproval = (item: any) => {
        setApprovalConfirmItem(item);
    };

    const handleApprove = async (item: any) => {
        const previousStatus = item.status || item.full_data?.status || 'pending_approval';
        try {
            if (item.type === 'blog') {
                await approveBlog.mutateAsync(item.id);
            } else if (item.type === 'linkedin') {
                await approveLinkedIn.mutateAsync(item.id);
            } else if (item.type === 'instagram') {
                await approveInstagram.mutateAsync(item.id);
            } else if (item.type === 'resource') {
                await approveResource.mutateAsync(item.id);
            }
            const contentTypeLabel =
                item.type === "linkedin" ? "LinkedIn" :
                    item.type === "instagram" ? "Instagram" :
                        item.type === "blog" ? "Artigo" : "Recurso";

            toast.success(`${contentTypeLabel} aprovado: ${item.title}`, {
                action: {
                    label: "Desfazer",
                    onClick: async () => {
                        try {
                            const tableName = item.type === 'linkedin' ? 'linkedin_carousels' :
                                item.type === 'blog' ? 'blog_posts' :
                                    item.type === 'instagram' ? 'instagram_posts' : 'resources';
                            const currentMetadata = item.type === "blog" ? { ...(item.full_data?.metadata || {}) } : null;
                            if (currentMetadata && "approved_at" in currentMetadata) {
                                delete currentMetadata.approved_at;
                            }

                            const rollbackPayload = item.type === "blog"
                                ? { status: previousStatus, approved_at: null, approved_by: null, metadata: currentMetadata }
                                : { status: previousStatus, approved_at: null, approved_by: null };

                            await (supabase.from(tableName as any).update(rollbackPayload as any) as any).eq('id', item.id);
                            toast.info("Acao desfeita.");
                            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
                            await queryClient.invalidateQueries({ queryKey: ["approved_content_items"] });
                        } catch (error) {
                            showActionableError(error, 'desfazer aprovação');
                        }
                    },
                },
                duration: 8000,
            });
        } catch (error) {
            console.error('Error approving:', error);
            throw error;
        }
    };

    const handleConfirmApproval = async () => {
        if (approvalConfirmItem) {
            await handleApprove(approvalConfirmItem);
            setApprovalConfirmItem(null);
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
        }
    };

    const requestBatchApproval = (categoryItems: any[]) => {
        if (!categoryItems.length) return;
        setBatchApprovalConfirmItems(categoryItems);
    };

    const handleConfirmBatchApproval = async () => {
        if (batchApprovalConfirmItems) {
            await handleBatchApprove(batchApprovalConfirmItems);
            setBatchApprovalConfirmItems(null);
        }
    };

    const handleReject = async () => {
        if (!selectedItem || !rejectionReason.trim()) {
            toast.warning("Por favor, informe o motivo da rejeição");
            return;
        }

        const item = selectedItem;
        const previousStatus = item.status || item.full_data?.status || 'pending_approval';
        try {
            if (item.type === 'blog') {
                await updateBlog.mutateAsync({ id: item.id, status: 'rejected' });
            } else if (item.type === 'linkedin') {
                await rejectLinkedIn.mutateAsync({ id: item.id, reason: rejectionReason });
            } else if (item.type === 'instagram') {
                await rejectInstagram.mutateAsync({ id: item.id, reason: rejectionReason });
            } else if (item.type === 'resource') {
                await rejectResource.mutateAsync({ id: item.id, reason: rejectionReason });
            }
            setRejectDialogOpen(false);
            setRejectionReason("");
            setSelectedItem(null);
            toast.success(`"${item.title}" rejeitado.`, {
                action: {
                    label: "Desfazer",
                    onClick: async () => {
                        try {
                            const tableName = item.type === 'linkedin' ? 'linkedin_carousels' :
                                item.type === 'blog' ? 'blog_posts' :
                                    item.type === 'instagram' ? 'instagram_posts' : 'resources';
                            await (supabase.from(tableName as any).update({ status: previousStatus } as any) as any).eq('id', item.id);
                            toast.info("Acao desfeita.");
                            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
                            await queryClient.invalidateQueries({ queryKey: ["rejected_content_items"] });
                        } catch (error) {
                            showActionableError(error, 'desfazer rejeição');
                        }
                    },
                },
                duration: 8000,
            });
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
        } catch (error) {
            console.error('Error rejecting:', error);
        }
    };

    const handleSchedule = async () => {
        if (!schedulingItem || !scheduledDate) return;

        try {
            const scheduledIso = scheduledDate.toISOString();
            const tableName = schedulingItem.type === 'linkedin' ? 'linkedin_carousels' :
                schedulingItem.type === 'blog' ? 'blog_posts' :
                    schedulingItem.type === 'instagram' ? 'instagram_posts' : 'content_templates';

            let updatePayload: Record<string, any> = { status: 'scheduled' };

            if (schedulingItem.type === 'linkedin' || schedulingItem.type === 'instagram') {
                updatePayload = { ...updatePayload, scheduled_date: scheduledIso };
            } else if (schedulingItem.type === 'blog') {
                // blog_posts does not have scheduled_date in prod yet; store schedule in metadata.target_date.
                const currentMetadata = schedulingItem.full_data?.metadata || {};
                updatePayload = {
                    ...updatePayload,
                    metadata: {
                        ...currentMetadata,
                        target_date: scheduledIso,
                    }
                };
            } else if (schedulingItem.type === 'resource') {
                updatePayload = { ...updatePayload, scheduled_date: scheduledIso };
            }

            const { error } = await (supabase
                .from(tableName as any)
                .update(updatePayload as any) as any)
                .eq('id', schedulingItem.id);

            if (error) throw error;

            toast.success("Post agendado com sucesso!");
            setIsSchedulingOpen(false);
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
            await queryClient.invalidateQueries({ queryKey: ["approved_content_items"] });
        } catch (error: any) {
            showActionableError(error, 'agendamento de post');
        }
    };

    const handleRegenerateImages = async (item: any) => {
        if (!item) return;
        setIsRegenerating(true);
        toast.info("Iniciando regeneração de imagens com IA...");

        try {
            const tableName = item.type === 'linkedin' ? 'linkedin_carousels' :
                item.type === 'instagram' ? 'instagram_posts' :
                    item.type === 'blog' ? 'blog_posts' :
                        item.type === 'resource' ? 'resources' : null;

            if (!tableName) {
                throw new Error("Tipo de item não suporta regeneração de imagem");
            }

            const { data, error } = await supabase.functions.invoke('regenerate-carousel-images', {
                body: {
                    carousel_id: item.id,
                    table_name: tableName,
                    mode: 'smart',
                    allow_ai_fallback: true
                }
            });

            if (error) throw error;

            toast.success("Imagens regeneradas com sucesso!");

            // Invalidate queries to refresh data
            if (item.type === 'linkedin') {
                await queryClient.invalidateQueries({ queryKey: ["linkedin_carousel", item.id] });
            } else if (item.type === 'instagram') {
                await queryClient.invalidateQueries({ queryKey: ["instagram_post", item.id] });
            }
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });

            // Refresh selected item data if possible, or close/reopen
            // Ideally we'd update selectedItem with new data, but invalidating query should trigger re-render of hooks

        } catch (error: any) {
            showActionableError(error, 'regeneração de imagens');
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleBatchApprove = async (categoryItems: any[]) => {
        if (!categoryItems.length) return;
        setIsBatchProcessing(true);
        setBatchProgress(0);
        const count = categoryItems.length;
        toast.info(`Aprovando ${count} itens...`);

        try {
            let completed = 0;
            for (const item of categoryItems) {
                await handleApprove(item);
                completed++;
                setBatchProgress(Math.round((completed / count) * 100));
            }
            toast.success(`${count} itens aprovados com sucesso!`);
            setSelectedIds([]);
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
        } catch (error: any) {
            showActionableError(error, 'aprovação em massa');
        } finally {
            setIsBatchProcessing(false);
            setBatchProgress(0);
        }
    };

    const openBatchRejectDialog = () => {
        if (selectedIds.length === 0) return;
        setBatchRejectReason("");
        setBatchRejectDialogOpen(true);
    };

    const handleBatchRejectSelected = async () => {
        if (selectedIds.length === 0 || !batchRejectReason.trim()) {
            toast.warning("Por favor, informe o motivo da rejeição");
            return;
        }

        const itemsToReject = [
            ...(items || []),
            ...(rejectedItems || []),
            ...(approvedItems || [])
        ].filter(i => selectedIds.includes(i.id));

        if (itemsToReject.length === 0) return;

        setBatchRejectDialogOpen(false);
        setIsBatchProcessing(true);
        setBatchProgress(0);

        try {
            let completed = 0;
            for (const item of itemsToReject) {
                if (item.type === 'linkedin') await rejectLinkedIn.mutateAsync({ id: item.id, reason: batchRejectReason });
                else if (item.type === 'instagram') await rejectInstagram.mutateAsync({ id: item.id, reason: batchRejectReason });
                else if (item.type === 'resource') await rejectResource.mutateAsync({ id: item.id, reason: batchRejectReason });
                else if (item.type === 'blog') await updateBlog.mutateAsync({ id: item.id, status: 'rejected' });

                completed++;
                setBatchProgress(Math.round((completed / itemsToReject.length) * 100));
            }
            toast.success(`${itemsToReject.length} itens rejeitados.`);
            setSelectedIds([]);
            setBatchRejectReason("");
        } catch (error) {
            showActionableError(error, 'rejeição em massa');
        } finally {
            setIsBatchProcessing(false);
            setBatchProgress(0);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAllInCategory = (categoryItems: any[]) => {
        const allIds = categoryItems.map(item => item.id);
        const allSelected = allIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
        }
    };

    const toggleSendSelection = (id: string) => {
        setSelectedSendIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const setAllSendSelections = (itemsToSelect: any[]) => {
        const eligibleIds = itemsToSelect.filter(isStakeholderSendEligible).map((item) => item.id);
        const allSelected = eligibleIds.length > 0 && eligibleIds.every((id) => selectedSendIds.has(id));

        setSelectedSendIds(() => {
            if (allSelected) {
                return new Set();
            }
            return new Set(eligibleIds);
        });
    };

    const getChecklistForType = (type: string) => {
        if (type === 'instagram') return Object.values(acceptanceCriteria).every(v => v);
        if (type === 'linkedin') return Object.values(linkedInChecklistForType).every(v => v);
        if (type === 'blog') return Object.values(blogChecklist).every(v => v);
        if (type === 'resource') return Object.values(resourceChecklist).every(v => v);
        return true;
    };

    const isChecklistComplete = selectedItem ? getChecklistForType(selectedItem.type) : true;
    const selectedItemStatus = selectedItem?.status || selectedItem?.full_data?.status;
    const selectedContentData = getSelectedContentData(selectedItem, fullCarouselData, fullInstagramData);
    const latestStakeholderReview: StakeholderReviewItem | null =
        stakeholderReviewItems[0] || selectedItem?.stakeholderReviewItem || null;
    const showPreviewDecisionActions = !!selectedItem && ![
        "approved",
        "admin_approved",
        "published",
        "scheduled",
        "rejected",
        "archived",
        "edit_suggested",
        "stakeholder_review_pending",
        "stakeholder_approved",
        "stakeholder_rejected",
    ].includes(selectedItemStatus || "");
    const canApproveSelectedItem = previewApprovalBlockers.messages.length === 0;

    const handleApplyStakeholderSuggestion = async () => {
        if (!latestStakeholderReview) return;
        const updatedContent = await applyCopyEditSuggestion.mutateAsync(latestStakeholderReview);
        setSelectedItem((current: any) => current ? buildSelectedItemFromUpdatedContent(current, updatedContent) : current);
    };

    const handleDismissStakeholderSuggestion = async () => {
        if (!latestStakeholderReview) return;
        await dismissCopyEditSuggestion.mutateAsync(latestStakeholderReview.id);
    };

    const renderStakeholderReviewPanel = () => {
        if (!selectedItem) return null;

        const status = latestStakeholderReview?.status || selectedItemStatus;
        const reviewedBy = latestStakeholderReview?.reviewed_by_email;
        const reviewedAt = latestStakeholderReview?.reviewed_at
            ? format(new Date(latestStakeholderReview.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            : null;

        if (!status || ![
            "stakeholder_review_pending",
            "stakeholder_approved",
            "stakeholder_rejected",
            "pending",
            "approved",
            "rejected",
            "edit_suggested",
        ].includes(status)) {
            return null;
        }

        return (
            <div className="space-y-4 rounded-xl border border-primary/10 bg-slate-50/70 p-5">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                        Revisão do stakeholder
                    </h4>
                </div>

                {(status === "stakeholder_review_pending" || status === "pending") && (
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                        Lote enviado para revisão. Aguardando retorno dos stakeholders.
                    </div>
                )}

                {(status === "stakeholder_approved" || status === "approved") && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        <p className="font-medium">
                            Aprovado por {reviewedBy || "stakeholder"}{reviewedAt ? ` em ${reviewedAt}` : ""}.
                        </p>
                    </div>
                )}

                {(status === "stakeholder_rejected" || status === "rejected") && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                        <p className="font-medium">
                            Rejeitado por {reviewedBy || "stakeholder"}{reviewedAt ? ` em ${reviewedAt}` : ""}.
                        </p>
                        {latestStakeholderReview?.reviewer_comment ? (
                            <p className="mt-2 whitespace-pre-wrap leading-6 text-rose-800">
                                {latestStakeholderReview.reviewer_comment}
                            </p>
                        ) : null}
                    </div>
                )}

                {status === "edit_suggested" && latestStakeholderReview?.copy_edits && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            <p className="font-medium">
                                Sugestão de cópia enviada por {reviewedBy || "stakeholder"}{reviewedAt ? ` em ${reviewedAt}` : ""}.
                            </p>
                        </div>

                        {selectedItem.type === "blog" ? (
                            <div className="space-y-3">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-lg bg-rose-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Título original</p>
                                        <p className="mt-2 text-sm text-rose-900">{selectedContentData?.title || "Sem título"}</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Título sugerido</p>
                                        <p className="mt-2 text-sm text-emerald-900">
                                            {String((latestStakeholderReview.copy_edits as any)?.title || "Sem sugestão")}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-lg bg-rose-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Resumo original</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm text-rose-900">
                                            {selectedContentData?.excerpt || "Sem resumo"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Resumo sugerido</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">
                                            {String((latestStakeholderReview.copy_edits as any)?.excerpt || "Sem sugestão")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-lg bg-rose-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Legenda original</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm text-rose-900">
                                            {selectedContentData?.caption || "Sem legenda"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Legenda sugerida</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">
                                            {String((latestStakeholderReview.copy_edits as any)?.caption || "Sem sugestão")}
                                        </p>
                                    </div>
                                </div>

                                {Array.isArray((latestStakeholderReview.copy_edits as any)?.slides) && (
                                    <div className="space-y-3">
                                        {((latestStakeholderReview.copy_edits as any).slides as any[]).map((slide, index) => {
                                            const originalSlide = Array.isArray(selectedContentData?.slides)
                                                ? selectedContentData.slides.find((candidate: any, candidateIndex: number) =>
                                                    (typeof candidate?.index === "number" ? candidate.index : candidateIndex) ===
                                                    (typeof slide?.index === "number" ? slide.index : index),
                                                )
                                                : null;

                                            return (
                                                <div key={`${selectedItem.id}-stakeholder-slide-${index}`} className="grid gap-3 md:grid-cols-2">
                                                    <div className="rounded-lg bg-rose-50 p-3">
                                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                                                            Slide {(typeof slide?.index === "number" ? slide.index : index) + 1} original
                                                        </p>
                                                        <p className="mt-2 text-sm font-medium text-rose-900">
                                                            {originalSlide?.headline || "Sem headline"}
                                                        </p>
                                                        <p className="mt-1 whitespace-pre-wrap text-sm text-rose-900">
                                                            {originalSlide?.body || originalSlide?.copy || "Sem corpo"}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-emerald-50 p-3">
                                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                                            Slide {(typeof slide?.index === "number" ? slide.index : index) + 1} sugerido
                                                        </p>
                                                        <p className="mt-2 text-sm font-medium text-emerald-900">
                                                            {slide?.headline || "Sem headline"}
                                                        </p>
                                                        <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-900">
                                                            {slide?.body || "Sem corpo"}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDismissStakeholderSuggestion}
                                disabled={dismissCopyEditSuggestion.isPending || applyCopyEditSuggestion.isPending}
                            >
                                {dismissCopyEditSuggestion.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Descartar
                            </Button>
                            <Button
                                type="button"
                                className="bg-[#004F8F] hover:bg-[#003c6d]"
                                onClick={handleApplyStakeholderSuggestion}
                                disabled={dismissCopyEditSuggestion.isPending || applyCopyEditSuggestion.isPending}
                            >
                                {applyCopyEditSuggestion.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Aplicar sugestão
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const handlePreviewEdit = () => {
        if (!selectedItem) return;
        setPreviewDialogOpen(false);
        handleEdit(selectedItem);
    };

    const renderPreview = () => {
        if (!selectedItem) return null;

        if (selectedItem.type === 'linkedin') {
            if (isLoadingCarousel) {
                return (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">Carregando slides...</span>
                    </div>
                );
            }

            const carousel = selectedContentData || selectedItem.full_data;
            const rawSlides = carousel?.slides;
            const slides = Array.isArray(rawSlides)
                ? rawSlides
                : (Array.isArray(rawSlides?.slides) ? rawSlides.slides : []);

            return (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">{carousel?.topic || selectedItem.title}</h3>
                        <div className="flex gap-2 items-center">
                            <Badge variant="secondary">Carrossel LinkedIn</Badge>
                            <Badge variant="secondary" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                IA
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm"><strong>Público-alvo:</strong> {carousel?.target_audience || selectedItem.full_data?.target_audience || 'N/A'}</p>
                        <p className="text-sm"><strong>Dor do Cliente:</strong> {carousel?.pain_point || selectedItem.full_data?.pain_point || 'N/A'}</p>
                        <p className="text-sm"><strong>Resultado Desejado:</strong> {carousel?.desired_outcome || 'N/A'}</p>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Slides ({slides.length})</h4>
                        {slides.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Nenhum slide disponível</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {slides.map((slide: any, idx: number) => (
                                    <Card key={idx} className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="aspect-square bg-slate-100 relative">
                                            {(slide.image_url || slide.imageUrl) ? (
                                                <ImageWithFallback
                                                    src={slide.image_url || slide.imageUrl}
                                                    alt={slide.headline}
                                                    className="w-full h-full object-cover"
                                                    fallbackClassName="w-full h-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                    <Sparkles className="h-8 w-8 text-slate-400" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-[10px] font-bold">
                                                SLIDE {idx + 1}
                                            </div>
                                        </div>
                                        <CardContent className="p-3 space-y-2">
                                            {/* Hide headline/body if text is burned into the image */}
                                            {!(slide.textPlacement === 'burned_in' || slide.text_placement === 'burned_in') && (
                                                <>
                                                    <h5 className="font-bold text-sm line-clamp-2">{slide.headline}</h5>
                                                    <p className="text-xs text-slate-600 line-clamp-3">{slide.body || slide.copy}</p>
                                                </>
                                            )}
                                            {(slide.textPlacement === 'burned_in' || slide.text_placement === 'burned_in') && (
                                                <p className="text-xs text-slate-400 italic">Texto na imagem</p>
                                            )}
                                            {slide.asset_source && (
                                                <Badge variant="outline" className={`text-[10px] ${slide.asset_source === 'real' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {slide.asset_source === 'real' ? 'Ativo Real' : 'IA Placeholder'}
                                                </Badge>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {carousel?.caption && (
                        <div className="p-4 bg-muted rounded-lg border border-primary/5">
                            <h4 className="font-semibold text-sm mb-2">Legenda Final</h4>
                            <p className="text-sm whitespace-pre-wrap text-slate-700">
                                {carousel.caption.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/_/g, '')}
                            </p>
                        </div>
                    )}

                    <div className="bg-muted/30 p-4 rounded-lg border border-primary/5">
                        <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">Checklist de Aprovacao</h5>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={linkedInChecklistForType.correctLogo} onChange={(e) => setLinkedInChecklistForType(prev => ({ ...prev, correctLogo: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Logo correto ou ausente</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={linkedInChecklistForType.brandIdentity} onChange={(e) => setLinkedInChecklistForType(prev => ({ ...prev, brandIdentity: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Identidade visual Lifetrek</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={linkedInChecklistForType.textQuality} onChange={(e) => setLinkedInChecklistForType(prev => ({ ...prev, textQuality: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Texto sem erros e com qualidade</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={linkedInChecklistForType.slideRelevance} onChange={(e) => setLinkedInChecklistForType(prev => ({ ...prev, slideRelevance: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Slides relevantes ao tema</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-2">
                        <Button
                            variant="outline"
                            className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                            onClick={() => handleRegenerateImages(selectedItem)}
                            disabled={isRegenerating}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                            {isRegenerating ? "Regenerando..." : "Regenerar Slides com IA"}
                        </Button>
                        <Button
                            variant="default"
                            className="gap-2 bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleEdit(selectedItem)}
                        >
                            <ImageIcon className="h-4 w-4" />
                            Editar Design
                        </Button>
                    </div>
                </div>
            );
        }

        if (selectedItem.type === 'blog') {
            const blog = selectedContentData || selectedItem.full_data;
            return (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">{blog.title}</h3>
                        {blog.excerpt && (
                            <p className="text-muted-foreground italic">{blog.excerpt}</p>
                        )}
                        <div className="flex gap-2 items-center mt-2">
                            <Badge variant="secondary">Blog</Badge>
                            {blog.ai_generated && (
                                <Badge variant="secondary" className="gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    IA
                                </Badge>
                            )}
                        </div>
                    </div>

                    {(blog.seo_title || blog.seo_description || blog.keywords?.length > 0) && (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">SEO</h4>
                            <div className="space-y-1 text-sm">
                                {blog.seo_title && <p><strong>Título SEO:</strong> {blog.seo_title}</p>}
                                {blog.seo_description && <p><strong>Descrição:</strong> {blog.seo_description}</p>}
                                {blog.keywords?.length > 0 && <p><strong>Keywords:</strong> {blog.keywords.join(', ')}</p>}
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Conteúdo</h4>
                        <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: blog.content?.substring(0, 20000) + (blog.content?.length > 20000 ? '...' : '') }}
                        />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-lg text-slate-800">Eleve o padrão da sua produção médica</h4>
                            <p className="text-sm text-slate-600">Descubra como a Lifetrek pode ajudar sua empresa a atingir excelência em manufatura e conformidade.</p>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm whitespace-nowrap">
                            Falar com Especialista
                        </Button>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-primary/5">
                        <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">Checklist de Aprovacao</h5>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={blogChecklist.seoFields} onChange={(e) => setBlogChecklist(prev => ({ ...prev, seoFields: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Campos SEO preenchidos</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={blogChecklist.textQuality} onChange={(e) => setBlogChecklist(prev => ({ ...prev, textQuality: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Texto sem erros e com qualidade</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={blogChecklist.featuredImage} onChange={(e) => setBlogChecklist(prev => ({ ...prev, featuredImage: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Imagem de capa presente</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={blogChecklist.contentComplete} onChange={(e) => setBlogChecklist(prev => ({ ...prev, contentComplete: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Conteudo completo</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t mt-4">
                        <Button
                            variant="outline"
                            className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                            onClick={() => handleRegenerateImages(selectedItem)}
                            disabled={isRegenerating}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                            {isRegenerating ? "Gerando..." : "Gerar Capa Editorial IA"}
                        </Button>
                    </div>
                </div>
            );
        }

        if (selectedItem.type === 'instagram') {
            if (isLoadingInstagram) {
                return (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">Carregando post...</span>
                    </div>
                );
            }

            const post = selectedContentData || selectedItem.full_data;

            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-4">
                                Prévia do Instagram
                            </h4>
                            <InstagramPostPreview post={post} />
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2">
                                Detalhes e Raciocínio
                            </h4>
                            <div className="space-y-3">
                                <p className="text-sm"><strong>Público-alvo:</strong> {post?.target_audience || 'N/A'}</p>
                                <p className="text-sm"><strong>Dor do Cliente:</strong> {post?.pain_point || 'N/A'}</p>
                                <p className="text-sm"><strong>Resultado Desejado:</strong> {post?.desired_outcome || 'N/A'}</p>
                                <p className="text-sm"><strong>Chamada para Ação:</strong> {post?.cta_action || 'N/A'}</p>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-lg border border-primary/5">
                                <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">Critérios de Aceitação</h5>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={acceptanceCriteria.correctLogo}
                                            onChange={(e) => setAcceptanceCriteria({ ...acceptanceCriteria, correctLogo: e.target.checked })}
                                            className="rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm group-hover:text-primary transition-colors">Logo correto ou ausente</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={acceptanceCriteria.brandIdentity}
                                            onChange={(e) => setAcceptanceCriteria({ ...acceptanceCriteria, brandIdentity: e.target.checked })}
                                            className="rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm group-hover:text-primary transition-colors">Identidade visual Lifetrek</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={acceptanceCriteria.noWordingMistakes}
                                            onChange={(e) => setAcceptanceCriteria({ ...acceptanceCriteria, noWordingMistakes: e.target.checked })}
                                            className="rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm group-hover:text-primary transition-colors">Sem erros de português/wording</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={acceptanceCriteria.hasAssets}
                                            onChange={(e) => setAcceptanceCriteria({ ...acceptanceCriteria, hasAssets: e.target.checked })}
                                            className="rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm group-hover:text-primary transition-colors">Contém assets reais (fotos/equipe)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                            onClick={() => handleRegenerateImages(selectedItem)}
                            disabled={isRegenerating}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                            {isRegenerating ? "Regenerando..." : "Regenerar Imagem com IA"}
                        </Button>
                    </div>
                </div>

            );
        }


        if (selectedItem.type === 'resource') {
            return (
                <div className="space-y-4">
                    <ResourcePreview resource={selectedItem} />
                    <div className="bg-muted/30 p-4 rounded-lg border border-primary/5 mx-4">
                        <h5 className="text-xs font-bold uppercase text-muted-foreground mb-2">Checklist de Aprovacao</h5>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={resourceChecklist.textQuality} onChange={(e) => setResourceChecklist(prev => ({ ...prev, textQuality: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Texto sem erros e com qualidade</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={resourceChecklist.contentComplete} onChange={(e) => setResourceChecklist(prev => ({ ...prev, contentComplete: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Conteudo completo</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={resourceChecklist.interactiveElements} onChange={(e) => setResourceChecklist(prev => ({ ...prev, interactiveElements: e.target.checked }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <span className="text-sm group-hover:text-primary transition-colors">Elementos interativos funcionais</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end px-4 pb-4">
                        <Button
                            variant="outline"
                            className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                            onClick={() => handleRegenerateImages(selectedItem)}
                            disabled={isRegenerating}
                        >
                            <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                            {isRegenerating ? "Regenerando..." : "Gerar Capa IA (Mockup)"}
                        </Button>
                    </div>
                </div>
            );
        }

        return <div className="p-4">Visualização para {selectedItem.title} pronta para revisão.</div>;
    };

    if (isLoading || isLoadingRejected || isLoadingApproved) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const allPending = items || [];

    const sortItems = (items: any[]) => {
        return [...items].sort((a, b) => {
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });
    };

    const filterItems = (items: any[]) => {
        return sortItems(items.filter(item => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                item.title?.toLowerCase().includes(searchLower) ||
                item.content_preview?.toLowerCase().includes(searchLower) ||
                item.type?.toLowerCase().includes(searchLower)
            );
        }));
    };

    // Filter logic according to user requirements
    const approvalItems = filterItems(allPending.filter(item => {
        if (item.type === 'blog') return true;
        if (item.type === 'resource') return true;

        return item.status === 'pending_approval';
    }));

    const draftItems = filterItems(allPending.filter(item => {
        if (item.type !== 'linkedin' && item.type !== 'instagram') return false;

        const hasImages = item.type === 'linkedin'
            ? (Array.isArray(item.full_data?.slides) && item.full_data.slides.some((s: any) => s.image_url || s.imageUrl))
            : (Array.isArray(item.full_data?.image_urls) && item.full_data.image_urls.length > 0);

        return item.status === 'draft' || !hasImages;
    }));

    const blogItems = approvalItems.filter(i => i.type === 'blog');
    const linkedInItems = approvalItems.filter(i => i.type === 'linkedin');
    const instagramItems = approvalItems.filter(i => i.type === 'instagram');
    const resourceItems = approvalItems.filter(i => i.type === 'resource');

    const displayApproved = filterItems(approvedItems || []);
    const displayRejected = filterItems(rejectedItems || []);
    const displayStakeholderPending = filterItems(stakeholderPendingItems || []);
    const displayStakeholderApproved = filterItems(stakeholderApprovedItems || []);
    const displayStakeholderRejected = filterItems(stakeholderRejectedItems || []);
    const displayStakeholderSuggestions = filterItems(stakeholderSuggestionItems || []);
    const sendEligibleApprovedItems = displayApproved.filter(isStakeholderSendEligible);
    const selectedSendItems = sendEligibleApprovedItems.filter((item) => selectedSendIds.has(item.id));

    return (
        <div className={`space-y-6 ${embedded ? '' : 'container mx-auto max-w-7xl py-8'}`}>
            {!embedded && (
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Aprovação de Conteúdo</h1>
                        <p className="text-muted-foreground">Revise e orquestre o conteúdo gerado por IA com precisão</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCleanDuplicates}
                            disabled={isCleaning}
                            className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 shadow-sm"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isCleaning ? "Limpando..." : "Limpar Duplicados"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSyncResources}
                            disabled={isSyncing}
                            className="gap-2 shadow-sm"
                        >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? "Sincronizando..." : "Sincronizar"}
                        </Button>
                    </div>
                </div>
            )}

            {errorPending && <ErrorBanner error={errorPending} context="itens pendentes" onRetry={() => refetchPending()} className="mb-6" />}
            {errorRejected && <ErrorBanner error={errorRejected} context="itens rejeitados" onRetry={() => refetchRejected()} className="mb-6" />}
            {errorApproved && <ErrorBanner error={errorApproved} context="itens aprovados" onRetry={() => refetchApproved()} className="mb-6" />}

            {!embedded && <NewsletterDistributionSystemCard />}

            <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 p-4 rounded-xl border border-primary/5 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar por título, tipo ou conteúdo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-10 bg-white border-primary/10 transition-all focus:ring-primary/20"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <ListFilter className="h-4 w-4 text-muted-foreground hidden md:block" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as ContentApprovalSort)}
                        className="h-10 rounded-md border border-primary/10 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-40"
                    >
                        <option value="newest">Mais recentes</option>
                        <option value="oldest">Mais antigos</option>
                        <option value="title">Título (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* Batch Action Bar */}
            {selectedIds.length > 0 && !["approved", "stakeholder-review", "stakeholder-approved", "stakeholder-rejected", "stakeholder-suggestions"].includes(activeTab) && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <Card className="bg-slate-900 text-white shadow-2xl border-none p-2 flex items-center gap-4 px-6 rounded-full overflow-hidden">
                        <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />
                        <span className="text-sm font-bold whitespace-nowrap z-10">{selectedIds.length} selecionados</span>
                        <div className="h-4 w-[1px] bg-white/20 z-10" />
                        <div className="flex items-center gap-1 z-10">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-white/10 rounded-full h-9 gap-2 px-4 shadow-none"
                                onClick={() => requestBatchApproval([...(items || []), ...(rejectedItems || []), ...(approvedItems || [])].filter(i => selectedIds.includes(i.id)))}
                                disabled={isBatchProcessing}
                            >
                                <ThumbsUp className="h-4 w-4" /> Aprovar
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:bg-white/10 rounded-full h-9 gap-2 px-4 shadow-none"
                                onClick={openBatchRejectDialog}
                                disabled={isBatchProcessing}
                            >
                                <ThumbsDown className="h-4 w-4" /> Rejeitar
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-9 px-4 shadow-none"
                                onClick={() => setSelectedIds([])}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === "approved" && selectedSendItems.length > 0 && (
                <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 animate-in slide-in-from-bottom-4 duration-300">
                    <Card className="overflow-hidden border-none bg-[#004F8F] p-2 text-white shadow-2xl">
                        <div className="flex flex-col gap-3 rounded-full px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/14">
                                    <Send className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">
                                        {selectedSendItems.length} {selectedSendItems.length === 1 ? "post selecionado" : "posts selecionados"}
                                    </p>
                                    <p className="text-xs text-white/80">
                                        Envio para revisão externa dos stakeholders.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:justify-end">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 rounded-full px-4 text-white/80 hover:bg-white/10 hover:text-white"
                                    onClick={() => setSelectedSendIds(new Set())}
                                >
                                    Limpar
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-9 rounded-full bg-white px-4 text-[#004F8F] hover:bg-slate-100"
                                    onClick={() => setSendReviewModalOpen(true)}
                                >
                                    Enviar para Aprovação
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {isBatchProcessing && (
                <div className="fixed top-0 left-0 right-0 z-[100] h-1.5 bg-slate-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${batchProgress}%` }}
                    />
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 flex h-auto w-full flex-wrap items-center justify-start gap-2 bg-slate-100/50 p-2">
                    <TabsTrigger value="all" className="py-2">Geral ({approvalItems.length})</TabsTrigger>
                    {!embedded && (
                        <>
                            <TabsTrigger value="blogs" className="py-2 text-blue-600">Blogs ({blogItems.length})</TabsTrigger>
                            <TabsTrigger value="resources" className="py-2 text-amber-600">Recursos ({resourceItems.length})</TabsTrigger>
                        </>
                    )}
                    <TabsTrigger value="approved" className="py-2 text-green-600">Aprovados ({displayApproved.length})</TabsTrigger>
                    <TabsTrigger value="stakeholder-review" className="py-2 text-sky-700">Em revisão ({displayStakeholderPending.length})</TabsTrigger>
                    <TabsTrigger value="stakeholder-approved" className="py-2 text-emerald-700">Aprovado ✓ ({displayStakeholderApproved.length})</TabsTrigger>
                    <TabsTrigger value="stakeholder-rejected" className="py-2 text-rose-700">Rejeitado ({displayStakeholderRejected.length})</TabsTrigger>
                    <TabsTrigger value="stakeholder-suggestions" className="py-2 text-amber-700">Sugestões ({displayStakeholderSuggestions.length})</TabsTrigger>
                    <TabsTrigger value="rejected" className="py-2 text-rose-600">Rejeitados ({displayRejected.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Approval Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h2 className="text-xl font-bold">Itens para Aprovação</h2>
                                <Badge variant="secondary" className="bg-green-100 text-green-700 font-bold">{approvalItems.length}</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                                {approvalItems.length > 0 && (
                                    <div className="flex items-center gap-2 mr-4 border-r pr-4">
                                        <Checkbox
                                            id="select-all-approval"
                                            checked={approvalItems.every(i => selectedIds.includes(i.id)) && approvalItems.length > 0}
                                            onCheckedChange={() => selectAllInCategory(approvalItems)}
                                        />
                                        <label htmlFor="select-all-approval" className="text-xs font-medium cursor-pointer text-muted-foreground">Selecionar Todos</label>
                                    </div>
                                )}
                                {approvalItems.length > 0 && (
                                    <Button
                                        size="sm"
                                        onClick={() => requestBatchApproval(approvalItems)}
                                        disabled={isBatchProcessing}
                                        className="bg-green-600 hover:bg-green-700 gap-2 shadow-sm"
                                    >
                                        {isBatchProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                                        Aprovar Todos
                                    </Button>
                                )}
                            </div>
                        </div>

                        {approvalItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                                <Sparkles className="h-12 w-12 text-slate-300 mb-4" />
                                <p className="text-slate-500 font-medium">Tudo em dia! Nenhum item pendente.</p>
                                <p className="text-slate-400 text-sm">Gere mais blogs ou atualize a biblioteca de recursos.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {approvalItems.map((item) => (
                                    <ContentItemCard
                                        key={item.id}
                                        item={item}
                                        onPreview={handlePreview}
                                        onApprove={requestApproval}
                                        onReject={(item) => { setSelectedItem(item); setRejectDialogOpen(true); }}
                                        onEdit={handleEdit}
                                        navigationQuery={getNavigationQuery()}
                                        isSelected={selectedIds.includes(item.id)}
                                        onSelect={toggleSelect}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Drafts Section */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2 border-b pb-3">
                            <Clock className="h-5 w-5 text-amber-600" />
                            <h2 className="text-xl font-bold">Rascunhos e Ideias</h2>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{draftItems.length}</Badge>
                        </div>

                        {draftItems.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground italic bg-slate-50/30 rounded-xl border border-dashed">
                                Nenhum rascunho pendente.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {draftItems.map((item) => (
                                    <ContentItemCard
                                        key={item.id}
                                        item={item}
                                        onPreview={handlePreview}
                                        onApprove={requestApproval}
                                        onReject={(item) => { setSelectedItem(item); setRejectDialogOpen(true); }}
                                        onEdit={handleEdit}
                                        navigationQuery={getNavigationQuery()}
                                        isSelected={selectedIds.includes(item.id)}
                                        onSelect={toggleSelect}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="approved" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h2 className="text-xl font-bold">Itens Aprovados</h2>
                                <Badge variant="secondary" className="bg-green-100 text-green-700 font-bold">{displayApproved.length}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Selecione posts aprovados para enviar aos stakeholders. Recursos seguem disponíveis só para pré-visualização e agendamento.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {sendEligibleApprovedItems.length > 0 ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="h-auto px-0 text-sm text-[#004F8F]"
                                        onClick={() => setAllSendSelections(sendEligibleApprovedItems)}
                                    >
                                        {sendEligibleApprovedItems.length > 0 && selectedSendItems.length === sendEligibleApprovedItems.length
                                            ? "Limpar seleção"
                                            : "Selecionar todos"}
                                    </Button>
                                    <Badge variant="outline" className="border-[#004F8F]/20 bg-[#004F8F]/5 text-[#004F8F]">
                                        {sendEligibleApprovedItems.length} elegíveis para envio
                                    </Badge>
                                </>
                            ) : null}
                        </div>
                    </div>
                    {displayApproved.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhum item aprovado ainda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayApproved.map((item) => (
                                <ContentItemCard
                                    key={item.id}
                                    item={item}
                                    onPreview={handlePreview}
                                    onApprove={() => { }}
                                    onReject={() => { }}
                                    onSchedule={(item) => { setSchedulingItem(item); setIsSchedulingOpen(true); }}
                                    navigationQuery={getNavigationQuery()}
                                    isApprovedView
                                    isSelected={selectedSendIds.has(item.id)}
                                    onSelect={isStakeholderSendEligible(item) ? toggleSendSelection : undefined}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="stakeholder-review" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-sky-700" />
                            <h2 className="text-xl font-bold">Posts em revisão externa</h2>
                            <Badge variant="secondary" className="bg-sky-100 text-sky-700 font-bold">{displayStakeholderPending.length}</Badge>
                        </div>
                    </div>
                    {displayStakeholderPending.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhum post aguardando revisão externa.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayStakeholderPending.map((item) => (
                                <ContentItemCard
                                    key={item.id}
                                    item={item}
                                    onPreview={handlePreview}
                                    onApprove={() => { }}
                                    onReject={() => { }}
                                    navigationQuery={getNavigationQuery()}
                                    isApprovedView
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="stakeholder-approved" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-700" />
                            <h2 className="text-xl font-bold">Posts aprovados pelo stakeholder</h2>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-bold">{displayStakeholderApproved.length}</Badge>
                        </div>
                    </div>
                    {displayStakeholderApproved.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhum post aprovado pelo stakeholder.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayStakeholderApproved.map((item) => (
                                <ContentItemCard
                                    key={item.id}
                                    item={item}
                                    onPreview={handlePreview}
                                    onApprove={() => { }}
                                    onReject={() => { }}
                                    navigationQuery={getNavigationQuery()}
                                    isApprovedView
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="stakeholder-rejected" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-700" />
                            <h2 className="text-xl font-bold">Posts rejeitados pelo stakeholder</h2>
                            <Badge variant="secondary" className="bg-rose-100 text-rose-700 font-bold">{displayStakeholderRejected.length}</Badge>
                        </div>
                    </div>
                    {displayStakeholderRejected.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            <ThumbsDown className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhum post rejeitado pelo stakeholder.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayStakeholderRejected.map((item) => (
                                <ContentItemCard
                                    key={item.id}
                                    item={item}
                                    onPreview={handlePreview}
                                    onApprove={() => { }}
                                    onReject={() => { }}
                                    navigationQuery={getNavigationQuery()}
                                    isApprovedView
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="stakeholder-suggestions" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-600" />
                            <h2 className="text-xl font-bold">Sugestões de cópia</h2>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold">{displayStakeholderSuggestions.length}</Badge>
                        </div>
                    </div>
                    {displayStakeholderSuggestions.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhuma sugestão pendente no momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayStakeholderSuggestions.map((item) => (
                                <ContentItemCard
                                    key={item.id}
                                    item={item}
                                    onPreview={handlePreview}
                                    onApprove={() => { }}
                                    onReject={() => { }}
                                    navigationQuery={getNavigationQuery()}
                                    isApprovedView
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-600" />
                            <h2 className="text-xl font-bold">Itens Rejeitados</h2>
                            <Badge variant="secondary" className="bg-rose-100 text-rose-700 font-bold">{displayRejected.length}</Badge>
                        </div>
                    </div>
                    {displayRejected.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            <ThumbsDown className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhum item rejeitado encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayRejected.map((item) => (
                                <ContentItemCard
                                    key={item.id}
                                    item={item}
                                    onPreview={handlePreview}
                                    onApprove={requestApproval}
                                    onReject={() => { }}
                                    navigationQuery={getNavigationQuery()}
                                    isSelected={selectedIds.includes(item.id)}
                                    onSelect={toggleSelect}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="blogs" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <h2 className="text-xl font-bold">Blog Posts</h2>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold">{blogItems.length}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            {blogItems.length > 0 && (
                                <div className="flex items-center gap-2 mr-4 border-r pr-4">
                                    <Checkbox
                                        id="select-all-blogs"
                                        checked={blogItems.every(i => selectedIds.includes(i.id)) && blogItems.length > 0}
                                        onCheckedChange={() => selectAllInCategory(blogItems)}
                                    />
                                    <label htmlFor="select-all-blogs" className="text-xs font-medium cursor-pointer text-muted-foreground">Selecionar Todos</label>
                                </div>
                            )}
                            {blogItems.length > 0 && (
                                <Button size="sm" onClick={() => requestBatchApproval(blogItems)} disabled={isBatchProcessing} className="bg-blue-600 hover:bg-blue-700 gap-2">
                                    <ThumbsUp className="h-4 w-4" /> Aprovar Todos
                                </Button>
                            )}
                        </div>
                    </div>
                    {blogItems.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            Nenhum blog pendente.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {blogItems.map((item) => <ContentItemCard key={item.id} item={item} onPreview={handlePreview} onApprove={requestApproval} onReject={(item) => { setSelectedItem(item); setRejectDialogOpen(true); }} onEdit={handleEdit} navigationQuery={getNavigationQuery()} isSelected={selectedIds.includes(item.id)} onSelect={toggleSelect} />)}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="linkedin" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <Linkedin className="h-5 w-5 text-blue-600" />
                            <h2 className="text-xl font-bold">LinkedIn Posts</h2>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold">{linkedInItems.length}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            {linkedInItems.length > 0 && (
                                <div className="flex items-center gap-2 mr-4 border-r pr-4">
                                    <Checkbox
                                        id="select-all-linkedin"
                                        checked={linkedInItems.every(i => selectedIds.includes(i.id)) && linkedInItems.length > 0}
                                        onCheckedChange={() => selectAllInCategory(linkedInItems)}
                                    />
                                    <label htmlFor="select-all-linkedin" className="text-xs font-medium cursor-pointer text-muted-foreground">Selecionar Todos</label>
                                </div>
                            )}
                            {linkedInItems.length > 0 && (
                                <Button size="sm" onClick={() => requestBatchApproval(linkedInItems)} disabled={isBatchProcessing} className="bg-blue-700 hover:bg-blue-800 gap-2">
                                    <ThumbsUp className="h-4 w-4" /> Aprovar Todos
                                </Button>
                            )}
                        </div>
                    </div>
                    {linkedInItems.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            Nenhum post LinkedIn pendente.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {linkedInItems.map((item) => (
                                <ContentItemCard
                                    key={item.id}
                                    item={item}
                                    onPreview={handlePreview}
                                    onApprove={requestApproval}
                                    onReject={(item) => { setSelectedItem(item); setRejectDialogOpen(true); }}
                                    onEdit={handleEdit}
                                    navigationQuery={getNavigationQuery()}
                                    isSelected={selectedIds.includes(item.id)}
                                    onSelect={toggleSelect}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="instagram" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <Instagram className="h-5 w-5 text-pink-500" />
                            <h2 className="text-xl font-bold">Instagram Posts</h2>
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700 font-bold">{instagramItems.length}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            {instagramItems.length > 0 && (
                                <div className="flex items-center gap-2 mr-4 border-r pr-4">
                                    <Checkbox
                                        id="select-all-instagram"
                                        checked={instagramItems.every(i => selectedIds.includes(i.id)) && instagramItems.length > 0}
                                        onCheckedChange={() => selectAllInCategory(instagramItems)}
                                    />
                                    <label htmlFor="select-all-instagram" className="text-xs font-medium cursor-pointer text-muted-foreground">Selecionar Todos</label>
                                </div>
                            )}
                            {instagramItems.length > 0 && (
                                <Button size="sm" onClick={() => requestBatchApproval(instagramItems)} disabled={isBatchProcessing} className="bg-pink-600 hover:bg-pink-700 gap-2">
                                    <ThumbsUp className="h-4 w-4" /> Aprovar Todos
                                </Button>
                            )}
                        </div>
                    </div>
                    {instagramItems.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            Nenhum post Instagram pendente.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {instagramItems.map((item) => (
                                <ContentItemCard
                                    key={item.id}
                                    item={item}
                                    onPreview={handlePreview}
                                    onApprove={requestApproval}
                                    onReject={(item) => { setSelectedItem(item); setRejectDialogOpen(true); }}
                                    onEdit={handleEdit}
                                    navigationQuery={getNavigationQuery()}
                                    isSelected={selectedIds.includes(item.id)}
                                    onSelect={toggleSelect}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="resources" className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-amber-600" />
                            <h2 className="text-xl font-bold">Recursos e E-books</h2>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold">{resourceItems.length}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            {resourceItems.length > 0 && (
                                <div className="flex items-center gap-2 mr-4 border-r pr-4">
                                    <Checkbox
                                        id="select-all-resources"
                                        checked={resourceItems.every(i => selectedIds.includes(i.id)) && resourceItems.length > 0}
                                        onCheckedChange={() => selectAllInCategory(resourceItems)}
                                    />
                                    <label htmlFor="select-all-resources" className="text-xs font-medium cursor-pointer text-muted-foreground">Selecionar Todos</label>
                                </div>
                            )}
                            {resourceItems.length > 0 && (
                                <Button size="sm" onClick={() => requestBatchApproval(resourceItems)} disabled={isBatchProcessing} className="bg-amber-600 hover:bg-amber-700 gap-2">
                                    <ThumbsUp className="h-4 w-4" /> Aprovar Todos
                                </Button>
                            )}
                        </div>
                    </div>
                    {resourceItems.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed text-muted-foreground">
                            Nenhum recurso pendente.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {resourceItems.map((item) => (
                                <ContentItemCard
                                    key={item.id}
                                    item={item}
                                    onPreview={handlePreview}
                                    onApprove={requestApproval}
                                    onReject={(item) => { setSelectedItem(item); setRejectDialogOpen(true); }}
                                    onEdit={handleEdit}
                                    navigationQuery={getNavigationQuery()}
                                    isSelected={selectedIds.includes(item.id)}
                                    onSelect={toggleSelect}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Pré-visualização</DialogTitle>
                        <DialogDescription>
                            Visualize o conteúdo gerado antes de aprovar ou rejeitar.
                        </DialogDescription>
                    </DialogHeader>
                    {previewApprovalBlockers.messages.length > 0 && (
                        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 space-y-3">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-destructive">Aprovação bloqueada até corrigir os itens abaixo.</p>
                                <ul className="list-disc pl-5 text-sm text-destructive space-y-1">
                                    {previewApprovalBlockers.messages.map((message) => (
                                        <li key={message}>{message}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {previewApprovalBlockers.canRegenerateImages && selectedItem && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => handleRegenerateImages(selectedItem)}
                                        disabled={isRegenerating}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                                        {isRegenerating ? "Regenerando..." : "Regenerar Imagens"}
                                    </Button>
                                )}
                                {previewApprovalBlockers.canEdit && selectedItem && (
                                    <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={handlePreviewEdit}>
                                        Editar
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    {renderPreview()}
                    {renderStakeholderReviewPanel()}
                    {showPreviewDecisionActions && (
                        <DialogFooter className="gap-2 sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setPreviewDialogOpen(false);
                                    setRejectDialogOpen(true);
                                }}
                            >
                                Rejeitar
                            </Button>
                            {canApproveSelectedItem ? (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setPreviewDialogOpen(false);
                                        requestApproval(selectedItem);
                                    }}
                                    disabled={approveLinkedIn.isPending || approveBlog.isPending || approveInstagram.isPending || approveResource.isPending || !isChecklistComplete}
                                    className="gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    {(approveLinkedIn.isPending || approveBlog.isPending || approveInstagram.isPending || approveResource.isPending) ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    {!isChecklistComplete ? "Complete o Checklist" : "Aprovar Conteúdo"}
                                </Button>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span tabIndex={0}>
                                            <Button type="button" disabled className="gap-2">
                                                <Check className="h-4 w-4" />
                                                Aprovar Conteúdo
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-sm">
                                        {previewApprovalBlockers.messages.join(" ")}
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar Conteúdo</DialogTitle>
                        <DialogDescription>
                            Explique o motivo da rejeição para que o sistema ou o autor possa ajustar o conteúdo.
                        </DialogDescription>
                    </DialogHeader>
                    <textarea
                        className="w-full h-32 p-3 rounded-md border text-sm"
                        placeholder="Por que este conteúdo foi rejeitado?"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleReject}>Confirmar Rejeição</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isSchedulingOpen} onOpenChange={setIsSchedulingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agendar Publicação</DialogTitle>
                        <DialogDescription>
                            Selecione a data e hora para a publicação automática nas redes sociais.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex justify-center border rounded-md p-2">
                            <input
                                type="datetime-local"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={scheduledDate ? format(scheduledDate, "yyyy-MM-dd'T'HH:mm") : ""}
                                onChange={(e) => {
                                    const dateString = e.target.value;
                                    if (!dateString) {
                                        setScheduledDate(undefined);
                                        return;
                                    }
                                    const newDate = new Date(dateString);
                                    if (!isNaN(newDate.getTime())) {
                                        setScheduledDate(newDate);
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSchedulingOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSchedule} className="bg-blue-600 hover:bg-blue-700">Confirmar Agendamento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SendReviewModal
                open={sendReviewModalOpen}
                onOpenChange={setSendReviewModalOpen}
                posts={selectedSendItems}
                onSent={async () => {
                    setSelectedSendIds(new Set());
                    setActiveTab("stakeholder-review");
                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ["approved_content_items"] }),
                        queryClient.invalidateQueries({ queryKey: ["stakeholder-review-status-items"] }),
                        queryClient.invalidateQueries({ queryKey: ["stakeholder-review-items"] }),
                        queryClient.invalidateQueries({ queryKey: ["stakeholder-review-suggestion-items"] }),
                        queryClient.invalidateQueries({ queryKey: ["linkedin_carousels"] }),
                        queryClient.invalidateQueries({ queryKey: ["instagram_posts"] }),
                        queryClient.invalidateQueries({ queryKey: ["blog-posts"] }),
                    ]);
                }}
            />

            {/* Single Approval Confirmation */}
            <AlertDialog open={!!approvalConfirmItem} onOpenChange={(open) => { if (!open) setApprovalConfirmItem(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Aprovacao</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja aprovar "{approvalConfirmItem?.title}"? O conteudo sera marcado como aprovado e ficara disponivel para publicacao.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmApproval}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Confirmar Aprovacao
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Batch Approval Confirmation */}
            <AlertDialog open={!!batchApprovalConfirmItems} onOpenChange={(open) => { if (!open) setBatchApprovalConfirmItems(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Aprovar em Massa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja aprovar {batchApprovalConfirmItems?.length || 0} itens? Todos serao marcados como aprovados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmBatchApproval}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Aprovar {batchApprovalConfirmItems?.length || 0} Itens
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Batch Reject Dialog */}
            <Dialog open={batchRejectDialogOpen} onOpenChange={setBatchRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeitar {selectedIds.length} Itens</DialogTitle>
                        <DialogDescription>
                            Informe o motivo da rejeicao. Este motivo sera aplicado a todos os {selectedIds.length} itens selecionados.
                        </DialogDescription>
                    </DialogHeader>
                    <textarea
                        className="w-full h-32 p-3 rounded-md border text-sm"
                        placeholder="Motivo da rejeicao em massa..."
                        value={batchRejectReason}
                        onChange={(e) => setBatchRejectReason(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBatchRejectDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleBatchRejectSelected} disabled={!batchRejectReason.trim()}>
                            Rejeitar {selectedIds.length} Itens
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
    // End of component
}


import { useState } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Check, Eye, FileText, Linkedin, Instagram, Sparkles, Clock,
    ThumbsUp, ThumbsDown, Loader2, RefreshCw, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
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
    usePublishBlogPost,
    useUpdateBlogPost
} from "@/hooks/useBlogPosts";
import {
    useApproveInstagramPost,
    useRejectInstagramPost,
    useInstagramPost,
} from "@/hooks/useInstagramPosts";
import { BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { InstagramPostPreview } from "./InstagramPostPreview";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    AlertCircle,
    Trash2,
    ChevronRight,
    ShieldCheck,
    Image as ImageIcon
} from "lucide-react";

interface ContentApprovalCoreProps {
    embedded?: boolean;
}

export function ContentApprovalCore({ embedded = false }: ContentApprovalCoreProps) {
    const queryClient = useQueryClient();

    const { data: items, isLoading } = useContentApprovalItems();
    const { data: rejectedItems, isLoading: isLoadingRejected } = useRejectedContentItems();
    const { data: approvedItems, isLoading: isLoadingApproved } = useApprovedContentItems();
    const approveLinkedIn = useApproveLinkedInPost();
    const rejectLinkedIn = useRejectLinkedInPost();
    const publishBlog = usePublishBlogPost();
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

    const isAccepted = Object.values(acceptanceCriteria).every(v => v);

    const selectedLinkedInId = selectedItem?.type === 'linkedin' ? selectedItem.id : null;
    const { data: fullCarouselData, isLoading: isLoadingCarousel } = useLinkedInCarouselFull(selectedLinkedInId);

    const selectedInstagramId = selectedItem?.type === 'instagram' ? selectedItem.id : null;
    const { data: fullInstagramData, isLoading: isLoadingInstagram } = useInstagramPost(selectedInstagramId);

    const handleSyncResources = async () => {
        setIsSyncing(true);
        try {
            toast.info("Sincronizando recursos...");
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`);
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
                        dup.type === 'instagram' ? 'instagram_posts' : 'content_templates';

                await supabase.from(tableName as any).delete().eq('id', dup.id);
            }

            toast.success(`${duplicates.length} duplicados removidos.`);
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
        } catch (error: any) {
            toast.error(`Erro ao limpar: ${error.message}`);
        } finally {
            setIsCleaning(false);
        }
    };

    const handlePreview = (item: any) => {
        setSelectedItem(item);
        setPreviewDialogOpen(true);
    };

    const handleApprove = async (item: any) => {
        try {
            if (item.type === 'blog') {
                await publishBlog.mutateAsync(item.id);
            } else if (item.type === 'linkedin') {
                await approveLinkedIn.mutateAsync(item.id);
            } else if (item.type === 'instagram') {
                await approveInstagram.mutateAsync(item.id);
            } else if (item.type === 'resource') {
                await approveResource.mutateAsync(item.id);
            }
        } catch (error) {
            console.error('Error approving:', error);
        }
    };

    const handleReject = async () => {
        if (!selectedItem || !rejectionReason.trim()) {
            toast.error("Por favor, informe o motivo da rejeição");
            return;
        }

        try {
            if (selectedItem.type === 'blog') {
                await updateBlog.mutateAsync({ id: selectedItem.id, status: 'rejected' });
            } else if (selectedItem.type === 'linkedin') {
                await rejectLinkedIn.mutateAsync({ id: selectedItem.id, reason: rejectionReason });
            } else if (selectedItem.type === 'instagram') {
                await rejectInstagram.mutateAsync({ id: selectedItem.id, reason: rejectionReason });
            } else if (selectedItem.type === 'resource') {
                await rejectResource.mutateAsync({ id: selectedItem.id, reason: rejectionReason });
            }
            setRejectDialogOpen(false);
            setRejectionReason("");
            setSelectedItem(null);
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
        } catch (error) {
            console.error('Error rejecting:', error);
        }
    };

    const handleSchedule = async () => {
        if (!schedulingItem || !scheduledDate) return;

        try {
            const tableName = schedulingItem.type === 'linkedin' ? 'linkedin_carousels' :
                schedulingItem.type === 'blog' ? 'blog_posts' :
                    schedulingItem.type === 'instagram' ? 'instagram_posts' : 'content_templates';

            const { error } = await (supabase
                .from(tableName as any)
                .update({
                    scheduled_date: scheduledDate.toISOString(),
                    status: 'scheduled'
                } as any) as any)
                .eq('id', schedulingItem.id);

            if (error) throw error;

            toast.success("Post agendado com sucesso!");
            setIsSchedulingOpen(false);
            await queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
            await queryClient.invalidateQueries({ queryKey: ["approved_content_items"] });
        } catch (error: any) {
            toast.error(`Erro ao agendar: ${error.message}`);
        }
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

            const carousel = fullCarouselData || selectedItem.full_data;
            const rawSlides = carousel?.slides;
            const slides = Array.isArray(rawSlides)
                ? rawSlides
                : (Array.isArray(rawSlides?.slides) ? rawSlides.slides : []);

            return (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">{carousel?.topic || selectedItem.title}</h3>
                        <div className="flex gap-2 items-center">
                            <Badge variant="secondary">LinkedIn Carousel</Badge>
                            <Badge variant="secondary" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                IA
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm"><strong>Público-alvo:</strong> {carousel?.target_audience || selectedItem.full_data?.target_audience || 'N/A'}</p>
                        <p className="text-sm"><strong>Pain Point:</strong> {carousel?.pain_point || selectedItem.full_data?.pain_point || 'N/A'}</p>
                        <p className="text-sm"><strong>Outcome Desejado:</strong> {carousel?.desired_outcome || 'N/A'}</p>
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
                                                <img
                                                    src={slide.image_url || slide.imageUrl}
                                                    alt={slide.headline}
                                                    className="w-full h-full object-cover"
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
                                            <h5 className="font-bold text-sm line-clamp-2">{slide.headline}</h5>
                                            <p className="text-xs text-slate-600 line-clamp-3">{slide.body || slide.copy}</p>
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
                </div>
            );
        }

        if (selectedItem.type === 'blog') {
            const blog = selectedItem.full_data;
            return (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">{blog.title}</h3>
                        {blog.excerpt && (
                            <p className="text-muted-foreground italic">{blog.excerpt}</p>
                        )}
                        <Button
                            onClick={() => handleApprove(selectedItem)}
                            disabled={approveLinkedIn.isPending || publishBlog.isPending || approveInstagram.isPending || (selectedItem.type === 'instagram' && !isAccepted)}
                            className="gap-2"
                        >
                            {(approveLinkedIn.isPending || publishBlog.isPending || approveInstagram.isPending) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            {selectedItem.type === 'instagram' && !isAccepted ? "Aprovação Bloqueada" : "Aprovar Conteúdo"}
                        </Button>
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
                            dangerouslySetInnerHTML={{ __html: blog.content?.substring(0, 2000) + (blog.content?.length > 2000 ? '...' : '') }}
                        />
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

            const post = fullInstagramData || selectedItem.full_data;

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
                                <p className="text-sm"><strong>Público:</strong> {post?.target_audience || 'N/A'}</p>
                                <p className="text-sm"><strong>Pain Point:</strong> {post?.pain_point || 'N/A'}</p>
                                <p className="text-sm"><strong>Resultado:</strong> {post?.desired_outcome || 'N/A'}</p>
                                <p className="text-sm"><strong>CTA:</strong> {post?.cta_action || 'N/A'}</p>
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
                    </div>
                </div>
            );
        }

        if (selectedItem.type === 'resource') {
            const resource = selectedItem.full_data || {};
            return (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold">{selectedItem.title}</h3>
                        {resource.description && (
                            <p className="text-sm text-slate-600">{resource.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                            {resource.type && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                                    Tipo: {resource.type}
                                </Badge>
                            )}
                            {resource.persona && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                                    Persona: {resource.persona}
                                </Badge>
                            )}
                            {resource.slug && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                                    Slug: {resource.slug}
                                </Badge>
                            )}
                            {resource.status && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                                    Status: {resource.status}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {resource.content && (
                        <div className="rounded-lg border bg-white p-5">
                            <div className="prose prose-base md:prose-lg max-w-none leading-relaxed">
                                <ReactMarkdown>{resource.content}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {resource.slug && (
                        <div className="text-xs text-muted-foreground">
                            Rota pública: <span className="font-medium text-slate-700">/resources/{resource.slug}</span>
                        </div>
                    )}
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
    const blogItems = allPending.filter(i => i.type === 'blog');
    const linkedInItems = allPending.filter(i => i.type === 'linkedin');
    const instagramItems = allPending.filter(i => i.type === 'instagram');
    const resourceItems = allPending.filter(i => i.type === 'resource');

    return (
        <div className={`space-y-6 ${embedded ? '' : 'container mx-auto max-w-7xl py-8'}`}>
            {!embedded && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Aprovação de Conteúdo</h1>
                        <p className="text-muted-foreground">Revise o conteúdo gerado por IA antes da publicação</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCleanDuplicates}
                            disabled={isCleaning}
                            className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                        >
                            <Trash2 className="h-4 w-4" />
                            {isCleaning ? "Limpando..." : "Limpar Duplicados"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSyncResources}
                            disabled={isSyncing}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? "Sincronizando..." : "Sincronizar"}
                        </Button>
                    </div>
                </div>
            )}

            <Tabs defaultValue="all" className="w-full">
                <TabsList className={`grid w-full ${embedded ? 'grid-cols-3' : 'grid-cols-7'} mb-6`}>
                    <TabsTrigger value="all">Pendentes ({allPending.length})</TabsTrigger>
                    {!embedded && (
                        <>
                            <TabsTrigger value="blogs">Blogs ({blogItems.length})</TabsTrigger>
                            <TabsTrigger value="linkedin">LinkedIn ({linkedInItems.length})</TabsTrigger>
                            <TabsTrigger value="instagram">Instagram ({instagramItems.length})</TabsTrigger>
                            <TabsTrigger value="resources">Recursos ({resourceItems.length})</TabsTrigger>
                        </>
                    )}
                    <TabsTrigger value="approved">Aprovados ({approvedItems?.length || 0})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejeitados ({rejectedItems?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {allPending.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Tudo pronto!</h3>
                            <p className="text-muted-foreground">Não há itens pendentes de aprovação.</p>
                        </div>
                    ) : (
                        allPending.map((item) => (
                            <Card key={item.id} className="bg-background/50 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                {item.type === 'blog' ? (
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                ) : item.type === 'resource' ? (
                                                    <BookOpen className="h-4 w-4 text-amber-600" />
                                                ) : item.type === 'instagram' ? (
                                                    <Instagram className="h-4 w-4 text-pink-500" />
                                                ) : (
                                                    <Linkedin className="h-4 w-4 text-blue-600" />
                                                )}
                                                <CardTitle className="text-base">{item.title}</CardTitle>
                                            </div>
                                            <CardDescription className="line-clamp-2">{item.content_preview}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handlePreview(item)} className="gap-2">
                                        <Eye className="h-4 w-4" /> Ver
                                    </Button>
                                    <Button size="sm" onClick={() => handleApprove(item)} className="gap-2 bg-green-600 hover:bg-green-700">
                                        <ThumbsUp className="h-4 w-4" /> Aprovar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => { setSelectedItem(item); setRejectDialogOpen(true); }} className="gap-2">
                                        <ThumbsDown className="h-4 w-4" /> Rejeitar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
                <TabsContent value="approved" className="space-y-4">
                    {(!approvedItems || approvedItems.length === 0) ? (
                        <div className="text-center py-12">
                            <Clock className="h-12 w-12 mx-auto text-blue-500 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Nenhum item aprovado</h3>
                            <p className="text-muted-foreground">Itens aprovados aparecerão aqui para agendamento.</p>
                        </div>
                    ) : (
                        approvedItems.map((item) => {
                            const imageUrl = item.image_urls?.[0] || item.full_data?.image_urls?.[0] || item.full_data?.slides?.[0]?.imageUrl || item.full_data?.slides?.[0]?.image_url;
                            return (
                                <Card key={item.id} className="bg-background/50 backdrop-blur-sm border-primary/5 flex overflow-hidden">
                                    {imageUrl && (
                                        <div className="w-32 h-auto bg-slate-100 relative shrink-0">
                                            <img
                                                src={imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover absolute inset-0"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    {item.type === 'blog' ? (
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                    ) : item.type === 'resource' ? (
                                                        <BookOpen className="h-4 w-4 text-amber-600" />
                                                    ) : item.type === 'instagram' ? (
                                                        <Instagram className="h-4 w-4 text-pink-500" />
                                                    ) : (
                                                        <Linkedin className="h-4 w-4 text-blue-600" />
                                                    )}
                                                    <CardTitle className="text-base">{item.title}</CardTitle>
                                                </div>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovado</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handlePreview(item)} className="gap-2">
                                                <Eye className="h-4 w-4" /> Ver
                                            </Button>
                                            <Button size="sm" onClick={() => { setSchedulingItem(item); setIsSchedulingOpen(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                                <Clock className="h-4 w-4" /> Agendar
                                            </Button>
                                        </CardContent>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </TabsContent>

                <TabsContent value="blogs" className="space-y-4">
                    {blogItems.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Nenhum blog pendente</h3>
                            <p className="text-muted-foreground">Blogs pendentes aparecerão aqui para revisão.</p>
                        </div>
                    ) : (
                        blogItems.map((item) => (
                            <Card key={item.id} className="bg-background/50 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                <CardTitle className="text-base">{item.title}</CardTitle>
                                            </div>
                                            <CardDescription className="line-clamp-2">{item.content_preview}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handlePreview(item)} className="gap-2">
                                        <Eye className="h-4 w-4" /> Ver
                                    </Button>
                                    <Button size="sm" onClick={() => handleApprove(item)} className="gap-2 bg-green-600 hover:bg-green-700">
                                        <ThumbsUp className="h-4 w-4" /> Aprovar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => { setSelectedItem(item); setRejectDialogOpen(true); }} className="gap-2">
                                        <ThumbsDown className="h-4 w-4" /> Rejeitar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="linkedin" className="space-y-4">
                    {linkedInItems.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Nenhum post LinkedIn pendente</h3>
                            <p className="text-muted-foreground">Posts do LinkedIn pendentes aparecerão aqui para revisão.</p>
                        </div>
                    ) : (
                        linkedInItems.map((item) => (
                            <Card key={item.id} className="bg-background/50 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Linkedin className="h-4 w-4 text-blue-600" />
                                                <CardTitle className="text-base">{item.title}</CardTitle>
                                            </div>
                                            <CardDescription className="line-clamp-2">{item.content_preview}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handlePreview(item)} className="gap-2">
                                        <Eye className="h-4 w-4" /> Ver
                                    </Button>
                                    <Button size="sm" onClick={() => handleApprove(item)} className="gap-2 bg-green-600 hover:bg-green-700">
                                        <ThumbsUp className="h-4 w-4" /> Aprovar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => { setSelectedItem(item); setRejectDialogOpen(true); }} className="gap-2">
                                        <ThumbsDown className="h-4 w-4" /> Rejeitar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="instagram" className="space-y-4">
                    {instagramItems.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Nenhum post Instagram pendente</h3>
                            <p className="text-muted-foreground">Posts do Instagram pendentes aparecerão aqui para revisão.</p>
                        </div>
                    ) : (
                        instagramItems.map((item) => (
                            <Card key={item.id} className="bg-background/50 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Instagram className="h-4 w-4 text-pink-500" />
                                                <CardTitle className="text-base">{item.title}</CardTitle>
                                            </div>
                                            <CardDescription className="line-clamp-2">{item.content_preview}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handlePreview(item)} className="gap-2">
                                        <Eye className="h-4 w-4" /> Ver
                                    </Button>
                                    <Button size="sm" onClick={() => handleApprove(item)} className="gap-2 bg-green-600 hover:bg-green-700">
                                        <ThumbsUp className="h-4 w-4" /> Aprovar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => { setSelectedItem(item); setRejectDialogOpen(true); }} className="gap-2">
                                        <ThumbsDown className="h-4 w-4" /> Rejeitar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="resources" className="space-y-4">
                    {resourceItems.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Nenhum recurso pendente</h3>
                            <p className="text-muted-foreground">Recursos pendentes aparecerão aqui para revisão.</p>
                        </div>
                    ) : (
                        resourceItems.map((item) => (
                            <Card key={item.id} className="bg-background/50 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-amber-600" />
                                                <CardTitle className="text-base">{item.title}</CardTitle>
                                            </div>
                                            <CardDescription className="line-clamp-2">{item.content_preview}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handlePreview(item)} className="gap-2">
                                        <Eye className="h-4 w-4" /> Ver
                                    </Button>
                                    <Button size="sm" onClick={() => handleApprove(item)} className="gap-2 bg-green-600 hover:bg-green-700">
                                        <ThumbsUp className="h-4 w-4" /> Aprovar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => { setSelectedItem(item); setRejectDialogOpen(true); }} className="gap-2">
                                        <ThumbsDown className="h-4 w-4" /> Rejeitar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Pré-visualização</DialogTitle></DialogHeader>
                    {renderPreview()}
                </DialogContent>
            </Dialog>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Rejeitar Conteúdo</DialogTitle></DialogHeader>
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
                    <DialogHeader><DialogTitle>Agendar Publicação</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-muted-foreground">Selecione a data e hora para a publicação automática.</p>
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
        </div>
    );
}

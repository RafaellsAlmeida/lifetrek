import { useState } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Check, Eye, FileText, Linkedin, Sparkles, Clock,
    ThumbsUp, ThumbsDown, ArrowLeft, Loader2, Archive, CheckCircle, Download, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
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
import { BookOpen, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import JSZip from 'jszip';

export default function ContentApproval() {
    const navigate = useNavigate();
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

    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regenerationLogs, setRegenerationLogs] = useState<string[]>([]);

    // Lazy load full carousel data when previewing LinkedIn posts
    const selectedLinkedInId = selectedItem?.type === 'linkedin' ? selectedItem.id : null;
    const { data: fullCarouselData, isLoading: isLoadingCarousel } = useLinkedInCarouselFull(selectedLinkedInId);

    // Download carousel as ZIP
    const downloadCarouselAsZip = async (carousel: any) => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            const rawSlides = carousel?.slides;
            const slides = Array.isArray(rawSlides)
                ? rawSlides
                : (Array.isArray(rawSlides?.slides) ? rawSlides.slides : []);

            let downloadedCount = 0;
            for (let i = 0; i < slides.length; i++) {
                const slide = slides[i];
                if (slide.imageUrl) {
                    try {
                        if (slide.imageUrl.startsWith('data:image')) {
                            // Base64 - extract and add
                            const base64Data = slide.imageUrl.split(',')[1];
                            zip.file(`slide-${i + 1}.png`, base64Data, { base64: true });
                            downloadedCount++;
                        } else {
                            // URL - fetch and add
                            const response = await fetch(slide.imageUrl);
                            if (response.ok) {
                                const blob = await response.blob();
                                const ext = blob.type.split('/')[1] || 'png';
                                zip.file(`slide-${i + 1}.${ext}`, blob);
                                downloadedCount++;
                            }
                        }
                    } catch (imgErr) {
                        console.warn(`Failed to download slide ${i + 1}:`, imgErr);
                    }
                }
            }

            // Add caption as text file
            if (carousel.caption) {
                const cleanCaption = carousel.caption
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/__/g, '')
                    .replace(/_/g, '');
                zip.file('caption.txt', cleanCaption);
            }

            if (downloadedCount === 0) {
                toast.error("Nenhuma imagem disponível para download");
                return;
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            const safeTopic = (carousel.topic || 'carousel').slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-');
            a.download = `carousel-${safeTopic}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(`Download concluído: ${downloadedCount} imagens`);
        } catch (error) {
            console.error('Download error:', error);
            toast.error("Erro ao gerar download");
        } finally {
            setIsDownloading(false);
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
                await updateBlog.mutateAsync({
                    id: selectedItem.id,
                    status: 'rejected',
                });
            } else if (selectedItem.type === 'linkedin') {
                await rejectLinkedIn.mutateAsync({
                    id: selectedItem.id,
                    reason: rejectionReason,
                });
            } else if (selectedItem.type === 'resource') {
                await rejectResource.mutateAsync({
                    id: selectedItem.id,
                    reason: rejectionReason,
                });
            }
            setRejectDialogOpen(false);
            setRejectionReason("");
            setSelectedItem(null);
        } catch (error) {
            console.error('Error rejecting:', error);
        }
    };

    const openRejectDialog = (item: any) => {
        setSelectedItem(item);
        setRejectDialogOpen(true);
    };

    // Regenerate carousel images using premium prompts
    const handleRegenerateImages = async (carouselId: string) => {
        setIsRegenerating(true);
        setRegenerationLogs([]);
        try {
            toast.info("Regenerando imagens com prompt premium...", { duration: 10000 });

            const { data, error } = await supabase.functions.invoke("regenerate-carousel-images", {
                body: { carousel_id: carouselId },
            });

            if (error) {
                console.error("[RegenerateImages] Function error:", error);
                throw error;
            }

            const logs = Array.isArray((data as any)?.logs) ? ((data as any).logs as string[]) : [];
            setRegenerationLogs(logs);

            toast.success(`Slides regenerados com sucesso.`);

            // Refresh cached data without leaving the page
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["content_approval_items"] }),
                queryClient.invalidateQueries({ queryKey: ["linkedin_carousels"] }),
                queryClient.invalidateQueries({ queryKey: ["linkedin_carousel", carouselId] }),
                queryClient.invalidateQueries({ queryKey: ["linkedin_carousel_full", carouselId] }),
            ]);
        } catch (error) {
            console.error("Regenerate error:", error);
            setRegenerationLogs([
                "[UI] Erro ao regenerar imagens.",
                error instanceof Error ? error.message : String(error),
            ]);
            toast.error(error instanceof Error ? error.message : "Erro ao regenerar imagens");
        } finally {
            setIsRegenerating(false);
        }
    };

    const renderPreview = () => {
        if (!selectedItem) return null;

        if (selectedItem.type === 'blog') {
            const blog = selectedItem.full_data;
            return (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">{blog.title}</h3>
                        {blog.excerpt && (
                            <p className="text-muted-foreground italic">{blog.excerpt}</p>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">SEO</h4>
                        <div className="space-y-1 text-sm">
                            <p><strong>Título SEO:</strong> {blog.seo_title || 'N/A'}</p>
                            <p><strong>Descrição:</strong> {blog.seo_description || 'N/A'}</p>
                            <p><strong>Keywords:</strong> {blog.keywords?.join(', ') || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Conteúdo</h4>
                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: blog.content.substring(0, 1000) + '...' }}
                        />
                    </div>
                </div>
            );
        } else if (selectedItem.type === 'linkedin') {
            // Use lazy-loaded full data for LinkedIn carousels
            if (isLoadingCarousel) {
                return (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">Carregando slides...</span>
                    </div>
                );
            }

            // Use full carousel data if available, otherwise fall back to basic data
            const post = fullCarouselData || selectedItem.full_data || selectedItem;

            // Handle nested slides structure
            const rawSlides = post?.slides;
            const slides = Array.isArray(rawSlides)
                ? rawSlides
                : (Array.isArray(rawSlides?.slides) ? rawSlides.slides : []);

            return (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">{post?.topic || selectedItem.title}</h3>
                        <div className="flex gap-2 items-center">
                            <Badge variant="secondary">
                                LinkedIn Carousel
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                IA
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm"><strong>Público-alvo:</strong> {post?.target_audience || selectedItem.full_data?.target_audience || 'N/A'}</p>
                        <p className="text-sm"><strong>Pain Point:</strong> {post?.pain_point || selectedItem.full_data?.pain_point || 'N/A'}</p>
                        <p className="text-sm"><strong>Outcome Desejado:</strong> {post?.desired_outcome || 'N/A'}</p>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Slides ({slides.length})</h4>
                        {slides.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Nenhum slide disponível</p>
                        ) : (
                            <div className="space-y-3">
                                {slides.map((slide: any, idx: number) => (
                                    <Card key={idx}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline">{slide.type || `Slide ${idx + 1}`}</Badge>
                                                {slide.imageUrl && <Eye className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <p className="font-semibold">{slide.headline}</p>
                                            <p className="text-sm text-muted-foreground">{slide.body}</p>
                                            {slide.imageUrl && (
                                                <img
                                                    src={slide.imageUrl}
                                                    alt={`Slide ${idx + 1}`}
                                                    className="rounded-md w-full mt-2"
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {post?.caption && (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Caption LinkedIn</h4>
                            <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                                {post.caption.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/_/g, '')}
                            </p>
                        </div>
                    )}
                </div>
            );
        } else if (selectedItem.type === 'resource') {
            const resource = selectedItem.full_data;
            return (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-2xl font-bold mb-2">{resource.title}</h3>
                        <div className="flex gap-2 items-center">
                            <Badge variant="secondary">
                                {resource.type?.charAt(0).toUpperCase() + resource.type?.slice(1) || 'Recurso'}
                            </Badge>
                            <Badge variant="outline">
                                Persona: {resource.persona || 'N/A'}
                            </Badge>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Descrição</h4>
                        <p className="text-muted-foreground">{resource.description}</p>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Conteúdo (Markdown)</h4>
                        <div className="bg-muted p-4 rounded-md overflow-x-auto">
                            <pre className="text-xs whitespace-pre-wrap">{resource.content}</pre>
                        </div>
                    </div>
                </div>
            );
        }
    };

    if (isLoading || isLoadingRejected || isLoadingApproved) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const blogItems = items?.filter(i => i.type === 'blog') || [];
    const linkedInItems = items?.filter(i => i.type === 'linkedin') || [];
    const resourceItems = items?.filter(i => i.type === 'resource') || [];
    const allPending = items || [];
    const allRejected = rejectedItems || [];
    const allApproved = approvedItems || [];

    return (
        <div className="container mx-auto max-w-7xl py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/admin')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Aprovação de Conteúdo</h1>
                        <p className="text-muted-foreground">
                            Revise e aprove conteúdo gerado por IA antes da publicação
                        </p>
                    </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                    <Clock className="h-4 w-4 mr-2" />
                    {allPending.length} pendente(s)
                </Badge>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-6 mb-8">
                    <TabsTrigger value="all">Todos ({allPending.length})</TabsTrigger>
                    <TabsTrigger value="blogs">Blogs ({blogItems.length})</TabsTrigger>
                    <TabsTrigger value="linkedin">LinkedIn ({linkedInItems.length})</TabsTrigger>
                    <TabsTrigger value="resources">Recursos ({resourceItems.length})</TabsTrigger>
                    <TabsTrigger value="approved">Aprovados ({allApproved.length})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejeitados ({allRejected.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {allPending.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center">
                                <Check className="h-16 w-16 mx-auto mb-4 text-green-500" />
                                <h3 className="text-xl font-semibold mb-2">Tudo aprovado!</h3>
                                <p className="text-muted-foreground">
                                    Não há conteúdo pendente de aprovação no momento.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        allPending.map((item) => (
                            <Card key={`${item.type}-${item.id}`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                {item.type === 'blog' ? (
                                                    <FileText className="h-5 w-5 text-blue-500" />
                                                ) : item.type === 'linkedin' ? (
                                                    <Linkedin className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <BookOpen className="h-5 w-5 text-purple-600" />
                                                )}
                                                <CardTitle className="text-lg">{item.title}</CardTitle>
                                            </div>
                                            <CardDescription>{item.content_preview}</CardDescription>
                                            <div className="flex gap-2 items-center">
                                                <Badge variant="outline">
                                                    {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </Badge>
                                                {item.ai_generated && (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <Sparkles className="h-3 w-3" />
                                                        Gerado por IA
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => handlePreview(item)}
                                            className="gap-2"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Visualizar
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={() => handleApprove(item)}
                                            className="gap-2 bg-green-600 hover:bg-green-700"
                                            disabled={approveLinkedIn.isPending || publishBlog.isPending || approveResource.isPending}
                                        >
                                            <ThumbsUp className="h-4 w-4" />
                                            Aprovar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => openRejectDialog(item)}
                                            className="gap-2"
                                            disabled={rejectLinkedIn.isPending || updateBlog.isPending || rejectResource.isPending}
                                        >
                                            <ThumbsDown className="h-4 w-4" />
                                            Rejeitar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>

            <Dialog
                open={previewDialogOpen}
                onOpenChange={(open) => {
                    setPreviewDialogOpen(open);
                    if (!open) setRegenerationLogs([]);
                }}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Pré-visualização</DialogTitle>
                    </DialogHeader>
                    {renderPreview()}
                    <DialogFooter>
                        <Button onClick={() => setPreviewDialogOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Rejeitar</DialogTitle></DialogHeader>
                    <textarea
                        className="w-full border p-2"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Motivo..."
                    />
                    <DialogFooter>
                        <Button onClick={handleReject}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

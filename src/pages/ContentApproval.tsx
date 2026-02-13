import { useState } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Check, X, Eye, FileText, Linkedin, Instagram, Sparkles, Clock,
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
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  const approveInstagram = useApproveInstagramPost();
  const rejectInstagram = useRejectInstagramPost();
  const approveBlog = useApproveBlogPost();
  const updateBlog = useUpdateBlogPost();

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

  // Lazy load full Instagram post data when previewing
  const selectedInstagramId = selectedItem?.type === 'instagram' ? selectedItem.id : null;
  const { data: fullInstagramData, isLoading: isLoadingInstagram } = useInstagramPost(selectedInstagramId);

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
        await approveBlog.mutateAsync(item.id);
        } else if (item.type === 'linkedin') {
        await approveLinkedIn.mutateAsync(item.id);
        } else if (item.type === 'instagram') {
        await approveInstagram.mutateAsync(item.id);
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
      } else if (selectedItem.type === 'instagram') {
        await rejectInstagram.mutateAsync({
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

      toast.success(`✅ ${data?.slides_regenerated ?? 0} slides regenerados (${data?.images_generated ?? 0} imagens).`);

      // Refresh cached data without leaving the page
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["content_approval_items"] }),
        queryClient.invalidateQueries({ queryKey: ["linkedin_carousels"] }),
        queryClient.invalidateQueries({ queryKey: ["linkedin_carousel", carouselId] }),
        queryClient.invalidateQueries({ queryKey: ["linkedin_carousel_full", carouselId] }),
      ]);

      // Keep the preview open and keep the user on the same page
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
    } else if (selectedItem.type === 'instagram') {
      if (isLoadingInstagram) {
        return (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Carregando post...</span>
          </div>
        );
      }

      const post = fullInstagramData || selectedItem.full_data;
      const hashtags = post?.hashtags || [];

      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">{post?.topic || selectedItem.title}</h3>
            <div className="flex gap-2 items-center">
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Instagram
              </Badge>
              <Badge variant="outline">{post?.post_type || 'carousel'}</Badge>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                IA
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm"><strong>Público-alvo:</strong> {post?.target_audience || 'N/A'}</p>
            <p className="text-sm"><strong>Pain Point:</strong> {post?.pain_point || 'N/A'}</p>
            <p className="text-sm"><strong>Outcome Desejado:</strong> {post?.desired_outcome || 'N/A'}</p>
            <p className="text-sm"><strong>CTA:</strong> {post?.cta_action || 'N/A'}</p>
          </div>

          {post?.caption && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Caption Instagram</h4>
              <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                {post.caption}
              </p>
            </div>
          )}

          {hashtags.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Hashtags</h4>
              <div className="flex flex-wrap gap-1">
                {hashtags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs text-blue-600">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
      
      // Handle nested slides structure: post.slides can be { slides: [...], metadata: {...} } or just [...]
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
  const instagramItems = items?.filter(i => i.type === 'instagram') || [];
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
          <TabsTrigger value="all" className="text-base">
            Pendentes ({allPending.length})
          </TabsTrigger>
          <TabsTrigger value="blogs" className="text-base">
            <FileText className="h-4 w-4 mr-2" />
            Blogs ({blogItems.length})
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="text-base">
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn ({linkedInItems.length})
          </TabsTrigger>
          <TabsTrigger value="instagram" className="text-base">
            <Instagram className="h-4 w-4 mr-2" />
            Instagram ({instagramItems.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-base text-green-600">
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovados ({allApproved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-base text-destructive">
            <Archive className="h-4 w-4 mr-2" />
            Rejeitados ({allRejected.length})
          </TabsTrigger>
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
                        ) : item.type === 'instagram' ? (
                          <Instagram className="h-5 w-5 text-pink-500" />
                        ) : (
                          <Linkedin className="h-5 w-5 text-blue-600" />
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
                      disabled={approveLinkedIn.isPending || approveBlog.isPending}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openRejectDialog(item)}
                      className="gap-2"
                      disabled={rejectLinkedIn.isPending || updateBlog.isPending}
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

        <TabsContent value="blogs" className="space-y-4">
          {blogItems.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Nenhum blog pendente de aprovação
              </CardContent>
            </Card>
          ) : (
            blogItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
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
                      disabled={approveBlog.isPending}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openRejectDialog(item)}
                      className="gap-2"
                      disabled={updateBlog.isPending}
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

        <TabsContent value="linkedin" className="space-y-4">
          {linkedInItems.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Nenhum post do LinkedIn pendente de aprovação
              </CardContent>
            </Card>
          ) : (
            linkedInItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-5 w-5 text-blue-600" />
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
                      disabled={approveLinkedIn.isPending}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openRejectDialog(item)}
                      className="gap-2"
                      disabled={rejectLinkedIn.isPending}
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

        <TabsContent value="instagram" className="space-y-4">
          {instagramItems.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Nenhum post do Instagram pendente de aprovação
              </CardContent>
            </Card>
          ) : (
            instagramItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-pink-500" />
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
                      disabled={approveInstagram.isPending}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openRejectDialog(item)}
                      className="gap-2"
                      disabled={rejectInstagram.isPending}
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

        <TabsContent value="approved" className="space-y-4">
          {allApproved.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Nenhum conteúdo aprovado
              </CardContent>
            </Card>
          ) : (
            allApproved.map((item: any) => (
              <Card key={`${item.type}-${item.id}`} className="border-green-500/30 bg-green-500/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {item.type === 'blog' ? (
                          <FileText className="h-5 w-5 text-blue-500" />
                        ) : item.type === 'instagram' ? (
                          <Instagram className="h-5 w-5 text-pink-500" />
                        ) : (
                          <Linkedin className="h-5 w-5 text-blue-600" />
                        )}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.content_preview}</CardDescription>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge variant="outline">
                          {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </Badge>
                        <Badge className="gap-1 bg-green-600">
                          <Check className="h-3 w-3" />
                          {item.status === 'published' ? 'Publicado' : 'Aprovado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => handlePreview(item)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {allRejected.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Nenhum conteúdo rejeitado
              </CardContent>
            </Card>
          ) : (
            allRejected.map((item: any) => (
              <Card key={`${item.type}-${item.id}`} className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {item.type === 'blog' ? (
                          <FileText className="h-5 w-5 text-blue-500" />
                        ) : item.type === 'instagram' ? (
                          <Instagram className="h-5 w-5 text-pink-500" />
                        ) : (
                          <Linkedin className="h-5 w-5 text-blue-600" />
                        )}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.content_preview}</CardDescription>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge variant="outline">
                          {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </Badge>
                        {item.rejected_at && (
                          <Badge variant="destructive" className="gap-1">
                            <X className="h-3 w-3" />
                            Rejeitado em {format(new Date(item.rejected_at), "dd/MM/yyyy", { locale: ptBR })}
                          </Badge>
                        )}
                      </div>
                      {item.rejection_reason && (
                        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md mt-2">
                          <p className="text-sm font-medium text-destructive">Motivo da rejeição:</p>
                          <p className="text-sm text-muted-foreground">{item.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={() => handlePreview(item)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onOpenChange={(open) => {
          setPreviewDialogOpen(open);
          if (!open) setRegenerationLogs([]);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.type === "blog"
                ? "Pré-visualização do Blog"
                : selectedItem?.type === "instagram"
                ? "Pré-visualização do Post Instagram"
                : "Pré-visualização do Post LinkedIn"}
            </DialogTitle>
            <DialogDescription>
              Revise o conteúdo e, se necessário, regenere as imagens. Os logs da regeneração aparecem abaixo.
            </DialogDescription>
          </DialogHeader>

          {renderPreview()}

          {selectedItem?.type === "linkedin" && regenerationLogs.length > 0 && (
            <section className="space-y-2 border rounded-md p-3 bg-muted">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Logs da regeneração</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(regenerationLogs.join("\n"));
                      toast.success("Logs copiados");
                    } catch {
                      toast.error("Não foi possível copiar os logs");
                    }
                  }}
                >
                  Copiar
                </Button>
              </div>
              <pre className="text-xs whitespace-pre-wrap break-words max-h-56 overflow-y-auto">
                {regenerationLogs.join("\n")}
              </pre>
            </section>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Fechar
            </Button>
            {selectedItem?.type === "linkedin" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleRegenerateImages(selectedItem.id)}
                  disabled={isRegenerating || isLoadingCarousel}
                  className="gap-2"
                >
                  {isRegenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerar Imagens
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => downloadCarouselAsZip(fullCarouselData || selectedItem.full_data)}
                  disabled={isDownloading || isLoadingCarousel}
                  className="gap-2"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Baixar ZIP
                </Button>
              </>
            )}
            <Button
              variant="default"
              onClick={() => {
                setPreviewDialogOpen(false);
                handleApprove(selectedItem);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Conteúdo</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, informe o motivo da rejeição para feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRejectionReason("");
              setSelectedItem(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

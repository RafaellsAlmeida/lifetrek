import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  useBlogPosts,
  useBlogCategories,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  usePublishBlogPost,
} from "@/hooks/useBlogPosts";
import { BlogPost, BlogPostInsert } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Check,
  FileText,
  Sparkles,
  ArrowLeft,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { BLOG_TOPICS } from "@/config/blogTopics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminBlog = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentTopic: string } | null>(null);

  const { data: posts, isLoading: postsLoading } = useBlogPosts(false);
  const { data: categories } = useBlogCategories();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const publishPost = usePublishBlogPost();

  const [formData, setFormData] = useState<BlogPostInsert>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category_id: null,
    seo_title: "",
    seo_description: "",
    keywords: [],
    tags: [],
    status: "draft",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles?.some((r) => r.role === "admin")) {
      navigate("/admin/login");
      return;
    }

    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }

    try {
      if (editingPost) {
        await updatePost.mutateAsync({ id: editingPost.id, ...formData });
      } else {
        await createPost.mutateAsync(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      category_id: null,
      seo_title: "",
      seo_description: "",
      keywords: [],
      tags: [],
      status: "draft",
    });
    setEditingPost(null);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      category_id: post.category_id || null,
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
      keywords: post.keywords || [],
      tags: post.tags || [],
      status: post.status,
    });
    setIsDialogOpen(true);
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: { generateNews: true },
      });

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          slug: generateSlug(data.title),
          content: data.content,
          excerpt: data.excerpt,
          category_id: null,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          keywords: data.keywords || [],
          tags: data.tags || [],
          status: "pending_review",
          ai_generated: true,
          news_sources: data.sources || [],
        });
        toast.success("Artigo gerado com IA!");
      }
    } catch (error) {
      console.error("Error generating blog post:", error);
      toast.error("Erro ao gerar artigo com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!window.confirm(`Isso irá gerar ${BLOG_TOPICS.length} artigos. Pode levar vários minutos. Continuar?`)) {
      return;
    }

    setIsGenerating(true);
    setBatchProgress({ current: 0, total: BLOG_TOPICS.length, currentTopic: "" });
    let successCount = 0;

    for (const [index, topic] of BLOG_TOPICS.entries()) {
      setBatchProgress({ 
        current: index + 1, 
        total: BLOG_TOPICS.length, 
        currentTopic: topic.topic 
      });

      try {
        console.log(`Generating: ${topic.topic}`);
        // 1. Generate Content
        const { data: generatedData, error: genError } = await supabase.functions.invoke("generate-blog-post", {
          body: { 
            topic: topic.topic, 
            category: topic.category,
            // We can pass keywords if the edge function supports it, or let AI decide.
            // keeping it simple for now based on current edge function signature.
          },
        });

        if (genError) throw genError;

        if (generatedData) {
          // 2. Save directly to DB
          const newPost: BlogPostInsert = {
            title: generatedData.title,
            slug: generateSlug(generatedData.title),
            content: generatedData.content,
            excerpt: generatedData.excerpt || "",
            featured_image: generatedData.featured_image || generatedData.hero_image_url || undefined,
            hero_image_url: generatedData.hero_image_url || generatedData.featured_image || undefined,
            // Map category string to ID if possible, or leave empty/default. 
            // The edge function returns a category string, but our DB expects a UUID usually if relational, 
            // BUT looking at formData state 'category_id' is a string. 
            // Ideally we'd map "educacional" -> uuid. For now, let's leave flexible or try to find a match.
            category_id: categories?.find(c => c.name.toLowerCase() === topic.category.toLowerCase())?.id || null,
            seo_title: generatedData.seo_title,
            seo_description: generatedData.seo_description,
            keywords: generatedData.keywords || topic.keywords,
            tags: generatedData.tags || [],
            status: "pending_review", // AI generated posts go to review
            ai_generated: true,
            news_sources: generatedData.sources || [],
          };

          await createPost.mutateAsync(newPost);
          successCount++;
        }
        
      } catch (error) {
        console.error(`Failed to generate topic: ${topic.topic}`, error);
        toast.error(`Falha ao gerar: ${topic.topic}`);
      }
      
      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsGenerating(false);
    setBatchProgress(null);
    toast.success(`Batch concluído! ${successCount}/${BLOG_TOPICS.length} artigos gerados.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Publicado</Badge>;
      case "pending_review":
        return <Badge className="bg-yellow-500">Aguardando Revisão</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Rascunho</Badge>;
    }
  };

  // Group topics by month
  const topicsByMonth = BLOG_TOPICS.reduce((acc, topic) => {
    if (!acc[topic.month]) {
      acc[topic.month] = [];
    }
    acc[topic.month].push(topic);
    return acc;
  }, {} as Record<string, typeof BLOG_TOPICS>);

  const generatePostForTopic = async (topic: typeof BLOG_TOPICS[0]) => {
    setIsGenerating(true);
    setBatchProgress({ current: 0, total: 1, currentTopic: topic.topic });
    
    try {
      console.log(`Generating: ${topic.topic}`);
      // 1. Generate Content
      const { data: generatedData, error: genError } = await supabase.functions.invoke("generate-blog-post", {
        body: { 
          topic: topic.topic, 
          category: topic.category,
        },
      });

      if (genError) throw genError;

      if (generatedData) {
        // 2. Save directly to DB
        const newPost: BlogPostInsert = {
          title: generatedData.title,
          slug: generateSlug(generatedData.title),
          content: generatedData.content,
          excerpt: generatedData.excerpt || "",
          featured_image: generatedData.featured_image || generatedData.hero_image_url || undefined,
          hero_image_url: generatedData.hero_image_url || generatedData.featured_image || undefined,
          category_id: categories?.find(c => c.name.toLowerCase() === topic.category.toLowerCase())?.id || null,
          seo_title: generatedData.seo_title,
          seo_description: generatedData.seo_description,
          keywords: generatedData.keywords || topic.keywords,
          tags: generatedData.tags || [],
          status: "pending_review", 
          ai_generated: true,
          news_sources: generatedData.sources || [],
        };

        await createPost.mutateAsync(newPost);
        toast.success(`Artigo "${topic.topic}" gerado com sucesso!`);
      }
      
    } catch (error) {
      console.error(`Failed to generate topic: ${topic.topic}`, error);
      toast.error(`Falha ao gerar: ${topic.topic}`);
    } finally {
      setIsGenerating(false);
      setBatchProgress(null);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Blog</h1>
              <p className="text-muted-foreground">Crie e gerencie artigos do blog</p>
            </div>
          </div>

          <div className="flex gap-2">
            
            {/* Batch Progress Bar Overlay/Indicator */}
            {batchProgress && (
              <div className="fixed bottom-4 right-4 bg-background border p-4 rounded-lg shadow-lg z-50 min-w-[300px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Gerando...</span>
                  <span className="text-xs text-muted-foreground">{batchProgress.current}/{batchProgress.total}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs truncate text-muted-foreground max-w-[280px]">
                  {batchProgress.currentTopic}
                </p>
              </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Artigo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPost ? "Editar Artigo" : "Novo Artigo"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ... (keep form content as is, omitted for brevity if possible, but replace needs context) ... */}
                  {/* Actually, I need to keep the form accessible. 
                      Since I am replacing a big chunk, I'll assume the form logic inside Dialog is fine. 
                      I will just re-paste the triggers and the dialog content if I had to replace it.
                      But wait, I am replacing from "if (isLoading)" onwards. 
                      So I need to re-include everything.
                   */}
                   <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Gerar com IA
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Título do artigo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="url-do-artigo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Resumo</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData({ ...formData, excerpt: e.target.value })
                      }
                      placeholder="Breve resumo do artigo"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo * (HTML)</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Conteúdo do artigo em HTML"
                      rows={15}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'draft' | 'pending_review' | 'published' | 'rejected') =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="pending_review">
                            Aguardando Revisão
                          </SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">SEO</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="seo_title">Título SEO</Label>
                        <Input
                          id="seo_title"
                          value={formData.seo_title}
                          onChange={(e) =>
                            setFormData({ ...formData, seo_title: e.target.value })
                          }
                          placeholder="Título para SEO (máx 60 caracteres)"
                          maxLength={60}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seo_description">Meta Description</Label>
                        <Textarea
                          id="seo_description"
                          value={formData.seo_description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              seo_description: e.target.value,
                            })
                          }
                          placeholder="Descrição para SEO (máx 160 caracteres)"
                          maxLength={160}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (separadas por vírgula)</Label>
                        <Input
                          id="keywords"
                          value={formData.keywords?.join(", ") || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              keywords: e.target.value.split(",").map((k) => k.trim()),
                            })
                          }
                          placeholder="palavra1, palavra2, palavra3"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
                      {(createPost.isPending || updatePost.isPending) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {editingPost ? "Salvar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Publicados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {posts?.filter((p) => p.status === "published").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Aguardando Revisão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {posts?.filter((p) => p.status === "pending_review").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Rascunhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {posts?.filter((p) => p.status === "draft").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABS FOR VIEWS */}
        <Tabs defaultValue="campaign" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="campaign">Visão de Campanha</TabsTrigger>
            <TabsTrigger value="list">Lista de Artigos</TabsTrigger>
          </TabsList>

          <TabsContent value="campaign">
            <div className="space-y-8">
              <div className="flex justify-end p-4 bg-muted/20 rounded-lg">
                <Button 
                    variant="outline" 
                    onClick={handleBatchGenerate}
                    disabled={isGenerating}
                    className="gap-2"
                  >
                    {isGenerating && batchProgress?.total && batchProgress.total > 1 ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                    Gerar Todos ({BLOG_TOPICS.length})
                </Button>
              </div>

              {Object.entries(topicsByMonth).map(([month, topics]) => (
                <Card key={month}>
                  <CardHeader>
                    <CardTitle className="capitalize">{month}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tópico</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Keywords</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topics.map((topic, idx) => {
                          // Find matching post logic (simplistic match by title inclusion or exact match)
                          const matchingPost = posts?.find(p => 
                            p.title.toLowerCase().includes(topic.topic.toLowerCase()) || 
                            topic.topic.toLowerCase().includes(p.title.toLowerCase())
                          );
                          const isGenerated = !!matchingPost;

                          return (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{topic.topic}</TableCell>
                              <TableCell>{topic.category}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{topic.keywords?.join(", ")}</TableCell>
                              <TableCell>
                                {isGenerated ? (
                                  getStatusBadge(matchingPost.status)
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground border-dashed">Não Gerado</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isGenerated ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(matchingPost)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={isGenerating}
                                    onClick={() => generatePostForTopic(topic)}
                                  >
                                    {isGenerating && batchProgress?.currentTopic === topic.topic ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-4 w-4 mr-2" />
                                    )}
                                    Gerar
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>IA</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : posts && posts.length > 0 ? (
                      posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">{post.title}</TableCell>
                          <TableCell>{post.category?.name || "-"}</TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell>
                            {format(new Date(post.created_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>
                            {post.ai_generated && (
                              <Sparkles className="h-4 w-4 text-purple-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {post.status !== "published" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => publishPost.mutate(post.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(post)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePost.mutate(post.id)}
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum artigo encontrado. Crie o primeiro!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBlog;

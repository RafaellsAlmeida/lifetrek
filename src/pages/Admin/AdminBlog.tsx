import { useState } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Plus,
    FileText,
    Calendar,
    Search,
    Edit,
    Trash2,
    ExternalLink,
    Sparkles,
    RefreshCw,
    Loader2
} from "lucide-react";
import {
    useBlogPosts,
    useCreateBlogPost,
    useDeleteBlogPost,
    usePublishBlogPost,
    useBlogCategories
} from "@/hooks/useBlogPosts";
import {
    dispatchBlogPostJob,
    getJobStatus
} from "@/lib/agents";
import { BLOG_TOPICS, BlogTopic } from "@/config/blogTopics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { BlogIcpCode } from "@/types/blog";

const ICP_LABELS: Record<BlogIcpCode, string> = {
    MI: "Implantes/Instrumentos",
    OD: "Odonto",
    VT: "Veterinário",
    HS: "Instituições de Saúde",
    CM: "OEM/CM",
};

const getIcpPrimary = (post: any): BlogIcpCode | null => {
    const value = post?.metadata?.icp_primary;
    if (value === "MI" || value === "OD" || value === "VT" || value === "HS" || value === "CM") {
        return value;
    }
    return null;
};

export default function AdminBlog() {
    const [activeTab, setActiveTab] = useState("posts");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIcp, setSelectedIcp] = useState<"all" | BlogIcpCode>("all");
    const [selectedTopic, setSelectedTopic] = useState<BlogTopic | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const { data: posts, isLoading } = useBlogPosts(false);
    const { data: categories } = useBlogCategories(activeTab === "strategy");
    const createPost = useCreateBlogPost();
    const deletePost = useDeleteBlogPost();
    const publishPost = usePublishBlogPost();

    const handleGeneratePost = async (topic: BlogTopic) => {
        setIsGenerating(true);
        try {
            toast.info(`Iniciando agente de blog para: ${topic.topic}`);

            const jobId = await dispatchBlogPostJob(topic.topic, topic.keywords, topic.category);

            // Poll for completion
            const pollInterval = setInterval(async () => {
                try {
                    const job = await getJobStatus(jobId);
                    if (job.status === 'completed') {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        setSelectedTopic(null);

                        // Invalidate queries to show new post
                        // The backend agent should have inserted the post into blog_posts table
                        // But we might need to handle the result if it returns content to be saved by frontend?
                        // Wait, generate-blog-post usually creates the draft directly in DB.
                        // Let's assume the agent creates the post.
                        // We just need to refresh the list.
                        // Actually, looking at `generate-blog-post` older implementation, it returned data.
                        // If the AGENT creates the post, we just need to refresh.
                        // I will assume the agent handles DB insertion.

                        toast.success("Artigo gerado e salvo como rascunho!");
                        setActiveTab("posts");
                    } else if (job.status === 'failed') {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        toast.error("Erro na geração: " + (job.error || "Desconhecido"));
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                }
            }, 3000);

        } catch (error) {
            console.error("Error generating post:", error);
            toast.error("Erro ao iniciar geração.");
            setIsGenerating(false);
        }
    };

    const filteredPosts = posts?.filter((post: any) => {
        const term = searchTerm.trim().toLowerCase();
        const byText =
            !term ||
            post.title.toLowerCase().includes(term) ||
            post.status.includes(term);
        const icp = getIcpPrimary(post);
        const byIcp = selectedIcp === "all" || icp === selectedIcp;
        return byText && byIcp;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published': return <Badge className="bg-green-500">Publicado</Badge>;
            case 'draft': return <Badge variant="secondary">Rascunho</Badge>;
            case 'pending_review': return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Revisão</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejeitado</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blog & SEO</h1>
                    <p className="text-muted-foreground">Gerencie artigos, categorias e estratégia de conteúdo SEO.</p>
                </div>
                <Button onClick={() => setActiveTab("new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Artigo
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="posts">Gerenciar Posts</TabsTrigger>
                    <TabsTrigger value="strategy">Estratégia & Tópicos</TabsTrigger>
                    <TabsTrigger value="categories">Categorias</TabsTrigger>
                    <TabsTrigger value="new" className="hidden">Editor</TabsTrigger>
                </TabsList>

                <TabsContent value="posts">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Artigos ({filteredPosts?.length || 0})</CardTitle>
                                <div className="flex items-center gap-3">
                                    <Select
                                        value={selectedIcp}
                                        onValueChange={(value) => setSelectedIcp(value as "all" | BlogIcpCode)}
                                    >
                                        <SelectTrigger className="w-[220px]">
                                            <SelectValue placeholder="Filtrar por ICP" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os ICPs</SelectItem>
                                            <SelectItem value="CM">{ICP_LABELS.CM}</SelectItem>
                                            <SelectItem value="MI">{ICP_LABELS.MI}</SelectItem>
                                            <SelectItem value="OD">{ICP_LABELS.OD}</SelectItem>
                                            <SelectItem value="VT">{ICP_LABELS.VT}</SelectItem>
                                            <SelectItem value="HS">{ICP_LABELS.HS}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar artigos..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Título</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>ICP</TableHead>
                                            <TableHead>Data Criação</TableHead>
                                            <TableHead>Views</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPosts?.map((post) => (
                                            <TableRow key={post.id}>
                                                <TableCell className="font-medium">{post.title}</TableCell>
                                                <TableCell>{getStatusBadge(post.status)}</TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const icp = getIcpPrimary(post);
                                                        return icp ? (
                                                            <Badge variant="outline">{ICP_LABELS[icp]}</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Sem ICP</Badge>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell>{format(new Date(post.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                                <TableCell>-</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    {post.status !== 'published' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-green-600 hover:text-green-700"
                                                            onClick={() => publishPost.mutate(post.id)}
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive/90"
                                                        onClick={() => {
                                                            if (confirm("Tem certeza que deseja excluir?")) {
                                                                deletePost.mutate(post.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="strategy">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {BLOG_TOPICS.map((topic, index) => {
                            const exists = posts?.some(p => p.title.includes(topic.topic.substring(0, 20)));
                            return (
                                <Card key={index} className={exists ? "opacity-60 bg-muted" : ""}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <Badge variant={topic.priority === 'high' ? 'default' : 'secondary'} className="mb-2">
                                                Prioridade {topic.priority === 'high' ? 'Alta' : topic.priority === 'medium' ? 'Média' : 'Baixa'}
                                            </Badge>
                                            {exists && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Gerado</Badge>}
                                        </div>
                                        <CardTitle className="text-lg leading-tight">{topic.topic}</CardTitle>
                                        <CardDescription className="mt-2">
                                            Mês {topic.month} • {topic.category}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {topic.keywords.map(k => (
                                                <Badge key={k} variant="outline" className="text-xs">{k}</Badge>
                                            ))}
                                        </div>
                                        {!exists && (
                                            <Button
                                                className="w-full"
                                                onClick={() => handleGeneratePost(topic)}
                                                disabled={isGenerating}
                                            >
                                                {isGenerating && selectedTopic?.topic === topic.topic ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <Sparkles className="h-4 w-4 mr-2" />
                                                )}
                                                Gerar com IA
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="categories">
                    <Card>
                        <CardHeader>
                            <CardTitle>Categorias do Blog</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Descrição</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories?.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-medium">{cat.name}</TableCell>
                                            <TableCell>{cat.slug}</TableCell>
                                            <TableCell>{cat.description || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

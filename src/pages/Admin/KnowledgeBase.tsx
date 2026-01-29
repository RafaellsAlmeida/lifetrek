// @ts-nocheck
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Search, Plus, Trash2, Edit2, Link as LinkIcon, Save, X, BookOpen } from "lucide-react";

interface KnowledgeItem {
    id: string;
    category?: string;
    question?: string;
    answer?: string;
    content?: string;
    metadata?: any;
    source_type?: string;
    tags?: string[];
    created_at: string;
}

const CATEGORIES = [
    "General",
    "Technical",
    "Pricing",
    "Competitors",
    "Company History",
    "Objection Handling"
];

export default function KnowledgeBase() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // New Item State
    const [newItem, setNewItem] = useState({
        category: "General",
        question: "",
        answer: "",
        tags: ""
    });

    // Edit State
    const [editForm, setEditForm] = useState({
        category: "",
        question: "",
        answer: "",
        tags: ""
    });

    // Fetch KB items
    const { data: kbItems, isLoading } = useQuery({
        queryKey: ["knowledge-base"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("knowledge_base")
                .select("*")
                .order("category", { ascending: true });

            if (error) throw error;
            return data as KnowledgeItem[];
        },
    });

    // Filter items
    const filteredItems = kbItems?.filter(item => {
        const searchStr = searchTerm.toLowerCase();
        return (
            (item.question?.toLowerCase().includes(searchStr)) ||
            (item.answer?.toLowerCase().includes(searchStr)) ||
            (item.content?.toLowerCase().includes(searchStr)) ||
            (item.category?.toLowerCase().includes(searchStr)) ||
            (item.source_type?.toLowerCase().includes(searchStr)) ||
            (item.tags?.some(tag => tag.toLowerCase().includes(searchStr)))
        );
    });

    // Group by category (fallback to source_type then "General")
    const groupedItems = filteredItems?.reduce((acc, item) => {
        const cat = item.category || item.source_type || "General";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, KnowledgeItem[]>) || {};

    // Add Mutation
    const addMutation = useMutation({
        mutationFn: async () => {
            const tagsArray = newItem.tags.split(",").map(t => t.trim()).filter(Boolean);

            const { error } = await supabase
                .from("knowledge_base")
                .insert({
                    category: newItem.category,
                    question: newItem.question,
                    answer: newItem.answer,
                    tags: tagsArray
                });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Item adicionado com sucesso!");
            setIsAdding(false);
            setNewItem({ category: "General", question: "", answer: "", tags: "" });
            queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
        },
        onError: (error: any) => {
            toast.error(`Erro ao adicionar: ${error.message}`);
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("knowledge_base")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Item removido!");
            queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
        },
        onError: (error: any) => {
            toast.error(`Erro ao remover: ${error.message}`);
        }
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async (id: string) => {
            const tagsArray = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);

            const { error } = await supabase
                .from("knowledge_base")
                .update({
                    category: editForm.category,
                    question: editForm.question,
                    answer: editForm.answer,
                    tags: tagsArray
                })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Item atualizado!");
            setIsEditing(null);
            queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
        },
        onError: (error: any) => {
            toast.error(`Erro ao atualizar: ${error.message}`);
        }
    });

    const startEdit = (item: KnowledgeItem) => {
        setEditForm({
            category: item.category,
            question: item.question,
            answer: item.answer,
            tags: item.tags?.join(", ") || ""
        });
        setIsEditing(item.id);
    };

    return (
        <div className="container max-w-5xl py-8 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        Knowledge Base
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Base de conhecimento para treinamento dos agentes de IA
                    </p>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "default"}>
                    {isAdding ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {isAdding ? "Cancelar" : "Novo Item"}
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar perguntas, respostas ou tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                />
            </div>

            {isAdding && (
                <Card className="border-primary/50 shadow-md animate-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle>Adicionar Novo Conhecimento</CardTitle>
                        <CardDescription>
                            Adicione informações que os agentes usarão para responder perguntas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Categoria</label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
                                <Input
                                    placeholder="ex: vendas, técnico, urgente"
                                    value={newItem.tags}
                                    onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pergunta / Tópico</label>
                            <Input
                                placeholder="Ex: Qual o prazo de entrega padrão?"
                                value={newItem.question}
                                onChange={(e) => setNewItem({ ...newItem, question: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Resposta / Conteúdo</label>
                            <Textarea
                                placeholder="A resposta detalhada que o agente deve usar..."
                                rows={4}
                                value={newItem.answer}
                                onChange={(e) => setNewItem({ ...newItem, answer: e.target.value })}
                            />
                        </div>
                        <Button onClick={() => addMutation.mutate()} disabled={!newItem.question || !newItem.answer}>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Item
                        </Button>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div className="text-center py-12">Carregando base de conhecimento...</div>
            ) : Object.keys(groupedItems).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                    Nenhum item encontrado para sua busca.
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedItems).map(([category, items]) => (
                        <Card key={category}>
                            <CardHeader className="py-4 bg-muted/30">
                                <CardTitle className="text-lg font-medium text-primary">{category}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Accordion type="single" collapsible className="w-full">
                                    {items.map((item) => (
                                        <AccordionItem key={item.id} value={item.id} className="px-4">
                                            <AccordionTrigger className="hover:no-underline py-4">
                                                <div className="text-left">
                                                    <p className="font-medium text-base">
                                                        {item.question || (item.metadata?.title) || "Documento"}
                                                    </p>
                                                    <div className="flex gap-2 mt-1 items-center">
                                                        {item.source_type && (
                                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal uppercase tracking-wider">
                                                                {item.source_type}
                                                            </Badge>
                                                        )}
                                                        {item.tags && item.tags.length > 0 && item.tags.map(tag => (
                                                            <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-4">
                                                {isEditing === item.id ? (
                                                    <div className="space-y-4 p-4 bg-muted/50 rounded-md border">
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-medium">Categoria</label>
                                                                <select
                                                                    className="w-full p-2 text-sm border rounded-md"
                                                                    value={editForm.category}
                                                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                                >
                                                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-medium">Tags</label>
                                                                <Input
                                                                    className="h-8 text-sm"
                                                                    value={editForm.tags}
                                                                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <Input
                                                            value={editForm.question || ""}
                                                            onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                                                            className="font-medium"
                                                            placeholder="Pergunta ou Tópico"
                                                        />
                                                        <Textarea
                                                            value={editForm.answer || editForm.content || ""}
                                                            onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                                                            rows={5}
                                                            placeholder="Resposta ou Conteúdo"
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(null)}>Cancelar</Button>
                                                            <Button size="sm" onClick={() => updateMutation.mutate(item.id)}>Salvar</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                                                            {item.answer || item.content}
                                                        </div>
                                                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                                                            <div className="bg-muted/30 p-2 rounded text-[10px] font-mono text-muted-foreground">
                                                                Metadata: {JSON.stringify(item.metadata)}
                                                            </div>
                                                        )}
                                                        <div className="flex justify-end gap-2 pt-2 border-t mt-2">

                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-2"
                                                                onClick={() => startEdit(item)}
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => {
                                                                    if (confirm("Tem certeza que deseja excluir?")) deleteMutation.mutate(item.id);
                                                                }}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

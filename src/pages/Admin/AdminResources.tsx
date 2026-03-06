import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { useResources, useCreateResource, useUpdateResource, useDeleteResource } from "@/hooks/useResources";
import { Resource } from "@/types/resources";
import { Loader2, Plus, Search, Edit, Trash2, RefreshCw, BookOpen } from "lucide-react";
import { toast } from "sonner";

type ResourceStatus = Resource["status"];
type ResourceType = Resource["type"];

interface ResourceFormState {
    title: string;
    slug: string;
    description: string;
    content: string;
    type: ResourceType;
    persona: string;
    thumbnail_url: string;
    status: ResourceStatus;
    metadata_json: string;
}

const initialFormState: ResourceFormState = {
    title: "",
    slug: "",
    description: "",
    content: "",
    type: "guide",
    persona: "",
    thumbnail_url: "",
    status: "draft",
    metadata_json: "{}",
};

const statusLabel: Record<ResourceStatus, string> = {
    draft: "Rascunho",
    pending_approval: "Pendente aprovação",
    approved: "Aprovado",
    scheduled: "Agendado",
    published: "Publicado",
    rejected: "Rejeitado",
};

function generateSlug(input: string) {
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function formatMetadataJson(value: Resource["metadata"]) {
    try {
        return JSON.stringify(value || {}, null, 2);
    } catch {
        return "{}";
    }
}

function getStatusBadge(status: ResourceStatus) {
    switch (status) {
        case "published":
            return <Badge className="bg-green-600">Publicado</Badge>;
        case "approved":
            return <Badge className="bg-emerald-600">Aprovado</Badge>;
        case "pending_approval":
            return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pendente</Badge>;
        case "scheduled":
            return <Badge className="bg-blue-600">Agendado</Badge>;
        case "rejected":
            return <Badge variant="destructive">Rejeitado</Badge>;
        default:
            return <Badge variant="secondary">Rascunho</Badge>;
    }
}

export default function AdminResources() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | ResourceStatus>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
    const [form, setForm] = useState<ResourceFormState>(initialFormState);

    const { data: resources, isLoading, refetch } = useResources(false);
    const createResource = useCreateResource();
    const updateResource = useUpdateResource();
    const deleteResource = useDeleteResource();

    const isSubmitting = createResource.isPending || updateResource.isPending;

    const filteredResources = useMemo(() => {
        const items = resources || [];
        return items.filter((resource) => {
            const term = searchTerm.trim().toLowerCase();
            const byText = !term
                || resource.title.toLowerCase().includes(term)
                || resource.description.toLowerCase().includes(term)
                || resource.slug.toLowerCase().includes(term);
            const byStatus = statusFilter === "all" || resource.status === statusFilter;
            return byText && byStatus;
        });
    }, [resources, searchTerm, statusFilter]);

    const openCreateDialog = () => {
        setEditingResourceId(null);
        setForm(initialFormState);
        setDialogOpen(true);
    };

    const openEditDialog = (resource: Resource) => {
        setEditingResourceId(resource.id);
        setForm({
            title: resource.title,
            slug: resource.slug,
            description: resource.description || "",
            content: resource.content || "",
            type: resource.type,
            persona: resource.persona || "",
            thumbnail_url: resource.thumbnail_url || "",
            status: resource.status,
            metadata_json: formatMetadataJson(resource.metadata),
        });
        setDialogOpen(true);
    };

    useEffect(() => {
        const resourceId = searchParams.get("edit");
        if (!resourceId || !resources?.length) return;
        const target = resources.find((item) => item.id === resourceId);
        if (!target) return;
        openEditDialog(target);
        const next = new URLSearchParams(searchParams);
        next.delete("edit");
        setSearchParams(next, { replace: true });
    }, [searchParams, resources]);

    const handleTitleChange = (title: string) => {
        setForm((prev) => ({
            ...prev,
            title,
            slug: prev.slug ? prev.slug : generateSlug(title),
        }));
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
            toast.error("Título, slug e conteúdo são obrigatórios.");
            return;
        }

        let metadata: Record<string, unknown>;
        try {
            const parsed = JSON.parse(form.metadata_json || "{}");
            metadata = (parsed && typeof parsed === "object") ? parsed : {};
        } catch {
            toast.error("Metadata JSON inválido.");
            return;
        }

        const payload = {
            title: form.title.trim(),
            slug: form.slug.trim(),
            description: form.description.trim(),
            content: form.content,
            type: form.type,
            persona: form.persona.trim() || undefined,
            thumbnail_url: form.thumbnail_url.trim() || undefined,
            status: form.status,
            metadata,
        };

        try {
            if (editingResourceId) {
                await updateResource.mutateAsync({ id: editingResourceId, ...payload });
            } else {
                await createResource.mutateAsync(payload as any);
            }
            setDialogOpen(false);
            setEditingResourceId(null);
            setForm(initialFormState);
        } catch (error) {
            console.error("Error saving resource:", error);
        }
    };

    const handleDelete = async (resource: Resource) => {
        if (!window.confirm(`Excluir recurso "${resource.title}"?`)) return;
        await deleteResource.mutateAsync(resource.id);
    };

    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recursos</h1>
                    <p className="text-muted-foreground">Editor humano para guias, checklists e calculadoras.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Recurso
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-amber-600" />
                        Biblioteca de Recursos ({filteredResources.length})
                    </CardTitle>
                    <div className="flex items-center gap-3 pt-3">
                        <div className="relative w-80">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por título, descrição ou slug..."
                                className="pl-8"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(value: "all" | ResourceStatus) => setStatusFilter(value)}>
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Filtrar status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="draft">Rascunho</SelectItem>
                                <SelectItem value="pending_approval">Pendente aprovação</SelectItem>
                                <SelectItem value="approved">Aprovado</SelectItem>
                                <SelectItem value="scheduled">Agendado</SelectItem>
                                <SelectItem value="published">Publicado</SelectItem>
                                <SelectItem value="rejected">Rejeitado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Atualizado</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredResources.map((resource) => (
                                    <TableRow key={resource.id}>
                                        <TableCell className="font-medium">{resource.title}</TableCell>
                                        <TableCell className="capitalize">{resource.type}</TableCell>
                                        <TableCell>{getStatusBadge(resource.status)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{resource.slug}</TableCell>
                                        <TableCell>{format(new Date(resource.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(resource)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(resource)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredResources.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                                            Nenhum recurso encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingResourceId ? "Editar Recurso" : "Novo Recurso"}</DialogTitle>
                        <DialogDescription>
                            Conteúdo humano editável para publicação no portal de recursos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="resource-title">Título</Label>
                            <Input
                                id="resource-title"
                                value={form.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Título do recurso"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="resource-slug">Slug</Label>
                            <Input
                                id="resource-slug"
                                value={form.slug}
                                onChange={(e) => setForm((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))}
                                placeholder="slug-do-recurso"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={form.type} onValueChange={(value: ResourceType) => setForm((prev) => ({ ...prev, type: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="guide">Guia</SelectItem>
                                    <SelectItem value="checklist">Checklist</SelectItem>
                                    <SelectItem value="calculator">Calculadora</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(value: ResourceStatus) => setForm((prev) => ({ ...prev, status: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Rascunho</SelectItem>
                                    <SelectItem value="pending_approval">Pendente aprovação</SelectItem>
                                    <SelectItem value="approved">Aprovado</SelectItem>
                                    <SelectItem value="scheduled">Agendado</SelectItem>
                                    <SelectItem value="published">Publicado</SelectItem>
                                    <SelectItem value="rejected">Rejeitado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="resource-persona">Persona (opcional)</Label>
                            <Input
                                id="resource-persona"
                                value={form.persona}
                                onChange={(e) => setForm((prev) => ({ ...prev, persona: e.target.value }))}
                                placeholder="Engenharia / Compras / Qualidade"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="resource-description">Descrição</Label>
                            <Textarea
                                id="resource-description"
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                placeholder="Resumo curto do recurso"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="resource-content">Conteúdo (Markdown)</Label>
                            <Textarea
                                id="resource-content"
                                value={form.content}
                                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                                rows={14}
                                placeholder="Conteúdo completo em markdown"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="resource-thumbnail">Thumbnail URL (opcional)</Label>
                            <Input
                                id="resource-thumbnail"
                                value={form.thumbnail_url}
                                onChange={(e) => setForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="resource-metadata">Metadata JSON</Label>
                            <Textarea
                                id="resource-metadata"
                                value={form.metadata_json}
                                onChange={(e) => setForm((prev) => ({ ...prev, metadata_json: e.target.value }))}
                                rows={6}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editingResourceId ? "Salvar alterações" : "Criar recurso"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

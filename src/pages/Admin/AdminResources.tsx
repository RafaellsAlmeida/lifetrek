import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useResources, useCreateResource, useUpdateResource, useDeleteResource, usePublishResource } from "@/hooks/useResources";
import { Resource } from "@/types/resources";
import { ExternalLink, Loader2, Plus, Search, Edit, Trash2, RefreshCw, BookOpen, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
    EditorialWorkspace,
    MetadataField,
    MetadataInput,
} from "@/components/admin/content/EditorialWorkspace";

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
    admin_approved: "Aprovado",
    scheduled: "Agendado",
    published: "Publicado",
    rejected: "Rejeitado",
    stakeholder_review_pending: "Revisão stakeholder",
    stakeholder_approved: "Aprovado stakeholder",
    stakeholder_rejected: "Rejeitado stakeholder",
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
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | ResourceStatus>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
    const [form, setForm] = useState<ResourceFormState>(initialFormState);

    const { data: resources, isLoading, refetch } = useResources(false);
    const createResource = useCreateResource();
    const updateResource = useUpdateResource();
    const deleteResource = useDeleteResource();
    const publishResource = usePublishResource();

    const isSubmitting = createResource.isPending || updateResource.isPending || publishResource.isPending;
    const returnTo = searchParams.get("returnTo");
    const stateKey = searchParams.get("stateKey");

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
    }, [searchParams, resources, setSearchParams]);

    const handleTitleChange = (title: string) => {
        setForm((prev) => ({
            ...prev,
            title,
            slug: prev.slug ? prev.slug : generateSlug(title),
        }));
    };

    const buildPayload = (forcedStatus?: ResourceStatus) => {
        if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
            toast.error("Título, slug e conteúdo são obrigatórios.");
            return null;
        }

        let metadata: Record<string, unknown>;
        try {
            const parsed = JSON.parse(form.metadata_json || "{}");
            metadata = (parsed && typeof parsed === "object") ? parsed : {};
        } catch {
            toast.error("Metadata JSON inválido.");
            return null;
        }

        return {
            title: form.title.trim(),
            slug: form.slug.trim(),
            description: form.description.trim(),
            content: form.content,
            type: form.type,
            persona: form.persona.trim() || undefined,
            thumbnail_url: form.thumbnail_url.trim() || undefined,
            status: forcedStatus || form.status,
            metadata,
        };
    };

    const handleReturnToApproval = () => {
        const target = returnTo || "/admin/content-approval";
        navigate(stateKey ? `${target}?${stateKey}` : target);
    };

    const closeEditor = () => {
        setDialogOpen(false);
        setEditingResourceId(null);
        setForm(initialFormState);
    };

    const handleEditorCancel = () => {
        if (returnTo) {
            handleReturnToApproval();
            return;
        }
        closeEditor();
    };

    const handleSave = async () => {
        const payload = buildPayload();
        if (!payload) return;

        try {
            if (editingResourceId) {
                await updateResource.mutateAsync({ id: editingResourceId, ...payload });
            } else {
                await createResource.mutateAsync(payload as any);
            }
            if (returnTo) {
                handleReturnToApproval();
                return;
            }
            closeEditor();
        } catch (error) {
            console.error("Error saving resource:", error);
        }
    };

    const handlePublish = async () => {
        const payload = buildPayload("published");
        if (!payload) return;

        try {
            let resourceId = editingResourceId;
            if (resourceId) {
                await updateResource.mutateAsync({ id: resourceId, ...payload, status: form.status });
            } else {
                const created = await createResource.mutateAsync({ ...payload, status: "draft" } as any);
                resourceId = created?.id;
            }
            if (!resourceId) throw new Error("Recurso salvo sem ID retornado.");
            await publishResource.mutateAsync(resourceId);
            if (returnTo) {
                handleReturnToApproval();
                return;
            }
            closeEditor();
        } catch (error) {
            console.error("Error publishing resource:", error);
        }
    };

    const handleDelete = async (resource: Resource) => {
        if (!window.confirm(`Excluir recurso "${resource.title}"?`)) return;
        await deleteResource.mutateAsync(resource.id);
    };

    const getStatusTone = (status: ResourceStatus) => {
        if (status === "published" || status === "stakeholder_approved") return "published";
        if (status === "pending_approval" || status === "approved" || status === "stakeholder_review_pending") return "review";
        if (status === "draft") return "draft";
        return "default";
    };

    if (dialogOpen) {
        return (
            <div className="container mx-auto p-6">
                <EditorialWorkspace
                    mode="markdown"
                    title={editingResourceId ? "Editar recurso" : "Novo recurso"}
                    subtitle="Editor de recursos com Markdown, preview e publicação no portal."
                    statusLabel={statusLabel[form.status] || form.status}
                    statusTone={getStatusTone(form.status)}
                    documentTitle={form.title}
                    documentSubtitle={form.description}
                    content={form.content}
                    onContentChange={(content) => setForm((prev) => ({ ...prev, content }))}
                    onCancel={handleEditorCancel}
                    onSave={handleSave}
                    onPublish={handlePublish}
                    isSaving={isSubmitting}
                    publishDisabled={!form.title.trim() || !form.slug.trim() || !form.content.trim()}
                    metadata={
                        <>
                            {returnTo ? (
                                <Button variant="outline" className="w-full justify-start" onClick={handleReturnToApproval}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Voltar para Aprovação
                                </Button>
                            ) : null}
                            <MetadataField label="Título">
                                <MetadataInput
                                    id="resource-title"
                                    value={form.title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    placeholder="Título do recurso"
                                />
                            </MetadataField>
                            <MetadataField label="Slug">
                                <MetadataInput
                                    id="resource-slug"
                                    value={form.slug}
                                    onChange={(e) => setForm((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))}
                                    placeholder="slug-do-recurso"
                                />
                            </MetadataField>
                            <MetadataField label="Tipo">
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
                            </MetadataField>
                            <MetadataField label="Status">
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
                            </MetadataField>
                            <MetadataField label="Persona">
                                <MetadataInput
                                    id="resource-persona"
                                    value={form.persona}
                                    onChange={(e) => setForm((prev) => ({ ...prev, persona: e.target.value }))}
                                    placeholder="Engenharia / Compras / Qualidade"
                                />
                            </MetadataField>
                            <MetadataField label="Descrição">
                                <Textarea
                                    id="resource-description"
                                    value={form.description}
                                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    placeholder="Resumo curto do recurso"
                                />
                            </MetadataField>
                            <MetadataField label="Thumbnail URL">
                                <MetadataInput
                                    id="resource-thumbnail"
                                    value={form.thumbnail_url}
                                    onChange={(e) => setForm((prev) => ({ ...prev, thumbnail_url: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </MetadataField>
                            <MetadataField label="Metadata JSON">
                                <Textarea
                                    id="resource-metadata"
                                    value={form.metadata_json}
                                    onChange={(e) => setForm((prev) => ({ ...prev, metadata_json: e.target.value }))}
                                    rows={8}
                                    className="font-mono text-xs"
                                />
                            </MetadataField>
                        </>
                    }
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recursos</h1>
                    <p className="text-muted-foreground">Editor humano para guias, checklists e calculadoras.</p>
                </div>
                <div className="flex items-center gap-2">
                    {returnTo && (
                        <Button variant="outline" onClick={handleReturnToApproval}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar para Aprovação
                        </Button>
                    )}
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
                                            {resource.status !== "published" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-600 hover:text-green-700"
                                                    onClick={() => publishResource.mutate(resource.id)}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            )}
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
        </div>
    );
}

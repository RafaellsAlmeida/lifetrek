import { useParams, Link } from "react-router-dom";
import { useResource } from "@/hooks/useResources";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Share2, Download, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Mermaid from "@/components/agents/Mermaid";
import { useEffect, useState, useRef } from "react";
import { trackResourceView, trackResourceRead, trackResourceDownload } from "@/utils/trackAnalytics";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
// import remarkGfm from 'remark-gfm';
import { supabase } from "@/integrations/supabase/client";
import SupplierAuditCalculator from "@/components/resources/SupplierAuditCalculator";

export default function ResourceDetail() {
    const { slug } = useParams();
    const { data: resource, isLoading, error } = useResource(slug || "");
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [isSavingScorecard, setIsSavingScorecard] = useState(false);
    const [isSavingChecklist, setIsSavingChecklist] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: ""
    });
    const [scorecard, setScorecard] = useState({
        dependency: 3,
        volatility: 3,
        leadTime: 3,
        quality: 3,
        capital: 3
    });
    const [productionChecklist, setProductionChecklist] = useState({
        volume: false,
        leadTime: false,
        impact: false,
        quality: false,
        capital: false
    });
    const [scorecardStatus, setScorecardStatus] = useState<string | null>(null);
    const [checklistStatus, setChecklistStatus] = useState<string | null>(null);
    const saveLeadBackup = (payload: Record<string, unknown>) => {
        if (typeof window === "undefined") return;
        const key = "lifetrek_lead_backups";
        try {
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            const next = Array.isArray(existing) ? existing : [];
            next.push({ ...payload, created_at: new Date().toISOString() });
            localStorage.setItem(key, JSON.stringify(next));
        } catch (err) {
            console.warn("Failed to store lead backup:", err);
        }
    };

    const contentRef = useRef<HTMLDivElement>(null);
    const hasTrackedView = useRef(false);

    // Track resource view on mount
    useEffect(() => {
        if (resource && !hasTrackedView.current) {
            trackResourceView(resource.slug, resource.title);
            hasTrackedView.current = true;
        }
    }, [resource]);

    useEffect(() => {
        if (!resource?.slug) return;
        const unlocked = localStorage.getItem(`lifetrek_resource_unlocked_${resource.slug}`);
        setHasAccess(unlocked === "true");
    }, [resource?.slug]);

    const roadmapMermaid = `
    flowchart LR
      A[Semanas 1-2: NDA + selecao de SKUs] --> B[Semanas 3-6: DFM + prototipo CNC]
      B --> C[Semanas 7-12: Lote piloto + ajuste MRP]
    `;

    const scorecardTotal = Object.values(scorecard).reduce((sum, value) => sum + value, 0);
    const scorecardBand = scorecardTotal <= 10 ? "Baixo" : scorecardTotal <= 18 ? "Medio" : "Alto";
    const scorecardRecommendation = scorecardTotal <= 10
        ? "Manter monitoramento e revisar trimestralmente."
        : scorecardTotal <= 18
            ? "Criar plano de contingencia e revisar fornecedores criticos."
            : "Priorizar nearshoring/fornecedor local critico.";
    const productionYesCount = Object.values(productionChecklist).filter(Boolean).length;
    const productionRecommendation = productionYesCount >= 4
        ? "Prioridade alta para migracao."
        : productionYesCount >= 3
            ? "Avaliar piloto local."
            : "Monitorar e reavaliar quando mudar o cenario.";

    const handleUnlock = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!resource) return;
        if (!formData.name || !formData.email) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Preencha nome e email para continuar."
            });
            return;
        }

        setIsUnlocking(true);
        try {
            const { error: insertError } = await supabase
                .from("contact_leads")
                .insert({
                    name: formData.name,
                    email: formData.email,
                    company: formData.company,
                    phone: "Nao informado",
                    project_type: "other_medical",
                    technical_requirements: `Lead magnet: ${resource.title}`,
                    message: `Resource slug: ${resource.slug}`,
                });

            if (insertError) throw insertError;

            localStorage.setItem(`lifetrek_resource_unlocked_${resource.slug}`, "true");
            setHasAccess(true);
            setIsModalOpen(false);
            toast({
                title: "Acesso liberado!",
                description: "Agora voce pode visualizar o recurso completo."
            });
        } catch (err) {
            console.error("Error saving lead:", err);
            saveLeadBackup({
                type: "resource_unlock",
                resource_slug: resource.slug,
                resource_title: resource.title,
                formData
            });
            localStorage.setItem(`lifetrek_resource_unlocked_${resource.slug}`, "true");
            setHasAccess(true);
            setIsModalOpen(false);
            toast({
                title: "Acesso liberado!",
                description: "CRM indisponivel. Dados salvos localmente."
            });
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleScorecardSave = async () => {
        if (!resource) return;
        if (!formData.name || !formData.email) {
            setIsModalOpen(true);
            toast({
                variant: "destructive",
                title: "Dados necessarios",
                description: "Informe nome e email para salvar o scorecard."
            });
            return;
        }

        const payload = {
            scorecard,
            total: scorecardTotal,
            band: scorecardBand
        };

        setScorecardStatus(null);
        setIsSavingScorecard(true);
        try {

            const { error: insertError } = await supabase
                .from("contact_leads")
                .insert({
                    name: formData.name,
                    email: formData.email,
                    company: formData.company,
                    phone: "Nao informado",
                    project_type: "other_medical",
                    technical_requirements: `Scorecard ${resource.title}: ${scorecardTotal} (${scorecardBand}).`,
                    message: `Resource slug: ${resource.slug}. Responses: ${JSON.stringify(payload)}`,
                });

            if (insertError) throw insertError;

            toast({
                title: "Scorecard salvo",
                description: "Respostas registradas no CRM interno."
            });
            setScorecardStatus("Scorecard salvo");
        } catch (err) {
            console.error("Error saving scorecard:", err);
            saveLeadBackup({
                type: "scorecard_response",
                resource_slug: resource.slug,
                resource_title: resource.title,
                formData,
                payload
            });
            toast({
                title: "Scorecard salvo",
                description: "CRM indisponivel. Respostas salvas localmente."
            });
            setScorecardStatus("Scorecard salvo");
        } finally {
            setIsSavingScorecard(false);
        }
    };

    const handleProductionChecklistSave = async () => {
        if (!resource) return;
        if (!formData.name || !formData.email) {
            setIsModalOpen(true);
            toast({
                variant: "destructive",
                title: "Dados necessarios",
                description: "Informe nome e email para salvar o checklist."
            });
            return;
        }

        const payload = {
            checklist: productionChecklist,
            yesCount: productionYesCount
        };

        setChecklistStatus(null);
        setIsSavingChecklist(true);
        try {

            const { error: insertError } = await supabase
                .from("contact_leads")
                .insert({
                    name: formData.name,
                    email: formData.email,
                    company: formData.company,
                    phone: "Nao informado",
                    project_type: "other_medical",
                    technical_requirements: `Checklist producao local: ${productionYesCount} SIM.`,
                    message: `Resource slug: ${resource.slug}. Responses: ${JSON.stringify(payload)}`,
                });

            if (insertError) throw insertError;

            toast({
                title: "Checklist salvo",
                description: "Respostas registradas no CRM interno."
            });
            setChecklistStatus("Checklist salvo");
        } catch (err) {
            console.error("Error saving checklist:", err);
            saveLeadBackup({
                type: "checklist_response",
                resource_slug: resource.slug,
                resource_title: resource.title,
                formData,
                payload
            });
            toast({
                title: "Checklist salvo",
                description: "CRM indisponivel. Respostas salvas localmente."
            });
            setChecklistStatus("Checklist salvo");
        } finally {
            setIsSavingChecklist(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold text-slate-800">Recurso não encontrado</h1>
                <Link to="/resources">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Recursos
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-8">
                    <Link to="/resources" className="inline-flex items-center text-slate-500 hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Recursos
                    </Link>

                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-3 mb-4">
                            <Badge variant="secondary" className="uppercase tracking-wider">
                                {resource.type === 'calculator' ? 'Calculadora' :
                                    resource.type === 'checklist' ? 'Checklist' : 'Guia'}
                            </Badge>
                            {resource.persona && (
                                <Badge variant="outline" className="text-slate-500 border-slate-200">
                                    Para {resource.persona.split('/')[0]}
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                            {resource.title}
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                            {resource.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-slate-500 border-t pt-6">
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(resource.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                </span>
                                <span className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Lifetrek Engineering
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => window.print()}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimir
                                </Button>
                                <Button variant="ghost" size="sm">
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Compartilhar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                {!hasAccess ? (
                    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-10 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">Desbloqueie o recurso completo</h2>
                        <p className="text-slate-600 mb-6">
                            Informe seu nome e email para acessar o conteudo completo e receber atualizacoes.
                        </p>
                        <Button size="lg" onClick={() => setIsModalOpen(true)}>
                            Desbloquear agora
                        </Button>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-8 md:p-12">
                        <div className="prose prose-slate prose-lg max-w-none">
                            <ReactMarkdown
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-slate-900 mb-6 mt-10" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-slate-800 mb-4 mt-8 pb-2 border-b" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-2 mb-6" {...props} />,
                                    li: ({ node, ...props }) => <li className="text-slate-700 leading-relaxed" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-slate-700 leading-relaxed mb-6" {...props} />,
                                    code: ({ className, children, ...props }) => {
                                        const language = className?.replace("language-", "");
                                        if (language === "mermaid") {
                                            return (
                                                <div className="my-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                    <Mermaid chart={String(children).trim()} />
                                                </div>
                                            );
                                        }
                                        return (
                                            <code className="rounded bg-slate-100 px-1 py-0.5 text-sm text-slate-800" {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="border-l-4 border-primary bg-slate-50 p-4 rounded-r italic text-slate-700 my-6" {...props} />
                                    )
                                }}
                            >
                                {resource.content}
                            </ReactMarkdown>
                        </div>

                        {resource.slug === "roadmap-90-dias-migracao-skus" && (
                            <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-6">
                                <h3 className="text-xl font-semibold text-slate-900 mb-4">Linha do tempo visual</h3>
                                <Mermaid chart={roadmapMermaid} />
                            </div>
                        )}

                        {resource.slug === "scorecard-risco-supply-chain-2026" && (
                            <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
                                <h3 className="text-xl font-semibold text-slate-900 mb-4">Scorecard interativo</h3>
                                <div className="space-y-4">
                                    {[
                                        { id: "dependency", label: "Dependencia geografica" },
                                        { id: "volatility", label: "Volatilidade cambial/materia-prima" },
                                        { id: "leadTime", label: "Lead time e logistica" },
                                        { id: "quality", label: "Qualidade/compliance fornecedor" },
                                        { id: "capital", label: "Capital preso em estoque" }
                                    ].map((item) => (
                                        <div key={item.id} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm text-slate-600">
                                                <span>{item.label}</span>
                                                <span className="font-semibold text-slate-900">{scorecard[item.id as keyof typeof scorecard]}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={5}
                                                value={scorecard[item.id as keyof typeof scorecard]}
                                                onChange={(event) =>
                                                    setScorecard((prev) => ({
                                                        ...prev,
                                                        [item.id]: Number(event.target.value)
                                                    }))
                                                }
                                                className="w-full accent-primary"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Total</span>
                                        <span className="text-lg font-bold text-slate-900">{scorecardTotal}</span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-700">
                                        Faixa: <span className="font-semibold">{scorecardBand}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600">{scorecardRecommendation}</p>
                                </div>

                                <div className="mt-4">
                                    <Button onClick={handleScorecardSave} disabled={isSavingScorecard}>
                                        {isSavingScorecard ? "Salvando..." : "Salvar respostas no CRM"}
                                    </Button>
                                    {scorecardStatus && (
                                        <p className="mt-3 text-sm text-slate-600">{scorecardStatus}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {resource.slug === "checklist-producao-local" && (
                            <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
                                <h3 className="text-xl font-semibold text-slate-900 mb-4">Checklist interativo</h3>
                                <div className="space-y-3">
                                    {[
                                        { id: "volume", label: "Volume anual relevante" },
                                        { id: "leadTime", label: "Lead time de importacao > X dias" },
                                        { id: "impact", label: "Alto impacto se faltar (linha para)" },
                                        { id: "quality", label: "Problema recorrente de qualidade/NC" },
                                        { id: "capital", label: "Alto valor em estoque parado" }
                                    ].map((item) => (
                                        <label key={item.id} className="flex items-center gap-3 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={productionChecklist[item.id as keyof typeof productionChecklist]}
                                                onChange={(event) =>
                                                    setProductionChecklist((prev) => ({
                                                        ...prev,
                                                        [item.id]: event.target.checked
                                                    }))
                                                }
                                                className="h-4 w-4 accent-primary"
                                            />
                                            {item.label}
                                        </label>
                                    ))}
                                </div>

                                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">SIM marcados</span>
                                        <span className="text-lg font-bold text-slate-900">{productionYesCount}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600">{productionRecommendation}</p>
                                </div>

                                <div className="mt-4">
                                    <Button onClick={handleProductionChecklistSave} disabled={isSavingChecklist}>
                                        {isSavingChecklist ? "Salvando..." : "Salvar checklist no CRM"}
                                    </Button>
                                    {checklistStatus && (
                                        <p className="mt-3 text-sm text-slate-600">{checklistStatus}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Supplier Audit Checklist - Interactive Scoring Calculator */}
                        {(resource.slug === "checklist-auditoria-iso-13485" || resource.slug === "checklist-auditoria-fornecedores") && (
                            <SupplierAuditCalculator
                                formData={formData}
                                setIsModalOpen={setIsModalOpen}
                            />
                        )}

                        {/* CTA Footer */}
                        <div className="mt-16 pt-8 border-t bg-slate-50 -mx-8 -mb-8 md:-mx-12 md:-mb-12 p-8 md:p-12 text-center rounded-b-xl">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Gostou deste recurso?</h3>
                            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                                Nossa equipe de engenharia pode ajudar sua empresa a implementar essas estrategias na pratica.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Link to="/contact">
                                    <Button size="lg" className="px-8">
                                        Falar com um Especialista
                                    </Button>
                                </Link>
                                <Button variant="outline" size="lg">
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Desbloquear recurso</DialogTitle>
                        <DialogDescription>
                            Insira seu nome e email para acessar o conteudo completo.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUnlock} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome completo</Label>
                            <Input
                                id="name"
                                placeholder="Seu nome"
                                value={formData.name}
                                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email corporativo</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="voce@empresa.com"
                                value={formData.email}
                                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa (opcional)</Label>
                            <Input
                                id="company"
                                placeholder="Nome da sua empresa"
                                value={formData.company}
                                onChange={(event) => setFormData({ ...formData, company: event.target.value })}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full" disabled={isUnlocking}>
                                {isUnlocking ? "Liberando..." : "Desbloquear recurso"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

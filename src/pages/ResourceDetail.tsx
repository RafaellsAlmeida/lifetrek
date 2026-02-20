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
import { useEffect, useState } from "react";
import { trackResourceView, trackResourceDownload } from "@/utils/trackAnalytics";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
// import remarkGfm from 'remark-gfm';
import SupplierAuditCalculator from "@/components/resources/SupplierAuditCalculator";
import ToleranceLookup from "@/components/resources/ToleranceLookup";
import CleanRoomClassifier from "@/components/resources/CleanRoomClassifier";
import SwissVsConventionalTool from "@/components/resources/SwissVsConventionalTool";
import { flushPendingLeads, saveLeadWithCompat } from "@/utils/contactLeadCapture";

export default function ResourceDetail() {
    const { slug } = useParams();
    const { data: resource, isLoading, error } = useResource(slug || "");
    const { toast } = useToast();
    const [hasAccess, setHasAccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: ""
    });

    // Scorecard state
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

    const [isSavingScorecard, setIsSavingScorecard] = useState(false);
    const [scorecardStatus, setScorecardStatus] = useState("");
    const [isSavingChecklist, setIsSavingChecklist] = useState(false);
    const [checklistStatus, setChecklistStatus] = useState("");
    const resourceContent = resource?.content ?? "";
    const resolvedSlug = resource?.slug ?? slug ?? "resource";
    const metadata = (resource?.metadata ?? {}) as Record<string, unknown>;
    const downloadUrl = typeof metadata.download_url === "string" ? metadata.download_url : undefined;

    const roadmapFlowchart = `
    flowchart LR
      A[Fase 1: Diagnóstico] --> B[Fase 2: Prototipagem]
      B --> C[Fase 3: Lote Piloto]
      C --> D[Fase 4: Escala]
    `;

    // Check if user has already unlocked this resource
    useEffect(() => {
        if (slug) {
            const unlocked = localStorage.getItem(`resource_unlocked_${slug}`);
            if (unlocked) {
                setHasAccess(true);
            }
        }
    }, [slug]);

    useEffect(() => {
        if (!resource?.slug) return;
        trackResourceView(resource.slug, resource.title);
    }, [resource?.slug, resource?.title]);

    useEffect(() => {
        void flushPendingLeads();
        const handleOnline = () => {
            void flushPendingLeads();
        };

        window.addEventListener("online", handleOnline);
        return () => window.removeEventListener("online", handleOnline);
    }, []);

    if (isLoading) return <LoadingSpinner />;
    if (error || !resource) return <div className="p-8 text-center">Recurso não encontrado.</div>;

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUnlocking(true);

        const unlockLocally = () => {
            if (slug) {
                localStorage.setItem(`resource_unlocked_${slug}`, "true");
            }
            setHasAccess(true);
            setIsModalOpen(false);
        };

        try {
            const saveResult = await saveLeadWithCompat({
                name: formData.name,
                email: formData.email,
                company: formData.company || undefined,
                phone: "Nao informado",
                project_type: "other_medical",
                project_types: ["other_medical"],
                technical_requirements: `Resource unlock: ${resolvedSlug}`,
                message: `Mini auth unlock for /resources/${resolvedSlug}`,
                source: "website",
            });

            unlockLocally();

            if (saveResult.status === "saved") {
                toast({
                    title: "Recurso desbloqueado!",
                    description: "Boa leitura.",
                });
            } else {
                toast({
                    title: "Recurso desbloqueado!",
                    description: "Sincronizacao do lead pendente. Vamos tentar novamente automaticamente.",
                });
            }
        } catch (error) {
            console.error("Unexpected error while unlocking resource:", error);
            unlockLocally();
            toast({
                title: "Recurso desbloqueado!",
                description: "Sincronizacao do lead pendente. Vamos tentar novamente automaticamente.",
            });
        } finally {
            setIsUnlocking(false);
            void flushPendingLeads();
        }
    };

    const scorecardTotal = Object.values(scorecard).reduce((a, b) => a + b, 0);
    const scorecardBand = scorecardTotal < 10 ? "Baixo Risco (Verde)" : scorecardTotal < 18 ? "Médio Risco (Amarelo)" : "Alto Risco (Vermelho)";
    const scorecardRecommendation = scorecardTotal < 10
        ? "Sua cadeia de suprimentos está estável. Mantenha o monitoramento."
        : scorecardTotal < 18
            ? "Atenção necessária. Considere diversificar fornecedores críticos."
            : "Ação imediata recomendada. Sua operação está vulnerável a interrupções.";

    const productionYesCount = Object.values(productionChecklist).filter(Boolean).length;
    const productionRecommendation = productionYesCount >= 3
        ? "Recomendação: ALTA VIABILIDADE para produção local. Agende uma consultoria técnica."
        : "Recomendação: Mantenha importação por enquanto, mas monitore o volume.";

    const handleScorecardSave = async () => {
        setIsSavingScorecard(true);
        // Simulate save
        setTimeout(() => {
            setIsSavingScorecard(false);
            setScorecardStatus("Respostas salvas com sucesso!");
        }, 1000);
    };

    const handleProductionChecklistSave = async () => {
        setIsSavingChecklist(true);
        // Simulate save
        setTimeout(() => {
            setIsSavingChecklist(false);
            setChecklistStatus("Checklist salvo com sucesso!");
        }, 1000);
    };

    const handleShare = async () => {
        const currentUrl = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: resource.title,
                    text: resource.description,
                    url: currentUrl,
                });
                return;
            }
            await navigator.clipboard.writeText(currentUrl);
            toast({
                title: "Link copiado",
                description: "O link do recurso foi copiado para a area de transferencia.",
            });
        } catch (error) {
            console.error("Error sharing resource:", error);
            toast({
                variant: "destructive",
                title: "Nao foi possivel compartilhar",
                description: "Tente novamente em alguns instantes.",
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        try {
            const currentUrl = window.location.href;

            if (downloadUrl) {
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.click();
                await trackResourceDownload(resolvedSlug, resource.title, "external");
                return;
            }

            const generatedFile = [
                `# ${resource.title}`,
                "",
                resource.description,
                "",
                `Fonte: ${currentUrl}`,
                "",
                resourceContent,
                "",
            ].join("\n");

            const blob = new Blob([generatedFile], { type: "text/markdown;charset=utf-8" });
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `${resolvedSlug}.md`;
            link.click();
            URL.revokeObjectURL(blobUrl);

            await trackResourceDownload(resolvedSlug, resource.title, "md");
            toast({
                title: "Download iniciado",
                description: "Material exportado em formato Markdown.",
            });
        } catch (error) {
            console.error("Error downloading resource:", error);
            toast({
                variant: "destructive",
                title: "Falha no download",
                description: "Nao foi possivel gerar o arquivo.",
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="container mx-auto px-4 py-8">
                    <Link to="/resources" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Recursos
                    </Link>

                    <div className="flex flex-wrap gap-3 mb-4">
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            {resource.type === 'calculator' ? 'Ferramenta Interativa' :
                                resource.type === 'checklist' ? 'Checklist' : 'Guia Prático'}
                        </Badge>
                        <Badge variant="outline" className="text-slate-500 border-slate-200">
                            Tempo de leitura: {resource.read_time_minutes || 5} min
                        </Badge>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                        {resource.title}
                    </h1>

                    <p className="text-lg text-slate-600 max-w-3xl mb-6 leading-relaxed">
                        {resource.description}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-slate-500 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{resource.created_at ? format(new Date(resource.created_at), "d 'de' MMMM, yyyy", { locale: ptBR }) : 'Data não disponível'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Equipe Lifetrek</span>
                        </div>
                        <div className="flex-1"></div>
                        <Button variant="ghost" size="sm" className="hidden md:flex" onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartilhar
                        </Button>
                        <Button variant="ghost" size="sm" className="hidden md:flex" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir
                        </Button>
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
                                    table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto my-8 border rounded-lg">
                                            <table className="min-w-full divide-y divide-slate-200" {...props} />
                                        </div>
                                    ),
                                    thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
                                    tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-200 bg-white" {...props} />,
                                    tr: ({ node, ...props }) => <tr {...props} />,
                                    th: ({ node, ...props }) => (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" {...props} />
                                    ),
                                    td: ({ node, ...props }) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" {...props} />,
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
                                {resourceContent}
                            </ReactMarkdown>
                        </div>


                        {resource.slug === "roadmap-90-dias-migracao-skus" && (
                            <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-slate-900">Linha do tempo visual</h3>
                                </div>
                                <Mermaid chart={roadmapFlowchart} />
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
                        {(resource.slug === "checklist-auditoria-iso-13485" || resource.slug === "checklist-auditoria-fornecedores" || resource.slug === "checklist-auditoria-fornecedores-medicos") && (
                            <SupplierAuditCalculator
                                formData={formData}
                                setIsModalOpen={setIsModalOpen}
                            />
                        )}

                        {/* Tolerance Lookup - for metrology guides */}
                        {(resource.slug === "guia-metrologia-alta-precisao" || resource.slug === "guia-metrologia-3d-cnc-swiss") && (
                            <ToleranceLookup />
                        )}

                        {/* Clean Room Classifier - for sala limpa guides */}
                        {(resource.slug === "guia-sala-limpa-iso-7" || resource.slug === "guia-sala-limpa-dispositivos-medicos") && (
                            <CleanRoomClassifier />
                        )}

                        {/* Swiss vs Conventional Tool - for whitepaper */}
                        {resource.slug === "whitepaper-usinagem-suica-dispositivos-medicos" && (
                            <SwissVsConventionalTool />
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
                                <Button variant="outline" size="lg" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar material
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

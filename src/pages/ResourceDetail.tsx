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
    // ... existing interactions ...

    // ... (skipping unchanged code) ...

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* ... header ... */}

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                {!hasAccess ? (
                    // ... lock screen ...
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

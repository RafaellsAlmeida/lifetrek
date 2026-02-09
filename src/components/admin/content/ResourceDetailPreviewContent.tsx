/**
 * ResourceDetailPreviewContent
 * 
 * Renders a resource exactly as it would appear on the public /resources/:slug page,
 * but without lead capture gating or analytics tracking. Used for stakeholder preview
 * in the Content Approval workflow.
 */

import React, { useState } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Share2, Download, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
// import remarkGfm from 'remark-gfm';
import Mermaid from "@/components/agents/Mermaid";

interface ResourceDetailPreviewContentProps {
    resource: {
        title: string;
        description?: string;
        type?: string;
        persona?: string;
        content?: string;
        slug?: string;
        created_at?: string;
    };
}

export const ResourceDetailPreviewContent: React.FC<ResourceDetailPreviewContentProps> = ({ resource }) => {
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

    const handleSimulationSave = () => {
        toast.info("Em modo de pré-visualização, os dados não são salvos.");
    };

    const roadmapMermaid = `
    flowchart LR
      A[Semanas 1-2: NDA + selecao de SKUs] --> B[Semanas 3-6: DFM + prototipo CNC]
      B --> C[Semanas 7-12: Lote piloto + ajuste MRP]
    `;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-8">
                    <span className="inline-flex items-center text-slate-500 mb-6">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Recursos
                    </span>

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
                                    {resource.created_at
                                        ? format(new Date(resource.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })
                                        : 'Data não definida'
                                    }
                                </span>
                                <span className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Lifetrek Engineering
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" disabled>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimir
                                </Button>
                                <Button variant="ghost" size="sm" disabled>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Compartilhar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Always accessible in preview mode */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-8 md:p-12">
                    <div className="prose prose-slate prose-lg max-w-none">
                        <ReactMarkdown
                            // remarkPlugins={[remarkGfm]}
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
                            {resource.content || 'Nenhum conteúdo disponível.'}
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
                                <Button onClick={handleSimulationSave} variant="outline">
                                    Salvar respostas (Simulação)
                                </Button>
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
                                <Button onClick={handleSimulationSave} variant="outline">
                                    Salvar checklist (Simulação)
                                </Button>
                            </div>
                        </div>
                    )}



                    {/* CTA Footer */}
                    <div className="mt-16 pt-8 border-t bg-slate-50 -mx-8 -mb-8 md:-mx-12 md:-mb-12 p-8 md:p-12 text-center rounded-b-xl">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Gostou deste recurso?</h3>
                        <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                            Nossa equipe de engenharia pode ajudar sua empresa a implementar essas estrategias na pratica.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button size="lg" className="px-8" disabled>
                                Falar com um Especialista
                            </Button>
                            <Button variant="outline" size="lg" disabled>
                                <Download className="mr-2 h-4 w-4" />
                                Baixar PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

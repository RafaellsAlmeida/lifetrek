import React, { useState, useEffect } from 'react';
import Mermaid from '@/components/agents/Mermaid';
import { Button } from '@/components/ui/button';
import { Printer, Download, CheckCircle, AlertTriangle, Info, ArrowRight, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { trackAnalyticsEvent, trackResourceDownload, trackResourceView } from "@/utils/trackAnalytics";
import { flushPendingLeads, saveLeadWithCompat } from "@/utils/contactLeadCapture";

const FatigueValidationGuide = () => {
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const unlocked = localStorage.getItem('lifetrek_fatigue_guide_unlocked');
        if (unlocked === 'true') {
            setHasAccess(true);
        }
    }, []);

    useEffect(() => {
        trackResourceView("fatigue-validation-guide", "Fluxo de Validacao de Fadiga");
        void flushPendingLeads();
    }, []);

    const mermaidChart = `
    graph TD
        %% Nodes
        Start(["Novo Design de Implante (CAD)"])
        
        subgraph Validacao["1. Validacao de Geometria"]
            Print3D["Impressao 3D Medica (Polimero/Resina)"]
            CheckGeo{"Geometria/Encaixe Aprovados?"}
        end

        subgraph Prep["2. Selecao de Material"]
            CheckMat{"Material Final: Ti, Nitinol ou PEEK?"}
            RejectMat["Rever Projeto/Material (Fora do Escopo)"]
        end

        subgraph CNC["3. Preparacao e Usinagem CNC"]
            DefCrit["Definir Superficies Criticas e Tolerancias"]
            Machining["Usinagem CNC Citizen M32 / 5 Eixos"]
        end

        subgraph Quality["4. Metrologia e Documentacao"]
            Metro["Metrologia CMM - Laudo ISO 13485"]
        end

        subgraph Test["5. Validacao"]
            Fatigue["Ensaio de Fadiga"]
            CheckResult{"Resultados dentro da Meta?"}
            Loop["Analise de Falha - Rever Processo"]
            Final(["Congelar Especificacao - Validacao Final"])
        end

        %% Connections
        Start --> Print3D
        Print3D --> CheckGeo
        CheckGeo -- Nao --> Start
        CheckGeo -- Sim --> CheckMat

        CheckMat -- Nao --> RejectMat
        CheckMat -- Sim --> DefCrit

        DefCrit --> Machining
        Machining --> Metro
        Metro --> Fatigue
        Fatigue --> CheckResult

        CheckResult -- Nao --> Loop
        Loop --> Start
        CheckResult -- Sim --> Final

        %% Styling
        classDef default fill:#F8FAFC,stroke:#CBD5E1,stroke-width:1px,color:#1F2937;
        classDef startend fill:#EAF2FA,stroke:#004F8F,stroke-width:2px,color:#1F2937,font-weight:bold;
        classDef decision fill:#F8FAFC,stroke:#004F8F,stroke-width:2px,color:#1F2937;
        classDef process fill:#F8FAFC,stroke:#CBD5E1,stroke-width:1px,color:#1F2937;
        linkStyle default stroke:#004F8F,stroke-width:1px;

        class Start,Final startend;
        class CheckGeo,CheckMat,CheckResult decision;
        class Print3D,Machining,Metro,Fatigue,DefCrit,Loop,RejectMat process;
    `;

    const handlePrintClick = () => {
        if (hasAccess) {
            window.print();
        } else {
            setIsModalOpen(true);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate
            if (!formData.name || !formData.email) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Por favor, preencha nome e email."
                });
                setIsSubmitting(false);
                return;
            }

            await trackAnalyticsEvent({
                eventType: "lead_magnet_usage",
                companyName: formData.company || undefined,
                companyEmail: formData.email,
                metadata: {
                    leadMagnetType: "fatigue_validation_guide",
                    resource_slug: "fatigue-validation-guide",
                },
            });

            const saveResult = await saveLeadWithCompat({
                name: formData.name,
                email: formData.email,
                company: formData.company || undefined,
                phone: "Nao informado",
                project_type: "diagnostic_assessment",
                project_types: ["diagnostic_assessment"],
                technical_requirements: "Lead magnet: Fluxo de Validacao de Fadiga (print/unlock).",
                message: "Unlock/print requested for fatigue validation guide.",
                source: "website",
            });

            if (saveResult.status !== "saved") {
                console.warn("Fatigue guide lead queued for retry:", saveResult.reason);
            }

            // Unlock
            localStorage.setItem('lifetrek_fatigue_guide_unlocked', 'true');
            setHasAccess(true);
            setIsModalOpen(false);

            toast({
                title: "Sucesso!",
                description: "O guia foi desbloqueado. O download iniciará em instantes."
            });

            // Small delay before print to allow toast to show
            setTimeout(() => {
                void trackResourceDownload("fatigue-validation-guide", "Fluxo de Validacao de Fadiga", "print");
                window.print();
            }, 1000);

        } catch (err) {
            console.error('Unexpected error:', err);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Ocorreu um erro. Tente novamente."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
            <style>{`
                .mermaid-container .edgeLabel rect {
                    fill: #F1F5F9;
                    stroke: #CBD5E1;
                }
                .mermaid-container .edgeLabel text {
                    fill: #1F2937;
                    font-weight: 600;
                }
                .mermaid-container svg {
                    min-width: 900px;
                    max-width: 100%;
                }
                .mermaid-container .node rect,
                .mermaid-container .node polygon {
                    rx: 8px;
                    ry: 8px;
                }
                .mermaid-container .nodeLabel {
                    font-size: 13px;
                    padding: 8px 12px;
                }
                .mermaid-container .cluster-label {
                    font-size: 14px;
                    font-weight: 600;
                }
            `}</style>
            {/* Header / CTA Bar */}
            <div className="max-w-5xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center print:hidden gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Fluxo de Validação de Fadiga</h1>
                    <p className="text-slate-600 dark:text-slate-400">Guia 3D + CNC para Implantes Ortopédicos</p>
                </div>
                <div className="flex gap-4">
                    <Button onClick={handlePrintClick} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                        {hasAccess ? <Printer className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        {hasAccess ? "Imprimir / Salvar PDF" : "Desbloquear Guia Completo"}
                    </Button>
                </div>
            </div>

            {!hasAccess ? (
                /* Locked State - Call to Action */
                <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="p-6 bg-primary/10 dark:bg-primary/20 rounded-full">
                            <Lock className="h-16 w-16 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        Conteúdo Exclusivo Bloqueado 🔒
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                        O <strong>Fluxograma Completo</strong> e o <strong>Checklist Técnico</strong> estão disponíveis gratuitamente após fornecer seu email.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 mb-8">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">📊 O que você vai receber:</h3>
                        <ul className="text-left space-y-3 max-w-md mx-auto">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-slate-700 dark:text-slate-300">Fluxograma interativo: Do CAD ao teste de fadiga</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-slate-700 dark:text-slate-300">Checklist técnico com parâmetros críticos</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-slate-700 dark:text-slate-300">Download/Print do guia completo em PDF</span>
                            </li>
                        </ul>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} size="lg" className="text-lg px-8 py-6">
                        <Lock className="mr-2 h-5 w-5" />
                        Desbloquear Agora (Grátis)
                    </Button>
                </div>
            ) : (
                <>
                    {/* Page 1: Flowchart */}
                    <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-8 print:shadow-none print:border-none print:mb-0 print:break-after-page">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-xs font-semibold tracking-wider text-primary uppercase mb-1 block">Framework Lifetrek</span>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Do CAD ao Teste de Fadiga em Semanas</h2>
                                    <p className="text-slate-500 mt-2 max-w-2xl">
                                        Combine impressão 3D médica para validar geometria com usinagem CNC em materiais de grau implante para testar fadiga em condições reais.
                                    </p>
                                </div>
                                <div className="hidden print:block text-right">
                                    <h3 className="text-lg font-bold text-slate-900">Lifetrek Medical</h3>
                                    <p className="text-sm text-slate-500">lifetrek.io</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border border-slate-100 dark:border-slate-700">
                                <Mermaid chart={mermaidChart} />
                            </div>

                            <div className="mt-6 flex gap-6 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg dark:bg-primary/20">
                                        <Info className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Por que CNC é obrigatório?</h4>
                                        <p>Impressão 3D valida forma. Fadiga exige peça usinada em titânio/PEEK com tolerâncias de mícron.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg dark:bg-primary/20">
                                        <CheckCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Resultado ANVISA/FDA</h4>
                                        <p>Materiais reais usinados (F136, Nitinol) geram dados confiáveis para submissão regulatória.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page 2: Checklist */}
                    <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 print:shadow-none print:border-none">
                        <div className="p-8">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Checklist Técnico & Decisões Críticas</h2>
                                <p className="text-slate-500">Parâmetros para execução segura do pipeline 3D + CNC.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Section A */}
                                <section>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">A. Impressão 3D (Setup)</h3>
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Quando usar:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-start gap-3">
                                                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300">Validar forma, encaixe e ergonomia</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300">Verificar acesso de instrumentais cirúrgicos</span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300">Aprovação visual de design</span>
                                            </li>
                                        </ul>
                                    </div>
                                </section>

                                <Separator />

                                {/* Section B */}
                                <section>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">B. CNC & Manufatura</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-3">
                                            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                            <div>
                                                <span className="font-semibold text-sm text-slate-900 dark:text-white">Material Real: </span>
                                                <span className="text-sm text-slate-600 dark:text-slate-300">Ti ASTM F136, Nitinol ou PEEK (nunca substitutos)</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                            <div>
                                                <span className="font-semibold text-sm text-slate-900 dark:text-white">Regiões Críticas: </span>
                                                <span className="text-sm text-slate-600 dark:text-slate-300">Identificar áreas de tensão (roscas, mudanças de seção)</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                            <div>
                                                <span className="font-semibold text-sm text-slate-900 dark:text-white">Acabamento: </span>
                                                <span className="text-sm text-slate-600 dark:text-slate-300">Especificar rugosidade (Ra) em zonas de contato</span>
                                            </div>
                                        </li>
                                    </ul>
                                </section>

                                <Separator />

                                {/* Section C */}
                                <section>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">C. Metrologia & Documentação</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-3">
                                            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">Medir 100% das regiões críticas em CMM</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">Vincular laudo dimensional ao lote e programa CNC</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">Rastreabilidade total (ISO 13485)</span>
                                        </li>
                                    </ul>
                                </section>

                                <Separator />

                                {/* Section D */}
                                <section>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">D. Iteração & Aprendizado</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-3">
                                            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">Mudar apenas UMA variável por vez (geometria OU processo)</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">Documentar mudanças e resultados para próximas iterações</span>
                                        </li>
                                    </ul>
                                </section>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 text-center print:mt-4">
                                <p className="font-medium text-slate-900 dark:text-white">Lifetrek Medical — Parceiro de Manufatura Avançada</p>
                                <p className="text-slate-500 text-sm mt-1">lifetrek.io • ISO 13485 Certified</p>
                            </div>
                        </div>
                    </div>
                </>
            )
            }

            <div className="max-w-4xl mx-auto mt-12 print:hidden">
                <Card className="border border-slate-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">Quer revisar seu projeto com um engenheiro?</CardTitle>
                        <CardDescription>
                            Fale direto com nossa equipe técnica e tire dúvidas sobre validação e requisitos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <Button
                            asChild
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            <a
                                href="https://wa.me/5511945336226?text=Quero%20revisar%20meu%20projeto%20com%20um%20engenheiro%20Lifetrek."
                                target="_blank"
                                rel="noreferrer"
                            >
                                Falar no WhatsApp
                            </a>
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            WhatsApp: +55 11 94533-6226
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Email Capture Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Baixar o Fluxograma Completo</DialogTitle>
                        <DialogDescription>
                            Insira seus dados para liberar o download do PDF com checklist técnico.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                placeholder="Seu nome"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Corporativo</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="voce@empresa.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa (Opcional)</Label>
                            <Input
                                id="company"
                                placeholder="Nome da sua empresa"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Liberando..." : "Desbloquear PDF"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default FatigueValidationGuide;

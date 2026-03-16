import { useState } from "react";
import { TCOForm, TCOInputs } from "@/components/calculator/tco/TCOForm";
import { TCOResults, TCOResultsData } from "@/components/calculator/tco/TCOResults";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Calculator,
    TrendingDown,
    ArrowLeft,
    CheckCircle2,
    Building2,
    ShieldCheck,
    MessageSquare,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackAnalyticsEvent, trackCalculatorEvent } from "@/utils/trackAnalytics";
import { saveLeadWithCompat } from "@/utils/contactLeadCapture";

export default function TCOCalculator() {
    const [results, setResults] = useState<TCOResultsData | null>(null);
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [leadInfo, setLeadInfo] = useState({
        name: "",
        email: "",
        company: "",
        phone: "",
        scheduleVisit: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasTrackedStart, setHasTrackedStart] = useState(false);

    const handleCalculate = (data: TCOInputs) => {
        if (!hasTrackedStart) {
            setHasTrackedStart(true);
            void trackCalculatorEvent("started", {
                calculator_id: "tco_calculator_v1",
                category: data.category,
                annual_volume: data.annualVolume,
                import_lead_time_days: data.importLeadTimeDays,
            });
        }

        // Core Logic
        // 1. Import Landed Price (BRL)
        const freightPerUnitBRL = (data.importFreight / (data.annualVolume / 10)) * data.exchangeRate; // Weighted freight
        const priceBRL = data.importUnitPrice * data.exchangeRate;
        const totalTaxMult = 1 + (data.importTaxesPercent / 100);

        const importLanded = (priceBRL + freightPerUnitBRL) * totalTaxMult;

        // 2. Local scenario is user-provided to avoid unsupported savings assumptions.
        const localLanded = data.localUnitPrice;

        const annualImportTotal = importLanded * data.annualVolume;
        const annualLocalTotal = localLanded * data.annualVolume;
        const annualSavings = annualImportTotal - annualLocalTotal;

        // 3. Capital Released
        const monthlyVol = data.annualVolume / 12;
        const capitalImport = data.stockCoverageMonths * monthlyVol * importLanded;
        const capitalLocal = data.localStockCoverageMonths * monthlyVol * localLanded;
        const capitalReleased = capitalImport - capitalLocal;
        const savingsPercent =
            annualImportTotal > 0
                ? ((annualSavings / annualImportTotal) * 100)
                : 0;

        setResults({
            importLandedUnitPrice: importLanded,
            localLandedUnitPrice: localLanded,
            annualImportTotal,
            annualLocalTotal,
            annualSavings,
            leadTimeReduction: Math.max(data.importLeadTimeDays - data.localLeadTimeDays, 0),
            capitalReleased,
            savingsPercent,
        });

        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await trackAnalyticsEvent({
                eventType: "lead_magnet_usage",
                companyName: leadInfo.company || undefined,
                companyEmail: leadInfo.email,
                metadata: {
                    leadMagnetType: "tco_calculator",
                    category: results ? "tco" : undefined,
                    annual_savings: results?.annualSavings,
                    capital_released: results?.capitalReleased,
                    schedule_visit: leadInfo.scheduleVisit,
                },
            });

            await saveLeadWithCompat({
                name: leadInfo.name,
                email: leadInfo.email,
                company: leadInfo.company || undefined,
                phone: leadInfo.phone || "Nao informado",
                project_type: "supply_chain",
                project_types: ["supply_chain"],
                technical_requirements: `TCO CALC | annual_savings=${results?.annualSavings ?? "n/a"} | capital_released=${results?.capitalReleased ?? "n/a"} | visit_requested=${leadInfo.scheduleVisit ? "yes" : "no"}`,
                message: `Lead from TCO calculator. Potential annual savings: R$ ${results?.annualSavings?.toFixed?.(2) ?? "n/a"}. Capital release: R$ ${results?.capitalReleased?.toFixed?.(2) ?? "n/a"}.`,
                source: "website",
            });

            await trackCalculatorEvent("completed", {
                calculator_id: "tco_calculator_v1",
                annual_savings: results?.annualSavings,
                capital_released: results?.capitalReleased,
                schedule_visit: leadInfo.scheduleVisit,
            });

            toast.success("Solicitação enviada! Entraremos em contato em breve.");
            setShowLeadForm(false);
            setResults(null);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar dados.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero */}
            <header className="bg-primary pt-24 pb-48 px-4 text-center text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                <div className="max-w-4xl mx-auto relative z-10 space-y-6">
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20 px-4 py-1 uppercase tracking-widest text-xs">
                        Industrial Intelligence
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
                        Calculadora Total Landed Cost (TCO)
                    </h1>
                    <p className="text-xl md:text-2xl text-primary-foreground/80 font-light max-w-2xl mx-auto leading-relaxed">
                        Compare cenários de importação e fornecimento local com base nas premissas que você informar. Use o resultado como triagem financeira inicial, não como cotação formal.
                    </p>
                </div>
            </header>

            <main className="container mx-auto px-4 -mt-32 pb-24 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Content & Form */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                        {!showLeadForm ? (
                            <TCOForm onCalculate={handleCalculate} />
                        ) : (
                            <Card className="animate-in fade-in zoom-in-95 duration-500 border-primary shadow-2xl">
                                <CardHeader className="text-center pb-2">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Building2 className="w-8 h-8 text-primary" />
                                    </div>
                                    <CardTitle className="text-2xl">Receber Relatório Detalhado</CardTitle>
                                    <CardDescription>Otimize sua cadeia de suprimentos com a Lifetrek.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleLeadSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Nome Completo</Label>
                                                <Input required value={leadInfo.name} onChange={e => setLeadInfo({ ...leadInfo, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email Corporativo</Label>
                                                <Input required type="email" value={leadInfo.email} onChange={e => setLeadInfo({ ...leadInfo, email: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Empresa</Label>
                                            <Input required value={leadInfo.company} onChange={e => setLeadInfo({ ...leadInfo, company: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Telefone / WhatsApp</Label>
                                            <Input required value={leadInfo.phone} onChange={e => setLeadInfo({ ...leadInfo, phone: e.target.value })} />
                                        </div>

                                        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg cursor-pointer border hover:border-primary transition-colors">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 accent-primary"
                                                checked={leadInfo.scheduleVisit}
                                                onChange={e => setLeadInfo({ ...leadInfo, scheduleVisit: e.target.checked })}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">Agendar Visita Técnica</span>
                                                <span className="text-xs text-muted-foreground">Desejo que um especialista Lifetrek visite nossa planta.</span>
                                            </div>
                                        </label>

                                        <div className="pt-4 flex gap-4">
                                            <Button variant="ghost" className="flex-1" type="button" onClick={() => setShowLeadForm(false)}>Voltar</Button>
                                            <Button className="flex-[2] py-6 text-lg" disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Enviar & Solicitar Report"}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Value Props */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { icon: ShieldCheck, title: "Premissas Explícitas", desc: "Câmbio, impostos e preço local ficam visíveis para revisão." },
                                { icon: TrendingDown, title: "Cenário Comparável", desc: "Veja delta financeiro, estoque e lead time na mesma tela." },
                                { icon: MessageSquare, title: "Validação Comercial", desc: "Use a simulação para preparar uma cotação técnico-comercial." }
                            ].map((p, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
                                    <p.icon className="w-8 h-8 text-primary/40" />
                                    <h4 className="font-bold text-slate-800">{p.title}</h4>
                                    <p className="text-sm text-muted-foreground leading-tight">{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Results Dashboard */}
                    <div className="lg:col-span-12 xl:col-span-5 lg:sticky lg:top-8 h-fit">
                        {results ? (
                            <TCOResults results={results} onConsult={() => setShowLeadForm(true)} />
                        ) : (
                            <Card className="border-dashed border-2 bg-slate-50/50 min-h-[500px] flex items-center justify-center p-12">
                                <div className="text-center space-y-4 max-w-xs">
                                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto opacity-40">
                                        <Calculator className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-400">Aguardando Parâmetros</h3>
                                    <p className="text-sm text-slate-400">Preencha os dados ao lado para ver o comparativo financeiro em tempo real.</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}

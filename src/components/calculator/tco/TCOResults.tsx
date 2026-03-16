import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, ChevronRight, TrendingDown, Warehouse } from "lucide-react";

export interface TCOResultsData {
    importLandedUnitPrice: number;
    localLandedUnitPrice: number;
    annualImportTotal: number;
    annualLocalTotal: number;
    annualSavings: number;
    leadTimeReduction: number;
    capitalReleased: number;
    savingsPercent: number;
}

interface TCOResultsProps {
    results: TCOResultsData;
    onConsult: () => void;
}

export function TCOResults({ results, onConsult }: TCOResultsProps) {
    const isSavingsPositive = results.annualSavings >= 0;
    const savingsLabel = isSavingsPositive
        ? `Redução estimada de ${Math.abs(results.savingsPercent).toFixed(1)}% no cenário informado`
        : `O cenário local está ${Math.abs(results.savingsPercent).toFixed(1)}% acima da importação`;
    const relativeBarWidth = results.importLandedUnitPrice > 0
        ? Math.min((results.localLandedUnitPrice / results.importLandedUnitPrice) * 100, 100)
        : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
            <Card className="bg-primary text-primary-foreground overflow-hidden border-none shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <TrendingDown className="w-32 h-32" />
                </div>
                <CardHeader>
                    <CardTitle className="text-xl uppercase tracking-widest opacity-80">Delta Anual Estimado</CardTitle>
                    <div className="text-5xl font-black">
                        R$ {results.annualSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-primary-foreground/90 font-medium">
                        <TrendingDown className="w-5 h-5" />
                        <span>{savingsLabel}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3 text-sm text-amber-900">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            Simulação baseada nas premissas informadas no formulário. Impostos de importação, preço local, lead time e cobertura de estoque devem ser validados com dados reais antes de qualquer decisão.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Warehouse className="w-5 h-5 text-orange-500" />
                            <span className="font-bold text-muted-foreground uppercase text-xs tracking-tighter">Capital de Giro Liberado</span>
                        </div>
                        <div className="text-2xl font-bold">
                            R$ {results.capitalReleased.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Comparação entre a cobertura de estoque importada e a cobertura local informada.</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <span className="font-bold text-muted-foreground uppercase text-xs tracking-tighter">Redução de Lead Time</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {results.leadTimeReduction} Dias
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Diferença entre o lead time de importação e o lead time local preenchidos no cenário.</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/20">
                <CardHeader>
                    <CardTitle className="text-lg">Comparativo de Custo Unitário (Landed)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Importação</span>
                                <span className="font-mono">R$ {results.importLandedUnitPrice.toFixed(2)}</span>
                            </div>
                            <div className="h-4 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-slate-400 w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-sm font-bold text-primary">
                                <span>Local (cenário informado)</span>
                                <span className="font-mono">R$ {results.localLandedUnitPrice.toFixed(2)}</span>
                            </div>
                            <div className="h-4 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-1000"
                                    style={{ width: `${relativeBarWidth}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={`p-4 rounded-lg flex items-center justify-between mt-4 ${isSavingsPositive ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        <span className={`text-sm font-bold ${isSavingsPositive ? "text-green-700" : "text-red-700"}`}>Delta Unitário:</span>
                        <span className={`text-lg font-black ${isSavingsPositive ? "text-green-700" : "text-red-700"}`}>
                            {isSavingsPositive ? "-" : "+"} R$ {Math.abs(results.importLandedUnitPrice - results.localLandedUnitPrice).toFixed(2)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Button className="w-full py-8 text-xl font-bold gap-3 group" size="lg" onClick={onConsult}>
                Agendar Consultoria Técnica
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
    );
}

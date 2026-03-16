import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Globe, Home, Plane, Truck, Settings } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type ComponentCategory = 'swiss_machining' | 'cnc_turning' | 'injection_molding' | '3d_printing' | 'other';

export interface TCOInputs {
    componentType: string;
    category: ComponentCategory;
    annualVolume: number;
    importUnitPrice: number;
    importFreight: number;
    importTaxesPercent: number;
    exchangeRate: number;
    importLeadTimeDays: number;
    stockCoverageMonths: number;
    localUnitPrice: number;
    localLeadTimeDays: number;
    localStockCoverageMonths: number;
}

interface TCOFormProps {
    onCalculate: (data: TCOInputs) => void;
}

export function TCOForm({ onCalculate }: TCOFormProps) {
    const [formData, setFormData] = useState<TCOInputs>({
        componentType: "Bone Screw (Titânio)",
        category: "swiss_machining",
        annualVolume: 12000,
        importUnitPrice: 45.00,
        importFreight: 2500,
        importTaxesPercent: 17,
        exchangeRate: 5.16,
        importLeadTimeDays: 90,
        stockCoverageMonths: 6,
        localUnitPrice: 225,
        localLeadTimeDays: 30,
        localStockCoverageMonths: 1,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "componentType" ? value : parseFloat(value) || 0
        }));
    };

    const handleCategoryChange = (value: ComponentCategory) => {
        setFormData(prev => ({ ...prev, category: value }));
    };

    return (
        <Card className="shadow-xl border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm">
                    <Calculator className="w-5 h-5" />
                    Parâmetros de Manufatura
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="componentType">Tipo de Componente</Label>
                        <Input id="componentType" name="componentType" value={formData.componentType} onChange={handleChange} placeholder="Ex: Parafuso Ósseo" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Categoria Produtiva</Label>
                        <Select value={formData.category} onValueChange={handleCategoryChange}>
                            <SelectTrigger id="category" className="bg-white">
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="swiss_machining">Usinagem Suíça (Swiss-type)</SelectItem>
                                <SelectItem value="cnc_turning">Torno CNC Convencional</SelectItem>
                                <SelectItem value="injection_molding">Injeção Plástica</SelectItem>
                                <SelectItem value="3d_printing">Impressão 3D Industrial</SelectItem>
                                <SelectItem value="other">Outros Processos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="annualVolume">Volume Anual Estimado</Label>
                        <div className="relative">
                            <Input id="annualVolume" name="annualVolume" type="number" value={formData.annualVolume} onChange={handleChange} className="pl-8" />
                            <Settings className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stockCoverageMonths">Cobertura de Estoque (Meses)</Label>
                        <Input id="stockCoverageMonths" name="stockCoverageMonths" type="number" value={formData.stockCoverageMonths} onChange={handleChange} />
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                        <Plane className="w-4 h-4" /> Cenário de Importação (USD)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="importUnitPrice">Preço Unitário (FOB)</Label>
                            <Input id="importUnitPrice" name="importUnitPrice" type="number" value={formData.importUnitPrice} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="importFreight">Frete Médio Lote</Label>
                            <Input id="importFreight" name="importFreight" type="number" value={formData.importFreight} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="importTaxesPercent">Carga tributária estimada (%)</Label>
                            <Input id="importTaxesPercent" name="importTaxesPercent" type="number" value={formData.importTaxesPercent} onChange={handleChange} />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Ajuste impostos conforme NCM, origem, INCOTERM e UF de destino. Não existe alíquota única aplicável a todos os componentes médicos.
                    </p>
                </div>

                <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Logística & Financeiro
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="exchangeRate">Câmbio Base (R$/USD)</Label>
                            <Input id="exchangeRate" name="exchangeRate" type="number" step="0.01" value={formData.exchangeRate} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="importLeadTimeDays">Lead Time Total (Dias)</Label>
                            <Input id="importLeadTimeDays" name="importLeadTimeDays" type="number" value={formData.importLeadTimeDays} onChange={handleChange} />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Base cambial sugerida: PTAX Banco Central em 11/03/2026. Atualize conforme sua última referência financeira.
                    </p>
                </div>

                <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                        <Home className="w-4 h-4" /> Cenário Local / Cotação de Referência (BRL)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="localUnitPrice">Preço Unitário Local (R$)</Label>
                            <Input id="localUnitPrice" name="localUnitPrice" type="number" value={formData.localUnitPrice} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="localLeadTimeDays">Lead Time Local (Dias)</Label>
                            <Input id="localLeadTimeDays" name="localLeadTimeDays" type="number" value={formData.localLeadTimeDays} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="localStockCoverageMonths">Cobertura Local (Meses)</Label>
                            <Input id="localStockCoverageMonths" name="localStockCoverageMonths" type="number" step="0.1" value={formData.localStockCoverageMonths} onChange={handleChange} />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Use uma cotação real ou meta interna. Sem preço local validado, trate o resultado apenas como simulação comercial preliminar.
                    </p>
                </div>

                <Button className="w-full py-7 text-lg gap-2 shadow-xl shadow-primary/20 font-black uppercase tracking-widest" onClick={() => onCalculate(formData)}>
                    <Calculator className="w-5 h-5" />
                    Gerar Simulação de TCO
                </Button>
            </CardContent>
        </Card>
    );
}

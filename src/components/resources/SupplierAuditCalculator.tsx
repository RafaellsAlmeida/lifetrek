import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FormData {
    name: string;
    email: string;
    company: string;
}

interface SupplierAuditCalculatorProps {
    formData: FormData;
    setIsModalOpen: (open: boolean) => void;
}

const AUDIT_CATEGORIES = [
    {
        id: "sgq",
        label: "Sistema de Gestão da Qualidade",
        items: 6,
        questions: [
            "Manual da Qualidade disponível e atualizado?",
            "Política da Qualidade comunicada a todos?",
            "Objetivos mensuráveis definidos?",
            "Análises críticas documentadas (12 meses)?",
            "Indicadores acompanhados regularmente?",
            "Ações corretivas tratadas no prazo?"
        ]
    },
    {
        id: "docs",
        label: "Controle de Documentos",
        items: 6,
        questions: [
            "Procedimento de controle implementado?",
            "Índice mestre atualizado?",
            "Documentos obsoletos removidos?",
            "Aprovações rastreáveis?",
            "Registros legíveis e recuperáveis?",
            "Tempo de retenção definido?"
        ]
    },
    {
        id: "trace",
        label: "Rastreabilidade",
        items: 5,
        questions: [
            "Cada lote tem identificação única?",
            "Registros vinculam MP → processo → produto?",
            "Componentes rastreáveis por lote específico?",
            "Rastreabilidade mantida em subcontratados?",
            "Conseguem identificar lotes afetados em <24h?"
        ]
    },
    {
        id: "purchasing",
        label: "Controle de Compras",
        items: 6,
        questions: [
            "Lista de fornecedores aprovados atualizada?",
            "Critérios de seleção documentados?",
            "Avaliação de risco para críticos?",
            "Acordos de qualidade estabelecidos?",
            "Recebimento inclui verificação vs. spec?",
            "Ações para desempenho abaixo?"
        ]
    },
    {
        id: "validation",
        label: "Validação de Processos",
        items: 5,
        questions: [
            "Processos especiais identificados?",
            "Validação IQ/OQ/PQ documentada?",
            "Revalidação periódica programada?",
            "Operadores qualificados?",
            "Manutenção preventiva em equipamentos?"
        ]
    },
    {
        id: "metrology",
        label: "Controle de Metrologia",
        items: 5,
        questions: [
            "Lista mestre de equipamentos?",
            "Calibrações dentro da validade?",
            "Procedimento para fora de calibração?",
            "Identificação visual de status?",
            "Incerteza de medição considerada?"
        ]
    },
    {
        id: "capa",
        label: "NC e CAPAs",
        items: 6,
        questions: [
            "Procedimento de NC implementado?",
            "RNCs tratadas no prazo?",
            "Análise de causa raiz documentada?",
            "CAPAs com eficácia verificada?",
            "Reclamações registradas e investigadas?",
            "Tendências de NC analisadas?"
        ]
    }
];

const TOTAL_ITEMS = 39;

export default function SupplierAuditCalculator({ formData, setIsModalOpen }: SupplierAuditCalculatorProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [scores, setScores] = useState<Record<string, number[]>>(
        Object.fromEntries(AUDIT_CATEGORIES.map(cat => [cat.id, new Array(cat.items).fill(0)]))
    );

    const handleCheckToggle = (categoryId: string, index: number) => {
        setScores(prev => {
            const newCategoryScores = [...prev[categoryId]];
            newCategoryScores[index] = newCategoryScores[index] === 1 ? 0 : 1;
            return { ...prev, [categoryId]: newCategoryScores };
        });
    };

    const getCategoryScore = (categoryId: string) => {
        return scores[categoryId].reduce((sum, val) => sum + val, 0);
    };

    const getTotalScore = () => {
        return Object.values(scores).flat().reduce((sum, val) => sum + val, 0);
    };

    const getPercentage = () => {
        return Math.round((getTotalScore() / TOTAL_ITEMS) * 100);
    };

    const getClassification = () => {
        const pct = getPercentage();
        if (pct >= 90) return { label: "Fornecedor Confiável", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 };
        if (pct >= 75) return { label: "Aprovado com Observações", color: "text-yellow-600", bg: "bg-yellow-50", icon: AlertTriangle };
        if (pct >= 50) return { label: "Requer Plano de Ação", color: "text-orange-600", bg: "bg-orange-50", icon: AlertTriangle };
        return { label: "Alto Risco - Reavaliar", color: "text-red-600", bg: "bg-red-50", icon: XCircle };
    };

    const handleSave = async () => {
        if (!formData.name || !formData.email) {
            setIsModalOpen(true);
            toast({
                variant: "destructive",
                title: "Dados necessários",
                description: "Informe nome e email para salvar a avaliação."
            });
            return;
        }

        const classification = getClassification();
        const payload = {
            scores,
            total: getTotalScore(),
            percentage: getPercentage(),
            classification: classification.label
        };

        setStatus(null);
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from("contact_leads")
                .insert({
                    name: formData.name,
                    email: formData.email,
                    company: formData.company,
                    phone: "Nao informado",
                    project_type: "other_medical",
                    technical_requirements: `Audit Scorecard: ${getTotalScore()}/${TOTAL_ITEMS} (${getPercentage()}%) - ${classification.label}`,
                    message: `Supplier Audit Checklist. Responses: ${JSON.stringify(payload)}`
                });

            if (error) throw error;

            toast({
                title: "Avaliação salva",
                description: "Resultados registrados no CRM."
            });
            setStatus("Avaliação salva com sucesso!");
        } catch (err) {
            console.error("Error saving audit:", err);
            // Backup to localStorage
            const key = "lifetrek_lead_backups";
            try {
                const existing = JSON.parse(localStorage.getItem(key) || "[]");
                existing.push({ type: "supplier_audit", formData, payload, created_at: new Date().toISOString() });
                localStorage.setItem(key, JSON.stringify(existing));
            } catch { }
            toast({
                title: "Avaliação salva",
                description: "CRM indisponível. Salvo localmente."
            });
            setStatus("Avaliação salva localmente.");
        } finally {
            setIsSaving(false);
        }
    };

    const classification = getClassification();
    const ClassificationIcon = classification.icon;

    return (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-[#004F8F] to-[#1A7A3E] p-6 text-white">
                <div className="flex items-center gap-3">
                    <ClipboardCheck className="h-8 w-8" />
                    <div>
                        <h3 className="text-xl font-bold">Calculadora de Auditoria</h3>
                        <p className="text-white/80 text-sm">Avalie seu fornecedor nos 7 processos críticos</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {AUDIT_CATEGORIES.map(category => (
                    <div key={category.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{category.label}</span>
                            <span className={cn(
                                "text-sm font-bold px-2 py-1 rounded",
                                getCategoryScore(category.id) === category.items
                                    ? "bg-green-100 text-green-700"
                                    : getCategoryScore(category.id) >= category.items * 0.5
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                            )}>
                                {getCategoryScore(category.id)}/{category.items}
                            </span>
                        </div>
                        <div className="p-4 grid gap-2">
                            {category.questions.map((question, idx) => (
                                <label
                                    key={idx}
                                    className={cn(
                                        "flex items-center gap-3 text-sm p-2 rounded-lg cursor-pointer transition-colors",
                                        scores[category.id][idx] === 1
                                            ? "bg-green-50 text-green-800"
                                            : "text-slate-700 hover:bg-slate-50"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={scores[category.id][idx] === 1}
                                        onChange={() => handleCheckToggle(category.id, idx)}
                                        className="h-4 w-4 accent-[#1A7A3E] rounded"
                                    />
                                    {question}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Results Panel */}
            <div className={cn("p-6 border-t", classification.bg)}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-slate-900">{getTotalScore()}</div>
                            <div className="text-sm text-slate-500">de {TOTAL_ITEMS}</div>
                        </div>
                        <div className="w-px h-12 bg-slate-300" />
                        <div className="text-center">
                            <div className="text-4xl font-bold text-slate-900">{getPercentage()}%</div>
                            <div className="text-sm text-slate-500">conformidade</div>
                        </div>
                        <div className="w-px h-12 bg-slate-300" />
                        <div className="flex items-center gap-2">
                            <ClassificationIcon className={cn("h-6 w-6", classification.color)} />
                            <span className={cn("font-semibold", classification.color)}>
                                {classification.label}
                            </span>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} size="lg">
                        {isSaving ? "Salvando..." : "Salvar Avaliação"}
                    </Button>
                </div>
                {status && (
                    <p className="mt-4 text-sm text-slate-600">{status}</p>
                )}
            </div>
        </div>
    );
}

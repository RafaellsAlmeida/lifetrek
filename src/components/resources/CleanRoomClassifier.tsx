import { useState } from "react";
import { Wind, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Question {
    id: string;
    question: string;
    options: { label: string; value: number; detail: string }[];
}

const QUESTIONS: Question[] = [
    {
        id: "device_class",
        question: "Qual a classe de risco do seu dispositivo (ANVISA)?",
        options: [
            { label: "Classe I", value: 0, detail: "Baixo risco (ex: instrumental não-invasivo)" },
            { label: "Classe II", value: 1, detail: "Médio risco (ex: agulhas, cateteres simples)" },
            { label: "Classe III", value: 2, detail: "Alto risco (ex: implantes ortopédicos, stents)" },
            { label: "Classe IV", value: 3, detail: "Máximo risco (ex: válvulas cardíacas, marca-passos)" },
        ],
    },
    {
        id: "contact_type",
        question: "Qual o tipo de contato do dispositivo com o paciente?",
        options: [
            { label: "Sem contato / superfície intacta", value: 0, detail: "Equipamentos de diagnóstico, ferramentas externas" },
            { label: "Contato com mucosa / pele lesada", value: 1, detail: "Instrumentais cirúrgicos, sondas" },
            { label: "Implante temporário (<30 dias)", value: 2, detail: "Fixadores externos, drenos, cateteres" },
            { label: "Implante permanente (>30 dias)", value: 3, detail: "Implantes ortopédicos, dentários, cardiovasculares" },
        ],
    },
    {
        id: "sterile",
        question: "O produto é fornecido estéril ao usuário final?",
        options: [
            { label: "Não — uso sem esterilização", value: 0, detail: "Limpeza padrão antes do uso" },
            { label: "Não — esterilizado pelo hospital", value: 1, detail: "Reprocessamento em autoclave no hospital" },
            { label: "Sim — esterilizado pelo fabricante", value: 3, detail: "EtO, radiação gama ou vapor" },
        ],
    },
    {
        id: "assembly",
        question: "O processo inclui montagem de componentes ou kits?",
        options: [
            { label: "Não — peça unitária", value: 0, detail: "Componente usinado sem montagem" },
            { label: "Montagem simples (2-3 peças)", value: 1, detail: "Montagem de subconjuntos básicos" },
            { label: "Kit cirúrgico completo", value: 3, detail: "Múltiplos componentes, ancilares, embalagem final" },
        ],
    },
    {
        id: "bioburden",
        question: "Qual o nível de controle de bioburden exigido?",
        options: [
            { label: "Padrão de manufatura", value: 0, detail: "Limpeza convencional entre etapas" },
            { label: "Bioburden controlado", value: 1, detail: "Monitoramento de bioburden pré-esterilização" },
            { label: "Bioburden crítico (ISO 11737-1)", value: 2, detail: "Limites documentados, validação periódica" },
        ],
    },
];

interface Recommendation {
    isoClass: string;
    description: string;
    maxParticles05: string;
    maxParticles5: string;
    keyControls: string[];
    investment: string;
    color: string;
    bgColor: string;
}

const RECOMMENDATIONS: Record<string, Recommendation> = {
    standard: {
        isoClass: "Ambiente Controlado (sem classificação ISO)",
        description: "Área limpa com controle básico de partículas, temperatura e umidade. Adequada para usinagem e operações sem contato direto.",
        maxParticles05: "Não especificado",
        maxParticles5: "Não especificado",
        keyControls: [
            "Controle de temperatura (20-25°C) e umidade (40-60% RH)",
            "Filtragem de ar básica",
            "Limpeza programada",
            "Vestimenta padrão de fábrica",
        ],
        investment: "Baixo — adapta infraestrutura existente",
        color: "text-green-700",
        bgColor: "bg-green-50",
    },
    iso8: {
        isoClass: "ISO 8 (Classe 100.000)",
        description: "Ambiente com filtração HEPA para operações de limpeza, inspeção e embalagem primária de componentes de risco moderado.",
        maxParticles05: "3.520.000/m³",
        maxParticles5: "29.300/m³",
        keyControls: [
            "Filtros HEPA (H13) no sistema de HVAC",
            "Pressão diferencial positiva (≥5 Pa)",
            "Vestimenta controlada (jaleco, touca, sapatilha)",
            "Monitoramento de partículas semestral",
            "Controle de acesso",
        ],
        investment: "Moderado — R$ 200-500k para área de 50m²",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
    },
    iso7: {
        isoClass: "ISO 7 (Classe 10.000)",
        description: "Sala limpa com controles rigorosos para montagem de kits cirúrgicos, embalagem final e operações pré-esterilização. Padrão Lifetrek.",
        maxParticles05: "352.000/m³",
        maxParticles5: "2.930/m³",
        keyControls: [
            "Filtros HEPA (H14) com ≥20 trocas de ar/hora",
            "Pressão diferencial positiva (≥10 Pa entre zonas)",
            "Vestimenta completa (macacão, luvas, máscara, sapatilhas)",
            "Antecâmara com air lock",
            "Monitoramento contínuo de partículas e microbiológico",
            "Qualificação IQ/OQ/PQ documentada",
            "Requalificação anual (ISO 14644-2)",
        ],
        investment: "Alto — R$ 500k-1.5M para área de 50m²",
        color: "text-purple-700",
        bgColor: "bg-purple-50",
    },
    iso6: {
        isoClass: "ISO 6 (Classe 1.000) ou superior",
        description: "Ambiente de altíssima pureza para operações com dispositivos Classe IV ou processos assépticos. Raramente necessário para usinagem.",
        maxParticles05: "35.200/m³",
        maxParticles5: "293/m³",
        keyControls: [
            "Fluxo laminar unidirecional (≥0.36 m/s)",
            "Filtros ULPA (U15/U16)",
            "Vestimenta de sala limpa completa com escafandro",
            "Monitoramento contínuo em tempo real",
            "Validação microbiológica rigorosa",
            "Treinamento anual documentado de todos os operadores",
            "Protocolo de transferência de materiais via pass-through",
        ],
        investment: "Muito alto — R$ 1.5M+ para área de 50m²",
        color: "text-red-700",
        bgColor: "bg-red-50",
    },
};

export default function CleanRoomClassifier() {
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [showResult, setShowResult] = useState(false);

    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    const allAnswered = Object.keys(answers).length === QUESTIONS.length;

    const getRecommendation = (): Recommendation => {
        if (totalScore <= 2) return RECOMMENDATIONS.standard;
        if (totalScore <= 5) return RECOMMENDATIONS.iso8;
        if (totalScore <= 9) return RECOMMENDATIONS.iso7;
        return RECOMMENDATIONS.iso6;
    };

    const handleCalculate = () => {
        if (allAnswered) setShowResult(true);
    };

    const handleReset = () => {
        setAnswers({});
        setShowResult(false);
    };

    const rec = getRecommendation();

    return (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-[#1A7A3E] to-[#28A956] p-6 text-white">
                <div className="flex items-center gap-3">
                    <Wind className="h-8 w-8" />
                    <div>
                        <h3 className="text-xl font-bold">Classificador de Sala Limpa</h3>
                        <p className="text-white/80 text-sm">Descubra qual classe ISO sua operação requer</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {QUESTIONS.map((q, qIdx) => (
                    <div key={q.id}>
                        <div className="flex items-start gap-3 mb-4">
                            <span className="bg-slate-100 text-slate-600 font-bold text-sm rounded-full w-7 h-7 flex items-center justify-center shrink-0">
                                {qIdx + 1}
                            </span>
                            <h4 className="font-semibold text-slate-800">{q.question}</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-10">
                            {q.options.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => {
                                        setAnswers(prev => ({ ...prev, [q.id]: opt.value }));
                                        setShowResult(false);
                                    }}
                                    className={cn(
                                        "text-left p-4 rounded-lg border-2 transition-all",
                                        answers[q.id] === opt.value
                                            ? "border-[#1A7A3E] bg-green-50 shadow-md"
                                            : "border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    <div className="font-semibold text-sm text-slate-800">{opt.label}</div>
                                    <div className="text-xs text-slate-500 mt-1">{opt.detail}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Calculate Button */}
                <div className="flex justify-center pt-4">
                    <Button
                        size="lg"
                        onClick={handleCalculate}
                        disabled={!allAnswered}
                        className="px-8 py-6 text-base gap-2"
                    >
                        Ver Recomendação
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Result */}
                {showResult && (
                    <div className={cn("rounded-xl border-2 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500", rec.bgColor)}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle2 className={cn("h-8 w-8", rec.color)} />
                                <div>
                                    <h4 className={cn("text-xl font-bold", rec.color)}>{rec.isoClass}</h4>
                                    <p className="text-sm text-slate-600">{rec.description}</p>
                                </div>
                            </div>

                            {/* Particle limits */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white rounded-lg p-4 border">
                                    <div className="text-xs text-slate-500 mb-1">Max. partículas ≥0.5μm/m³</div>
                                    <div className="text-lg font-bold text-slate-800">{rec.maxParticles05}</div>
                                </div>
                                <div className="bg-white rounded-lg p-4 border">
                                    <div className="text-xs text-slate-500 mb-1">Max. partículas ≥5.0μm/m³</div>
                                    <div className="text-lg font-bold text-slate-800">{rec.maxParticles5}</div>
                                </div>
                            </div>

                            {/* Key controls */}
                            <div className="mb-6">
                                <h5 className="font-semibold text-slate-800 mb-3">Controles Requeridos:</h5>
                                <ul className="space-y-2">
                                    {rec.keyControls.map((control, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                            {control}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Investment */}
                            <div className="bg-white rounded-lg p-4 border flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">Investimento Estimado</div>
                                    <div className="text-sm text-slate-600">{rec.investment}</div>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700 underline">
                                    Recalcular
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reference table */}
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b">
                        <h5 className="font-semibold text-slate-700 text-sm">Referência: Classes ISO 14644-1</h5>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold text-slate-600">Classe ISO</th>
                                    <th className="px-4 py-2 text-left font-semibold text-slate-600">Nome Usual</th>
                                    <th className="px-4 py-2 text-right font-semibold text-slate-600">≥0.5μm/m³</th>
                                    <th className="px-4 py-2 text-right font-semibold text-slate-600">≥5.0μm/m³</th>
                                    <th className="px-4 py-2 text-left font-semibold text-slate-600">Uso Típico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {[
                                    { cls: "ISO 5", name: "Classe 100", p05: "3.520", p5: "29", use: "Processos assépticos" },
                                    { cls: "ISO 6", name: "Classe 1.000", p05: "35.200", p5: "293", use: "Implantes Classe IV" },
                                    { cls: "ISO 7", name: "Classe 10.000", p05: "352.000", p5: "2.930", use: "Montagem de kits, embalagem" },
                                    { cls: "ISO 8", name: "Classe 100.000", p05: "3.520.000", p5: "29.300", use: "Inspeção, limpeza final" },
                                ].map(row => (
                                    <tr key={row.cls} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-semibold">{row.cls}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.name}</td>
                                        <td className="px-4 py-3 text-right font-mono">{row.p05}</td>
                                        <td className="px-4 py-3 text-right font-mono">{row.p5}</td>
                                        <td className="px-4 py-3 text-slate-600">{row.use}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Settings, ArrowRight, CheckCircle2, XCircle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PartSpecs {
    maxDiameter: string;
    ldRatio: string;
    material: string;
    features: string[];
    volume: string;
    tolerance: string;
}

const DIAMETER_OPTIONS = [
    { label: "≤6 mm", value: "small" },
    { label: "6–20 mm", value: "medium" },
    { label: "20–32 mm", value: "large" },
    { label: ">32 mm", value: "xlarge" },
];

const LD_OPTIONS = [
    { label: "≤2:1 (curta)", value: "low" },
    { label: "2:1–4:1 (moderada)", value: "medium" },
    { label: "4:1–8:1 (longa)", value: "high" },
    { label: ">8:1 (muito longa)", value: "vhigh" },
];

const MATERIAL_OPTIONS = [
    { label: "Titânio (Ti-6Al-4V)", value: "titanium" },
    { label: "Inox 316L", value: "stainless" },
    { label: "PEEK", value: "peek" },
    { label: "CoCr", value: "cocr" },
    { label: "Alumínio", value: "aluminum" },
];

const FEATURE_OPTIONS = [
    { label: "Roscas externas", value: "ext_thread" },
    { label: "Roscas internas", value: "int_thread" },
    { label: "Furos transversais", value: "cross_holes" },
    { label: "Hexágono interno", value: "hex_socket" },
    { label: "Canais/ranhuras", value: "grooves" },
    { label: "Perfil complexo 3D", value: "3d_profile" },
];

const VOLUME_OPTIONS = [
    { label: "<100 peças/ano", value: "proto" },
    { label: "100–1.000 peças/ano", value: "low" },
    { label: "1.000–10.000 peças/ano", value: "medium" },
    { label: ">10.000 peças/ano", value: "high" },
];

const TOLERANCE_OPTIONS = [
    { label: "±0.05 mm (padrão)", value: "standard" },
    { label: "±0.01–0.02 mm (precisa)", value: "precise" },
    { label: "±0.005 mm (alta precisão)", value: "high" },
    { label: "±0.002 mm (ultra-precisão)", value: "ultra" },
];

function calculateRecommendation(specs: PartSpecs) {
    let swissScore = 0;
    let conventionalScore = 0;
    let fiveAxisScore = 0;

    // Diameter
    if (specs.maxDiameter === "small") { swissScore += 5; conventionalScore += 1; fiveAxisScore += 1; }
    else if (specs.maxDiameter === "medium") { swissScore += 4; conventionalScore += 3; fiveAxisScore += 2; }
    else if (specs.maxDiameter === "large") { swissScore += 2; conventionalScore += 4; fiveAxisScore += 3; }
    else { swissScore += 0; conventionalScore += 4; fiveAxisScore += 4; }

    // L/D ratio
    if (specs.ldRatio === "vhigh") { swissScore += 5; conventionalScore += 1; }
    else if (specs.ldRatio === "high") { swissScore += 4; conventionalScore += 2; }
    else if (specs.ldRatio === "medium") { swissScore += 3; conventionalScore += 3; }
    else { swissScore += 1; conventionalScore += 4; fiveAxisScore += 2; }

    // Features
    const features = specs.features;
    if (features.includes("ext_thread")) swissScore += 3;
    if (features.includes("int_thread")) swissScore += 2;
    if (features.includes("grooves")) swissScore += 2;
    if (features.includes("cross_holes")) { swissScore += 2; fiveAxisScore += 3; }
    if (features.includes("hex_socket")) { swissScore += 2; fiveAxisScore += 2; }
    if (features.includes("3d_profile")) { fiveAxisScore += 5; swissScore += 1; }

    // Volume
    if (specs.volume === "high") { swissScore += 4; conventionalScore += 3; }
    else if (specs.volume === "medium") { swissScore += 3; conventionalScore += 3; }
    else if (specs.volume === "low") { swissScore += 2; conventionalScore += 3; fiveAxisScore += 2; }
    else { conventionalScore += 2; fiveAxisScore += 3; }

    // Tolerance
    if (specs.tolerance === "ultra") { swissScore += 3; conventionalScore += 1; }
    else if (specs.tolerance === "high") { swissScore += 3; conventionalScore += 2; }
    else if (specs.tolerance === "precise") { swissScore += 2; conventionalScore += 3; }
    else { conventionalScore += 3; swissScore += 1; }

    const results = [
        { process: "CNC Swiss (Torno Suíço)", score: swissScore, machine: "Citizen Cincom L20/M32", color: "text-[#004F8F]", bg: "bg-blue-50", border: "border-blue-200" },
        { process: "CNC Convencional (Torno/Centro)", score: conventionalScore, machine: "Torno CNC + Centro de Usinagem", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
        { process: "Fresamento 5 Eixos", score: fiveAxisScore, machine: "Centro de Usinagem 5-Eixos", color: "text-[#1A7A3E]", bg: "bg-green-50", border: "border-green-200" },
    ];

    results.sort((a, b) => b.score - a.score);
    return results;
}

export default function SwissVsConventionalTool() {
    const [specs, setSpecs] = useState<PartSpecs>({
        maxDiameter: "",
        ldRatio: "",
        material: "",
        features: [],
        volume: "",
        tolerance: "",
    });
    const [showResult, setShowResult] = useState(false);

    const isComplete = specs.maxDiameter && specs.ldRatio && specs.material && specs.volume && specs.tolerance;

    const toggleFeature = (value: string) => {
        setSpecs(prev => ({
            ...prev,
            features: prev.features.includes(value)
                ? prev.features.filter(f => f !== value)
                : [...prev.features, value],
        }));
        setShowResult(false);
    };

    const setField = (field: keyof PartSpecs, value: string) => {
        setSpecs(prev => ({ ...prev, [field]: value }));
        setShowResult(false);
    };

    const results = isComplete ? calculateRecommendation(specs) : [];

    const renderOptions = (options: { label: string; value: string }[], field: keyof PartSpecs) => (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-10">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => setField(field, opt.value)}
                    className={cn(
                        "text-left p-3 rounded-lg border-2 transition-all text-sm",
                        specs[field] === opt.value
                            ? "border-[#004F8F] bg-blue-50 shadow-sm font-semibold"
                            : "border-slate-200 hover:border-slate-300"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-[#004F8F] to-[#1A7A3E] p-6 text-white">
                <div className="flex items-center gap-3">
                    <Settings className="h-8 w-8" />
                    <div>
                        <h3 className="text-xl font-bold">Swiss vs. Convencional: Qual processo escolher?</h3>
                        <p className="text-white/80 text-sm">Descreva sua peça e receba a recomendação de processo</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Q1: Diameter */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-slate-100 text-slate-600 font-bold text-sm rounded-full w-7 h-7 flex items-center justify-center shrink-0">1</span>
                        <h4 className="font-semibold text-slate-800">Diâmetro máximo da peça</h4>
                    </div>
                    {renderOptions(DIAMETER_OPTIONS, "maxDiameter")}
                </div>

                {/* Q2: L/D */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-slate-100 text-slate-600 font-bold text-sm rounded-full w-7 h-7 flex items-center justify-center shrink-0">2</span>
                        <h4 className="font-semibold text-slate-800">Relação comprimento/diâmetro (L/D)</h4>
                    </div>
                    {renderOptions(LD_OPTIONS, "ldRatio")}
                </div>

                {/* Q3: Material */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-slate-100 text-slate-600 font-bold text-sm rounded-full w-7 h-7 flex items-center justify-center shrink-0">3</span>
                        <h4 className="font-semibold text-slate-800">Material</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 ml-10">
                        {MATERIAL_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setField("material", opt.value)}
                                className={cn(
                                    "text-left p-3 rounded-lg border-2 transition-all text-sm",
                                    specs.material === opt.value
                                        ? "border-[#004F8F] bg-blue-50 shadow-sm font-semibold"
                                        : "border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Q4: Features */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-slate-100 text-slate-600 font-bold text-sm rounded-full w-7 h-7 flex items-center justify-center shrink-0">4</span>
                        <h4 className="font-semibold text-slate-800">Features da peça (selecione todas aplicáveis)</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-10">
                        {FEATURE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => toggleFeature(opt.value)}
                                className={cn(
                                    "text-left p-3 rounded-lg border-2 transition-all text-sm flex items-center gap-2",
                                    specs.features.includes(opt.value)
                                        ? "border-[#1A7A3E] bg-green-50 shadow-sm font-semibold"
                                        : "border-slate-200 hover:border-slate-300"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                                    specs.features.includes(opt.value) ? "bg-[#1A7A3E] border-[#1A7A3E]" : "border-slate-300"
                                )}>
                                    {specs.features.includes(opt.value) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                </div>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Q5: Volume */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-slate-100 text-slate-600 font-bold text-sm rounded-full w-7 h-7 flex items-center justify-center shrink-0">5</span>
                        <h4 className="font-semibold text-slate-800">Volume anual estimado</h4>
                    </div>
                    {renderOptions(VOLUME_OPTIONS, "volume")}
                </div>

                {/* Q6: Tolerance */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-slate-100 text-slate-600 font-bold text-sm rounded-full w-7 h-7 flex items-center justify-center shrink-0">6</span>
                        <h4 className="font-semibold text-slate-800">Tolerância dimensional mais apertada</h4>
                    </div>
                    {renderOptions(TOLERANCE_OPTIONS, "tolerance")}
                </div>

                {/* Calculate */}
                <div className="flex justify-center pt-4">
                    <Button
                        size="lg"
                        onClick={() => setShowResult(true)}
                        disabled={!isComplete}
                        className="px-8 py-6 text-base gap-2"
                    >
                        Analisar Processo Ideal
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Results */}
                {showResult && results.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h4 className="font-bold text-slate-800 text-lg text-center">Recomendação de Processo</h4>
                        {results.map((r, idx) => {
                            const maxScore = results[0].score;
                            const pct = Math.round((r.score / maxScore) * 100);
                            return (
                                <div key={r.process} className={cn("rounded-xl border-2 p-5", idx === 0 ? r.border : "border-slate-200")}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {idx === 0 ? (
                                                <CheckCircle2 className={cn("h-6 w-6", r.color)} />
                                            ) : idx === results.length - 1 ? (
                                                <XCircle className="h-6 w-6 text-slate-400" />
                                            ) : (
                                                <Minus className="h-6 w-6 text-slate-400" />
                                            )}
                                            <div>
                                                <div className={cn("font-bold", idx === 0 ? r.color : "text-slate-600")}>
                                                    {idx === 0 ? "RECOMENDADO: " : ""}{r.process}
                                                </div>
                                                <div className="text-xs text-slate-500">{r.machine}</div>
                                            </div>
                                        </div>
                                        <span className={cn("text-lg font-bold", idx === 0 ? r.color : "text-slate-400")}>
                                            {pct}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3">
                                        <div
                                            className={cn("h-3 rounded-full transition-all duration-700", idx === 0 ? "bg-[#004F8F]" : idx === 1 ? "bg-slate-400" : "bg-slate-300")}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mt-4">
                            <strong>Nota:</strong> Esta análise é uma orientação inicial baseada nas especificações informadas.
                            A recomendação final depende de análise do desenho técnico pela equipe de engenharia Lifetrek.
                            Fatores como geometria específica, acabamento superficial e requisitos regulatórios podem alterar a escolha do processo.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

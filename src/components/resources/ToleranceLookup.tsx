import { useState } from "react";
import { Ruler, Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const MATERIALS = [
    { id: "ti6al4v", label: "Ti-6Al-4V ELI (ASTM F136)", machinability: "Difícil", notes: "Requer refrigeração abundante, baixa velocidade de corte" },
    { id: "ss316l", label: "Aço Inox 316L (ASTM F138)", machinability: "Moderada", notes: "Tendência ao encruamento; usar ferramentas afiadas" },
    { id: "peek", label: "PEEK (ASTM F2026)", machinability: "Boa", notes: "Sensível ao calor; evitar aquecimento excessivo" },
    { id: "cocr", label: "CoCr (ASTM F1537)", machinability: "Difícil", notes: "Altamente abrasivo; desgaste acelerado de ferramenta" },
    { id: "nitinol", label: "Nitinol (ASTM F2063)", machinability: "Muito difícil", notes: "Super-elástico; requer fixação especial e parâmetros específicos" },
];

const PROCESSES = [
    { id: "swiss", label: "Torneamento Suíço (CNC Swiss)" },
    { id: "5axis", label: "Fresamento 5 Eixos" },
    { id: "conventional", label: "Torneamento CNC Convencional" },
    { id: "grinding", label: "Retificação Cilíndrica" },
];

interface ToleranceData {
    diameter: string;
    length: string;
    concentricity: string;
    surfaceRa: string;
    threadPitch: string;
    bestFor: string;
}

const TOLERANCE_MATRIX: Record<string, Record<string, ToleranceData>> = {
    ti6al4v: {
        swiss: { diameter: "±0.005 mm", length: "±0.010 mm", concentricity: "≤0.008 mm", surfaceRa: "Ra 0.4–0.8 μm", threadPitch: "±0.005 mm", bestFor: "Parafusos ósseos, pinos de bloqueio, abutments" },
        "5axis": { diameter: "±0.010 mm", length: "±0.015 mm", concentricity: "≤0.015 mm", surfaceRa: "Ra 0.8–1.6 μm", threadPitch: "N/A", bestFor: "Placas ortopédicas, componentes complexos 3D" },
        conventional: { diameter: "±0.010 mm", length: "±0.020 mm", concentricity: "≤0.015 mm", surfaceRa: "Ra 0.8–1.6 μm", threadPitch: "±0.010 mm", bestFor: "Hastes, espaçadores, peças maiores" },
        grinding: { diameter: "±0.002 mm", length: "±0.005 mm", concentricity: "≤0.003 mm", surfaceRa: "Ra 0.05–0.2 μm", threadPitch: "N/A", bestFor: "Superfícies de contato, cones morse" },
    },
    ss316l: {
        swiss: { diameter: "±0.005 mm", length: "±0.008 mm", concentricity: "≤0.005 mm", surfaceRa: "Ra 0.2–0.6 μm", threadPitch: "±0.005 mm", bestFor: "Parafusos, pinos, instrumental cirúrgico" },
        "5axis": { diameter: "±0.008 mm", length: "±0.012 mm", concentricity: "≤0.010 mm", surfaceRa: "Ra 0.6–1.2 μm", threadPitch: "N/A", bestFor: "Instrumentais complexos, guias cirúrgicos" },
        conventional: { diameter: "±0.008 mm", length: "±0.015 mm", concentricity: "≤0.012 mm", surfaceRa: "Ra 0.6–1.2 μm", threadPitch: "±0.008 mm", bestFor: "Hastes, componentes de montagem" },
        grinding: { diameter: "±0.002 mm", length: "±0.003 mm", concentricity: "≤0.003 mm", surfaceRa: "Ra 0.02–0.1 μm", threadPitch: "N/A", bestFor: "Superfícies de precisão, sedes de vedação" },
    },
    peek: {
        swiss: { diameter: "±0.010 mm", length: "±0.015 mm", concentricity: "≤0.010 mm", surfaceRa: "Ra 0.4–1.0 μm", threadPitch: "±0.008 mm", bestFor: "Espaçadores intervertebrais, componentes de trauma" },
        "5axis": { diameter: "±0.015 mm", length: "±0.020 mm", concentricity: "≤0.015 mm", surfaceRa: "Ra 0.8–1.6 μm", threadPitch: "N/A", bestFor: "Cages, implantes anatômicos" },
        conventional: { diameter: "±0.015 mm", length: "±0.025 mm", concentricity: "≤0.020 mm", surfaceRa: "Ra 0.8–1.6 μm", threadPitch: "±0.012 mm", bestFor: "Componentes simples, protótipos" },
        grinding: { diameter: "±0.005 mm", length: "±0.008 mm", concentricity: "≤0.005 mm", surfaceRa: "Ra 0.1–0.4 μm", threadPitch: "N/A", bestFor: "Superfícies de contato articular" },
    },
    cocr: {
        swiss: { diameter: "±0.008 mm", length: "±0.012 mm", concentricity: "≤0.010 mm", surfaceRa: "Ra 0.4–1.0 μm", threadPitch: "±0.008 mm", bestFor: "Componentes dentários, hastes femorais pequenas" },
        "5axis": { diameter: "±0.010 mm", length: "±0.015 mm", concentricity: "≤0.015 mm", surfaceRa: "Ra 0.8–1.6 μm", threadPitch: "N/A", bestFor: "Componentes articulares, próteses" },
        conventional: { diameter: "±0.012 mm", length: "±0.020 mm", concentricity: "≤0.018 mm", surfaceRa: "Ra 1.0–2.0 μm", threadPitch: "±0.010 mm", bestFor: "Componentes maiores, blanks" },
        grinding: { diameter: "±0.002 mm", length: "±0.005 mm", concentricity: "≤0.003 mm", surfaceRa: "Ra 0.02–0.1 μm", threadPitch: "N/A", bestFor: "Superfícies articulares, cabeças femorais" },
    },
    nitinol: {
        swiss: { diameter: "±0.010 mm", length: "±0.015 mm", concentricity: "≤0.012 mm", surfaceRa: "Ra 0.4–1.0 μm", threadPitch: "±0.010 mm", bestFor: "Stents, fios-guia, clipes" },
        "5axis": { diameter: "±0.015 mm", length: "±0.020 mm", concentricity: "≤0.020 mm", surfaceRa: "Ra 1.0–2.0 μm", threadPitch: "N/A", bestFor: "Componentes shape-memory complexos" },
        conventional: { diameter: "±0.015 mm", length: "±0.025 mm", concentricity: "≤0.020 mm", surfaceRa: "Ra 1.0–2.0 μm", threadPitch: "±0.012 mm", bestFor: "Blanks para processamento posterior" },
        grinding: { diameter: "±0.003 mm", length: "±0.008 mm", concentricity: "≤0.005 mm", surfaceRa: "Ra 0.1–0.4 μm", threadPitch: "N/A", bestFor: "Acabamento final de stents, superfícies críticas" },
    },
};

export default function ToleranceLookup() {
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
    const [selectedProcess, setSelectedProcess] = useState<string | null>(null);

    const result = selectedMaterial && selectedProcess
        ? TOLERANCE_MATRIX[selectedMaterial]?.[selectedProcess]
        : null;

    const materialInfo = MATERIALS.find(m => m.id === selectedMaterial);

    return (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-[#004F8F] to-[#0077CC] p-6 text-white">
                <div className="flex items-center gap-3">
                    <Ruler className="h-8 w-8" />
                    <div>
                        <h3 className="text-xl font-bold">Consulta de Tolerâncias Alcançáveis</h3>
                        <p className="text-white/80 text-sm">Selecione material e processo para ver as tolerâncias típicas</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Faixas indicativas para triagem comercial e técnica. Capabilidade final depende de geometria, relação L/D, fixação, estratégia de medição, condição da ferramenta, volume e MSA do método.
                </div>

                {/* Material Selection */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-3 block">1. Selecione o Material</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {MATERIALS.map(mat => (
                            <button
                                key={mat.id}
                                onClick={() => setSelectedMaterial(mat.id)}
                                className={cn(
                                    "text-left p-4 rounded-lg border-2 transition-all",
                                    selectedMaterial === mat.id
                                        ? "border-[#004F8F] bg-blue-50 shadow-md"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className="font-semibold text-sm text-slate-800">{mat.label}</div>
                                <div className="text-xs text-slate-500 mt-1">Usinabilidade: {mat.machinability}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Process Selection */}
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-3 block">2. Selecione o Processo</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {PROCESSES.map(proc => (
                            <button
                                key={proc.id}
                                onClick={() => setSelectedProcess(proc.id)}
                                className={cn(
                                    "text-left p-4 rounded-lg border-2 transition-all",
                                    selectedProcess === proc.id
                                        ? "border-[#1A7A3E] bg-green-50 shadow-md"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className="font-semibold text-sm text-slate-800">{proc.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Material Note */}
                {materialInfo && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <span className="font-semibold text-amber-800 text-sm">{materialInfo.label}:</span>
                            <span className="text-amber-700 text-sm ml-1">{materialInfo.notes}</span>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result ? (
                    <div className="border rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b">
                            <h4 className="font-bold text-slate-800">Faixas de Referência</h4>
                            <p className="text-xs text-slate-500 mt-1">Valores indicativos para produção estável; confirmar no desenho e no plano metrológico do projeto</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {[
                                    { label: "Diâmetro", value: result.diameter, icon: "⌀" },
                                    { label: "Comprimento", value: result.length, icon: "↔" },
                                    { label: "Concentricidade", value: result.concentricity, icon: "◎" },
                                ].map((item, i) => (
                                    <div key={i} className="bg-white border rounded-lg p-4 text-center">
                                        <div className="text-2xl mb-1">{item.icon}</div>
                                        <div className="text-lg font-bold text-[#004F8F]">{item.value}</div>
                                        <div className="text-xs text-slate-500">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white border rounded-lg p-4">
                                    <div className="text-sm font-semibold text-slate-700 mb-1">Rugosidade Superficial</div>
                                    <div className="text-lg font-bold text-[#1A7A3E]">{result.surfaceRa}</div>
                                </div>
                                <div className="bg-white border rounded-lg p-4">
                                    <div className="text-sm font-semibold text-slate-700 mb-1">Passo de Rosca</div>
                                    <div className="text-lg font-bold text-[#1A7A3E]">{result.threadPitch}</div>
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="text-sm font-semibold text-blue-800 mb-1">Aplicações Recomendadas</div>
                                <div className="text-sm text-blue-700">{result.bestFor}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
                        <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">Selecione material e processo acima para ver as tolerâncias</p>
                    </div>
                )}
            </div>
        </div>
    );
}

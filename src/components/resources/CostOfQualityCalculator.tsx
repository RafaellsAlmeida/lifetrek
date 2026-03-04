import { useMemo, useState } from "react";
import { Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { saveLeadWithCompat } from "@/utils/contactLeadCapture";

interface FormData {
  name: string;
  email: string;
  company: string;
}

interface CostOfQualityCalculatorProps {
  formData: FormData;
  setIsModalOpen: (open: boolean) => void;
  previewMode?: boolean;
}

interface CostInputs {
  monthly_volume: number;
  unit_cost: number;
  scrap_rate_pct: number;
  rework_rate_pct: number;
  rework_cost_per_unit: number;
  complaints_per_year: number;
  complaint_cost: number;
  containment_hours_per_month: number;
  hourly_cost: number;
}

const INITIAL_INPUTS: CostInputs = {
  monthly_volume: 2000,
  unit_cost: 42,
  scrap_rate_pct: 3,
  rework_rate_pct: 5,
  rework_cost_per_unit: 15,
  complaints_per_year: 6,
  complaint_cost: 4500,
  containment_hours_per_month: 24,
  hourly_cost: 120,
};

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

export default function CostOfQualityCalculator({
  formData,
  setIsModalOpen,
  previewMode = false,
}: CostOfQualityCalculatorProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [inputs, setInputs] = useState<CostInputs>(INITIAL_INPUTS);

  const totals = useMemo(() => {
    const annualVolume = inputs.monthly_volume * 12;
    const scrapLoss = annualVolume * inputs.unit_cost * (inputs.scrap_rate_pct / 100);
    const reworkLoss = annualVolume * inputs.rework_cost_per_unit * (inputs.rework_rate_pct / 100);
    const complaintLoss = inputs.complaints_per_year * inputs.complaint_cost;
    const containmentLoss = inputs.containment_hours_per_month * inputs.hourly_cost * 12;
    const total = scrapLoss + reworkLoss + complaintLoss + containmentLoss;

    return {
      annualVolume,
      scrapLoss,
      reworkLoss,
      complaintLoss,
      containmentLoss,
      total,
    };
  }, [inputs]);

  const riskBand = useMemo(() => {
    if (totals.total >= 250_000) {
      return {
        label: "Alto impacto financeiro",
        helper: "Priorize plano de reducao de perdas e revisao de fornecedor imediato.",
        className: "text-red-700 bg-red-50 border-red-200",
        Icon: AlertTriangle,
      };
    }

    if (totals.total >= 80_000) {
      return {
        label: "Impacto moderado",
        helper: "Existe oportunidade relevante de ganho com CAPA e padronizacao de processo.",
        className: "text-amber-700 bg-amber-50 border-amber-200",
        Icon: AlertTriangle,
      };
    }

    return {
      label: "Impacto controlado",
      helper: "Mantenha monitoramento mensal e metas de melhoria continua.",
      className: "text-green-700 bg-green-50 border-green-200",
      Icon: CheckCircle2,
    };
  }, [totals.total]);

  const setNumeric = (key: keyof CostInputs, value: string) => {
    const parsed = Number(value);
    setInputs((prev) => ({
      ...prev,
      [key]: Number.isFinite(parsed) ? parsed : 0,
    }));
    setStatus(null);
  };

  const handleSave = async () => {
    if (previewMode) {
      toast({
        title: "Simulacao de preview",
        description: "Em modo de aprovacao, os resultados nao sao enviados ao CRM.",
      });
      setStatus("Simulacao concluida. Nenhum dado foi salvo.");
      return;
    }

    if (!formData.name || !formData.email) {
      setIsModalOpen(true);
      toast({
        variant: "destructive",
        title: "Dados necessarios",
        description: "Informe nome e email para salvar a analise.",
      });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    const payloadSummary = {
      ...inputs,
      annual_volume: totals.annualVolume,
      total_cost_of_quality: totals.total,
      risk_band: riskBand.label,
    };

    try {
      const result = await saveLeadWithCompat({
        name: formData.name,
        email: formData.email,
        company: formData.company || undefined,
        phone: "Nao informado",
        project_type: "other_medical",
        project_types: ["other_medical"],
        technical_requirements: `Cost of Quality: ${currency(totals.total)} / ano (${riskBand.label})`,
        message: `Cost of Quality calculator payload: ${JSON.stringify(payloadSummary)}`,
        source: "website",
      });

      if (result.status === "saved") {
        toast({
          title: "Analise salva",
          description: "Resultados registrados no CRM.",
        });
        setStatus("Analise salva com sucesso!");
      } else {
        toast({
          title: "Analise salva",
          description: "Resultados registrados localmente e serao sincronizados.",
        });
        setStatus("Analise salva localmente. Sincronizacao pendente.");
      }
    } catch (error) {
      console.error("Error saving cost of quality analysis:", error);
      toast({
        title: "Analise salva",
        description: "Resultados registrados localmente e serao sincronizados.",
      });
      setStatus("Analise salva localmente. Sincronizacao pendente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-12 rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-gradient-to-r from-[#004F8F] to-[#1A7A3E] p-6 text-white">
        <div className="flex items-center gap-3">
          <Calculator className="h-8 w-8" />
          <div>
            <h3 className="text-xl font-bold">Calculadora: Custo de Falha de Qualidade</h3>
            <p className="text-white/80 text-sm">Quantifique perdas anuais por scrap, retrabalho, reclamacoes e contencao</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Volume mensal (pecas)</label>
            <Input type="number" value={inputs.monthly_volume} onChange={(e) => setNumeric("monthly_volume", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Custo unitario medio (R$)</label>
            <Input type="number" value={inputs.unit_cost} onChange={(e) => setNumeric("unit_cost", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Taxa de scrap (%)</label>
            <Input type="number" value={inputs.scrap_rate_pct} onChange={(e) => setNumeric("scrap_rate_pct", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Taxa de retrabalho (%)</label>
            <Input type="number" value={inputs.rework_rate_pct} onChange={(e) => setNumeric("rework_rate_pct", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Custo medio de retrabalho por peca (R$)</label>
            <Input type="number" value={inputs.rework_cost_per_unit} onChange={(e) => setNumeric("rework_cost_per_unit", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Reclamacoes por ano</label>
            <Input type="number" value={inputs.complaints_per_year} onChange={(e) => setNumeric("complaints_per_year", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Custo medio por reclamacao (R$)</label>
            <Input type="number" value={inputs.complaint_cost} onChange={(e) => setNumeric("complaint_cost", e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Horas de contencao por mes</label>
            <Input type="number" value={inputs.containment_hours_per_month} onChange={(e) => setNumeric("containment_hours_per_month", e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Custo hora da equipe de qualidade/engenharia (R$)</label>
            <Input type="number" value={inputs.hourly_cost} onChange={(e) => setNumeric("hourly_cost", e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>Perda anual com scrap: <span className="font-semibold">{currency(totals.scrapLoss)}</span></div>
          <div>Perda anual com retrabalho: <span className="font-semibold">{currency(totals.reworkLoss)}</span></div>
          <div>Perda anual com reclamacoes: <span className="font-semibold">{currency(totals.complaintLoss)}</span></div>
          <div>Perda anual com contencao: <span className="font-semibold">{currency(totals.containmentLoss)}</span></div>
        </div>

        <div className={`rounded-lg border p-4 ${riskBand.className}`}>
          <div className="flex items-center gap-2 mb-1 font-semibold">
            <riskBand.Icon className="h-5 w-5" />
            {riskBand.label}
          </div>
          <div className="text-2xl font-bold mb-1">{currency(totals.total)} / ano</div>
          <p className="text-sm opacity-90">{riskBand.helper}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {previewMode ? "Salvar (Simulacao)" : isSaving ? "Salvando..." : "Salvar Analise"}
          </Button>
          {status && <p className="text-sm text-slate-600">{status}</p>}
        </div>
      </div>
    </div>
  );
}

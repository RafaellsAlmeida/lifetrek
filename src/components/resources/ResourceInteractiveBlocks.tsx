import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SupplierAuditCalculator from "@/components/resources/SupplierAuditCalculator";
import ToleranceLookup from "@/components/resources/ToleranceLookup";
import CleanRoomClassifier from "@/components/resources/CleanRoomClassifier";
import SwissVsConventionalTool from "@/components/resources/SwissVsConventionalTool";
import CostOfQualityCalculator from "@/components/resources/CostOfQualityCalculator";
import NpiTransferChecklistTool from "@/components/resources/NpiTransferChecklistTool";
import { saveLeadWithCompat } from "@/utils/contactLeadCapture";

export interface ResourceLeadFormData {
  name: string;
  email: string;
  company: string;
}

interface ResourceInteractiveBlocksProps {
  slug?: string;
  formData: ResourceLeadFormData;
  setIsModalOpen: (open: boolean) => void;
  previewMode?: boolean;
}

interface SaveAwareProps {
  formData: ResourceLeadFormData;
  setIsModalOpen: (open: boolean) => void;
  previewMode: boolean;
}

function SupplyChainRiskScorecard({ formData, setIsModalOpen, previewMode }: SaveAwareProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState({
    dependency: 3,
    volatility: 3,
    leadTime: 3,
    quality: 3,
    capital: 3,
  });

  const total = Object.values(scorecard).reduce((a, b) => a + b, 0);
  const band = total < 10 ? "Baixo Risco" : total < 18 ? "Médio Risco" : "Alto Risco";
  const recommendation =
    total < 10
      ? "Cadeia estável. Mantenha monitoramento mensal."
      : total < 18
      ? "Risco moderado. Monte plano de contingência por SKU crítico."
      : "Risco alto. Priorize migração de itens e plano de mitigação imediato.";

  const handleSave = async () => {
    if (previewMode) {
      toast({
        title: "Simulação de preview",
        description: "Em modo de aprovação, os resultados não são enviados ao CRM.",
      });
      setStatus("Simulação concluída. Nenhum dado foi salvo.");
      return;
    }

    if (!formData.name || !formData.email) {
      setIsModalOpen(true);
      toast({
        variant: "destructive",
        title: "Dados necessários",
        description: "Informe nome e email para salvar a avaliação.",
      });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    const payload = {
      scorecard,
      total,
      band,
      recommendation,
    };

    try {
      const result = await saveLeadWithCompat({
        name: formData.name,
        email: formData.email,
        company: formData.company || undefined,
        phone: "Não informado",
        project_type: "other_medical",
        project_types: ["other_medical"],
        technical_requirements: `Supply chain scorecard: ${total}/25 (${band})`,
        message: `Supply chain scorecard payload: ${JSON.stringify(payload)}`,
        source: "website",
      });

      if (result.status === "saved") {
        toast({ title: "Scorecard salvo", description: "Resultados registrados no CRM." });
        setStatus("Scorecard salvo com sucesso!");
      } else {
        toast({
          title: "Scorecard salvo",
          description: "Resultados registrados localmente e serão sincronizados.",
        });
        setStatus("Scorecard salvo localmente. Sincronização pendente.");
      }
    } catch (error) {
      console.error("Error saving supply chain scorecard:", error);
      toast({
        title: "Scorecard salvo",
        description: "Resultados registrados localmente e serão sincronizados.",
      });
      setStatus("Scorecard salvo localmente. Sincronização pendente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-4">Scorecard de Risco de Supply Chain</h3>
      <div className="space-y-4">
        {[
          { id: "dependency", label: "Dependência geográfica" },
          { id: "volatility", label: "Volatilidade cambial/matéria-prima" },
          { id: "leadTime", label: "Lead time e logística" },
          { id: "quality", label: "Qualidade/compliance fornecedor" },
          { id: "capital", label: "Capital preso em estoque" },
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
                  [item.id]: Number(event.target.value),
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
          <span className="text-lg font-bold text-slate-900">{total}</span>
        </div>
        <p className="mt-2 text-sm text-slate-700">Faixa: <span className="font-semibold">{band}</span></p>
        <p className="mt-2 text-sm text-slate-600">{recommendation}</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {previewMode ? "Salvar (Simulação)" : isSaving ? "Salvando..." : "Salvar Scorecard"}
        </Button>
        {status && <p className="text-sm text-slate-600">{status}</p>}
      </div>
    </div>
  );
}

function LocalProductionChecklistTool({ formData, setIsModalOpen, previewMode }: SaveAwareProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({
    volume: false,
    leadTime: false,
    impact: false,
    quality: false,
    capital: false,
  });

  const yesCount = Object.values(checklist).filter(Boolean).length;
  const recommendation =
    yesCount >= 4
      ? "Prioridade alta para piloto local."
      : yesCount >= 3
      ? "Viabilidade relevante. Avance para análise técnico-financeira."
      : "Mantenha importação e acompanhe indicadores por 90 dias.";

  const handleSave = async () => {
    if (previewMode) {
      toast({
        title: "Simulação de preview",
        description: "Em modo de aprovação, os resultados não são enviados ao CRM.",
      });
      setStatus("Simulação concluída. Nenhum dado foi salvo.");
      return;
    }

    if (!formData.name || !formData.email) {
      setIsModalOpen(true);
      toast({
        variant: "destructive",
        title: "Dados necessários",
        description: "Informe nome e email para salvar a avaliação.",
      });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    const payload = {
      checklist,
      yes_count: yesCount,
      recommendation,
    };

    try {
      const result = await saveLeadWithCompat({
        name: formData.name,
        email: formData.email,
        company: formData.company || undefined,
        phone: "Não informado",
        project_type: "other_medical",
        project_types: ["other_medical"],
        technical_requirements: `Local production checklist: ${yesCount}/5`,
        message: `Local production checklist payload: ${JSON.stringify(payload)}`,
        source: "website",
      });

      if (result.status === "saved") {
        toast({ title: "Checklist salvo", description: "Resultados registrados no CRM." });
        setStatus("Checklist salvo com sucesso!");
      } else {
        toast({
          title: "Checklist salvo",
          description: "Resultados registrados localmente e serão sincronizados.",
        });
        setStatus("Checklist salvo localmente. Sincronização pendente.");
      }
    } catch (error) {
      console.error("Error saving local production checklist:", error);
      toast({
        title: "Checklist salvo",
        description: "Resultados registrados localmente e serão sincronizados.",
      });
      setStatus("Checklist salvo localmente. Sincronização pendente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-slate-900 mb-4">Checklist: Quando Faz Sentido Produzir Local</h3>
      <div className="space-y-3">
        {[
          { id: "volume", label: "Volume anual relevante" },
          { id: "leadTime", label: "Lead time de importação acima do alvo" },
          { id: "impact", label: "Parada de linha em caso de ruptura" },
          { id: "quality", label: "NC recorrente no fornecimento atual" },
          { id: "capital", label: "Capital elevado em estoque de segurança" },
        ].map((item) => (
          <label key={item.id} className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={checklist[item.id as keyof typeof checklist]}
              onChange={(event) =>
                setChecklist((prev) => ({
                  ...prev,
                  [item.id]: event.target.checked,
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
          <span className="text-lg font-bold text-slate-900">{yesCount}</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{recommendation}</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {previewMode ? "Salvar (Simulação)" : isSaving ? "Salvando..." : "Salvar Checklist"}
        </Button>
        {status && <p className="text-sm text-slate-600">{status}</p>}
      </div>
    </div>
  );
}

export default function ResourceInteractiveBlocks({
  slug,
  formData,
  setIsModalOpen,
  previewMode = false,
}: ResourceInteractiveBlocksProps) {
  if (!slug) return null;

  const commonProps = {
    formData,
    setIsModalOpen,
    previewMode,
  };

  const supplierAuditSlugs = new Set([
    "checklist-auditoria-iso-13485",
    "checklist-auditoria-fornecedores",
    "checklist-auditoria-fornecedores-medicos",
    "iso-13485-auditoria-usinagem",
  ]);

  if (supplierAuditSlugs.has(slug)) {
    return <SupplierAuditCalculator {...commonProps} />;
  }

  if (slug === "calculadora-custo-falha-qualidade") {
    return <CostOfQualityCalculator {...commonProps} />;
  }

  if (slug === "checklist-transferencia-npi-producao") {
    return <NpiTransferChecklistTool {...commonProps} />;
  }

  if (slug === "scorecard-risco-supply-chain-2026") {
    return <SupplyChainRiskScorecard {...commonProps} />;
  }

  if (slug === "checklist-producao-local") {
    return <LocalProductionChecklistTool {...commonProps} />;
  }

  if (slug === "guia-metrologia-alta-precisao" || slug === "guia-metrologia-3d-cnc-swiss") {
    return <ToleranceLookup />;
  }

  if (slug === "guia-sala-limpa-iso-7" || slug === "guia-sala-limpa-dispositivos-medicos") {
    return <CleanRoomClassifier />;
  }

  if (slug === "whitepaper-usinagem-suica-dispositivos-medicos") {
    return <SwissVsConventionalTool />;
  }

  return null;
}

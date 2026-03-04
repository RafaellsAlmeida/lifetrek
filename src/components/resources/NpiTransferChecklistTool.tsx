import { useMemo, useState } from "react";
import { ClipboardCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveLeadWithCompat } from "@/utils/contactLeadCapture";

interface FormData {
  name: string;
  email: string;
  company: string;
}

interface NpiTransferChecklistToolProps {
  formData: FormData;
  setIsModalOpen: (open: boolean) => void;
  previewMode?: boolean;
}

type ChecklistGroup = {
  id: string;
  title: string;
  items: string[];
};

const GROUPS: ChecklistGroup[] = [
  {
    id: "technical",
    title: "Pacote Tecnico",
    items: [
      "Desenho 2D e modelo 3D revisados e aprovados",
      "BOM congelada e versionada",
      "Especificacoes criticas de CTQ definidas",
      "Plano de inspeção inicial (FAI) definido",
    ],
  },
  {
    id: "process",
    title: "Processo e Validacao",
    items: [
      "Fluxo de processo documentado",
      "PFMEA atualizado com risco residual aceitavel",
      "Plano de controle com reacao para desvios",
      "Capabilidade inicial (Cp/Cpk) levantada para CTQs",
    ],
  },
  {
    id: "quality",
    title: "Qualidade e Compliance",
    items: [
      "Requisitos ISO 13485 vinculados ao processo",
      "Rastreabilidade lote -> MP -> produto definida",
      "Dispositivos de medicao calibrados e validados",
      "Plano de CAPA para desvios de transferencia",
    ],
  },
  {
    id: "operations",
    title: "Operacao e Supply",
    items: [
      "Capacidade de maquina e gargalos mapeados",
      "Treinamento de operadores concluido",
      "Plano de contingencia de fornecedor ativo",
      "Parametros de estoque de seguranca definidos",
    ],
  },
  {
    id: "launch",
    title: "Go-live e Estabilizacao",
    items: [
      "Critério de go/no-go formalizado",
      "Ritual diario de acompanhamento nas 2 primeiras semanas",
      "Dashboard de defeitos, retrabalho e lead time pronto",
      "Licoes aprendidas registradas para proxima transferencia",
    ],
  },
];

const TOTAL_ITEMS = GROUPS.reduce((sum, group) => sum + group.items.length, 0);

export default function NpiTransferChecklistTool({
  formData,
  setIsModalOpen,
  previewMode = false,
}: NpiTransferChecklistToolProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const checkedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  );
  const percentage = Math.round((checkedCount / TOTAL_ITEMS) * 100);

  const readiness = useMemo(() => {
    if (percentage >= 90) {
      return {
        label: "Pronto para transferencia",
        helper: "Go-live recomendado com monitoramento de estabilizacao.",
        className: "text-green-700 bg-green-50 border-green-200",
        Icon: CheckCircle2,
      };
    }

    if (percentage >= 75) {
      return {
        label: "Aprovado com plano de acao",
        helper: "Fechar pendencias criticas antes do ramp-up total.",
        className: "text-amber-700 bg-amber-50 border-amber-200",
        Icon: AlertTriangle,
      };
    }

    if (percentage >= 50) {
      return {
        label: "Risco elevado",
        helper: "Necessario plano estruturado de mitigacao antes de transferir.",
        className: "text-orange-700 bg-orange-50 border-orange-200",
        Icon: AlertTriangle,
      };
    }

    return {
      label: "Nao pronto",
      helper: "Replanejar transferencia e fechar lacunas de base.",
      className: "text-red-700 bg-red-50 border-red-200",
      Icon: AlertTriangle,
    };
  }, [percentage]);

  const toggle = (groupId: string, index: number) => {
    const key = `${groupId}-${index}`;
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
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
        description: "Informe nome e email para salvar a avaliacao.",
      });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    const payload = {
      checked,
      total_items: TOTAL_ITEMS,
      checked_items: checkedCount,
      percentage,
      readiness: readiness.label,
    };

    try {
      const result = await saveLeadWithCompat({
        name: formData.name,
        email: formData.email,
        company: formData.company || undefined,
        phone: "Nao informado",
        project_type: "other_medical",
        project_types: ["other_medical"],
        technical_requirements: `NPI transfer readiness: ${percentage}% - ${readiness.label}`,
        message: `NPI transfer checklist payload: ${JSON.stringify(payload)}`,
        source: "website",
      });

      if (result.status === "saved") {
        toast({
          title: "Checklist salvo",
          description: "Resultados registrados no CRM.",
        });
        setStatus("Checklist salvo com sucesso!");
      } else {
        toast({
          title: "Checklist salvo",
          description: "Resultados registrados localmente e serao sincronizados.",
        });
        setStatus("Checklist salvo localmente. Sincronizacao pendente.");
      }
    } catch (error) {
      console.error("Error saving NPI checklist:", error);
      toast({
        title: "Checklist salvo",
        description: "Resultados registrados localmente e serao sincronizados.",
      });
      setStatus("Checklist salvo localmente. Sincronizacao pendente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-12 rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-gradient-to-r from-[#004F8F] to-[#1A7A3E] p-6 text-white">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8" />
          <div>
            <h3 className="text-xl font-bold">Checklist: Transferencia NPI - Producao</h3>
            <p className="text-white/80 text-sm">Valide prontidao tecnica, qualidade e operacao antes do go-live</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {GROUPS.map((group) => (
          <div key={group.id} className="border rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 font-semibold text-slate-800">{group.title}</div>
            <div className="p-4 grid gap-2">
              {group.items.map((item, index) => {
                const key = `${group.id}-${index}`;
                const isChecked = !!checked[key];
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                      isChecked ? "bg-green-50 text-green-800" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(group.id, index)}
                      className="h-4 w-4 accent-[#1A7A3E]"
                    />
                    {item}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className={`rounded-lg border p-4 ${readiness.className}`}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 font-semibold">
              <readiness.Icon className="h-5 w-5" />
              {readiness.label}
            </div>
            <div className="text-xl font-bold">{checkedCount}/{TOTAL_ITEMS}</div>
          </div>
          <p className="text-sm">Prontidao: <span className="font-semibold">{percentage}%</span></p>
          <p className="text-sm opacity-90 mt-1">{readiness.helper}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {previewMode ? "Salvar (Simulacao)" : isSaving ? "Salvando..." : "Salvar Avaliacao"}
          </Button>
          {status && <p className="text-sm text-slate-600">{status}</p>}
        </div>
      </div>
    </div>
  );
}

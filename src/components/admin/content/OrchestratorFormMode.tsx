import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import type { OrchestratorGenerationParams } from "./ContentOrchestratorCore";

interface OrchestratorFormModeProps {
  formData: OrchestratorGenerationParams;
  onFormDataChange: (data: OrchestratorGenerationParams) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  defaultPlatform: "linkedin" | "instagram";
}

export function OrchestratorFormMode({
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
  defaultPlatform,
}: OrchestratorFormModeProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const update = (field: keyof OrchestratorGenerationParams, value: string | string[] | undefined) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isValid = formData.topic.trim().length > 0 && (formData.targetAudience?.trim() || "").length > 0;

  return (
    <div className="space-y-4 p-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-medium">
            Tema <span className="text-destructive">*</span>
          </Label>
          <Input
            id="topic"
            value={formData.topic}
            onChange={(e) => update("topic", e.target.value)}
            onBlur={() => handleBlur("topic")}
            placeholder="Ex: Usinagem CNC para dispositivos médicos"
            className={touched.topic && !formData.topic.trim() ? "border-destructive/50" : ""}
          />
          {touched.topic && !formData.topic.trim() && (
            <p className="text-xs text-destructive">Tema é obrigatório</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="text-sm font-medium">
            Público-alvo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="targetAudience"
            value={formData.targetAudience || ""}
            onChange={(e) => update("targetAudience", e.target.value)}
            onBlur={() => handleBlur("targetAudience")}
            placeholder="Ex: OEM / Parceiros de Manufatura Contratada"
            className={touched.targetAudience && !(formData.targetAudience?.trim()) ? "border-destructive/50" : ""}
          />
          {touched.targetAudience && !(formData.targetAudience?.trim()) && (
            <p className="text-xs text-destructive">Público-alvo é obrigatório</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform" className="text-sm font-medium">Plataforma</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.platform === "linkedin" ? "default" : "outline"}
              size="sm"
              onClick={() => update("platform", "linkedin")}
            >
              LinkedIn
            </Button>
            <Button
              type="button"
              variant={formData.platform === "instagram" ? "default" : "outline"}
              size="sm"
              onClick={() => update("platform", "instagram")}
            >
              Instagram
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="painPoint" className="text-sm font-medium">
            Ponto de dor <Badge variant="secondary" className="ml-1 text-[10px]">Opcional</Badge>
          </Label>
          <Input
            id="painPoint"
            value={formData.painPoint || ""}
            onChange={(e) => update("painPoint", e.target.value)}
            placeholder="Ex: Dependência de importação e risco de qualidade"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desiredOutcome" className="text-sm font-medium">
            Resultado desejado <Badge variant="secondary" className="ml-1 text-[10px]">Opcional</Badge>
          </Label>
          <Input
            id="desiredOutcome"
            value={formData.desiredOutcome || ""}
            onChange={(e) => update("desiredOutcome", e.target.value)}
            placeholder="Ex: Produção local com qualidade auditável"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ctaAction" className="text-sm font-medium">
            CTA <Badge variant="secondary" className="ml-1 text-[10px]">Opcional</Badge>
          </Label>
          <Input
            id="ctaAction"
            value={formData.ctaAction || ""}
            onChange={(e) => update("ctaAction", e.target.value)}
            placeholder="Ex: Comente DIAGNOSTICO para avaliar um SKU crítico"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proofPoints" className="text-sm font-medium">
            Provas / Diferenciais <Badge variant="secondary" className="ml-1 text-[10px]">Opcional</Badge>
          </Label>
          <Textarea
            id="proofPoints"
            value={(formData.proofPoints || []).join("\n")}
            onChange={(e) => update("proofPoints", e.target.value.split("\n").filter(Boolean))}
            placeholder={"ISO 13485\nMetrologia ZEISS\nSala Limpa ISO 7"}
            rows={3}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">Uma prova por linha</p>
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isSubmitting ? "Preparando..." : "Preparar geração"}
      </Button>
    </div>
  );
}

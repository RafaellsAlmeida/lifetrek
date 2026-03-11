import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, Pencil, RotateCcw, X } from "lucide-react";
import type { OrchestratorGenerationParams } from "./ContentOrchestratorCore";

interface OrchestratorReviewCardProps {
  params: OrchestratorGenerationParams;
  onParamsChange: (params: OrchestratorGenerationParams) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry?: () => void;
  isGenerating: boolean;
  confidence?: number;
  generationError?: string | null;
}

export function OrchestratorReviewCard({
  params,
  onParamsChange,
  onConfirm,
  onCancel,
  onRetry,
  isGenerating,
  confidence,
  generationError,
}: OrchestratorReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [baselineParams] = useState(params);

  const update = (field: keyof OrchestratorGenerationParams, value: string | string[] | undefined) => {
    onParamsChange({ ...params, [field]: value });
  };

  const normalizeFieldValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value.join("\n").trim() : (value || "").trim();

  const isEditedField = (field: keyof OrchestratorGenerationParams) =>
    normalizeFieldValue(params[field]) !== normalizeFieldValue(baselineParams[field]);

  const editedFieldClassName = (field: keyof OrchestratorGenerationParams) =>
    isEditedField(field) ? "border-amber-300 bg-amber-50/80" : "";

  const renderSummaryRow = (
    field: keyof OrchestratorGenerationParams,
    label: string,
    value?: string | string[],
  ) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    const displayValue = Array.isArray(value) ? value.join(", ") : value;

    return (
      <div
        className={cn(
          "rounded-md px-2 py-1 transition-colors",
          isEditedField(field) && "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
        )}
      >
        <strong>{label}:</strong> {displayValue}
        {isEditedField(field) && (
          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Editado
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Parâmetros de geração</span>
        <div className="flex items-center gap-2">
          {confidence != null && (
            <Badge variant="secondary" className="text-[10px]">
              Confiança: {Math.round(confidence * 100)}%
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="w-3 h-3 mr-1" />
            {isEditing ? "Fechar edição" : "Editar"}
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Tema</Label>
            <Input
              value={params.topic}
              onChange={(e) => update("topic", e.target.value)}
              className={cn("h-8 text-sm", editedFieldClassName("topic"))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Público-alvo</Label>
            <Input
              value={params.targetAudience || ""}
              onChange={(e) => update("targetAudience", e.target.value)}
              className={cn("h-8 text-sm", editedFieldClassName("targetAudience"))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Plataforma</Label>
            <div className={cn("flex gap-2 rounded-md p-1", editedFieldClassName("platform"))}>
              <Button
                type="button"
                variant={params.platform === "linkedin" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => update("platform", "linkedin")}
              >
                LinkedIn
              </Button>
              <Button
                type="button"
                variant={params.platform === "instagram" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => update("platform", "instagram")}
              >
                Instagram
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ponto de dor</Label>
            <Input
              value={params.painPoint || ""}
              onChange={(e) => update("painPoint", e.target.value)}
              className={cn("h-8 text-sm", editedFieldClassName("painPoint"))}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Resultado desejado</Label>
            <Input
              value={params.desiredOutcome || ""}
              onChange={(e) => update("desiredOutcome", e.target.value)}
              className={cn("h-8 text-sm", editedFieldClassName("desiredOutcome"))}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CTA</Label>
            <Input
              value={params.ctaAction || ""}
              onChange={(e) => update("ctaAction", e.target.value)}
              className={cn("h-8 text-sm", editedFieldClassName("ctaAction"))}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Provas / Diferenciais</Label>
            <Textarea
              value={(params.proofPoints || []).join("\n")}
              onChange={(e) => update("proofPoints", e.target.value.split("\n").filter(Boolean))}
              className={cn("text-sm", editedFieldClassName("proofPoints"))}
              rows={2}
              placeholder="Uma prova por linha"
            />
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground space-y-1">
          {renderSummaryRow("topic", "Tema", params.topic)}
          {renderSummaryRow("targetAudience", "Público", params.targetAudience)}
          {renderSummaryRow("platform", "Plataforma", params.platform)}
          {renderSummaryRow("painPoint", "Dor", params.painPoint)}
          {renderSummaryRow("desiredOutcome", "Resultado", params.desiredOutcome)}
          {renderSummaryRow("ctaAction", "CTA", params.ctaAction)}
          {renderSummaryRow("proofPoints", "Provas", params.proofPoints)}
        </div>
      )}

      {generationError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <p className="font-medium">Erro na geração</p>
          <p className="text-xs mt-1">{generationError}</p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {generationError && onRetry ? (
          <Button
            onClick={onRetry}
            disabled={isGenerating}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            {isGenerating ? "Gerando..." : "Tentar novamente"}
          </Button>
        ) : (
          <Button
            onClick={onConfirm}
            disabled={isGenerating}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {isGenerating ? "Gerando..." : "Confirmar e gerar"}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={onCancel}
        >
          <X className="w-3 h-3 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

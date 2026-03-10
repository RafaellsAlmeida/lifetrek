import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const update = (field: keyof OrchestratorGenerationParams, value: any) => {
    onParamsChange({ ...params, [field]: value });
  };

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Parâmetros de geração</span>
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
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Público-alvo</Label>
            <Input
              value={params.targetAudience || ""}
              onChange={(e) => update("targetAudience", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Plataforma</Label>
            <div className="flex gap-2">
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
              className="h-8 text-sm"
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Resultado desejado</Label>
            <Input
              value={params.desiredOutcome || ""}
              onChange={(e) => update("desiredOutcome", e.target.value)}
              className="h-8 text-sm"
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CTA</Label>
            <Input
              value={params.ctaAction || ""}
              onChange={(e) => update("ctaAction", e.target.value)}
              className="h-8 text-sm"
              placeholder="Opcional"
            />
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-700 space-y-1">
          <div><strong>Tema:</strong> {params.topic}</div>
          <div><strong>Público:</strong> {params.targetAudience}</div>
          <div><strong>Plataforma:</strong> {params.platform}</div>
          {params.painPoint && <div><strong>Dor:</strong> {params.painPoint}</div>}
          {params.desiredOutcome && <div><strong>Resultado:</strong> {params.desiredOutcome}</div>}
          {params.ctaAction && <div><strong>CTA:</strong> {params.ctaAction}</div>}
          {params.proofPoints && params.proofPoints.length > 0 && (
            <div><strong>Provas:</strong> {params.proofPoints.join(", ")}</div>
          )}
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

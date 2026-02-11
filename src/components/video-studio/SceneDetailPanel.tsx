import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StorageImageSelector } from "@/components/admin/StorageImageSelector";
import type { EditorScene } from "./types";
import { SCENE_KIND_COLORS } from "./types";

interface SceneDetailPanelProps {
  scene: EditorScene;
  onUpdate: (updates: Partial<EditorScene>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function SceneDetailPanel({
  scene,
  onUpdate,
  onDelete,
  onDuplicate,
}: SceneDetailPanelProps) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<"asset" | "fallback">("asset");

  const colors = SCENE_KIND_COLORS[scene.kind];

  const handleImageSelect = (imageUrl: string) => {
    if (selectorTarget === "asset") {
      onUpdate({ asset: imageUrl });
    } else {
      onUpdate({ fallbackAsset: imageUrl });
    }
    setIsSelectorOpen(false);
  };

  const openSelectorFor = (target: "asset" | "fallback") => {
    setSelectorTarget(target);
    setIsSelectorOpen(true);
  };

  // Get preview image
  const getPreviewImage = () => {
    if (scene.kind === "broll" && scene.fallbackAsset) {
      return scene.fallbackAsset;
    }
    if (scene.kind === "image" && scene.asset) {
      return scene.asset;
    }
    return null;
  };

  const previewImage = getPreviewImage();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate max-w-[180px]">{scene.label}</h3>
          <Badge variant="outline" className={cn("text-xs", colors.text, colors.bg)}>
            {scene.kind}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Preview */}
        {previewImage || scene.backgroundColor ? (
          <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
            {previewImage ? (
              <img
                src={previewImage}
                alt={scene.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ backgroundColor: scene.backgroundColor }}
              />
            )}
          </div>
        ) : (
          <div className="aspect-video rounded-lg border bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No preview</span>
          </div>
        )}

        {/* Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Duration</Label>
            <span className="text-xs font-mono text-muted-foreground">
              {scene.durationSeconds.toFixed(1)}s
            </span>
          </div>
          <Slider
            value={[scene.durationSeconds]}
            onValueChange={([v]) => onUpdate({ durationSeconds: Math.round(v * 10) / 10 })}
            min={0.5}
            max={15}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <Label htmlFor="scene-label" className="text-xs">
            Label
          </Label>
          <Input
            id="scene-label"
            value={scene.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* On-screen text */}
        <div className="space-y-1.5">
          <Label htmlFor="scene-onscreen" className="text-xs">
            On-Screen Text
          </Label>
          <Input
            id="scene-onscreen"
            value={scene.onScreen ?? ""}
            onChange={(e) => onUpdate({ onScreen: e.target.value || undefined })}
            placeholder="Text overlay..."
            className="h-8 text-sm"
          />
        </div>

        {/* Asset selection for image/broll */}
        {(scene.kind === "image" || scene.kind === "broll") && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              {scene.kind === "broll" ? "B-roll Asset" : "Image Asset"}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={scene.asset}
                onChange={(e) => onUpdate({ asset: e.target.value })}
                className="h-8 text-xs flex-1 font-mono"
                placeholder="Enter asset URL or path..."
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0"
                onClick={() => openSelectorFor("asset")}
              >
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
                Browse
              </Button>
            </div>
          </div>
        )}

        {/* Fallback for broll */}
        {scene.kind === "broll" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Fallback Image</Label>
            <div className="flex items-center gap-2">
              <Input
                value={scene.fallbackAsset ?? ""}
                onChange={(e) => onUpdate({ fallbackAsset: e.target.value || undefined })}
                className="h-8 text-xs flex-1 font-mono"
                placeholder="No fallback"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0"
                onClick={() => openSelectorFor("fallback")}
              >
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
                Browse
              </Button>
            </div>
          </div>
        )}

        {/* Background color for solid */}
        {scene.kind === "solid" && (
          <div className="space-y-1.5">
            <Label htmlFor="scene-bgcolor" className="text-xs">
              Background Color
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="scene-bgcolor"
                type="color"
                value={scene.backgroundColor ?? "#004F8F"}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="h-8 w-12 p-1"
              />
              <Input
                value={scene.backgroundColor ?? "#004F8F"}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="h-8 text-xs font-mono flex-1"
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="scene-notes" className="text-xs">
            Notes
          </Label>
          <Textarea
            id="scene-notes"
            value={scene.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Production notes..."
            className="text-sm min-h-[80px] resize-none"
          />
        </div>
      </div>

      {/* Image selector dialog - only rendered when open to avoid querying missing table */}
      {isSelectorOpen && (
        <StorageImageSelector
          open={isSelectorOpen}
          onOpenChange={setIsSelectorOpen}
          onSelect={handleImageSelect}
        />
      )}
    </div>
  );
}

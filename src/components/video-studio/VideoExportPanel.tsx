import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, FileJson } from "lucide-react";
import { toast } from "sonner";
import type { EditorScene } from "./types";
import { calculateTotalDuration } from "./types";

interface VideoExportPanelProps {
  scenes: EditorScene[];
  projectTitle?: string;
}

export function VideoExportPanel({ scenes, projectTitle = "video-plan" }: VideoExportPanelProps) {
  const totalDuration = calculateTotalDuration(scenes);

  const generateExportData = useCallback(() => {
    return {
      title: projectTitle,
      exportedAt: new Date().toISOString(),
      totalDurationSeconds: totalDuration,
      sceneCount: scenes.length,
      fps: 30,
      resolution: { width: 1920, height: 1080 },
      scenes: scenes.map((scene, index) => ({
        index,
        id: scene.id,
        label: scene.label,
        kind: scene.kind,
        durationSeconds: scene.durationSeconds,
        durationInFrames: Math.round(scene.durationSeconds * 30),
        asset: scene.asset,
        fallbackAsset: scene.fallbackAsset,
        backgroundColor: scene.backgroundColor,
        onScreen: scene.onScreen,
        notes: scene.notes,
        overlayImages: scene.overlayImages,
      })),
    };
  }, [scenes, totalDuration, projectTitle]);

  const handleExportJson = useCallback(() => {
    const data = generateExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectTitle.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("JSON exported successfully");
  }, [generateExportData, projectTitle]);

  const handleCopyJson = useCallback(async () => {
    const data = generateExportData();
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success("JSON copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [generateExportData]);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCopyJson}>
        <Copy className="h-4 w-4 mr-2" />
        Copy JSON
      </Button>
      <Button size="sm" onClick={handleExportJson}>
        <Download className="h-4 w-4 mr-2" />
        Export JSON
      </Button>
    </div>
  );
}

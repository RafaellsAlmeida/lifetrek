import { useCallback, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EditorScene } from "./types";
import { SCENE_KIND_COLORS } from "./types";

interface SceneBlockProps {
  scene: EditorScene;
  isSelected: boolean;
  pixelsPerSecond: number;
  onSelect: () => void;
  onDurationChange: (newDuration: number) => void;
  dragHandleProps?: Record<string, unknown>;
}

export function SceneBlock({
  scene,
  isSelected,
  pixelsPerSecond,
  onSelect,
  onDurationChange,
  dragHandleProps,
}: SceneBlockProps) {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const blockRef = useRef<HTMLDivElement>(null);

  const colors = SCENE_KIND_COLORS[scene.kind];
  const width = scene.durationSeconds * pixelsPerSecond;
  const minWidth = 1 * pixelsPerSecond; // Minimum 1 second
  const maxWidth = 15 * pixelsPerSecond; // Maximum 15 seconds

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startXRef.current;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
        const newDuration = Math.round((newWidth / pixelsPerSecond) * 10) / 10; // Round to 0.1s
        onDurationChange(newDuration);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, pixelsPerSecond, onDurationChange, minWidth, maxWidth]
  );

  // Get thumbnail for preview
  const getThumbnail = () => {
    if (scene.kind === "solid") {
      return null;
    }
    if (scene.kind === "broll" && scene.fallbackAsset) {
      return scene.fallbackAsset;
    }
    return scene.asset;
  };

  const thumbnail = getThumbnail();

  return (
    <div
      ref={blockRef}
      onClick={onSelect}
      className={cn(
        "relative h-full rounded-md border-2 overflow-hidden cursor-pointer transition-all select-none",
        colors.bg,
        colors.border,
        isSelected && "ring-2 ring-primary ring-offset-1",
        isResizing && "opacity-80"
      )}
      style={{ width: `${width}px`, minWidth: `${minWidth}px` }}
      {...dragHandleProps}
    >
      {/* Background - thumbnail or solid color */}
      {thumbnail ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${thumbnail})` }}
        />
      ) : scene.backgroundColor ? (
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundColor: scene.backgroundColor }}
        />
      ) : null}

      {/* Content overlay */}
      <div className="relative h-full p-1.5 flex flex-col justify-between z-10">
        {/* Top row: label and kind badge */}
        <div className="flex items-start justify-between gap-1">
          <span className="text-[10px] font-medium truncate flex-1 text-gray-800">
            {scene.label}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[9px] px-1 py-0 h-4 shrink-0", colors.text)}
          >
            {scene.kind}
          </Badge>
        </div>

        {/* Bottom row: duration */}
        <div className="flex items-end justify-between">
          <span className="text-[10px] font-mono text-gray-600">{scene.durationSeconds}s</span>
          {scene.onScreen && (
            <span className="text-[8px] text-gray-500 truncate max-w-[60%] text-right">
              {scene.onScreen}
            </span>
          )}
        </div>
      </div>

      {/* Resize handle on the right edge */}
      <div
        onMouseDown={handleResizeStart}
        className={cn(
          "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/30 transition-colors",
          isResizing && "bg-primary/40"
        )}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

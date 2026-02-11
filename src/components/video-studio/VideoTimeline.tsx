import { useCallback, useMemo, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
import { SceneBlock } from "./SceneBlock";
import type { EditorScene } from "./types";
import { formatTime, getSceneStartTime, timeToFrame } from "./types";

interface VideoTimelineProps {
  scenes: EditorScene[];
  selectedSceneId: string | null;
  playheadFrame: number;
  zoom: number;
  fps: number;
  onSelectScene: (sceneId: string | null) => void;
  onReorderScenes: (sourceIndex: number, destinationIndex: number) => void;
  onUpdateScene: (sceneId: string, updates: Partial<EditorScene>) => void;
  onSetPlayhead: (frame: number) => void;
  onSetZoom: (zoom: number) => void;
}

const BASE_PIXELS_PER_SECOND = 60;

export function VideoTimeline({
  scenes,
  selectedSceneId,
  playheadFrame,
  zoom,
  fps,
  onSelectScene,
  onReorderScenes,
  onUpdateScene,
  onSetPlayhead,
  onSetZoom,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const pixelsPerSecond = BASE_PIXELS_PER_SECOND * zoom;

  const totalDuration = useMemo(
    () => scenes.reduce((sum, s) => sum + s.durationSeconds, 0),
    [scenes]
  );

  const totalWidth = totalDuration * pixelsPerSecond;
  const playheadSeconds = playheadFrame / fps;
  const playheadPosition = playheadSeconds * pixelsPerSecond;

  // Generate tick marks for the ruler
  const tickMarks = useMemo(() => {
    const marks: { time: number; isMajor: boolean }[] = [];
    const interval = zoom >= 1.5 ? 1 : zoom >= 1 ? 2 : 5; // Seconds per tick
    for (let t = 0; t <= totalDuration; t += interval) {
      marks.push({ time: t, isMajor: t % (interval * 5) === 0 || interval === 1 });
    }
    return marks;
  }, [totalDuration, zoom]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      if (result.source.index === result.destination.index) return;
      onReorderScenes(result.source.index, result.destination.index);
    },
    [onReorderScenes]
  );

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const clickX = e.clientX - rect.left + scrollLeft;
      const clickSeconds = clickX / pixelsPerSecond;
      const frame = timeToFrame(Math.max(0, Math.min(clickSeconds, totalDuration)), fps);
      onSetPlayhead(frame);
    },
    [pixelsPerSecond, totalDuration, fps, onSetPlayhead]
  );

  const handleDurationChange = useCallback(
    (sceneId: string, newDuration: number) => {
      onUpdateScene(sceneId, { durationSeconds: newDuration });
    },
    [onUpdateScene]
  );

  return (
    <div className="flex flex-col h-full bg-muted/30 rounded-lg border">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Timeline</span>
          <span className="text-xs text-muted-foreground">
            {scenes.length} cenas | {formatTime(totalDuration)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onSetZoom(zoom - 0.25)}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onSetZoom(zoom + 0.25)}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline content */}
      <div
        ref={timelineRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative"
        onClick={handleTimelineClick}
      >
        <div
          className="relative"
          style={{ width: `${Math.max(totalWidth + 100, 800)}px`, minHeight: "100%" }}
        >
          {/* Time ruler */}
          <div className="h-6 border-b bg-background/80 sticky top-0 z-20">
            {tickMarks.map(({ time, isMajor }) => (
              <div
                key={time}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${time * pixelsPerSecond}px` }}
              >
                <div
                  className={`w-px ${isMajor ? "h-4 bg-muted-foreground" : "h-2 bg-muted-foreground/50"}`}
                />
                {isMajor && (
                  <span className="text-[9px] text-muted-foreground mt-0.5">
                    {formatTime(time)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
            style={{ left: `${playheadPosition}px` }}
          >
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-b-sm" />
          </div>

          {/* Scene blocks track */}
          <div className="pt-2 pb-4 px-2">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="timeline" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex items-stretch gap-1 h-20 ${
                      snapshot.isDraggingOver ? "bg-accent/30" : ""
                    }`}
                  >
                    {scenes.map((scene, index) => (
                      <Draggable key={scene.id} draggableId={scene.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={snapshot.isDragging ? "opacity-80" : ""}
                          >
                            <SceneBlock
                              scene={scene}
                              isSelected={scene.id === selectedSceneId}
                              pixelsPerSecond={pixelsPerSecond}
                              onSelect={() => onSelectScene(scene.id)}
                              onDurationChange={(d) => handleDurationChange(scene.id, d)}
                              dragHandleProps={provided.dragHandleProps ?? undefined}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
    </div>
  );
}

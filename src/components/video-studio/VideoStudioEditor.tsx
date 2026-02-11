// @ts-nocheck
import { useEffect, useMemo, lazy, Suspense } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useVideoStudioState } from "./hooks/useVideoStudioState";
import { VideoTimeline } from "./VideoTimeline";
import { SceneDetailPanel } from "./SceneDetailPanel";
import { VideoExportPanel } from "./VideoExportPanel";
import { RemotionPreview } from "./RemotionPreview";
import type { EditorScene } from "./types";
import { formatTime } from "./types";

// Lazy load the MasterShowcase component to avoid bundling remotion in main bundle
const MasterShowcaseWithOverride = lazy(() =>
  import("../../../remotion/compositions/MasterShowcase").then((mod) => ({
    default: mod.MasterShowcase,
  }))
);

// Loading fallback for the preview
function PreviewLoading() {
  return (
    <div className="flex items-center justify-center h-full bg-black/90 rounded-lg">
      <div className="flex flex-col items-center gap-2 text-white/60">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-sm">Loading preview...</span>
      </div>
    </div>
  );
}

interface VideoStudioEditorProps {
  initialScenes: EditorScene[];
  projectTitle?: string;
}

export function VideoStudioEditor({
  initialScenes,
  projectTitle = "Master Showcase Lifetrek",
}: VideoStudioEditorProps) {
  const {
    state,
    selectedScene,
    totalDuration,
    totalFrames,
    setScenes,
    selectScene,
    reorderScenes,
    updateScene,
    setPlayhead,
    setPlaying,
    setZoom,
    deleteScene,
    duplicateScene,
  } = useVideoStudioState(initialScenes);

  // Reset scenes if initial data changes
  useEffect(() => {
    if (initialScenes.length > 0 && state.scenes.length === 0) {
      setScenes(initialScenes);
    }
  }, [initialScenes, state.scenes.length, setScenes]);

  // Create composition props for Remotion player
  const compositionProps = useMemo(() => {
    // Convert EditorScene[] to the format MasterShowcase expects
    // For now, we'll pass basic props - the MasterShowcase can be enhanced
    // to accept a scenesOverride prop
    return {
      useBroll: true,
      useVoiceover: false,
      useMusic: false,
    };
  }, []);

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col gap-4">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{projectTitle}</h2>
          <Badge variant="secondary">{state.scenes.length} cenas</Badge>
          <Badge variant="outline">{formatTime(totalDuration)}</Badge>
        </div>
        <VideoExportPanel scenes={state.scenes} projectTitle={projectTitle} />
      </div>

      {/* Main editor layout */}
      <ResizablePanelGroup direction="vertical" className="flex-1 rounded-lg border">
        {/* Top: Preview */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full p-3">
            <Suspense fallback={<PreviewLoading />}>
              <RemotionPreview
                totalFrames={totalFrames || 30}
                fps={state.fps}
                playheadFrame={state.playheadFrame}
                isPlaying={state.isPlaying}
                onSetPlayhead={setPlayhead}
                onSetPlaying={setPlaying}
                compositionComponent={MasterShowcaseWithOverride}
                compositionProps={compositionProps}
              />
            </Suspense>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Bottom: Timeline + Detail panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Timeline */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <div className="h-full p-3">
                <VideoTimeline
                  scenes={state.scenes}
                  selectedSceneId={state.selectedSceneId}
                  playheadFrame={state.playheadFrame}
                  zoom={state.zoom}
                  fps={state.fps}
                  onSelectScene={selectScene}
                  onReorderScenes={reorderScenes}
                  onUpdateScene={updateScene}
                  onSetPlayhead={setPlayhead}
                  onSetZoom={setZoom}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Scene detail panel */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full border-l bg-background">
                {selectedScene ? (
                  <SceneDetailPanel
                    scene={selectedScene}
                    onUpdate={(updates) => updateScene(selectedScene.id, updates)}
                    onDelete={() => deleteScene(selectedScene.id)}
                    onDuplicate={() => duplicateScene(selectedScene.id)}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center p-4">
                      <p className="text-sm">Select a scene</p>
                      <p className="text-xs mt-1">Click on a scene in the timeline to edit</p>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

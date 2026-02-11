import { useCallback, useEffect, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { formatTime } from "./types";

// We'll import the composition dynamically to avoid bundling issues
// The MasterShowcase will be used with scenesOverride prop

interface RemotionPreviewProps {
  totalFrames: number;
  fps: number;
  playheadFrame: number;
  isPlaying: boolean;
  onSetPlayhead: (frame: number) => void;
  onSetPlaying: (isPlaying: boolean) => void;
  compositionComponent: React.ComponentType<Record<string, unknown>>;
  compositionProps?: Record<string, unknown>;
}

export function RemotionPreview({
  totalFrames,
  fps,
  playheadFrame,
  isPlaying,
  onSetPlayhead,
  onSetPlaying,
  compositionComponent,
  compositionProps = {},
}: RemotionPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);

  // Sync playhead from player to state
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleFrameUpdate = () => {
      const frame = player.getCurrentFrame();
      if (frame !== playheadFrame) {
        onSetPlayhead(frame);
      }
    };

    const unsubscribe = player.addEventListener("frameupdate", handleFrameUpdate);
    return () => {
      unsubscribe();
    };
  }, [playheadFrame, onSetPlayhead]);

  // Sync play state from player to state
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handlePlay = () => onSetPlaying(true);
    const handlePause = () => onSetPlaying(false);

    const unsubPlay = player.addEventListener("play", handlePlay);
    const unsubPause = player.addEventListener("pause", handlePause);

    return () => {
      unsubPlay();
      unsubPause();
    };
  }, [onSetPlaying]);

  // Seek player when playhead changes externally
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const currentFrame = player.getCurrentFrame();
    if (Math.abs(currentFrame - playheadFrame) > 1) {
      player.seekTo(playheadFrame);
    }
  }, [playheadFrame]);

  const handlePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying]);

  const handleSeekBack = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(Math.max(0, playheadFrame - fps * 5)); // Skip 5 seconds back
  }, [playheadFrame, fps]);

  const handleSeekForward = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(Math.min(totalFrames - 1, playheadFrame + fps * 5)); // Skip 5 seconds forward
  }, [playheadFrame, fps, totalFrames]);

  const handleSliderChange = useCallback(
    (value: number[]) => {
      const frame = value[0];
      onSetPlayhead(frame);
      playerRef.current?.seekTo(frame);
    },
    [onSetPlayhead]
  );

  const currentTime = playheadFrame / fps;
  const totalTime = totalFrames / fps;

  return (
    <div className="flex flex-col h-full">
      {/* Player container with 16:9 aspect ratio */}
      <div className="relative bg-black rounded-lg overflow-hidden flex-1">
        <div className="absolute inset-0 flex items-center justify-center">
          <Player
            ref={playerRef}
            component={compositionComponent}
            inputProps={compositionProps}
            durationInFrames={totalFrames || 1}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={fps}
            style={{
              width: "100%",
              height: "100%",
            }}
            controls={false}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 pt-3 px-1">
        {/* Play/Pause buttons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSeekBack}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="default" size="icon" className="h-9 w-9" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSeekForward}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrubber */}
        <div className="flex-1">
          <Slider
            value={[playheadFrame]}
            onValueChange={handleSliderChange}
            min={0}
            max={Math.max(1, totalFrames - 1)}
            step={1}
            className="w-full"
          />
        </div>

        {/* Time display */}
        <div className="text-xs font-mono text-muted-foreground whitespace-nowrap">
          {formatTime(currentTime)} / {formatTime(totalTime)}
        </div>
      </div>
    </div>
  );
}

import { Composition } from "remotion";
import {
  MasterShowcase,
  MASTER_SHOWCASE_DURATION_IN_FRAMES,
  MASTER_SHOWCASE_FPS,
  MASTER_SHOWCASE_HEIGHT,
  MASTER_SHOWCASE_WIDTH,
} from "./compositions/MasterShowcase";
import { LifetrekVignette, VIGNETTE_DURATION, VIGNETTE_FPS, VIGNETTE_WIDTH, VIGNETTE_HEIGHT } from "./LifetrekVignette";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LifetrekVignette"
        component={LifetrekVignette}
        durationInFrames={VIGNETTE_DURATION}
        fps={VIGNETTE_FPS}
        width={VIGNETTE_WIDTH}
        height={VIGNETTE_HEIGHT}
      />
      {/* Silent version - no audio */}
      <Composition
        id="MasterShowcase"
        component={MasterShowcase}
        durationInFrames={MASTER_SHOWCASE_DURATION_IN_FRAMES}
        fps={MASTER_SHOWCASE_FPS}
        width={MASTER_SHOWCASE_WIDTH}
        height={MASTER_SHOWCASE_HEIGHT}
      />
      {/* With voiceover only */}
      <Composition
        id="MasterShowcaseVoiceover"
        component={MasterShowcase}
        durationInFrames={MASTER_SHOWCASE_DURATION_IN_FRAMES}
        fps={MASTER_SHOWCASE_FPS}
        width={MASTER_SHOWCASE_WIDTH}
        height={MASTER_SHOWCASE_HEIGHT}
        defaultProps={{ useVoiceover: true }}
      />
      {/* Full production - voiceover + background music */}
      <Composition
        id="MasterShowcaseFull"
        component={MasterShowcase}
        durationInFrames={MASTER_SHOWCASE_DURATION_IN_FRAMES}
        fps={MASTER_SHOWCASE_FPS}
        width={MASTER_SHOWCASE_WIDTH}
        height={MASTER_SHOWCASE_HEIGHT}
        defaultProps={{ useVoiceover: true, useMusic: true }}
      />
      {/* Stills version - no video, no audio */}
      <Composition
        id="MasterShowcaseStills"
        component={MasterShowcase}
        durationInFrames={MASTER_SHOWCASE_DURATION_IN_FRAMES}
        fps={MASTER_SHOWCASE_FPS}
        width={MASTER_SHOWCASE_WIDTH}
        height={MASTER_SHOWCASE_HEIGHT}
        defaultProps={{ useBroll: false }}
      />
    </>
  );
};

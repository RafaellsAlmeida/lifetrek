import { Composition } from "remotion";
import {
  MasterShowcase,
  MASTER_SHOWCASE_DURATION_IN_FRAMES,
  MASTER_SHOWCASE_FPS,
  MASTER_SHOWCASE_HEIGHT,
  MASTER_SHOWCASE_WIDTH,
} from "./compositions/MasterShowcase";
import { LifetrekVignette, VIGNETTE_DURATION, VIGNETTE_FPS, VIGNETTE_WIDTH, VIGNETTE_HEIGHT } from "./LifetrekVignette";
import {
  SalaLimpaTour,
  SALA_LIMPA_DURATION_IN_FRAMES,
  SALA_LIMPA_FPS,
  SALA_LIMPA_WIDTH,
  SALA_LIMPA_HEIGHT,
} from "./compositions/SalaLimpaTour";
import {
  SwissTurningTour,
  SWISS_TURNING_DURATION_IN_FRAMES,
  SWISS_TURNING_FPS,
  SWISS_TURNING_WIDTH,
  SWISS_TURNING_HEIGHT,
} from "./compositions/SwissTurningTour";

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
      <Composition
        id="SalaLimpaTour"
        component={SalaLimpaTour}
        durationInFrames={SALA_LIMPA_DURATION_IN_FRAMES}
        fps={SALA_LIMPA_FPS}
        width={SALA_LIMPA_WIDTH}
        height={SALA_LIMPA_HEIGHT}
      />
      <Composition
        id="SwissTurningTour"
        component={SwissTurningTour}
        durationInFrames={SWISS_TURNING_DURATION_IN_FRAMES}
        fps={SWISS_TURNING_FPS}
        width={SWISS_TURNING_WIDTH}
        height={SWISS_TURNING_HEIGHT}
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

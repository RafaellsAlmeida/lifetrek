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
import {
  LinkedInShort,
  LINKEDIN_SHORT_DEFAULT_DURATION,
  LINKEDIN_SHORT_FPS,
  LINKEDIN_SHORT_HEIGHT,
  LINKEDIN_SHORT_MAX_DURATION,
  LINKEDIN_SHORT_MIN_DURATION,
  LINKEDIN_SHORT_WIDTH,
} from "./compositions/LinkedInShort";
import {
  DoCavacoAoCMM,
  DO_CAVACO_AO_CMM_DURATION_IN_FRAMES,
  DO_CAVACO_AO_CMM_FPS,
  DO_CAVACO_AO_CMM_HEIGHT,
  DO_CAVACO_AO_CMM_WIDTH,
} from "./compositions/DoCavacoAoCMM";

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
      <Composition
        id="LinkedInShort"
        component={LinkedInShort}
        durationInFrames={LINKEDIN_SHORT_DEFAULT_DURATION}
        fps={LINKEDIN_SHORT_FPS}
        width={LINKEDIN_SHORT_WIDTH}
        height={LINKEDIN_SHORT_HEIGHT}
        defaultProps={{
          topic: "Citizen L20 Swiss turning titanium",
          accentColor: "#1A7A3E",
          durationInFrames: LINKEDIN_SHORT_DEFAULT_DURATION,
          slides: [
            {
              text: "Citizen L20/M32 em corte real",
              subtext: "Geometrias complexas em Ti Gr5 sem reposicionamento.",
            },
            {
              text: "Validação com ZEISS CMM",
              subtext: "Inspeção dimensional com rastreabilidade por lote.",
            },
            {
              text: "Fluxo integrado em ISO 7",
              subtext: "Da barra ao componente final em um único parceiro.",
            },
          ],
        }}
        calculateMetadata={({ props }) => {
          const requestedDuration =
            typeof (props as { durationInFrames?: unknown }).durationInFrames === "number"
              ? ((props as { durationInFrames?: number }).durationInFrames as number)
              : LINKEDIN_SHORT_DEFAULT_DURATION;
          const durationInFrames = Math.max(
            LINKEDIN_SHORT_MIN_DURATION,
            Math.min(LINKEDIN_SHORT_MAX_DURATION, requestedDuration),
          );
          return {
            durationInFrames,
          };
        }}
      />
      <Composition
        id="DoCavacoAoCMM"
        component={DoCavacoAoCMM}
        durationInFrames={DO_CAVACO_AO_CMM_DURATION_IN_FRAMES}
        fps={DO_CAVACO_AO_CMM_FPS}
        width={DO_CAVACO_AO_CMM_WIDTH}
        height={DO_CAVACO_AO_CMM_HEIGHT}
        defaultProps={{ platform: "linkedin" }}
      />
      <Composition
        id="DoCavacoAoCMMInstagramSquare"
        component={DoCavacoAoCMM}
        durationInFrames={DO_CAVACO_AO_CMM_DURATION_IN_FRAMES}
        fps={DO_CAVACO_AO_CMM_FPS}
        width={DO_CAVACO_AO_CMM_WIDTH}
        height={DO_CAVACO_AO_CMM_HEIGHT}
        defaultProps={{ platform: "instagram" }}
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

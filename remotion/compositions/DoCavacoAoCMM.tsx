import React from "react";
import {
  AbsoluteFill,
  Img,
  Video,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { Pie } from "@remotion/shapes";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { LifetrekVignette } from "../LifetrekVignette";
import { AnamorphicFlare } from "../effects/AnamorphicFlare";
import { ChromaticAberration } from "../effects/ChromaticAberration";
import { FilmGrain } from "../effects/FilmGrain";
import { Letterbox } from "../effects/Letterbox";
import { LockOnCrosshair } from "../effects/LockOnCrosshair";
import { TechnicalCallout } from "../effects/TechnicalCallout";

export const DO_CAVACO_AO_CMM_FPS = 30;
export const DO_CAVACO_AO_CMM_WIDTH = 1080;
export const DO_CAVACO_AO_CMM_HEIGHT = 1080;
export const DO_CAVACO_AO_CMM_DURATION_IN_FRAMES = 900;

const BRAND = {
  blue: "#004F8F",
  green: "#1A7A3E",
  orange: "#F07818",
  cyan: "#00D1FF",
  white: "#FFFFFF",
  ink: "#020811",
};

const INTER = "Inter, system-ui, sans-serif";
const TRANSITION = 12;

const VIDEO = {
  chips: staticFile("remotion/assets/runway/4a-cnc-internal.mp4"),
  cnc: staticFile("remotion/broll/broll-04-cnc.mp4"),
  zeiss: staticFile("remotion/broll/broll-05-metrology.mp4"),
  implant: staticFile("remotion/assets/images/swiss_implante_espinhal.png"),
  macroInspection: staticFile("remotion/assets/cavaco-cmm/openrouter-cmm-macro-wan27-clean.mp4"),
  logo: staticFile("images/lifetrek-logo-full.png"),
  qr: staticFile("remotion/assets/cavaco-cmm/qr-plano-medicao.png"),
};

const fadeInOut = (frame: number, duration: number, edge = 10) =>
  interpolate(frame, [0, edge, Math.max(edge + 1, duration - edge), duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const splitText = (value: string) => value.split("\n").filter(Boolean);

const LogoBug: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 44,
      right: 44,
      zIndex: 60,
      padding: "9px 11px",
      background: "rgba(255,255,255,0.96)",
      border: "1px solid rgba(255,255,255,0.36)",
      boxShadow: "0 14px 38px rgba(0,0,0,0.28)",
    }}
  >
    <Img src={VIDEO.logo} style={{ width: 184, display: "block" }} />
  </div>
);

const MediaBackground: React.FC<{
  type: "video" | "image";
  src: string;
  durationInFrames: number;
  zoom?: [number, number];
  grade?: "raw" | "control" | "neutral";
  brightness?: number;
}> = ({ type, src, durationInFrames, zoom = [1.03, 1.1], grade = "neutral", brightness = 0.78 }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], zoom, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const saturation = grade === "raw" ? 0.78 : grade === "control" ? 1.08 : 0.94;
  const hue = grade === "raw" ? "-8deg" : grade === "control" ? "5deg" : "0deg";

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {type === "video" ? (
          <Video
            src={src}
            muted
            loop
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `brightness(${brightness}) saturate(${saturation}) hue-rotate(${hue}) contrast(1.08)`,
            }}
          />
        ) : (
          <Img
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `brightness(${brightness}) saturate(${saturation}) hue-rotate(${hue}) contrast(1.08)`,
            }}
          />
        )}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            grade === "raw"
              ? "linear-gradient(135deg, rgba(0,22,48,0.70), rgba(68,20,0,0.28) 58%, rgba(0,0,0,0.78))"
              : "linear-gradient(135deg, rgba(0,30,70,0.62), rgba(0,79,143,0.24) 48%, rgba(0,0,0,0.72))",
        }}
      />
    </AbsoluteFill>
  );
};

const TechnicalGrid: React.FC<{ opacity?: number }> = ({ opacity = 0.18 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      opacity,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.13) 1px, transparent 1px)",
      backgroundSize: "54px 54px",
      maskImage: "radial-gradient(circle at center, rgba(0,0,0,0.8), transparent 72%)",
      zIndex: 8,
    }}
  />
);

const SceneTitle: React.FC<{
  eyebrow?: string;
  lines: string;
  subline?: string;
  bottom?: number;
  fontSize?: number;
}> = ({ eyebrow, lines, subline, bottom = 154, fontSize = 70 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 88 } });
  const y = interpolate(enter, [0, 1], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <CameraMotionBlur shutterAngle={90} samples={3}>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom,
          color: BRAND.white,
          opacity,
          transform: `translateY(${y}px)`,
          zIndex: 50,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              color: BRAND.green,
              fontFamily: INTER,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 0,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: INTER,
            fontWeight: 900,
            fontVariationSettings: "\"wght\" 900, \"opsz\" 144",
            fontSize,
            lineHeight: 0.98,
            letterSpacing: 0,
            textShadow: "0 12px 36px rgba(0,0,0,0.72)",
          }}
        >
          {splitText(lines).map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
        {subline ? (
          <div
            style={{
              marginTop: 18,
              maxWidth: 780,
              color: "rgba(255,255,255,0.86)",
              fontFamily: INTER,
              fontSize: 29,
              fontWeight: 600,
              lineHeight: 1.2,
              textShadow: "0 8px 26px rgba(0,0,0,0.7)",
            }}
          >
            {subline}
          </div>
        ) : null}
      </div>
    </CameraMotionBlur>
  );
};

type Platform = "linkedin" | "instagram";

const VignetteScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, durationInFrames, 8);
  const crosshair = interpolate(frame, [16, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BRAND.ink, opacity }}>
      <LifetrekVignette />
      <TechnicalGrid opacity={0.11} />
      <div
        style={{
          position: "absolute",
          left: 478,
          top: 478,
          width: 124,
          height: 124,
          border: `2px solid ${BRAND.cyan}`,
          opacity: crosshair * 0.72,
          transform: `scale(${1.18 - crosshair * 0.18})`,
          boxShadow: `0 0 ${24 * crosshair}px ${BRAND.cyan}55`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          bottom: 62,
          fontFamily: INTER,
          color: BRAND.blue,
          fontWeight: 800,
          fontSize: 20,
          opacity: crosshair,
        }}
      >
        PRECISÃO · QUALIDADE · RASTREABILIDADE
      </div>
    </AbsoluteFill>
  );
};

const HookScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const hookWords = ["Onde", "a", "variação", "entra?"];
  const visibleWordCount = Math.ceil(interpolate(frame, [8, 30], [0, hookWords.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  const shown = hookWords.slice(0, visibleWordCount).join(" ");
  const impact = interpolate(frame, [8, 15, 24], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <MediaBackground type="video" src={VIDEO.chips} durationInFrames={durationInFrames} grade="raw" brightness={0.7} />
      <Letterbox durationInFrames={durationInFrames} />
      <ChromaticAberration intensity={2 + impact * 5} opacity={0.22 + impact * 0.34} />
      <AnamorphicFlare x={628} y={438} delay={10} width={880} color="rgba(240,120,24,0.7)" />
      <LogoBug />
      <TechnicalCallout path="M 662 408 C 720 382, 772 374, 840 390" label="cavaco" x={842} y={390} delay={22} color={BRAND.orange} />
      <SceneTitle
        eyebrow="DO CAVACO À CMM"
        lines={shown}
        subline="Da usinagem à medição: o ponto crítico é invisível."
        bottom={160}
        fontSize={74}
      />
    </AbsoluteFill>
  );
};

const CitizenScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => (
  <AbsoluteFill>
    <MediaBackground type="video" src={VIDEO.cnc} durationInFrames={durationInFrames} grade="raw" brightness={0.74} />
    <Letterbox durationInFrames={durationInFrames} />
    <LogoBug />
    <TechnicalGrid opacity={0.12} />
    <AnamorphicFlare x={466} y={506} delay={18} width={720} color="rgba(0,209,255,0.7)" />
    <TechnicalCallout path="M 372 454 C 284 414, 232 398, 160 392" label="Ti Gr5" x={160} y={392} delay={20} color={BRAND.cyan} />
    <TechnicalCallout path="M 476 555 C 582 572, 646 612, 734 668" label="feed 0.02 mm/rev" x={734} y={668} delay={38} color={BRAND.green} />
    <TechnicalCallout path="M 522 426 C 636 392, 708 334, 824 304" label="desgaste da ferramenta" x={824} y={304} delay={56} color={BRAND.orange} />
    <SceneTitle
      eyebrow="USINAGEM SWISS"
      lines={"A variação\nnão pede licença"}
      subline="Fixação, temperatura, ferramenta e cavaco entram antes do lote chegar na metrologia."
      bottom={148}
      fontSize={68}
    />
  </AbsoluteFill>
);

const VariationScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <MediaBackground
        type="video"
        src={VIDEO.macroInspection}
        durationInFrames={durationInFrames}
        grade="neutral"
        brightness={0.82}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, rgba(180,20,26,${0.26 * (1 - shift)}) 0%, rgba(26,122,62,${0.22 * shift}) 100%)`,
          zIndex: 10,
        }}
      />
      <Letterbox durationInFrames={durationInFrames} />
      <LogoBug />
      <TechnicalGrid opacity={0.14} />
      <LockOnCrosshair x={654} y={470} size={148} delay={12} color={BRAND.cyan} />
      <TechnicalCallout path="M 654 470 C 722 408, 800 372, 878 402" label="CTQ crítico" x={878} y={402} delay={28} color={BRAND.cyan} />
      <div
        style={{
          position: "absolute",
          right: 86,
          bottom: 148,
          zIndex: 52,
          width: 340,
          padding: "18px 20px",
          border: "1px solid rgba(0,209,255,0.55)",
          background: "rgba(2,8,17,0.78)",
          color: BRAND.white,
          fontFamily: INTER,
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 1.18,
          boxShadow: "0 0 40px rgba(0,209,255,0.16)",
        }}
      >
        plano antes do aceite
        <div style={{ color: BRAND.green, fontSize: 18, marginTop: 10 }}>CTQ · método · frequência</div>
      </div>
      <SceneTitle
        eyebrow="VARIAÇÃO INVISÍVEL"
        lines={"Não basta\nmedir no fim"}
        subline="O controle precisa nascer junto com o processo."
        bottom={166}
        fontSize={66}
      />
    </AbsoluteFill>
  );
};

const ZeissScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 42, [0, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <MediaBackground type="video" src={VIDEO.zeiss} durationInFrames={durationInFrames} grade="control" brightness={0.82} />
      <Letterbox durationInFrames={durationInFrames} />
      <LogoBug />
      <AnamorphicFlare x={548} y={478} delay={16} width={820} color="rgba(0,209,255,0.78)" />
      <div
        style={{
          position: "absolute",
          left: 462,
          top: 386,
          width: 176,
          height: 176,
          opacity: 0.75 - pulse * 0.4,
          transform: `scale(${0.72 + pulse * 1.2})`,
          zIndex: 32,
        }}
      >
        <Pie radius={88} progress={0.82} fill="rgba(0,209,255,0.18)" stroke={BRAND.cyan} strokeWidth={2} />
      </div>
      <LockOnCrosshair x={550} y={474} size={128} delay={10} color={BRAND.cyan} />
      <TechnicalCallout path="M 550 474 C 688 458, 758 430, 870 360" label="ZEISS CMM" x={870} y={360} delay={24} color={BRAND.cyan} />
      <TechnicalCallout path="M 544 480 C 418 516, 318 552, 190 612" label="contato controlado" x={190} y={612} delay={42} color={BRAND.green} />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 156,
          zIndex: 52,
          color: BRAND.white,
          fontFamily: INTER,
          fontWeight: 900,
          fontSize: 40,
          lineHeight: 1,
          padding: "16px 18px",
          background: "rgba(2,8,17,0.72)",
          border: `1px solid ${BRAND.green}`,
          boxShadow: "0 0 38px rgba(26,122,62,0.24)",
        }}
      >
        critério de aceite
      </div>
      <SceneTitle
        eyebrow="MEDIÇÃO ZEISS"
        lines={"Aqui o dado\nfecha o ciclo"}
        subline="A peça encontra o plano, não apenas uma medição isolada."
        bottom={150}
        fontSize={67}
      />
    </AbsoluteFill>
  );
};

const DataLockScene: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 88 } });
  const blockY = interpolate(enter, [0, 1], [26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [20, 78], [0, 780], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #020811 0%, #00345f 52%, #06111f 100%)" }}>
      <TechnicalGrid opacity={0.2} />
      <LogoBug />
      <div style={{ position: "absolute", left: 72, top: 96, width: 92, height: 92, zIndex: 20 }}>
        <Pie radius={46} progress={interpolate(frame, [0, durationInFrames], [0.22, 0.92], { extrapolateRight: "clamp" })} fill={BRAND.green} />
      </div>
      <CameraMotionBlur shutterAngle={120} samples={4}>
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            top: 202,
            transform: `translateY(${blockY}px)`,
            color: BRAND.white,
            zIndex: 35,
          }}
        >
          <div
            style={{
              fontFamily: INTER,
              color: BRAND.green,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 0,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            REVELAÇÃO
          </div>
          <div
            style={{
              fontFamily: INTER,
              fontWeight: 900,
              fontSize: 59,
              lineHeight: 1.04,
              letterSpacing: 0,
              maxWidth: 902,
              textShadow: "0 14px 42px rgba(0,0,0,0.52)",
            }}
          >
            A peça não é aprovada porque foi medida.
            <br />
            Ela é aprovada porque foi medida contra um plano.
          </div>
          <div
            style={{
              width: lineWidth,
              height: 4,
              background: `linear-gradient(90deg, ${BRAND.green}, ${BRAND.cyan}, transparent)`,
              marginTop: 34,
              boxShadow: "0 0 18px rgba(0,209,255,0.72)",
            }}
          />
        </div>
      </CameraMotionBlur>
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 138,
          zIndex: 36,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          fontFamily: INTER,
          fontSize: 22,
          color: "rgba(255,255,255,0.88)",
        }}
      >
        {[
          ["+ CTQ", "diâmetro · coaxialidade · rugosidade"],
          ["+ MSA", "método · incerteza · frequência"],
          ["+ LOTE", "rastreabilidade total"],
          ["= LIBERAÇÃO", "critério claro de aceite"],
        ].map(([key, value], index) => (
          <div
            key={key}
            style={{
              opacity: interpolate(frame, [56 + index * 9, 66 + index * 9], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              padding: "14px 16px",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(2,8,17,0.42)",
            }}
          >
            <span style={{ color: index === 3 ? BRAND.orange : BRAND.green, fontWeight: 900 }}>{key}</span>
            <span style={{ marginLeft: 12 }}>{value}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC<{ durationInFrames: number; platform: Platform }> = ({ platform }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 96 } });
  const arrowWidth = interpolate(frame, [58, 96], [0, 328], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const qrOpacity = interpolate(frame, [78, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = interpolate(frame % 46, [0, 23, 46], [0.88, 1, 0.88], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #00152f 0%, #004F8F 48%, #020811 100%)" }}>
      <TechnicalGrid opacity={0.14} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 72% 30%, rgba(26,122,62,0.28), transparent 34%)" }} />
      <LogoBug />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 122,
          width: 780,
          color: BRAND.white,
          transform: `translateY(${interpolate(enter, [0, 1], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
        }}
      >
        <div
          style={{
            color: BRAND.orange,
            fontFamily: INTER,
            fontSize: 22,
            fontWeight: 900,
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          PRÓXIMO PASSO
        </div>
        <div
          style={{
            fontFamily: INTER,
            fontWeight: 900,
            fontSize: 80,
            lineHeight: 0.96,
            letterSpacing: 0,
            textShadow: "0 14px 38px rgba(0,0,0,0.5)",
          }}
        >
          Baixe o plano
          <br />
          de medição
        </div>
        <div
          style={{
            marginTop: 28,
            maxWidth: 680,
            color: "rgba(255,255,255,0.86)",
            fontFamily: INTER,
            fontSize: 31,
            fontWeight: 600,
            lineHeight: 1.22,
          }}
        >
          Use o recurso para transformar CTQs em rotina de inspeção e liberação.
        </div>
      </div>
      <CameraMotionBlur shutterAngle={120} samples={4}>
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 520,
            height: 58,
            width: 370,
            transform: `scale(${pulse})`,
            transformOrigin: "left center",
            zIndex: 34,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 26,
              width: arrowWidth,
              height: 6,
              background: BRAND.orange,
              boxShadow: "0 0 20px rgba(240,120,24,0.7)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: arrowWidth - 20,
              top: 12,
              width: 34,
              height: 34,
              borderTop: `6px solid ${BRAND.orange}`,
              borderRight: `6px solid ${BRAND.orange}`,
              transform: "rotate(45deg)",
              opacity: arrowWidth > 30 ? 1 : 0,
            }}
          />
        </div>
      </CameraMotionBlur>
      {platform === "linkedin" ? (
        <div
          style={{
            position: "absolute",
            right: 82,
            bottom: 134,
            opacity: qrOpacity,
            padding: 18,
            background: "#fff",
            boxShadow: "0 26px 70px rgba(0,0,0,0.38)",
            transform: `translateY(${interpolate(qrOpacity, [0, 1], [16, 0])}px)`,
          }}
        >
          <Img src={VIDEO.qr} style={{ width: 228, height: 228, display: "block" }} />
          <div
            style={{
              marginTop: 12,
              color: BRAND.blue,
              fontFamily: INTER,
              fontWeight: 900,
              fontSize: 16,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            recurso técnico
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            right: 82,
            bottom: 152,
            opacity: qrOpacity,
            padding: "16px 20px",
            border: "1px solid rgba(255,255,255,0.28)",
            background: "rgba(2,8,17,0.58)",
            color: BRAND.white,
            fontFamily: INTER,
            fontWeight: 900,
            fontSize: 24,
            textTransform: "uppercase",
            boxShadow: "0 18px 46px rgba(0,0,0,0.24)",
          }}
        >
          link na bio
        </div>
      )}
    </AbsoluteFill>
  );
};

export const DoCavacoAoCMM: React.FC<{ platform?: Platform }> = ({ platform = "linkedin" }) => {
  return (
    <AbsoluteFill style={{ background: BRAND.ink }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={72}>
          <VignetteScene durationInFrames={72} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: TRANSITION })} presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={102}>
          <HookScene durationInFrames={102} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: TRANSITION })} presentation={wipe({ direction: "from-right" })} />
        <TransitionSeries.Sequence durationInFrames={132}>
          <CitizenScene durationInFrames={132} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: TRANSITION })} presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={132}>
          <VariationScene durationInFrames={132} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: TRANSITION })} presentation={wipe({ direction: "from-bottom-right" })} />
        <TransitionSeries.Sequence durationInFrames={147}>
          <ZeissScene durationInFrames={147} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: TRANSITION })} presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={177}>
          <DataLockScene durationInFrames={177} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: TRANSITION })} presentation={wipe({ direction: "from-left" })} />
        <TransitionSeries.Sequence durationInFrames={210}>
          <CtaScene durationInFrames={210} platform={platform} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};

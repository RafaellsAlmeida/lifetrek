import {
  AbsoluteFill,
  Img,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
} from "remotion";
import React from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
// 7.5-second vignette @ 30fps = 225 frames
// Can also be used as a 5-second intro by exporting only frames 0–150.
export const VIGNETTE_FPS = 30;
export const VIGNETTE_DURATION = 225; // frames
export const VIGNETTE_WIDTH = 1920;
export const VIGNETTE_HEIGHT = 1080;

// Brand colors (from BRAND_BOOK.md)
const BLUE_DARK = "#004F8F";   // Corporate Blue
const BLUE_MID = "#023d75";
const WHITE = "#FFFFFF";
const ORANGE = "#F07818";     // Energy Orange (used as accent divider)

// ─── HELPERS ─────────────────────────────────────────────────────────────────
/** Clamp interpolation helper */
const interp = (
  frame: number,
  [from, to]: [number, number],
  [outFrom, outTo]: [number, number]
) =>
  interpolate(frame, [from, to], [outFrom, outTo], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Spring-based scale/opacity entry tied to a start frame */
const useEntry = (frame: number, fps: number, startFrame: number) => {
  const f = frame - startFrame;
  const scale = spring({
    frame: f,
    fps,
    config: { damping: 180, stiffness: 80, mass: 0.6 },
  });
  const opacity = interp(frame, [startFrame, startFrame + 15], [0, 1]);
  return { scale, opacity };
};

// ─── PILLAR COMPONENT ────────────────────────────────────────────────────────
const Pillar: React.FC<{
  text: string;
  sub: string;
  frame: number;
  fps: number;
  startFrame: number;
}> = ({ text, sub, frame, fps, startFrame }) => {
  const { scale, opacity } = useEntry(frame, fps, startFrame);
  const translateY = interp(frame, [startFrame, startFrame + 25], [24, 0]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        flex: 1,
        padding: "0 40px",
      }}
    >
      {/* Accent line */}
      <div
        style={{
          width: 48,
          height: 4,
          background: ORANGE,
          borderRadius: 4,
          marginBottom: 20,
        }}
      />
      <div
        style={{
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: 44,
          fontWeight: 800,
          color: WHITE,
          letterSpacing: "-0.03em",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        {text}
      </div>
      <div
        style={{
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: 22,
          fontWeight: 400,
          color: "rgba(255,255,255,0.72)",
          letterSpacing: "0.04em",
          marginTop: 14,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {sub}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const LifetrekVignette: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Phase 1: Logo reveal (0–60) ──────────────────────────────────────────
  const logoOpacity = interp(frame, [0, 20], [0, 1]);
  const logoEntry = spring({ frame, fps, config: { damping: 200, stiffness: 90, mass: 0.5 } });

  // ── Phase 2: Logo moves up + pillars appear (70–150) ─────────────────────
  // At frame 70 logo starts sliding upward
  const logoY = interp(frame, [65, 110], [0, -160]);

  // ── Phase 3: Fade out (200–225) ──────────────────────────────────────────
  const globalOpacity = interp(frame, [200, 224], [1, 0]);

  // Pillars: stagger by 18 frames each
  const PILLAR_START = 80;

  // Divider lines between pillars
  const dividerOpacity = interp(frame, [PILLAR_START + 20, PILLAR_START + 45], [0, 0.25]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_MID} 50%, ${BLUE_DARK} 100%)`,
        opacity: globalOpacity,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow in the center */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(240,120,24,0.06) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Logo ── */}
      <div
        style={{
          transform: `translateY(${logoY}px) scale(${logoEntry})`,
          opacity: logoOpacity,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile("logo-transparent.png")}
          style={{
            width: 480,
            objectFit: "contain",
            filter: "brightness(0) invert(1)",  // converts navy logo → pure white
          }}
        />
      </div>

      {/* ── 3 Pillars ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          maxWidth: 1400,
          paddingTop: 20,
        }}
      >
        <Pillar
          text="Precisão"
          sub="Componentes sem tolerâncias"
          frame={frame}
          fps={fps}
          startFrame={PILLAR_START}
        />

        {/* Vertical divider */}
        <div
          style={{
            width: 1,
            height: 140,
            background: WHITE,
            opacity: dividerOpacity,
            alignSelf: "center",
            marginTop: 20,
          }}
        />

        <Pillar
          text="Qualidade"
          sub="ISO 13485 · ANVISA"
          frame={frame}
          fps={fps}
          startFrame={PILLAR_START + 18}
        />

        {/* Vertical divider */}
        <div
          style={{
            width: 1,
            height: 140,
            background: WHITE,
            opacity: dividerOpacity,
            alignSelf: "center",
            marginTop: 20,
          }}
        />

        <Pillar
          text="Inovação"
          sub="Tecnologia de ponta"
          frame={frame}
          fps={fps}
          startFrame={PILLAR_START + 36}
        />
      </div>

      {/* ── Tagline beneath pillars ── */}
      <div
        style={{
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: 26,
          fontWeight: 300,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginTop: 56,
          opacity: interp(frame, [PILLAR_START + 60, PILLAR_START + 90], [0, 1]),
          transform: `translateY(${interp(frame, [PILLAR_START + 60, PILLAR_START + 90], [12, 0])}px)`,
        }}
      >
        Engenharia de Precisão a Serviço da Vida
      </div>
    </AbsoluteFill>
  );
};

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
export const VIGNETTE_FPS = 30;
export const VIGNETTE_DURATION = 225; // 7.5s @ 30fps
export const VIGNETTE_WIDTH = 1080;  // 1:1 square
export const VIGNETTE_HEIGHT = 1080;

// Brand palette (BRAND_BOOK.md)
const BLUE = "#004F8F";   // Corporate Blue
const BLUE_MID = "#1a6bb5";   // slightly lighter for text sub
const GREEN = "#1A7A3E";   // Innovation Green
const ORANGE = "#F07818";   // Energy Orange
const WHITE = "#FFFFFF";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const interp = (
  frame: number,
  [from, to]: [number, number],
  [outFrom, outTo]: [number, number]
) =>
  interpolate(frame, [from, to], [outFrom, outTo], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ─── PILLAR ──────────────────────────────────────────────────────────────────
const Pillar: React.FC<{
  text: string;
  sub: string;
  accentColor: string;   // orange or green
  frame: number;
  fps: number;
  startFrame: number;
}> = ({ text, sub, accentColor, frame, fps, startFrame }) => {
  const f = frame - startFrame;
  const scale = spring({ frame: f, fps, config: { damping: 180, stiffness: 80, mass: 0.6 } });
  const opacity = interp(frame, [startFrame, startFrame + 15], [0, 1]);
  const translateY = interp(frame, [startFrame, startFrame + 25], [20, 0]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        flex: 1,
        padding: "0 18px",
      }}
    >
      {/* Colored accent bar */}
      <div style={{ width: 36, height: 4, background: accentColor, borderRadius: 3, marginBottom: 14 }} />

      {/* Pillar title */}
      <div
        style={{
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: 36,
          fontWeight: 800,
          color: BLUE,
          letterSpacing: "-0.03em",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        {text}
      </div>

      {/* Pillar subtitle */}
      <div
        style={{
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: 14,
          fontWeight: 500,
          color: BLUE_MID,
          letterSpacing: "0.06em",
          marginTop: 10,
          textAlign: "center",
          textTransform: "uppercase",
          opacity: 0.75,
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

  // Phase 1: Logo enters (0→60)
  const logoOpacity = interp(frame, [0, 20], [0, 1]);
  const logoScale = spring({ frame, fps, config: { damping: 200, stiffness: 90, mass: 0.5 } });

  // Phase 2: Logo slides up to make room for pillars (frame 55→100)
  const logoY = interp(frame, [55, 100], [0, -120]);

  // Phase 3: Pillars stagger in (frame 80+)
  const PILLAR_START = 80;
  const dividerOpacity = interp(frame, [PILLAR_START + 20, PILLAR_START + 50], [0, 0.18]);

  // Tagline (frame 140+)
  const taglineOpacity = interp(frame, [140, 170], [0, 1]);
  const taglineY = interp(frame, [140, 170], [10, 0]);

  // Global fade-out (frame 200→225)
  const globalOpacity = interp(frame, [200, 224], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        // White background with a very subtle blue radial gradient coming from top
        background: `radial-gradient(ellipse 110% 80% at 50% -10%, hsl(210 60% 92%) 0%, ${WHITE} 65%)`,
        opacity: globalOpacity,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >

      {/* Subtle top border accent line (orange + green) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, display: "flex" }}>
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GREEN }} />
        <div style={{ flex: 1, background: ORANGE }} />
      </div>

      {/* ── Logo ── */}
      <div
        style={{
          transform: `translateY(${logoY}px) scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        <Img
          src={staticFile("images/lifetrek-logo-full.png")}
          style={{ width: 420, objectFit: "contain" }}
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
          maxWidth: 960,
          paddingTop: 8,
        }}
      >
        <Pillar
          text="Precisão"
          sub="Tolerâncias exatas"
          accentColor={BLUE}
          frame={frame}
          fps={fps}
          startFrame={PILLAR_START}
        />

        {/* Divider */}
        <div style={{ width: 1, height: 110, background: BLUE, opacity: dividerOpacity, alignSelf: "center", marginTop: 18 }} />

        <Pillar
          text="Qualidade"
          sub="ISO 13485 · ANVISA"
          accentColor={GREEN}
          frame={frame}
          fps={fps}
          startFrame={PILLAR_START + 18}
        />

        {/* Divider */}
        <div style={{ width: 1, height: 110, background: BLUE, opacity: dividerOpacity, alignSelf: "center", marginTop: 18 }} />

        <Pillar
          text="Inovação"
          sub="Tecnologia de ponta"
          accentColor={ORANGE}
          frame={frame}
          fps={fps}
          startFrame={PILLAR_START + 36}
        />
      </div>

      {/* ── Tagline ── */}
      <div
        style={{
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: 18,
          fontWeight: 300,
          color: BLUE,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginTop: 40,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Engenharia de Precisão a Serviço da Vida
      </div>

      {/* Subtle bottom accent line */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: ORANGE, opacity: 0.5 }} />
    </AbsoluteFill>
  );
};

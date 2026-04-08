import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LifetrekVignette, VIGNETTE_HEIGHT, VIGNETTE_WIDTH } from "../LifetrekVignette";

/** 30fps: 360f = 12s, 450f = 15s (feed LinkedIn curto) */
export const LINKEDIN_SHORT_FPS = 30;
export const LINKEDIN_SHORT_WIDTH = VIGNETTE_WIDTH;
export const LINKEDIN_SHORT_HEIGHT = VIGNETTE_HEIGHT;
export const LINKEDIN_SHORT_MIN_DURATION = 360;
export const LINKEDIN_SHORT_MAX_DURATION = 450;
export const LINKEDIN_SHORT_DEFAULT_DURATION = 420;
/** Primeiros frames da vignette completa (logo + pilares entrando) */
export const LINKEDIN_SHORT_INTRO_DURATION = 45;
export const LINKEDIN_SHORT_OUTRO_DURATION = 36;
/** Mínimo por cena de slide para caber em 12–15s com 3 imagens */
const MIN_FRAMES_PER_SLIDE = 72;

export type LinkedInShortSlide = {
  text: string;
  subtext?: string;
  backgroundImage?: string;
};

export interface LinkedInShortProps {
  topic: string;
  slides: LinkedInShortSlide[];
  accentColor?: string;
  durationInFrames?: number;
}

const BRAND = {
  blue: "#004F8F",
  green: "#1A7A3E",
  orange: "#F07818",
  white: "#FFFFFF",
};

const clampDuration = (value?: number) => {
  const raw = value ?? LINKEDIN_SHORT_DEFAULT_DURATION;
  return Math.max(LINKEDIN_SHORT_MIN_DURATION, Math.min(LINKEDIN_SHORT_MAX_DURATION, raw));
};

const BrandStripBottom: React.FC = () => (
  <div
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 6,
      display: "flex",
      zIndex: 4,
    }}
  >
    <div style={{ flex: 1, background: BRAND.blue }} />
    <div style={{ flex: 1, background: BRAND.green }} />
    <div style={{ flex: 1, background: BRAND.orange }} />
  </div>
);

const BrandStripTop: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 6,
      display: "flex",
      zIndex: 4,
    }}
  >
    <div style={{ flex: 1, background: BRAND.blue }} />
    <div style={{ flex: 1, background: BRAND.green }} />
    <div style={{ flex: 1, background: BRAND.orange }} />
  </div>
);

const splitHeadline = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const SlideScene: React.FC<{
  slide: LinkedInShortSlide;
  accentColor: string;
  durationInFrames: number;
}> = ({ slide, accentColor, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const d = Math.max(24, durationInFrames);
  const fade = Math.min(10, Math.floor(d * 0.12));
  const zoomEnd = Math.max(fade + 8, d - fade);

  const zoom = interpolate(frame, [0, zoomEnd], [1.04, 1.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(frame, [0, fade, d - fade, d], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textSpring = spring({
    frame: frame - 4,
    fps,
    config: {
      damping: 16,
      stiffness: 90,
    },
  });

  const textY = interpolate(textSpring, [0, 1], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity }}>
      {slide.backgroundImage ? (
        <Img
          src={slide.backgroundImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom})`,
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: "linear-gradient(145deg, #001a38 0%, #003e73 100%)",
            transform: `scale(${zoom})`,
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(0deg, rgba(0,30,70,0.72) 0%, rgba(0,30,70,0.52) 50%, rgba(0,30,70,0.68) 100%)",
        }}
      />

      <BrandStripTop />
      <BrandStripBottom />

      <div
        style={{
          position: "absolute",
          top: 44,
          right: 44,
          zIndex: 3,
          padding: "10px 12px",
          borderRadius: 10,
          backgroundColor: "rgba(255,255,255,0.96)",
          border: `1px solid rgba(0,79,143,0.25)`,
          boxShadow: "0 10px 28px rgba(0,0,0,0.2)",
        }}
      >
        <Img
          src={staticFile("images/lifetrek-logo-full.png")}
          style={{ width: 200, height: "auto", objectFit: "contain", display: "block" }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 96,
          padding: "26px 30px 28px",
          borderRadius: 22,
          backgroundColor: "rgba(5,16,35,0.8)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 30px 60px rgba(0, 0, 0, 0.42)",
          transform: `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            width: 72,
            height: 4,
            borderRadius: 4,
            backgroundColor: accentColor,
            marginBottom: 12,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontFamily: "Inter, system-ui, sans-serif",
            color: BRAND.white,
            fontWeight: 800,
            fontSize: 46,
            lineHeight: 1.06,
            letterSpacing: "-0.02em",
          }}
        >
          {splitHeadline(slide.text).map((line, idx) => (
            <span key={`${line}-${idx}`}>{line}</span>
          ))}
        </div>
        {slide.subtext ? (
          <p
            style={{
              marginTop: 14,
              marginBottom: 0,
              color: "rgba(255,255,255,0.9)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 26,
              lineHeight: 1.28,
            }}
          >
            {slide.subtext}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const OutroCard: React.FC<{ topic: string; accentColor: string }> = ({ topic, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inSpring = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const opacity = interpolate(inSpring, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(inSpring, [0, 1], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(145deg, #00152f 0%, #004F8F 42%, #00224a 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <BrandStripBottom />
      <div
        style={{
          width: 880,
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.22)",
          backgroundColor: "rgba(6,14,30,0.82)",
          padding: "36px 44px 40px",
          opacity,
          transform: `translateY(${y}px)`,
          boxShadow: "0 30px 70px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Img
          src={staticFile("images/lifetrek-logo-full.png")}
          style={{ width: 220, marginBottom: 18, objectFit: "contain" }}
        />
        <div
          style={{
            width: 110,
            height: 4,
            borderRadius: 4,
            backgroundColor: accentColor,
            marginBottom: 16,
          }}
        />
        <p
          style={{
            margin: 0,
            color: BRAND.white,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 38,
            lineHeight: 1.15,
          }}
        >
          {topic}
        </p>
        <p
          style={{
            marginTop: 12,
            marginBottom: 0,
            color: "rgba(255,255,255,0.9)",
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 24,
            lineHeight: 1.3,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Engenharia de precisão a serviço da vida
        </p>
      </div>
    </AbsoluteFill>
  );
};

const FALLBACK_SLIDES: LinkedInShortSlide[] = [
  {
    text: "Citizen L20/M32 em corte real",
    subtext: "Geometrias complexas em Ti Gr5 com estabilidade de processo.",
  },
  {
    text: "Validação dimensional por ZEISS CMM",
    subtext: "Controle sub-10um integrado ao fluxo de produção.",
  },
  {
    text: "Da usinagem à sala limpa ISO 7",
    subtext: "Rastreabilidade contínua sem transferência de custódia.",
  },
];

export const LinkedInShort: React.FC<LinkedInShortProps> = ({
  topic,
  slides,
  accentColor = BRAND.green,
  durationInFrames = LINKEDIN_SHORT_DEFAULT_DURATION,
}) => {
  const safeSlides = slides?.length ? slides : FALLBACK_SLIDES;
  const totalDuration = clampDuration(durationInFrames);
  const contentFrames = totalDuration - LINKEDIN_SHORT_INTRO_DURATION - LINKEDIN_SHORT_OUTRO_DURATION;
  const perSlide = Math.max(MIN_FRAMES_PER_SLIDE, Math.floor(contentFrames / safeSlides.length));

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.blue }}>
      <Sequence from={0} durationInFrames={LINKEDIN_SHORT_INTRO_DURATION}>
        <LifetrekVignette />
      </Sequence>

      {safeSlides.map((slide, index) => (
        <Sequence
          key={`slide-${index}`}
          from={LINKEDIN_SHORT_INTRO_DURATION + index * perSlide}
          durationInFrames={perSlide}
        >
          <SlideScene slide={slide} accentColor={accentColor} durationInFrames={perSlide} />
        </Sequence>
      ))}

      <Sequence from={totalDuration - LINKEDIN_SHORT_OUTRO_DURATION} durationInFrames={LINKEDIN_SHORT_OUTRO_DURATION}>
        <OutroCard topic={topic} accentColor={accentColor} />
      </Sequence>
    </AbsoluteFill>
  );
};

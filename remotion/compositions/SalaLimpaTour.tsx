import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Img,
  Video,
  staticFile,
} from 'remotion';
import { LifetrekVignette, VIGNETTE_DURATION } from '../LifetrekVignette';

// Total duration carefully calculated to 1245 frames (41.5s @ 30fps)
export const SALA_LIMPA_DURATION_IN_FRAMES = 1245;
export const SALA_LIMPA_FPS = 30;
export const SALA_LIMPA_WIDTH = 1080;
export const SALA_LIMPA_HEIGHT = 1080;

// Brand colors from docs/brand/BRAND_BOOK.md
const BRAND = {
  blue: "#004F8F",
  green: "#1A7A3E",
  orange: "#F07818",
  cyan: "#00D1FF",
  white: "#FFFFFF",
  backgroundDark: "#0a1628",
};

// Hero Gradient from Brand Book
const HERO_GRADIENT = `linear-gradient(135deg, hsl(210 100% 28%) 0%, hsl(210 100% 35%) 50%, hsl(210 100% 28%) 100%)`;

const SLIDES = [
  {
    type: 'video',
    src: staticFile('remotion/broll/broll-02-facade-push.mp4'), // Exterior Hook
    text: 'Tour Sala Limpa ISO 7',
    subtext: 'Padrão de excelência Lifetrek Medical',
    duration: 120,
    animation: 'zoomIn'
  },
  {
    type: 'video',
    src: staticFile('remotion/broll/broll-01-drone-rise.mp4'), // Factory Rise
    text: 'Infraestrutura de Classe Mundial',
    subtext: 'Capacidade produtiva escalável',
    duration: 90,
    animation: 'none'
  },
  {
    type: 'video',
    src: staticFile('remotion/assets/runway/3b-cleanroom-entry.mp4'), // Entry
    text: 'Procedimentos Rigorosos',
    subtext: 'Segurança biológica garantida',
    duration: 120,
    animation: 'none'
  },
  {
    type: 'video',
    src: staticFile('remotion/broll/broll-03-cleanroom.mp4'), // Cleanroom Walk
    text: 'Controle Absoluto',
    subtext: 'Ambiente monitorado 24/7',
    duration: 90,
    animation: 'zoomOut'
  },
  {
    type: 'video',
    src: staticFile('remotion/assets/runway/sala-limpa-3-drone.mp4'), // AI Drone Flythrough 1
    text: 'Pureza em Cada Detalhe',
    subtext: 'Onde a precisão encontra a assepsia',
    duration: 150,
    animation: 'none'
  },
  {
    type: 'video',
    src: staticFile('remotion/assets/runway/sala-limpa-6-drone.mp4'), // AI Drone Flythrough 2
    text: 'Tecnologia que Salva Vidas',
    subtext: 'Compromisso com o paciente final',
    duration: 150,
    animation: 'none'
  },
  {
    type: 'text',
    bgSrc: staticFile('remotion/assets/images/sala_limpa_2_upscaled.png'), // No more blank background
    text: 'O que isso significa pro meu negócio?',
    subtext: '• Redução de riscos técnicos\n• Conformidade regulatória total\n• Qualidade superior comprovada',
    duration: 180,
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_gen_2.png'), // Final Shot
    text: 'Sua Produção Blindada',
    subtext: 'Nacionalize com segurança técnica',
    duration: 120,
    animation: 'zoomOut'
  }
];

// Shine Effect Component
const Shine: React.FC<{ delay: number; width: number }> = ({ delay, width }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shineProgress = interpolate(
    frame - delay,
    [0, fps * 0.8],
    [-200, width + 400],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: shineProgress,
        width: 250,
        height: "100%",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        transform: "skewX(-25deg)",
        pointerEvents: "none",
      }}
    />
  );
};

const Slide: React.FC<{ slide: typeof SLIDES[0] }> = ({ slide }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const scaleIn = spring({
    frame,
    fps,
    config: { damping: 200 }
  });

  const zoomInOut = slide.animation === 'zoomIn'
    ? interpolate(frame, [0, slide.duration], [1, 1.12], { extrapolateRight: 'clamp' })
    : slide.animation === 'zoomOut'
      ? interpolate(frame, [0, slide.duration], [1.12, 1], { extrapolateRight: 'clamp' })
      : 1;

  const fadeOpacity = interpolate(
    frame,
    [0, 15, slide.duration - 15, slide.duration],
    [0, 1, 1, 0]
  );

  if (slide.type === 'text') {
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fadeOpacity, overflow: 'hidden' }}>
        {/* Background Image with blur to avoid blank space */}
        <AbsoluteFill style={{ transform: 'scale(1.1)' }}>
          <Img src={slide.bgSrc} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(0.35)' }} />
        </AbsoluteFill>

        {/* Overlay Gradient */}
        <AbsoluteFill style={{ background: HERO_GRADIENT, opacity: 0.8 }} />
        <AbsoluteFill style={{
          background: "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 75%)",
        }} />

        <AbsoluteFill style={{
          justifyContent: 'center',
          padding: '100px',
          textAlign: 'center'
        }}>
          <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 0' }}>
            <h1 style={{
              color: 'white',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: '78px',
              margin: '0',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)',
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
            }}>
              {slide.text}
            </h1>
            <Shine delay={30} width={width} />
          </div>
          <div style={{
            color: BRAND.orange,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '44px',
            margin: '40px 0 0 0',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
            textShadow: '0 2px 10px rgba(0,0,0,0.4)',
            textAlign: 'left',
            width: '100%',
            maxWidth: '800px',
            marginInline: 'auto'
          }}>
            {slide.subtext}
          </div>
          <div style={{
            marginTop: 80,
            width: interpolate(frame, [25, 55], [0, 350], { extrapolateRight: 'clamp' }),
            height: 8,
            background: `linear-gradient(90deg, ${BRAND.orange}, ${BRAND.green})`,
            borderRadius: 4,
            marginInline: 'auto',
            boxShadow: `0 0 20px ${BRAND.orange}60`
          }} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <AbsoluteFill style={{ opacity: fadeOpacity, transform: `scale(${zoomInOut})` }}>
        {slide.type === 'image' ? (
          <Img src={slide.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Video src={slide.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop />
        )}
      </AbsoluteFill>

      {/* Cinematic Premium Overlay Gradient */}
      <AbsoluteFill style={{
        background: `linear-gradient(
            180deg,
            rgba(10, 22, 40, 0.1) 0%,
            rgba(10, 22, 40, 0.4) 40%,
            rgba(10, 22, 40, 0.85) 75%,
            rgba(10, 22, 40, 0.98) 100%
          )`,
        opacity: fadeOpacity
      }} />

      {/* Brand Accent Top Line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex" }}>
        <div style={{ flex: 1, background: BRAND.blue }} />
        <div style={{ flex: 1, background: BRAND.green }} />
        <div style={{ flex: 1, background: BRAND.orange }} />
      </div>

      {/* Text Elements */}
      <AbsoluteFill style={{
        justifyContent: 'flex-end',
        padding: '120px 80px',
        opacity: fadeOpacity,
        transform: `translateY(${interpolate(scaleIn, [0, 1], [50, 0])}px)`
      }}>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <h1 style={{
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: '72px',
            margin: '0 0 10px 0',
            textShadow: '0 5px 25px rgba(0,0,0,0.9)',
            letterSpacing: '-1px',
            lineHeight: 1.1
          }}>
            {slide.text}
          </h1>
          <Shine delay={25} width={width} />
        </div>
        <p style={{
          color: BRAND.cyan,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: '44px',
          margin: 0,
          textShadow: '0 2px 15px rgba(0,0,0,0.7)',
          letterSpacing: '-0.5px'
        }}>
          {slide.subtext}
        </p>

        {/* Swipe indicator with Orange highlight */}
        <div style={{
          marginTop: 35,
          height: 6,
          width: 150,
          background: `linear-gradient(90deg, ${BRAND.orange}, transparent)`,
          borderRadius: 3,
          boxShadow: `0 0 20px ${BRAND.orange}70`
        }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SalaLimpaTour: React.FC = () => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {SLIDES.map((slide, index) => {
        const from = currentFrame;
        currentFrame += slide.duration;
        return (
          <Sequence key={index} from={from} durationInFrames={slide.duration}>
            <Slide slide={slide} />
          </Sequence>
        );
      })}

      {/* Final Vignette */}
      <Sequence from={currentFrame} durationInFrames={VIGNETTE_DURATION}>
        <LifetrekVignette />
      </Sequence>
    </AbsoluteFill>
  );
};

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

// Extended duration to include all slides + B-rolls + Vignette
// 8 slides (4-6s each) + Vignette (7.5s)
// Total frames roughly 1300
export const SALA_LIMPA_DURATION_IN_FRAMES = 1245;
export const SALA_LIMPA_FPS = 30;
export const SALA_LIMPA_WIDTH = 1080;
export const SALA_LIMPA_HEIGHT = 1080;

const BLUE = "#004F8F";
const CYAN = "#00D1FF";

const SLIDES = [
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_gen_1.png'), // Exterior attractive hook
    text: 'Tour Sala Limpa ISO 7',
    subtext: 'Padrão de excelência Lifetrek Medical',
    duration: 120,
    animation: 'zoomIn'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_split_1.png'), // Split variation 1
    text: 'Ambiente Controlado',
    subtext: 'Segurança absoluta para dispositivos médicos',
    duration: 120,
    animation: 'zoomOut'
  },
  {
    type: 'video',
    src: staticFile('remotion/assets/runway/3b-cleanroom-entry.mp4'),
    text: 'Tolerância Zero',
    subtext: 'Controle rigoroso de partículas',
    duration: 120,
    animation: 'none'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_2_upscaled.png'), // 4K Upscale
    text: 'Pureza em Cada Detalhe',
    subtext: 'Classificação ISO 7 certificada',
    duration: 120,
    animation: 'zoomIn'
  },
  {
    type: 'text',
    text: 'Por que ISO 7?',
    subtext: '• Redução drástica de contaminação\n• Conformidade com FDA e ANVISA\n• Qualidade superior para implantes',
    duration: 180,
    bg: BLUE
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_3_upscaled.png'), // 4K Upscale
    text: 'Tecnologia que Salva Vidas',
    subtext: 'Onde a precisão encontra a assepsia',
    duration: 120,
    animation: 'zoomOut'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_split_3.png'), // Split variation 3
    text: 'Infraestrutura de Ponta',
    subtext: 'Monitoramento contínuo em tempo real',
    duration: 120,
    animation: 'zoomIn'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_6.png'),
    text: 'Sua Produção Blindada',
    subtext: 'Nacionalize com segurança técnica',
    duration: 120,
    animation: 'zoomOut'
  }
];

const Slide: React.FC<{ slide: typeof SLIDES[0] }> = ({ slide }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleIn = spring({
    frame,
    fps,
    config: { damping: 200 }
  });

  const zoomInOut = slide.animation === 'zoomIn'
    ? interpolate(frame, [0, slide.duration], [1, 1.15], { extrapolateRight: 'clamp' })
    : slide.animation === 'zoomOut'
      ? interpolate(frame, [0, slide.duration], [1.15, 1], { extrapolateRight: 'clamp' })
      : 1;

  const fadeOpacity = interpolate(
    frame,
    [0, 15, slide.duration - 15, slide.duration],
    [0, 1, 1, 0]
  );

  if (slide.type === 'text') {
    return (
      <AbsoluteFill style={{ backgroundColor: slide.bg, justifyContent: 'center', alignItems: 'center', opacity: fadeOpacity }}>
        <AbsoluteFill style={{
          justifyContent: 'center',
          padding: '80px',
          textAlign: 'center'
        }}>
          <h1 style={{
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: '85px',
            margin: '0 0 35px 0',
            textShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            {slide.text}
          </h1>
          <p style={{
            color: CYAN,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '44px',
            margin: 0,
            lineHeight: 1.5,
            whiteSpace: 'pre-line'
          }}>
            {slide.subtext}
          </p>
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

      {/* Overlay Gradient */}
      <AbsoluteFill style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 45%)',
        opacity: fadeOpacity
      }} />

      {/* Brand Accent Top Line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: CYAN, opacity: fadeOpacity }} />

      {/* Text Elements */}
      <AbsoluteFill style={{
        justifyContent: 'flex-end',
        padding: '80px 60px',
        opacity: fadeOpacity,
        transform: `translateY(${interpolate(scaleIn, [0, 1], [40, 0])}px)`
      }}>
        <h1 style={{
          color: 'white',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          fontSize: '68px',
          margin: '0 0 12px 0',
          textShadow: '0 4px 16px rgba(0,0,0,0.6)'
        }}>
          {slide.text}
        </h1>
        <p style={{
          color: CYAN,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: '38px',
          margin: 0,
          textShadow: '0 2px 10px rgba(0,0,0,0.6)'
        }}>
          {slide.subtext}
        </p>
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


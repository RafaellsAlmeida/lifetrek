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

export const SALA_LIMPA_DURATION_IN_FRAMES = 900; // 30 seconds @ 30fps
export const SALA_LIMPA_FPS = 30;
export const SALA_LIMPA_WIDTH = 1080;
export const SALA_LIMPA_HEIGHT = 1080;

// Slides configuration based on the LinkedIn Carousel strategy
// We will show images and Runway AI clips.
const SLIDES = [
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_1.png'),
    text: 'Tour Sala Limpa ISO 7',
    subtext: 'Padrão de excelência Lifetrek',
    duration: 120, // 4 seconds
    animation: 'zoomIn'
  },
  {
    type: 'video',
    src: staticFile('remotion/assets/runway/3b-cleanroom-entry.mp4'),
    text: 'Tolerância Zero',
    subtext: 'Controle de partículas em nível crítico',
    duration: 120,
    animation: 'none'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_2.png'),
    text: 'Ambiente Controlado',
    subtext: 'Segurança em cada etapa',
    duration: 120,
    animation: 'zoomOut'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_3.png'),
    text: 'Fluxo Otimizado',
    subtext: 'Foco na pureza',
    duration: 120,
    animation: 'zoomIn'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_4.jpg'),
    text: 'Tecnologia de Ponta',
    subtext: 'Padrões regulatórios globais',
    duration: 120,
    animation: 'zoomOut'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_5.png'),
    text: 'Excelência do Produto Final',
    subtext: 'Garantida pelo ambiente de fabricação',
    duration: 120,
    animation: 'zoomIn'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_6.png'),
    text: 'Eleve o Padrão',
    subtext: 'Fale com nossa equipe de engenharia',
    duration: 120,
    animation: 'zoomOut'
  },
  {
    type: 'image',
    src: staticFile('remotion/assets/images/sala_limpa_7.png'),
    text: 'Lifetrek Medical',
    subtext: 'Inovação que pulsa',
    duration: 60,
    animation: 'zoomIn'
  }
];

const Slide: React.FC<{ slide: typeof SLIDES[0] }> = ({ slide }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
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
        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)',
        opacity: fadeOpacity
      }} />

      {/* Text Elements */}
      <AbsoluteFill style={{ 
        justifyContent: 'flex-end', 
        padding: '80px 60px',
        opacity: fadeOpacity,
        transform: `translateY(${interpolate(scaleIn, [0, 1], [50, 0])}px)`
      }}>
        <h1 style={{ 
          color: 'white', 
          fontFamily: 'Inter, sans-serif', 
          fontWeight: 800, 
          fontSize: '64px',
          margin: '0 0 16px 0',
          textShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          {slide.text}
        </h1>
        <p style={{ 
          color: '#00D1FF', // Lifetrek cyan accent
          fontFamily: 'Inter, sans-serif', 
          fontWeight: 500, 
          fontSize: '36px',
          margin: 0,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)'
        }}>
          {slide.subtext}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SalaLimpaTour: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
      {SLIDES.map((slide, index) => {
        const startFrame = SLIDES.slice(0, index).reduce((acc, s) => acc + s.duration, 0);
        return (
          <Sequence key={index} from={startFrame} durationInFrames={slide.duration}>
            <Slide slide={slide} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

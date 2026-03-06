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

export const SWISS_TURNING_DURATION_IN_FRAMES = 720; // 24 seconds @ 30fps
export const SWISS_TURNING_FPS = 30;
export const SWISS_TURNING_WIDTH = 1080;
export const SWISS_TURNING_HEIGHT = 1080;

// Slides configuration based on the LinkedIn Carousel strategy
// We will show images and Runway AI clips.
const SLIDES = [
    {
        type: 'video',
        src: staticFile('remotion/assets/runway/4a-cnc-internal.mp4'),
        text: 'Swiss Turning na Prática',
        subtext: 'A arte da micro-precisão',
        duration: 120, // 4 seconds
        animation: 'none'
    },
    {
        type: 'image',
        src: staticFile('remotion/assets/images/swiss_ferramenta_sextavada.png'),
        text: 'Tolerância Zero',
        subtext: 'O menor desvio compromete a cirurgia',
        duration: 120,
        animation: 'zoomIn'
    },
    {
        type: 'image',
        src: staticFile('remotion/assets/images/swiss_citizen_l20x_cool_blaster.png'),
        text: 'Citizen L20X / M32',
        subtext: 'Geometria complexa em escala microscópica',
        duration: 120,
        animation: 'zoomOut'
    },
    {
        type: 'video',
        src: staticFile('remotion/assets/runway/4b-metal-shavings.mp4'),
        text: 'Inspeção e Metrologia',
        subtext: 'Validando cada mícron',
        duration: 120,
        animation: 'none'
    },
    {
        type: 'image',
        src: staticFile('remotion/assets/images/swiss_instrumentos_cirurgia.png'),
        text: 'Fabricação em Indaiatuba',
        subtext: '30 dias de previsibilidade local',
        duration: 120,
        animation: 'zoomIn'
    },
    {
        type: 'image',
        src: staticFile('remotion/assets/images/swiss_implante_espinhal.png'),
        text: 'Reduza o Risco',
        subtext: 'Agende uma visita técnica à Lifetrek',
        duration: 120,
        animation: 'zoomOut'
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

export const SwissTurningTour: React.FC = () => {
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

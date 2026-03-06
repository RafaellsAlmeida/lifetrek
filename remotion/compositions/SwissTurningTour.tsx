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

// Total duration: 6 slides (4s each) + 1 text slide (5s) + Vignette (7.5s)
// 6*120 + 150 + 225 = 720 + 150 + 225 = 1095 frames
export const SWISS_TURNING_DURATION_IN_FRAMES = 1095;
export const SWISS_TURNING_FPS = 30;
export const SWISS_TURNING_WIDTH = 1080;
export const SWISS_TURNING_HEIGHT = 1080;

const BLUE = "#004F8F";
const CYAN = "#00D1FF";

// Slides configuration based on the LinkedIn Carousel strategy + new refinements
const SLIDES = [
    {
        type: 'image',
        src: staticFile('remotion/assets/images/sala_limpa_gen_1.png'),
        text: 'Swiss Turning na Prática',
        subtext: 'A arte da micro-precisão médica',
        duration: 120, // 4 seconds
        animation: 'zoomIn'
    },
    {
        type: 'video',
        src: staticFile('remotion/assets/runway/4a-cnc-internal.mp4'),
        text: 'Micro-Precisão Extrema',
        subtext: 'Detalhes menores que um fio de cabelo',
        duration: 120,
        animation: 'none'
    },
    {
        type: 'image',
        src: staticFile('remotion/assets/images/swiss_citizen_l20x_cool_blaster_upscaled.png'),
        text: 'Citizen L20X / M32',
        subtext: 'Estabilidade absoluta em 4K HD',
        duration: 120,
        animation: 'zoomOut'
    },
    {
        type: 'text',
        text: 'Nacionalize sua Produção',
        subtext: '• Lead time: 30 vs 90+ dias\n• Sem risco cambial\n• Logística simplificada',
        duration: 180, // 6 seconds for reading
        bg: BLUE
    },
    {
        type: 'image',
        src: staticFile('remotion/assets/images/swiss_instrumentos_cirurgia_upscaled.png'),
        text: 'Sistemas de Fixação',
        subtext: 'Qualidade validada mícron por mícron',
        duration: 120,
        animation: 'zoomIn'
    },
    {
        type: 'video',
        src: staticFile('remotion/assets/runway/4b-metal-shavings.mp4'),
        text: 'Tolerância Zero',
        subtext: 'Compromisso Lifetrek com a vida',
        duration: 120,
        animation: 'none'
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
                        fontSize: '80px',
                        margin: '0 0 30px 0',
                        textShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                        {slide.text}
                    </h1>
                    <p style={{
                        color: CYAN,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 600,
                        fontSize: '42px',
                        margin: 0,
                        lineHeight: 1.4,
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

            {/* Accent lines (Top only) */}
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

export const SwissTurningTour: React.FC = () => {
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


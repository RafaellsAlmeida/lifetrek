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

// Total duration: 1125 frames (37.5s @ 30fps)
export const SWISS_TURNING_DURATION_IN_FRAMES = 1125;
export const SWISS_TURNING_FPS = 30;
export const SWISS_TURNING_WIDTH = 1080;
export const SWISS_TURNING_HEIGHT = 1080;

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
        src: staticFile('remotion/broll/broll-01-drone-rise.mp4'), // Drone Rise Hook
        text: 'Swiss Turning de Alta Precisão',
        subtext: 'Excelência em micro-usinagem médica',
        duration: 120,
        animation: 'zoomIn'
    },
    {
        type: 'image',
        src: staticFile('remotion/assets/images/swiss_citizen_l20x_cool_blaster_upscaled.png'),
        text: 'Frotas Citizen L20X e M32',
        subtext: 'Padrão ouro em estabilidade e repetibilidade',
        duration: 120,
        animation: 'zoomOut'
    },
    {
        type: 'video',
        src: staticFile('remotion/assets/runway/4a-cnc-internal.mp4'), // CNC Action
        text: 'Tolerâncias de Micron',
        subtext: 'Precisão extrema para dispositivos críticos',
        duration: 120,
        animation: 'none'
    },
    {
        type: 'image',
        src: staticFile('remotion/assets/images/swiss_implante_espinhal.png'), // REAL complex part
        text: 'Geometrias Complexas',
        subtext: 'Soluções customizadas em titânio e aço inox',
        duration: 120,
        animation: 'zoomIn'
    },
    {
        type: 'image',
        src: staticFile('remotion/assets/images/swiss_instrumentos_cirurgia_upscaled.png'),
        text: 'Saúde em Primeiro Lugar',
        subtext: 'Componentes validados para implantes e cirurgias',
        duration: 120,
        animation: 'zoomOut'
    },
    {
        type: 'text',
        variant: 'white',
        text: 'Vantagens da Nacionalização',
        subtext: '• Redução de Lead Time: 30 vs 90+ dias\n• Eliminação de riscos cambiais\n• Auditoria técnica simplificada',
        duration: 180,
    },
    {
        type: 'video',
        src: staticFile('remotion/broll/broll-05-metrology.mp4'), // High-end inspection
        text: 'Sua Produção Blindada',
        subtext: 'Aumente sua previsibilidade de estoque',
        duration: 120,
        animation: 'none'
    }
];

// Shine Effect Component
const Shine: React.FC<{ delay: number; width: number; color?: string }> = ({ delay, width, color = "rgba(255,255,255,0.25)" }) => {
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
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                transform: "skewX(-25deg)",
                pointerEvents: "none",
            }}
        />
    );
};

const Slide: React.FC<{ slide: any }> = ({ slide }) => {
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
        const isWhite = slide.variant === 'white';
        return (
            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fadeOpacity, overflow: 'hidden', backgroundColor: isWhite ? BRAND.white : 'transparent' }}>
                {!isWhite && (
                    <>
                        <AbsoluteFill style={{ transform: 'scale(1.1)' }}>
                            <Img src={slide.bgSrc} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(0.3)' }} />
                        </AbsoluteFill>
                        <AbsoluteFill style={{ background: HERO_GRADIENT, opacity: 0.85 }} />
                    </>
                )}

                {isWhite && (
                    <AbsoluteFill style={{
                        background: "radial-gradient(circle at 30% 30%, rgba(26, 122, 62, 0.05) 0%, transparent 70%), radial-gradient(circle at 70% 70%, rgba(240, 120, 24, 0.05) 0%, transparent 70%)",
                    }} />
                )}

                <AbsoluteFill style={{
                    background: isWhite ? "transparent" : "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 75%)",
                }} />

                <AbsoluteFill style={{
                    justifyContent: 'center',
                    padding: '100px',
                    textAlign: 'center'
                }}>
                    <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 0' }}>
                        <h1 style={{
                            color: isWhite ? BRAND.blue : BRAND.white,
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 900,
                            fontSize: '78px',
                            margin: '0',
                            textShadow: isWhite ? 'none' : '0 10px 30px rgba(0,0,0,0.5)',
                            letterSpacing: '-1.5px',
                            lineHeight: 1.1,
                        }}>
                            {slide.text}
                        </h1>
                        <Shine delay={30} width={width} color={isWhite ? "rgba(0, 79, 143, 0.1)" : undefined} />
                    </div>
                    <div style={{
                        color: isWhite ? BRAND.green : BRAND.orange,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 700,
                        fontSize: '44px',
                        margin: '40px 0 0 0',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                        textShadow: isWhite ? 'none' : '0 2px 10px rgba(0,0,0,0.4)',
                        textAlign: 'left',
                        width: '100%',
                        maxWidth: '850px',
                        marginInline: 'auto'
                    }}>
                        {slide.subtext.split('\n').map((line: string, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <span style={{ color: isWhite ? (i % 2 === 0 ? BRAND.green : BRAND.orange) : BRAND.orange, marginRight: '15px' }}>
                                    {line.startsWith('•') ? '•' : ''}
                                </span>
                                <span style={{ color: isWhite ? BRAND.blue : undefined }}>{line.replace('• ', '')}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        marginTop: 80,
                        width: interpolate(frame, [25, 55], [0, 450], { extrapolateRight: 'clamp' }),
                        height: 8,
                        background: `linear-gradient(90deg, ${BRAND.blue}, ${BRAND.green}, ${BRAND.orange}, ${BRAND.cyan})`,
                        borderRadius: 4,
                        marginInline: 'auto',
                        boxShadow: isWhite ? `0 4px 15px rgba(0,0,0,0.1)` : `0 0 20px ${BRAND.orange}60`
                    }} />
                </AbsoluteFill>

                {/* Brand Accent Top Line for white variant */}
                {isWhite && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex" }}>
                        <div style={{ flex: 1, background: BRAND.blue }} />
                        <div style={{ flex: 1, background: BRAND.green }} />
                        <div style={{ flex: 1, background: BRAND.orange }} />
                        <div style={{ flex: 1, background: BRAND.cyan }} />
                    </div>
                )}
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

            <AbsoluteFill style={{
                background: `linear-gradient(
            180deg,
            rgba(10, 22, 40, 0.1) 0%,
            rgba(10, 22, 40, 0.45) 45%,
            rgba(10, 22, 40, 0.9) 80%,
            rgba(10, 22, 40, 1.0) 100%
          )`,
                opacity: fadeOpacity
            }} />

            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex" }}>
                <div style={{ flex: 1, background: BRAND.blue }} />
                <div style={{ flex: 1, background: BRAND.green }} />
                <div style={{ flex: 1, background: BRAND.orange }} />
            </div>

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

            <Sequence from={currentFrame} durationInFrames={VIGNETTE_DURATION}>
                <LifetrekVignette />
            </Sequence>
        </AbsoluteFill>
    );
};

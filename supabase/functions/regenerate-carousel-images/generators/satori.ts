/**
 * Satori Image Generator
 * 
 * Renders pixel-perfect text overlays and badges using Satori + Resvg.
 * 
 * @module generators/satori
 */

import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { BRAND_COLORS } from "../prompts/brand-prompt.ts";
import type { SlideData } from "../types.ts";

// Initialize WASM (required for Edge runtime)
// We need to fetch the WASM binary or use a CDN that bundles it.
// esm.sh bundles it, but we might need to initialize it explicitly.
// For simplicity in this environment, we'll try standard initialization.

declare const Deno: any;

/**
 * Load font buffer
 */
async function loadFont() {
    // Using Inter from Google Fonts CDN
    const response = await fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff");
    return await response.arrayBuffer();
}

/**
 * Load font buffer (Inter Bold)
 */
async function loadFontBold() {
    const response = await fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff");
    return await response.arrayBuffer();
}

/**
 * Generate composite image with Satori
 * 
 * @param slide - Slide data
 * @param backgroundUrl - URL of the AI-generated background
 * @param width - Width of the image
 * @param height - Height of the image
 */
export async function generateOverlay(
    slide: SlideData,
    backgroundUrl: string,
    width: number = 1080,
    height: number = 1440 // 3:4 aspect ratio default
): Promise<Uint8Array> {
    // Load fonts
    const fontRegular = await loadFont();
    const fontBold = await loadFontBold();

    // Define Colors
    const { primaryBlue, innovationGreen, white, lightGray } = BRAND_COLORS;

    // Render SVG with Satori
    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${backgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    justifyContent: 'center',
                    alignItems: 'flex-start', // Left aligned
                    position: 'relative',
                },
                children: [
                    // Glassmorphism Card
                    {
                        type: 'div',
                        props: {
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                width: '65%', // Covers 65% width
                                backgroundColor: 'rgba(10, 22, 40, 0.75)', // Dark blue at 75%
                                borderRadius: '20px',
                                padding: '40px',
                                marginLeft: '40px', // Left margin
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                                backdropFilter: 'blur(12px)',
                            },
                            children: [
                                // Category Label
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontFamily: 'Inter',
                                            fontWeight: 700,
                                            fontSize: '18px',
                                            color: innovationGreen,
                                            marginBottom: '16px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        },
                                        children: slide.type === 'hook' ? 'DESTAQUE' : slide.type === 'cta' ? 'PRÓXIMO PASSO' : 'INSIGHT',
                                    },
                                },
                                // Headline
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontFamily: 'Inter',
                                            fontWeight: 800,
                                            fontSize: '48px',
                                            color: white,
                                            marginBottom: '24px',
                                            lineHeight: '1.1',
                                        },
                                        children: slide.headline,
                                    },
                                },
                                // Body Text
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            fontFamily: 'Inter',
                                            fontWeight: 400,
                                            fontSize: '24px',
                                            color: lightGray,
                                            lineHeight: '1.4',
                                        },
                                        children: slide.body,
                                    },
                                },
                                // CTA Pill (if last slide)
                                (slide.type === 'cta' || slide.showISOBadge) ? {
                                    type: 'div',
                                    props: {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginTop: '32px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            padding: '12px 24px',
                                            borderRadius: '50px',
                                        },
                                        children: [
                                            {
                                                type: 'span',
                                                props: {
                                                    style: {
                                                        color: innovationGreen,
                                                        fontSize: '24px',
                                                        marginRight: '12px',
                                                    },
                                                    children: '✓',
                                                }
                                            },
                                            {
                                                type: 'span',
                                                props: {
                                                    style: {
                                                        fontFamily: 'Inter',
                                                        fontSize: '20px',
                                                        color: white,
                                                    },
                                                    children: 'Biocompatibilidade garantida', // Or dynamic CTA text
                                                }
                                            }
                                        ]
                                    }
                                } : null,
                            ],
                        },
                    },
                    // Logo (Top Right)
                    slide.showLogo && slide.logoUrl ? {
                        type: 'img',
                        props: {
                            src: slide.logoUrl,
                            style: {
                                position: 'absolute',
                                top: '40px',
                                right: '40px',
                                width: '120px',
                                height: 'auto',
                                objectFit: 'contain',
                            },
                        },
                    } : null,
                    // ISO Badge (Bottom Right)
                    slide.showISOBadge && slide.isoUrl ? {
                        type: 'img',
                        props: {
                            src: slide.isoUrl,
                            style: {
                                position: 'absolute',
                                bottom: '40px',
                                right: '40px',
                                width: '100px', // Standard size for badge
                                height: 'auto',
                                objectFit: 'contain',
                                backgroundColor: 'white', // Ensure badge pop
                                borderRadius: '8px',
                                padding: '4px',
                            },
                        },
                    } : null,
                ].filter(Boolean) as any,
            },
        },
        {
            width,
            height,
            fonts: [
                {
                    name: 'Inter',
                    data: fontRegular,
                    weight: 400,
                    style: 'normal',
                },
                {
                    name: 'Inter',
                    data: fontBold,
                    weight: 800,
                    style: 'normal',
                },
            ],
        }
    );

    // Initialize Resvg
    await initWasm(fetch("https://esm.sh/@resvg/resvg-wasm@2.6.0/index_bg.wasm"));

    // Render to PNG
    const resvg = new Resvg(svg, {
        fitTo: {
            mode: 'width',
            value: width,
        },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return pngBuffer;
}

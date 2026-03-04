/**
 * Satori Text Overlay Generator
 * 
 * Renders pixel-perfect text overlays and badges using Satori + Resvg.
 * Outputs a transparent PNG overlay that can be composited onto a background.
 * 
 * NOTE: We intentionally do NOT include background images in Satori's VDOM.
 * Satori fetches images internally and can stack-overflow on large images.
 * Instead, the background is handled separately in the hybrid workflow.
 * 
 * @module generators/satori
 */

import satori from "https://esm.sh/satori@0.10.13";
import { initWasm, Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.6.0";
import { BRAND_COLORS } from "../prompts/brand-prompt.ts";
import type { SlideData } from "../types.ts";

declare const Deno: any;

let wasmInitialized = false;

/**
 * Load font buffer (Inter Regular)
 */
async function loadFont() {
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
 * Generate a TEXT-ONLY overlay as a PNG buffer.
 * 
 * Renders the glassmorphism card and text ON TOP of the AI-generated background.
 * The backgroundUrl should be an optimized/resized image (e.g., 720x900 quality 60)
 * to avoid stack overflow — Satori fetches images internally.
 * Falls back to dark blue gradient if no backgroundUrl provided.
 * 
 * @param slide - Slide data
 * @param backgroundUrl - URL of the AI-generated background (used as CSS backgroundImage)
 * @param width - Width of the image
 * @param height - Height of the image
 */
export async function generateOverlay(
    slide: SlideData,
    backgroundUrl: string,
    width: number = 1080,
    height: number = 1440
): Promise<Uint8Array> {
    // Load fonts
    const fontRegular = await loadFont();
    const fontBold = await loadFontBold();

    // Define Colors
    const { primaryBlue, innovationGreen, white, lightGray } = BRAND_COLORS;

    // Build children array (no background image to avoid stack overflow)
    const cardChildren: any[] = [
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
    ];

    // CTA Pill (if applicable)
    if (slide.type === 'cta' || slide.showISOBadge) {
        cardChildren.push({
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
                            children: 'Biocompatibilidade garantida',
                        }
                    }
                ]
            }
        });
    }

    // Glassmorphism card (text content)
    const cardNode = {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                width: '65%',
                backgroundColor: 'rgba(8, 18, 35, 0.80)',
                borderRadius: '20px',
                padding: '40px',
                marginLeft: '40px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
            },
            children: cardChildren,
        },
    };

    // NOTE: Logo and ISO badge images are intentionally excluded from Satori.
    // Satori's image fetching can cause stack overflow on large/remote images.

    // When using a real photo background, wrap content in a blue-tint overlay layer
    // (nested flex div avoids position:absolute compatibility issues in Satori)
    const contentWrapper = backgroundUrl
        ? {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 20, 65, 0.58)',
                },
                children: [cardNode],
            },
        }
        : cardNode;

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
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    backgroundColor: BRAND_COLORS.darkBlueStart,
                    backgroundImage: backgroundUrl
                        ? `url(${backgroundUrl})`
                        : `linear-gradient(135deg, ${BRAND_COLORS.darkBlueStart}, ${BRAND_COLORS.darkBlueEnd})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                },
                children: [contentWrapper],
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

    // Initialize Resvg WASM (only once per Edge Function invocation)
    if (!wasmInitialized) {
        try {
            await initWasm(fetch("https://esm.sh/@resvg/resvg-wasm@2.6.0/index_bg.wasm"));
            wasmInitialized = true;
        } catch (e) {
            // Already initialized in this isolate
            if (!String(e).includes('Already initialized')) {
                throw e;
            }
            wasmInitialized = true;
        }
    }

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

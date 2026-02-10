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

import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
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
 * This renders the glassmorphism card, text, and badges WITHOUT any background image.
 * The background is a solid dark blue fallback.
 * The hybrid workflow will use this as the final image when compositing isn't available,
 * or the AI-generated background when Satori overlay fails.
 * 
 * @param slide - Slide data
 * @param backgroundUrl - URL of the AI-generated background (used as CSS bg, NOT as <img>)
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

    // Build root children
    const rootChildren: any[] = [
        // Glassmorphism Card (no background image - just the card overlay)
        {
            type: 'div',
            props: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: '65%',
                    backgroundColor: 'rgba(10, 22, 40, 0.75)',
                    borderRadius: '20px',
                    padding: '40px',
                    marginLeft: '40px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                },
                children: cardChildren,
            },
        },
    ];

    // NOTE: Logo and ISO badge images are intentionally excluded.
    // Satori's image fetching can cause stack overflow on large/remote images.
    // These will be added in a future iteration using a different compositing approach.

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
                    position: 'relative',
                    // Use a dark gradient background as fallback
                    // (since we can't use the AI background in Satori)
                    backgroundImage: `linear-gradient(135deg, ${BRAND_COLORS.darkBlueStart}, ${BRAND_COLORS.darkBlueEnd})`,
                },
                children: rootChildren,
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

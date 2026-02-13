/**
 * Lifetrek Brand-Compliant Prompt Builder
 * 
 * Builds detailed prompts for AI image generation that follow
 * Lifetrek Medical brand guidelines.
 * 
 * @module prompts/brand-prompt
 */

import type { SlideData, PlatformConfig } from "../types.ts";

/**
 * Lifetrek brand colors - must be used exactly as specified
 */
export const BRAND_COLORS = {
    primaryBlue: "#004F8F",       // Corporate, trust
    darkBlueStart: "#0A1628",     // Gradient backgrounds
    darkBlueEnd: "#003052",       // Gradient backgrounds
    innovationGreen: "#1A7A3E",   // Accents, success
    energyOrange: "#F07818",      // CTAs, highlights
    white: "#FFFFFF",             // Text on dark
    lightGray: "#E0E0E0"          // Body text
} as const;

/**
 * Build a brand-compliant prompt for AI image generation
 * 
 * @param slide - Slide data with headline and body
 * @param slideNum - Current slide number (1-indexed)
 * @param totalSlides - Total number of slides
 * @param platform - Platform configuration
 * @param styleReference - Style templates from pgvector
 * @returns Complete prompt string
 */
export function buildBrandPrompt(
    slide: SlideData,
    slideNum: number,
    totalSlides: number,
    platform: PlatformConfig,
    styleReference: string = ""
): string {
    const isFirst = slideNum === 1;
    const isLast = slideNum === totalSlides;

    // Build platform-specific instructions
    let specificInstructions = "";

    if (platform.isBlog) {
        specificInstructions = buildBlogCoverInstructions(slide);
    } else if (platform.isResource) {
        specificInstructions = buildResourceMockupInstructions(slide);
    } else {
        specificInstructions = buildCarouselSlideInstructions(slide, isFirst, isLast, slideNum, totalSlides);
    }

    // Combine all prompt sections
    return `Create a professional ${platform.platformName} image for Lifetrek Medical.

=== BRAND IDENTITY ===
Company: Lifetrek Medical - Medical device contract manufacturer
Industry: Orthopedic implants, dental implants, CNC precision machining
Location: Indaiatuba, São Paulo, Brazil
Certifications: ISO 13485, ANVISA registered

=== BRAND COLORS (MUST USE) ===
Primary Blue: ${BRAND_COLORS.primaryBlue} (corporate, trust)
Dark Blue Gradient: ${BRAND_COLORS.darkBlueStart} → ${BRAND_COLORS.darkBlueEnd} (backgrounds)
Innovation Green: ${BRAND_COLORS.innovationGreen} (accents, success indicators)
Energy Orange: ${BRAND_COLORS.energyOrange} (CTAs, highlights)
White text on dark backgrounds for maximum readability

=== VISUAL STYLE ===
- Premium glassmorphism effects with subtle transparency
- Editorial magazine quality, clean and sophisticated
- High-tech medical manufacturing aesthetic
- Photorealistic CNC machines, cleanrooms, precision parts
- Professional studio lighting with soft shadows

=== STYLE TEMPLATES (Follow these proven styles) ===
${styleReference || 'Use premium glassmorphism card design with dark blue backgrounds'}

${specificInstructions}

=== CRITICAL RULES ===
1. USE Lifetrek brand colors exactly as specified
2. Professional, technical aesthetic - not generic stock photo look
3. Show REAL medical manufacturing context (not abstract graphics)
4. RENDER TEXT with high legibility - Inter font, large size, high contrast
5. GLASSMORPHISM CARD must have proper blur and transparency
6. Clean, sharp focus on both text and background imagery.`;
}

/**
 * Build instructions for blog cover images
 */
function buildBlogCoverInstructions(slide: SlideData): string {
    return `=== BLOG COVER STYLE ===
- Format: Landscape 16:9 cinematic
- Subject: Abstract representation of "${slide.headline}" in a medical manufacturing context
- Style: Editorial magazine photography, dramatic lighting, depth of field
- NO TEXT on image (it will be added by HTML overlay)`;
}

/**
 * Build instructions for resource/document mockups
 */
function buildResourceMockupInstructions(slide: SlideData): string {
    return `=== RESOURCE MOCKUP STYLE ===
- Format: Vertical/A4 document visualization
- Subject: A 3D mockup of a high-quality printed guide/manual titled "${slide.headline}" sitting on a clean white/metallic surface
- The "book" or "document" should look premium, thick paper, professional binding
- Surroundings: Clean, minimal studio, maybe a pen or caliper nearby for scale
- NO TEXT on the background (the book cover itself can have abstract lines)`;
}

/**
 * Build instructions for carousel slides with integrated text
 */
function buildCarouselSlideInstructions(
    slide: SlideData,
    isFirst: boolean,
    isLast: boolean,
    slideNum: number,
    totalSlides: number
): string {
    // Determine category label based on slide type
    const categoryLabel = slide.type === 'hook'
        ? 'DESTAQUE'
        : slide.type === 'cta'
            ? 'PRÓXIMO PASSO'
            : 'INSIGHT';

    return `=== SLIDE CONTENT ===
Headline: "${slide.headline}"
Body Text: "${slide.body}"
Slide Type: ${slide.type} (${isFirst ? "FIRST/HOOK - grab attention" : isLast ? "LAST/CTA - call to action" : "CONTENT - inform and educate"})
Position: Slide ${slideNum} of ${totalSlides}

=== HYBRID-COMPOSITE DESIGN (CRITICAL) ===
Create a polished LinkedIn carousel slide with TEXT INTEGRATED into the image.

**GLASSMORPHISM TEXT CARD:**
- Place a semi-transparent dark blue card (#0A1628 at 75% opacity) with rounded corners (20px border-radius)
- Apply subtle backdrop blur effect to the card
- Position the card on the LEFT side of the image, covering about 60% width
- Card should be vertically centered with comfortable padding (40px)

**TEXT LAYOUT INSIDE THE CARD:**
1. CATEGORY LABEL: "${categoryLabel}" 
   - Font: Inter Bold, UPPERCASE, 16px
   - Color: Innovation Green (${BRAND_COLORS.innovationGreen})
   - Position: Top of card content

2. HEADLINE: "${slide.headline}"
   - Font: Inter Bold, 48-54px
   - Color: Pure White (#FFFFFF)
   - Line height: 1.2
   - Maximum 2-3 lines

3. BODY TEXT: "${slide.body}"
   - Font: Inter Regular, 22-24px  
   - Color: Light Gray (#E0E0E0)
   - Maximum 3-4 lines

${isLast ? `4. CALL-TO-ACTION PILL:
   - "Biocompatibilidade garantida" or similar
   - Green checkmark icon + text
   - Semi-transparent background` : ''}

=== BACKGROUND ===
- Right side: High-quality medical manufacturing imagery (CNC machines, cleanroom, titanium parts, surgical instruments)
- Subtle blur on background to make text card stand out
- Professional studio lighting with soft shadows
${isFirst || isLast ? "- Reserve space in top-right corner for company logo overlay (Lifetrek logo)" : ""}
${isLast ? "- Badge space in bottom area for ISO 13485 certification" : ""}`;
}

/**
 * Get platform configuration from table name
 */
export function getPlatformConfig(tableName: string): PlatformConfig {
    const isInstagram = tableName === 'instagram_posts';
    const isBlog = tableName === 'blog_posts';
    const isResource = tableName === 'content_templates' || tableName === 'product_catalog';

    let aspectRatio = "3:4"; // Default LinkedIn
    let platformName = "LinkedIn";

    if (isInstagram) {
        aspectRatio = "4:5";
        platformName = "Instagram";
    } else if (isBlog) {
        aspectRatio = "16:9";
        platformName = "Blog Cover";
    } else if (isResource) {
        aspectRatio = "210:297"; // A4-ish
        platformName = "Resource Cover";
    }
    return {
        aspectRatio,
        platformName,
        isInstagram,
        isBlog,
        isResource
    };
}

/**
 * Build a background-only prompt for Hybrid mode
 * 
 * Removes strict instructions about text placement/cards, focusing
 * on the visual scene for Satori overlays.
 */
export function buildBackgroundPrompt(
    slide: SlideData,
    slideNum: number,
    totalSlides: number,
    platform: PlatformConfig,
    styleReference: string = ""
): string {
    const basePrompt = buildBrandPrompt(slide, slideNum, totalSlides, platform, styleReference);

    // Modify the prompt to emphasize "clean background" and "no text"
    let finalPrompt = basePrompt
        .replace("Create a polished LinkedIn carousel slide with TEXT INTEGRATED into the image.", "Create a high-quality background image for a LinkedIn carousel pivot.")
        .replace(/=== HYBRID-COMPOSITE DESIGN \(CRITICAL\) ===[\s\S]*?=== BACKGROUND ===/, "=== BACKGROUND (NO TEXT/LOGOS) ===") // Remove composite instructions
        // Avoid prompting the model to literally render "Logo"/badges as text.
        .replace(/- Reserve space in top-right corner[^\n]*\n/g, "")
        .replace(/- Badge space in bottom area[^\n]*\n/g, "")
        .concat(`\n\n=== SPECIAL HYBRID INSTRUCTION ===
        - DO NOT generate any text, headlines, or logos.
        - DO NOT generate badges.
        - This image will have a glassmorphism card overlaid programmatically.
        - Ensure the LEFT 60% of the image has interesting texture but isn't too busy (where text will go).
        - Focus heavily on the lighting, depth, and medical manufacturing context.
        - Clean, high-res photography style.`);

    // Incorporate Designer agent's art direction if available
    if (slide.art_direction) {
        const ad = slide.art_direction;
        const artDirectionBlock = [
            `\n\n=== ART DIRECTION (FROM CREATIVE TEAM) ===`,
            ad.visual_concept ? `Visual Concept: ${ad.visual_concept}` : '',
            ad.mood ? `Mood: ${ad.mood}` : '',
            ad.composition ? `Composition: ${ad.composition}` : '',
            ad.color_emphasis ? `Color Emphasis: ${ad.color_emphasis}` : '',
            ad.background_elements ? `Background Elements: ${ad.background_elements}` : '',
            `\nFollow this art direction closely while maintaining the brand identity.`,
        ].filter(Boolean).join('\n');
        finalPrompt += artDirectionBlock;
    }

    return finalPrompt;
}

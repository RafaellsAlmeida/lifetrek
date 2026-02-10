/**
 * Type definitions for regenerate-carousel-images Edge Function
 * 
 * @module types
 */

/**
 * Slide data structure for carousel content
 */
export interface SlideData {
    /** Main heading text for the slide */
    headline: string;
    /** Body/description text */
    body: string;
    /** Slide type: 'hook', 'content', 'cta' */
    type: 'hook' | 'content' | 'cta' | 'cover';
    /** Generated image URL (Supabase Storage) */
    imageUrl?: string;
    /** Alternative image URL field */
    image_url?: string;
    /** Whether to show company logo overlay */
    showLogo?: boolean;
    /** Whether to show ISO 13485 badge */
    showISOBadge?: boolean;
    /** Logo position: 'top-right', 'bottom-left', etc */
    logoPosition?: string;
    /** URL to logo asset */
    logoUrl?: string;
    /** URL to ISO badge asset */
    isoUrl?: string;
}

/**
 * Reference image for brand consistency in AI generation
 */
export interface ReferenceImage {
    /** MIME type: 'image/png', 'image/jpeg', etc */
    mimeType: string;
    /** Base64 encoded image data */
    data: string;
    /** Purpose/category: 'facility', 'equipment', 'product' */
    purpose: string;
}

/**
 * Style template from style_embeddings table
 */
export interface StyleTemplate {
    template_name: string;
    style_type: 'glassmorphism' | 'editorial' | 'programmatic';
    description: string;
    prompt_used?: string;
}

/**
 * Company asset from product_catalog
 */
export interface CompanyAsset {
    type: string;
    url: string;
    name: string;
    description: string;
}

/**
 * Carousel/Post from database
 */
export interface CarouselData {
    id: string;
    topic?: string;
    title?: string;
    excerpt?: string;
    description?: string;
    slides?: SlideData[];
    image_urls?: string[];
    cover_image?: string;
    image_url?: string;
}

/**
 * Request body for regeneration
 */
export interface RegenerateRequest {
    carousel_id: string;
    batch_mode?: boolean;
    table_name?: string;
    slide_index?: number;
}

/**
 * Response from regeneration
 */
export interface RegenerateResponse {
    success: boolean;
    carousel_id?: string;
    slides_regenerated?: number;
    images_generated?: number;
    reference_images_used?: number;
    duration_ms?: number;
    logs?: string[];
    error?: string;
    stack?: string;
}

/**
 * Platform configuration
 */
export interface PlatformConfig {
    aspectRatio: string;
    platformName: string;
    isInstagram: boolean;
    isBlog: boolean;
    isResource: boolean;
}

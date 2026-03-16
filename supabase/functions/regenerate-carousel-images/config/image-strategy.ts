/**
 * Image Strategy Configuration
 *
 * Defines rules for how images are generated based on post type / format.
 * Prevents "frankensteining" (compositing multiple unrelated images on a single slide)
 * by enforcing a single image source per slide.
 *
 * Rules:
 * - single-image posts → 1 AI-generated image (clean, no Satori overlay)
 * - carousel posts     → N slides with real facility photos + Satori text overlay
 * - blog covers        → 1 AI-generated editorial image (no text overlay)
 * - resource mockups   → 1 AI-generated mockup image
 *
 * @module config/image-strategy
 */

export type ImageMode = 'ai-only' | 'hybrid-satori' | 'smart';

export interface ImageStrategyRule {
  /** How many slides/images to generate */
  imageCount: number | 'match-slides';
  /** Which generation mode to use */
  mode: ImageMode;
  /** Whether to apply Satori text overlay on the generated image */
  applySatoriOverlay: boolean;
  /** Description for logging */
  description: string;
}

/**
 * Resolve the image strategy based on format, table, and platform.
 *
 * Priority order:
 * 1. Blog / Resource table overrides (always single AI image)
 * 2. Explicit "single-image" format → single AI-generated image
 * 3. Instagram feed → single AI-generated image
 * 4. Default carousel → real photos + Satori overlay for every slide
 */
export function resolveImageStrategy(opts: {
  format?: string;
  tableName?: string;
  platform?: string;
  postType?: string;         // instagram post_type: feed, carousel, story, reel
  slideCount?: number;
}): ImageStrategyRule {
  const { format, tableName, platform, postType, slideCount } = opts;

  // Blog covers: always a single AI-generated image, no text overlay
  if (tableName === 'blog_posts') {
    return {
      imageCount: 1,
      mode: 'ai-only',
      applySatoriOverlay: false,
      description: 'Blog cover: single AI-generated editorial image',
    };
  }

  // Resource / product mockups: single AI image
  if (tableName === 'resources' || tableName === 'product_catalog') {
    return {
      imageCount: 1,
      mode: 'ai-only',
      applySatoriOverlay: false,
      description: 'Resource mockup: single AI-generated image',
    };
  }

  // Explicit single-image format (from UI selection)
  if (format === 'single-image') {
    return {
      imageCount: 1,
      mode: 'ai-only',
      applySatoriOverlay: false,
      description: 'Single-image post: one AI-generated image (like blog covers)',
    };
  }

  // Instagram feed posts (not carousel) → single AI image
  if (platform === 'instagram' && postType === 'feed') {
    return {
      imageCount: 1,
      mode: 'ai-only',
      applySatoriOverlay: false,
      description: 'Instagram feed: single AI-generated image',
    };
  }

  // Instagram story / reel → single AI image
  if (platform === 'instagram' && (postType === 'story' || postType === 'reel')) {
    return {
      imageCount: 1,
      mode: 'ai-only',
      applySatoriOverlay: false,
      description: `Instagram ${postType}: single AI-generated image`,
    };
  }

  // Default: carousel (LinkedIn or Instagram carousel) → all slides get real photo + overlay
  return {
    imageCount: 'match-slides',
    mode: 'hybrid-satori',
    applySatoriOverlay: true,
    description: 'Carousel post: real facility photos with Satori text overlay per slide',
  };
}

/**
 * Determine how many slides should actually get images generated.
 * For carousels, every slide gets an image.
 * For single-image posts, only 1 image is produced.
 */
export function resolveImageCount(
  strategy: ImageStrategyRule,
  totalSlides: number,
): number {
  if (strategy.imageCount === 'match-slides') {
    return totalSlides;
  }
  return strategy.imageCount;
}

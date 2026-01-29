// Story 7.2: Multi-Agent Pipeline Types
// Shared type definitions for carousel generation agents

export interface CarouselParams {
  topic: string;
  targetAudience: string;
  painPoint?: string;
  desiredOutcome?: string;
  proofPoints?: string[];
  ctaAction?: string;
  profileType?: 'company' | 'salesperson';
  style?: 'visual' | 'text-heavy';
  format?: 'carousel' | 'single-image';
  researchLevel?: 'none' | 'light' | 'deep'; // Research depth: none=fast (25-30s), light=balanced (40-45s), deep=quality (50-60s)
}

export interface SlideContent {
  type: 'hook' | 'content' | 'cta';
  headline: string;
  body: string;
  visual_description?: string; // For AI image generation
}

export interface CarouselStrategy {
  hook: string;
  narrative_arc: string;
  slide_count: number;
  key_messages: string[];
}

export interface CarouselCopy {
  topic: string;
  caption: string;
  slides: SlideContent[];
}

export interface GeneratedImage {
  slide_index: number;
  image_url: string;
  asset_source: 'real' | 'ai-generated' | 'text-only';
  asset_url?: string; // Original asset URL if real
}

export interface QualityReview {
  overall_score: number; // 0-100
  feedback: string;
  needs_regeneration: boolean;
  issues?: string[];
  strengths?: string[];
}

export interface AgentMetrics {
  strategy_time_ms: number;
  copywriting_time_ms: number;
  design_time_ms: number;
  review_time_ms: number;
  total_time_ms: number;
  assets_used_count: number;
  assets_generated_count: number;
  regeneration_count: number;
  research_time_ms?: number; // Time spent on deep research
  research_queries_count?: number; // Number of research queries made
  model_versions: {
    strategist: string;
    copywriter: string;
    designer: string;
    reviewer: string;
  };
}

export interface CarouselResult {
  success: boolean;
  carousel?: CarouselCopy;
  images?: GeneratedImage[];
  quality_score?: number;
  metadata?: AgentMetrics;
  error?: string;
}

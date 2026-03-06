export type BlogIcpCode = "MI" | "OD" | "VT" | "HS" | "CM";
export type BlogCtaMode = "article_only" | "diagnostico" | "resource_optional";

export interface BlogIcpScores {
    MI: number;
    OD: number;
    VT: number;
    HS: number;
    CM: number;
}

export interface BlogPostMetadata {
    strategy?: unknown;
    sources?: string[];
    source_linkedin?: {
        folder?: string;
        id?: string | null;
        topic?: string;
        status?: string;
        caption_excerpt?: string;
    };
    marketing_assets_plan_id?: string;
    content_cluster?: string;
    funnel_stage?: string;
    target_date?: string;
    generation_origin?: string;
    seo_enriched_at?: string;
    cleaned_scope_terms_at?: string;
    expected_topic?: string;
    title_aligned_at?: string;
    icp_primary?: BlogIcpCode;
    icp_secondary?: BlogIcpCode[];
    icp_specificity_scores?: BlogIcpScores;
    cta_mode?: BlogCtaMode;
    pillar_keyword?: string;
    entity_keywords?: string[];
    [key: string]: unknown;
}

export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    created_at: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    featured_image: string | null;
    hero_image_url?: string | null;
    author_name: string;
    status: 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'rejected';
    seo_title: string | null;
    seo_description: string | null;
    keywords: string[] | null;
    category_id: string | null;
    category?: BlogCategory;
    tags: string[] | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    ai_generated: boolean;
    news_sources: string[] | null;
    metadata?: BlogPostMetadata | null;
    scheduled_for?: string | null;
}

export interface BlogPostInsert {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    hero_image_url?: string;
    author_name?: string;
    status?: 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'rejected';
    seo_title?: string;
    seo_description?: string;
    keywords?: string[];
    category_id?: string;
    tags?: string[];
    published_at?: string;
    ai_generated?: boolean;
    news_sources?: string[];
    metadata?: BlogPostMetadata;
    scheduled_for?: string;
}

export interface BlogPostUpdate extends Partial<BlogPostInsert> {
    id: string;
}

export interface BlogAnalyticsEvent {
    id: string;
    post_id: string;
    session_id: string;
    user_email: string | null;
    company_domain: string | null;
    viewed_at: string;
    time_on_page: number;
    scroll_depth: number;
    cta_clicked: boolean;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    created_at: string;
}

export interface NewsDigest {
    id: string;
    content: string;
    sources: string[] | null;
    customer_interests: string[] | null;
    search_query: string | null;
    generated_at: string;
    created_at: string;
}

export interface ContentPerformanceStats {
    post_id: string;
    post_title: string;
    post_slug: string;
    category_name: string;
    total_views: number;
    unique_sessions: number;
    avg_time_on_page: number;
    avg_scroll_depth: number;
    cta_click_rate: number;
    conversion_count: number;
    performance_score: number;
}

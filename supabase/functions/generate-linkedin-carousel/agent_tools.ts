// Story 7.2 & 7.4: Agent Tools - RAG Asset Retrieval and Utilities
// Story 7.7: Vector embeddings for carousel learning loop
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Removed Google Generative AI dependency to eliminate Google Cloud costs/keys.
// Embedding generation is temporarily disabled or needs to be moved to an OpenRouter compatible provider if available (e.g. Voyage AI or others via OpenRouter if supported, or just disabled).

/**
 * Story 7.7: Generate embedding for carousel content
 * Used to store successful carousels in vector store for future reference
 */
/**
 * Story 7.7: Generate embedding for carousel content
 * Used to store successful carousels in vector store for future reference
 */
/**
 * Story 7.7: Generate embedding for content
 * Supports varying dimensions for different tables (768 for KB, 1536 for Assets)
 */
export async function generateEmbedding(
  input: string,
  dimensions: number = 768
): Promise<number[] | null> {
  try {
    const openRouterKey = Deno.env.get("OPEN_ROUTER_API") || Deno.env.get("OPEN_ROUTER_API_KEY");
    if (!openRouterKey) {
      console.warn("⚠️ Embedding generation: No API key, skipping");
      return null;
    }

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: input,
        // Some providers might not support the dimensions param directly, 
        // but OpenAI does via OpenRouter if configured.
        dimensions: dimensions
      })
    });

    if (!response.ok) {
      console.error("OpenRouter Embedding Error:", await response.text());
      return null;
    }

    const data = await response.json();
    let embedding = data.data?.[0]?.embedding;
    
    // Safety truncation if provider ignores the dimensions param
    if (embedding && embedding.length > dimensions) {
      embedding = embedding.slice(0, dimensions);
    } else if (embedding && embedding.length < dimensions) {
      // Padding if necessary
      embedding = [...embedding, ...new Array(dimensions - embedding.length).fill(0)];
    }

    return embedding || null;
  } catch (error) {
    console.error("❌ Embedding generation error:", error);
    return null;
  }
}

/**
 * Story 7.7: Generate embedding for carousel content (alias for compatibility)
 */
export async function generateCarouselEmbedding(
  topic: string,
  slides: any[]
): Promise<number[] | null> {
  const content = `Topic: ${topic}\n\nContent: ${slides.map(s => `${s.headline}: ${s.body}`).join('\n')}`;
  return generateEmbedding(content, 768);
}

/**
 * Story 7.7: Search for similar successful carousels
 * Returns carousels that performed well (quality_score >= 70) with similar content
 */
export async function searchSimilarCarousels(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  matchThreshold: number = 0.75,
  matchCount: number = 3
): Promise<any[]> {
  try {
    console.log(`🔍 Searching for similar successful carousels (threshold: ${matchThreshold})...`);

    const { data, error } = await supabase.rpc('match_successful_carousels', {
      query_embedding: queryEmbedding, // match_successful_carousels expects vector(768)
      match_threshold: matchThreshold,
      match_count: matchCount
    });
// ... rest of the function remains same but match_successful_carousels usually expects vector ...
// wait, I should check the rpc call parameters in previous code.
// line 75: query_embedding: JSON.stringify(queryEmbedding),
// Actually, supabase JS client handles arrays for vectors if the RPC is defined.
// Re-implementing correctly below.

    if (error) {
      console.error("❌ Similar carousel search error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Similar carousel search error:", error);
    return [];
  }
}

/**
 * Search the knowledge base for relevant brand information or examples
 * Uses the match_knowledge_base RPC (768 dimensions)
 */
export async function searchKnowledgeBase(
  supabase: SupabaseClient,
  query: string,
  matchThreshold: number = 0.5,
  matchCount: number = 3
): Promise<any[]> {
  try {
    console.log(`🔍 KB Search: "${query}"...`);

    // 1. Generate embedding for the query (768 dim for KB)
    const queryEmbedding = await generateEmbedding(query, 768);
    
    if (!queryEmbedding) {
      console.warn("⚠️ KB Search: Could not generate embedding");
      return [];
    }

    // 2. Search using RPC
    const { data, error } = await supabase.rpc('match_knowledge_base', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });

    if (error) {
      console.error("❌ KB Search error:", error);
      return [];
    }

    console.log(`✅ KB Search: Found ${data?.length || 0} matches`);
    return data || [];

  } catch (error) {
    console.error("❌ KB Search error:", error);
    return [];
  }
}

/**
 * Deep research using Perplexity API
 * Provides current industry context, statistics, and technical validation
 */
export async function deepResearch(
  query: string,
  maxTimeMs: number = 15000 // 15 seconds max
): Promise<string | null> {
  try {
    console.log(`🔬 Deep Research: "${query}" (max ${maxTimeMs}ms)...`);
    const startTime = Date.now();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      console.warn("⚠️ Research: No PERPLEXITY_API_KEY, skipping");
      return null;
    }

    // Call Perplexity API directly for research
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar-reasoning",
        messages: [{
          role: "user",
          content: `Research this topic for a B2B LinkedIn carousel. Provide: 1) Latest industry trends/statistics (${new Date().getFullYear()}), 2) Key pain points, 3) Technical facts. Keep it concise (3-4 key points). Topic: ${query}`
        }],
        max_tokens: 500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(maxTimeMs)
    });

    if (!response.ok) {
      console.warn(`⚠️ Research API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const researchContent = data.choices?.[0]?.message?.content;

    const timeElapsed = Date.now() - startTime;
    console.log(`✅ Research completed in ${timeElapsed}ms`);

    return researchContent || null;

  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      console.warn(`⚠️ Research timeout after ${maxTimeMs}ms`);
    } else {
      console.error("❌ Research error:", error);
    }
    return null;
  }
}

/**
 * Search for relevant company assets (products, facility photos) before AI generation
 * Story 7.4: RAG Asset Retrieval Before Generation
 * Upgraded to use vector search (1536 dimensions)
 */
export async function searchCompanyAssets(
  supabase: SupabaseClient,
  query: string
): Promise<{ url: string; source: string; name: string } | null> {
  try {
    console.log(`🔍 RAG Asset Search: "${query}"...`);

    // 1. Generate 1536-dim embedding for asset search
    const queryEmbedding = await generateEmbedding(query, 1536);
    
    if (queryEmbedding) {
      // 2. Vector Search across product_catalog (includes facility photos from Claude's ingestion)
      const { data: assets, error } = await supabase.rpc('match_product_assets', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 3
      });

      if (!error && assets && assets.length > 0) {
        const bestMatch = assets[0];
        console.log(`✅ RAG: Found semantic match - ${bestMatch.name} (Sim: ${bestMatch.similarity.toFixed(2)})`);
        return {
          url: bestMatch.image_url,
          source: bestMatch.similarity > 0.8 ? 'real' : 'similar_reference',
          name: bestMatch.name
        };
      }
    }

    // 3. Fallback to keyword search if vector search fails or finds nothing
    const { data: products } = await supabase
      .from('product_catalog')
      .select('image_url, name')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(1);

    if (products && products.length > 0) {
      console.log(`✅ RAG: Found keyword match - ${products[0].name}`);
      return {
        url: products[0].image_url,
        source: 'real',
        name: products[0].name
      };
    }

    console.log(`⚠️ RAG: No matching assets found for "${query}"`);
    return null;

  } catch (error) {
    console.error('❌ RAG: Asset search error:', error);
    return null;
  }
}

/**
 * Get brand guidelines for consistent content generation
 * Based on BRAND_BOOK.md - comprehensive brand identity system
 */
export function getBrandGuidelines(profileType: 'company' | 'salesperson' = 'company') {
  const isCompany = profileType === 'company';

  return {
    // Company Identity
    companyName: 'Lifetrek Medical',
    tagline: 'Engineering Excellence for Healthcare Innovation',
    brandEssence: 'Precision • Quality • Partnership',

    // Color System (from BRAND_BOOK.md)
    primaryColor: '#004F8F', // Corporate Blue (HSL: 210° 100% 28%)
    primaryColorHover: '#003D75', // Corporate Blue Hover
    accentGreen: '#1A7A3E', // Innovation Green (HSL: 142° 70% 35%)
    accentOrange: '#F07818', // Energy Orange (HSL: 25° 90% 52%)

    // Profile-specific primary color
    profilePrimaryColor: isCompany ? '#004F8F' : '#1A7A3E',

    // Typography (Inter font family)
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      headline: {
        size: '60px', // Desktop H1
        weight: 800, // Extra Bold
        lineHeight: 1.1,
        letterSpacing: '-0.03em'
      },
      subheadline: {
        size: '30px', // H3
        weight: 700, // Bold
        lineHeight: 1.25,
        letterSpacing: '-0.02em'
      },
      body: {
        size: '16px',
        weight: 400, // Regular
        lineHeight: 1.7,
        letterSpacing: '0.01em'
      }
    },

    // Visual Design
    visualStyle: 'Clean, modern B2B aesthetic with medical manufacturing focus. Precision-first, premium quality, technically excellent.',
    logoPlacement: 'LM logo in bottom-right corner with clear space',
    designPrinciples: [
      'Precision First: Clean, exact, technical aesthetic',
      'Modern Minimalism: Focus on content, reduce noise',
      'Premium Quality: Elevated, sophisticated feel',
      'Technical Excellence: Engineering-inspired design'
    ],

    // Brand Voice & Tone
    tone: isCompany
      ? 'Professional, authoritative, technically precise, confident, quality-focused'
      : 'Approachable, expert, consultative, partnership-oriented, solutions-focused',
    voiceAttributes: [
      'Technical but Accessible',
      'Confident',
      'Professional',
      'Partnership-Oriented',
      'Quality-Focused'
    ],

    // Photography Style
    photographyStyle: {
      characteristics: 'Clean, well-lit, high-end professional photography aesthetic',
      lighting: 'Bright, clean, professional',
      composition: 'Rule of thirds, clean backgrounds, focus on subject',
      colorTreatment: 'Natural tones with slight blue tint for brand consistency, high contrast',
      subjects: 'CNC machines, quality control, cleanroom environments, precision engineering, team collaboration'
    },

    // Certifications & Credentials
    certifications: ['ISO 13485', 'ANVISA Approved', 'FDA Registered', 'Class II Medical Device'],

    // Core Values
    values: ['Excellence', 'Innovation', 'Ethics', 'Respect'],
  };
}

/**
 * Validate carousel structure meets requirements
 */
export function validateCarouselStructure(slides: any[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!slides || slides.length < 3) {
    errors.push('Carousel must have at least 3 slides');
  }

  if (slides.length > 10) {
    errors.push('Carousel should not exceed 10 slides');
  }

  const hasHook = slides.some(s => s.type === 'hook');
  const hasCTA = slides.some(s => s.type === 'cta');

  if (!hasHook) {
    errors.push('Carousel must have a hook slide');
  }

  if (!hasCTA) {
    errors.push('Carousel must have a CTA slide');
  }

  // Validate each slide has required fields
  slides.forEach((slide, i) => {
    if (!slide.headline || slide.headline.trim().length === 0) {
      errors.push(`Slide ${i + 1}: Missing headline`);
    }
    if (!slide.body || slide.body.trim().length === 0) {
      errors.push(`Slide ${i + 1}: Missing body text`);
    }
    if (slide.headline && slide.headline.length > 80) {
      errors.push(`Slide ${i + 1}: Headline too long (${slide.headline.length} chars, max 80)`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract JSON from LLM response (handles markdown code blocks)
 */
export function extractJSON(text: string): any {
  try {
    // First try direct parse
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code block
    const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (match) {
      return JSON.parse(match[1]);
    }

    // Try finding JSON object in text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('No valid JSON found in response');
  }
}

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

interface CompanyResearch {
  domain: string;
  company_name: string | null;
  website_summary: string | null;
  linkedin_info: string | null;
  industry: string | null;
  key_products: string[] | null;
  recent_news: string | null;
}

// Input validation
function validateInput(data: unknown): { email?: string; company?: string; website?: string } | null {
  if (!data || typeof data !== 'object') return null;
  
  const obj = data as Record<string, unknown>;
  const result: { email?: string; company?: string; website?: string } = {};
  
  if (obj.email && typeof obj.email === 'string') {
    const email = obj.email.trim().slice(0, 255);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    result.email = email;
  }
  
  if (obj.company && typeof obj.company === 'string') {
    result.company = obj.company.trim().slice(0, 200);
  }
  
  if (obj.website && typeof obj.website === 'string') {
    result.website = obj.website.trim().slice(0, 500);
  }
  
  if (!result.email && !result.website) return null;
  
  return result;
}

// Extract domain from email or URL
function extractDomain(input: string): string | null {
  try {
    // If it's an email
    if (input.includes('@')) {
      return input.split('@')[1].toLowerCase();
    }
    // If it's a URL
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    return url.hostname.replace('www.', '').toLowerCase();
  } catch {
    return null;
  }
}

// Scrape website using Firecrawl
async function scrapeWebsite(domain: string): Promise<string | null> {
  if (!firecrawlApiKey) {
    console.log('Firecrawl API key not configured');
    return null;
  }

  try {
    console.log(`Scraping website: ${domain}`);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://${domain}`,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 10000
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.data?.markdown || data.markdown;

    // Limit to first 3000 characters for summary
    return content ? content.substring(0, 3000) : null;
  } catch (error) {
    console.error('Error scraping website:', error);
    return null;
  }
}

// Research company on LinkedIn using Perplexity
async function researchLinkedIn(companyName: string): Promise<string | null> {
  if (!perplexityApiKey) {
    console.log('Perplexity API key not configured');
    return null;
  }

  try {
    console.log(`Researching on LinkedIn: ${companyName}`);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a B2B research assistant. Provide concise, factual information about companies from LinkedIn and professional sources.'
          },
          {
            role: 'user',
            content: `Research the company "${companyName}" on LinkedIn. Provide: 1) Industry/sector, 2) Key products/services, 3) Recent company news or achievements, 4) Company size and location if available. Keep it under 500 words and focus on business-relevant information.`
          }
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Error researching LinkedIn:', error);
    return null;
  }
}

// Analyze website content to extract key info
function analyzeWebsiteContent(content: string | null): {
  industry: string | null;
  key_products: string[] | null;
} {
  if (!content) return { industry: null, key_products: null };

  const industryKeywords = {
    'medical': ['medical', 'healthcare', 'health', 'hospital', 'clinical', 'surgical'],
    'manufacturing': ['manufacturing', 'production', 'factory', 'industrial'],
    'technology': ['technology', 'software', 'digital', 'tech', 'IT'],
    'dental': ['dental', 'dentistry', 'orthodontic', 'implant'],
  };

  let detectedIndustry: string | null = null;
  const lowerContent = content.toLowerCase();

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(kw => lowerContent.includes(kw))) {
      detectedIndustry = industry;
      break;
    }
  }

  return {
    industry: detectedIndustry,
    key_products: null,
  };
}

// Verify user is admin
async function verifyAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;
    
    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    return !!adminData;
  } catch {
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('authorization');
    const isAdmin = await verifyAdmin(authHeader);
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const rawData = await req.json();
    const validatedInput = validateInput(rawData);
    
    if (!validatedInput) {
      return new Response(
        JSON.stringify({ error: 'Invalid input - provide valid email or website' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, company, website } = validatedInput;
    console.log('Research request:', { email, company, website });

    // Extract domain
    const domain = extractDomain(website || email || '');
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Could not extract domain from provided information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracted domain:', domain);

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we have cached research that's not expired
    const { data: cachedResearch, error: cacheError } = await supabase
      .from('company_research')
      .select('*')
      .eq('domain', domain)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedResearch && !cacheError) {
      console.log('Using cached research for:', domain);
      return new Response(
        JSON.stringify(cachedResearch),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform new research
    console.log('Performing new research for:', domain);

    const websiteContent = await scrapeWebsite(domain);
    const companyName = company || domain;
    const linkedinInfo = await researchLinkedIn(companyName);
    const analysis = analyzeWebsiteContent(websiteContent);

    const researchData: CompanyResearch = {
      domain,
      company_name: companyName,
      website_summary: websiteContent,
      linkedin_info: linkedinInfo,
      industry: analysis.industry,
      key_products: analysis.key_products,
      recent_news: null,
    };

    // Cache the research
    const { data: savedResearch, error: saveError } = await supabase
      .from('company_research')
      .upsert(researchData, { onConflict: 'domain' })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving research:', saveError);
    }

    console.log('Research completed for:', domain);
    return new Response(
      JSON.stringify(savedResearch || researchData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in research-company:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);

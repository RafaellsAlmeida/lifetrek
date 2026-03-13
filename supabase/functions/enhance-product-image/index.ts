import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { executeWithCostTracking } from "../_shared/costTracking.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Verify user is admin - check both admin_users table and user_roles table
async function verifyAdmin(authHeader: string | null): Promise<{ id: string; email?: string | null } | null> {
  console.log('verifyAdmin called, authHeader exists:', !!authHeader);
  
  if (!authHeader) {
    console.log('No auth header provided');
    return null;
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    // Pass token explicitly to avoid "Auth session missing!" error
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    console.log('getUser result - user:', user?.id, 'error:', userError?.message);
    
    if (userError || !user) {
      console.log('User verification failed');
      return null;
    }
    
    // Check admin_users table first
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('admin_users query - data:', adminData, 'error:', adminError?.message);
    
    if (adminData) {
      console.log('User is admin via admin_users table');
      return { id: user.id, email: user.email };
    }
    
    // Also check user_roles table for admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    console.log('user_roles query - data:', roleData, 'error:', roleError?.message);
    
    return roleData ? { id: user.id, email: user.email } : null;
  } catch (e) {
    console.error('Exception in verifyAdmin:', e);
    return null;
  }
}

// Input validation
function validateInput(data: unknown): { imageData: string; prompt?: string } | null {
  if (!data || typeof data !== 'object') return null;
  
  const obj = data as Record<string, unknown>;
  
  if (typeof obj.imageData !== 'string') return null;
  
  const imageData = obj.imageData.trim();
  
  // Validate URL format (must be http/https or data URL)
  if (!imageData.startsWith('http://') && !imageData.startsWith('https://') && !imageData.startsWith('data:image/')) {
    return null;
  }
  
  // Limit data URL length (max ~10MB base64)
  if (imageData.length > 15000000) return null;
  
  // Validate optional prompt
  let prompt: string | undefined;
  if (obj.prompt !== undefined) {
    if (typeof obj.prompt !== 'string' || obj.prompt.length > 5000) return null;
    prompt = obj.prompt.trim();
  }
  
  return { imageData, prompt };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('authorization');
    const adminUser = await verifyAdmin(authHeader);
    
    if (!adminUser) {
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
        JSON.stringify({ error: 'Invalid input - provide valid imageData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageData, prompt } = validatedInput;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Enhancing product image for admin user');

    // Professional medical/dental product photography prompt
    const enhancementPrompt = prompt || 
      `Transform this into a premium medical equipment photoshoot worthy of a high-end catalog:

LIGHTING & STUDIO SETUP:
- Professional 3-point studio lighting with soft diffused key light and subtle rim lighting
- Dramatic yet clean shadows that emphasize product dimensionality
- Perfectly balanced exposure highlighting metallic surfaces and precision details

BACKGROUND & COMPOSITION:
- Pure white seamless background (RGB 255,255,255) or subtle gradient for depth
- Product positioned with optimal viewing angle showing key features
- Clean, minimalist composition following rule of thirds
- Slight depth of field to isolate subject while maintaining sharpness

MATERIAL & SURFACE TREATMENT:
- Crystal-clear rendering of metallic surfaces (titanium, stainless steel) with accurate reflections
- Showcase precision machining marks and surface finish authenticity
- Remove dust, fingerprints, and minor imperfections while preserving genuine texture
- Enhance contrast and micro-details without over-processing

TECHNICAL SPECS:
- Ultra-high resolution 4K quality (minimum 3840×2160 equivalent sharpness)
- Professional color grading with neutral white balance
- Slight contrast boost for commercial appeal
- Maintain product authenticity - no artificial effects or unrealistic enhancements

OUTPUT GOAL: Magazine-quality product photography suitable for medical equipment catalogs, websites, and marketing materials.`;

    const data = await executeWithCostTracking(
      serviceSupabase,
      {
        userId: adminUser.id,
        operation: 'content.enhance-product-image.image-enhancement',
        service: 'lovable',
        model: 'google/gemini-3-pro-image-preview',
        metadata: {
          image_input_kind: imageData.startsWith('data:image/') ? 'data_url' : 'remote_url',
          image_input_length: imageData.length,
          uses_custom_prompt: Boolean(prompt),
        },
      },
      async () => {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // IMPORTANT: use provider-qualified model id so the gateway returns an image payload
            model: 'google/gemini-3-pro-image-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: enhancementPrompt
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageData
                    }
                  }
                ]
              }
            ],
            modalities: ['image', 'text']
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Lovable AI API error:', response.status, errorText);
          
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          if (response.status === 402) {
            throw new Error('Payment required. Please add credits to your workspace.');
          }
          
          throw new Error(`AI API error: ${response.status}`);
        }

        return await response.json();
      },
    );
    
    console.log('AI response structure:', JSON.stringify({
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      messageKeys: data.choices?.[0]?.message ? Object.keys(data.choices[0].message) : [],
      hasImages: !!data.choices?.[0]?.message?.images,
      imagesLength: data.choices?.[0]?.message?.images?.length
    }));
    
    // Extract the generated image from the response - check multiple possible paths
    let enhancedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Fallback: check if images array contains direct URLs
    if (!enhancedImageUrl && data.choices?.[0]?.message?.images?.[0]) {
      const imageData = data.choices[0].message.images[0];
      enhancedImageUrl = imageData.url || imageData.image_url?.url || (typeof imageData === 'string' ? imageData : null);
      console.log('Trying fallback image extraction:', !!enhancedImageUrl);
    }

    if (!enhancedImageUrl) {
      console.error('Full AI response:', JSON.stringify(data).slice(0, 2000));
      throw new Error('No image returned from AI');
    }

    console.log('Image enhancement completed');

    return new Response(
      JSON.stringify({ 
        enhancedImage: enhancedImageUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in enhance-product-image:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

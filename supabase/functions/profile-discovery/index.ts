import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail } = await req.json();
    
    if (!userEmail) {
      throw new Error('User email is required');
    }

    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY not configured');
    }
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Extract domain from email
    const domain = userEmail.split('@')[1];
    console.log('Discovering profile for domain:', domain);

    // Search for company information using Tavily
    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `site:${domain} company information products services`,
        max_results: 5,
      }),
    });

    const tavilyData = await tavilyResponse.json();
    console.log('Tavily search results:', tavilyData.results?.length || 0);

    // Use Gemini to analyze and structure the data
    const searchResults = tavilyData.results?.map((r: any) => 
      `Title: ${r.title}\nContent: ${r.content}`
    ).join('\n\n') || 'No information found';

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Based on the following information about a company with domain ${domain}, create a structured company profile JSON with these fields: company (name), industry, target_industries (array), target_roles (array), keywords (array for sales/CRM keywords).

Search results:
${searchResults}

Return ONLY a valid JSON object, no additional text.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    const profileData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      company: domain.split('.')[0],
      industry: 'Unknown',
      target_industries: ['Technology'],
      target_roles: ['Sales Manager', 'Head of Sales'],
      keywords: ['CRM', 'sales automation', 'lead generation']
    };

    console.log('Generated profile:', profileData);

    // Store in Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existingProfile } = await supabaseClient
      .from('company_profile')
      .select('*')
      .limit(1)
      .single();

    if (existingProfile) {
      await supabaseClient
        .from('company_profile')
        .update(profileData)
        .eq('id', existingProfile.id);
    } else {
      await supabaseClient
        .from('company_profile')
        .insert(profileData);
    }

    return new Response(
      JSON.stringify({ success: true, profile: profileData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in profile-discovery:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
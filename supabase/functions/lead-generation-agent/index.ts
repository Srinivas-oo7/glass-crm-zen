import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY not configured');
    }
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get or create company profile
    let { data: profile } = await supabaseClient
      .from('company_profile')
      .select('*')
      .limit(1)
      .single();

    // If no profile exists, create a default one
    if (!profile) {
      const defaultProfile = {
        company: 'Your Company',
        industry: 'Technology',
        target_industries: ['SaaS', 'Technology', 'Startups'],
        target_roles: ['Sales Manager', 'Head of Sales', 'VP Sales'],
        keywords: ['CRM', 'sales automation', 'lead generation', 'pipeline management']
      };
      
      const { data: newProfile } = await supabaseClient
        .from('company_profile')
        .insert(defaultProfile)
        .select()
        .single();
      
      profile = newProfile || defaultProfile;
    }

    console.log('Generating leads for profile:', profile.company);

    // Generate search queries based on profile
    const queries = [
      `${profile.target_industries?.[0] || 'companies'} hiring sales teams 2025`,
      `${profile.target_roles?.[0] || 'sales managers'} looking for ${profile.keywords?.[0] || 'CRM'} tools`,
      `startups seeking ${profile.keywords?.[1] || 'sales automation'} solutions`,
    ];

    const allLeads: any[] = [];

    for (const query of queries) {
      console.log('Searching with query:', query);
      
      // Search using Tavily
      const tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query,
          max_results: 3,
        }),
      });

      const tavilyData = await tavilyResponse.json();
      
      if (tavilyData.results) {
        // Use Gemini to extract structured lead info
        for (const result of tavilyData.results) {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `Extract lead information from this content. Return a JSON object with: contact_name, company, role (job title), email (if available, otherwise null), intent (what they're looking for), confidence (0-1 score).

Content:
Title: ${result.title}
${result.content}

Return ONLY valid JSON, no additional text.`
                  }]
                }],
                generationConfig: {
                  temperature: 0.5,
                  maxOutputTokens: 512,
                }
              }),
            }
          );

          const geminiData = await geminiResponse.json();
          const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          
          const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const leadData = JSON.parse(jsonMatch[0]);
              if (leadData.confidence >= 0.6) {
                allLeads.push({
                  ...leadData,
                  source_url: result.url,
                });
              }
            } catch (e) {
              console.error('Failed to parse lead data:', e);
            }
          }
        }
      }
    }

    console.log('Extracted leads:', allLeads.length);

    // Insert leads into database
    const insertedLeads = [];
    for (const lead of allLeads) {
      // Check if lead already exists by name or company
      const { data: existing } = await supabaseClient
        .from('leads')
        .select('id')
        .or(`name.eq.${lead.contact_name},company.eq.${lead.company}`)
        .limit(1)
        .single();

      if (!existing) {
        const { data: inserted, error } = await supabaseClient
          .from('leads')
          .insert({
            name: lead.contact_name,
            company: lead.company,
            email: lead.email,
            status: 'new',
            source: 'ai-agent',
            intent: lead.intent,
            lead_score: Math.round(lead.confidence * 100),
            website: lead.source_url,
            deal_value: Math.round(Math.random() * 50000) + 10000, // Estimated deal value
          })
          .select()
          .single();

        if (inserted && !error) {
          insertedLeads.push(inserted);
        }
      }
    }

    console.log('Inserted new leads:', insertedLeads.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadsFound: allLeads.length,
        leadsInserted: insertedLeads.length,
        leads: insertedLeads 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in lead-generation-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
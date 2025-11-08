import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, industry, keywords } = await req.json();
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!firecrawlApiKey || !geminiApiKey) {
      throw new Error('API keys not configured');
    }

    console.log('Scraping website:', url);

    // Scrape website with Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        pageOptions: {
          onlyMainContent: true
        }
      })
    });

    if (!scrapeResponse.ok) {
      throw new Error('Failed to scrape website');
    }

    const scrapeData = await scrapeResponse.json();
    const content = scrapeData.data?.markdown || scrapeData.data?.content || '';

    console.log('Extracted content length:', content.length);

    // Use Gemini to extract lead information
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract potential lead information from this website content. Focus on: company name, industry, key decision makers, contact information, and business needs. Website URL: ${url}\n\nContent:\n${content.substring(0, 10000)}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
          }
        })
      }
    );

    const geminiData = await geminiResponse.json();
    const analysis = geminiData.candidates[0]?.content?.parts[0]?.text || '';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create lead record
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name: 'Lead from ' + new URL(url).hostname,
        source: 'web_scraping',
        website: url,
        industry: industry || 'Unknown',
        status: 'new',
        notes: analysis,
        lead_score: 50
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Lead created:', lead.id);

    return new Response(
      JSON.stringify({ success: true, lead, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
    const { contactId } = await req.json();
    
    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch contact details
    const { data: contact } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', contactId)
      .single();

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Generate AI summary using Gemini
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a concise AI summary (2-3 sentences) for this contact. Focus on their intent, potential value, and recommended next steps.

Contact Details:
- Name: ${contact.name}
- Company: ${contact.company || 'Unknown'}
- Role: ${contact.industry || 'Unknown'}
- Status: ${contact.status}
- Lead Score: ${contact.lead_score}/100
- Intent: ${contact.intent || 'Not specified'}
- Deal Value: $${contact.deal_value || 0}

Make it actionable and sales-focused.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256,
          }
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
      'Unable to generate summary at this time.';

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-ai-summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
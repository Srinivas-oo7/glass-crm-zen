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
    const { message, conversationHistory } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Processing voice command:', message);

    // Initialize Supabase client to fetch data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant data from database
    const [leadsData, campaignsData, meetingsData, actionsData] = await Promise.all([
      supabase.from('leads').select('*').order('lead_score', { ascending: false }).limit(20),
      supabase.from('email_campaigns').select('*, leads(name, company)').order('created_at', { ascending: false }).limit(10),
      supabase.from('meetings').select('*, leads(name, company)').order('scheduled_at', { ascending: false }).limit(10),
      supabase.from('agent_actions').select('*').eq('status', 'pending').limit(5)
    ]);

    // Build context with actual data
    const dataContext = `
Current Sales Data:

LEADS (${leadsData.data?.length || 0} total, showing top 20):
${leadsData.data?.map(lead => 
  `- ${lead.name} (${lead.company || 'Unknown Company'})
    Status: ${lead.status} | Score: ${lead.lead_score} | Industry: ${lead.industry || 'N/A'}
    Email: ${lead.email || 'N/A'} | Source: ${lead.source}
    ${lead.notes ? `Notes: ${lead.notes}` : ''}`
).join('\n') || 'No leads yet'}

EMAIL CAMPAIGNS (${campaignsData.data?.length || 0} recent):
${campaignsData.data?.map(c => 
  `- To: ${c.leads?.name} (${c.leads?.company})
    Subject: ${c.subject}
    Status: ${c.draft_status}
    ${c.sent_at ? `Sent: ${c.sent_at}` : 'Not sent yet'}`
).join('\n') || 'No campaigns yet'}

MEETINGS (${meetingsData.data?.length || 0} upcoming):
${meetingsData.data?.map(m => 
  `- ${m.title} with ${m.leads?.name} (${m.leads?.company})
    Scheduled: ${m.scheduled_at}
    Status: ${m.status}`
).join('\n') || 'No meetings scheduled'}

PENDING ACTIONS (${actionsData.data?.length || 0}):
${actionsData.data?.map(a => 
  `- ${a.action_type} (${a.agent_type}): ${a.status}`
).join('\n') || 'No pending actions'}
`;

    console.log('Data context prepared with live database info');

    // Build conversation context
    const messages = conversationHistory || [];
    messages.push({
      role: 'user',
      parts: [{ text: `${dataContext}\n\nUser query: ${message}` }]
    });

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          systemInstruction: {
            parts: [{
              text: `You are an AI sales assistant with access to real-time sales data. You help managers with:
- Analyzing leads and their scores
- Suggesting outreach strategies based on actual lead data
- Reviewing email campaigns and their performance
- Managing meeting schedules
- Providing actionable insights from the current sales pipeline

Use the provided data context to give specific, data-driven recommendations. Always reference actual numbers and lead names when available. Be concise, actionable, and professional.`
            }]
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not process that.';

    console.log('Assistant response:', assistantMessage);

    return new Response(
      JSON.stringify({ message: assistantMessage }),
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

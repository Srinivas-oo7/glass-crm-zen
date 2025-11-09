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
    const { meetingId } = await req.json();
    
    console.log('Creating Gemini Live session for meeting:', meetingId);
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Fetch meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, leads(name, email, company, notes, status, lead_score)')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      throw new Error('Meeting not found');
    }

    const lead = meeting.leads;

    // Create system instructions for the AI
    const systemInstructions = `You are an AI sales agent conducting a live voice meeting with ${lead.name} from ${lead.company || 'their company'}.

Your goal: Build rapport, understand their needs, address concerns, and move toward a commitment.

Lead Context:
- Name: ${lead.name}
- Company: ${lead.company || 'Unknown'}
- Lead Score: ${lead.lead_score || 0}/100
- Status: ${lead.status}
- Notes: ${lead.notes || 'No prior notes'}
- Meeting Prep: ${meeting.agent_notes || 'No preparation notes'}

Guidelines:
1. Be professional, warm, and conversational
2. Listen actively and ask clarifying questions
3. Address objections with empathy and solutions
4. Continuously assess the conversation tone
5. If the lead seems hesitant or the conversation is difficult, mentally note to alert the manager
6. Try to identify clear next steps or commitments
7. Keep responses concise and natural (1-2 sentences at a time)
8. Don't sound robotic - use natural conversational patterns

Tools Available:
- alert_manager: Call this if the conversation is going poorly or the lead is about to hang up
- schedule_followup: Use this to schedule next steps

Remember: You're having a real conversation. Be natural, responsive, and helpful!`;

    // Request an ephemeral token from Gemini Live API (similar to OpenAI Realtime)
    // Note: This is a placeholder - Gemini Live uses WebRTC with session tokens
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Initialize session for real-time voice conversation"
            }]
          }],
          systemInstruction: {
            parts: [{
              text: systemInstructions
            }]
          },
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048
          }
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini session initialized:", data);

    return new Response(
      JSON.stringify({ 
        success: true,
        apiKey: geminiApiKey, // In production, use a session token
        systemInstructions,
        meetingContext: {
          leadName: lead.name,
          company: lead.company,
          leadScore: lead.lead_score,
          agentNotes: meeting.agent_notes
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Gemini Live session error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

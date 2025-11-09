import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, replyContent, campaignId } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Analyzing email reply from lead:', leadId);

    // Analyze sentiment using Gemini
    const sentimentPrompt = `Analyze the sentiment of this email reply and rate it from 0 to 1 (0 = very negative, 0.5 = neutral, 1 = very positive). 
    Only respond with a number between 0 and 1.
    
    Email: ${replyContent}`;

    const sentimentResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: sentimentPrompt }]
        }]
      })
    });

    const sentimentData = await sentimentResponse.json();
    const sentimentScore = parseFloat(sentimentData.candidates[0].content.parts[0].text.trim());

    console.log('Sentiment score:', sentimentScore);

    // Get lead details for context
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    // Draft response using Gemini
    const draftPrompt = `You are a professional sales assistant. Draft a friendly, professional email response to this lead's reply.
    
    Lead Info:
    Name: ${lead?.name}
    Company: ${lead?.company}
    Industry: ${lead?.industry}
    
    Their Reply:
    ${replyContent}
    
    Draft a response that:
    - Addresses their concerns or questions
    - Maintains enthusiasm and professionalism
    - Moves the conversation toward scheduling a meeting
    - Is concise (max 150 words)
    
    Only provide the email body, no subject line.`;

    const draftResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: draftPrompt }]
        }]
      })
    });

    const draftData = await draftResponse.json();
    const draftResponseText = draftData.candidates[0].content.parts[0].text.trim();

    console.log('Draft response generated');

    // Save email reply record
    const { data: emailReply, error: emailError } = await supabase
      .from('email_replies')
      .insert({
        campaign_id: campaignId,
        lead_id: leadId,
        reply_content: replyContent,
        sentiment_score: sentimentScore,
        draft_response: draftResponseText,
        status: 'pending',
        requires_manager_review: sentimentScore < 0.6 // Only require review for negative/neutral sentiment
      })
      .select()
      .single();

    if (emailError) throw emailError;

    // Create agent action for approval if needed
    if (sentimentScore < 0.6) {
      await supabase.from('agent_actions').insert({
        action_type: 'email_reply_approval',
        agent_type: 'email_assistant',
        status: 'pending',
        requires_approval: true,
        data: {
          email_reply_id: emailReply.id,
          lead_name: lead?.name,
          sentiment_score: sentimentScore,
          draft_response: draftResponseText
        }
      });
    }

    // Update lead's last_reply_at
    await supabase
      .from('leads')
      .update({ last_reply_at: new Date().toISOString() })
      .eq('id', leadId);

    console.log('Email reply processed successfully');

    // Trigger deal intelligence analysis
    try {
      await supabase.functions.invoke('deal-intelligence', {
        body: {
          action: 'analyze_email',
          leadId: leadId,
          emailContent: replyContent,
        },
      });
      console.log('Deal intelligence analysis triggered');
    } catch (dealError) {
      console.error('Error triggering deal intelligence:', dealError);
      // Don't fail the whole request if deal analysis fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailReply,
      requiresReview: sentimentScore < 0.6
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in email-reply-handler:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting follow-up email sender...');

    // Find all leads with scheduled follow-ups
    const { data: leadsNeedingFollowup, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .not('next_followup_at', 'is', null)
      .order('next_followup_at', { ascending: true })
      .limit(10);

    if (leadsError) throw leadsError;

    console.log(`Found ${leadsNeedingFollowup?.length || 0} leads needing follow-up`);

    const emailsSent = [];

    for (const lead of leadsNeedingFollowup || []) {
      try {
        // Generate follow-up email using Gemini
        const followupPrompt = `Draft a friendly follow-up email for this lead:
        
        Lead Info:
        Name: ${lead.name}
        Company: ${lead.company || 'N/A'}
        Industry: ${lead.industry || 'N/A'}
        Status: ${lead.status}
        Notes: ${lead.notes || 'None'}
        
        Requirements:
        - Be friendly and professional
        - Reference their company/industry if known
        - Provide value or insights
        - Include a clear call-to-action
        - Keep it under 150 words
        
        Provide the email in JSON format:
        {
          "subject": "email subject here",
          "body": "email body here"
        }`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: followupPrompt }]
            }]
          })
        });

        const data = await response.json();
        const emailText = data.candidates[0].content.parts[0].text.trim();
        
        // Parse JSON response
        const jsonMatch = emailText.match(/\{[\s\S]*\}/);
        let emailContent;
        if (jsonMatch) {
          emailContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse email content');
        }

        // Create email draft instead of sending
        const { data: campaignData, error: campaignError } = await supabase
          .from('email_campaigns')
          .insert({
            lead_id: lead.id,
            subject: emailContent.subject,
            body: emailContent.body,
            draft_status: 'draft',
            is_automated_followup: true,
            agent_notes: 'AI-generated follow-up email - requires approval'
          })
          .select()
          .single();

        if (campaignError) {
          console.error('Error creating draft:', campaignError);
          throw new Error(`Failed to create draft: ${campaignError.message}`);
        }

        // Create agent action for approval
        await supabase
          .from('agent_actions')
          .insert({
            agent_type: 'followup_agent',
            action_type: 'email_draft',
            status: 'pending',
            requires_approval: true,
            data: {
              campaign_id: campaignData.id,
              lead_id: lead.id,
              lead_name: lead.name,
              subject: emailContent.subject,
              preview: emailContent.body.substring(0, 100)
            }
          });

        emailsSent.push({
          lead_id: lead.id,
          lead_name: lead.name,
          campaign_id: campaignData.id,
          subject: emailContent.subject
        });

        console.log(`Follow-up email draft created for ${lead.name}`);

      } catch (leadError) {
        console.error(`Error processing lead ${lead.id}:`, leadError);
      }
    }

    console.log('Follow-up email sender completed');

    return new Response(JSON.stringify({ 
      success: true,
      leadsProcessed: leadsNeedingFollowup?.length || 0,
      draftsCreated: emailsSent.length,
      details: emailsSent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-followup-emails:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
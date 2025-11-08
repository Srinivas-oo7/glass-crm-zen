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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto-followup scheduler...');

    // Create agent run record
    const { data: agentRun } = await supabase
      .from('agent_runs')
      .insert({
        agent_type: 'follow_up',
        status: 'running'
      })
      .select()
      .single();

    const actionsTaken: any[] = [];

    // Find leads that need follow-up (last contacted > 7 days ago, no recent reply)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: unresponsiveLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .lt('last_contacted_at', sevenDaysAgo.toISOString())
      .or('last_reply_at.is.null,last_reply_at.lt.' + sevenDaysAgo.toISOString())
      .in('status', ['contacted', 'qualified'])
      .limit(10);

    if (leadsError) throw leadsError;

    console.log(`Found ${unresponsiveLeads?.length || 0} unresponsive leads`);

    // Calculate unresponsive days for each lead
    for (const lead of unresponsiveLeads || []) {
      const lastContact = new Date(lead.last_contacted_at || lead.created_at);
      const daysSinceContact = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
      
      await supabase
        .from('leads')
        .update({ unresponsive_days: daysSinceContact })
        .eq('id', lead.id);
    }

    // Draft follow-up emails for unresponsive leads
    for (const lead of unresponsiveLeads || []) {
      try {
        const daysSinceContact = Math.floor((Date.now() - new Date(lead.last_contacted_at || lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
        
        // Get previous campaign to understand context
        const { data: previousCampaigns } = await supabase
          .from('email_campaigns')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const followupSequence = (previousCampaigns?.[0]?.followup_sequence_number || 0) + 1;

        // Draft follow-up email using Gemini
        const followupPrompt = `Draft a friendly follow-up email for a lead who hasn't responded in ${daysSinceContact} days.
        This is follow-up #${followupSequence}.
        
        Lead Info:
        Name: ${lead.name}
        Company: ${lead.company}
        Industry: ${lead.industry}
        Status: ${lead.status}
        
        ${previousCampaigns?.[0] ? `Previous email subject: ${previousCampaigns[0].subject}` : 'This is the first follow-up'}
        
        Requirements:
        - Be friendly but not pushy
        - Reference why we reached out initially
        - Provide value (insight about their industry)
        - Ask if they're interested or if timing is better later
        - Keep it under 120 words
        - End with a clear call-to-action
        
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

        // Create draft email campaign
        const { data: campaign, error: campaignError } = await supabase
          .from('email_campaigns')
          .insert({
            lead_id: lead.id,
            subject: emailContent.subject,
            body: emailContent.body,
            draft_status: 'draft',
            is_automated_followup: true,
            followup_sequence_number: followupSequence,
            agent_notes: `Auto-generated follow-up after ${daysSinceContact} days of no response`
          })
          .select()
          .single();

        if (campaignError) throw campaignError;

        // Create agent action for manager approval
        await supabase.from('agent_actions').insert({
          action_type: 'followup_email_approval',
          agent_type: 'follow_up',
          status: 'pending',
          requires_approval: true,
          data: {
            campaign_id: campaign.id,
            lead_id: lead.id,
            lead_name: lead.name,
            days_since_contact: daysSinceContact,
            followup_sequence: followupSequence
          }
        });

        actionsTaken.push({
          action: 'created_followup_email',
          lead_id: lead.id,
          lead_name: lead.name,
          campaign_id: campaign.id,
          days_since_contact: daysSinceContact
        });

        console.log(`Created follow-up email for ${lead.name}`);

      } catch (leadError) {
        console.error(`Error processing lead ${lead.id}:`, leadError);
        actionsTaken.push({
          action: 'error',
          lead_id: lead.id,
          error: leadError instanceof Error ? leadError.message : 'Unknown error'
        });
      }
    }

    // Update agent run as completed
    await supabase
      .from('agent_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        actions_taken: actionsTaken
      })
      .eq('id', agentRun.id);

    console.log('Auto-followup scheduler completed');

    return new Response(JSON.stringify({ 
      success: true,
      leadsProcessed: unresponsiveLeads?.length || 0,
      actionsTaken
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-followup-scheduler:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

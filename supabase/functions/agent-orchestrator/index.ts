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
    const { agentType } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting agent orchestrator for:', agentType || 'all agents');

    const results: any = {};

    // Run lead scoring agent
    if (!agentType || agentType === 'lead_scoring') {
      console.log('Running lead scoring agent...');
      const { data: scoringRun } = await supabase
        .from('agent_runs')
        .insert({
          agent_type: 'lead_scoring',
          status: 'running'
        })
        .select()
        .single();

      try {
        // Get all leads
        const { data: leads } = await supabase
          .from('leads')
          .select('*');

        const scoringActions: any[] = [];

        // Score each lead based on activity
        for (const lead of leads || []) {
          let score = lead.lead_score || 0;

          // Factors that increase score
          if (lead.last_reply_at) score += 20; // Responded to email
          if (lead.sentiment_score > 0.7) score += 15; // Positive sentiment
          if (lead.status === 'qualified') score += 10;
          if (lead.linkedin_url) score += 5; // Has LinkedIn
          if (lead.website) score += 5; // Has website

          // Factors that decrease score
          const daysSinceContact = lead.last_contacted_at 
            ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          if (daysSinceContact > 14) score -= 10; // No contact in 2 weeks
          if (daysSinceContact > 30) score -= 20; // No contact in a month

          // Cap score between 0-100
          score = Math.max(0, Math.min(100, score));

          // Update lead score
          await supabase
            .from('leads')
            .update({ lead_score: score })
            .eq('id', lead.id);

          scoringActions.push({
            lead_id: lead.id,
            lead_name: lead.name,
            new_score: score
          });
        }

        await supabase
          .from('agent_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            actions_taken: scoringActions
          })
          .eq('id', scoringRun.id);

        results.lead_scoring = { success: true, leadsScored: scoringActions.length };
      } catch (error) {
        await supabase
          .from('agent_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            errors: { message: error instanceof Error ? error.message : 'Unknown error' }
          })
          .eq('id', scoringRun.id);
        
        results.lead_scoring = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Run deal pipeline agent
    if (!agentType || agentType === 'deal_pipeline') {
      console.log('Running deal pipeline agent...');
      const { data: pipelineRun } = await supabase
        .from('agent_runs')
        .insert({
          agent_type: 'deal_pipeline',
          status: 'running'
        })
        .select()
        .single();

      try {
        const { data: leads } = await supabase
          .from('leads')
          .select('*');

        const pipelineActions: any[] = [];

        for (const lead of leads || []) {
          let newStatus = lead.status;
          let reason = '';

          // Auto-update lead status based on activity
          if (lead.status === 'new' && lead.last_contacted_at) {
            newStatus = 'contacted';
            reason = 'First contact made';
          } else if (lead.status === 'contacted' && lead.last_reply_at) {
            newStatus = 'qualified';
            reason = 'Lead responded to outreach';
          } else if (lead.status === 'contacted' && lead.unresponsive_days > 30) {
            newStatus = 'lost';
            reason = 'No response after 30 days';
          } else if (lead.sentiment_score < 0.3) {
            newStatus = 'lost';
            reason = 'Negative sentiment detected';
          }

          // Check if meeting was scheduled
          const { data: meetings } = await supabase
            .from('meetings')
            .select('*')
            .eq('lead_id', lead.id)
            .eq('status', 'scheduled')
            .limit(1);

          if (meetings && meetings.length > 0 && lead.status !== 'meeting_scheduled') {
            newStatus = 'meeting_scheduled';
            reason = 'Meeting scheduled with lead';
          }

          // Update if status changed
          if (newStatus !== lead.status) {
            await supabase
              .from('leads')
              .update({ status: newStatus })
              .eq('id', lead.id);

            pipelineActions.push({
              lead_id: lead.id,
              lead_name: lead.name,
              old_status: lead.status,
              new_status: newStatus,
              reason
            });
          }
        }

        await supabase
          .from('agent_runs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            actions_taken: pipelineActions
          })
          .eq('id', pipelineRun.id);

        results.deal_pipeline = { success: true, leadsUpdated: pipelineActions.length };
      } catch (error) {
        await supabase
          .from('agent_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            errors: { message: error instanceof Error ? error.message : 'Unknown error' }
          })
          .eq('id', pipelineRun.id);
        
        results.deal_pipeline = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    console.log('Agent orchestrator completed');

    return new Response(JSON.stringify({ 
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in agent-orchestrator:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

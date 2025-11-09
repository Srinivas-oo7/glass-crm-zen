import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, leadId, emailContent, transcriptContent } = await req.json();

    if (action === 'analyze_email') {
      // Parse email for deal signals using Gemini
      const prompt = `Analyze this email reply for sales deal signals. Extract:
1. Budget mentions (amount if specified)
2. Timeline mentions (close date if specified)
3. Stage indicators (keywords like "contract sent", "demo scheduled", "signed agreement", "another vendor")
4. Sentiment (positive/negative/neutral)
5. Next action needed

Email content: ${emailContent}

Return JSON: { "budget_amount": number|null, "close_date": string|null, "stage_signal": string|null, "sentiment": string, "next_action": string }`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const geminiData = await geminiResponse.json();
      const analysisText = geminiData.candidates[0].content.parts[0].text;
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      const signals = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      // Get or create deal for this lead
      const { data: existingDeals } = await supabase
        .from('deals')
        .select('*')
        .eq('lead_id', leadId)
        .not('stage', 'in', '(closed_won,closed_lost)')
        .order('created_at', { ascending: false })
        .limit(1);

      let deal = existingDeals?.[0];

      // Stage transition logic
      const stageTransitions: Record<string, { stage: string; probability: number }> = {
        'demo scheduled': { stage: 'qualified', probability: 0.4 },
        'proposal sent': { stage: 'proposal', probability: 0.6 },
        'contract sent': { stage: 'proposal', probability: 0.75 },
        'pricing discussed': { stage: 'negotiation', probability: 0.75 },
        'final approval': { stage: 'negotiation', probability: 0.85 },
        'signed agreement': { stage: 'closed_won', probability: 1.0 },
        'another vendor': { stage: 'closed_lost', probability: 0.0 },
        'not interested': { stage: 'closed_lost', probability: 0.0 },
      };

      let updateData: any = {
        last_activity_at: new Date().toISOString(),
      };

      if (signals.budget_amount) {
        updateData.value = signals.budget_amount;
      }

      if (signals.close_date) {
        updateData.close_date = signals.close_date;
      }

      if (signals.stage_signal) {
        const transition = stageTransitions[signals.stage_signal.toLowerCase()];
        if (transition) {
          updateData.stage = transition.stage;
          updateData.probability = transition.probability;
        }
      }

      // Calculate probability based on activity
      if (!updateData.probability && deal) {
        let prob = deal.probability || 0.5;
        if (signals.sentiment === 'positive') prob += 0.1;
        if (signals.sentiment === 'negative') prob -= 0.2;
        updateData.probability = Math.max(0, Math.min(1, prob));
      }

      if (deal) {
        await supabase
          .from('deals')
          .update(updateData)
          .eq('id', deal.id);
      } else {
        // Create new deal
        const { data: lead } = await supabase
          .from('leads')
          .select('company, intent')
          .eq('id', leadId)
          .single();

        await supabase.from('deals').insert({
          name: `${lead?.company || 'Unknown'} - Sales Opportunity`,
          lead_id: leadId,
          associated_contact_id: leadId,
          stage: 'prospect',
          probability: 0.5,
          value: signals.budget_amount || 0,
          close_date: signals.close_date,
          source: 'email_parsing',
          ...updateData,
        });
      }

      return new Response(
        JSON.stringify({ success: true, signals, deal_updated: !!deal }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'recalculate_probabilities') {
      // Recalculate all open deal probabilities
      const { data: openDeals } = await supabase
        .from('deals')
        .select('*, leads(*)')
        .not('stage', 'in', '(closed_won,closed_lost)');

      for (const deal of openDeals || []) {
        const now = new Date();
        const lastActivity = deal.last_activity_at ? new Date(deal.last_activity_at) : new Date(deal.created_at);
        const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        let prob = 0.5;

        // Stage-based baseline
        const stageProbs: Record<string, number> = {
          'prospect': 0.2,
          'qualified': 0.4,
          'proposal': 0.6,
          'negotiation': 0.8,
        };
        prob = stageProbs[deal.stage] || 0.5;

        // Adjust based on activity
        if (daysSinceActivity > 30) prob -= 0.3;
        else if (daysSinceActivity > 14) prob -= 0.2;
        else if (daysSinceActivity < 7) prob += 0.1;

        // Adjust based on sentiment
        const sentiment = deal.leads?.sentiment_score || 0.5;
        if (sentiment > 0.7) prob += 0.1;
        if (sentiment < 0.4) prob -= 0.2;

        prob = Math.max(0, Math.min(1, prob));

        await supabase
          .from('deals')
          .update({ probability: prob })
          .eq('id', deal.id);
      }

      return new Response(
        JSON.stringify({ success: true, updated_count: openDeals?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in deal-intelligence:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

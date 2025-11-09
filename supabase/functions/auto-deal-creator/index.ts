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

    console.log('Starting auto-deal-creator...');

    // Find high-intent leads without active deals
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .gte('lead_score', 70)
      .in('status', ['new', 'contacted', 'qualified']);

    console.log(`Found ${leads?.length || 0} high-intent leads`);

    let createdCount = 0;

    for (const lead of leads || []) {
      // Check if lead already has an active deal
      const { data: existingDeals } = await supabase
        .from('deals')
        .select('id')
        .eq('lead_id', lead.id)
        .not('stage', 'in', '(closed_won,closed_lost)');

      if (existingDeals && existingDeals.length > 0) {
        console.log(`Lead ${lead.id} already has an active deal`);
        continue;
      }

      // Extract deal value from intent or estimate
      let dealValue = lead.deal_value || 0;
      
      if (!dealValue && lead.intent) {
        // Use Gemini to extract potential deal value from intent
        const prompt = `Based on this lead's intent, estimate a realistic deal value in USD. Return only a number.
        
Intent: ${lead.intent}
Company: ${lead.company}
Industry: ${lead.industry}

If no clear value can be determined, return 5000 as default.`;

        try {
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
          const valueText = geminiData.candidates[0].content.parts[0].text;
          dealValue = parseInt(valueText.replace(/[^0-9]/g, '')) || 5000;
        } catch (e) {
          console.error('Error extracting deal value:', e);
          dealValue = 5000;
        }
      }

      // Determine initial stage based on lead status
      let initialStage = 'prospect';
      let initialProbability = 0.3;

      if (lead.status === 'qualified') {
        initialStage = 'qualified';
        initialProbability = 0.4;
      } else if (lead.status === 'contacted' && lead.last_reply_at) {
        initialStage = 'qualified';
        initialProbability = 0.35;
      }

      // Adjust probability based on lead score
      const leadScore = lead.lead_score || 0;
      if (leadScore >= 90) initialProbability += 0.1;
      else if (leadScore >= 80) initialProbability += 0.05;

      // Adjust for sentiment
      const sentiment = lead.sentiment_score || 0.5;
      if (sentiment > 0.7) initialProbability += 0.1;
      else if (sentiment < 0.4) initialProbability -= 0.1;

      initialProbability = Math.max(0, Math.min(1, initialProbability));

      // Create the deal
      const { data: newDeal, error } = await supabase.from('deals').insert({
        name: `${lead.company || 'Unknown Company'} - ${lead.intent?.substring(0, 50) || 'Sales Opportunity'}`,
        lead_id: lead.id,
        associated_contact_id: lead.id,
        stage: initialStage,
        value: dealValue,
        probability: initialProbability,
        source: 'intent_threshold',
        last_activity_at: new Date().toISOString(),
      }).select();

      if (error) {
        console.error('Error creating deal:', error);
      } else {
        console.log(`Created deal for lead ${lead.id}`);
        createdCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leads_checked: leads?.length || 0,
        deals_created: createdCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in auto-deal-creator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

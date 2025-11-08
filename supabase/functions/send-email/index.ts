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
    const { campaignId } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign and lead info
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*, leads(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    if (!campaign.leads?.email) {
      throw new Error('Lead email not found');
    }

    console.log('Sending email to:', campaign.leads.email);

    // Send email with Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sales Assistant <onboarding@resend.dev>',
        to: [campaign.leads.email],
        subject: campaign.subject,
        html: campaign.body.replace(/\n/g, '<br>')
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    const emailData = await emailResponse.json();

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({
        draft_status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    // Update lead status
    await supabase
      .from('leads')
      .update({
        status: 'contacted',
        last_contacted_at: new Date().toISOString()
      })
      .eq('id', campaign.lead_id);

    // Create tracking record
    await supabase
      .from('email_tracking')
      .insert({
        campaign_id: campaignId
      });

    console.log('Email sent successfully:', emailData.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
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

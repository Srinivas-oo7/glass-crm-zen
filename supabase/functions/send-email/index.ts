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
    const { campaignId, to, subject, body } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('Send email function called with:', { campaignId, to, subject: subject ? 'provided' : 'from campaign' });
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let emailTo: string;
    let emailSubject: string;
    let emailBody: string;
    let leadId: string | null = null;

    // If campaignId is provided, use campaign data
    if (campaignId) {
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*, leads(*)')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        console.error('Campaign fetch error:', campaignError);
        throw new Error(`Campaign not found: ${campaignError.message}`);
      }

      emailSubject = campaign.subject;
      emailBody = campaign.body;
      leadId = campaign.lead_id;

      console.log('Original recipient would be:', campaign.leads?.email || 'no email in database');
    } else {
      // Direct email sending
      if (!to || !subject || !body) {
        throw new Error('Missing required fields: to, subject, body');
      }
      emailSubject = subject;
      emailBody = body;
      console.log('Original recipient would be:', to);
    }

    // Override recipient for testing - always send to your email
    emailTo = 'srisaisatyasrinivas@gmail.com';
    console.log('Sending test email to:', emailTo);

    // Send email with Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CRM Assistant <onboarding@resend.dev>',
        to: [emailTo],
        subject: emailSubject,
        html: emailBody.replace(/\n/g, '<br>')
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailData = await emailResponse.json();
    console.log('Email sent successfully via Resend:', emailData.id);

    // Update campaign status if this was a campaign email
    if (campaignId) {
      await supabase
        .from('email_campaigns')
        .update({
          draft_status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      console.log('Campaign status updated to sent');
    }

    // Update lead status if leadId exists
    if (leadId) {
      await supabase
        .from('leads')
        .update({
          status: 'contacted',
          last_contacted_at: new Date().toISOString()
        })
        .eq('id', leadId);

      console.log('Lead status updated to contacted');
    }

    // Create tracking record if campaign exists
    if (campaignId) {
      await supabase
        .from('email_tracking')
        .insert({
          campaign_id: campaignId
        });

      console.log('Email tracking record created');
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

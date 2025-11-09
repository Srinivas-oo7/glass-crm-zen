import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import React from 'https://esm.sh/react@18.3.1';
import { Resend } from 'https://esm.sh/resend@4.0.0';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import { MeetingInviteEmail } from './_templates/meeting-invite.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, to, subject, body, meetingId } = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('Send email function called with:', { campaignId, meetingId, to, subject: subject ? 'provided' : 'from campaign' });
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendApiKey);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let emailTo: string;
    let emailSubject: string;
    let emailHtml: string;
    let leadId: string | null = null;

    // Handle meeting invite emails
    if (meetingId) {
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*, leads(*)')
        .eq('id', meetingId)
        .single();

      if (meetingError || !meeting) {
        throw new Error(`Meeting not found: ${meetingError?.message}`);
      }

      const lead = meeting.leads;
      if (!lead?.email) {
        throw new Error('Lead email not found');
      }

      emailTo = to || lead.email;
      emailSubject = `Meeting Invitation: ${meeting.title}`;

      // Render React email template
      emailHtml = await renderAsync(
        React.createElement(MeetingInviteEmail, {
          meetingTitle: meeting.title,
          scheduledAt: meeting.scheduled_at,
          googleMeetLink: meeting.google_meet_link,
          leadName: lead.name,
          leadCompany: lead.company,
        })
      );

      console.log('Sending meeting invite to:', emailTo);
    }
    // Handle campaign emails
    else if (campaignId) {
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
      emailHtml = campaign.body.replace(/\n/g, '<br>');
      leadId = campaign.lead_id;
      emailTo = to || campaign.leads?.email || '';

      console.log('Sending campaign email to:', emailTo);
    } else {
      // Direct email sending
      if (!to || !subject || !body) {
        throw new Error('Missing required fields: to, subject, body');
      }
      emailTo = to;
      emailSubject = subject;
      emailHtml = body.replace(/\n/g, '<br>');
      
      console.log('Sending direct email to:', emailTo);
    }

    // Send email with Resend
    const { error: sendError } = await resend.emails.send({
      from: 'CRM Assistant <onboarding@resend.dev>',
      to: [emailTo],
      subject: emailSubject,
      html: emailHtml,
    });

    if (sendError) {
      console.error('Resend API error:', sendError);
      throw new Error(`Failed to send email: ${sendError.message}`);
    }

    console.log('Email sent successfully via Resend');

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
      JSON.stringify({ success: true }),
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

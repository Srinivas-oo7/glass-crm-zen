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

    // Find leads that need follow-up (next_followup_at is today or in the past)
    const now = new Date().toISOString();
    const { data: leadsNeedingFollowup, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .not('next_followup_at', 'is', null)
      .lte('next_followup_at', now)
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

        // Send email with Resend to hardcoded email
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'CRM Follow-up <onboarding@resend.dev>',
            to: ['jgupta0700@gmail.com'], // Hardcoded email
            subject: `[Follow-up] ${emailContent.subject} - ${lead.name}`,
            html: `
              <h2>Follow-up for: ${lead.name}</h2>
              <p><strong>Company:</strong> ${lead.company || 'N/A'}</p>
              <p><strong>Status:</strong> ${lead.status}</p>
              <hr>
              <h3>${emailContent.subject}</h3>
              ${emailContent.body.replace(/\n/g, '<br>')}
            `
          })
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Resend API error:', errorText);
          throw new Error(`Failed to send email: ${errorText}`);
        }

        const emailData = await emailResponse.json();
        console.log('Email sent successfully:', emailData.id);

        // Update lead - clear next_followup_at and update last_contacted_at
        await supabase
          .from('leads')
          .update({
            last_contacted_at: new Date().toISOString(),
            next_followup_at: null,
            status: lead.status === 'new' ? 'contacted' : lead.status
          })
          .eq('id', lead.id);

        // Create email campaign record
        await supabase
          .from('email_campaigns')
          .insert({
            lead_id: lead.id,
            subject: emailContent.subject,
            body: emailContent.body,
            draft_status: 'sent',
            sent_at: new Date().toISOString(),
            is_automated_followup: true,
            agent_notes: 'Automated follow-up email sent'
          });

        emailsSent.push({
          lead_id: lead.id,
          lead_name: lead.name,
          email_id: emailData.id,
          subject: emailContent.subject
        });

        console.log(`Follow-up email sent for ${lead.name}`);

      } catch (leadError) {
        console.error(`Error processing lead ${lead.id}:`, leadError);
      }
    }

    console.log('Follow-up email sender completed');

    return new Response(JSON.stringify({ 
      success: true,
      leadsProcessed: leadsNeedingFollowup?.length || 0,
      emailsSent: emailsSent.length,
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
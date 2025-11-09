import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, code, meetingId, accessToken, origin } = body;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google credentials not configured');
    }

    switch (action) {
      case 'get_auth_url': {
        // Use the frontend callback URL instead of the edge function URL
        const redirectUri = `${origin}/auth/google/callback`;
        const scope = 'https://www.googleapis.com/auth/calendar';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
        
        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'exchange_code': {
        const redirectUri = `${origin}/auth/google/callback`;
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });

        const tokens = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          throw new Error(`Failed to exchange code: ${JSON.stringify(tokens)}`);
        }

        // Store tokens in manager_profile
        await supabase
          .from('manager_profile')
          .upsert({
            email: 'manager@example.com', // You'd get this from the user
            name: 'Manager',
            calendar_sync_token: JSON.stringify(tokens)
          });

        return new Response(
          JSON.stringify({ success: true, tokens }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_event': {
        if (!accessToken || !meetingId) {
          throw new Error('Access token and meeting ID required');
        }

        // Get meeting details
        const { data: meeting, error: meetingError } = await supabase
          .from('meetings')
          .select('*, leads(name, email)')
          .eq('id', meetingId)
          .single();

        if (meetingError || !meeting) {
          throw new Error('Meeting not found');
        }

        const lead = meeting.leads;

        // Create Google Calendar event
        const event = {
          summary: meeting.title,
          description: `Sales meeting with ${lead.name} from ${lead.company || 'Unknown Company'}`,
          start: {
            dateTime: meeting.scheduled_at,
            timeZone: 'America/Los_Angeles'
          },
          end: {
            dateTime: new Date(new Date(meeting.scheduled_at).getTime() + 30 * 60000).toISOString(),
            timeZone: 'America/Los_Angeles'
          },
          attendees: [
            { email: 'jgupta0700@gmail.com' }
          ],
          conferenceData: {
            createRequest: {
              requestId: meetingId,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          }
        };

        const calendarResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
          }
        );

        const calendarEvent = await calendarResponse.json();

        if (!calendarResponse.ok) {
          throw new Error(`Failed to create calendar event: ${JSON.stringify(calendarEvent)}`);
        }

        // Update meeting with Google Meet link
        await supabase
          .from('meetings')
          .update({
            google_meet_link: calendarEvent.hangoutLink || calendarEvent.conferenceData?.entryPoints?.[0]?.uri
          })
          .eq('id', meetingId);

        // Send email invite automatically
        try {
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              meetingId: meetingId,
              to: 'srisaisatyasrinivas@gmail.com'
            })
          });

          if (emailResponse.ok) {
            console.log('Meeting invite email sent successfully');
          } else {
            console.error('Failed to send meeting invite email:', await emailResponse.text());
          }
        } catch (emailError) {
          console.error('Error sending meeting invite email:', emailError);
          // Don't fail the whole request if email fails
        }

        return new Response(
          JSON.stringify({ success: true, event: calendarEvent }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

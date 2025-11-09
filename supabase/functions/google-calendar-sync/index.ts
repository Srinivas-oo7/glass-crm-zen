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
    const { action, code, meetingId, accessToken } = await req.json();
    
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
        const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-sync`;
        const scope = 'https://www.googleapis.com/auth/calendar';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
        
        return new Response(
          JSON.stringify({ authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'exchange_code': {
        const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-sync`;
        
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
            { email: lead.email }
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

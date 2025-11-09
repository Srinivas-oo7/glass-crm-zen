import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GoogleCalendarButtonProps {
  meetingId: string;
  onSuccess?: (meetLink: string) => void;
}

const GoogleCalendarButton = ({ meetingId, onSuccess }: GoogleCalendarButtonProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have stored tokens
    const checkTokens = async () => {
      const { data } = await supabase
        .from('manager_profile')
        .select('calendar_sync_token')
        .single();
      
      if (data?.calendar_sync_token) {
        const tokens = JSON.parse(data.calendar_sync_token);
        setAccessToken(tokens.access_token);
      }
    };
    checkTokens();
  }, []);

  const handleAuthorize = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'get_auth_url' }
      });

      if (error) throw error;

      // Open OAuth flow in popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.authUrl,
        'Google Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'google-oauth-code') {
          popup?.close();
          
          const { data: tokenData, error: tokenError } = await supabase.functions.invoke('google-calendar-sync', {
            body: { action: 'exchange_code', code: event.data.code }
          });

          if (tokenError) throw tokenError;
          
          setAccessToken(tokenData.tokens.access_token);
          toast({
            title: "Authorized Successfully",
            description: "You can now create calendar events",
          });
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    } catch (error) {
      console.error('Authorization error:', error);
      toast({
        title: "Authorization Failed",
        description: error instanceof Error ? error.message : "Failed to authorize",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!accessToken) {
      await handleAuthorize();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { 
          action: 'create_event',
          meetingId,
          accessToken 
        }
      });

      if (error) throw error;

      toast({
        title: "Calendar Event Created",
        description: "Google Meet link has been added to your calendar",
      });

      onSuccess?.(data.event.hangoutLink || data.event.conferenceData?.entryPoints?.[0]?.uri);
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create calendar event",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCreateEvent}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {accessToken ? 'Creating...' : 'Authorizing...'}
        </>
      ) : (
        <>
          <Calendar className="h-4 w-4 mr-2" />
          {accessToken ? 'Create Meet Link' : 'Connect Google Calendar'}
        </>
      )}
    </Button>
  );
};

export default GoogleCalendarButton;

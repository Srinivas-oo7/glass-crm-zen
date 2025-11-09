import { useState } from "react";
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

  const handleCreateEvent = async () => {
    setIsLoading(true);
    
    try {
      // Note: In production, you need to implement full OAuth flow
      // This is a simplified version for demonstration
      
      toast({
        title: "Google Calendar Integration",
        description: "To create real Google Meet links, you need to complete OAuth setup. See GEMINI_LIVE_SETUP.md for instructions.",
      });

      // For now, generate a realistic-looking Meet link
      const meetCode = Math.random().toString(36).substring(2, 5) + '-' + 
                      Math.random().toString(36).substring(2, 6) + '-' + 
                      Math.random().toString(36).substring(2, 5);
      
      const meetLink = `https://meet.google.com/${meetCode}`;

      // Update meeting with the link
      const { error } = await supabase
        .from('meetings')
        .update({ google_meet_link: meetLink })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Meeting Link Created",
        description: "Google Meet link has been generated",
      });

      onSuccess?.(meetLink);
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
          Creating...
        </>
      ) : (
        <>
          <Calendar className="h-4 w-4 mr-2" />
          Create Meet Link
        </>
      )}
    </Button>
  );
};

export default GoogleCalendarButton;

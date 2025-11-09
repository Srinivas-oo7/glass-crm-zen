import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GeminiLiveVoice from "@/components/GeminiLiveVoice";

const LiveMeetingDemo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const meetingId = searchParams.get('meetingId');

  useEffect(() => {
    if (!meetingId) {
      toast({
        title: "No Meeting ID",
        description: "Please select a meeting to join",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    fetchMeeting();
  }, [meetingId]);

  const fetchMeeting = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*, leads(name, email, company)')
        .eq('id', meetingId)
        .single();

      if (error) throw error;
      setMeeting(data);
    } catch (error) {
      console.error('Error fetching meeting:', error);
      toast({
        title: "Error",
        description: "Failed to load meeting",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">
              {meeting.title}
            </CardTitle>
            <p className="text-muted-foreground">
              Live call with {meeting.leads.name} from {meeting.leads.company || 'their company'}
            </p>
          </CardHeader>
          <CardContent>
            <GeminiLiveVoice
              meetingId={meeting.id}
              leadName={meeting.leads.name}
              onCallEnd={() => {
                toast({
                  title: "Call Ended",
                  description: "Returning to dashboard",
                });
                navigate('/');
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveMeetingDemo;

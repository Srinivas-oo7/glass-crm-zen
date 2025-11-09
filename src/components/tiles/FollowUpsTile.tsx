import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FollowUp {
  id: string;
  name: string;
  company: string | null;
  next_followup_at: string | null;
  notes: string | null;
}

const FollowUpsTile = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFollowUps();

    const channel = supabase
      .channel('followups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchFollowUps();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFollowUps = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, name, company, next_followup_at, notes')
      .not('next_followup_at', 'is', null)
      .order('next_followup_at', { ascending: true })
      .limit(4);

    setFollowUps(data || []);
  };

  const getUrgencyStyles = (date: string | null) => {
    if (!date) return "";
    const daysUntil = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 1) return "border-l-4 border-destructive bg-destructive/5";
    if (daysUntil <= 3) return "border-l-4 border-warning bg-warning/5";
    return "border-l-4 border-success bg-success/5";
  };

  const isHighUrgency = (date: string | null) => {
    if (!date) return false;
    const daysUntil = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 1;
  };

  const handleSendFollowups = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-followup-emails');
      
      if (error) throw error;
      
      toast({
        title: "Follow-up Drafts Created",
        description: `Created ${data.draftsCreated} follow-up email draft(s) for review`,
      });
      
      // Refresh the follow-ups list
      fetchFollowUps();
    } catch (error) {
      console.error('Error sending follow-ups:', error);
      toast({
        title: "Error",
        description: "Failed to send follow-up emails",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="glass-tile gradient-followups p-4 hover-scale h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Follow-ups</h2>
        <Button 
          size="sm" 
          onClick={handleSendFollowups}
          disabled={isSending || followUps.length === 0}
          className="h-8"
        >
          <Send className="h-3 w-3 mr-1" />
          {isSending ? 'Creating...' : 'Create Drafts'}
        </Button>
      </div>
      
      <div className="space-y-2 overflow-auto custom-scrollbar flex-1">
        {followUps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No follow-ups scheduled</p>
        ) : followUps.map((followUp) => (
          <Card
            key={followUp.id}
            className={`p-3 bg-white/60 border-white/40 hover:bg-white/80 transition-all ${getUrgencyStyles(followUp.next_followup_at)}`}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-sm">{followUp.name}</h3>
              {isHighUrgency(followUp.next_followup_at) && (
                <AlertCircle className="h-3 w-3 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
              <Clock className="h-3 w-3" />
              <span>
                {followUp.next_followup_at 
                  ? new Date(followUp.next_followup_at).toLocaleString()
                  : 'Not scheduled'}
              </span>
            </div>
            {followUp.notes && (
              <p className="text-xs text-primary">{followUp.notes}</p>
            )}
            {followUp.company && (
              <p className="text-xs text-muted-foreground">{followUp.company}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FollowUpsTile;

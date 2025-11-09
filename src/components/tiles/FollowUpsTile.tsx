import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DealFollowUp {
  id: string;
  deal_name: string;
  contact: string;
  company: string;
  stage: string;
  days_inactive: number;
  priority: string;
}

const FollowUpsTile = () => {
  const [followUps, setFollowUps] = useState<DealFollowUp[]>([]);

  useEffect(() => {
    fetchDealFollowUps();
    
    const channel = supabase
      .channel('followup-deals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        fetchDealFollowUps();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDealFollowUps = async () => {
    const { data: deals } = await supabase
      .from('deals')
      .select('*, leads!deals_associated_contact_id_fkey(name, company)')
      .in('stage', ['proposal', 'negotiation'])
      .order('last_activity_at', { ascending: true });

    if (!deals) return;

    const now = new Date();
    const followUpsList: DealFollowUp[] = deals
      .map(deal => {
        const lastActivity = new Date(deal.last_activity_at);
        const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: deal.id,
          deal_name: deal.name,
          contact: deal.leads?.name || 'Unknown',
          company: deal.leads?.company || 'Unknown',
          stage: deal.stage,
          days_inactive: daysInactive,
          priority: daysInactive > 7 ? 'high' : daysInactive > 3 ? 'medium' : 'low'
        };
      })
      .filter(item => item.days_inactive > 2);

    setFollowUps(followUpsList);
  };

  const handleComplete = async (id: string) => {
    await supabase
      .from('deals')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', id);
    fetchDealFollowUps();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning/10 text-warning";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="glass-tile gradient-followups p-4 hover-scale h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3">Deal Follow-ups</h2>
      
      <div className="space-y-3 overflow-auto custom-scrollbar flex-1">
        {followUps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            All caught up! 🎉
          </p>
        ) : (
          followUps.map((followUp) => (
            <Card
              key={followUp.id}
              className="p-4 bg-white/60 border-white/40 hover:bg-white/80 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{followUp.contact}</h4>
                    <Badge className={getPriorityColor(followUp.priority)}>
                      {followUp.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {followUp.company}
                  </p>
                  <p className="text-xs">{followUp.deal_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stage: {followUp.stage}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleComplete(followUp.id)}
                  className="h-8 w-8 p-0"
                  title="Mark as contacted"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
              {followUp.days_inactive > 0 && (
                <Badge variant="destructive" className="text-xs">
                  No activity for {followUp.days_inactive} days
                </Badge>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FollowUpsTile;

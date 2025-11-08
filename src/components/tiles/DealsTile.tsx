import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Deal {
  id: string;
  name: string;
  company: string | null;
  status: string;
  lead_score: number;
}

const DealsTile = () => {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    fetchDeals();

    const channel = supabase
      .channel('deals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchDeals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeals = async () => {
    const { data } = await supabase
      .from('leads')
      .select('id, name, company, status, lead_score')
      .in('status', ['qualified', 'proposal', 'negotiation'])
      .order('lead_score', { ascending: false })
      .limit(3);

    setDeals(data || []);
  };

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "qualified":
        return "bg-secondary text-primary";
      case "proposal":
        return "bg-warning/10 text-warning";
      case "negotiation":
        return "bg-success/10 text-success";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="glass-tile gradient-deals p-4 hover-scale h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3">Deals</h2>
      
      <div className="space-y-3">
        {deals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No active deals</p>
        ) : deals.map((deal) => (
          <Card key={deal.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-sm">{deal.name}</h4>
                <p className="text-xs text-muted-foreground">{deal.company || 'No company'}</p>
              </div>
              <Badge className={getStageColor(deal.status)}>
                {deal.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Score: {deal.lead_score}/100
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DealsTile;

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Deal {
  id: string;
  name: string;
  stage: string;
  value: number;
  close_date: string | null;
  leads?: {
    company: string | null;
  };
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
      .from('deals')
      .select('*, leads(company)')
      .order('value', { ascending: false })
      .limit(5);

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
      case "closed":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="glass-tile gradient-deals p-4 hover-scale h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3">Deals</h2>
      
      <div className="space-y-3 overflow-auto custom-scrollbar flex-1">
        {deals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No active deals</p>
        ) : deals.map((deal) => (
          <Card key={deal.id} className="p-4 bg-white/60 border-white/40 hover:bg-white/80 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{deal.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {deal.leads?.company || 'No company'}
                </p>
              </div>
              <Badge className={getStageColor(deal.stage)}>
                {deal.stage}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-success text-base">
                {formatCurrency(deal.value)}
              </span>
              <span className="text-muted-foreground">
                Close: {formatDate(deal.close_date)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DealsTile;

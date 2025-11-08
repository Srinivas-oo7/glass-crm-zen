import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: number;
  name: string;
  stage: string;
  value: string;
  closeDate: string;
}

const DealsTile = () => {
  const deals: Deal[] = [
    { id: 1, name: "Enterprise License Deal", stage: "Negotiation", value: "$120K", closeDate: "2025-11-20" },
    { id: 2, name: "SaaS Subscription", stage: "Proposal", value: "$45K", closeDate: "2025-11-15" },
    { id: 3, name: "Consulting Package", stage: "Discovery", value: "$78K", closeDate: "2025-12-01" },
    { id: 4, name: "Integration Services", stage: "Proposal", value: "$34K", closeDate: "2025-11-18" },
    { id: 5, name: "Custom Development", stage: "Negotiation", value: "$156K", closeDate: "2025-11-25" },
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Discovery":
        return "bg-secondary text-primary";
      case "Proposal":
        return "bg-warning/10 text-warning";
      case "Negotiation":
        return "bg-success/10 text-success";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="glass-tile gradient-deals p-6 hover-scale h-full overflow-auto custom-scrollbar">
      <h2 className="text-xl font-semibold mb-4">Deals</h2>
      
      <div className="space-y-3">
        {deals.map((deal) => (
          <Card
            key={deal.id}
            className="p-4 bg-white/60 border-white/40 hover:bg-white/80 transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold mb-1">{deal.name}</h3>
                <Badge className={getStageColor(deal.stage)}>
                  {deal.stage}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{deal.value}</p>
                <p className="text-xs text-muted-foreground">Close: {deal.closeDate}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                View
              </button>
              <button className="flex-1 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                Update
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DealsTile;

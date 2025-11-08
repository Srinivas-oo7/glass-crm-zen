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
    <div className="glass-tile gradient-deals p-4 hover-scale h-full flex flex-col overflow-hidden">
      <h2 className="text-base font-semibold mb-2">Deals</h2>
      
      <div className="overflow-auto custom-scrollbar flex-1 space-y-2">
        {deals.map((deal) => (
          <Card
            key={deal.id}
            className="p-2 bg-white/60 border-white/40 hover:bg-white/80 transition-all"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs mb-1 truncate">{deal.name}</h3>
                <Badge className={`${getStageColor(deal.stage)} text-xs`}>
                  {deal.stage}
                </Badge>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">{deal.value}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{deal.closeDate}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DealsTile;

import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardTile = () => {
  const kpis = [
    { label: "Total Leads / Contacts", value: "1,234", icon: Users, color: "text-primary" },
    { label: "Active Deals", value: "42", icon: TrendingUp, color: "text-success" },
    { label: "Upcoming Follow-ups", value: "18", icon: Calendar, color: "text-warning" },
    { label: "Revenue Pipeline", value: "$487K", icon: DollarSign, color: "text-primary" },
  ];

  const activities = [
    { type: "Email", contact: "Alice Johnson", time: "10 mins ago" },
    { type: "Call", contact: "Bob Smith", time: "1 hour ago" },
    { type: "Note", contact: "Carol White", time: "2 hours ago" },
    { type: "Meeting", contact: "David Brown", time: "3 hours ago" },
    { type: "Email", contact: "Eve Wilson", time: "5 hours ago" },
  ];

  return (
    <div className="glass-tile gradient-dashboard p-4 hover-scale h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3">Dashboard</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-3 bg-white/60 border-white/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        <Card className="p-3 bg-white/60 border-white/40">
          <h3 className="text-xs font-medium mb-2">Sales Funnel</h3>
          <div className="space-y-1.5">
            {[
              { stage: "Lead", value: 60 },
              { stage: "Qualified", value: 45 },
              { stage: "Proposal", value: 30 },
            ].map((stage) => (
              <div key={stage.stage}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span>{stage.stage}</span>
                  <span>{stage.value}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${stage.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-3 bg-white/60 border-white/40">
          <h3 className="text-xs font-medium mb-2">Revenue</h3>
          <div className="space-y-2">
            {[
              { stage: "Discovery", amount: "$120K" },
              { stage: "Proposal", amount: "$180K" },
              { stage: "Negotiation", amount: "$187K" },
            ].map((stage) => (
              <div key={stage.stage} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{stage.stage}</span>
                <span className="text-sm font-semibold">{stage.amount}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTile;

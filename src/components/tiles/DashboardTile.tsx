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
    <div className="glass-tile gradient-dashboard p-6 space-y-6 hover-scale h-full overflow-auto custom-scrollbar">
      <div>
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="p-4 bg-white/60 border-white/40">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-white/60 border-white/40">
            <h3 className="text-sm font-medium mb-3">Sales Funnel</h3>
            <div className="space-y-2">
              {[
                { stage: "Lead", value: 60 },
                { stage: "Qualified", value: 45 },
                { stage: "Proposal", value: 30 },
                { stage: "Closed", value: 15 },
              ].map((stage) => (
                <div key={stage.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{stage.stage}</span>
                    <span>{stage.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${stage.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-white/60 border-white/40">
            <h3 className="text-sm font-medium mb-3">Revenue by Stage</h3>
            <div className="space-y-3">
              {[
                { stage: "Discovery", amount: "$120K" },
                { stage: "Proposal", amount: "$180K" },
                { stage: "Negotiation", amount: "$187K" },
              ].map((stage) => (
                <div key={stage.stage} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{stage.stage}</span>
                  <span className="font-semibold">{stage.amount}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-4 bg-white/60 border-white/40 mb-6">
          <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                    {activity.type}
                  </span>
                  <span>{activity.contact}</span>
                </div>
                <span className="text-muted-foreground text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button className="flex-1 bg-primary hover:bg-primary/90 rounded-xl">
            + Add Contact
          </Button>
          <Button className="flex-1 bg-primary hover:bg-primary/90 rounded-xl">
            + Add Deal
          </Button>
          <Button variant="outline" className="flex-1 border-primary/20 hover:bg-secondary/50 rounded-xl">
            Import Data
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardTile;

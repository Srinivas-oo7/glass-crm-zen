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
    <div className="widget-card p-5 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-white">Dashboard</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-black/30 rounded-xl p-4 border border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/50 mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
              </div>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold mb-3 text-white">Sales Funnel</h3>
          <div className="space-y-3">
            {[
              { stage: "Lead", value: 60 },
              { stage: "Qualified", value: 45 },
              { stage: "Proposal", value: 30 },
            ].map((stage) => (
              <div key={stage.stage}>
                <div className="flex justify-between text-xs mb-1 text-white/70">
                  <span>{stage.stage}</span>
                  <span>{stage.value}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${stage.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold mb-3 text-white">Revenue</h3>
          <div className="space-y-3">
            {[
              { stage: "Discovery", amount: "$120K" },
              { stage: "Proposal", amount: "$180K" },
              { stage: "Negotiation", amount: "$187K" },
            ].map((stage) => (
              <div key={stage.stage} className="flex justify-between items-center">
                <span className="text-xs text-white/50">{stage.stage}</span>
                <span className="text-sm font-bold text-white">{stage.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTile;

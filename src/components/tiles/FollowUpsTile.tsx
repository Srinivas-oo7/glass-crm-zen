import { Card } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";

interface FollowUp {
  id: number;
  name: string;
  date: string;
  time: string;
  aiSuggestion: string;
  urgency: "high" | "medium" | "low";
}

const FollowUpsTile = () => {
  const followUps: FollowUp[] = [
    { id: 1, name: "Alice Johnson", date: "2025-11-09", time: "10:00 AM", aiSuggestion: "Send pricing proposal", urgency: "high" },
    { id: 2, name: "Bob Smith", date: "2025-11-10", time: "2:00 PM", aiSuggestion: "Schedule demo call", urgency: "medium" },
    { id: 3, name: "Carol White", date: "2025-11-11", time: "11:00 AM", aiSuggestion: "Follow up on contract", urgency: "high" },
    { id: 4, name: "David Brown", date: "2025-11-12", time: "3:30 PM", aiSuggestion: "Send case studies", urgency: "low" },
    { id: 5, name: "Eve Wilson", date: "2025-11-13", time: "9:00 AM", aiSuggestion: "Check on decision timeline", urgency: "medium" },
  ];

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "border-l-4 border-destructive bg-destructive/5";
      case "medium":
        return "border-l-4 border-warning bg-warning/5";
      case "low":
        return "border-l-4 border-success bg-success/5";
      default:
        return "";
    }
  };

  return (
    <div className="glass-tile gradient-followups p-4 hover-scale h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3">Follow-ups</h2>
      
      <div className="space-y-2 overflow-auto custom-scrollbar flex-1">
        {followUps.slice(0, 4).map((followUp) => (
          <Card
            key={followUp.id}
            className={`p-3 bg-white/60 border-white/40 hover:bg-white/80 transition-all ${getUrgencyStyles(followUp.urgency)}`}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-sm">{followUp.name}</h3>
              {followUp.urgency === "high" && (
                <AlertCircle className="h-3 w-3 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
              <Clock className="h-3 w-3" />
              <span>{followUp.date} at {followUp.time}</span>
            </div>
            <p className="text-xs text-primary">{followUp.aiSuggestion}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FollowUpsTile;

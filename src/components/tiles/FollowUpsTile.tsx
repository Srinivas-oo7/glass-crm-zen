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
    <div className="glass-tile gradient-followups p-6 hover-scale h-full overflow-auto custom-scrollbar">
      <h2 className="text-xl font-semibold mb-4">Follow-ups</h2>
      
      <div className="space-y-3">
        {followUps.map((followUp) => (
          <Card
            key={followUp.id}
            className={`p-4 bg-white/60 border-white/40 hover:bg-white/80 transition-all ${getUrgencyStyles(followUp.urgency)}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{followUp.name}</h3>
              {followUp.urgency === "high" && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span>{followUp.date} at {followUp.time}</span>
            </div>
            <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm">
                <span className="font-medium text-primary">AI Suggestion: </span>
                {followUp.aiSuggestion}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FollowUpsTile;

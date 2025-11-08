import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

const TodaysTasksTile = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Send proposal to Alice Johnson", completed: false, priority: "high" },
    { id: 2, text: "Schedule demo with Bob Smith", completed: true, priority: "medium" },
    { id: 3, text: "Follow up on contract with Carol", completed: false, priority: "high" },
    { id: 4, text: "Review deals closing this week", completed: false, priority: "medium" },
    { id: 5, text: "Update CRM data for Q4", completed: true, priority: "low" },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-destructive";
      case "medium":
        return "border-l-warning";
      case "low":
        return "border-l-success";
      default:
        return "";
    }
  };

  return (
    <div className="glass-tile gradient-ai p-4 hover-scale h-full flex flex-col overflow-hidden">
      <h2 className="text-base font-semibold mb-2">Today's Tasks</h2>
      
      <div className="overflow-auto custom-scrollbar flex-1 space-y-2">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`p-2 bg-white/60 border-white/40 border-l-4 ${getPriorityColor(task.priority)} hover:bg-white/80 transition-all cursor-pointer`}
            onClick={() => toggleTask(task.id)}
          >
            <div className="flex items-center gap-2">
              {task.completed ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <p className={`text-xs flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.text}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t border-white/30 shrink-0">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{tasks.filter(t => t.completed).length}/{tasks.length}</span>
          <span>{tasks.filter(t => !t.completed && t.priority === "high").length} high</span>
        </div>
      </div>
    </div>
  );
};

export default TodaysTasksTile;

import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const CalendarTile = () => {
  const [currentMonth] = useState("November 2025");
  
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates = [
    [null, null, null, null, null, 1, 2],
    [3, 4, 5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21, 22, 23],
    [24, 25, 26, 27, 28, 29, 30],
  ];

  const highlightedDates = [9, 10, 11, 12, 15, 18, 20, 25];
  const today = 8;

  return (
    <div className="glass-tile gradient-calendar p-6 hover-scale h-full overflow-auto custom-scrollbar">
      <h2 className="text-xl font-semibold mb-4">Calendar</h2>
      
      <Card className="p-4 bg-white/60 border-white/40">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">{currentMonth}</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {days.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dates.flat().map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} />;
            }
            
            const isToday = date === today;
            const isHighlighted = highlightedDates.includes(date);
            
            return (
              <button
                key={date}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                  ${isToday ? "bg-primary text-primary-foreground" : ""}
                  ${isHighlighted && !isToday ? "bg-primary/10 text-primary" : ""}
                  ${!isToday && !isHighlighted ? "hover:bg-muted" : ""}
                `}
              >
                {date}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-white/40">
          <h4 className="text-sm font-medium mb-3">Upcoming Events</h4>
          <div className="space-y-2">
            {[
              { date: "Nov 9", event: "Follow-up: Alice J." },
              { date: "Nov 10", event: "Demo: Bob Smith" },
              { date: "Nov 11", event: "Contract: Carol W." },
            ].map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.date}</span>
                <span className="font-medium">{item.event}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CalendarTile;

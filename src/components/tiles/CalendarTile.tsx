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
    <div className="glass-tile gradient-calendar p-4 hover-scale h-full flex flex-col overflow-hidden">
      <h2 className="text-base font-semibold mb-2">Calendar</h2>
      
      <div className="overflow-auto custom-scrollbar flex-1">
        <Card className="p-2 bg-white/60 border-white/40">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <h3 className="font-semibold text-xs">{currentMonth}</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {days.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                {day.slice(0, 1)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-2">
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
                    aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all
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

          <div className="pt-2 border-t border-white/40">
            <h4 className="text-xs font-medium mb-1.5">Upcoming</h4>
            <div className="space-y-1">
              {[
                { date: "9th", event: "Alice J." },
                { date: "10th", event: "Bob S." },
                { date: "11th", event: "Carol W." },
              ].map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.date}</span>
                  <span className="font-medium truncate ml-2">{item.event}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CalendarTile;

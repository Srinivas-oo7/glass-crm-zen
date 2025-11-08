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
    <div className="widget-card p-5 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-white">Calendar</h2>
      
      <div className="bg-black/30 rounded-xl p-4 border border-white/10 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 text-white">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-bold text-base text-white">{currentMonth}</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10 text-white">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {days.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-white/50">
              {day.slice(0, 1)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
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
                  ${isToday ? "bg-blue-500 text-white shadow-lg" : ""}
                  ${isHighlighted && !isToday ? "bg-white/10 text-white" : "text-white/60"}
                  ${!isToday && !isHighlighted ? "hover:bg-white/5" : ""}
                `}
              >
                {date}
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-white/10">
          <h4 className="text-sm font-semibold mb-3 text-white">Upcoming</h4>
          <div className="space-y-2">
            {[
              { date: "Nov 9", event: "Alice J." },
              { date: "Nov 10", event: "Bob Smith" },
            ].map((item, index) => (
              <div key={index} className="flex justify-between text-sm bg-white/5 rounded-lg p-2">
                <span className="text-white/50">{item.date}</span>
                <span className="font-medium text-white truncate ml-2">{item.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTile;

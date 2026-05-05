"use client";

import { useState } from "react";
import { useSubscriptionStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarGrid() {
  const { subscriptions, settings } = useSubscriptionStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const baseCurrency = settings?.base_currency || "INR";
  
  // Calculate days in month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Get active subscriptions that have payments this month
  // Note: For simplicity, we'll map their next_payment day if it's monthly
  const activeSubs = subscriptions.filter(s => s.status === "active");
  
  const getSubsForDay = (day: number) => {
    return activeSubs.filter(sub => {
      const d = new Date(sub.next_payment);
      // Mock logic: if cycle is monthly, it hits every month on this date
      return d.getDate() === day;
    });
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border mb-px">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="bg-surface p-2 text-center text-xs font-semibold text-muted uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border border-b border-border">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-surface min-h-[100px] opacity-50" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          const daySubs = getSubsForDay(day);
          const totalCost = daySubs.reduce((acc, s) => acc + s.cost, 0);

          return (
            <div 
              key={day} 
              className={`bg-surface min-h-[100px] p-2 relative group hover:bg-surface-2 transition-colors ${isToday ? "border border-amber ring-1 ring-inset ring-amber" : ""}`}
            >
              <span className={`text-sm font-semibold ${isToday ? "text-amber" : "text-muted"} group-hover:text-text transition-colors`}>
                {day}
              </span>
              
              <div className="mt-2 space-y-1">
                {daySubs.map(s => (
                  <div 
                    key={s.id} 
                    className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium border border-[rgba(240,246,252,0.05)]"
                    style={{ background: `${s.logo_color}20`, color: s.logo_color || "var(--color-text)", borderColor: `${s.logo_color}40` }}
                    title={s.name}
                  >
                    {s.name}
                  </div>
                ))}
              </div>
              
              {daySubs.length > 0 && (
                <div className="absolute bottom-2 right-2 text-[10px] font-bold text-amber">
                  {formatCurrency(totalCost, baseCurrency, true)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

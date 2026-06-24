"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import { getPaymentStatus } from "@/lib/payment-status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CURRENCY_SYMBOLS } from "@/lib/currency";

import { Logo } from "@/components/Logo";

interface Subscription {
  id: string; name: string; cost: string; currency: string;
  nextPayment: string; status: string;
}

export default function CalendarPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions?status=all")
      .then((r) => r.json())
      .then((d) => setSubscriptions(d.subscriptions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart); // 0=Sun

  function getSubsForDate(date: Date) {
    return subscriptions.filter((s) => isSameDay(new Date(s.nextPayment), date));
  }

  function getDotColor(sub: Subscription) {
    return getPaymentStatus(sub.nextPayment).color;
  }

  const selectedSubs = selectedDate ? getSubsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton h-8 w-32 mb-6" />
        <div className="card skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Payment Calendar</h1>

      <div className="card">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-70 transition-opacity" style={{ color: "var(--text-secondary)", backgroundColor: "var(--tag-bg)" }}>
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-70 transition-opacity" style={{ color: "var(--text-secondary)", backgroundColor: "var(--tag-bg)" }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: "var(--text-secondary)" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty offset cells */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`offset-${i}`} className="min-h-[100px] md:min-h-[120px]" />
          ))}

          {days.map((day) => {
            const subs = getSubsForDate(day);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const inMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toISOString()}
                onClick={() => subs.length > 0 && setSelectedDate(isSameDay(day, selectedDate ?? new Date(0)) ? null : day)}
                className="min-h-[100px] md:min-h-[120px] p-1.5 rounded-lg transition-colors relative flex flex-col"
                style={{
                  cursor: subs.length > 0 ? "pointer" : "default",
                  backgroundColor: isSelected ? "var(--tag-bg)" : isCurrentDay ? "rgba(13,115,119,0.06)" : "transparent",
                  border: isCurrentDay ? "1px solid var(--primary)" : "1px solid transparent",
                  opacity: inMonth ? 1 : 0.3,
                }}
              >
                <span className="text-xs font-semibold mb-1" style={{ color: isCurrentDay ? "var(--primary)" : "var(--text-primary)" }}>
                  {format(day, "d")}
                </span>
                
                {/* Compact Chips */}
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] md:max-h-[100px] scrollbar-hide">
                  {subs.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="flex items-center gap-1.5 px-1.5 py-1 rounded shadow-sm border"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                    >
                      <Logo name={sub.name} className="w-3.5 h-3.5 rounded-[3px] object-contain flex-shrink-0" />
                      <div className="min-w-0 flex-1 flex flex-col">
                        <span className="text-[10px] font-bold truncate leading-tight" style={{ color: "var(--text-primary)" }}>{sub.name}</span>
                        <span className="text-[9px] font-mono leading-tight truncate" style={{ color: "var(--text-secondary)" }}>
                          {CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover for selected date */}
      {selectedDate && selectedSubs.length > 0 && (
        <div className="card mt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
              {format(selectedDate, "EEEE, MMMM d")}
            </h3>
            <button onClick={() => setSelectedDate(null)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
              <X size={15} />
            </button>
          </div>
          <div className="space-y-2">
            {selectedSubs.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: "var(--tag-bg)" }}>
                <div>
                  <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{sub.name}</p>
                  <p className="font-mono text-sm font-bold mt-0.5" style={{ color: "var(--primary)" }}>
                    {CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}
                  </p>
                </div>
                <StatusBadge nextPayment={sub.nextPayment} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

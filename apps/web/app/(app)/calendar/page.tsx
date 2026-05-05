import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="animate-fade-in pb-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[rgba(88,166,255,0.15)] flex items-center justify-center">
          <CalendarDays size={20} color="#58A6FF" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text">Calendar</h1>
        </div>
      </div>
      <p className="text-muted text-sm mb-8 ml-14">Get a bird's-eye view of your payment schedule.</p>

      <CalendarGrid />
    </div>
  );
}

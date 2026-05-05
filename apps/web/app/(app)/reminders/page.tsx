import { OverdueCluster } from "@/components/reminders/OverdueCluster";
import { UpcomingCluster } from "@/components/reminders/UpcomingCluster";
import { BellRing } from "lucide-react";

export default function RemindersPage() {
  return (
    <div className="animate-fade-in pb-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.15)] flex items-center justify-center">
          <BellRing size={20} color="#F5A623" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text">Reminders</h1>
        </div>
      </div>
      <p className="text-muted text-sm mb-8 ml-14">Stay on top of your upcoming payments and avoid surprises.</p>

      <div className="max-w-4xl">
        <OverdueCluster />
        <UpcomingCluster />
      </div>
    </div>
  );
}

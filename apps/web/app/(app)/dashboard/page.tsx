import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { KPIChips } from "@/components/dashboard/KPIChips";
import { SpendDonut } from "@/components/dashboard/SpendDonut";
import { UpcomingCards } from "@/components/dashboard/UpcomingCards";
import { BudgetBar } from "@/components/dashboard/BudgetBar";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in pb-12">
      <GreetingHeader />
      <KPIChips />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <SpendDonut />
        </div>
        <div className="space-y-6">
          <BudgetBar />
          <UpcomingCards />
        </div>
      </div>
    </div>
  );
}

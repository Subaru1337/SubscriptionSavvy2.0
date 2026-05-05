import { TrendLine } from "@/components/analytics/TrendLine";
import { CategoryBars } from "@/components/analytics/CategoryBars";
import { StatCards } from "@/components/analytics/StatCards";
import { BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="animate-fade-in pb-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[rgba(42,157,143,0.15)] flex items-center justify-center">
          <BarChart2 size={20} color="#2A9D8F" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text">Analytics</h1>
        </div>
      </div>
      <p className="text-muted text-sm mb-8 ml-14">Deep dive into your spending habits and financial trends.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendLine />
        </div>
        
        <div className="space-y-6">
          <StatCards />
        </div>
        
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryBars />
          </div>
        </div>
      </div>
    </div>
  );
}

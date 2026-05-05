"use client";

import { useSubscriptionStore } from "@/lib/store";
import { formatCurrency, getUrgency, formatDate, CATEGORY_ICONS, billingLabel } from "@/lib/utils";
import { UrgencyPill } from "@/components/ui/UrgencyPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar } from "lucide-react";
import * as LucideIcons from "lucide-react";

export function UpcomingCards() {
  const { subscriptions, settings } = useSubscriptionStore();
  
  const upcoming = subscriptions
    .filter((s) => s.status === "active")
    .sort((a, b) => new Date(a.next_payment).getTime() - new Date(b.next_payment).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <div className="card p-6 h-full flex flex-col">
        <h3 className="text-title mb-4">Upcoming Payments</h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Calendar}
            title="No Upcoming Payments"
            description="You don't have any active subscriptions tracked yet."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 h-full">
      <h3 className="text-title mb-6">Upcoming Payments</h3>
      <div className="space-y-4">
        {upcoming.map((sub, i) => {
          const urgency = getUrgency(sub.next_payment);
          const iconName = CATEGORY_ICONS[sub.category] || "grid";
          
          // Helper to get lucide icon by string name (converting kebab-case to PascalCase might be tricky,
          // so we use a simpler approach or just default icons if direct map fails, but our map matches lucide names mostly if PascalCased)
          // For simplicity in this demo, we'll map a few common ones directly or use fallback
          let IconCmp = LucideIcons.Grid;
          if (iconName === 'play-circle') IconCmp = LucideIcons.PlayCircle;
          else if (iconName === 'briefcase') IconCmp = LucideIcons.Briefcase;
          else if (iconName === 'heart') IconCmp = LucideIcons.Heart;
          else if (iconName === 'cloud') IconCmp = LucideIcons.Cloud;
          else if (iconName === 'trending-up') IconCmp = LucideIcons.TrendingUp;
          else if (iconName === 'book') IconCmp = LucideIcons.Book;
          else if (iconName === 'users') IconCmp = LucideIcons.Users;
          else if (iconName === 'gamepad-2') IconCmp = LucideIcons.Gamepad2;
          else if (iconName === 'utensils') IconCmp = LucideIcons.Utensils;

          return (
            <div 
              key={sub.id} 
              className={`flex items-center justify-between p-3 rounded-xl border border-[rgba(240,246,252,0.05)] bg-[rgba(240,246,252,0.02)] animate-slide-up stagger-${(i + 1) as 1|2|3|4|5|6}`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: sub.logo_color || "var(--color-surface-2)" }}
                >
                  {sub.logo_color ? sub.name.substring(0,1).toUpperCase() : <IconCmp size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text">{sub.name}</p>
                    <UrgencyPill level={urgency} />
                  </div>
                  <p className="text-xs text-muted">{formatDate(sub.next_payment, true)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-text">
                  {formatCurrency(sub.cost, sub.currency)}
                </p>
                <p className="text-xs text-muted">{billingLabel(sub.billing_cycle)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useSubscriptionStore, Subscription } from "@/lib/store";
import { formatCurrency, getUrgency, formatDate, CATEGORY_ICONS } from "@/lib/utils";
import { UrgencyPill } from "@/components/ui/UrgencyPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell, CheckCircle2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function UpcomingCluster() {
  const { subscriptions, updateSubscription } = useSubscriptionStore();
  const [markedPaidId, setMarkedPaidId] = useState<string | null>(null);

  const upcoming = subscriptions
    .filter(s => s.status === "active")
    .map(s => ({ ...s, urgency: getUrgency(s.next_payment) }))
    .filter(s => s.urgency !== "overdue" && s.urgency !== "normal") // today, soon, upcoming
    .sort((a, b) => new Date(a.next_payment).getTime() - new Date(b.next_payment).getTime());

  if (upcoming.length === 0) {
    return (
      <div className="card p-12">
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="You don't have any upcoming payments in the next 7 days."
        />
      </div>
    );
  }

  const handleMarkPaid = (sub: Subscription) => {
    setMarkedPaidId(sub.id);
    setTimeout(() => {
      const date = new Date(sub.next_payment);
      if (sub.billing_cycle === 'monthly') date.setMonth(date.getMonth() + 1);
      else if (sub.billing_cycle === 'yearly') date.setFullYear(date.getFullYear() + 1);
      else if (sub.billing_cycle === 'weekly') date.setDate(date.getDate() + 7);
      
      updateSubscription(sub.id, { next_payment: date.toISOString().split('T')[0] });
      setMarkedPaidId(null);
    }, 600);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-text mb-4">Upcoming Next 7 Days</h2>
      <div className="space-y-3">
        <AnimatePresence>
          {upcoming.map((sub, i) => {
            const iconName = CATEGORY_ICONS[sub.category] || "grid";
            let IconCmp = LucideIcons.Grid;
            if (iconName === 'play-circle') IconCmp = LucideIcons.PlayCircle;
            else if (iconName === 'briefcase') IconCmp = LucideIcons.Briefcase;

            const isMarked = markedPaidId === sub.id;

            return (
              <motion.div 
                key={sub.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, scale: isMarked ? 1.01 : 1 }}
                exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
                className={`card p-4 flex justify-between items-center transition-colors ${
                  isMarked ? 'bg-[rgba(63,185,80,0.1)] border-[rgba(63,185,80,0.3)]' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                    style={{ background: sub.logo_color || "var(--color-surface-2)" }}
                  >
                    {sub.logo_color ? sub.name[0].toUpperCase() : <IconCmp size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-text">{sub.name}</p>
                      <UrgencyPill level={sub.urgency} />
                    </div>
                    <p className="text-xs text-muted">
                      Due {formatDate(sub.next_payment, true)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="font-bold text-text">{formatCurrency(sub.cost, sub.currency)}</p>
                  </div>
                  <button 
                    onClick={() => handleMarkPaid(sub)}
                    disabled={isMarked}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-[rgba(240,246,252,0.1)] hover:border-amber hover:bg-amber/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={20} className={isMarked ? "text-success" : "text-muted"} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

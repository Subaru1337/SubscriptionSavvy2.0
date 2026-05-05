"use client";

import { useSubscriptionStore, Subscription } from "@/lib/store";
import { formatCurrency, getUrgency, formatDate, CATEGORY_ICONS } from "@/lib/utils";
import { UrgencyPill } from "@/components/ui/UrgencyPill";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function OverdueCluster() {
  const { subscriptions, updateSubscription } = useSubscriptionStore();
  const [markedPaidId, setMarkedPaidId] = useState<string | null>(null);

  const overdue = subscriptions.filter(s => 
    s.status === "active" && getUrgency(s.next_payment) === "overdue"
  );

  if (overdue.length === 0) return null;

  const handleMarkPaid = (sub: Subscription) => {
    setMarkedPaidId(sub.id);
    setTimeout(() => {
      // Advance next payment by cycle length
      const date = new Date(sub.next_payment);
      if (sub.billing_cycle === 'monthly') date.setMonth(date.getMonth() + 1);
      else if (sub.billing_cycle === 'yearly') date.setFullYear(date.getFullYear() + 1);
      else if (sub.billing_cycle === 'weekly') date.setDate(date.getDate() + 7);
      
      updateSubscription(sub.id, { next_payment: date.toISOString().split('T')[0] });
      setMarkedPaidId(null);
    }, 600);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-danger" size={20} />
        <h2 className="text-xl font-bold text-danger">Overdue Attention</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {overdue.map((sub, i) => {
            const iconName = CATEGORY_ICONS[sub.category] || "grid";
            let IconCmp = LucideIcons.Grid;
            if (iconName === 'play-circle') IconCmp = LucideIcons.PlayCircle;
            else if (iconName === 'briefcase') IconCmp = LucideIcons.Briefcase;
            else if (iconName === 'heart') IconCmp = LucideIcons.Heart;
            else if (iconName === 'cloud') IconCmp = LucideIcons.Cloud;

            const isMarked = markedPaidId === sub.id;

            return (
              <motion.div 
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: isMarked ? 1.02 : 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`p-4 rounded-xl border border-[rgba(248,81,73,0.3)] flex justify-between items-center transition-colors ${
                  isMarked ? 'bg-[rgba(63,185,80,0.15)] border-[rgba(63,185,80,0.4)]' : 'bg-[rgba(248,81,73,0.05)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: sub.logo_color || "var(--color-surface-2)" }}
                  >
                    {sub.logo_color ? sub.name[0].toUpperCase() : <IconCmp size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-text mb-0.5">{sub.name}</p>
                    <p className="text-xs font-semibold text-danger">
                      Due {formatDate(sub.next_payment)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-text">{formatCurrency(sub.cost, sub.currency)}</p>
                  </div>
                  <button 
                    onClick={() => handleMarkPaid(sub)}
                    disabled={isMarked}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-2 border border-border hover:border-amber transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} className={isMarked ? "text-success" : "text-muted"} />
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

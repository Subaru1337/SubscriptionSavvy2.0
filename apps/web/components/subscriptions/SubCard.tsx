"use client";

import { useSubscriptionStore, Subscription } from "@/lib/store";
import { formatCurrency, getUrgency, formatDate, CATEGORY_ICONS, billingLabel } from "@/lib/utils";
import { UrgencyPill } from "@/components/ui/UrgencyPill";
import * as LucideIcons from "lucide-react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SubCardProps {
  sub: Subscription;
  index: number;
}

export function SubCard({ sub, index }: SubCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { removeSubscription } = useSubscriptionStore();
  const urgency = getUrgency(sub.next_payment);
  
  const iconName = CATEGORY_ICONS[sub.category] || "grid";
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
    <div className={`card p-5 hover:border-amber transition-colors stagger-${Math.min((index % 6) + 1, 6) as any} animate-slide-up relative group`}>
      <div className="flex justify-between items-start mb-4">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
          style={{ background: sub.logo_color || "var(--color-surface-2)" }}
        >
          {sub.logo_color ? sub.name.substring(0,1).toUpperCase() : <IconCmp size={24} />}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-muted transition-colors cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-32 glass rounded-xl shadow-xl z-50 overflow-hidden border border-[rgba(240,246,252,0.1)] py-1"
                >
                  <button className="w-full text-left px-3 py-2 text-sm text-text hover:bg-white/5 flex items-center gap-2 cursor-pointer transition-colors">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => { removeSubscription(sub.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <h3 className="text-title text-text font-bold mb-1">{sub.name}</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted capitalize bg-surface-2 px-2 py-0.5 rounded-md border border-[rgba(240,246,252,0.05)]">
          {sub.category}
        </span>
        {sub.status !== "active" && (
          <span className="text-xs text-muted capitalize bg-surface-2 px-2 py-0.5 rounded-md border border-[rgba(240,246,252,0.05)]">
            {sub.status}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-amber leading-none mb-1">
            {formatCurrency(sub.cost, sub.currency)}
          </p>
          <p className="text-xs text-muted">
            {billingLabel(sub.billing_cycle)}
          </p>
        </div>
        
        <div className="text-right flex flex-col items-end gap-1">
          <UrgencyPill level={urgency} />
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider">
            {formatDate(sub.next_payment, true)}
          </p>
        </div>
      </div>
      
      {sub.trial_ends_on && (
        <div className="mt-4 p-2 rounded-lg bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)] flex justify-between items-center text-xs">
          <span className="text-amber">Trial ends</span>
          <span className="font-bold text-amber">{formatDate(sub.trial_ends_on, true)}</span>
        </div>
      )}
    </div>
  );
}

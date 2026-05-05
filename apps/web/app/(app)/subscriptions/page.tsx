"use client";

import { useState } from "react";
import { useSubscriptionStore } from "@/lib/store";
import { SubGrid } from "@/components/subscriptions/SubGrid";
import { FilterChips } from "@/components/subscriptions/FilterChips";
import { AddSubModal } from "@/components/subscriptions/AddSubModal";
import { Plus } from "lucide-react";

export default function SubscriptionsPage() {
  const { subscriptions } = useSubscriptionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeCycle, setActiveCycle] = useState<string | null>(null);

  const categories = Array.from(new Set(subscriptions.map(s => s.category)));
  const cycles = Array.from(new Set(subscriptions.map(s => s.billing_cycle)));

  const filteredSubs = subscriptions.filter(s => {
    if (activeCategory && s.category !== activeCategory) return false;
    if (activeCycle && s.billing_cycle !== activeCycle) return false;
    return true;
  });

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-text mb-1">Subscriptions</h1>
          <p className="text-muted text-sm">Manage and track all your active recurring payments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary px-5 py-2.5 shadow-amber-glow"
        >
          <Plus size={18} /> Add Subscription
        </button>
      </div>

      <FilterChips 
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        cycles={cycles}
        activeCycle={activeCycle}
        onSelectCycle={setActiveCycle}
      />

      <SubGrid subscriptions={filteredSubs} />

      <AddSubModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

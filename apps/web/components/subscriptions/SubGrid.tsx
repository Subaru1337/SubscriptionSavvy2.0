"use client";

import { Subscription } from "@/lib/store";
import { SubCard } from "./SubCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Grid } from "lucide-react";

interface SubGridProps {
  subscriptions: Subscription[];
}

export function SubGrid({ subscriptions }: SubGridProps) {
  if (subscriptions.length === 0) {
    return (
      <div className="card p-12 mt-6">
        <EmptyState
          icon={Grid}
          title="No subscriptions found"
          description="You don't have any subscriptions that match your filters."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
      {subscriptions.map((sub, i) => (
        <SubCard key={sub.id} sub={sub} index={i} />
      ))}
    </div>
  );
}

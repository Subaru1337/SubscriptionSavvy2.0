"use client";

import { useSubscriptionStore } from "@/lib/store";
import { getInitials } from "@/lib/utils";

export function GreetingHeader() {
  const { settings } = useSubscriptionStore();
  const name = settings?.display_name || "User";
  const initials = getInitials(name);
  
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <p className="text-muted text-sm mb-1">{greeting},</p>
        <h1 className="text-3xl font-bold text-text">{name}</h1>
      </div>
      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }}>
        {initials}
      </div>
    </div>
  );
}

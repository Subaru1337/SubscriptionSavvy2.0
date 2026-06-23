"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { DarkModeToggle } from "./DarkModeToggle";
import { CreditCard } from "lucide-react";
import { setFaviconBadge, clearFaviconBadge } from "@/lib/favicon-badge";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface AlertState {
  hasAlerts: boolean;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [alertState, setAlertState] = useState<AlertState>({ hasAlerts: false });

  useEffect(() => {
    function checkReminders() {
      fetch("/api/reminders/upcoming")
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.overdueCount === "number") {
            setAlertState({ hasAlerts: data.overdueCount > 0 });
            setFaviconBadge(data.overdueCount);
          }
        })
        .catch(() => {});
    }

    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000); // Check every 5 mins

    return () => {
      clearInterval(interval);
      clearFaviconBadge();
    };
  }, []);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <Sidebar hasAlerts={alertState.hasAlerts} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 border-b"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 md:hidden">
            <Image
              src="/logo.png"
              alt="SubscriptionSavvy Logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              SubSavvy
            </span>
          </div>

          <div className="hidden md:block" />
          <DarkModeToggle />
        </header>

        {/* Main content */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      <BottomNav hasAlerts={alertState.hasAlerts} />
    </div>
  );
}

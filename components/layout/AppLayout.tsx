"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { DarkModeToggle } from "./DarkModeToggle";
import { CreditCard } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface AlertState {
  hasAlerts: boolean;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [alertState, setAlertState] = useState<AlertState>({ hasAlerts: false });

  useEffect(() => {
    // Check for overdue/due-today subscriptions for badge
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((data) => {
        if (data.subscriptions) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const hasAlerts = data.subscriptions.some((s: { nextPayment: string }) => {
            const date = new Date(s.nextPayment);
            date.setHours(0, 0, 0, 0);
            return date <= today;
          });
          setAlertState({ hasAlerts });
        }
      })
      .catch(() => {});
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
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <CreditCard size={14} color="#fff" />
            </div>
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

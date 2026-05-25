"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Bell,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subscriptions", label: "Subscriptions", icon: List },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface BottomNavProps {
  hasAlerts?: boolean;
}

export function BottomNav({ hasAlerts = false }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-around">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          const showBadge = href === "/reminders" && hasAlerts;

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 cursor-pointer"
              style={{ color: isActive ? "var(--primary)" : "var(--text-secondary)" }}
            >
              <span className="relative">
                <Icon size={20} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </span>
              <span className={cn("text-xs truncate", isActive ? "font-semibold" : "")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

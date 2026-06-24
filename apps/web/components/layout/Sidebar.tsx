"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  List,
  Bell,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subscriptions", label: "Subscriptions", icon: List },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  hasAlerts?: boolean;
}

export function Sidebar({ hasAlerts = false }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <Image
          src="/icon.png"
          alt="SubscriptionSavvy Logo"
          width={32}
          height={32}
          className="rounded-lg flex-shrink-0"
        />
        {!collapsed && (
          <span className="font-bold text-base truncate" style={{ color: "var(--text-primary)" }}>
            SubSavvy
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const showBadge = href === "/reminders" && hasAlerts;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mb-1 transition-all duration-150 cursor-pointer relative group",
                isActive
                  ? "font-semibold border-l-4"
                  : "hover:bg-black/5 dark:hover:bg-white/5 border-l-4 border-transparent"
              )}
              style={
                isActive
                  ? { backgroundColor: "rgba(13, 115, 119, 0.08)", color: "var(--primary)", borderColor: "var(--primary)" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <span className="relative flex-shrink-0">
                <Icon size={18} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </span>
              {!collapsed && (
                <span className="text-sm truncate">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls: Theme & Collapse */}
      <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: "var(--text-secondary)" }}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          {!collapsed && <span className="ml-3 text-sm font-medium">Theme</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: "var(--text-secondary)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="ml-3 text-sm font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

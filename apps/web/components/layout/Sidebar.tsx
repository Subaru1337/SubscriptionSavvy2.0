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
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
          src="/logo.png"
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
                "flex items-center gap-3 px-4 py-2.5 mx-2 mb-0.5 rounded-lg transition-all duration-150 cursor-pointer relative group",
                isActive
                  ? "font-semibold"
                  : "hover:opacity-80"
              )}
              style={
                isActive
                  ? { backgroundColor: "var(--tag-bg)", color: "var(--primary)" }
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

      {/* Collapse toggle */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}

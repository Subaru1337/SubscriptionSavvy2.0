"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CreditCard, Bell, BarChart2,
  CalendarDays, Settings, CreditCard as Logo
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard"      },
  { href: "/subscriptions", icon: CreditCard,       label: "Subscriptions" },
  { href: "/reminders",     icon: Bell,             label: "Reminders"     },
  { href: "/analytics",     icon: BarChart2,        label: "Analytics"     },
  { href: "/calendar",      icon: CalendarDays,     label: "Calendar"      },
  { href: "/settings",      icon: Settings,         label: "Settings"      },
];

export function FloatingPillNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop — sticky top rail */}
      <header className="fixed top-0 left-0 right-0 z-40 hidden md:flex items-center justify-between px-8 h-[var(--nav-h)] glass border-b border-[rgba(240,246,252,0.07)]">
        <Link href="/dashboard" className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center">
            <Logo size={16} color="#000" />
          </div>
          <span className="font-bold text-sm text-text tracking-tight">SubscriptionSavvy</span>
        </Link>

        <nav className="flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                id={`nav-${label.toLowerCase()}`}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{ color: active ? "#F5A623" : "#8B949E" }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={16} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="w-28" />
      </header>

      {/* Mobile — floating bottom pill */}
      <nav
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex md:hidden items-center gap-1 px-3 py-2 glass rounded-pill"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(240,246,252,0.1)" }}
        role="navigation"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              id={`mobile-nav-${label.toLowerCase()}`}
              className="relative flex flex-col items-center justify-center cursor-pointer"
              style={{ padding: active ? "6px 14px" : "6px 10px", transition: "padding 200ms ease" }}
            >
              {active && (
                <motion.div
                  layoutId="mobile-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className="relative z-10 transition-transform duration-200"
                style={{
                  color: active ? "#F5A623" : "#8B949E",
                  transform: active ? "translateY(-1px)" : "none",
                }}
              />
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative z-10 text-[9px] font-bold mt-0.5"
                    style={{ color: "#F5A623" }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

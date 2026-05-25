import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import Link from "next/link";
import { CreditCard, TrendingUp, Bell, BarChart3, ArrowRight, Check } from "lucide-react";

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
        <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--primary)" }}>
              <CreditCard size={16} color="#fff" />
            </div>
            <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>SubscriptionSavvy</span>
          </div>
          <Link
            href="/auth"
            className="btn-secondary text-sm"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-content mx-auto px-6 pt-20 pb-16 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ backgroundColor: "var(--tag-bg)", color: "var(--primary)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Free to use · No credit card required
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6" style={{ color: "var(--text-primary)" }}>
          Stop losing money to{" "}
          <span style={{ color: "var(--primary)" }}>forgotten subscriptions</span>
        </h1>
        <p className="text-xl max-w-2xl mx-auto mb-10" style={{ color: "var(--text-secondary)" }}>
          Track every subscription, get reminded before renewals, and understand exactly where your money goes each month.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth"
            className="btn-primary text-base px-8 py-3 justify-center"
          >
            Get Started Free
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/auth"
            className="btn-secondary text-base px-8 py-3 justify-center"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Dashboard mockup */}
      <section className="max-w-content mx-auto px-6 pb-20">
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          {/* Mockup header bar */}
          <div
            className="flex items-center gap-1.5 px-4 py-3 border-b"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--tag-bg)" }}
          >
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1 mx-4">
              <div className="w-48 h-5 rounded mx-auto skeleton" />
            </div>
          </div>
          {/* Mockup content */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Monthly Spend", value: "₹4,847", color: "var(--primary)" },
                { label: "Annual Projection", value: "₹58,164", color: "var(--primary)" },
                { label: "Active Subscriptions", value: "8", color: "var(--success)" },
              ].map((kpi, i) => (
                <div key={i} className="card !py-4 !px-5">
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{kpi.label}</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
              ))}
            </div>
            {/* Budget bar mock */}
            <div className="card mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: "var(--text-secondary)" }}>Budget Usage</span>
                <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>84%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                <div className="h-full rounded-full" style={{ width: "84%", backgroundColor: "var(--primary)" }} />
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>₹4,847 of ₹5,800 monthly budget</p>
            </div>
            {/* Subscriptions preview */}
            <div className="card !p-0 overflow-hidden">
              {[
                { name: "Netflix", amount: "₹649", cycle: "Monthly", status: "Upcoming" },
                { name: "Spotify", amount: "₹119", cycle: "Monthly", status: "Due This Week" },
                { name: "ChatGPT Plus", amount: "₹1,650", cycle: "Monthly", status: "Upcoming" },
              ].map((sub, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{sub.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{sub.cycle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{sub.amount}</span>
                    <span
                      className="badge"
                      style={
                        sub.status === "Upcoming"
                          ? { backgroundColor: "rgba(46,204,122,0.1)", color: "#2ECC7A" }
                          : { backgroundColor: "rgba(20,160,133,0.1)", color: "#14A085" }
                      }
                    >{sub.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-content mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "var(--text-primary)" }}>
          Everything you need to manage subscriptions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingUp,
              title: "Track Everything",
              description: "Add all your subscriptions in seconds. Track costs across multiple currencies with real-time exchange rates.",
              points: ["12+ quick-add templates", "Multi-currency support", "Category organization"],
            },
            {
              icon: Bell,
              title: "Never Miss a Payment",
              description: "Get email reminders 3 days before renewals. See overdue payments instantly with color-coded status badges.",
              points: ["Email reminders", "Payment calendar", "Trial tracking"],
            },
            {
              icon: BarChart3,
              title: "Understand Your Spending",
              description: "Visual charts break down spending by category. Track trends over 6 months to spot savings opportunities.",
              points: ["Spending trends chart", "Category breakdown", "Budget alerts at 90%"],
            },
          ].map((feat, i) => (
            <div key={i} className="card hover:shadow-card-hover cursor-default transition-shadow">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--tag-bg)" }}
              >
                <feat.icon size={20} style={{ color: "var(--primary)" }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>{feat.title}</h3>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{feat.description}</p>
              <ul className="space-y-1.5">
                {feat.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Check size={14} style={{ color: "var(--success)" }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 text-center"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to take control of your subscriptions?
        </h2>
        <p className="text-white/80 mb-8 text-lg">
          Join thousands of users who save money every month.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 bg-white font-semibold px-8 py-3 rounded-lg transition-opacity hover:opacity-90 cursor-pointer"
          style={{ color: "var(--primary)" }}
        >
          Get Started Free
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center" style={{ borderColor: "var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          © 2025 SubscriptionSavvy. Built to help you save money.
        </p>
      </footer>
    </div>
  );
}

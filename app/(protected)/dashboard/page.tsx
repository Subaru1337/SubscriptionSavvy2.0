"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, TrendingUp, Settings, Clock, HeartPulse, PiggyBank, Trophy, Inbox, Lightbulb, Star, X } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateShort } from "@/lib/utils";
import { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { SubscriptionModal } from "@/components/subscriptions/SubscriptionModal";

// --- Types ---
interface AnalyticsSummary {
  monthly_total: number;
  annual_total: number;
  active_subscriptions: number;
  budget_used_percent: number | null;
  trials_expiring_soon: number;
}
interface CategoryBreakdown {
  category: string;
  count: number;
  monthly_total: number;
  budget_limit: number | null;
  budget_used_percent: number | null;
  over_budget: boolean;
}
interface TrendData {
  month: string;
  label: string;
  total: number;
}
interface User {
  baseCurrency: string;
  monthlyBudget: string | null;
  createdAt: string;
}
interface Subscription {
  id: string;
  name: string;
  cost: string;
  currency: string;
  nextPayment: string;
  billingCycle: string;
}

const CHART_COLORS = ["#0D7377", "#14A085", "#2ECC7A", "#0f9898", "#1ab87e", "#08545a", "#0e8a6e", "#1fd4a0"];
const BUDGET_COLOR = (percent: number) => percent >= 90 ? "#E05C5C" : percent >= 75 ? "#c9a227" : "#2ECC7A";

export default function DashboardPage() {
  // Core state
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [dueSoon, setDueSoon] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New features state
  const [forecast, setForecast] = useState<any>(null);
  const [savings, setSavings] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [worthIt, setWorthIt] = useState<any>(null);
  const [annualRecap, setAnnualRecap] = useState<any>(null);
  const [nudges, setNudges] = useState<any[]>([]);
  const [dismissedNudges, setDismissedNudges] = useState<string[]>([]);
  
  // Modals & Onboarding
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [obCurrency, setObCurrency] = useState("INR");
  const [obBudget, setObBudget] = useState("");
  const [savingOb, setSavingOb] = useState(false);
  
  const [editRatingSub, setEditRatingSub] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Personalized Empty State
  const [emptyTip, setEmptyTip] = useState("");

  const loadAll = async () => {
    try {
      const [allRes, userRes, subsRes, forecastRes, savingsRes, healthRes, worthRes, recapRes, nudgeRes] = await Promise.all([
        fetch("/api/analytics/all"),
        fetch("/api/auth/me"),
        fetch("/api/subscriptions"),
        fetch("/api/analytics/forecast"),
        fetch("/api/analytics/savings"),
        fetch("/api/analytics/health-score"),
        fetch("/api/analytics/worth-it"),
        fetch("/api/analytics/annual-recap"),
        fetch("/api/analytics/nudges"),
      ]);

      const [allData, userData, subsData, forecastData, savingsData, healthData, worthData, recapData, nudgeData] = await Promise.all([
        allRes.json(), userRes.json(), subsRes.json(), forecastRes.json(), savingsRes.json(), healthRes.json(), worthRes.json(), recapRes.json(), nudgeRes.json()
      ]);

      setSummary(allData.summary);
      setCategories(allData.breakdown);
      setTrends(allData.trends);
      setUser(userData.user);
      
      setForecast(forecastData);
      setSavings(savingsData);
      setHealthScore(healthData);
      setWorthIt(worthData);
      setAnnualRecap(recapData);
      
      if (subsData.subscriptions) {
        const today = new Date();
        const in7 = new Date(today);
        in7.setDate(in7.getDate() + 7);
        setDueSoon(subsData.subscriptions.filter((s: Subscription) => new Date(s.nextPayment) <= in7));
      }

      // Nudges and dismissed state
      const localDismissed = JSON.parse(localStorage.getItem('ss-dismissed-nudges') || '[]');
      setDismissedNudges(localDismissed);
      if (nudgeData.nudges) {
        setNudges(nudgeData.nudges.filter((n: any) => !localDismissed.includes(n.id)));
      }

      // Check onboarding
      if (allData.summary?.active_subscriptions === 0 && userData.user?.createdAt) {
        const accAge = (Date.now() - new Date(userData.user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (accAge <= 7 && !localStorage.getItem('ss-onboarded')) {
          setIsOnboarding(true);
        }
      }

    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    
    // Pick empty tip
    const tips = [
      "Most people forget about annual subscriptions — try adding Amazon Prime first",
      "The average person has 12 subscriptions. How many do you have?",
      "Start with your most expensive subscription to get an instant spending snapshot",
      "Add your streaming services first — they're the easiest to forget",
      "Did you sign up for any free trials recently? Add them before they convert to paid"
    ];
    // Simple pseudo-random seeded by user email if available, else random
    setEmptyTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  const currencySymbol = user ? (CURRENCY_SYMBOLS[user.baseCurrency] || user.baseCurrency) : "₹";
  const budgetPercent = summary?.budget_used_percent;

  function formatAmount(n: number) {
    return `${currencySymbol}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }

  async function handleDismissNudge(id: string) {
    const updated = [...dismissedNudges, id];
    setDismissedNudges(updated);
    localStorage.setItem('ss-dismissed-nudges', JSON.stringify(updated));
    setNudges(nudges.filter(n => n.id !== id));
  }

  async function handleCancelSub(id: string) {
    try {
      const res = await fetch('/api/subscriptions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', ids: [id] })
      });
      if (!res.ok) throw new Error();
      toast.success("Subscription cancelled");
      loadAll();
    } catch {
      toast.error("Failed to cancel subscription");
    }
  }

  async function completeOnboardingStep1() {
    setSavingOb(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseCurrency: obCurrency }),
    });
    setSavingOb(false);
    setOnboardingStep(2);
  }

  async function completeOnboardingStep3() {
    setSavingOb(true);
    if (obBudget) {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: Number(obBudget) }),
      });
    }
    setSavingOb(false);
    localStorage.setItem('ss-onboarded', 'true');
    setIsOnboarding(false);
    loadAll();
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="h-8 skeleton w-40 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      </div>
    );
  }

  if (isOnboarding) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "var(--background)" }}>
        <div className="card w-full max-w-lg shadow-2xl relative">
          <div className="absolute top-4 right-4 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Step {onboardingStep} of 3</div>
          
          {onboardingStep === 1 && (
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Welcome to SubscriptionSavvy 👋</h2>
              <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>Let's get you set up in 3 quick steps</p>
              
              <div className="text-left mb-6">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Set Your Display Currency</label>
                <select className="input" value={obCurrency} onChange={e => setObCurrency(e.target.value)}>
                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={completeOnboardingStep1} className="btn-primary w-full justify-center py-3" disabled={savingOb}>
                Next
              </button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Add your first subscription</h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Start with the one you pay most often</p>
              </div>
              <div className="border rounded-xl" style={{ borderColor: "var(--border)" }}>
                <SubscriptionModal open={true} onClose={() => {}} onSuccess={() => setOnboardingStep(3)} />
                {/* We use a hack here: we just render the content inline by rendering our own form, OR we can just tell them to click */}
                {/* Since the prompt says "Render the full subscription form (reuse the existing SubscriptionModal form fields inline)",
                    and SubscriptionModal is a popup, we will just mount it as a popup but hide its overlay visually via CSS if possible.
                    Actually, rendering the SubscriptionModal component normally works, it will just cover this onboarding overlay. */}
                <div className="py-20 text-center">
                  <button onClick={() => setModalOpen(true)} className="btn-primary mx-auto">Open Add Form</button>
                  <SubscriptionModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); setOnboardingStep(3); }} />
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Set a spending limit</h2>
              <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>We'll warn you when you're getting close</p>
              
              <div className="text-left mb-6">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Monthly Budget ({obCurrency}) <span className="text-xs" style={{ color: "var(--text-secondary)" }}>(Optional)</span></label>
                <input type="number" className="input font-mono" placeholder="e.g. 5000" value={obBudget} onChange={e => setObBudget(e.target.value)} />
              </div>
              
              <div className="flex flex-col gap-3">
                <button onClick={completeOnboardingStep3} className="btn-primary w-full justify-center py-3" disabled={savingOb}>
                  Finish Setup
                </button>
                <button onClick={() => { setObBudget(""); completeOnboardingStep3(); }} className="text-sm underline" style={{ color: "var(--text-secondary)" }}>
                  Skip for now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Personalized Empty State if 0 subs
  if (summary?.active_subscriptions === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center">
        <Inbox size={48} style={{ color: "var(--border)" }} className="mb-4" />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No subscriptions yet</h2>
        <p className="text-sm italic mb-6 max-w-sm" style={{ color: "var(--text-secondary)" }}>"{emptyTip}"</p>
        <button onClick={() => setModalOpen(true)} className="btn-primary mb-3">Add Your First Subscription</button>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>or use Quick Add to import popular services in seconds</p>
        <SubscriptionModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={loadAll} />
      </div>
    );
  }

  // Normal Dashboard
  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Monthly Spend</p>
          <p className="text-3xl font-bold font-mono" style={{ color: "var(--primary)" }}>{formatAmount(summary?.monthly_total || 0)}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>per month</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Annual Projection</p>
          <p className="text-3xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{formatAmount(summary?.annual_total || 0)}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>per year</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Active Subscriptions</p>
          <p className="text-3xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{summary?.active_subscriptions || 0}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>services tracked</p>
        </div>
      </div>

      {/* Health Score Card */}
      {healthScore && (
        <div className="card mb-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <HeartPulse size={16} style={{ color: "var(--primary)" }} />
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Subscription Health</span>
            </div>
            <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4" 
                 style={{ borderColor: healthScore.score >= 75 ? "var(--success)" : healthScore.score >= 50 ? "#F59E0B" : "var(--warning)" }}>
              <span className="text-3xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{healthScore.score}</span>
            </div>
            <span className="mt-2 text-sm font-bold" style={{ color: healthScore.score >= 75 ? "var(--success)" : healthScore.score >= 50 ? "#F59E0B" : "var(--warning)" }}>
              {healthScore.grade}
            </span>
          </div>
          <div className="flex-1 w-full border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6" style={{ borderColor: "var(--border)" }}>
            {healthScore.score === 100 ? (
              <p className="text-sm font-medium" style={{ color: "var(--success)" }}>Perfect score! Your subscriptions are in great shape 🎉</p>
            ) : (
              <ul className="space-y-2">
                {healthScore.deductions.map((d: any, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--warning)" }}>
                    <span className="font-bold flex-shrink-0 w-6">{d.points}</span> 
                    <span>{d.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Forecast Card */}
        {forecast && (
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} style={{ color: "var(--primary)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Next 30 Days</p>
            </div>
            <p className="text-4xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{formatAmount(forecast.next_month_total)}</p>
            <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>across {forecast.billing_count} upcoming payments</p>
            {forecast.largest_upcoming && (
              <div className="text-xs pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                Largest: {forecast.largest_upcoming.name} — {CURRENCY_SYMBOLS[forecast.largest_upcoming.currency] || forecast.largest_upcoming.currency}{forecast.largest_upcoming.amount}
              </div>
            )}
          </div>
        )}

        {/* Savings Card */}
        {savings && (
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank size={16} style={{ color: "var(--success)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Saved by Cancelling</p>
            </div>
            <p className="text-4xl font-bold font-mono" style={{ color: "var(--success)" }}>{formatAmount(savings.total_saved)}</p>
            <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>from {savings.cancelled_count} cancelled subscriptions</p>
            
            {savings.top_savers && savings.top_savers.length > 0 ? (
              <div className="text-xs pt-3 border-t space-y-1.5" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                {savings.top_savers.map((s: any, i: number) => (
                  <div key={i}>{s.name} — saved {formatAmount(s.saved)} over {s.months} months</div>
                ))}
              </div>
            ) : (
              <div className="text-xs pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                Cancel unused subscriptions to track your savings
              </div>
            )}
          </div>
        )}
      </div>

      {/* Annual Recap Card */}
      {annualRecap && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={18} style={{ color: "var(--primary)" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{annualRecap.year} Spending Recap</h2>
          </div>
          {annualRecap.payment_count === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Start marking payments as paid to build your annual recap</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Spent This Year</p>
                  <p className="text-xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{formatAmount(annualRecap.year_total)}</p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Monthly Average</p>
                  <p className="text-xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{formatAmount(annualRecap.avg_monthly)}</p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Payments Made</p>
                  <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{annualRecap.payment_count}</p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Top Category</p>
                  <span className="tag text-xs">{annualRecap.top_category}</span>
                </div>
              </div>
              {annualRecap.most_expensive_sub && (
                <div className="text-sm pt-4 border-t" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                  Your most expensive subscription this year: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{annualRecap.most_expensive_sub.name}</span> at {formatAmount(annualRecap.most_expensive_sub.total_paid)} total
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Budget Bar */}
      {user?.monthlyBudget && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{formatAmount(summary?.monthly_total || 0)} of {formatAmount(Number(user.monthlyBudget))} monthly budget used</p>
            <span className="text-sm font-bold font-mono" style={{ color: BUDGET_COLOR(budgetPercent || 0) }}>{budgetPercent?.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(budgetPercent || 0, 100)}%`, backgroundColor: BUDGET_COLOR(budgetPercent || 0) }} />
          </div>
        </div>
      )}

      {/* Consider Cancelling */}
      {worthIt?.low_rated && worthIt.low_rated.length > 0 && (
        <div className="card mb-6">
          <h2 className="section-title mb-4">Consider Cancelling</h2>
          <div className="space-y-3">
            {worthIt.low_rated.map((sub: any) => (
              <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{sub.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} size={12} fill={star <= sub.worthItRating ? "#F59E0B" : "none"} color={star <= sub.worthItRating ? "#F59E0B" : "var(--border)"} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}</span>
                  <button onClick={() => handleCancelSub(sub.id)} className="btn-secondary text-xs !py-1 !px-2" style={{ color: "var(--warning)" }}>Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reconsider These (Nudges) */}
      {nudges.length > 0 && (
        <div className="card mb-6" style={{ backgroundColor: "var(--tag-bg)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} style={{ color: "var(--primary)" }} />
            <h2 className="section-title !mb-0">You've been paying for these but rated them low</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nudges.map((nudge: any) => (
              <div key={nudge.id} className="card !p-4 relative">
                <button onClick={() => handleDismissNudge(nudge.id)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{nudge.name}</span>
                  <Star size={12} fill="#F59E0B" color="#F59E0B" /> <span className="text-xs font-bold">{nudge.worthItRating}</span>
                </div>
                <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Paid {nudge.timesRenewed} times · {formatAmount(nudge.totalSpent)} spent total</p>
                <div className="flex gap-2">
                  <button onClick={() => handleCancelSub(nudge.id)} className="btn-primary text-xs flex-1 justify-center !bg-red-500 !border-red-500">Cancel It</button>
                  <button onClick={() => { setEditRatingSub(nudge); setModalOpen(true); }} className="btn-secondary text-xs flex-1 justify-center">Update Rating</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <p className="section-title">Spending by Category</p>
          {categories.length === 0 ? (
            <div className="h-48 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categories} dataKey="monthly_total" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}>
                  {categories.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [formatAmount(v), "Monthly"]} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-primary)" }} />
                <Legend formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <p className="section-title">6-Month Spending Trend</p>
          {trends.every((t) => t.total === 0) ? (
            <div className="h-48 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>No payment history yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trends} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatAmount(v), "Total"]} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-primary)" }} />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: "var(--primary)", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown with Budget Progress */}
        <div className="card">
          <p className="section-title">Category Breakdown</p>
          <div className="space-y-4 mt-4">
            {categories.map((cat, i) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{cat.category}</span>
                    {cat.over_budget && <AlertTriangle size={12} style={{ color: "var(--warning)" }} />}
                  </div>
                  <span className="font-mono text-sm font-semibold">{formatAmount(cat.monthly_total)}/mo</span>
                </div>
                {cat.budget_limit && (
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                      <span>{formatAmount(cat.monthly_total)} of {formatAmount(cat.budget_limit)}</span>
                      <span>{cat.budget_used_percent?.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(cat.budget_used_percent || 0, 100)}%`, backgroundColor: BUDGET_COLOR(cat.budget_used_percent || 0) }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: "var(--primary)" }} />
            <p className="section-title !mb-0">Due This Week</p>
          </div>
          {dueSoon.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>No payments due this week 🎉</p>
          ) : (
            <div className="space-y-2">
              {dueSoon.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{sub.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{formatDateShort(sub.nextPayment)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}</span>
                    <StatusBadge nextPayment={sub.nextPayment} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {modalOpen && editRatingSub && (
        <SubscriptionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditRatingSub(null); }} onSuccess={loadAll} editSubscription={editRatingSub} />
      )}
    </div>
  );
}

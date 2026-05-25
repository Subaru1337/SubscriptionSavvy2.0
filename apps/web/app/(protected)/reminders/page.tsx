"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Clock, CheckCircle, Loader2, Calendar } from "lucide-react";
import { StatusBadge, TrialBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { CURRENCY_SYMBOLS } from "@/lib/currency";
import { getPaymentStatus } from "@/lib/payment-status";
import { addDays, startOfDay } from "date-fns";

interface Subscription {
  id: string; name: string; cost: string; currency: string;
  nextPayment: string; trialEndsOn?: string | null; status: string; billingCycle: string;
}

type Section = "overdue" | "today" | "tomorrow" | "week" | "upcoming";

function categorize(subs: Subscription[]): Record<Section, Subscription[]> & { trials: Subscription[] } {
  const today = startOfDay(new Date());
  const result: Record<Section, Subscription[]> & { trials: Subscription[] } = {
    overdue: [], today: [], tomorrow: [], week: [], upcoming: [], trials: [],
  };
  const in7 = addDays(today, 7);

  for (const sub of subs) {
    const status = getPaymentStatus(sub.nextPayment);
    if (status.label === "Overdue") result.overdue.push(sub);
    else if (status.label === "Due Today") result.today.push(sub);
    else if (status.label === "Due Tomorrow") result.tomorrow.push(sub);
    else if (status.label === "Due This Week") result.week.push(sub);
    else result.upcoming.push(sub);

    if (sub.trialEndsOn) {
      const trialEnd = startOfDay(new Date(sub.trialEndsOn));
      if (trialEnd >= today && trialEnd <= in7) result.trials.push(sub);
    }
  }
  return result;
}

const SECTION_CONFIG = [
  { key: "trials", label: "Trials Expiring Soon", color: "var(--warning)", bg: "rgba(224,92,92,0.08)", icon: AlertTriangle, showPay: false },
  { key: "overdue", label: "Overdue", color: "#E05C5C", bg: "rgba(224,92,92,0.06)", icon: AlertTriangle, showPay: true },
  { key: "today", label: "Due Today", color: "#E05C5C", bg: "rgba(224,92,92,0.04)", icon: Clock, showPay: true },
  { key: "tomorrow", label: "Due Tomorrow", color: "var(--primary)", bg: "rgba(13,115,119,0.04)", icon: Calendar, showPay: false },
  { key: "week", label: "Due This Week", color: "var(--primary-hover)", bg: "rgba(20,160,133,0.04)", icon: Calendar, showPay: false },
  { key: "upcoming", label: "Upcoming", color: "var(--success)", bg: "rgba(46,204,122,0.04)", icon: CheckCircle, showPay: false },
] as const;

export default function RemindersPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function markPaid(id: string) {
    setPayingId(id);
    try {
      const res = await fetch(`/api/subscriptions/${id}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Marked as paid! Next payment date updated.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally { setPayingId(null); }
  }

  const groups = categorize(subscriptions);

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton h-8 w-32 mb-6" />
        {[1,2,3].map((i) => <div key={i} className="card mb-4 skeleton h-24" />)}
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Reminders</h1>

      {subscriptions.length === 0 && (
        <div className="card text-center py-16">
          <CheckCircle size={40} className="mx-auto mb-3" style={{ color: "var(--success)" }} />
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>No active subscriptions</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Add subscriptions to see reminders</p>
        </div>
      )}

      {SECTION_CONFIG.map(({ key, label, color, bg, icon: Icon, showPay }) => {
        const items = groups[key as keyof typeof groups];
        if (items.length === 0) return null;
        return (
          <div key={key} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} style={{ color }} />
              <h2 className="text-sm font-bold" style={{ color }}>{label}</h2>
              <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: bg, color }}>{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((sub) => (
                <div key={sub.id} className="card !py-3 !px-4 flex items-center justify-between gap-3" style={{ borderColor: color + "30" }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{sub.name}</h3>
                      {sub.trialEndsOn && <TrialBadge trialEndsOn={sub.trialEndsOn} />}
                      <StatusBadge nextPayment={sub.nextPayment} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        {CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Due: {formatDate(sub.nextPayment)}</span>
                    </div>
                  </div>
                  {showPay && (
                    <button
                      onClick={() => markPaid(sub.id)}
                      disabled={payingId === sub.id}
                      className="btn-primary text-xs flex-shrink-0 !py-1.5 !px-3"
                    >
                      {payingId === sub.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      Mark Paid
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

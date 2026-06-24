"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { X, Loader2, ChevronLeft, ChevronRight, Star, AlertTriangle, ArrowUpRight } from "lucide-react";
import { CATEGORIES, BILLING_CYCLES, formatDateShort } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import confetti from "canvas-confetti";
import { Logo } from "@/components/Logo";

const QUICK_ADD_TEMPLATES = [
  { name: "Netflix", cost: 649, currency: "INR", billingCycle: "monthly", category: "Entertainment" },
  { name: "Spotify", cost: 119, currency: "INR", billingCycle: "monthly", category: "Entertainment" },
  { name: "YouTube Premium", cost: 189, currency: "INR", billingCycle: "monthly", category: "Entertainment" },
  { name: "Amazon Prime", cost: 1499, currency: "INR", billingCycle: "yearly", category: "Entertainment" },
  { name: "ChatGPT Plus", cost: 1650, currency: "INR", billingCycle: "monthly", category: "Productivity" },
  { name: "Notion", cost: 0, currency: "INR", billingCycle: "monthly", category: "Productivity" },
  { name: "Adobe Creative Cloud", cost: 1675, currency: "INR", billingCycle: "monthly", category: "Productivity" },
  { name: "AWS", cost: 0, currency: "USD", billingCycle: "monthly", category: "Developer Tools" },
  { name: "GitHub Copilot", cost: 827, currency: "INR", billingCycle: "monthly", category: "Developer Tools" },
  { name: "Coursera Plus", cost: 2652, currency: "INR", billingCycle: "yearly", category: "Education" },
  { name: "Headspace", cost: 4999, currency: "INR", billingCycle: "yearly", category: "Health" },
  { name: "Zerodha", cost: 300, currency: "INR", billingCycle: "monthly", category: "Finance" },
];

interface SubscriptionFormData {
  name: string;
  cost: string;
  currency: string;
  category: string;
  billingCycle: string;
  nextPayment: string;
  trialEndsOn: string;
  status: string;
  notes: string;
  worthItRating?: number | null;
}

interface Subscription {
  id: string;
  name: string;
  cost: string;
  currency: string;
  category: string;
  billingCycle: string;
  nextPayment: string;
  trialEndsOn?: string | null;
  status: string;
  notes?: string | null;
  worthItRating?: number | null;
  priceHistory?: any[];
}

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editSubscription?: Subscription | null;
}

const defaultForm: SubscriptionFormData = {
  name: "",
  cost: "",
  currency: "INR",
  category: "Entertainment",
  billingCycle: "monthly",
  nextPayment: new Date().toISOString().split("T")[0],
  trialEndsOn: "",
  status: "active",
  notes: "",
  worthItRating: 5,
};

export function SubscriptionModal({
  open,
  onClose,
  onSuccess,
  editSubscription,
}: SubscriptionModalProps) {
  const [form, setForm] = useState<SubscriptionFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<SubscriptionFormData>>({});
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (editSubscription) {
      let parsedNext = new Date().toISOString().split("T")[0];
      try {
        if (editSubscription.nextPayment) {
          parsedNext = new Date(editSubscription.nextPayment).toISOString().split("T")[0];
        }
      } catch (e) {}

      let parsedTrial = "";
      try {
        if (editSubscription.trialEndsOn) {
          parsedTrial = new Date(editSubscription.trialEndsOn).toISOString().split("T")[0];
        }
      } catch (e) {}

      setForm({
        name: editSubscription.name,
        cost: String(Number(editSubscription.cost) || 0),
        currency: editSubscription.currency,
        category: editSubscription.category,
        billingCycle: editSubscription.billingCycle,
        nextPayment: parsedNext,
        trialEndsOn: parsedTrial,
        status: editSubscription.status,
        notes: editSubscription.notes || "",
        worthItRating: editSubscription.worthItRating || 5,
      });

        if (editSubscription.priceHistory) {
          setPriceHistory(editSubscription.priceHistory);
        } else {
          // Fallback if not populated
          fetch(`/api/subscriptions/${editSubscription.id}/price-history`)
            .then(r => r.json())
            .then(data => {
              if (data.history) setPriceHistory(data.history);
            })
            .catch(() => {});
        }
    } else {
      setForm(defaultForm);
      setPriceHistory([]);
    }
    setErrors({});
    setDuplicateWarning(null);
  }, [editSubscription, open]);

  // Duplicate Check Debounce
  useEffect(() => {
    if (!open || editSubscription) return;
    clearTimeout(typingTimer.current);
    if (form.name.trim().length > 2) {
      typingTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/subscriptions/check-duplicate?name=${encodeURIComponent(form.name.trim())}`);
          const data = await res.json();
          if (data.isDuplicate) {
            setDuplicateWarning(`You already have a subscription to ${data.existing.name} (${data.existing.currency}${data.existing.cost}).`);
          } else {
            setDuplicateWarning(null);
          }
        } catch {
          setDuplicateWarning(null);
        }
      }, 800);
    } else {
      setDuplicateWarning(null);
    }
    return () => clearTimeout(typingTimer.current);
  }, [form.name, open, editSubscription]);

  // Smart Next Payment Date
  function updateNextPayment(cycle: string) {
    const now = new Date();
    const d = new Date(form.nextPayment);
    if (isNaN(d.getTime())) return;
    
    // Only auto-suggest if they haven't explicitly picked a far-future date manually
    if (d.getTime() < now.getTime() + (365 * 24 * 60 * 60 * 1000)) {
      const newDate = new Date();
      if (cycle === "yearly") {
        newDate.setFullYear(newDate.getFullYear() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setForm(f => ({ ...f, billingCycle: cycle, nextPayment: newDate.toISOString().split("T")[0] }));
    } else {
      setForm(f => ({ ...f, billingCycle: cycle }));
    }
  }

  function applyTemplate(t: (typeof QUICK_ADD_TEMPLATES)[number]) {
    const nextPay = new Date();
    if (t.billingCycle === "yearly") {
      nextPay.setFullYear(nextPay.getFullYear() + 1);
    } else {
      nextPay.setMonth(nextPay.getMonth() + 1);
    }
    
    setForm((f) => ({
      ...f,
      name: t.name,
      cost: String(t.cost),
      currency: t.currency,
      category: t.category,
      billingCycle: t.billingCycle,
      nextPayment: nextPay.toISOString().split("T")[0],
    }));
  }

  function validate(): boolean {
    const e: Partial<SubscriptionFormData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.cost || isNaN(Number(form.cost)) || Number(form.cost) < 0) e.cost = "Valid cost is required";
    if (!form.nextPayment) e.nextPayment = "Next payment date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const body = {
        name: form.name.trim(),
        cost: Number(form.cost),
        currency: form.currency,
        category: form.category,
        billingCycle: form.billingCycle,
        nextPayment: new Date(form.nextPayment).toISOString(),
        trialEndsOn: form.trialEndsOn ? new Date(form.trialEndsOn).toISOString() : null,
        status: form.status,
        notes: form.notes.trim() || null,
        worthItRating: form.worthItRating,
      };

      const url = editSubscription
        ? `/api/subscriptions/${editSubscription.id}`
        : "/api/subscriptions";
      const method = editSubscription ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.existing) {
          setDuplicateWarning(`You already have a subscription to ${data.existing.name} (${data.existing.currency}${data.existing.cost}). Please use a different name or edit the existing one.`);
          throw new Error("Duplicate subscription found");
        }
        throw new Error(data.error || "Failed to save subscription");
      }

      toast.success(editSubscription ? "Subscription updated!" : "Subscription added!");
      
      if (!editSubscription) {
        // Confetti for first sub! We check via local storage or by fetching
        const isFirst = localStorage.getItem("ss-first-sub-done") !== "true";
        if (isFirst) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          localStorage.setItem("ss-first-sub-done", "true");
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function scrollTemplates(dir: "left" | "right") {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-fade-in"
        style={{ backgroundColor: "var(--card)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {editSubscription ? "Edit Subscription" : "Add Subscription"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {!editSubscription && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-secondary)" }}>
                Quick Add
              </p>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => scrollTemplates("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md cursor-pointer"
                  style={{ backgroundColor: "var(--card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                >
                  <ChevronLeft size={14} />
                </button>
                <div
                  ref={scrollRef}
                  className="flex gap-2 overflow-x-auto pb-2 px-1 scroll-smooth"
                  style={{ scrollbarWidth: "none" }}
                >
                  {QUICK_ADD_TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border cursor-pointer transition-all hover:shadow-md"
                      style={{
                        borderColor: form.name === t.name ? "var(--primary)" : "var(--border)",
                        backgroundColor: form.name === t.name ? "var(--tag-bg)" : "var(--card)",
                        minWidth: 72,
                      }}
                    >
                      <Logo name={t.name} className="w-6 h-6 object-contain rounded-md" />
                      <span className="text-xs font-medium text-center leading-tight mt-1" style={{ color: "var(--text-primary)" }}>
                        {t.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => scrollTemplates("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md cursor-pointer"
                  style={{ backgroundColor: "var(--card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {duplicateWarning && (
            <div className="mb-4 p-3 rounded-lg flex gap-2 items-start text-sm" style={{ backgroundColor: "#Fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Field label="Name" required error={errors.name}>
              <input
                id="sub-name"
                type="text"
                className="input"
                placeholder="e.g. Netflix"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={errors.name ? { borderColor: "var(--warning)" } : {}}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cost" required error={errors.cost}>
                <input
                  id="sub-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input font-mono"
                  placeholder="0.00"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  style={errors.cost ? { borderColor: "var(--warning)" } : {}}
                />
              </Field>
              <Field label="Currency" required>
                <select
                  id="sub-currency"
                  className="input"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Category" required>
              <select
                id="sub-category"
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Billing Cycle <span style={{ color: "var(--warning)" }}>*</span>
              </label>
              <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {BILLING_CYCLES.map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => updateNextPayment(cycle)}
                    className="flex-1 py-2 text-sm font-medium transition-colors cursor-pointer capitalize"
                    style={
                      form.billingCycle === cycle
                        ? { backgroundColor: "var(--primary)", color: "#fff" }
                        : { backgroundColor: "var(--card)", color: "var(--text-secondary)" }
                    }
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Next Payment" required error={errors.nextPayment}>
              <input
                id="sub-next-payment"
                type="date"
                className="input"
                value={form.nextPayment}
                onChange={(e) => setForm({ ...form, nextPayment: e.target.value })}
                style={errors.nextPayment ? { borderColor: "var(--warning)" } : {}}
              />
            </Field>

            <Field label="Trial End Date">
              <input
                id="sub-trial-ends"
                type="date"
                className="input"
                value={form.trialEndsOn}
                onChange={(e) => setForm({ ...form, trialEndsOn: e.target.value })}
              />
            </Field>

            <Field label="Status" required>
              <select
                id="sub-status"
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                "Worth it?" Rating
              </label>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm(f => ({...f, worthItRating: star}))}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star size={24} fill={star <= (form.worthItRating || 0) ? "#F59E0B" : "none"} color={star <= (form.worthItRating || 0) ? "#F59E0B" : "var(--border)"} />
                  </button>
                ))}
              </div>
            </div>

            <Field label="Notes">
              <textarea
                id="sub-notes"
                className="input resize-none"
                rows={2}
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>

            {/* Price History Timeline for Edit Mode */}
            {editSubscription && priceHistory.length > 0 && (
              <div className="mb-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <label className="block text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>Price History</label>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {priceHistory.map((ph, idx) => (
                    <div key={ph.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-slate-200 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow flex-shrink-0 z-10">
                        <ArrowUpRight size={10} style={{ color: "var(--primary)" }} />
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] card !p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>Price Change</div>
                          <time className="font-mono text-[10px]" style={{ color: "var(--text-secondary)" }}>{formatDateShort(ph.changedAt)}</time>
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          <span className="line-through">{ph.currency}{Number(ph.oldCost)}</span>
                          <span className="mx-2">→</span>
                          <span className="font-bold text-red-500">{ph.currency}{Number(ph.newCost)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 justify-center"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 justify-center"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Saving...</>
                ) : editSubscription ? "Save Changes" : "Add Subscription"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: "var(--warning)" }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs" style={{ color: "var(--warning)" }}>{error}</p>
      )}
    </div>
  );
}

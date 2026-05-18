"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES, BILLING_CYCLES } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const QUICK_ADD_TEMPLATES = [
  { name: "Netflix", cost: 649, currency: "INR", billingCycle: "monthly", category: "Entertainment", emoji: "🎬" },
  { name: "Spotify", cost: 119, currency: "INR", billingCycle: "monthly", category: "Entertainment", emoji: "🎵" },
  { name: "YouTube Premium", cost: 189, currency: "INR", billingCycle: "monthly", category: "Entertainment", emoji: "▶️" },
  { name: "Amazon Prime", cost: 1499, currency: "INR", billingCycle: "yearly", category: "Entertainment", emoji: "📦" },
  { name: "ChatGPT Plus", cost: 1650, currency: "INR", billingCycle: "monthly", category: "Productivity", emoji: "🤖" },
  { name: "Notion", cost: 0, currency: "INR", billingCycle: "monthly", category: "Productivity", emoji: "📝" },
  { name: "Adobe Creative Cloud", cost: 1675, currency: "INR", billingCycle: "monthly", category: "Productivity", emoji: "🎨" },
  { name: "AWS", cost: 0, currency: "USD", billingCycle: "monthly", category: "Developer Tools", emoji: "☁️" },
  { name: "GitHub Copilot", cost: 827, currency: "INR", billingCycle: "monthly", category: "Developer Tools", emoji: "🐙" },
  { name: "Coursera Plus", cost: 2652, currency: "INR", billingCycle: "yearly", category: "Education", emoji: "📚" },
  { name: "Headspace", cost: 4999, currency: "INR", billingCycle: "yearly", category: "Health", emoji: "🧘" },
  { name: "Zerodha", cost: 300, currency: "INR", billingCycle: "monthly", category: "Finance", emoji: "📈" },
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editSubscription) {
      setForm({
        name: editSubscription.name,
        cost: String(Number(editSubscription.cost)),
        currency: editSubscription.currency,
        category: editSubscription.category,
        billingCycle: editSubscription.billingCycle,
        nextPayment: new Date(editSubscription.nextPayment).toISOString().split("T")[0],
        trialEndsOn: editSubscription.trialEndsOn
          ? new Date(editSubscription.trialEndsOn).toISOString().split("T")[0]
          : "",
        status: editSubscription.status,
        notes: editSubscription.notes || "",
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [editSubscription, open]);

  function applyTemplate(t: (typeof QUICK_ADD_TEMPLATES)[number]) {
    setForm((f) => ({
      ...f,
      name: t.name,
      cost: String(t.cost),
      currency: t.currency,
      category: t.category,
      billingCycle: t.billingCycle,
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
      if (!res.ok) throw new Error(data.error || "Failed to save subscription");

      toast.success(editSubscription ? "Subscription updated!" : "Subscription added!");
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0"
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
          {/* Quick Add Templates */}
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
                      <span className="text-lg leading-none">{t.emoji}</span>
                      <span className="text-xs font-medium text-center leading-tight" style={{ color: "var(--text-primary)" }}>
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

          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
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

            {/* Cost + Currency */}
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

            {/* Category */}
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

            {/* Billing Cycle */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Billing Cycle <span style={{ color: "var(--warning)" }}>*</span>
              </label>
              <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {BILLING_CYCLES.map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setForm({ ...form, billingCycle: cycle })}
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

            {/* Next Payment */}
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

            {/* Trial End Date */}
            <Field label="Trial End Date">
              <input
                id="sub-trial-ends"
                type="date"
                className="input"
                value={form.trialEndsOn}
                onChange={(e) => setForm({ ...form, trialEndsOn: e.target.value })}
              />
            </Field>

            {/* Status */}
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

            {/* Notes */}
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

            {/* Actions */}
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

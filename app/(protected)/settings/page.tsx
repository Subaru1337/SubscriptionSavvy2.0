"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

interface User {
  id: string; email: string; baseCurrency: string;
  monthlyBudget: string | null; emailReminders: boolean; createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [reminders, setReminders] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setBudget(d.user.monthlyBudget ? String(Number(d.user.monthlyBudget)) : "");
          setCurrency(d.user.baseCurrency);
          setReminders(d.user.emailReminders);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(section: string, data: Record<string, unknown>) {
    setSaving(section);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to save");
      setUser(d.user);
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      toast.success("Account deleted. Goodbye!");
      router.push("/");
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false); setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton h-8 w-28 mb-6" />
        {[1,2,3,4].map((i) => <div key={i} className="card mb-4 skeleton h-32" />)}
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Settings</h1>

      {/* Account */}
      <div className="card mb-4">
        <h2 className="section-title">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b" style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Email</span>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{user?.email}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span style={{ color: "var(--text-secondary)" }}>Member since</span>
            <span style={{ color: "var(--text-primary)" }}>{user?.createdAt ? formatDate(user.createdAt) : "—"}</span>
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="card mb-4">
        <h2 className="section-title">Monthly Budget</h2>
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Set a spending limit to track your subscription budget usage.</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Budget ({currency})
            </label>
            <input
              type="number" min="0" step="100"
              className="input font-mono"
              placeholder="e.g. 5000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          <button
            onClick={() => save("budget", { monthlyBudget: budget ? Number(budget) : null })}
            className="btn-primary whitespace-nowrap"
            disabled={saving === "budget"}
          >
            {saving === "budget" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save
          </button>
          {budget && (
            <button
              onClick={() => { setBudget(""); save("budget", { monthlyBudget: null }); }}
              className="btn-secondary whitespace-nowrap text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Display Currency */}
      <div className="card mb-4">
        <h2 className="section-title">Display Currency</h2>
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>All dashboard totals will be converted to this currency.</p>
        <div className="flex gap-3">
          <select className="input flex-1" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => save("currency", { baseCurrency: currency })}
            className="btn-primary whitespace-nowrap"
            disabled={saving === "currency"}
          >
            {saving === "currency" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save
          </button>
        </div>
      </div>

      {/* Email Preferences */}
      <div className="card mb-4">
        <h2 className="section-title">Email Preferences</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Email reminders for upcoming payments</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Receive reminders 3 days before payments are due</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReminders(!reminders)}
              className="w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0"
              style={{ backgroundColor: reminders ? "var(--primary)" : "var(--border)" }}
            >
              <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm" style={{ left: reminders ? "calc(100% - 20px)" : "4px" }} />
            </button>
          </div>
        </div>
        <button
          onClick={() => save("reminders", { emailReminders: reminders })}
          className="btn-primary mt-4 text-sm"
          disabled={saving === "reminders"}
        >
          {saving === "reminders" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save Preferences
        </button>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: "rgba(224,92,92,0.3)" }}>
        <h2 className="section-title" style={{ color: "var(--warning)" }}>Danger Zone</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Permanently delete your account and all data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(224,92,92,0.1)", color: "var(--warning)", border: "1px solid rgba(224,92,92,0.3)" }}
        >
          <Trash2 size={15} /> Delete Account
        </button>
      </div>

      {/* Delete Account Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="card w-full max-w-sm animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} style={{ color: "var(--warning)" }} />
              <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Delete Account</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              This will permanently delete your account, all subscriptions, and payment history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1 justify-center" disabled={deleting}>Cancel</button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 justify-center py-2 px-4 rounded-lg font-semibold text-sm text-white cursor-pointer hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: "var(--warning)" }}
                disabled={deleting}
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

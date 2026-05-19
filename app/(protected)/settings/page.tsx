"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Bell, Shield, LogOut, Loader2, Save, Trash2, Smartphone, Target } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { formatDateShort } from "@/lib/utils";

interface UserProfile {
  email: string;
  name?: string;
  baseCurrency: string;
  monthlyBudget: number | null;
  emailReminders: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [budgetCat, setBudgetCat] = useState("Entertainment");
  const [budgetLimit, setBudgetLimit] = useState("");

  const loadSettings = async () => {
    try {
      const [res, sessRes, budRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/auth/sessions"),
        fetch("/api/category-budgets")
      ]);
      const data = await res.json();
      const sessData = await sessRes.json();
      const budData = await budRes.json();
      
      setProfile(data.user);
      if (sessData.sessions) setSessions(sessData.sessions);
      if (budData.budgets) setBudgets(budData.budgets);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseCurrency: profile.baseCurrency,
          monthlyBudget: profile.monthlyBudget ? Number(profile.monthlyBudget) : null,
          emailReminders: profile.emailReminders,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!budgetLimit || Number(budgetLimit) <= 0) return;
    try {
      const res = await fetch("/api/category-budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: budgetCat,
          limit: Number(budgetLimit),
          currency: profile?.baseCurrency || "INR"
        })
      });
      if (!res.ok) throw new Error();
      toast.success("Category budget saved");
      setBudgetLimit("");
      loadSettings();
    } catch {
      toast.error("Failed to save category budget");
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("Are you sure you want to log out from all devices? You will be logged out here as well.")) return;
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout-all", { method: "POST" });
      window.location.href = "/auth";
    } catch {
      toast.error("Failed to logout all devices");
      setLogoutLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/auth";
    } catch {
      toast.error("Failed to logout");
      setLogoutLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="page-container flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-primary)" }}>
        Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* General Preferences */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <User size={18} style={{ color: "var(--primary)" }} />
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Preferences</h2>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Email</label>
                <input type="email" className="input bg-black/5 cursor-not-allowed" value={profile.email} disabled />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Display Currency</label>
                <select
                  className="input"
                  value={profile.baseCurrency}
                  onChange={(e) => setProfile({ ...profile, baseCurrency: e.target.value })}
                >
                  {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  All amounts will be converted and shown in this currency.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Global Monthly Budget</label>
                <input
                  type="number"
                  className="input font-mono"
                  placeholder="No limit"
                  value={profile.monthlyBudget || ""}
                  onChange={(e) => setProfile({ ...profile, monthlyBudget: e.target.value ? Number(e.target.value) : null })}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Bell size={18} style={{ color: "var(--text-secondary)" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Email Reminders</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Get notified 3 days before a payment</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={profile.emailReminders}
                    onChange={(e) => setProfile({ ...profile, emailReminders: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]" />
                </label>
              </div>

              <div className="pt-4 border-t mt-6" style={{ borderColor: "var(--border)" }}>
                <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            </form>
          </section>

          {/* Category Budgets */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Target size={18} style={{ color: "var(--primary)" }} />
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Category Budgets</h2>
            </div>
            
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Set specific monthly limits for different types of subscriptions.</p>
            
            <div className="flex gap-2 items-end mb-6">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Category</label>
                <select className="input text-sm py-2" value={budgetCat} onChange={e => setBudgetCat(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Limit ({profile.baseCurrency})</label>
                <input type="number" className="input text-sm py-2" placeholder="0.00" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)} />
              </div>
              <button onClick={handleSaveBudget} className="btn-primary py-2 px-4 mb-0.5" disabled={!budgetLimit}>Add</button>
            </div>

            {budgets.length > 0 ? (
              <div className="space-y-2">
                {budgets.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                    <span className="text-sm font-medium">{b.category}</span>
                    <span className="text-sm font-mono">{b.currency} {Number(b.limit).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm italic" style={{ color: "var(--text-secondary)" }}>No category budgets set yet.</div>
            )}
          </section>

          {/* Security & Sessions */}
          <section className="card">
            <div className="flex items-center gap-2 mb-6">
              <Shield size={18} style={{ color: "var(--primary)" }} />
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Security & Sessions</h2>
            </div>
            
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Recent active sessions on your account.</p>
            
            <div className="space-y-3 mb-6">
              {sessions.map(s => (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-black/5 border" style={{ borderColor: "var(--border)" }}>
                  <Smartphone size={16} className="mt-0.5" style={{ color: "var(--text-secondary)" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.ipAddress || "Unknown IP"}</p>
                    <p className="text-xs max-w-[200px] md:max-w-md truncate" style={{ color: "var(--text-secondary)" }}>{s.userAgent}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{formatDateShort(s.issuedAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button 
                onClick={handleLogoutAll} 
                disabled={logoutLoading} 
                className="w-full text-sm font-medium py-3 rounded-lg transition-colors bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Log Out All Devices
              </button>
            </div>
          </section>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Account Actions</h3>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-black/5"
            >
              <div className="flex items-center gap-2">
                <LogOut size={16} style={{ color: "var(--text-secondary)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Log Out</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

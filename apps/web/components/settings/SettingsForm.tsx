"use client";

import { useSubscriptionStore, UserSettings } from "@/lib/store";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SettingsForm() {
  const { settings, setSettings } = useSubscriptionStore();
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  
  const [formData, setFormData] = useState<Partial<UserSettings>>({
    display_name: settings?.display_name || "",
    base_currency: settings?.base_currency || "INR",
    monthly_budget: settings?.monthly_budget || 0,
    email_reminders: settings?.email_reminders ?? true,
    reminder_days_before: settings?.reminder_days_before || 3,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        display_name: settings.display_name || "",
        base_currency: settings.base_currency || "INR",
        monthly_budget: settings.monthly_budget || 0,
        email_reminders: settings.email_reminders ?? true,
        reminder_days_before: settings.reminder_days_before || 3,
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === "number") {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    // Update local store
    setSettings(formData as UserSettings);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 600));
    
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <form onSubmit={handleSave} className="card p-6">
      <h3 className="text-title mb-6">Preferences</h3>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Display Name</label>
          <input
            type="text"
            name="display_name"
            value={formData.display_name || ""}
            onChange={handleChange}
            className="input max-w-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Base Currency</label>
            <select
              name="base_currency"
              value={formData.base_currency || "INR"}
              onChange={handleChange}
              className="input"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Monthly Budget</label>
            <input
              type="number"
              name="monthly_budget"
              value={formData.monthly_budget || ""}
              onChange={handleChange}
              className="input"
              placeholder="e.g. 5000"
            />
          </div>
        </div>

        <div className="h-px bg-border my-6 max-w-2xl" />

        <h4 className="text-sm font-bold text-text mb-4">Notifications</h4>
        
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            name="email_reminders"
            checked={formData.email_reminders || false}
            onChange={handleChange}
            id="email_reminders"
            className="w-4 h-4 accent-amber cursor-pointer rounded border-border"
          />
          <label htmlFor="email_reminders" className="text-sm cursor-pointer">
            Receive email reminders for upcoming payments
          </label>
        </div>

        {formData.email_reminders && (
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Days Before Payment</label>
            <select
              name="reminder_days_before"
              value={formData.reminder_days_before || 3}
              onChange={handleChange}
              className="input"
            >
              <option value="1">1 Day</option>
              <option value="2">2 Days</option>
              <option value="3">3 Days</option>
              <option value="5">5 Days</option>
              <option value="7">1 Week</option>
            </select>
          </div>
        )}

        <div className="h-px bg-border my-6 max-w-2xl" />

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn btn-primary min-w-[120px] justify-center text-black">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {success && <span className="text-success text-sm font-medium animate-fade-in">Saved successfully!</span>}
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-[rgba(248,81,73,0.2)]">
        <h4 className="text-sm font-bold text-danger mb-2">Danger Zone</h4>
        <p className="text-xs text-muted mb-4">Sign out of your account or permanently delete your data.</p>
        <button type="button" onClick={handleSignOut} className="btn btn-danger text-sm">
          Sign Out
        </button>
      </div>
    </form>
  );
}

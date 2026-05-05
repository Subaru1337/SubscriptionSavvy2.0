"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { useSubscriptionStore, Subscription } from "@/lib/store";
import { TEMPLATES, LOGO_COLORS, CATEGORY_COLORS } from "@/lib/utils";

interface AddSubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSubModal({ isOpen, onClose }: AddSubModalProps) {
  const { addSubscription, settings } = useSubscriptionStore();
  const [step, setStep] = useState<"search" | "details">("search");
  
  // Form State
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [cycle, setCycle] = useState<any>("monthly");
  const [category, setCategory] = useState<any>("other");
  const [logoColor, setLogoColor] = useState(LOGO_COLORS[0]);
  const [nextPayment, setNextPayment] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setName(""); setCost(""); setCycle("monthly"); setCategory("other");
    setLogoColor(LOGO_COLORS[0]); setNextPayment("");
    setStep("search"); setSearchQuery("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectTemplate = (t: typeof TEMPLATES[0]) => {
    setName(t.name);
    setCost(t.cost.toString());
    setCycle(t.billing_cycle);
    setCategory(t.category);
    setLogoColor(t.logo_color);
    setStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSub: Subscription = {
      id: crypto.randomUUID(),
      user_id: "local",
      name,
      category,
      cost: parseFloat(cost),
      currency: settings?.base_currency || "INR",
      billing_cycle: cycle,
      next_payment: nextPayment || new Date().toISOString(),
      trial_ends_on: null,
      status: "active",
      notes: null,
      logo_color: logoColor,
      created_at: new Date().toISOString()
    };
    addSubscription(newSub);
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="modal-panel"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {step === "search" ? "Add Subscription" : "Subscription Details"}
              </h2>
              <button 
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {step === "search" ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search templates (e.g. Netflix)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 py-3"
                    autoFocus
                  />
                </div>
                
                <div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {filteredTemplates.map(t => (
                    <button
                      key={t.name}
                      onClick={() => handleSelectTemplate(t)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-[rgba(240,246,252,0.05)] hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
                          style={{ background: t.logo_color }}
                        >
                          {t.name[0]}
                        </div>
                        <span className="font-semibold text-text">{t.name}</span>
                      </div>
                      <span className="text-xs text-muted capitalize px-2 py-1 rounded bg-[rgba(240,246,252,0.05)]">
                        {t.category}
                      </span>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setStep("details")}
                    className="w-full flex items-center justify-center p-4 rounded-xl border border-dashed border-[rgba(240,246,252,0.2)] hover:border-amber hover:text-amber transition-colors text-muted text-sm font-semibold cursor-pointer"
                  >
                    + Create Custom Subscription
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input"
                    placeholder="e.g. Netflix"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      required
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Cycle</label>
                    <select
                      value={cycle}
                      onChange={(e) => setCycle(e.target.value as any)}
                      className="input"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Next Payment</label>
                    <input
                      type="date"
                      value={nextPayment}
                      onChange={(e) => setNextPayment(e.target.value)}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="input capitalize"
                    >
                      {Object.keys(CATEGORY_COLORS).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {LOGO_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setLogoColor(c)}
                        className="w-8 h-8 rounded-full border-2 transition-transform cursor-pointer"
                        style={{ 
                          background: c, 
                          borderColor: logoColor === c ? "white" : "transparent",
                          transform: logoColor === c ? "scale(1.1)" : "scale(1)"
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setStep("search")} className="btn btn-secondary flex-1 justify-center">
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary flex-[2] justify-center text-black">
                    Save Subscription
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Filter, Inbox, Star, TrendingUp, CheckSquare, Square, Trash2, PauseCircle } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge, SubscriptionStatusBadge } from "@/components/ui/StatusBadge";
import { formatDateShort } from "@/lib/utils";
import { CURRENCY_SYMBOLS } from "@/lib/currency";
import { SubscriptionModal } from "@/components/subscriptions/SubscriptionModal";
import { Logo } from "@/components/Logo";

interface Subscription {
  id: string;
  name: string;
  cost: string;
  currency: string;
  category: string;
  billingCycle: string;
  nextPayment: string;
  status: string;
  worthItRating?: number | null;
  cancelledAt?: string | null;
  priceHistory?: any[]; // To check if price history exists, we actually don't have this in GET /api/subscriptions but we can mock or just show it if we add it
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActioning, setIsBulkActioning] = useState(false);

  const [emptyTip, setEmptyTip] = useState("");

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`/api/subscriptions?status=${filter}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    const tips = [
      "Check your bank statements for any recurring charges you might have forgotten.",
      "Most people forget about annual subscriptions — try adding Amazon Prime first",
      "Add your streaming services first — they're the easiest to forget"
    ];
    setEmptyTip(tips[Math.floor(Math.random() * tips.length)]);
  }, [filter]);

  const filtered = subscriptions.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)));
    }
  };

  const handleBulkAction = async (action: 'cancel' | 'pause' | 'delete') => {
    if (selectedIds.size === 0) return;
    if (action === 'delete' && !confirm("Are you sure you want to delete selected subscriptions?")) return;
    
    setIsBulkActioning(true);
    try {
      const res = await fetch('/api/subscriptions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) })
      });
      if (!res.ok) throw new Error();
      toast.success(`Successfully updated ${selectedIds.size} subscriptions`);
      setSelectedIds(new Set());
      fetchSubscriptions();
    } catch {
      toast.error("Bulk action failed");
    } finally {
      setIsBulkActioning(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex justify-between mb-6">
          <div className="h-8 skeleton w-40" />
          <div className="h-10 skeleton w-32 rounded-lg" />
        </div>
        <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          My Subscriptions
        </h1>
        <button onClick={() => setModalOpen(true)} className="btn-primary w-full md:w-auto justify-center">
          <Plus size={18} /> Add New
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
          <input
            type="text"
            placeholder="Search subscriptions..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative md:w-48">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
          <select
            className="input pl-10 appearance-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Inbox size={48} style={{ color: "var(--border)" }} className="mb-4" />
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            {search ? "No matches found" : "No subscriptions yet"}
          </h3>
          <p className="text-sm italic mb-6 max-w-sm" style={{ color: "var(--text-secondary)" }}>
            "{emptyTip}"
          </p>
          {!search && (
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              Add Your First Subscription
            </button>
          )}
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden mb-20 md:mb-0">
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--tag-bg)" }}>
            <div className="col-span-1 flex items-center">
              <button onClick={toggleSelectAll}>
                {selectedIds.size === filtered.length ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            </div>
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Cost</div>
            <div className="col-span-3">Next Payment</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((sub) => (
              <div
                key={sub.id}
                className="p-4 md:px-6 hover:bg-black/5 transition-colors group relative cursor-pointer"
                onClick={(e) => {
                  // Prevent opening modal if clicking on checkbox
                  if ((e.target as HTMLElement).closest('.checkbox-area')) return;
                  setEditingSub(sub);
                  setModalOpen(true);
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* Mobile Top Row / Desktop Col 1 */}
                  <div className="flex items-center justify-between md:col-span-5">
                    <div className="flex items-center gap-3">
                      <div className="checkbox-area p-2 -ml-2" onClick={() => toggleSelect(sub.id)}>
                        {selectedIds.has(sub.id) ? <CheckSquare size={18} style={{ color: "var(--primary)" }} /> : <Square size={18} style={{ color: "var(--text-secondary)" }} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <Logo name={sub.name} className="w-6 h-6 rounded-md object-contain bg-white shrink-0 shadow-sm" />
                          <p className="font-bold text-sm md:text-base truncate max-w-[150px] md:max-w-xs" style={{ color: "var(--text-primary)" }}>{sub.name}</p>
                          {/* We don't have true priceHistory length in this list call, so we skip the arrow here or simulate it if needed */}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="tag text-xs">{sub.category}</span>
                          {sub.worthItRating ? (
                            <div className="flex items-center gap-0.5">
                              <Star size={10} fill="#F59E0B" color="#F59E0B" />
                              <span className="text-[10px] font-bold" style={{ color: "var(--text-secondary)" }}>{sub.worthItRating}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {/* Mobile Cost */}
                    <div className="md:hidden text-right">
                      <p className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                        {CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}
                      </p>
                      <p className="text-xs capitalize" style={{ color: "var(--text-secondary)" }}>{sub.billingCycle}</p>
                    </div>
                  </div>

                  {/* Desktop Cost */}
                  <div className="hidden md:block md:col-span-2">
                    <p className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                      {CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}
                    </p>
                    <p className="text-xs capitalize" style={{ color: "var(--text-secondary)" }}>{sub.billingCycle}</p>
                  </div>

                  {/* Desktop Next Payment */}
                  <div className="hidden md:block md:col-span-3">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatDateShort(sub.nextPayment)}
                    </p>
                    {sub.cancelledAt && (
                      <p className="text-[10px]" style={{ color: "var(--success)" }}>Saved money since {formatDateShort(sub.cancelledAt)}</p>
                    )}
                  </div>

                  {/* Desktop Status */}
                  <div className="hidden md:flex md:col-span-2 justify-end">
                    {sub.status === 'active' ? (
                      <StatusBadge nextPayment={sub.nextPayment} />
                    ) : (
                      <SubscriptionStatusBadge status={sub.status} />
                    )}
                  </div>

                  {/* Mobile Bottom Row */}
                  <div className="flex md:hidden items-center justify-between pt-3 border-t mt-1" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Next Payment</p>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{formatDateShort(sub.nextPayment)}</p>
                    </div>
                    {sub.status === 'active' ? (
                      <StatusBadge nextPayment={sub.nextPayment} />
                    ) : (
                      <SubscriptionStatusBadge status={sub.status} />
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-fade-in border border-gray-800">
          <span className="text-sm font-medium pl-2">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-gray-700" />
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkAction('pause')} disabled={isBulkActioning} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors text-xs font-medium">
              <PauseCircle size={14} /> Pause
            </button>
            <button onClick={() => handleBulkAction('cancel')} disabled={isBulkActioning} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors text-xs font-medium">
              <Inbox size={14} /> Cancel
            </button>
            <button onClick={() => handleBulkAction('delete')} disabled={isBulkActioning} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-900/50 hover:bg-red-900/80 text-red-300 transition-colors text-xs font-medium">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}

      {(modalOpen || editingSub) && (
        <SubscriptionModal
          open={modalOpen || !!editingSub}
          onClose={() => {
            setModalOpen(false);
            setEditingSub(null);
          }}
          onSuccess={() => {
            fetchSubscriptions();
          }}
          editSubscription={editingSub}
        />
      )}
    </div>
  );
}

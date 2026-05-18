"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Search, Download, Upload, Pencil, Trash2, ChevronDown, Loader2, FileText } from "lucide-react";
import { SubscriptionModal } from "@/components/subscriptions/SubscriptionModal";
import { ImportCSVModal } from "@/components/subscriptions/ImportCSVModal";
import { StatusBadge, SubscriptionStatusBadge, TrialBadge } from "@/components/ui/StatusBadge";
import { CATEGORIES, formatDate } from "@/lib/utils";
import { CURRENCY_SYMBOLS } from "@/lib/currency";
import { PageSkeleton } from "@/components/ui/Skeleton";

interface Subscription {
  id: string; name: string; cost: string; currency: string; category: string;
  billingCycle: string; nextPayment: string; trialEndsOn?: string | null;
  status: string; notes?: string | null;
}
type StatusFilter = "all" | "active" | "paused" | "cancelled";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [exportLoading, setExportLoading] = useState<"csv" | "pdf" | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  async function loadSubscriptions() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions?status=all");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch { toast.error("Failed to load subscriptions"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadSubscriptions(); }, []);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Subscription deleted");
      setDeleteConfirmId(null);
      loadSubscriptions();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  }

  async function handleExport(type: "csv" | "pdf") {
    setExportLoading(type); setShowExportMenu(false);
    try {
      const res = await fetch(`/api/export/${type}?status=all`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `subscriptions.${type}`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error(`Failed to export ${type.toUpperCase()}`); }
    finally { setExportLoading(null); }
  }

  const filtered = subscriptions.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <PageSkeleton />;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Subscriptions</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setImportOpen(true)} className="btn-secondary text-sm">
            <Upload size={15} /> Import CSV
          </button>
          <div className="relative" ref={exportRef}>
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn-secondary text-sm" disabled={exportLoading !== null}>
              {exportLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Export <ChevronDown size={13} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 rounded-xl shadow-lg z-20 border overflow-hidden animate-fade-in" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                <button onClick={() => handleExport("csv")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm cursor-pointer hover:opacity-80" style={{ color: "var(--text-primary)" }}>
                  <FileText size={14} /> Export CSV
                </button>
                <button onClick={() => handleExport("pdf")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm cursor-pointer hover:opacity-80 border-t" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
                  <FileText size={14} /> Export PDF
                </button>
              </div>
            )}
          </div>
          <button onClick={() => { setEditSub(null); setModalOpen(true); }} className="btn-primary text-sm">
            <Plus size={16} /> Add Subscription
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card mb-4 !py-3 !px-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {(["all", "active", "paused", "cancelled"] as StatusFilter[]).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer" style={statusFilter === s ? { backgroundColor: "var(--primary)", color: "#fff" } : { backgroundColor: "var(--card)", color: "var(--text-secondary)" }}>
                {s}
              </button>
            ))}
          </div>
          <select className="input !w-auto text-xs py-1.5 px-2" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
            <input type="text" placeholder="Search subscriptions..." className="input !pl-8 text-xs py-1.5" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{filtered.length} results</span>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--tag-bg)" }}>
            <Plus size={24} style={{ color: "var(--primary)" }} />
          </div>
          <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            {search || statusFilter !== "all" || categoryFilter !== "all" ? "No subscriptions match your filters" : "No subscriptions yet"}
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            {search || statusFilter !== "all" || categoryFilter !== "all" ? "Try adjusting your search or filters" : "Add your first one to start tracking!"}
          </p>
          {!search && statusFilter === "all" && categoryFilter === "all" && (
            <button onClick={() => { setEditSub(null); setModalOpen(true); }} className="btn-primary mx-auto">
              <Plus size={15} /> Add Subscription
            </button>
          )}
        </div>
      )}

      {/* Desktop Table */}
      {filtered.length > 0 && (
        <>
          <div className="card hidden md:block !p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--tag-bg)" }}>
                  {["Name", "Category", "Amount", "Cycle", "Next Payment", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-0 hover:opacity-90 transition-opacity" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)", textDecoration: sub.status === "cancelled" ? "line-through" : "none", opacity: sub.status === "cancelled" ? 0.6 : 1 }}>{sub.name}</span>
                        {sub.trialEndsOn && <TrialBadge trialEndsOn={sub.trialEndsOn} />}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="tag text-xs">{sub.category}</span></td>
                    <td className="px-4 py-3"><span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}</span></td>
                    <td className="px-4 py-3"><span className="text-xs capitalize" style={{ color: "var(--text-secondary)" }}>{sub.billingCycle}</span></td>
                    <td className="px-4 py-3"><span className="text-sm" style={{ color: "var(--text-primary)" }}>{formatDate(sub.nextPayment)}</span></td>
                    <td className="px-4 py-3">
                      {sub.status === "active" ? <StatusBadge nextPayment={sub.nextPayment} /> : <SubscriptionStatusBadge status={sub.status} />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditSub(sub); setModalOpen(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-70" style={{ color: "var(--text-secondary)" }} aria-label="Edit"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteConfirmId(sub.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-70" style={{ color: "var(--warning)" }} aria-label="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((sub) => (
              <div key={sub.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)", textDecoration: sub.status === "cancelled" ? "line-through" : "none", opacity: sub.status === "cancelled" ? 0.6 : 1 }}>{sub.name}</h3>
                      {sub.trialEndsOn && <TrialBadge trialEndsOn={sub.trialEndsOn} />}
                    </div>
                    <span className="tag text-xs">{sub.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditSub(sub); setModalOpen(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: "var(--text-secondary)" }}><Pencil size={14} /></button>
                    <button onClick={() => setDeleteConfirmId(sub.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: "var(--warning)" }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-base font-bold" style={{ color: "var(--text-primary)" }}>{CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}</p>
                    <p className="text-xs capitalize" style={{ color: "var(--text-secondary)" }}>{sub.billingCycle} · Next: {formatDate(sub.nextPayment)}</p>
                  </div>
                  {sub.status === "active" ? <StatusBadge nextPayment={sub.nextPayment} /> : <SubscriptionStatusBadge status={sub.status} />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="card w-full max-w-sm animate-fade-in">
            <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>Delete Subscription</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>This will permanently delete this subscription and all payment history. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary flex-1 justify-center" disabled={deleting}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 justify-center py-2 px-4 rounded-lg font-semibold text-sm text-white cursor-pointer hover:opacity-90 flex items-center gap-2" style={{ backgroundColor: "var(--warning)" }} disabled={deleting}>
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditSub(null); }} onSuccess={loadSubscriptions} editSubscription={editSub} />
      <ImportCSVModal open={importOpen} onClose={() => setImportOpen(false)} onSuccess={loadSubscriptions} />
    </div>
  );
}

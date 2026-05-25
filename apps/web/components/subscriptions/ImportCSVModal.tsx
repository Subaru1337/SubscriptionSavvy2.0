"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { X, Upload, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

interface PreviewRow {
  name: string; cost: number; currency: string; billingCycle: string;
  nextPayment: string; category: string; notes: string; isDuplicate: boolean; rowIndex: number;
}

interface ImportCSVModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportCSVModal({ open, onClose, onSuccess }: ImportCSVModalProps) {
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [errors, setErrors] = useState<{ row: number; error: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setPreview([]); setResult(null); setErrors([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import/csv", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setPreview(data.preview || []);
      setErrors(data.errors || []);
      const allNonDuplicate = new Set<number>(
        (data.preview || []).filter((r: PreviewRow) => !r.isDuplicate).map((r: PreviewRow) => r.rowIndex)
      );
      setSelected(allNonDuplicate);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse CSV");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    const rows = preview.filter((r) => selected.has(r.rowIndex));
    if (rows.length === 0) { toast.error("No rows selected"); return; }
    setImporting(true);
    try {
      const res = await fetch("/api/import/csv", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult({ imported: data.imported, skipped: data.skipped });
      toast.success(`Imported ${data.imported} subscriptions`);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function toggleRow(idx: number) {
    setSelected((s) => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-fade-in" style={{ backgroundColor: "var(--card)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Import from CSV</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-70" style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
        </div>

        <div className="px-6 py-5">
          {!result ? (
            <>
              {/* Upload zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:opacity-80 mb-4"
                style={{ borderColor: "var(--primary)", backgroundColor: "var(--tag-bg)" }}
              >
                <Upload size={32} className="mx-auto mb-2" style={{ color: "var(--primary)" }} />
                <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Click to upload CSV file</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Required columns: name, cost, billingCycle, nextPayment</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-4" style={{ color: "var(--text-secondary)" }}>
                  <Loader2 size={18} className="animate-spin" /> Parsing CSV...
                </div>
              )}

              {errors.length > 0 && (
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(224,92,92,0.1)", color: "var(--warning)" }}>
                  {errors.length} row(s) had errors and were skipped.
                </div>
              )}

              {preview.length > 0 && (
                <>
                  <p className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
                    Preview — {preview.length} rows found. Select rows to import:
                  </p>
                  <div className="border rounded-xl overflow-hidden mb-4" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ backgroundColor: "var(--tag-bg)", borderBottom: "1px solid var(--border)" }}>
                          <th className="px-3 py-2 text-left w-8">
                            <input type="checkbox" checked={selected.size === preview.length} onChange={(e) => setSelected(e.target.checked ? new Set(preview.map((r) => r.rowIndex)) : new Set())} />
                          </th>
                          {["Name", "Cost", "Cycle", "Next Payment", "Category"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
                          ))}
                          <th className="px-3 py-2 text-left font-semibold" style={{ color: "var(--text-secondary)" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row) => (
                          <tr key={row.rowIndex} className="border-b last:border-0" style={{ borderColor: "var(--border)", opacity: row.isDuplicate ? 0.6 : 1 }}>
                            <td className="px-3 py-2">
                              <input type="checkbox" checked={selected.has(row.rowIndex)} onChange={() => toggleRow(row.rowIndex)} />
                            </td>
                            <td className="px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>{row.name}</td>
                            <td className="px-3 py-2 font-mono" style={{ color: "var(--text-primary)" }}>{row.currency}{row.cost}</td>
                            <td className="px-3 py-2 capitalize" style={{ color: "var(--text-secondary)" }}>{row.billingCycle}</td>
                            <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{row.nextPayment}</td>
                            <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{row.category}</td>
                            <td className="px-3 py-2">
                              {row.isDuplicate ? (
                                <span className="badge badge-overdue">Duplicate</span>
                              ) : (
                                <span className="badge badge-upcoming">New</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={onClose} className="btn-secondary flex-1 justify-center" disabled={importing}>Cancel</button>
                    <button onClick={handleImport} className="btn-primary flex-1 justify-center" disabled={importing || selected.size === 0}>
                      {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      Import {selected.size} Row{selected.size !== 1 ? "s" : ""}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle size={40} className="mx-auto mb-3" style={{ color: "var(--success)" }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Import Complete!</h3>
              <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>{result.imported} subscriptions imported</p>
              {result.skipped > 0 && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{result.skipped} skipped</p>}
              <button onClick={onClose} className="btn-primary mt-6 mx-auto">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

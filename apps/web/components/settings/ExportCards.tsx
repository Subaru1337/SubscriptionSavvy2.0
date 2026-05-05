"use client";

import { useSubscriptionStore } from "@/lib/store";
import { Download, Upload } from "lucide-react";
import Papa from "papaparse";

export function ExportCards() {
  const { subscriptions, addSubscription } = useSubscriptionStore();

  const handleExport = () => {
    const csv = Papa.unparse(subscriptions.map(s => ({
      Name: s.name,
      Cost: s.cost,
      Currency: s.currency,
      Cycle: s.billing_cycle,
      NextPayment: s.next_payment,
      Category: s.category,
      Status: s.status
    })));
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Very basic import logic for demo
        results.data.forEach((row: any) => {
          if (row.Name && row.Cost) {
            addSubscription({
              id: crypto.randomUUID(),
              user_id: "local",
              name: row.Name,
              cost: parseFloat(row.Cost),
              currency: row.Currency || "INR",
              billing_cycle: row.Cycle || "monthly",
              next_payment: row.NextPayment || new Date().toISOString(),
              category: row.Category || "other",
              status: row.Status || "active",
              trial_ends_on: null,
              notes: null,
              logo_color: null,
              created_at: new Date().toISOString()
            } as any);
          }
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className="card p-6 border-dashed border-[rgba(240,246,252,0.2)]">
        <div className="w-10 h-10 rounded-lg bg-[rgba(245,166,35,0.1)] flex items-center justify-center mb-4 text-amber">
          <Upload size={20} />
        </div>
        <h3 className="text-title mb-1">Import CSV</h3>
        <p className="text-muted text-sm mb-4">Bulk import your subscriptions from a CSV file.</p>
        
        <label className="btn btn-secondary w-full justify-center text-sm cursor-pointer relative overflow-hidden">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleImport}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          Choose File
        </label>
      </div>

      <div className="card p-6">
        <div className="w-10 h-10 rounded-lg bg-[rgba(42,157,143,0.1)] flex items-center justify-center mb-4 text-teal">
          <Download size={20} />
        </div>
        <h3 className="text-title mb-1">Export Data</h3>
        <p className="text-muted text-sm mb-4">Download all your subscription data as a CSV.</p>
        
        <button onClick={handleExport} className="btn btn-primary w-full justify-center text-sm text-black">
          Download CSV
        </button>
      </div>
    </div>
  );
}

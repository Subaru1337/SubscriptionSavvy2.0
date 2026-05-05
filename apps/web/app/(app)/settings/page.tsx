import { SettingsForm } from "@/components/settings/SettingsForm";
import { ExportCards } from "@/components/settings/ExportCards";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in pb-12">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
          <SettingsIcon size={20} className="text-text" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text">Settings</h1>
        </div>
      </div>
      <p className="text-muted text-sm mb-8 ml-14">Manage your preferences, data, and account.</p>

      <div className="max-w-3xl space-y-8">
        <SettingsForm />
        
        <div>
          <h2 className="text-xl font-bold text-text mb-2">Data Management</h2>
          <ExportCards />
        </div>
      </div>
    </div>
  );
}

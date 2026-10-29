import React, { useState } from 'react';
import { 
  Settings, 
  Trash2, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  Server
} from 'lucide-react';

interface SettingsViewProps {
  onClearData: () => void;
  totalInvestigations: number;
  totalEvidence: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  onClearData,
  totalInvestigations,
  totalEvidence
}) => {
  const [clearedSuccess, setClearedSuccess] = useState(false);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all locally created investigations and evidence? This action cannot be undone.')) {
      onClearData();
      setClearedSuccess(true);
      setTimeout(() => setClearedSuccess(false), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#E1E4DC] pb-4 space-y-1">
        <h1 className="text-lg font-bold text-[#252720] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#52765C]" />
          <span>Workspace Settings & Storage Controls</span>
        </h1>
        <p className="text-xs text-slate-500 font-normal">
          Manage system integrations, local evidence storage, and forensic privacy controls.
        </p>
      </div>

      {/* Success Banner */}
      {clearedSuccess && (
        <div className="p-3.5 bg-[#E8EFE6] border border-[#52765C]/30 rounded-xl text-xs text-[#52765C] flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#52765C] shrink-0" />
          <span className="font-semibold">Workspace storage cleared. App is in clean zero-data state.</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Card 1: System Integration Status */}
        <div className="p-5 bg-white border border-[#E1E4DC] rounded-xl space-y-4 shadow-xs">
          <div className="space-y-0.5 border-b border-[#E1E4DC] pb-3">
            <h3 className="text-xs font-bold text-[#252720] flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#52765C]" />
              <span>System Integration & API Gateway</span>
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Active AI model integration settings and backend server endpoint proxy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">AI Model Provider</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#E8EFE6] text-[#52765C] border border-[#52765C]/30 rounded">
                  Active
                </span>
              </div>
              <p className="font-mono text-slate-600 text-[11px]">Google Gemini API (@google/genai)</p>
            </div>

            <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Backend API Proxy</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#E8EFE6] text-[#52765C] border border-[#52765C]/30 rounded">
                  Connected
                </span>
              </div>
              <p className="font-mono text-slate-600 text-[11px]">Serverless / Express Gateway (/api/gemini)</p>
            </div>
          </div>
        </div>

        {/* Card 2: Workspace Memory & Data Storage Controls */}
        <div className="p-5 bg-white border border-[#E1E4DC] rounded-xl space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E4DC] pb-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-[#252720] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#52765C]" />
                <span>Workspace Local Storage Memory</span>
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Manually created investigations and uploaded evidence are saved in your local browser session. No auto-seeded data is injected on startup.
              </p>
            </div>

            <button
              onClick={handleClear}
              disabled={totalInvestigations === 0 && totalEvidence === 0}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                totalInvestigations === 0 && totalEvidence === 0
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white hover:bg-[#FFF1F2] text-[#881337] border-[#F43F5E]/30 hover:border-[#F43F5E]'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Local Data</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-1">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Stored Cases</span>
              <span className="text-base font-bold text-[#252720]">{totalInvestigations}</span>
            </div>
            <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-1">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Stored Evidence Files</span>
              <span className="text-base font-bold text-[#252720]">{totalEvidence}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Privacy Guarantee */}
        <div className="p-5 bg-white border border-[#E1E4DC] rounded-xl space-y-3 shadow-xs text-xs">
          <h3 className="font-bold text-[#252720] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#52765C]" />
            <span>Forensic Data & Privacy Guarantee</span>
          </h3>
          <p className="text-slate-600 leading-relaxed font-normal">
            TruthTrace strictly respects user privacy. All uploaded evidence documents, extracted claims, and detected contradictions are created exclusively when manually added by the user and remain under user control.
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { PageHeader } from './PageHeader';
import { 
  FolderKanban, 
  FileText, 
  Sparkles, 
  ShieldAlert, 
  Plus, 
  ArrowRight, 
  Clock, 
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { Investigation, EvidenceItem, Claim, Contradiction } from '../types/investigation';

interface DashboardViewProps {
  investigationsList: Investigation[];
  evidenceList: EvidenceItem[];
  claimsMap: Map<string, Claim[]>;
  contradictionsMap?: Map<string, Contradiction[]>;
  onNewInvestigation?: () => void;
  onOpenInvestigation: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  investigationsList,
  evidenceList,
  claimsMap,
  contradictionsMap,
  onNewInvestigation,
  onOpenInvestigation,
}) => {
  // Compute key summary metrics
  const activeCases = investigationsList.filter(i => i.status === 'Active' || !i.status);
  const totalEvidenceCount = evidenceList.length;
  
  let totalClaimsCount = 0;
  claimsMap.forEach((claims) => {
    totalClaimsCount += claims.length;
  });

  let totalContradictionsCount = 0;
  if (contradictionsMap) {
    contradictionsMap.forEach((cnts) => {
      totalContradictionsCount += cnts.length;
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Forensic Overview"
        description="Investigate conflicting claims, trace source document evidence, and resolve factual discrepancies."
        primaryActionLabel="New Investigation"
        onPrimaryAction={onNewInvestigation}
      />

      {/* KPI Metric Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 bg-white border border-[#E1E4DC] rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Active Cases</span>
            <FolderKanban className="w-4 h-4 text-[#52765C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#252720] tabular-nums">
            {activeCases.length}
          </div>
          <p className="text-[11px] text-slate-500 font-normal">
            Total active investigation workspaces
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-white border border-[#E1E4DC] rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Evidence Files</span>
            <FileText className="w-4 h-4 text-[#52765C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#252720] tabular-nums">
            {totalEvidenceCount}
          </div>
          <p className="text-[11px] text-slate-500 font-normal">
            Uploaded PDF and TXT documents
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-white border border-[#E1E4DC] rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-semibold">Extracted Claims</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-900 tabular-nums">
            {totalClaimsCount}
          </div>
          <p className="text-[11px] text-slate-500 font-normal">
            AI-extracted factual assertions
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-white border border-[#E1E4DC] rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[#881337]">
            <span className="text-xs font-semibold">Discrepancies</span>
            <ShieldAlert className="w-4 h-4 text-[#881337]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#881337] tabular-nums">
            {totalContradictionsCount}
          </div>
          <p className="text-[11px] text-slate-500 font-normal">
            Detected cross-document contradictions
          </p>
        </div>
      </div>

      {/* Recent Investigations List */}
      <div className="p-6 bg-white border border-[#E1E4DC] rounded-xl space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-[#252720]">
              Active Investigation Workspaces
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Select an investigation to upload evidence, extract claims with Gemini AI, and inspect contradiction graphs.
            </p>
          </div>

          {onNewInvestigation && (
            <button
              onClick={onNewInvestigation}
              className="px-3.5 py-1.5 bg-[#52765C] hover:bg-[#43624C] text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Workspace</span>
            </button>
          )}
        </div>

        {investigationsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investigationsList.map((inv) => {
              const caseEvidence = evidenceList.filter(e => e.investigationId === inv.id);
              const caseContradictions = contradictionsMap?.get(inv.id) || [];

              return (
                <div
                  key={inv.id}
                  className="p-5 bg-[#FAF9F6] border border-[#E1E4DC] rounded-xl space-y-4 hover:border-[#52765C]/50 transition-all flex flex-col justify-between group shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-[#E1E4DC] font-medium">
                        {inv.code || inv.id}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E8EFE6] text-[#52765C] border border-[#52765C]/30">
                        {inv.status || 'Active'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#252720] group-hover:text-[#52765C] transition-colors leading-snug">
                      {inv.title}
                    </h3>

                    {inv.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                        {inv.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E1E4DC]/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-[#52765C]" />
                        <span>{caseEvidence.length} Files</span>
                      </span>
                      {caseContradictions.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[#881337] font-bold">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{caseContradictions.length} Discrepancies</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#52765C]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>No Contradictions</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onOpenInvestigation(inv.id)}
                      className="w-full py-2 bg-white hover:bg-[#E8EFE6] text-[#252720] hover:text-[#52765C] border border-[#E1E4DC] rounded-lg text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State Card */
          <div className="p-10 bg-[#FAF9F6] border border-[#E1E4DC] rounded-xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E8EFE6] text-[#52765C] flex items-center justify-center mx-auto shadow-2xs">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-[#252720]">
                No active investigations
              </h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Start by creating your first investigation case to upload PDF or TXT evidence documents and run AI claim analysis.
              </p>
            </div>
            {onNewInvestigation && (
              <button
                onClick={onNewInvestigation}
                className="px-4 py-2 bg-[#52765C] hover:bg-[#43624C] text-white rounded-md text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Investigation</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

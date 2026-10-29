import React from 'react';
import { Menu, ShieldCheck, FileText, Search } from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  activeTabLabel?: string;
  activeInvestigationTitle?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  activeTabLabel = 'Overview',
  activeInvestigationTitle,
}) => {
  return (
    <header className="h-14 bg-white border-b border-[#E1E4DC] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-10 select-none">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-1.5 text-slate-600 hover:text-[#252720] hover:bg-[#FAF9F6] border border-[#E1E4DC] rounded-md transition-colors"
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs font-semibold text-[#252720] min-w-0">
          <span className="hidden sm:inline text-slate-400 font-normal">TruthTrace Workspace</span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="text-[#52765C] truncate">{activeTabLabel}</span>
          {activeInvestigationTitle && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-mono truncate max-w-[180px] sm:max-w-xs">
                {activeInvestigationTitle}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Security Indicator Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF9F6] border border-[#E1E4DC] rounded-md text-[11px] font-mono text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-[#52765C]" />
          <span>Forensic Evidence System</span>
        </div>
      </div>
    </header>
  );
};

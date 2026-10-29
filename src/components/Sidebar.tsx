import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileSearch, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';

export type ActiveTab = 
  | 'overview' 
  | 'investigations' 
  | 'evidence' 
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'investigations', label: 'Investigations', icon: FolderKanban },
    { id: 'evidence', label: 'Evidence Library', icon: FileSearch },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-[#E1E4DC] transition-all duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-16' : 'md:w-60'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#E1E4DC] shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#52765C] text-white shrink-0 font-bold text-xs tracking-wider shadow-2xs">
              TT
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="text-sm font-bold tracking-tight text-[#252720] truncate">
                TruthTrace
              </span>
            )}
          </div>

          {/* Mobile Close Button */}
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 rounded text-slate-400 hover:text-[#252720] hover:bg-[#FAF9F6] transition-colors shrink-0"
              title="Close menu"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1 rounded text-slate-400 hover:text-[#252720] hover:bg-[#FAF9F6] transition-colors shrink-0 cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#E8EFE6] text-[#252720] font-semibold'
                    : 'text-slate-600 hover:text-[#252720] hover:bg-[#FAF9F6]'
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#52765C]' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                
                {(!collapsed || mobileOpen) && (
                  <span className="truncate flex-1 text-left">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        {(!collapsed || mobileOpen) && (
          <div className="p-3 border-t border-[#E1E4DC] text-[11px] text-slate-500 text-center font-mono shrink-0">
            TruthTrace v1.0
          </div>
        )}
      </aside>
    </>
  );
};

import React from 'react';
import { Plus } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  description: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E4DC] pb-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-[#252720]">
          {title}
        </h1>
        <p className="text-xs text-slate-500 font-normal">
          {description}
        </p>
      </div>

      {primaryActionLabel && (
        <button
          onClick={onPrimaryAction}
          className="px-4 py-2 bg-[#52765C] hover:bg-[#43624C] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{primaryActionLabel}</span>
        </button>
      )}
    </div>
  );
};

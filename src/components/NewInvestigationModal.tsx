import React, { useState } from 'react';
import { X, Plus, FolderKanban } from 'lucide-react';
import { Investigation } from '../types/investigation';

interface NewInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (inv: Investigation) => void;
  onLoadDemo: () => void;
}

export const NewInvestigationModal: React.FC<NewInvestigationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  onLoadDemo,
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [investigator, setInvestigator] = useState('Lead Researcher');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newInv: Investigation = {
      id: `INV-${Date.now()}`,
      code,
      title,
      description: description || 'New investigative research workspace.',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'Active',
      documentIds: [],
      claimIds: [],
      contradictionIds: [],
      eventIds: [],
      tags: ['Custom Case'],
      investigator
    };

    onCreate(newInv);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E1E4DC] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#E8EFE6] rounded text-[#52765C]">
              <FolderKanban className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#252720]">
              Create New Investigation
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explore Demo Quick Bar */}
        <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-semibold text-[#252720]">Or Load Fictional Demo Incident</span>
            <p className="text-[11px] text-slate-500">Explore pre-populated Solaris Substation conflict case.</p>
          </div>
          <button
            onClick={() => {
              onLoadDemo();
              onClose();
            }}
            className="px-3 py-1.5 bg-[#52765C] hover:bg-[#43624C] text-white font-semibold rounded shrink-0 transition-all text-xs"
          >
            Load Demo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-600 font-medium block mb-1">Reference ID / Case Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E1E4DC] rounded font-mono text-[#252720] focus:outline-none focus:border-[#52765C]"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Investigation Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Substation 4 Safety Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E1E4DC] rounded text-[#252720] focus:outline-none focus:border-[#52765C]"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Lead Investigator</label>
            <input
              type="text"
              required
              value={investigator}
              onChange={(e) => setInvestigator(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E1E4DC] rounded text-[#252720] focus:outline-none focus:border-[#52765C]"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Scope & Objective</label>
            <textarea
              rows={3}
              placeholder="Brief description of target document scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E1E4DC] rounded text-[#252720] focus:outline-none focus:border-[#52765C]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1E4DC]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white text-slate-700 border border-[#E1E4DC] rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#52765C] hover:bg-[#43624C] text-white font-semibold rounded text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Case</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

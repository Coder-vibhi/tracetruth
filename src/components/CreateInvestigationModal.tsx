import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { Investigation } from '../types/investigation';

interface CreateInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (investigation: Investigation) => void;
}

export const CreateInvestigationModal: React.FC<CreateInvestigationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }

    // Generate unique ID and reference code
    const uniqueId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const randomCode = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const nowISO = new Date().toISOString();

    const newInvestigation: Investigation = {
      id: uniqueId,
      code: randomCode,
      title: trimmedTitle,
      description: description.trim(),
      createdAt: nowISO,
      updatedAt: nowISO,
      lastModified: nowISO,
      status: 'Active',
      documentIds: [],
      claimIds: [],
      contradictionIds: [],
      eventIds: [],
      tags: [],
      investigator: 'Lead Investigator'
    };

    setTitle('');
    setDescription('');
    setError(null);
    onCreate(newInvestigation);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E1E4DC] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#E8EFE6] rounded text-[#52765C]">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-[#252720]">
              Create New Investigation
            </h2>
          </div>
          <button 
            onClick={handleCancel} 
            className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
            title="Close"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label htmlFor="inv-title" className="text-[#252720] font-semibold block">
              Title <span className="text-[#881337]">*</span>
            </label>
            <input
              id="inv-title"
              type="text"
              placeholder="e.g. Substation Safety Audit"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error && e.target.value.trim()) setError(null);
              }}
              className={`w-full px-3 py-2 bg-[#FAF9F6] border rounded text-[#252720] focus:outline-none transition-colors ${
                error 
                  ? 'border-[#F43F5E] focus:border-[#F43F5E]' 
                  : 'border-[#E1E4DC] focus:border-[#52765C]'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-[11px] text-[#881337] font-medium pt-0.5">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="inv-desc" className="text-[#252720] font-semibold block">
              Description
            </label>
            <textarea
              id="inv-desc"
              rows={4}
              placeholder="Describe the objective and scope of this investigation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#E1E4DC] rounded text-[#252720] focus:outline-none focus:border-[#52765C] transition-colors"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E1E4DC]">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-white text-slate-700 hover:bg-[#FAF9F6] border border-[#E1E4DC] rounded-md text-xs font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#52765C] hover:bg-[#43624C] text-white font-semibold rounded-md text-xs shadow-xs transition-all cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

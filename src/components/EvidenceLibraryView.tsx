import React, { useState } from 'react';
import { EvidenceItem, ExtractedDocumentText, Investigation } from '../types/investigation';
import { PageHeader } from './PageHeader';
import { FileText, Eye, Trash2, Search, Filter, FolderKanban, AlertCircle, X, Info, Plus } from 'lucide-react';

interface EvidenceLibraryViewProps {
  evidenceList: EvidenceItem[];
  investigationsMap: Map<string, Investigation>;
  extractedTextsMap: Map<string, ExtractedDocumentText>;
  onRemoveEvidenceItem: (id: string) => void;
  onOpenInvestigation: (investigationId: string) => void;
  onNewInvestigation?: () => void;
}

export const EvidenceLibraryView: React.FC<EvidenceLibraryViewProps> = ({
  evidenceList,
  investigationsMap,
  extractedTextsMap,
  onRemoveEvidenceItem,
  onOpenInvestigation,
  onNewInvestigation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvId, setSelectedInvId] = useState<string>('ALL');
  const [selectedFileType, setSelectedFileType] = useState<string>('ALL');
  const [inspectingItem, setInspectingItem] = useState<EvidenceItem | null>(null);
  const [activePageTab, setActivePageTab] = useState<number | 'all'>('all');

  const filteredEvidence = evidenceList.filter((item) => {
    const inv = investigationsMap.get(item.investigationId);
    const invTitle = item.investigationTitle || inv?.title || '';

    const matchesSearch = 
      !searchQuery ||
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesInv = selectedInvId === 'ALL' || item.investigationId === selectedInvId;
    const matchesType = selectedFileType === 'ALL' || item.fileType === selectedFileType;

    return matchesSearch && matchesInv && matchesType;
  });

  const activeExtraction = inspectingItem
    ? extractedTextsMap.get(inspectingItem.id) || null
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Evidence Library"
        description="Browse and inspect evidence files uploaded across all active investigations."
      />

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#E1E4DC] rounded-xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name or case..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E1E4DC] rounded-md text-xs text-[#252720] placeholder-slate-400 focus:outline-none focus:border-[#52765C]"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E1E4DC] px-3 py-1.5 rounded-md">
            <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedInvId}
              onChange={(e) => setSelectedInvId(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Investigations</option>
              {Array.from(investigationsMap.values()).map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E1E4DC] px-3 py-1.5 rounded-md">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="pdf">PDF</option>
              <option value="txt">TXT</option>
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      {filteredEvidence.length > 0 ? (
        <div className="bg-white border border-[#E1E4DC] rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs text-[#252720]">
            <thead className="bg-[#FAF9F6] border-b border-[#E1E4DC] text-slate-500 font-mono text-[10px] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">File Name</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Investigation Case</th>
                <th className="py-2.5 px-4">Size</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E4DC]">
              {filteredEvidence.map((item) => {
                const inv = investigationsMap.get(item.investigationId);
                const invTitle = item.investigationTitle || inv?.title || 'Unknown Case';
                const extraction = extractedTextsMap.get(item.id);
                const status = extraction?.status || (item.fileType === 'png' || item.fileType === 'jpeg' ? 'unsupported' : 'success');

                return (
                  <tr key={item.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#252720]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#52765C] shrink-0" />
                        <span className="truncate max-w-xs">{item.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-[11px] font-semibold text-[#52765C]">
                      <span className="px-2 py-0.5 rounded bg-[#E8EFE6] border border-[#52765C]/20">
                        {item.fileType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <button
                        onClick={() => onOpenInvestigation(item.investigationId)}
                        className="font-medium text-[#52765C] hover:underline truncate max-w-xs block text-left"
                      >
                        {invTitle}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {item.formattedSize}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {status === 'success' && (
                        <span className="px-2 py-0.5 rounded bg-[#E8EFE6] text-[#52765C] font-semibold border border-[#52765C]/20">
                          {extraction?.pages.length ? `${extraction.pages.length} Pages Text` : 'Text Extracted'}
                        </span>
                      )}
                      {status === 'empty' && (
                        <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#78350F] font-semibold border border-[#D97706]/30">
                          No Selectable Text
                        </span>
                      )}
                      {status === 'unsupported' && (
                        <span className="px-2 py-0.5 rounded bg-[#FAF9F6] text-slate-600 font-semibold border border-[#E1E4DC]">
                          Requires OCR
                        </span>
                      )}
                      {status === 'error' && (
                        <span className="px-2 py-0.5 rounded bg-[#FFF1F2] text-[#881337] font-semibold border border-[#F43F5E]/30">
                          Extraction Error
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setInspectingItem(item);
                          setActivePageTab('all');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-[#FAF9F6] text-slate-700 border border-[#E1E4DC] rounded text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#52765C]" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => onRemoveEvidenceItem(item.id)}
                        className="p-1 text-slate-400 hover:text-[#881337] hover:bg-[#FFF1F2] rounded transition-colors"
                        title="Remove evidence"
                        aria-label={`Remove ${item.fileName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 bg-white border border-[#E1E4DC] rounded-xl text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#E8EFE6] text-[#52765C] flex items-center justify-center mx-auto shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#252720]">
              No evidence in library
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Evidence uploaded inside an active investigation workspace will automatically appear here.
            </p>
          </div>
          {onNewInvestigation && (
            <button
              onClick={onNewInvestigation}
              className="px-4 py-2 bg-[#52765C] hover:bg-[#43624C] text-white rounded-md text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Investigation</span>
            </button>
          )}
        </div>
      )}

      {/* Extracted Document Text / Image Inspector Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1E4DC] rounded-xl max-w-3xl w-full max-h-[85vh] p-6 space-y-4 shadow-xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-3 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#FAF9F6] text-[#52765C] border border-[#E1E4DC]">
                    {inspectingItem.fileType}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {inspectingItem.formattedSize}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#252720]">
                  {inspectingItem.fileName}
                </h3>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                title="Close inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case Reference Bar */}
            <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-md text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Investigation:</span>
                <span className="font-semibold text-[#252720]">
                  {inspectingItem.investigationTitle || investigationsMap.get(inspectingItem.investigationId)?.title || 'Unknown Case'}
                </span>
              </div>
              <button
                onClick={() => {
                  setInspectingItem(null);
                  onOpenInvestigation(inspectingItem.investigationId);
                }}
                className="text-xs font-semibold text-[#52765C] hover:underline"
              >
                Open Case Workspace →
              </button>
            </div>

            {/* Image Notice (PNG/JPEG) */}
            {(inspectingItem.fileType === 'png' || inspectingItem.fileType === 'jpeg') && (
              <div className="p-4 bg-[#FAF9F6] border border-[#E1E4DC] rounded-md text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#252720]">
                  <Info className="w-4 h-4 text-[#52765C]" />
                  <span>Image Evidence File ({inspectingItem.fileType.toUpperCase()})</span>
                </div>
                <p className="leading-relaxed">
                  PNG/JPEG image files require OCR, which is not enabled yet. Text extraction is available for PDF and TXT documents.
                </p>
              </div>
            )}

            {/* Status Warning Callout for PDF/TXT if empty or error */}
            {activeExtraction && activeExtraction.status !== 'success' && (
              <div className={`p-4 rounded-md border text-xs flex items-start gap-2.5 shrink-0 ${
                activeExtraction.status === 'unsupported' 
                  ? 'bg-[#FAF9F6] border-[#E1E4DC] text-slate-700'
                  : activeExtraction.status === 'empty'
                  ? 'bg-[#FEF3C7] border-[#D97706]/30 text-[#78350F]'
                  : 'bg-[#FFF1F2] border-[#F43F5E]/30 text-[#881337]'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">
                    {activeExtraction.status === 'unsupported'
                      ? 'OCR Not Enabled'
                      : activeExtraction.status === 'empty'
                      ? 'No Selectable Text Found'
                      : 'Extraction Error'}
                  </span>
                  <p className="leading-relaxed font-normal">
                    {activeExtraction.errorMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Page Tabs for Multi-Page PDF Documents */}
            {activeExtraction && activeExtraction.status === 'success' && activeExtraction.pages.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 border-b border-[#E1E4DC]">
                <button
                  onClick={() => setActivePageTab('all')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    activePageTab === 'all'
                      ? 'bg-[#52765C] text-white font-bold'
                      : 'bg-[#FAF9F6] text-slate-600 border border-[#E1E4DC] hover:bg-slate-100'
                  }`}
                >
                  All Pages ({activeExtraction.pages.length})
                </button>
                {activeExtraction.pages.map((p) => (
                  <button
                    key={p.pageNumber}
                    onClick={() => setActivePageTab(p.pageNumber)}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                      activePageTab === p.pageNumber
                        ? 'bg-[#52765C] text-white font-bold'
                        : 'bg-[#FAF9F6] text-slate-600 border border-[#E1E4DC] hover:bg-slate-100'
                    }`}
                  >
                    Page {p.pageNumber}
                  </button>
                ))}
              </div>
            )}

            {/* Extracted Text Content Box */}
            {activeExtraction && activeExtraction.status === 'success' && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg font-mono text-xs text-[#252720] leading-relaxed whitespace-pre-wrap">
                {activePageTab === 'all' ? (
                  activeExtraction.fullText
                ) : (
                  activeExtraction.pages.find((p) => p.pageNumber === activePageTab)?.text || 'No text on this page.'
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

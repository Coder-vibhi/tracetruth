import React, { useState } from 'react';
import { 
  FileSearch, 
  Search, 
  Filter, 
  FileText, 
  AlertTriangle, 
  Quote, 
  ExternalLink
} from 'lucide-react';
import { Claim, Document, Contradiction, ClaimCategory } from '../types/investigation';
import { ActiveTab } from './Sidebar';

interface EvidenceClaimsViewProps {
  claims: Claim[];
  documents: Document[];
  contradictions: Contradiction[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectContradiction: (id: string) => void;
}

export const EvidenceClaimsView: React.FC<EvidenceClaimsViewProps> = ({
  claims,
  documents,
  contradictions,
  searchQuery,
  setSearchQuery,
  setActiveTab,
  onSelectContradiction,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDocId, setSelectedDocId] = useState<string>('ALL');

  const categories: ClaimCategory[] = ['Timestamp', 'Identity', 'Causality', 'Location', 'Quantity', 'Action', 'Other'];

  const claimContradictionsMap = new Map<string, Contradiction>();
  contradictions.forEach(c => {
    c.claimIds.forEach(claimId => {
      claimContradictionsMap.set(claimId, c);
    });
  });

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      !searchQuery ||
      claim.claimText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.sourceExcerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.documentTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || claim.category === selectedCategory;
    const matchesDoc = selectedDocId === 'ALL' || claim.documentId === selectedDocId;

    return matchesSearch && matchesCategory && matchesDoc;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-[#E1E4DC] rounded-xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[#252720] flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-[#52765C]" />
            Evidence & Claim Catalog
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Indexed assertions extracted across all investigative source reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E1E4DC] px-3 py-1.5 rounded-md">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E1E4DC] px-3 py-1.5 rounded-md">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Source Documents</option>
              {documents.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Claims Stream */}
      <div className="space-y-3">
        {filteredClaims.map((claim) => {
          const connectedContradiction = claimContradictionsMap.get(claim.id);
          return (
            <div
              key={claim.id}
              className={`p-4 bg-white border rounded-xl space-y-2.5 transition-all shadow-2xs ${
                connectedContradiction
                  ? 'border-[#F43F5E]/40 hover:border-[#F43F5E]'
                  : 'border-[#E1E4DC] hover:border-slate-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FAF9F6] text-slate-600 border border-[#E1E4DC] font-semibold">
                    {claim.category}
                  </span>
                  <span className="font-medium text-[#52765C]">
                    {claim.documentTitle}
                  </span>
                </div>

                {connectedContradiction && (
                  <button
                    onClick={() => {
                      onSelectContradiction(connectedContradiction.id);
                      setActiveTab('investigations');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FFF1F2] text-[#881337] border border-[#F43F5E]/30 rounded text-[11px] font-medium"
                  >
                    <AlertTriangle className="w-3 h-3 text-[#F43F5E]" />
                    <span>Contradiction Flagged</span>
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="font-semibold text-[#252720]">{claim.subject}</span>
                  <span className="text-slate-400">({claim.predicate})</span>
                  <span className="font-bold text-[#881337] bg-[#FAF9F6] px-2 py-0.5 rounded border border-[#E1E4DC]">
                    Value: {claim.value}
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-normal">
                  {claim.claimText}
                </p>
              </div>

              <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg text-xs space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center justify-between">
                  <span>Source Excerpt Quote</span>
                  <span>{claim.locationIndex || `Page ${claim.pageNumber || 1}`}</span>
                </div>
                <p className="italic text-slate-700 leading-relaxed font-sans">
                  "{claim.sourceExcerpt}"
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

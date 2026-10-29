import React, { useState, useEffect } from 'react';
import { 
  Investigation, 
  EvidenceItem, 
  DocumentType, 
  ExtractedDocumentText, 
  Claim, 
  ClaimCategory,
  Contradiction,
  ContradictionStatus,
  Document
} from '../types/investigation';
import { extractDocumentText } from '../services/documentParser';
import { extractClaimsWithAI } from '../services/gemini';
import { detectContradictionsFromClaims, validateClaim, generateEventsFromClaims } from '../utils/contradictionEngine';
import { ContradictionExplorer } from './ContradictionExplorer';
import { EventTimeline } from './EventTimeline';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Trash2, 
  Info, 
  AlertCircle, 
  Eye, 
  X,
  Sparkles,
  Quote,
  Tag,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  ExternalLink,
  Search,
  RefreshCw,
  GitFork,
  Clock,
  Check,
  FileCheck,
  Edit3,
  Plus,
  FolderKanban
} from 'lucide-react';

export interface InvestigationWorkspaceProps {
  investigation: Investigation | null;
  evidenceList: EvidenceItem[];
  extractedTextsMap: Map<string, ExtractedDocumentText>;
  claimsMap: Map<string, Claim[]>;
  contradictionsMap?: Map<string, Contradiction[]>;
  onBackToInvestigations: () => void;
  onNewInvestigation?: () => void;
  onAddEvidenceItems: (items: EvidenceItem[], extractions: ExtractedDocumentText[]) => void;
  onRemoveEvidenceItem: (id: string) => void;
  onSetDocumentClaims: (documentId: string, claims: Claim[]) => void;
  onSetInvestigationContradictions?: (investigationId: string, contradictions: Contradiction[]) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(fileName: string): DocumentType | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'txt';
  if (ext === 'png') return 'png';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
  return null;
}

function getCategoryStyle(category: ClaimCategory): { bg: string; text: string; border: string } {
  switch (category) {
    case 'Timestamp':
      return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' };
    case 'Identity':
      return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' };
    case 'Causality':
      return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' };
    case 'Location':
      return { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' };
    case 'Quantity':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    case 'Action':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' };
  }
}

function getSeverityBadgeStyle(severity: 'Critical' | 'High' | 'Medium' | 'Low'): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'Critical':
      return { bg: 'bg-[#FFF1F2]', text: 'text-[#881337]', border: 'border-[#F43F5E]/30' };
    case 'High':
      return { bg: 'bg-[#FEF3C7]', text: 'text-[#78350F]', border: 'border-[#D97706]/30' };
    case 'Medium':
      return { bg: 'bg-[#EFF6FF]', text: 'text-[#1E3A8A]', border: 'border-[#3B82F6]/30' };
    case 'Low':
      return { bg: 'bg-[#FAF9F6]', text: 'text-slate-700', border: 'border-[#E1E4DC]' };
  }
}

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  investigation,
  evidenceList,
  extractedTextsMap,
  claimsMap,
  contradictionsMap,
  onBackToInvestigations,
  onNewInvestigation,
  onAddEvidenceItems,
  onRemoveEvidenceItem,
  onSetDocumentClaims,
  onSetInvestigationContradictions,
}) => {
  const [workspaceTab, setWorkspaceTab] = useState<'all' | 'evidence' | 'contradictions' | 'map' | 'timeline' | 'claims'>('all');

  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);
  const [isDetectingContradictions, setIsDetectingContradictions] = useState(false);

  const [inspectingItem, setInspectingItem] = useState<EvidenceItem | null>(null);
  const [activePageTab, setActivePageTab] = useState<number | 'all'>('all');
  const [inspectingTab, setInspectingTab] = useState<'text' | 'claims'>('text');
  const [highlightedExcerpt, setHighlightedExcerpt] = useState<string | null>(null);

  if (!investigation) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto text-center my-12">
        <div className="p-8 bg-white border border-[#E1E4DC] rounded-xl space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#E8EFE6] text-[#52765C] flex items-center justify-center mx-auto shadow-2xs">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#252720]">No Active Investigation Selected</h2>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              Create a new investigation case or select an existing case from Overview to start uploading evidence and analyzing claims.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            {onNewInvestigation && (
              <button
                onClick={onNewInvestigation}
                className="px-4 py-2 bg-[#52765C] hover:bg-[#43624C] text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Investigation</span>
              </button>
            )}
            <button
              onClick={onBackToInvestigations}
              className="px-4 py-2 bg-white hover:bg-[#FAF9F6] text-slate-700 border border-[#E1E4DC] rounded-md text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // All extracted claims across all documents in this investigation
  const allInvestigationClaims: Claim[] = evidenceList.flatMap((item) => {
    return claimsMap.get(item.id) || [];
  });

  // Current contradictions for this investigation
  const currentContradictions: Contradiction[] = contradictionsMap?.get(investigation.id) || [];

  // Update contradiction resolution status and optional notes
  const handleUpdateContradictionStatus = (contradictionId: string, status: ContradictionStatus, notes?: string) => {
    if (!onSetInvestigationContradictions || !investigation) return;
    const updated = currentContradictions.map((c) => {
      if (c.id === contradictionId) {
        return {
          ...c,
          status,
          notes: notes !== undefined ? notes : c.notes,
        };
      }
      return c;
    });
    onSetInvestigationContradictions(investigation.id, updated);
  };

  // Contradiction detection runner using indexed Map grouping and cross-document comparison
  const runContradictionDetection = () => {
    if (!investigation) return;
    setIsDetectingContradictions(true);

    const docsMap = new Map<string, { title: string }>();
    evidenceList.forEach((item) => {
      docsMap.set(item.id, { title: item.fileName });
    });

    const detected = detectContradictionsFromClaims(allInvestigationClaims, investigation.id, docsMap, currentContradictions);

    if (onSetInvestigationContradictions) {
      onSetInvestigationContradictions(investigation.id, detected);
    }

    setIsDetectingContradictions(false);
  };

  // Auto-run contradiction analysis whenever claimsMap or evidenceList updates
  useEffect(() => {
    if (allInvestigationClaims.length > 0 && onSetInvestigationContradictions) {
      const docsMap = new Map<string, { title: string }>();
      evidenceList.forEach((item) => {
        docsMap.set(item.id, { title: item.fileName });
      });

      const detected = detectContradictionsFromClaims(allInvestigationClaims, investigation.id, docsMap, currentContradictions);
      onSetInvestigationContradictions(investigation.id, detected);
    }
  }, [claimsMap, evidenceList.length]);

  // Handle document file upload and text extraction
  const handleFilesAdded = async (files: FileList | File[]) => {
    setErrorMessage(null);
    setGeminiError(null);
    setIsProcessing(true);

    const validItems: EvidenceItem[] = [];
    const extractions: ExtractedDocumentText[] = [];

    const existingSet = new Set<string>(
      evidenceList.map((e) => `${e.fileName}_${e.fileSize}`)
    );

    let errorNotice: string | null = null;
    let duplicateSkipped = false;

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const fileType = getFileType(file.name);

      if (!fileType) {
        errorNotice = 'Unsupported file type. Only PDF, TXT, PNG, and JPEG files are supported.';
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errorNotice = `File "${file.name}" exceeds maximum allowed size of 20MB.`;
        continue;
      }

      const fileKey = `${file.name}_${file.size}`;
      if (existingSet.has(fileKey)) {
        duplicateSkipped = true;
        continue;
      }

      existingSet.add(fileKey);

      const newItemId = `ev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const newItem: EvidenceItem = {
        id: newItemId,
        investigationId: investigation.id,
        investigationTitle: investigation.title,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        formattedSize: formatFileSize(file.size),
        uploadedAt: new Date().toISOString(),
      };

      const extractionResult = await extractDocumentText(newItemId, investigation.id, file, fileType);

      validItems.push(newItem);
      extractions.push(extractionResult);
    }

    setIsProcessing(false);

    if (errorNotice) {
      setErrorMessage(errorNotice);
    } else if (duplicateSkipped && validItems.length === 0) {
      setErrorMessage('Selected files are already present in this investigation.');
    }

    if (validItems.length > 0) {
      onAddEvidenceItems(validItems, extractions);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Perform AI claim extraction for a document using Gemini API
  const handleExtractClaimsForDoc = async (item: EvidenceItem) => {
    const extraction = extractedTextsMap.get(item.id);

    if (!extraction || extraction.status !== 'success' || !extraction.fullText.trim()) {
      setErrorMessage(`Cannot extract claims from "${item.fileName}": document text is empty or unreadable.`);
      return;
    }

    setExtractingDocId(item.id);
    setGeminiError(null);

    try {
      const claims = await extractClaimsWithAI({
        documentId: item.id,
        investigationId: investigation.id,
        documentTitle: item.fileName,
        content: extraction.fullText,
        pages: extraction.pages,
      });

      onSetDocumentClaims(item.id, claims);
    } catch (err: any) {
      console.error('Claim Extraction failed:', err);
      setGeminiError(
        err.message ||
          'Gemini API is not connected or failed to respond. Please ensure GEMINI_API_KEY is configured in backend/.env.'
      );
    } finally {
      setExtractingDocId(null);
    }
  };

  // Clickable source evidence handler: opens modal and focuses excerpt
  const handleOpenSourceEvidence = (documentId: string, pageNumber?: number, sourceExcerpt?: string) => {
    const foundItem = evidenceList.find((e) => e.id === documentId);
    if (foundItem) {
      setInspectingItem(foundItem);
      setActivePageTab(pageNumber || 'all');
      setInspectingTab('text');
      setHighlightedExcerpt(sourceExcerpt || null);
    } else {
      setErrorMessage('Source document could not be located in this investigation.');
    }
  };

  // Active document inspection helpers
  const activeExtraction = inspectingItem
    ? extractedTextsMap.get(inspectingItem.id) || null
    : null;

  const activeDocClaims = inspectingItem
    ? claimsMap.get(inspectingItem.id) || []
    : [];

  // Severity count breakdown
  const criticalCount = currentContradictions.filter(c => c.severity === 'Critical').length;
  const highCount = currentContradictions.filter(c => c.severity === 'High').length;
  const mediumLowCount = currentContradictions.filter(c => c.severity === 'Medium' || c.severity === 'Low').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Workspace Top Header Card */}
      <div className="p-4 sm:p-6 bg-white border border-[#E1E4DC] rounded-xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E4DC] pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF9F6] text-slate-600 border border-[#E1E4DC] font-medium">
              {investigation.code || investigation.id}
            </span>
            <h1 className="text-xl font-bold text-[#252720]">
              {investigation.title}
            </h1>
          </div>

          <button
            onClick={onBackToInvestigations}
            className="px-3.5 py-1.5 bg-white hover:bg-[#FAF9F6] text-slate-700 border border-[#E1E4DC] rounded-md text-xs font-medium transition-all shrink-0 self-start sm:self-auto cursor-pointer inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Investigations</span>
          </button>
        </div>

        {/* Description */}
        <div className="text-xs">
          {investigation.description ? (
            <p className="text-slate-600 leading-relaxed font-normal">
              {investigation.description}
            </p>
          ) : (
            <p className="text-slate-400 italic">No description provided.</p>
          )}
        </div>

        {/* Workspace Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#E1E4DC]">
          <button
            onClick={() => setWorkspaceTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              workspaceTab === 'all'
                ? 'bg-[#52765C] text-white shadow-xs'
                : 'bg-[#FAF9F6] text-slate-700 border border-[#E1E4DC] hover:bg-slate-100'
            }`}
          >
            <span>All Overview</span>
          </button>
          <button
            onClick={() => setWorkspaceTab('evidence')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              workspaceTab === 'evidence'
                ? 'bg-[#52765C] text-white shadow-xs'
                : 'bg-[#FAF9F6] text-slate-700 border border-[#E1E4DC] hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Evidence ({evidenceList.length})</span>
          </button>
          <button
            onClick={() => setWorkspaceTab('contradictions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              workspaceTab === 'contradictions'
                ? 'bg-[#881337] text-white shadow-xs'
                : 'bg-[#FFF1F2] text-[#881337] border border-[#F43F5E]/30 hover:bg-rose-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Contradictions & Resolution ({currentContradictions.length})</span>
          </button>
          <button
            onClick={() => setWorkspaceTab('map')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              workspaceTab === 'map'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'bg-[#EFF6FF] text-[#1E3A8A] border border-[#3B82F6]/30 hover:bg-blue-100'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Contradiction Map</span>
          </button>
          <button
            onClick={() => setWorkspaceTab('timeline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              workspaceTab === 'timeline'
                ? 'bg-[#78350F] text-white shadow-xs'
                : 'bg-[#FEF3C7] text-[#78350F] border border-[#D97706]/30 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => setWorkspaceTab('claims')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              workspaceTab === 'claims'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extracted Claims ({allInvestigationClaims.length})</span>
          </button>
        </div>
      </div>

      {/* Gemini API Missing or Error Banner */}
      {geminiError && (
        <div className="p-4 bg-[#FFF1F2] border border-[#F43F5E]/30 rounded-xl text-xs text-[#881337] space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-[#F43F5E] shrink-0" />
              <span>Gemini API Setup Required</span>
            </div>
            <button
              onClick={() => setGeminiError(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="leading-relaxed font-normal">
            {geminiError}
          </p>
        </div>
      )}

      {/* EVIDENCE UPLOAD & MANAGEMENT SECTION */}
      {(workspaceTab === 'all' || workspaceTab === 'evidence') && (
        <div className="p-6 bg-white border border-[#E1E4DC] rounded-xl space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-4">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-[#252720]">
                Evidence ({evidenceList.length})
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Upload PDF and TXT files for text extraction, Gemini AI claim identification, and contradiction analysis.
              </p>
            </div>

            {/* Upload Button */}
            <label className={`px-3.5 py-1.5 bg-[#52765C] hover:bg-[#43624C] text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
              isProcessing ? 'opacity-60 pointer-events-none' : ''
            }`}>
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Extracting Text...' : 'Upload Evidence'}</span>
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.png,.jpeg,.jpg"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`p-6 border-2 border-dashed rounded-lg text-center space-y-2 transition-all ${
              dragOver
                ? 'border-[#52765C] bg-[#E8EFE6]/30'
                : 'border-[#E1E4DC] bg-[#FAF9F6] hover:border-[#52765C]/50'
            }`}
          >
            <p className="text-xs font-semibold text-[#252720]">
              {isProcessing ? 'Parsing document text...' : 'Drag & drop files here, or click "Upload Evidence"'}
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              Supports PDF and TXT files up to 20MB
            </p>
          </div>

          {/* Error Validation Notice */}
          {errorMessage && (
            <div className="p-3 bg-[#FFF1F2] border border-[#F43F5E]/30 rounded-md text-xs text-[#881337] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#F43F5E] shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Evidence List */}
          {evidenceList.length > 0 ? (
            <div className="border border-[#E1E4DC] rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs text-[#252720]">
                <thead className="bg-[#FAF9F6] border-b border-[#E1E4DC] text-slate-500 font-mono text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">File Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Size</th>
                    <th className="py-2.5 px-4">Status & Claims</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E4DC]">
                  {evidenceList.map((item) => {
                    const extraction = extractedTextsMap.get(item.id);
                    const docClaims = claimsMap.get(item.id) || [];
                    const isExtractingThis = extractingDocId === item.id;
                    const canExtract = extraction && extraction.status === 'success' && extraction.fullText.trim().length > 0;

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#252720]">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#52765C] shrink-0" />
                            <span className="truncate max-w-md">{item.fileName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono uppercase text-[11px] font-semibold text-[#52765C]">
                          <span className="px-2 py-0.5 rounded bg-[#E8EFE6] border border-[#52765C]/20">
                            {item.fileType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                          {item.formattedSize}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {extraction?.status === 'success' && (
                              <span className="px-2 py-0.5 rounded bg-[#E8EFE6] text-[#52765C] font-semibold border border-[#52765C]/20">
                                {extraction.pages.length ? `${extraction.pages.length} Pages` : 'Text Ready'}
                              </span>
                            )}
                            {docClaims.length > 0 && (
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                <span>{docClaims.length} Claims</span>
                              </span>
                            )}
                            {extraction?.status === 'empty' && (
                              <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#78350F] font-semibold border border-[#D97706]/30">
                                No Text
                              </span>
                            )}
                            {(item.fileType === 'png' || item.fileType === 'jpeg') && (
                              <span className="px-2 py-0.5 rounded bg-[#FAF9F6] text-slate-600 font-semibold border border-[#E1E4DC]">
                                OCR Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {canExtract && (
                            <button
                              onClick={() => handleExtractClaimsForDoc(item)}
                              disabled={isExtractingThis}
                              className={`px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                                isExtractingThis ? 'opacity-60 cursor-wait' : ''
                              }`}
                              title="Extract factual claims using Gemini API"
                            >
                              {isExtractingThis ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                  <span>Extracting...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>{docClaims.length > 0 ? 'Re-extract' : 'Extract Claims'}</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setInspectingItem(item);
                              setActivePageTab('all');
                              setInspectingTab(docClaims.length > 0 ? 'claims' : 'text');
                              setHighlightedExcerpt(null);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-[#FAF9F6] text-slate-700 border border-[#E1E4DC] rounded text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#52765C]" />
                            <span>Preview Evidence</span>
                          </button>
                          <button
                            onClick={() => onRemoveEvidenceItem(item.id)}
                            className="p-1 text-slate-400 hover:text-[#881337] hover:bg-[#FFF1F2] rounded transition-colors cursor-pointer"
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
            <div className="p-8 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg text-center space-y-2">
              <p className="text-xs font-medium text-slate-500">
                No evidence added yet
              </p>
            </div>
          )}
        </div>
      )}

      {/* CONTRADICTION DETECTION & RESOLUTION SECTION */}
      {(workspaceTab === 'all' || workspaceTab === 'contradictions') && (
        <div className="p-6 bg-white border border-[#E1E4DC] rounded-xl space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E4DC] pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#881337]" />
                <h2 className="text-sm font-bold text-[#252720]">
                  Contradictions & Discrepancy Resolution ({currentContradictions.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Automated cross-document comparison matching subject and predicate to detect conflicting dates, locations, or status reports. Mark status and save resolution notes.
              </p>
            </div>

            <button
              onClick={runContradictionDetection}
              disabled={isDetectingContradictions || allInvestigationClaims.length < 2}
              className={`px-3.5 py-1.5 bg-[#881337] hover:bg-[#6b0f2b] text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
                isDetectingContradictions || allInvestigationClaims.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDetectingContradictions ? 'animate-spin' : ''}`} />
              <span>{isDetectingContradictions ? 'Analyzing...' : 'Detect Contradictions'}</span>
            </button>
          </div>

          {/* Severity & Resolution Breakdown Pills */}
          {currentContradictions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-mono text-[11px] font-semibold">Breakdown:</span>
              {criticalCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#881337] border border-[#F43F5E]/30 font-bold font-mono text-[11px]">
                  {criticalCount} Critical
                </span>
              )}
              {highCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#78350F] border border-[#D97706]/30 font-bold font-mono text-[11px]">
                  {highCount} High
                </span>
              )}
              {mediumLowCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E3A8A] border border-[#3B82F6]/30 font-bold font-mono text-[11px]">
                  {mediumLowCount} Medium / Low
                </span>
              )}
            </div>
          )}

          {/* Contradiction Cards */}
          {currentContradictions.length > 0 ? (
            <div className="space-y-4">
              {currentContradictions.map((contradiction) => {
                const badgeStyle = getSeverityBadgeStyle(contradiction.severity);
                return (
                  <div
                    key={contradiction.id}
                    className="p-5 bg-white border border-[#E1E4DC] rounded-xl space-y-4 shadow-xs hover:border-[#881337]/40 transition-colors"
                  >
                    {/* Top Header Line */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E1E4DC] pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                          {contradiction.severity} Discrepancy
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          contradiction.status === 'Resolved'
                            ? 'bg-[#E8EFE6] text-[#52765C] border-[#52765C]/30'
                            : contradiction.status === 'Needs Review'
                            ? 'bg-[#FEF3C7] text-[#78350F] border-[#D97706]/30'
                            : 'bg-[#FFF1F2] text-[#881337] border-[#F43F5E]/30'
                        }`}>
                          {contradiction.status}
                        </span>
                        <span className="text-xs font-bold text-[#252720]">
                          {contradiction.subject}
                        </span>
                        <span className="text-xs font-mono text-[#52765C] bg-[#E8EFE6] px-1.5 py-0.5 rounded">
                          ({contradiction.predicate})
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {contradiction.id}
                      </span>
                    </div>

                    {/* Objective Explanation Box */}
                    <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg text-xs text-slate-700 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#881337]">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Evidence Conflict Analysis</span>
                      </div>
                      <p className="leading-relaxed font-normal">
                        {contradiction.explanation}
                      </p>
                    </div>

                    {/* Contradiction Resolution & Notes Panel */}
                    <div className="p-3.5 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg text-xs space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1E4DC]/60 pb-2">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                          <Edit3 className="w-3.5 h-3.5 text-[#52765C]" />
                          <span>Resolution Status</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(['Unresolved', 'Resolved', 'Needs Review'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => handleUpdateContradictionStatus(contradiction.id, st, contradiction.notes)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-all cursor-pointer ${
                                contradiction.status === st
                                  ? st === 'Resolved'
                                    ? 'bg-[#E8EFE6] text-[#52765C] border-[#52765C] font-bold shadow-2xs'
                                    : st === 'Needs Review'
                                    ? 'bg-[#FEF3C7] text-[#78350F] border-[#D97706] font-bold shadow-2xs'
                                    : 'bg-[#FFF1F2] text-[#881337] border-[#F43F5E] font-bold shadow-2xs'
                                  : 'bg-white text-slate-600 border-[#E1E4DC] hover:bg-slate-50'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block">
                          Investigator Resolution Notes
                        </span>
                        <textarea
                          value={contradiction.notes || ''}
                          onChange={(e) => handleUpdateContradictionStatus(contradiction.id, contradiction.status, e.target.value)}
                          placeholder="Type investigative rationale, verified truth, or resolution notes..."
                          rows={2}
                          className="w-full p-2 bg-white border border-[#E1E4DC] rounded text-xs text-[#252720] focus:outline-none focus:border-[#52765C] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Competing Evidence Sources Side-by-Side */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                        Competing Evidence Assertions ({contradiction.competingValues.length} Documents)
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {contradiction.competingValues.map((cv, idx) => (
                          <div
                            key={`${cv.claimId}_${idx}`}
                            className="p-3.5 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-2.5 text-xs flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              {/* Document & Page */}
                              <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-2">
                                <span className="font-semibold text-[#252720] truncate max-w-[200px]" title={cv.documentTitle}>
                                  {cv.documentTitle}
                                </span>
                                {cv.pageNumber && (
                                  <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-[#E1E4DC]">
                                    Page {cv.pageNumber}
                                  </span>
                                )}
                              </div>

                              {/* Asserted Value */}
                              <div className="bg-white p-2 rounded border border-[#E1E4DC] space-y-0.5">
                                <span className="text-[9px] font-mono text-slate-400 uppercase block">Asserted Value</span>
                                <span className="text-xs font-bold text-[#881337] font-mono">{cv.value}</span>
                              </div>

                              {/* Source Excerpt Quote */}
                              {cv.sourceExcerpt && (
                                <div className="p-2 bg-white border-l-2 border-[#881337] text-[11px] font-mono text-slate-600 italic leading-relaxed">
                                  "{cv.sourceExcerpt}"
                                </div>
                              )}
                            </div>

                            {/* Clickable Source Evidence Link Button */}
                            <div className="pt-2 border-t border-[#E1E4DC]/60 flex justify-end">
                              <button
                                onClick={() => handleOpenSourceEvidence(cv.documentId, cv.pageNumber, cv.sourceExcerpt)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-[#E1E4DC] rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Inspect source document text and quote"
                              >
                                <ExternalLink className="w-3 h-3 text-[#52765C]" />
                                <span>Preview Evidence</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg text-center space-y-2">
              <p className="text-xs font-medium text-slate-500">
                No contradictions detected
              </p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto font-normal">
                Extract claims from at least two evidence documents with conflicting values (e.g. differing dates, locations, or status reports) to analyze contradictions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CONTRADICTION MAP SECTION */}
      {(workspaceTab === 'all' || workspaceTab === 'map') && (
        <div className="p-6 bg-white border border-[#E1E4DC] rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-3">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#1E3A8A]" />
              <h2 className="text-sm font-bold text-[#252720]">
                Contradiction Graph Map
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Visually connecting conflicting claims to source documents
            </span>
          </div>

          <ContradictionExplorer
            documents={evidenceList.map(item => ({
              id: item.id,
              title: item.fileName,
              type: item.fileType,
              author: 'Evidence Source',
              uploadDate: item.uploadedAt,
              fileSize: item.formattedSize,
              content: extractedTextsMap.get(item.id)?.fullText || '',
              claimCount: (claimsMap.get(item.id) || []).length,
              status: 'processed'
            }))}
            claims={allInvestigationClaims}
            contradictions={currentContradictions}
            events={generateEventsFromClaims(allInvestigationClaims)}
            onUpdateContradiction={handleUpdateContradictionStatus}
          />
        </div>
      )}

      {/* INVESTIGATION TIMELINE SECTION */}
      {(workspaceTab === 'all' || workspaceTab === 'timeline') && (
        <div className="p-6 bg-white border border-[#E1E4DC] rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#78350F]" />
              <h2 className="text-sm font-bold text-[#252720]">
                Investigation Timeline
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Chronological event sequence with uncertain timestamp markers
            </span>
          </div>

          <EventTimeline
            events={generateEventsFromClaims(allInvestigationClaims)}
            claims={allInvestigationClaims}
            documents={evidenceList.map(item => ({
              id: item.id,
              title: item.fileName,
              type: item.fileType,
              author: 'Evidence Source',
              uploadDate: item.uploadedAt,
              fileSize: item.formattedSize,
              content: extractedTextsMap.get(item.id)?.fullText || '',
              claimCount: (claimsMap.get(item.id) || []).length,
              status: 'processed'
            }))}
          />
        </div>
      )}

      {/* EXTRACTED CLAIMS & EVIDENCE VALIDATION SECTION */}
      {(workspaceTab === 'all' || workspaceTab === 'claims') && (
        <div className="p-6 bg-white border border-[#E1E4DC] rounded-xl space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-[#252720]">
                  Extracted Claims & Validation ({allInvestigationClaims.length})
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Factual assertions extracted from documents using Gemini API, with evidence reference validation checks.
              </p>
            </div>
          </div>

          {allInvestigationClaims.length > 0 ? (
            <div className="space-y-4">
              {allInvestigationClaims.map((claim) => {
                const style = getCategoryStyle(claim.category);
                const docText = extractedTextsMap.get(claim.documentId)?.fullText;
                const valResult = validateClaim(claim, docText);

                return (
                  <div
                    key={claim.id}
                    className="p-4 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-3 hover:border-[#52765C]/40 transition-colors"
                  >
                    {/* Claim Top Line */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E1E4DC] pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                          {claim.category}
                        </span>
                        <span className="text-xs font-semibold text-[#252720]">
                          {claim.documentTitle}
                        </span>
                        {claim.pageNumber && (
                          <span className="text-[10px] font-mono text-slate-500 bg-white border border-[#E1E4DC] px-1.5 py-0.5 rounded">
                            Page {claim.pageNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {claim.id}
                      </span>
                    </div>

                    {/* Claims Validation Indicators Row */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      {valResult.isSourceExcerptVerified ? (
                        <span className="px-2 py-0.5 rounded bg-[#E8EFE6] text-[#52765C] border border-[#52765C]/20 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#52765C]" />
                          <span>Verified Source Excerpt</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#78350F] border border-[#D97706]/30 font-semibold inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-[#D97706]" />
                          <span>Unverified Reference</span>
                        </span>
                      )}

                      {claim.category === 'Timestamp' && (
                        valResult.isValidDate ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
                            Date Validated: {valResult.canonicalDate || claim.value}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                            Uncertain Date
                          </span>
                        )
                      )}

                      {claim.category === 'Location' && valResult.isValidLocation && (
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                          Location Validated
                        </span>
                      )}

                      {claim.category === 'Causality' && valResult.isValidCause && (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                          Cause Validated
                        </span>
                      )}
                    </div>

                    {/* Normalized Triples */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded border border-[#E1E4DC] text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Subject</span>
                        <span className="font-semibold text-[#252720]">{claim.subject}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Predicate</span>
                        <span className="font-semibold text-[#52765C]">{claim.predicate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Asserted Value</span>
                        <span className="font-semibold text-[#252720]">{claim.value}</span>
                      </div>
                    </div>

                    {/* Claim Statement */}
                    <div className="space-y-1">
                      <p className="text-xs text-[#252720] font-medium leading-relaxed">
                        {claim.claimText}
                      </p>
                    </div>

                    {/* Source Excerpt Quote with Preview Evidence link */}
                    {claim.sourceExcerpt && (
                      <div className="p-2.5 bg-white border-l-2 border-[#52765C] rounded-r text-xs text-slate-600 font-mono leading-relaxed space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-slate-400 uppercase font-sans font-semibold">
                            <Quote className="w-3 h-3 text-[#52765C]" />
                            <span>Source Excerpt</span>
                          </div>
                          <button
                            onClick={() => handleOpenSourceEvidence(claim.documentId, claim.pageNumber, claim.sourceExcerpt)}
                            className="text-slate-600 hover:text-[#52765C] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Preview in Document</span>
                          </button>
                        </div>
                        <p className="italic text-slate-700">"{claim.sourceExcerpt}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg text-center space-y-2">
              <p className="text-xs font-medium text-slate-500">
                No claims extracted yet
              </p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto font-normal">
                Upload a PDF or TXT evidence document and click "Extract Claims" to extract factual assertions using Gemini API.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Extracted Document Text & Claims Inspector Modal */}
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
                onClick={() => {
                  setInspectingItem(null);
                  setHighlightedExcerpt(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                title="Close text inspector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Highlight Banner if navigating from Contradictions */}
            {highlightedExcerpt && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 font-mono">
                  <Search className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-semibold">Inspecting Source Excerpt:</span>
                  <span className="italic truncate max-w-md">"{highlightedExcerpt}"</span>
                </div>
                <button
                  onClick={() => setHighlightedExcerpt(null)}
                  className="text-amber-700 hover:text-amber-900 font-bold"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Navigation Tabs: Extracted Text vs Claims */}
            <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingTab('text')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    inspectingTab === 'text'
                      ? 'bg-[#52765C] text-white'
                      : 'bg-[#FAF9F6] text-slate-600 border border-[#E1E4DC] hover:bg-slate-100'
                  }`}
                >
                  Document Text
                </button>
                <button
                  onClick={() => setInspectingTab('claims')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1 cursor-pointer ${
                    inspectingTab === 'claims'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Claims ({activeDocClaims.length})</span>
                </button>
              </div>

              {/* Action button inside modal to run Gemini extraction */}
              {activeExtraction && activeExtraction.status === 'success' && (
                <button
                  onClick={() => handleExtractClaimsForDoc(inspectingItem)}
                  disabled={extractingDocId === inspectingItem.id}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  {extractingDocId === inspectingItem.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Extract Claims with Gemini</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Tab 1: Document Text View */}
            {inspectingTab === 'text' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden">
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

                {/* Text Content */}
                {activeExtraction && activeExtraction.status === 'success' ? (
                  <div className="flex-1 overflow-y-auto p-4 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg font-mono text-xs text-[#252720] leading-relaxed whitespace-pre-wrap">
                    {activePageTab === 'all' ? (
                      activeExtraction.fullText
                    ) : (
                      activeExtraction.pages.find((p) => p.pageNumber === activePageTab)?.text || 'No text on this page.'
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg text-xs text-slate-600">
                    No extracted text available.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Document Extracted Claims View */}
            {inspectingTab === 'claims' && (
              <div className="flex-1 overflow-y-auto space-y-3">
                {activeDocClaims.length > 0 ? (
                  activeDocClaims.map((claim) => {
                    const style = getCategoryStyle(claim.category);
                    return (
                      <div key={claim.id} className="p-3.5 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-2">
                          <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}>
                            {claim.category}
                          </span>
                          {claim.pageNumber && (
                            <span className="text-[10px] font-mono text-slate-500">
                              Page {claim.pageNumber}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded border border-[#E1E4DC] text-[11px]">
                          <div><span className="text-[9px] text-slate-400 block uppercase">Subj</span><span className="font-semibold">{claim.subject}</span></div>
                          <div><span className="text-[9px] text-slate-400 block uppercase">Pred</span><span className="font-semibold text-[#52765C]">{claim.predicate}</span></div>
                          <div><span className="text-[9px] text-slate-400 block uppercase">Val</span><span className="font-semibold">{claim.value}</span></div>
                        </div>
                        <p className="font-medium text-[#252720]">{claim.claimText}</p>
                        {claim.sourceExcerpt && (
                          <div className="p-2 bg-white border-l-2 border-[#52765C] text-[11px] font-mono text-slate-600 italic">
                            "{claim.sourceExcerpt}"
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center space-y-2 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg text-xs text-slate-500">
                    <p className="font-semibold">No claims extracted for this document yet.</p>
                    <p className="text-[11px] text-slate-400">Click "Extract Claims with Gemini" above to identify factual claims using AI.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

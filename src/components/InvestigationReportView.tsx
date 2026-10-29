import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ShieldAlert, 
  Info,
  BookOpen
} from 'lucide-react';
import { Investigation, Document, Claim, Contradiction, Event } from '../types/investigation';
import { DEMO_DISCLAIMER } from '../data/demoData';

interface InvestigationReportViewProps {
  investigation: Investigation;
  documents: Document[];
  claims: Claim[];
  contradictions: Contradiction[];
  events: Event[];
}

export const InvestigationReportView: React.FC<InvestigationReportViewProps> = ({
  investigation,
  documents,
  claims,
  contradictions,
  events,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = () => {
    const mdContent = `# TRUTHTRACE INVESTIGATION REPORT
Case File: ${investigation.code}
Title: ${investigation.title}
Investigator: ${investigation.investigator}
Date: ${new Date().toLocaleDateString()}

## EXECUTIVE SUMMARY
${investigation.description}

## SOURCE DOCUMENTS ANALYZED (${documents.length})
${documents.map(d => `- **${d.title}** (${d.type.toUpperCase()}) by ${d.author} — ${d.claimCount} extracted claims`).join('\n')}

## KEY CONTRADICTIONS & DISCREPANCIES (${contradictions.length})
${contradictions.map(c => `### ${c.title} (${c.severity} Severity)
Subject: ${c.subject} (${c.predicate})
Explanation: ${c.explanation}
Competing Values:
${c.competingValues.map(cv => `  - [${cv.documentTitle}]: "${cv.value}" (Excerpt: "${cv.sourceExcerpt}")`).join('\n')}
`).join('\n')}

## UNRESOLVED QUESTIONS & LIMITATIONS
1. SCADA Telemetry Synchronization: Precise clock drifts between Substation 4 sensors and central audit logs require hardware trace.
2. Badge Swipe Verification: Discrepancy between 2 reported console operators and 4 keycard swipes in Control Room Alpha.
3. Disclaimer: ${DEMO_DISCLAIMER}
`;

    navigator.clipboard.writeText(mdContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const reportData = {
      investigation,
      documents,
      claims,
      contradictions,
      events,
      generatedAt: new Date().toISOString(),
      disclaimer: DEMO_DISCLAIMER
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${investigation.code}_TruthTrace_Audit_Package.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#E1E4DC] rounded-xl shadow-xs print:hidden">
        <div>
          <h2 className="text-sm font-bold text-[#252720] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#52765C]" />
            Executive Audit Report
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Export or print the full structured report mapping claims, source excerpts, and discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 bg-white hover:bg-[#FAF9F6] text-slate-700 rounded-md text-xs font-medium border border-[#E1E4DC] flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#52765C]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied MD' : 'Copy MD'}</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="px-3 py-1.5 bg-white hover:bg-[#FAF9F6] text-slate-700 rounded-md text-xs font-medium border border-[#E1E4DC] flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#52765C] hover:bg-[#43624C] text-white font-semibold rounded-md text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="p-8 bg-white border border-[#E1E4DC] rounded-xl space-y-6 text-[#252720] shadow-xs print:p-0 print:border-none">
        {/* Title Block */}
        <div className="border-b border-[#E1E4DC] pb-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono px-2 py-0.5 bg-[#FAF9F6] text-slate-600 border border-[#E1E4DC] rounded font-bold">
              {investigation.code}
            </span>
            <span className="text-xs font-mono text-slate-500">
              Generated: {new Date().toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-[#252720]">
            TruthTrace Audit Report: {investigation.title}
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Investigator</span>
              <span className="font-semibold text-[#252720]">{investigation.investigator}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Source Documents</span>
              <span className="font-semibold text-[#52765C]">{documents.length} Files</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Contradictions</span>
              <span className="font-semibold text-[#881337]">{contradictions.length} Discrepancies</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Case Status</span>
              <span className="font-semibold text-[#52765C]">{investigation.status}</span>
            </div>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-3.5 bg-[#E8EFE6] border border-[#52765C]/30 rounded-lg flex items-start gap-2.5 text-xs text-[#252720]">
          <Info className="w-4 h-4 text-[#52765C] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#52765C]">Mandatory Notice: </span>
            {DEMO_DISCLAIMER}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-xs font-mono font-bold text-[#52765C] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#52765C]" />
            1. Executive Summary
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {investigation.description}
          </p>
        </div>

        {/* Contradictions Matrix */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold text-[#881337] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#881337]" />
            2. Identified Contradiction Matrix
          </h2>

          <div className="space-y-3">
            {contradictions.map((contr) => (
              <div key={contr.id} className="p-4 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-2">
                  <span className="font-bold text-[#252720]">{contr.title}</span>
                  <span className="px-2 py-0.5 font-mono text-[10px] bg-[#FFF1F2] text-[#881337] border border-[#F43F5E]/30 rounded font-bold">
                    {contr.severity} Severity
                  </span>
                </div>
                <p className="text-slate-600">{contr.explanation}</p>

                <div className="space-y-1 pt-1">
                  {contr.competingValues.map((cv, i) => (
                    <div key={i} className="p-2 bg-white border border-[#E1E4DC] rounded text-[11px] flex items-center justify-between gap-2">
                      <span className="font-bold text-[#52765C] shrink-0">{cv.documentTitle}:</span>
                      <span className="font-mono font-bold text-[#881337] shrink-0">{cv.value}</span>
                      <span className="italic text-slate-500 truncate">"{cv.sourceExcerpt}"</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

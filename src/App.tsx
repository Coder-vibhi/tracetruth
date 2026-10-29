/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InvestigationWorkspace } from './components/InvestigationWorkspace';
import { EvidenceLibraryView } from './components/EvidenceLibraryView';
import { SettingsView } from './components/SettingsView';
import { CreateInvestigationModal } from './components/CreateInvestigationModal';
import { Investigation, EvidenceItem, ExtractedDocumentText, Claim, Contradiction } from './types/investigation';

const STORAGE_KEYS = {
  INVESTIGATIONS: 'truthtrace_investigations_v2',
  EVIDENCE: 'truthtrace_evidence_v2',
  EXTRACTIONS: 'truthtrace_extractions_v2',
  CLAIMS: 'truthtrace_claims_v2',
  CONTRADICTIONS: 'truthtrace_contradictions_v2',
  ACTIVE_INV: 'truthtrace_active_inv_v2',
};

function loadStoredState() {
  try {
    const rawInvs = localStorage.getItem(STORAGE_KEYS.INVESTIGATIONS);
    const rawEv = localStorage.getItem(STORAGE_KEYS.EVIDENCE);
    const rawExt = localStorage.getItem(STORAGE_KEYS.EXTRACTIONS);
    const rawClm = localStorage.getItem(STORAGE_KEYS.CLAIMS);
    const rawCnt = localStorage.getItem(STORAGE_KEYS.CONTRADICTIONS);
    const storedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_INV);

    const invMap = new Map<string, Investigation>();
    if (rawInvs) {
      const parsed: Investigation[] = JSON.parse(rawInvs);
      parsed.forEach((inv) => invMap.set(inv.id, inv));
    }

    const evMap = new Map<string, EvidenceItem>();
    if (rawEv) {
      const parsed: EvidenceItem[] = JSON.parse(rawEv);
      parsed.forEach((item) => evMap.set(item.id, item));
    }

    const extMap = new Map<string, ExtractedDocumentText>();
    if (rawExt) {
      const parsed: ExtractedDocumentText[] = JSON.parse(rawExt);
      parsed.forEach((ext) => extMap.set(ext.id, ext));
    }

    const clmMap = new Map<string, Claim[]>();
    if (rawClm) {
      const parsed: Record<string, Claim[]> = JSON.parse(rawClm);
      Object.entries(parsed).forEach(([docId, claims]) => clmMap.set(docId, claims));
    }

    const cntMap = new Map<string, Contradiction[]>();
    if (rawCnt) {
      const parsed: Record<string, Contradiction[]> = JSON.parse(rawCnt);
      Object.entries(parsed).forEach(([invId, cnts]) => cntMap.set(invId, cnts));
    }

    const activeId = storedActiveId && invMap.has(storedActiveId) ? storedActiveId : null;

    return { invMap, evMap, extMap, clmMap, cntMap, activeId };
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return {
      invMap: new Map<string, Investigation>(),
      evMap: new Map<string, EvidenceItem>(),
      extMap: new Map<string, ExtractedDocumentText>(),
      clmMap: new Map<string, Claim[]>(),
      cntMap: new Map<string, Contradiction[]>(),
      activeId: null,
    };
  }
}

export default function App() {
  const initialState = useMemo(() => loadStoredState(), []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Single shared source of truth for investigations (starts empty unless user created investigations)
  const [investigationsMap, setInvestigationsMap] = useState<Map<string, Investigation>>(
    initialState.invMap
  );
  const [activeInvestigationId, setActiveInvestigationId] = useState<string | null>(
    initialState.activeId
  );

  // Single shared source of truth for evidence items
  const [evidenceItemsMap, setEvidenceItemsMap] = useState<Map<string, EvidenceItem>>(
    initialState.evMap
  );

  // Single shared source of truth for extracted document texts
  const [extractedTextsMap, setExtractedTextsMap] = useState<Map<string, ExtractedDocumentText>>(
    initialState.extMap
  );

  // Single shared source of truth for extracted claims
  const [claimsMap, setClaimsMap] = useState<Map<string, Claim[]>>(
    initialState.clmMap
  );

  // Single shared source of truth for detected contradictions
  const [contradictionsMap, setContradictionsMap] = useState<Map<string, Contradiction[]>>(
    initialState.cntMap
  );

  // Persist state updates to localStorage whenever user modifies data
  useEffect(() => {
    try {
      const invs = Array.from(investigationsMap.values());
      localStorage.setItem(STORAGE_KEYS.INVESTIGATIONS, JSON.stringify(invs));

      const evs = Array.from(evidenceItemsMap.values());
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(evs));

      const exts = Array.from(extractedTextsMap.values());
      localStorage.setItem(STORAGE_KEYS.EXTRACTIONS, JSON.stringify(exts));

      const clmObj: Record<string, Claim[]> = {};
      claimsMap.forEach((claims, docId) => {
        clmObj[docId] = claims;
      });
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(clmObj));

      const cntObj: Record<string, Contradiction[]> = {};
      contradictionsMap.forEach((cnts, invId) => {
        cntObj[invId] = cnts;
      });
      localStorage.setItem(STORAGE_KEYS.CONTRADICTIONS, JSON.stringify(cntObj));

      if (activeInvestigationId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_INV, activeInvestigationId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_INV);
      }
    } catch (err) {
      console.error('Failed to persist state to localStorage:', err);
    }
  }, [investigationsMap, evidenceItemsMap, extractedTextsMap, claimsMap, contradictionsMap, activeInvestigationId]);

  // Clear all manually created data and return to clean 0 state
  const handleClearWorkspaceData = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.INVESTIGATIONS);
      localStorage.removeItem(STORAGE_KEYS.EVIDENCE);
      localStorage.removeItem(STORAGE_KEYS.EXTRACTIONS);
      localStorage.removeItem(STORAGE_KEYS.CLAIMS);
      localStorage.removeItem(STORAGE_KEYS.CONTRADICTIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_INV);
    } catch (e) {
      // ignore
    }

    setInvestigationsMap(new Map());
    setEvidenceItemsMap(new Map());
    setExtractedTextsMap(new Map());
    setClaimsMap(new Map());
    setContradictionsMap(new Map());
    setActiveInvestigationId(null);
    setActiveTab('overview');
  };

  // Trigger Create Modal
  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Create Investigation Handler -> Store in Map and open workspace
  const handleCreateInvestigation = (newInv: Investigation) => {
    setInvestigationsMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      updatedMap.set(newInv.id, newInv);
      return updatedMap;
    });

    setActiveInvestigationId(newInv.id);
    setIsModalOpen(false);
    setActiveTab('investigations');
  };

  // Set Extracted Claims for a document
  const handleSetDocumentClaims = (documentId: string, claims: Claim[]) => {
    setClaimsMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      updatedMap.set(documentId, claims);
      return updatedMap;
    });
  };

  // Set Detected Contradictions for an investigation
  const handleSetInvestigationContradictions = (investigationId: string, contradictions: Contradiction[]) => {
    setContradictionsMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      updatedMap.set(investigationId, contradictions);
      return updatedMap;
    });
  };

  // Add Evidence Items & Extracted Texts
  const handleAddEvidenceItems = (
    newItems: EvidenceItem[],
    extractions: ExtractedDocumentText[]
  ) => {
    setEvidenceItemsMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      newItems.forEach((item) => {
        updatedMap.set(item.id, item);
      });
      return updatedMap;
    });

    setExtractedTextsMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      extractions.forEach((ext) => {
        updatedMap.set(ext.id, ext);
      });
      return updatedMap;
    });
  };

  // Remove Evidence Item
  const handleRemoveEvidenceItem = (itemId: string) => {
    setEvidenceItemsMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      updatedMap.delete(itemId);
      return updatedMap;
    });

    setExtractedTextsMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      updatedMap.delete(itemId);
      return updatedMap;
    });

    setClaimsMap((prevMap) => {
      const updatedMap = new Map(prevMap);
      updatedMap.delete(itemId);
      return updatedMap;
    });
  };

  // Open investigation
  const handleOpenInvestigation = (investigationId: string) => {
    setActiveInvestigationId(investigationId);
    setActiveTab('investigations');
  };

  // Active investigation lookup
  const activeInvestigation = activeInvestigationId 
    ? investigationsMap.get(activeInvestigationId) || null 
    : null;

  // Derived lists
  const allInvestigationsList = useMemo(() => {
    return Array.from(investigationsMap.values());
  }, [investigationsMap]);

  const allEvidenceList = useMemo(() => {
    return Array.from(evidenceItemsMap.values());
  }, [evidenceItemsMap]);

  const currentInvestigationEvidenceList = useMemo(() => {
    if (!activeInvestigationId) return [];
    return allEvidenceList.filter((item) => item.investigationId === activeInvestigationId);
  }, [allEvidenceList, activeInvestigationId]);

  const getActiveTabLabel = () => {
    switch (activeTab) {
      case 'overview': return 'Overview';
      case 'investigations': return 'Investigations Workspace';
      case 'evidence': return 'Evidence Library';
      case 'settings': return 'Workspace Settings';
      default: return 'TruthTrace';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#FAF9F6] text-[#252720] overflow-hidden font-sans select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Workspace Shell */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Shell */}
        <Header 
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          activeTabLabel={getActiveTabLabel()}
          activeInvestigationTitle={activeInvestigation?.title}
        />

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#FAF9F6]">
          {activeTab === 'overview' && (
            <DashboardView 
              investigationsList={allInvestigationsList}
              evidenceList={allEvidenceList}
              claimsMap={claimsMap}
              contradictionsMap={contradictionsMap}
              onNewInvestigation={handleOpenCreateModal}
              onOpenInvestigation={handleOpenInvestigation}
            />
          )}

          {activeTab === 'investigations' && (
            <InvestigationWorkspace
              investigation={activeInvestigation}
              evidenceList={currentInvestigationEvidenceList}
              extractedTextsMap={extractedTextsMap}
              claimsMap={claimsMap}
              contradictionsMap={contradictionsMap}
              onBackToInvestigations={() => setActiveTab('overview')}
              onNewInvestigation={handleOpenCreateModal}
              onAddEvidenceItems={handleAddEvidenceItems}
              onRemoveEvidenceItem={handleRemoveEvidenceItem}
              onSetDocumentClaims={handleSetDocumentClaims}
              onSetInvestigationContradictions={handleSetInvestigationContradictions}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceLibraryView
              evidenceList={allEvidenceList}
              investigationsMap={investigationsMap}
              extractedTextsMap={extractedTextsMap}
              onRemoveEvidenceItem={handleRemoveEvidenceItem}
              onOpenInvestigation={handleOpenInvestigation}
              onNewInvestigation={handleOpenCreateModal}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              onClearData={handleClearWorkspaceData}
              totalInvestigations={allInvestigationsList.length}
              totalEvidence={allEvidenceList.length}
            />
          )}
        </main>
      </div>

      {/* Create Investigation Modal */}
      <CreateInvestigationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateInvestigation}
      />
    </div>
  );
}

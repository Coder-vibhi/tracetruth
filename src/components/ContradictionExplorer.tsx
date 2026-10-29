import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  GitFork, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  ShieldAlert, 
  X, 
  Info,
  Maximize
} from 'lucide-react';
import { Document, Claim, Contradiction, Event, GraphNode, GraphEdge, NodeType } from '../types/investigation';
import { EvidenceGraphManager } from '../utils/graph';

interface ContradictionExplorerProps {
  documents: Document[];
  claims: Claim[];
  contradictions: Contradiction[];
  events: Event[];
  selectedContradictionId?: string | null;
  onSelectContradictionId?: (id: string | null) => void;
  onUpdateContradiction?: (id: string, status: any, notes?: string) => void;
}

export const ContradictionExplorer: React.FC<ContradictionExplorerProps> = ({
  documents,
  claims,
  contradictions,
  events,
  selectedContradictionId,
  onSelectContradictionId,
  onUpdateContradiction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphManagerRef = useRef<EvidenceGraphManager>(
    new EvidenceGraphManager(documents, claims, contradictions, events)
  );

  const [filterDocs, setFilterDocs] = useState(true);
  const [filterClaims, setFilterClaims] = useState(true);
  const [filterContradictions, setFilterContradictions] = useState(true);
  const [filterEvents, setFilterEvents] = useState(true);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(selectedContradictionId || null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedContradictionId) {
      setSelectedNodeId(selectedContradictionId);
    }
  }, [selectedContradictionId]);

  const rebuildGraph = useCallback(() => {
    const manager = graphManagerRef.current;
    manager.rebuild(documents, claims, contradictions, events);

    const activeTypes = new Set<string>();
    if (filterDocs) activeTypes.add('document');
    if (filterClaims) activeTypes.add('claim');
    if (filterContradictions) activeTypes.add('contradiction');
    if (filterEvents) activeTypes.add('event');

    const { nodes: generatedNodes, edges: generatedEdges } = manager.generateGraphNodes(activeTypes);
    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [documents, claims, contradictions, events, filterDocs, filterClaims, filterContradictions, filterEvents]);

  useEffect(() => {
    rebuildGraph();
  }, [rebuildGraph]);

  useEffect(() => {
    if (!selectedNodeId) {
      setHighlightedNodeIds(new Set());
      return;
    }
    const manager = graphManagerRef.current;
    const { nodeIds } = manager.getConnectedSubgraph(selectedNodeId, 2);
    setHighlightedNodeIds(nodeIds);
  }, [selectedNodeId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current && (e.target as HTMLElement).tagName !== 'svg') return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggingNodeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === draggingNodeId) {
          return { ...node, x: mouseX, y: mouseY };
        }
        return node;
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.4), 2.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeStyles = (type: NodeType, isSelected: boolean) => {
    switch (type) {
      case 'document':
        return { fill: isSelected ? '#DBEAFE' : '#EFF6FF', stroke: '#3B82F6', text: '#1E3A8A' };
      case 'contradiction':
        return { fill: isSelected ? '#FFE4E6' : '#FFF1F2', stroke: '#F43F5E', text: '#881337' };
      case 'claim':
        return { fill: isSelected ? '#D1FAE5' : '#E8EFE6', stroke: '#52765C', text: '#252720' };
      case 'event':
        return { fill: isSelected ? '#FEF3C7' : '#FFFBEB', stroke: '#D97706', text: '#78350F' };
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const manager = graphManagerRef.current;
  const selectedContradiction = selectedNode?.type === 'contradiction' ? manager.getContradiction(selectedNode.id) : null;
  const selectedDocument = selectedNode?.type === 'document' ? manager.getDocument(selectedNode.id) : null;
  const selectedClaim = selectedNode?.type === 'claim' ? manager.getClaim(selectedNode.id) : null;
  const selectedEvent = selectedNode?.type === 'event' ? manager.getEvent(selectedNode.id) : null;

  return (
    <div className="space-y-4">
      {/* Controls & Filter Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#E1E4DC] rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-[#52765C]" />
          <span className="font-bold text-[#252720]">Evidence Connection Graph</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterDocs(!filterDocs)}
            className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-all ${
              filterDocs ? 'bg-[#EFF6FF] border-[#3B82F6] text-[#1E3A8A]' : 'bg-slate-50 text-slate-400 border-[#E1E4DC]'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setFilterContradictions(!filterContradictions)}
            className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-all ${
              filterContradictions ? 'bg-[#FFF1F2] border-[#F43F5E] text-[#881337]' : 'bg-slate-50 text-slate-400 border-[#E1E4DC]'
            }`}
          >
            Contradictions
          </button>
          <button
            onClick={() => setFilterClaims(!filterClaims)}
            className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-all ${
              filterClaims ? 'bg-[#E8EFE6] border-[#52765C] text-[#252720]' : 'bg-slate-50 text-slate-400 border-[#E1E4DC]'
            }`}
          >
            Claims
          </button>
          <button
            onClick={() => setFilterEvents(!filterEvents)}
            className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-all ${
              filterEvents ? 'bg-[#FFFBEB] border-[#D97706] text-[#78350F]' : 'bg-slate-50 text-slate-400 border-[#E1E4DC]'
            }`}
          >
            Events
          </button>
        </div>
      </div>

      {/* Canvas Viewport + Side Drawer */}
      <div className="relative flex flex-col lg:flex-row gap-4 h-[580px] rounded-xl overflow-hidden border border-[#E1E4DC] bg-[#FAF9F6]">
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 relative h-full cursor-grab active:cursor-grabbing overflow-hidden select-none"
        >
          {/* Zoom Toolbar */}
          <div className="absolute top-4 left-4 z-10 flex flex-col bg-white border border-[#E1E4DC] rounded-lg p-1 shadow-2xs space-y-1">
            <button onClick={() => handleZoom(0.15)} className="p-1.5 text-slate-600 hover:bg-[#FAF9F6] rounded" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => handleZoom(-0.15)} className="p-1.5 text-slate-600 hover:bg-[#FAF9F6] rounded" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleResetView} className="p-1.5 text-slate-600 hover:bg-[#FAF9F6] rounded" title="Fit to Screen">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <svg
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            <defs>
              <pattern id="lightGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lightGrid)" />

            {/* Edges */}
            <g>
              {edges.map((edge) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isHighlighted = highlightedNodeIds.has(edge.source) && highlightedNodeIds.has(edge.target);

                return (
                  <line
                    key={edge.id}
                    x1={sourceNode.x || 0}
                    y1={sourceNode.y || 0}
                    x2={targetNode.x || 0}
                    y2={targetNode.y || 0}
                    stroke={isHighlighted ? '#F43F5E' : '#CBD5E1'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={edge.relationshipType === 'CONTRADICTS' ? '3,3' : undefined}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHighlighted = highlightedNodeIds.has(node.id);
                const styles = getNodeStyles(node.type, isSelected);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x || 0}, ${node.y || 0})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                      if (onSelectContradictionId && node.type === 'contradiction') {
                        onSelectContradictionId(node.id);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingNodeId(node.id);
                    }}
                    className="cursor-pointer"
                  >
                    {(isSelected || isHighlighted) && (
                      <circle
                        r={(node.radius || 28) + 4}
                        fill="none"
                        stroke={styles.stroke}
                        strokeWidth="2"
                      />
                    )}

                    <circle
                      r={node.radius || 28}
                      fill={styles.fill}
                      stroke={styles.stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />

                    <text
                      textAnchor="middle"
                      dy="-1"
                      fill={styles.text}
                      fontSize="9 font-sans font-bold"
                      className="pointer-events-none font-semibold select-none"
                    >
                      {node.label.length > 16 ? node.label.slice(0, 14) + '...' : node.label}
                    </text>

                    <text
                      textAnchor="middle"
                      dy="11"
                      fill="#64748B"
                      fontSize="7"
                      className="pointer-events-none font-mono uppercase select-none"
                    >
                      {node.type}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Selected Node Details Drawer */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-[#E1E4DC] p-5 overflow-y-auto space-y-4 shrink-0 text-xs">
          {selectedNode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-2">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                  {selectedNode.type} Details
                </span>
                <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-bold text-[#252720] text-sm">{selectedNode.label}</h4>

              {selectedContradiction && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#FFF1F2] border border-[#F43F5E]/30 rounded-lg space-y-2 text-[#881337]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold block">{selectedContradiction.severity} Discrepancy</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-[#E1E4DC]">
                        {selectedContradiction.status}
                      </span>
                    </div>
                    <p className="text-slate-700 font-normal leading-relaxed">{selectedContradiction.explanation}</p>
                  </div>

                  {/* Resolution Controls */}
                  {onUpdateContradiction && (
                    <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-2">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                        Resolution Status
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(['Unresolved', 'Resolved', 'Needs Review'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => onUpdateContradiction(selectedContradiction.id, st, selectedContradiction.notes)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                              selectedContradiction.status === st
                                ? st === 'Resolved'
                                  ? 'bg-[#E8EFE6] text-[#52765C] border-[#52765C]'
                                  : st === 'Needs Review'
                                  ? 'bg-[#FEF3C7] text-[#78350F] border-[#D97706]'
                                  : 'bg-[#FFF1F2] text-[#881337] border-[#F43F5E]'
                                : 'bg-white text-slate-600 border-[#E1E4DC] hover:bg-slate-50'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">
                          Resolution Notes
                        </span>
                        <textarea
                          value={selectedContradiction.notes || ''}
                          onChange={(e) => onUpdateContradiction(selectedContradiction.id, selectedContradiction.status, e.target.value)}
                          placeholder="Add investigative notes or resolution rationale..."
                          rows={2}
                          className="w-full text-xs p-2 bg-white border border-[#E1E4DC] rounded focus:outline-none focus:border-[#52765C]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="font-mono text-[10px] uppercase text-slate-500 font-bold block">
                      Competing Claims
                    </span>
                    {selectedContradiction.competingValues.map((cv, i) => (
                      <div key={i} className="p-2.5 bg-[#FAF9F6] border border-[#E1E4DC] rounded space-y-1">
                        <span className="font-bold text-[#52765C] block">{cv.documentTitle}</span>
                        <div className="font-mono font-bold text-[#881337]">{cv.value}</div>
                        <p className="italic text-slate-600">"{cv.sourceExcerpt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocument && (
                <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-1 text-slate-700">
                  <span className="font-mono text-[10px] uppercase text-slate-500 block">Author</span>
                  <p className="font-semibold text-[#252720]">{selectedDocument.author}</p>
                  <p className="pt-1">{selectedDocument.summary}</p>
                </div>
              )}

              {selectedClaim && (
                <div className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-1">
                  <span className="font-mono font-bold text-[#252720]">{selectedClaim.subject}</span>
                  <p className="text-slate-700">{selectedClaim.claimText}</p>
                  <p className="italic text-slate-500">"{selectedClaim.sourceExcerpt}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-2">
              <Info className="w-6 h-6 text-slate-300" />
              <p>Click any node in the evidence graph to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { Document, Claim, Contradiction, Event, GraphNode, GraphEdge, RelationshipType } from '../types/investigation';

export class EvidenceGraphManager {
  private documentsMap = new Map<string, Document>();
  private claimsMap = new Map<string, Claim>();
  private contradictionsMap = new Map<string, Contradiction>();
  private eventsMap = new Map<string, Event>();

  // Adjacency list: nodeId -> Set<neighborNodeId>
  private adjacencyList = new Map<string, Set<string>>();
  // Edges store: edgeId -> GraphEdge
  private edgesMap = new Map<string, GraphEdge>();
  // Edge lookup set to prevent duplicate relationships: "sourceId::targetId::relType"
  private relationshipSet = new Set<string>();

  constructor(
    documents: Document[] = [],
    claims: Claim[] = [],
    contradictions: Contradiction[] = [],
    events: Event[] = []
  ) {
    this.rebuild(documents, claims, contradictions, events);
  }

  /**
   * Rebuilds entity Maps and Adjacency List from current investigation data.
   */
  public rebuild(
    documents: Document[],
    claims: Claim[],
    contradictions: Contradiction[],
    events: Event[]
  ) {
    this.documentsMap.clear();
    this.claimsMap.clear();
    this.contradictionsMap.clear();
    this.eventsMap.clear();
    this.adjacencyList.clear();
    this.edgesMap.clear();
    this.relationshipSet.clear();

    // 1. Populate entity Maps (O(1) lookups)
    documents.forEach(d => this.documentsMap.set(d.id, d));
    claims.forEach(c => this.claimsMap.set(c.id, c));
    contradictions.forEach(ct => this.contradictionsMap.set(ct.id, ct));
    events.forEach(e => this.eventsMap.set(e.id, e));

    // Register all nodes in adjacency list
    documents.forEach(d => this.ensureNodeInAdjacency(d.id));
    claims.forEach(c => this.ensureNodeInAdjacency(c.id));
    contradictions.forEach(ct => this.ensureNodeInAdjacency(ct.id));
    events.forEach(e => this.ensureNodeInAdjacency(e.id));

    // 2. Build edges & adjacency list using Sets to guarantee uniqueness
    // Document -> Claim (EXTRACTED_FROM)
    claims.forEach(claim => {
      if (claim.documentId && this.documentsMap.has(claim.documentId)) {
        this.addRelationship(claim.id, claim.documentId, 'EXTRACTED_FROM', 'Extracted From');
      }
    });

    // Claim -> Event (MENTIONS_EVENT)
    claims.forEach(claim => {
      if (claim.eventId && this.eventsMap.has(claim.eventId)) {
        this.addRelationship(claim.id, claim.eventId, 'MENTIONS_EVENT', 'Mentions Event');
      }
    });

    // Contradiction -> Claims & Documents (CONTRADICTS / PRODUCES_DISCREPANCY)
    contradictions.forEach(contr => {
      contr.claimIds.forEach(claimId => {
        if (this.claimsMap.has(claimId)) {
          this.addRelationship(contr.id, claimId, 'CONTRADICTS', 'Conflicts With');
        }
      });
      contr.documentIds.forEach(docId => {
        if (this.documentsMap.has(docId)) {
          this.addRelationship(contr.id, docId, 'PRODUCES_DISCREPANCY', 'Involves Doc');
        }
      });
    });
  }

  private ensureNodeInAdjacency(nodeId: string) {
    if (!this.adjacencyList.has(nodeId)) {
      this.adjacencyList.set(nodeId, new Set<string>());
    }
  }

  /**
   * Adds a directional edge and updates the adjacency list using Sets.
   */
  public addRelationship(
    sourceId: string,
    targetId: string,
    relationshipType: RelationshipType,
    label?: string
  ) {
    const edgeKey = `${sourceId}::${targetId}::${relationshipType}`;
    if (this.relationshipSet.has(edgeKey)) return; // Prevent duplicate relationships

    this.relationshipSet.add(edgeKey);
    this.ensureNodeInAdjacency(sourceId);
    this.ensureNodeInAdjacency(targetId);

    // Undirected graph connectivity in adjacency list for traversal flexibility
    this.adjacencyList.get(sourceId)!.add(targetId);
    this.adjacencyList.get(targetId)!.add(sourceId);

    const edgeId = `EDGE-${edgeKey}`;
    this.edgesMap.set(edgeId, {
      id: edgeId,
      source: sourceId,
      target: targetId,
      relationshipType,
      label
    });
  }

  /**
   * Performs O(V + E) Breadth-First Search (BFS) to find connected nodes & edges.
   */
  public getConnectedSubgraph(startNodeId: string, maxDepth = 3): {
    nodeIds: Set<string>;
    edges: GraphEdge[];
  } {
    const visitedNodes = new Set<string>();
    const queue: { id: string; depth: number }[] = [{ id: startNodeId, depth: 0 }];
    visitedNodes.add(startNodeId);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;

      const neighbors = this.adjacencyList.get(id);
      if (neighbors) {
        neighbors.forEach(neighborId => {
          if (!visitedNodes.has(neighborId)) {
            visitedNodes.add(neighborId);
            queue.push({ id: neighborId, depth: depth + 1 });
          }
        });
      }
    }

    // Collect all edges where both endpoints are in the visited subgraph
    const matchingEdges: GraphEdge[] = [];
    this.edgesMap.forEach(edge => {
      if (visitedNodes.has(edge.source) && visitedNodes.has(edge.target)) {
        matchingEdges.push(edge);
      }
    });

    return { nodeIds: visitedNodes, edges: matchingEdges };
  }

  /**
   * Traces full lineage of a contradiction back to claims, documents, and events.
   * O(V + E) algorithm.
   */
  public traceContradictionLineage(contradictionId: string) {
    const contradiction = this.contradictionsMap.get(contradictionId);
    if (!contradiction) return null;

    const connectedClaims = contradiction.claimIds
      .map(id => this.claimsMap.get(id))
      .filter((c): c is Claim => c !== undefined);

    const connectedDocIds = new Set<string>([
      ...contradiction.documentIds,
      ...connectedClaims.map(c => c.documentId)
    ]);

    const connectedDocuments = Array.from(connectedDocIds)
      .map(id => this.documentsMap.get(id))
      .filter((d): d is Document => d !== undefined);

    const connectedEventIds = new Set<string>(
      connectedClaims.map(c => c.eventId!).filter(Boolean)
    );

    const connectedEvents = Array.from(connectedEventIds)
      .map(id => this.eventsMap.get(id))
      .filter((e): e is Event => e !== undefined);

    return {
      contradiction,
      claims: connectedClaims,
      documents: connectedDocuments,
      events: connectedEvents
    };
  }

  /**
   * Formats entities into standard GraphNodes with initial 2D coordinates.
   */
  public generateGraphNodes(filterTypes?: Set<string>): {
    nodes: GraphNode[];
    edges: GraphEdge[];
  } {
    const nodes: GraphNode[] = [];

    // Documents (Top Layer / Blue)
    if (!filterTypes || filterTypes.has('document')) {
      let docIdx = 0;
      const docCount = this.documentsMap.size;
      this.documentsMap.forEach(doc => {
        const angle = (docIdx / Math.max(1, docCount)) * Math.PI * 0.8 + Math.PI * 0.1;
        nodes.push({
          id: doc.id,
          label: doc.title,
          type: 'document',
          sublabel: `${doc.claimCount} claims · ${doc.author}`,
          x: 200 + docIdx * 280,
          y: 120,
          radius: 32,
          metadata: { ...doc }
        });
        docIdx++;
      });
    }

    // Contradictions (Center Layer / Red/Rose)
    if (!filterTypes || filterTypes.has('contradiction')) {
      let contrIdx = 0;
      this.contradictionsMap.forEach(contr => {
        nodes.push({
          id: contr.id,
          label: contr.title,
          type: 'contradiction',
          sublabel: `${contr.severity} Severity · ${contr.subject}`,
          x: 250 + contrIdx * 250,
          y: 300,
          radius: 36,
          metadata: { ...contr }
        });
        contrIdx++;
      });
    }

    // Claims (Middle-Bottom Layer / Cyan)
    if (!filterTypes || filterTypes.has('claim')) {
      let claimIdx = 0;
      this.claimsMap.forEach(claim => {
        nodes.push({
          id: claim.id,
          label: claim.value,
          type: 'claim',
          sublabel: `${claim.subject}: ${claim.claimText.slice(0, 35)}...`,
          x: 120 + (claimIdx % 4) * 220,
          y: 480 + Math.floor(claimIdx / 4) * 110,
          radius: 26,
          metadata: { ...claim }
        });
        claimIdx++;
      });
    }

    // Events (Bottom Layer / Amber)
    if (!filterTypes || filterTypes.has('event')) {
      let eventIdx = 0;
      this.eventsMap.forEach(event => {
        nodes.push({
          id: event.id,
          label: event.title,
          type: 'event',
          sublabel: event.timestampStr || 'Timeline Event',
          x: 200 + eventIdx * 240,
          y: 720,
          radius: 30,
          metadata: { ...event }
        });
        eventIdx++;
      });
    }

    // Filter valid edges based on active nodes
    const activeNodeIds = new Set(nodes.map(n => n.id));
    const edges: GraphEdge[] = [];
    this.edgesMap.forEach(edge => {
      if (activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)) {
        edges.push(edge);
      }
    });

    return { nodes, edges };
  }

  public getDocument(id: string) { return this.documentsMap.get(id); }
  public getClaim(id: string) { return this.claimsMap.get(id); }
  public getContradiction(id: string) { return this.contradictionsMap.get(id); }
  public getEvent(id: string) { return this.eventsMap.get(id); }
}

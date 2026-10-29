export type DocumentType = 'pdf' | 'txt' | 'png' | 'jpeg';

export type ClaimCategory = 'Timestamp' | 'Identity' | 'Causality' | 'Location' | 'Quantity' | 'Action' | 'Other';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocumentText {
  id: string; // matches evidence item ID / document ID
  investigationId: string; // matches investigation ID
  fileName: string;
  fileType: DocumentType;
  status: 'success' | 'empty' | 'ocr_pending' | 'unsupported' | 'error';
  fullText: string;
  pages: ExtractedPage[];
  errorMessage?: string;
  extractedAt: string;
}

export interface EvidenceItem {
  id: string;
  investigationId: string;
  investigationTitle?: string;
  fileName: string;
  fileType: DocumentType;
  fileSize: number;
  formattedSize: string;
  uploadedAt: string;
  processingStatus?: string;
}

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  author: string;
  uploadDate: string;
  fileSize: string;
  content: string;
  claimCount: number;
  status: 'processed' | 'processing' | 'error';
  tags?: string[];
  summary?: string;
}

export interface Claim {
  id: string;
  investigationId?: string;
  documentId: string;
  documentTitle: string;
  claimText: string;
  subject: string;
  predicate: string;
  value: string;
  sourceExcerpt: string;
  pageNumber?: number;
  locationIndex?: string;
  confidenceScore?: number;
  category: ClaimCategory;
  createdAt?: string;
  eventId?: string;
}

export interface CompetingValue {
  documentId: string;
  documentTitle: string;
  claimId: string;
  value: string;
  sourceExcerpt: string;
  pageNumber?: number;
}

export type ContradictionStatus = 'Unresolved' | 'Resolved' | 'Needs Review' | 'Under Review' | 'Confirmed Discrepancy';

export interface Contradiction {
  id: string;
  investigationId?: string;
  title: string;
  subject: string;
  predicate: string;
  claimIds: string[];
  documentIds: string[];
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: ContradictionStatus;
  notes?: string;
  explanation: string;
  competingValues: CompetingValue[];
  createdAt?: string;
}

export interface ClaimValidationResult {
  claimId: string;
  isValidDate: boolean;
  canonicalDate?: string | null;
  isValidLocation: boolean;
  isValidCause: boolean;
  isSourceExcerptVerified: boolean;
  validationMessage?: string;
}

export interface CompetingDate {
  documentId: string;
  documentTitle: string;
  claimId: string;
  dateStr: string;
  excerpt: string;
  pageNumber?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  timestampStr?: string; // Display string e.g. "14:15 - 14:45 UTC"
  normalizedDate: string | null; // ISO string or YYYY-MM-DD HH:mm for sorting, null if unknown
  isDisputed: boolean;
  claimIds: string[];
  competingDates?: CompetingDate[];
  location?: string;
  category?: string;
}

export interface Investigation {
  id: string;
  code: string; // e.g. "INV-2026-089"
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  lastModified: string;
  status: 'Active' | 'Under Review' | 'Archived';
  documentIds: string[];
  claimIds: string[];
  contradictionIds: string[];
  eventIds: string[];
  tags: string[];
  investigator: string;
}

export type NodeType = 'document' | 'claim' | 'event' | 'contradiction';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
  sublabel?: string;
  metadata?: Record<string, any>;
}

export type RelationshipType = 'EXTRACTED_FROM' | 'MENTIONS_EVENT' | 'CONTRADICTS' | 'SUPPORTS' | 'PRODUCES_DISCREPANCY';

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relationshipType: RelationshipType;
}

export interface SearchFilterState {
  query: string;
  category: string;
  documentId: string;
  severity: string;
  isDisputedOnly: boolean;
}

import { Claim, ClaimCategory, ExtractedPage } from '../types/investigation';

export interface ExtractClaimsPayload {
  documentId: string;
  investigationId: string;
  documentTitle: string;
  content: string;
  pages?: ExtractedPage[];
}

/**
 * Normalizes claim subject and predicate to ensure consistent predicate matching across documents.
 * Incident Date → occurred_on
 * Incident Time → occurred_at
 * Incident Location → located_at
 */
export function normalizeSubjectAndPredicate(
  rawSubject: string,
  rawPredicate: string,
  category?: string
): { subject: string; predicate: string } {
  let subject = rawSubject.trim();
  let predicate = rawPredicate.trim().toLowerCase().replace(/\s+/g, '_');
  const normSub = subject.toLowerCase();

  if (
    normSub === 'incident date' ||
    normSub === 'date of incident' ||
    normSub === 'date' ||
    normSub.includes('incident date')
  ) {
    subject = 'Incident Date';
    predicate = 'occurred_on';
  } else if (
    normSub === 'incident time' ||
    normSub === 'time of incident' ||
    normSub === 'time' ||
    normSub.includes('incident time')
  ) {
    subject = 'Incident Time';
    predicate = 'occurred_at';
  } else if (
    normSub === 'incident location' ||
    normSub === 'location of incident' ||
    normSub === 'location' ||
    normSub.includes('incident location')
  ) {
    subject = 'Incident Location';
    predicate = 'located_at';
  } else if (
    normSub === 'reported cause' ||
    normSub === 'cause of incident' ||
    normSub === 'root cause' ||
    normSub === 'incident cause' ||
    normSub === 'primary cause' ||
    normSub === 'cause' ||
    normSub === 'causality' ||
    normSub.includes('reported cause') ||
    normSub.includes('cause of incident') ||
    normSub.includes('root cause') ||
    category === 'Causality' ||
    ['caused_by', 'cause_of', 'reported_cause', 'root_cause', 'contributing_factor'].includes(predicate)
  ) {
    subject = 'Reported Cause';
    predicate = 'caused_by';
  } else {
    if (
      predicate === 'occurred_date' ||
      predicate === 'happened_on' ||
      predicate === 'occurred_on' ||
      predicate === 'occurred'
    ) {
      if (category === 'Timestamp' || normSub.includes('date')) {
        predicate = 'occurred_on';
      }
    } else if (
      predicate === 'occurred_time' ||
      predicate === 'happened_at' ||
      predicate === 'occurred_at' ||
      predicate === 'at_time'
    ) {
      if (category === 'Timestamp' || normSub.includes('time')) {
        predicate = 'occurred_at';
      }
    } else if (
      predicate === 'located_in' ||
      predicate === 'occurred_in' ||
      predicate === 'located_at' ||
      predicate === 'location'
    ) {
      if (category === 'Location' || normSub.includes('location')) {
        predicate = 'located_at';
      }
    }
  }

  return { subject, predicate: predicate || 'asserts' };
}

/**
 * Service to perform AI-powered claims extraction from uploaded document text using Gemini API.
 * Uses `/api/gemini/extract-claims` endpoint (backed by Python FastAPI / Node proxy).
 * Reports errors clearly if API key is unconfigured, and deduplicates using normalized Set.
 */
export async function extractClaimsWithAI(
  payload: ExtractClaimsPayload
): Promise<Claim[]> {
  const { documentId, investigationId, documentTitle, content, pages } = payload;

  if (!content || !content.trim()) {
    throw new Error('Document text is empty or unreadable.');
  }

  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const endpoint = `${baseUrl}/api/gemini/extract-claims`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentId,
      investigationId,
      documentTitle,
      content,
      pages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error || data.detail || 'Failed to extract claims using Gemini API.';
    throw new Error(errorMsg);
  }

  if (!data.claims || !Array.isArray(data.claims)) {
    throw new Error('Invalid claim data returned from server.');
  }

  // Prevent duplicate claims using normalized Set
  const uniqueClaimSet = new Set<string>();
  const validatedClaims: Claim[] = [];

  for (let i = 0; i < data.claims.length; i++) {
    const raw = data.claims[i];

    const claimText = String(raw.claimText || raw.claim_text || raw.value || '').trim();
    const rawSubject = String(raw.subject || 'Factual Assertion').trim();
    const rawPredicate = String(raw.predicate || 'asserts').trim();
    const value = String(raw.value || claimText).trim();
    const sourceExcerpt = String(raw.sourceExcerpt || raw.source_excerpt || claimText).trim();
    
    const categoryCandidate = String(raw.category || 'Other');
    const validCategories: ClaimCategory[] = [
      'Timestamp',
      'Identity',
      'Causality',
      'Location',
      'Quantity',
      'Action',
      'Other',
    ];
    const category: ClaimCategory = validCategories.includes(
      categoryCandidate as ClaimCategory
    )
      ? (categoryCandidate as ClaimCategory)
      : 'Other';

    const { subject, predicate } = normalizeSubjectAndPredicate(rawSubject, rawPredicate, category);

    const rawPageNum = raw.pageNumber ?? raw.page_number;
    let pageNumber = typeof rawPageNum === 'number' && rawPageNum > 0 ? rawPageNum : 1;

    // Resolve exact page number from pages array if sourceExcerpt is present and multi-page
    if (pages && pages.length > 1 && sourceExcerpt) {
      const excerptExcerpt = sourceExcerpt.toLowerCase().slice(0, 40);
      const matchedPage = pages.find((p) => p.text.toLowerCase().includes(excerptExcerpt));
      if (matchedPage) {
        pageNumber = matchedPage.pageNumber;
      }
    }

    // Normalization key for duplicate detection
    const normalizedKey = `${subject.toLowerCase()}|${predicate.toLowerCase()}|${value.toLowerCase()}|${sourceExcerpt.toLowerCase()}`;

    if (!uniqueClaimSet.has(normalizedKey) && (claimText || sourceExcerpt)) {
      uniqueClaimSet.add(normalizedKey);

      validatedClaims.push({
        id: `CLM-${documentId}-${Date.now().toString(36)}-${i + 1}`,
        investigationId,
        documentId,
        documentTitle,
        claimText: claimText || sourceExcerpt,
        subject,
        predicate,
        value,
        sourceExcerpt,
        pageNumber,
        category,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return validatedClaims;
}

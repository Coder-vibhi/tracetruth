import { Claim, Contradiction, CompetingValue, Event } from '../types/investigation';

/**
 * Normalizes subject and predicate into a standardized lookup key for Map indexing.
 * Example: "Incident Date" + "occurred_on" -> "incident date::occurred_on"
 */
export function getSubjectPredicateKey(subject: string, predicate: string): string {
  const normSubject = subject.trim().toLowerCase().replace(/\s+/g, ' ');
  const normPredicate = predicate.trim().toLowerCase().replace(/\s+/g, '_');
  return `${normSubject}::${normPredicate}`;
}

/**
 * Normalizes a value for comparison. Strips whitespace, lowercases, and removes trailing periods.
 */
export function normalizeValue(val: string): string {
  return val.trim().toLowerCase().replace(/\.$/, '').replace(/\s+/g, ' ');
}

/**
 * Checks whether a given asserted value indicates missing, ambiguous, or uncertain information.
 * Treats missing or uncertain info as "insufficient evidence" rather than a contradiction.
 */
export function isInsufficientEvidenceValue(val: string): boolean {
  if (!val || !val.trim()) return true;
  const norm = normalizeValue(val);
  const insufficientKeywords = [
    'unknown',
    'n/a',
    'na',
    'unspecified',
    'not reported',
    'not specified',
    'pending',
    'to be determined',
    'tbd',
    'uncertain',
    'unclear',
    'no data',
    'none',
    'missing',
    'insufficient',
    'not documented',
    'under investigation',
    'to be investigated',
    'not determined'
  ];
  return insufficientKeywords.some(keyword => norm === keyword || norm.startsWith(`${keyword} `) || norm.endsWith(` ${keyword}`));
}

/**
 * Standardizes common date strings into a canonical YYYY-MM-DD format for date comparison.
 * Returns null if the string cannot be parsed as a standard calendar date.
 */
export function parseCanonicalDate(val: string): string | null {
  if (!val || !val.trim()) return null;
  const clean = val.trim().replace(/^(on|dated|date:?)\s+/i, '');

  // Match YYYY-MM-DD
  const isoMatch = clean.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Match MM/DD/YYYY or M/D/YYYY
  const usMatch = clean.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/);
  if (usMatch) {
    const m = usMatch[1].padStart(2, '0');
    const d = usMatch[2].padStart(2, '0');
    const y = usMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Parse using Date.parse for Month DD, YYYY or DD Month YYYY
  const timestamp = Date.parse(clean);
  if (!isNaN(timestamp)) {
    const dt = new Date(timestamp);
    if (dt.getUTCFullYear() >= 1900 && dt.getUTCFullYear() <= 2100) {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

/**
 * Normalizes reported cause values to a canonical string for semantic comparison.
 */
export function normalizeCauseValue(val: string): string {
  if (!val) return '';
  return val
    .trim()
    .toLowerCase()
    .replace(/[.,;:!]+$/, '')
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/\s+/g, ' ');
}

/**
 * Standardizes claim subject and predicate to ensure cross-document consistency.
 * Maps synonyms for Incident Date, Incident Time, Incident Location, and Reported Cause.
 */
export function normalizeClaimSubjectAndPredicate(claim: Claim): { subject: string; predicate: string } {
  let subject = (claim.subject || '').trim();
  let predicate = (claim.predicate || '').trim().toLowerCase().replace(/\s+/g, '_');
  const category = claim.category;
  const normSub = subject.toLowerCase();

  // 1. Incident Date
  if (
    normSub === 'incident date' ||
    normSub === 'date of incident' ||
    normSub === 'event date' ||
    normSub === 'date' ||
    normSub.includes('incident date') ||
    normSub.includes('date of incident')
  ) {
    subject = 'Incident Date';
    predicate = 'occurred_on';
  }
  // 2. Incident Time
  else if (
    normSub === 'incident time' ||
    normSub === 'time of incident' ||
    normSub === 'event time' ||
    normSub === 'time' ||
    normSub.includes('incident time') ||
    normSub.includes('time of incident')
  ) {
    subject = 'Incident Time';
    predicate = 'occurred_at';
  }
  // 3. Incident Location
  else if (
    normSub === 'incident location' ||
    normSub === 'location of incident' ||
    normSub === 'event location' ||
    normSub === 'location' ||
    normSub.includes('incident location') ||
    normSub.includes('location of incident')
  ) {
    subject = 'Incident Location';
    predicate = 'located_at';
  }
  // 4. Reported Cause / Causality
  else if (
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
  }
  // 5. General predicate mapping
  else {
    if (['occurred_date', 'happened_on', 'occurred_on', 'occurred'].includes(predicate) && (category === 'Timestamp' || normSub.includes('date'))) {
      subject = 'Incident Date';
      predicate = 'occurred_on';
    } else if (['occurred_time', 'happened_at', 'occurred_at', 'at_time'].includes(predicate) && (category === 'Timestamp' || normSub.includes('time'))) {
      subject = 'Incident Time';
      predicate = 'occurred_at';
    } else if (['located_in', 'occurred_in', 'located_at', 'location'].includes(predicate) && (category === 'Location' || normSub.includes('location'))) {
      subject = 'Incident Location';
      predicate = 'located_at';
    }
  }

  return { subject, predicate: predicate || 'asserts' };
}

/**
 * Indexed grouping algorithm using Map for O(N) claim classification by (subject, predicate).
 */
export function groupClaimsBySubjectPredicate(claims: Claim[]): Map<string, { claims: Claim[]; subject: string; predicate: string }> {
  const dictionary = new Map<string, { claims: Claim[]; subject: string; predicate: string }>();

  for (const claim of claims) {
    if (!claim.subject && !claim.predicate) continue;

    const norm = normalizeClaimSubjectAndPredicate(claim);
    const key = getSubjectPredicateKey(norm.subject, norm.predicate);

    if (!dictionary.has(key)) {
      dictionary.set(key, { claims: [], subject: norm.subject, predicate: norm.predicate });
    }
    dictionary.get(key)!.claims.push(claim);
  }

  return dictionary;
}

/**
 * Detects contradictions across claims from DIFFERENT documents within the same investigation.
 * Compares claims about the same subject/event and fact (dates, times, reported causes, locations, etc.).
 * Prevents false positives by normalizing date formats and cause descriptions, and skipping uncertain data.
 */
export function detectContradictionsFromClaims(
  claims: Claim[],
  investigationId: string,
  documentsMap?: Map<string, { title: string }>,
  existingContradictions?: Contradiction[]
): Contradiction[] {
  const groupedMap = groupClaimsBySubjectPredicate(claims);
  const contradictions: Contradiction[] = [];
  const visitedRelationshipSet = new Set<string>(); // Set to avoid duplicate relationship records

  // Map existing resolution status and notes by subject+predicate for state persistence
  const existingStateMap = new Map<string, { status: any; notes?: string }>();
  if (existingContradictions) {
    existingContradictions.forEach(c => {
      const key = getSubjectPredicateKey(c.subject, c.predicate);
      existingStateMap.set(key, { status: c.status, notes: c.notes });
    });
  }

  let index = 1;

  groupedMap.forEach((groupData, key) => {
    const claimGroup = groupData.claims;
    const subject = groupData.subject;
    const predicate = groupData.predicate;

    // Must have at least 2 claims to compare
    if (claimGroup.length < 2) return;

    // Filter claims to ensure they come from DIFFERENT documents
    const documentIdSet = new Set<string>();

    claimGroup.forEach(c => {
      if (c.documentId) {
        documentIdSet.add(c.documentId);
      }
    });

    // Cross-document requirement: contradictions exist ONLY between different documents
    if (documentIdSet.size < 2) return;

    // Filter out claims with insufficient or uncertain evidence values
    const validClaims = claimGroup.filter(c => !isInsufficientEvidenceValue(c.value));
    if (validClaims.length < 2) return;

    // Get canonical value for each claim to avoid false positives (e.g. date format differences, trailing punctuation)
    const getCanonicalValue = (c: Claim): string => {
      if (predicate === 'occurred_on' || subject === 'Incident Date' || c.category === 'Timestamp') {
        const canonicalDate = parseCanonicalDate(c.value);
        if (canonicalDate) return canonicalDate;
      }
      if (predicate === 'caused_by' || subject === 'Reported Cause' || c.category === 'Causality') {
        return normalizeCauseValue(c.value);
      }
      return normalizeValue(c.value);
    };

    // Map canonical values to claims and documents asserting them
    const canonicalValueToDocIds = new Map<string, Set<string>>();
    const canonicalValueToClaims = new Map<string, Claim[]>();

    validClaims.forEach(c => {
      const canonVal = getCanonicalValue(c);
      if (!canonicalValueToDocIds.has(canonVal)) {
        canonicalValueToDocIds.set(canonVal, new Set<string>());
        canonicalValueToClaims.set(canonVal, []);
      }
      canonicalValueToDocIds.get(canonVal)!.add(c.documentId);
      canonicalValueToClaims.get(canonVal)!.push(c);
    });

    // Check if there are at least 2 distinct canonical values across DIFFERENT documents
    const distinctCanonicalValues = Array.from(canonicalValueToDocIds.keys());

    if (distinctCanonicalValues.length > 1) {
      const claimIds = validClaims.map(c => c.id);
      const documentIds = Array.from(documentIdSet);

      // Unique relationship signature in Set to prevent duplicates
      const sortedDocIds = [...documentIds].sort().join('::');
      const signature = `${key}::${sortedDocIds}`;
      if (visitedRelationshipSet.has(signature)) return;
      visitedRelationshipSet.add(signature);

      // Build structured competing values array preserving evidence provenance
      const competingValues: CompetingValue[] = validClaims.map(c => ({
        documentId: c.documentId,
        documentTitle: c.documentTitle || documentsMap?.get(c.documentId)?.title || 'Evidence Document',
        claimId: c.id,
        value: c.value,
        sourceExcerpt: c.sourceExcerpt,
        pageNumber: c.pageNumber
      }));

      // Determine severity based on category / type and number of distinct competing assertions
      let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
      if (predicate === 'occurred_on' || predicate === 'caused_by' || subject === 'Incident Date' || subject === 'Reported Cause' || subject === 'Incident Location') {
        severity = distinctCanonicalValues.length >= 3 ? 'Critical' : 'High';
      } else if (predicate === 'occurred_at' || subject === 'Incident Time') {
        severity = distinctCanonicalValues.length >= 3 ? 'Critical' : 'High';
      } else if (validClaims.some(c => c.category === 'Quantity' || c.category === 'Identity')) {
        severity = distinctCanonicalValues.length >= 3 ? 'High' : 'Medium';
      } else if (distinctCanonicalValues.length >= 3) {
        severity = 'High';
      }

      // Generate objective, neutral explanation listing conflicting assertions and documents without declaring a winner
      const valSummaries = distinctCanonicalValues.map(canonV => {
        const matchingClaims = canonicalValueToClaims.get(canonV) || [];
        const docNames = Array.from(new Set(matchingClaims.map(c => c.documentTitle || 'Document'))).join(', ');
        return `"${matchingClaims[0].value}" (${docNames})`;
      }).join(' vs ');

      const explanation = `Incompatible assertions found for "${subject}" (${predicate}): ${valSummaries}. Different evidence documents report conflicting factual values.`;

      // Preserve user resolution state and notes if previously edited
      const savedState = existingStateMap.get(key);
      const status = savedState?.status || 'Unresolved';
      const notes = savedState?.notes || '';

      contradictions.push({
        id: `cnt_${Date.now()}_${index.toString().padStart(2, '0')}`,
        investigationId,
        title: `Conflicting assertions for ${subject}`,
        subject,
        predicate,
        claimIds,
        documentIds,
        severity,
        status,
        notes,
        explanation,
        competingValues
      });

      index++;
    }
  });

  return contradictions;
}

/**
  * Validates evidence claims against source references, dates, locations, and causes.
  */
export function validateClaim(claim: Claim, documentText?: string): {
  claimId: string;
  isValidDate: boolean;
  canonicalDate?: string | null;
  isValidLocation: boolean;
  isValidCause: boolean;
  isSourceExcerptVerified: boolean;
  validationMessage?: string;
} {
  const isDateCategory = claim.category === 'Timestamp' || claim.predicate === 'occurred_on' || claim.subject === 'Incident Date';
  const canonicalDate = isDateCategory ? parseCanonicalDate(claim.value) : null;
  const isValidDate = isDateCategory ? canonicalDate !== null : true;

  const isLocationCategory = claim.category === 'Location' || claim.predicate === 'located_at' || claim.subject === 'Incident Location';
  const isValidLocation = isLocationCategory ? Boolean(claim.value && claim.value.trim().length > 1 && !isInsufficientEvidenceValue(claim.value)) : true;

  const isCauseCategory = claim.category === 'Causality' || claim.predicate === 'caused_by' || claim.subject === 'Reported Cause';
  const isValidCause = isCauseCategory ? Boolean(claim.value && claim.value.trim().length > 2 && !isInsufficientEvidenceValue(claim.value)) : true;

  let isSourceExcerptVerified = false;
  if (claim.sourceExcerpt && claim.sourceExcerpt.trim()) {
    if (documentText && documentText.trim()) {
      const cleanDocText = documentText.toLowerCase().replace(/\s+/g, ' ');
      const cleanExcerpt = claim.sourceExcerpt.toLowerCase().replace(/\s+/g, ' ');
      isSourceExcerptVerified = cleanDocText.includes(cleanExcerpt);
      if (!isSourceExcerptVerified) {
        const words = cleanExcerpt.split(/\s+/).filter(w => w.length > 3);
        if (words.length > 0) {
          const matchedWords = words.filter(w => cleanDocText.includes(w));
          isSourceExcerptVerified = (matchedWords.length / words.length) >= 0.7;
        }
      }
    } else {
      isSourceExcerptVerified = claim.sourceExcerpt.trim().length >= 5;
    }
  }

  let validationMessage = 'Claim details verified against source evidence.';
  if (isDateCategory && !isValidDate) {
    validationMessage = 'Uncertain or malformed date format.';
  } else if (!isSourceExcerptVerified) {
    validationMessage = 'Source excerpt not found in document text.';
  }

  return {
    claimId: claim.id,
    isValidDate,
    canonicalDate,
    isValidLocation,
    isValidCause,
    isSourceExcerptVerified,
    validationMessage,
  };
}

/**
 * Automatically generates structured Event objects for the timeline from extracted claims.
 */
export function generateEventsFromClaims(claims: Claim[]): Event[] {
  const events: Event[] = [];
  const timestampClaims = claims.filter(c => 
    c.category === 'Timestamp' || 
    c.predicate === 'occurred_on' || 
    c.predicate === 'occurred_at' || 
    c.subject.includes('Date') || 
    c.subject.includes('Time')
  );

  const eventMap = new Map<string, Claim[]>();
  timestampClaims.forEach(c => {
    const key = c.subject.trim() || 'General Incident Event';
    if (!eventMap.has(key)) eventMap.set(key, []);
    eventMap.get(key)!.push(c);
  });

  let eventIdx = 1;
  eventMap.forEach((claimList, subject) => {
    const canonicalDates = claimList.map(c => parseCanonicalDate(c.value)).filter((d): d is string => d !== null);
    const uniqueDates = Array.from(new Set(canonicalDates));
    const isDisputed = uniqueDates.length > 1;
    const primaryDate = canonicalDates[0] || null;

    events.push({
      id: `evt_auto_${eventIdx++}`,
      title: subject,
      description: claimList.map(c => `${c.documentTitle}: ${c.claimText}`).join(' | '),
      timestampStr: claimList.map(c => c.value).join(' / '),
      normalizedDate: primaryDate,
      isDisputed,
      claimIds: claimList.map(c => c.id),
      competingDates: isDisputed ? claimList.map(c => ({
        documentId: c.documentId,
        documentTitle: c.documentTitle,
        claimId: c.id,
        dateStr: c.value,
        excerpt: c.sourceExcerpt,
        pageNumber: c.pageNumber
      })) : undefined
    });
  });

  return events;
}

/**
 * Sorts events chronologically by normalizedDate.
 */
export function sortEventsForTimeline(events: Event[]): {
  datedEvents: Event[];
  undatedEvents: Event[];
} {
  const datedEvents: Event[] = [];
  const undatedEvents: Event[] = [];

  for (const event of events) {
    if (event.normalizedDate && !isNaN(Date.parse(event.normalizedDate))) {
      datedEvents.push(event);
    } else {
      undatedEvents.push(event);
    }
  }

  datedEvents.sort((a, b) => {
    const timeA = new Date(a.normalizedDate!).getTime();
    const timeB = new Date(b.normalizedDate!).getTime();
    return timeA - timeB;
  });

  return { datedEvents, undatedEvents };
}


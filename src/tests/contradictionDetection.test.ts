import {
  detectContradictionsFromClaims,
  parseCanonicalDate,
  normalizeCauseValue,
  isInsufficientEvidenceValue
} from '../utils/contradictionEngine';
import { Claim } from '../types/investigation';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`PASS: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    console.error(`FAIL: ${message} - Expected "${expected}", got "${actual}"`);
    process.exit(1);
  } else {
    console.log(`PASS: ${message}`);
  }
}

console.log('====================================================');
console.log('   RUNNING CONTRADICTION DETECTION UNIT TEST SUITE   ');
console.log('====================================================\n');

// 1. Test parseCanonicalDate
console.log('--- 1. Testing parseCanonicalDate ---');
assertEqual(parseCanonicalDate('March 15, 2024'), '2024-03-15', 'Month DD, YYYY format');
assertEqual(parseCanonicalDate('2024-03-15'), '2024-03-15', 'YYYY-MM-DD ISO format');
assertEqual(parseCanonicalDate('03/15/2024'), '2024-03-15', 'MM/DD/YYYY US format');
assertEqual(parseCanonicalDate('15 March 2024'), '2024-03-15', 'DD Month YYYY format');
assertEqual(parseCanonicalDate('October 14, 2026'), '2026-10-14', 'October 14, 2026 format');

// 2. Test normalizeCauseValue
console.log('\n--- 2. Testing normalizeCauseValue ---');
assertEqual(
  normalizeCauseValue('Electrical short circuit in main transformer.'),
  'electrical short circuit in main transformer',
  'Punctuation and lowercase normalization'
);
assertEqual(
  normalizeCauseValue('The arson / deliberate ignition'),
  'arson / deliberate ignition',
  'Leading article stripping'
);

// 3. Test isInsufficientEvidenceValue
console.log('\n--- 3. Testing isInsufficientEvidenceValue ---');
assert(isInsufficientEvidenceValue('Unknown'), 'Unknown is insufficient');
assert(isInsufficientEvidenceValue('Under investigation'), 'Under investigation is insufficient');
assert(isInsufficientEvidenceValue('TBD'), 'TBD is insufficient');
assert(!isInsufficientEvidenceValue('Electrical short circuit'), 'Valid cause is sufficient');

// 4. Test Incident Date Contradiction Detection
console.log('\n--- 4. Testing Incident Date Contradiction Detection ---');
const dateConflictClaims: Claim[] = [
  {
    id: 'c1',
    investigationId: 'inv-1',
    documentId: 'doc-police',
    documentTitle: 'Initial Police Report.pdf',
    claimText: 'Incident date is March 15, 2024',
    subject: 'Incident Date',
    predicate: 'occurred_on',
    value: 'March 15, 2024',
    sourceExcerpt: 'The incident occurred on March 15, 2024.',
    pageNumber: 1,
    category: 'Timestamp'
  },
  {
    id: 'c2',
    investigationId: 'inv-1',
    documentId: 'doc-witness',
    documentTitle: 'Witness Statement.txt',
    claimText: 'Date of incident was March 16, 2024',
    subject: 'Date of Incident',
    predicate: 'happened_on',
    value: 'March 16, 2024',
    sourceExcerpt: 'The event happened on March 16, 2024.',
    pageNumber: 2,
    category: 'Timestamp'
  }
];

const dateContradictions = detectContradictionsFromClaims(dateConflictClaims, 'inv-1');
assertEqual(dateContradictions.length, 1, 'Detects 1 incident date contradiction');
assertEqual(dateContradictions[0].subject, 'Incident Date', 'Contradiction subject is Incident Date');
assertEqual(dateContradictions[0].predicate, 'occurred_on', 'Contradiction predicate is occurred_on');
assertEqual(dateContradictions[0].competingValues.length, 2, 'Has 2 competing values');
assertEqual(dateContradictions[0].competingValues[0].pageNumber, 1, 'Preserves page number for doc 1');
assertEqual(dateContradictions[0].competingValues[1].pageNumber, 2, 'Preserves page number for doc 2');

// 5. Test Date Formatting Equivalence (No False Positive)
console.log('\n--- 5. Testing Date Formatting Equivalence (Prevent False Positives) ---');
const dateEquivClaims: Claim[] = [
  {
    id: 'c3',
    investigationId: 'inv-1',
    documentId: 'doc-police',
    documentTitle: 'Initial Police Report.pdf',
    claimText: 'Incident date is March 15, 2024',
    subject: 'Incident Date',
    predicate: 'occurred_on',
    value: 'March 15, 2024',
    sourceExcerpt: 'The incident occurred on March 15, 2024.',
    pageNumber: 1,
    category: 'Timestamp'
  },
  {
    id: 'c4',
    investigationId: 'inv-1',
    documentId: 'doc-dispatch',
    documentTitle: 'Dispatch Log.pdf',
    claimText: 'Date: 2024-03-15',
    subject: 'Date',
    predicate: 'occurred_date',
    value: '2024-03-15',
    sourceExcerpt: 'Dispatch date recorded as 2024-03-15.',
    pageNumber: 1,
    category: 'Timestamp'
  }
];

const noDateContradictions = detectContradictionsFromClaims(dateEquivClaims, 'inv-1');
assertEqual(noDateContradictions.length, 0, 'No false positive for identical dates in different formats');

// 6. Test Reported Cause Contradiction Detection
console.log('\n--- 6. Testing Reported Cause Contradiction Detection ---');
const causeConflictClaims: Claim[] = [
  {
    id: 'c5',
    investigationId: 'inv-1',
    documentId: 'doc-fire-dept',
    documentTitle: 'Fire Department Findings.pdf',
    claimText: 'Cause reported as electrical short circuit in main transformer',
    subject: 'Reported Cause',
    predicate: 'caused_by',
    value: 'Electrical short circuit in main transformer',
    sourceExcerpt: 'Investigation determined cause was an electrical short circuit in main transformer.',
    pageNumber: 3,
    category: 'Causality'
  },
  {
    id: 'c6',
    investigationId: 'inv-1',
    documentId: 'doc-arson-report',
    documentTitle: 'Arson Specialist Report.pdf',
    claimText: 'Cause of incident was deliberate arson using accelerants',
    subject: 'Cause of Incident',
    predicate: 'cause_of',
    value: 'Deliberate arson using accelerants',
    sourceExcerpt: 'Traces of gasoline confirm deliberate arson using accelerants.',
    pageNumber: 1,
    category: 'Causality'
  }
];

const causeContradictions = detectContradictionsFromClaims(causeConflictClaims, 'inv-1');
assertEqual(causeContradictions.length, 1, 'Detects 1 reported cause contradiction');
assertEqual(causeContradictions[0].subject, 'Reported Cause', 'Subject is Reported Cause');
assertEqual(causeContradictions[0].predicate, 'caused_by', 'Predicate is caused_by');
assert(causeContradictions[0].severity === 'High' || causeContradictions[0].severity === 'Critical', 'Severity is High/Critical');
assertEqual(causeContradictions[0].competingValues[0].documentTitle, 'Fire Department Findings.pdf', 'Document 1 title');
assertEqual(causeContradictions[0].competingValues[1].documentTitle, 'Arson Specialist Report.pdf', 'Document 2 title');

// 7. Test Cause Formatting Equivalence (No False Positive)
console.log('\n--- 7. Testing Cause Formatting Equivalence (Prevent False Positives) ---');
const causeEquivClaims: Claim[] = [
  {
    id: 'c7',
    investigationId: 'inv-1',
    documentId: 'doc-1',
    documentTitle: 'Doc1.pdf',
    claimText: 'Electrical short circuit.',
    subject: 'Root Cause',
    predicate: 'root_cause',
    value: 'Electrical short circuit.',
    sourceExcerpt: 'Excerpt 1',
    category: 'Causality'
  },
  {
    id: 'c8',
    investigationId: 'inv-1',
    documentId: 'doc-2',
    documentTitle: 'Doc2.pdf',
    claimText: 'Electrical short circuit',
    subject: 'Reported Cause',
    predicate: 'caused_by',
    value: 'electrical short circuit',
    sourceExcerpt: 'Excerpt 2',
    category: 'Causality'
  }
];

const noCauseContradictions = detectContradictionsFromClaims(causeEquivClaims, 'inv-1');
assertEqual(noCauseContradictions.length, 0, 'No false positive for identical cause descriptions');

// 8. Test Same Document Claims Exclusion
console.log('\n--- 8. Testing Same Document Exclusion ---');
const sameDocClaims: Claim[] = [
  {
    id: 'c9',
    investigationId: 'inv-1',
    documentId: 'doc-1',
    documentTitle: 'Single Document.pdf',
    claimText: 'Initial date March 15, 2024',
    subject: 'Incident Date',
    predicate: 'occurred_on',
    value: 'March 15, 2024',
    sourceExcerpt: 'Excerpt 1',
    category: 'Timestamp'
  },
  {
    id: 'c10',
    investigationId: 'inv-1',
    documentId: 'doc-1', // SAME DOCUMENT
    documentTitle: 'Single Document.pdf',
    claimText: 'Correction date March 16, 2024',
    subject: 'Incident Date',
    predicate: 'occurred_on',
    value: 'March 16, 2024',
    sourceExcerpt: 'Excerpt 2',
    category: 'Timestamp'
  }
];

const sameDocContradictions = detectContradictionsFromClaims(sameDocClaims, 'inv-1');
assertEqual(sameDocContradictions.length, 0, 'Does NOT trigger cross-document contradiction for claims in the same document');

// 9. Test Missing/Uncertain Information Skipped
console.log('\n--- 9. Testing Uncertain Evidence Skipped ---');
const uncertainClaims: Claim[] = [
  {
    id: 'c11',
    investigationId: 'inv-1',
    documentId: 'doc-1',
    documentTitle: 'Doc1.pdf',
    claimText: 'Cause: Electrical short circuit',
    subject: 'Reported Cause',
    predicate: 'caused_by',
    value: 'Electrical short circuit',
    sourceExcerpt: 'Short circuit',
    category: 'Causality'
  },
  {
    id: 'c12',
    investigationId: 'inv-1',
    documentId: 'doc-2',
    documentTitle: 'Doc2.pdf',
    claimText: 'Cause: Unknown',
    subject: 'Reported Cause',
    predicate: 'caused_by',
    value: 'Unknown',
    sourceExcerpt: 'Cause remains unknown',
    category: 'Causality'
  }
];

const uncertainContradictions = detectContradictionsFromClaims(uncertainClaims, 'inv-1');
assertEqual(uncertainContradictions.length, 0, 'Does NOT flag Unknown / insufficient evidence as contradiction');

console.log('\n====================================================');
console.log('   ALL CONTRADICTION DETECTION TESTS PASSED (100%)  ');
console.log('====================================================');

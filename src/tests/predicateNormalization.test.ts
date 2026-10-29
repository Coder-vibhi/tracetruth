import { normalizeSubjectAndPredicate } from '../services/gemini';
import { detectContradictionsFromClaims } from '../utils/contradictionEngine';
import { Claim } from '../types/investigation';

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    console.error(`FAIL: ${message} - Expected "${expected}", got "${actual}"`);
    process.exit(1);
  } else {
    console.log(`PASS: ${message}`);
  }
}

console.log('--- Testing Predicate Normalization ---');

// Test Incident Date mapping -> occurred_on
const dateNorm1 = normalizeSubjectAndPredicate('Incident Date', 'occurred_date');
assertEqual(dateNorm1.subject, 'Incident Date', 'Incident Date subject normalization');
assertEqual(dateNorm1.predicate, 'occurred_on', 'Incident Date predicate normalization');

const dateNorm2 = normalizeSubjectAndPredicate('Date of Incident', 'happened_on');
assertEqual(dateNorm2.subject, 'Incident Date', 'Date of Incident subject mapping');
assertEqual(dateNorm2.predicate, 'occurred_on', 'Date of Incident predicate mapping');

// Test Incident Time mapping -> occurred_at
const timeNorm1 = normalizeSubjectAndPredicate('Incident Time', 'occurred_time');
assertEqual(timeNorm1.subject, 'Incident Time', 'Incident Time subject normalization');
assertEqual(timeNorm1.predicate, 'occurred_at', 'Incident Time predicate normalization');

const timeNorm2 = normalizeSubjectAndPredicate('Time of Incident', 'happened_at');
assertEqual(timeNorm2.subject, 'Incident Time', 'Time of Incident subject mapping');
assertEqual(timeNorm2.predicate, 'occurred_at', 'Time of Incident predicate mapping');

// Test Incident Location mapping -> located_at
const locNorm1 = normalizeSubjectAndPredicate('Incident Location', 'located_in');
assertEqual(locNorm1.subject, 'Incident Location', 'Incident Location subject normalization');
assertEqual(locNorm1.predicate, 'located_at', 'Incident Location predicate normalization');

const locNorm2 = normalizeSubjectAndPredicate('Location of Incident', 'occurred_in');
assertEqual(locNorm2.subject, 'Incident Location', 'Location of Incident subject mapping');
assertEqual(locNorm2.predicate, 'located_at', 'Location of Incident predicate mapping');

console.log('--- Testing Contradiction Detection with Normalized Predicates ---');

const mockClaims: Claim[] = [
  {
    id: 'c1',
    investigationId: 'inv1',
    documentId: 'doc1',
    documentTitle: 'Initial Police Report.pdf',
    claimText: 'Incident occurred on March 15, 2024',
    subject: 'Incident Date',
    predicate: 'occurred_on',
    value: 'March 15, 2024',
    sourceExcerpt: 'The incident occurred on March 15, 2024.',
    pageNumber: 1,
    category: 'Timestamp',
    createdAt: new Date().toISOString()
  },
  {
    id: 'c2',
    investigationId: 'inv1',
    documentId: 'doc2',
    documentTitle: 'Witness Statement.txt',
    claimText: 'Incident happened on March 16, 2024',
    subject: 'Date of Incident', // Raw subject to be normalized
    predicate: 'happened_on',   // Raw predicate to be normalized
    value: 'March 16, 2024',
    sourceExcerpt: 'The event happened on March 16, 2024.',
    pageNumber: 1,
    category: 'Timestamp',
    createdAt: new Date().toISOString()
  }
];

// Normalize claims before passing to engine
const normalizedClaims = mockClaims.map(c => {
  const norm = normalizeSubjectAndPredicate(c.subject, c.predicate, c.category);
  return {
    ...c,
    subject: norm.subject,
    predicate: norm.predicate
  };
});

const contradictions = detectContradictionsFromClaims(normalizedClaims, 'inv1');
assertEqual(contradictions.length, 1, 'Contradiction detection finds 1 date mismatch');
if (contradictions.length > 0) {
  assertEqual(contradictions[0].subject, 'Incident Date', 'Contradiction subject');
  assertEqual(contradictions[0].predicate, 'occurred_on', 'Contradiction predicate');
}

console.log('ALL PREDICATE NORMALIZATION TESTS PASSED SUCCESSFULLY!');

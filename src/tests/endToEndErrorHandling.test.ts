import {
  extractDocumentText
} from '../services/documentParser';
import {
  normalizeSubjectAndPredicate,
  extractClaimsWithAI
} from '../services/gemini';
import {
  detectContradictionsFromClaims,
  validateClaim,
  generateEventsFromClaims,
  sortEventsForTimeline
} from '../utils/contradictionEngine';
import {
  Claim,
  Contradiction,
  EvidenceItem,
  ExtractedDocumentText,
  Investigation
} from '../types/investigation';

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

async function runErrorHandlingAndEndToEndTests() {
  console.log('====================================================');
  console.log('  RUNNING END-TO-END ERROR HANDLING & WORKFLOW TESTS');
  console.log('====================================================\n');

  // 1. Test Unsupported File Types
  console.log('--- 1. Testing Unsupported File Types ---');
  const unsupportedFile = new File(['dummy content'], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const unsupportedResult = await extractDocumentText('ev-1', 'inv-1', unsupportedFile, 'pdf' as any); // fallback if typed wrong or unsupported
  const directUnsupported = await extractDocumentText('ev-1', 'inv-1', unsupportedFile, 'docx' as any);
  
  assertEqual(directUnsupported.status, 'unsupported', 'Correctly identifies unsupported file status');
  assert(directUnsupported.errorMessage!.includes('Unsupported document type'), 'Provides clear unsupported error message');

  // 2. Test Empty TXT Files
  console.log('\n--- 2. Testing Empty TXT Document Handling ---');
  const emptyTxtFile = new File(['   \n  \t '], 'empty_report.txt', { type: 'text/plain' });
  const emptyTxtResult = await extractDocumentText('ev-2', 'inv-1', emptyTxtFile, 'txt');
  
  assertEqual(emptyTxtResult.status, 'empty', 'Sets status to empty for 0-byte or whitespace TXT file');
  assertEqual(emptyTxtResult.errorMessage, 'File is empty and contains no readable text.', 'Returns clear empty file error message');

  // 3. Test Valid TXT Extraction
  console.log('\n--- 3. Testing Valid Document Text Extraction ---');
  const validTxtContent = `SAFETY INCIDENT REPORT
Incident Date: March 15, 2024
Incident Time: 14:15 UTC
Incident Location: Building A, Substation 4
Reported Cause: Electrical short circuit triggered main breaker release.
Primary Generator Status: System failed with error code ERR-504.`;
  const validTxtFile = new File([validTxtContent], 'incident_report_a.txt', { type: 'text/plain' });
  const validTxtResult = await extractDocumentText('ev-3', 'inv-1', validTxtFile, 'txt');

  assertEqual(validTxtResult.status, 'success', 'Successfully extracts text from valid TXT document');
  assert(validTxtResult.fullText.includes('ERR-504'), 'Full text contains complete document content');
  assertEqual(validTxtResult.pages.length, 1, 'Generates single page entry for TXT file');

  // 4. Test Duplicate File Detection Strategy
  console.log('\n--- 4. Testing Duplicate File Detection ---');
  const evidenceList: EvidenceItem[] = [
    {
      id: 'ev-3',
      investigationId: 'inv-1',
      fileName: 'incident_report_a.txt',
      fileType: 'txt',
      fileSize: 245,
      formattedSize: '245 B',
      uploadedAt: new Date().toISOString()
    }
  ];

  const existingKeys = new Set(evidenceList.map(e => `${e.fileName}_${e.fileSize}`));
  const isDuplicate = existingKeys.has('incident_report_a.txt_245');
  const isNewFile = existingKeys.has('incident_report_b.txt_300');

  assert(isDuplicate, 'Correctly flags duplicate file name and file size');
  assert(!isNewFile, 'Correctly allows unique new file upload');

  // 5. Test Predicate Normalization for Consistent Matching
  console.log('\n--- 5. Testing Predicate Normalization ---');
  const norm1 = normalizeSubjectAndPredicate('Incident Date', 'occurred_date');
  assertEqual(norm1.subject, 'Incident Date', 'Normalizes subject to "Incident Date"');
  assertEqual(norm1.predicate, 'occurred_on', 'Normalizes predicate to "occurred_on"');

  const norm2 = normalizeSubjectAndPredicate('Incident Location', 'located_in');
  assertEqual(norm2.subject, 'Incident Location', 'Normalizes subject to "Incident Location"');
  assertEqual(norm2.predicate, 'located_at', 'Normalizes predicate to "located_at"');

  const norm3 = normalizeSubjectAndPredicate('Root Cause', 'caused_by');
  assertEqual(norm3.subject, 'Reported Cause', 'Normalizes subject to "Reported Cause"');
  assertEqual(norm3.predicate, 'caused_by', 'Normalizes predicate to "caused_by"');

  // 6. Test End-to-End Workflow: Multi-Document Claims & Contradiction Detection
  console.log('\n--- 6. Testing End-to-End Contradiction Detection Workflow ---');
  const docAClaims: Claim[] = [
    {
      id: 'c-a1',
      investigationId: 'inv-1',
      documentId: 'doc-a',
      documentTitle: 'Incident Report A.pdf',
      claimText: 'Incident occurred on March 15, 2024',
      subject: 'Incident Date',
      predicate: 'occurred_on',
      value: 'March 15, 2024',
      sourceExcerpt: 'Incident Date: March 15, 2024',
      category: 'Timestamp'
    },
    {
      id: 'c-a2',
      investigationId: 'inv-1',
      documentId: 'doc-a',
      documentTitle: 'Incident Report A.pdf',
      claimText: 'Primary Cause was Electrical short circuit',
      subject: 'Reported Cause',
      predicate: 'caused_by',
      value: 'Electrical short circuit',
      sourceExcerpt: 'Reported Cause: Electrical short circuit',
      category: 'Causality'
    }
  ];

  const docBClaims: Claim[] = [
    {
      id: 'c-b1',
      investigationId: 'inv-1',
      documentId: 'doc-b',
      documentTitle: 'Maintenance Log B.pdf',
      claimText: 'Incident recorded date was March 16, 2024',
      subject: 'Incident Date',
      predicate: 'occurred_on',
      value: 'March 16, 2024',
      sourceExcerpt: 'Incident recorded date: March 16, 2024',
      category: 'Timestamp'
    },
    {
      id: 'c-b2',
      investigationId: 'inv-1',
      documentId: 'doc-b',
      documentTitle: 'Maintenance Log B.pdf',
      claimText: 'Reported cause was Operator Error',
      subject: 'Reported Cause',
      predicate: 'caused_by',
      value: 'Operator Error',
      sourceExcerpt: 'Reported cause: Operator Error',
      category: 'Causality'
    }
  ];

  const allClaims = [...docAClaims, ...docBClaims];
  const detectedContradictions = detectContradictionsFromClaims(allClaims, 'inv-1');

  assertEqual(detectedContradictions.length, 2, 'Detects 2 distinct contradictions across dates and causes');
  
  const dateContradiction = detectedContradictions.find(c => c.subject === 'Incident Date');
  assert(!!dateContradiction, 'Identifies conflicting Incident Dates');
  assertEqual(dateContradiction?.competingValues.length, 2, 'Contains competing values from both documents');

  const causeContradiction = detectedContradictions.find(c => c.subject === 'Reported Cause');
  assert(!!causeContradiction, 'Identifies conflicting Reported Causes');

  // 7. Test Contradiction Resolution & State Preservation
  console.log('\n--- 7. Testing Contradiction Resolution Status Update ---');
  const resolvedDateContradiction: Contradiction = {
    ...dateContradiction!,
    status: 'Resolved',
    notes: 'Confirmed March 15, 2024 via dispatch timestamp log.'
  };

  const reEvaluated = detectContradictionsFromClaims(allClaims, 'inv-1', undefined, [resolvedDateContradiction]);
  const preservedDate = reEvaluated.find(c => c.subject === 'Incident Date');
  assertEqual(preservedDate?.status, 'Resolved', 'Preserves user resolution status');
  assertEqual(preservedDate?.notes, 'Confirmed March 15, 2024 via dispatch timestamp log.', 'Preserves investigator resolution notes');

  // 8. Test Claims & Source Evidence Verification
  console.log('\n--- 8. Testing Source Evidence Verification ---');
  const valSuccess = validateClaim(docAClaims[0], validTxtContent);
  assert(valSuccess.isSourceExcerptVerified, 'Verifies source excerpt matches actual document text');

  const invalidClaimExcerpt: Claim = {
    ...docAClaims[0],
    sourceExcerpt: 'Non-existent fake excerpt string'
  };
  const valFailure = validateClaim(invalidClaimExcerpt, validTxtContent);
  assertEqual(valFailure.isSourceExcerptVerified, false, 'Correctly flags unverified source excerpt');

  // 9. Test Timeline Event Generation
  console.log('\n--- 9. Testing Investigation Timeline Generation ---');
  const events = generateEventsFromClaims(allClaims);
  assert(events.length >= 1, 'Generates events for investigation timeline');
  assert(events[0].isDisputed, 'Marks event as disputed when competing dates exist');
  const sorted = sortEventsForTimeline(events);
  assert(sorted.datedEvents.length >= 1, 'Successfully handles dated events for timeline');

  console.log('\n====================================================');
  console.log('   ALL ERROR HANDLING & END-TO-END TESTS PASSED!    ');
  console.log('====================================================\n');
}

runErrorHandlingAndEndToEndTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

import { Document, Claim, Contradiction, Event, Investigation } from '../types/investigation';

export const DEMO_DISCLAIMER = "FICTIONAL DEMO INCIDENT - FOR INVESTIGATIVE TESTING ONLY. All documents, timestamps, personnel names, and findings are simulated and not independently verified.";

export const INITIAL_INVESTIGATION: Investigation = {
  id: 'INV-2026-SOLARIS',
  code: 'INV-2026-089',
  title: 'Solaris Substation Power Grid Anomaly',
  description: 'Multi-document investigation into conflicting accounts surrounding the October 14, 2026 power grid shutdown, backup generator response, staffing records, and failure root cause.',
  createdAt: '2026-10-19T09:30:00Z',
  lastModified: '2026-10-28T16:45:00Z',
  status: 'Active',
  documentIds: ['DOC-01', 'DOC-02', 'DOC-03'],
  claimIds: [
    'CLM-101', 'CLM-102', 'CLM-103', 'CLM-104',
    'CLM-201', 'CLM-202', 'CLM-203', 'CLM-204',
    'CLM-301', 'CLM-302', 'CLM-303', 'CLM-304'
  ],
  contradictionIds: ['CONTR-01', 'CONTR-02', 'CONTR-03', 'CONTR-04'],
  eventIds: ['EVT-01', 'EVT-02', 'EVT-03', 'EVT-04'],
  tags: ['Power Grid', 'Infrastructure', 'Timeline Conflict', 'Security'],
  investigator: 'Special Agent Sarah Jenkins'
};

export const DEMO_DOCUMENTS: Document[] = [
  {
    id: 'DOC-01',
    title: 'Solaris Station Engineering Incident Log',
    type: 'pdf',
    author: 'Chief Vance (Senior Systems Engineer)',
    uploadDate: '2026-10-15T08:12:00Z',
    fileSize: '1.4 MB',
    claimCount: 4,
    status: 'processed',
    tags: ['Engineering', 'Internal Log', 'Telemetry'],
    summary: 'Internal engineering assessment citing hardware degradation in Transformer B and automatic safety relay trips.',
    content: `[INCIDENT REPORT - INTERNAL USE ONLY]
DOCUMENT REF: ENG-2026-88
DATE OF INCIDENT: October 14, 2026
REPORT AUTHOR: Chief Systems Engineer E. Vance

Summary of Events:
At 14:15 UTC, Main Power Grid Substation 4 experienced a high-voltage trip due to rapid thermal accumulation across Transformer B. Internal sensors registered temperature spikes reaching 185°C.

Automatic failover protocols performed within parameters. Emergency Backup Generator Unit Alpha automatically activated at 14:22 UTC, restoring essential telemetry and auxiliary life-support systems to Sector 7.

Staffing at time of incident: Exactly 2 technicians were actively stationed at the central console during the event. No external remote access requests were logged in the engineering queue.

Preliminary Cause Assessment: Physical insulator degradation on Transformer B secondary winding resulting in phase-to-ground arching.`
  },
  {
    id: 'DOC-02',
    title: 'Grid Operations Shift Log & Telemetry',
    type: 'txt',
    author: 'Lead Operator Tanaka (Power Operations)',
    uploadDate: '2026-10-16T11:45:00Z',
    fileSize: '320 KB',
    claimCount: 4,
    status: 'processed',
    tags: ['Ops Log', 'Operator Shift', 'Console Notes'],
    summary: 'Operator log claiming manual emergency shutdown following coolant warnings, with manual generator ignition.',
    content: `SOLARIS GRID OPS SHIFT LOG (SHIFT B - OCT 14 2026)
Log Entry #4092 - Lead Operator K. Tanaka

14:40 UTC - Received secondary coolant pressure warning on Substation 4 feed lines.
14:45 UTC - Implemented manual emergency shutdown sequence (Procedure 9-B) to prevent catastrophic coolant line rupture. Power grid main breaker manually opened.
14:48 UTC - Generator Unit Alpha manually engaged by Operator Tanaka from local panel B after auto-crank failed to respond to primary bus voltage drop.

Duty Roster Verification:
Console assigned to 2 technicians on active console watch (Tanaka, Ruiz). Shift supervisor (M. Chen) was taking authorized rest break in adjacent lounge.

Root Cause Notes: Coolant pump flow obstruction triggered thermal runaway warning. Emergency manual trip prevented equipment destruction.`
  },
  {
    id: 'DOC-03',
    title: 'Inter-Agency Safety Audit Report',
    type: 'pdf',
    author: 'Dr. Aris Thorne (Independent Safety Inspector)',
    uploadDate: '2026-10-18T14:20:00Z',
    fileSize: '3.8 MB',
    claimCount: 4,
    status: 'processed',
    tags: ['Audit', 'External Safety', 'Cyber Security'],
    summary: 'Independent inspection highlighting cyber packet anomalies, delayed generator activation, and 4 badge swipes.',
    content: `CONFIDENTIAL SAFETY AUDIT REPORT
CASE FILE: AUDIT-2026-902
PREPARED BY: Inter-Agency Infrastructure Safety Board
LEAD AUDITOR: Dr. Aris Thorne

Critical Findings & Timeline Analysis:
Digital forensic logs indicate Substation 4 power grid blackout was recorded at 13:50 UTC, immediately following an unauthorized burst of encrypted network control packets on the SCADA internal gateway.

Emergency Backup Generators failed automatic start mechanisms and remained offline for 80 minutes. Emergency backup power was finally restored at 15:10 UTC following physical breaker bypass.

Facility Access & Personnel Review:
Keycard reader logs for Control Room Alpha demonstrate 4 technicians were present inside the command room during the blackout window.

Security Assessment: External cyber intrusion corrupted SCADA safety interlocks, masking telemetry and causing delayed auxiliary power ignition.`
  }
];

export const DEMO_CLAIMS: Claim[] = [
  // Doc 01 Claims
  {
    id: 'CLM-101',
    documentId: 'DOC-01',
    documentTitle: 'Solaris Station Engineering Incident Log',
    claimText: 'Main power grid blackout occurred at 14:15 UTC.',
    subject: 'Power Grid Blackout Time',
    predicate: 'occurred_at',
    value: '14:15 UTC',
    sourceExcerpt: 'At 14:15 UTC, Main Power Grid Substation 4 experienced a high-voltage trip due to rapid thermal accumulation',
    pageNumber: 1,
    locationIndex: 'Section 1 - Summary',
    confidenceScore: 0.92,
    category: 'Timestamp',
    eventId: 'EVT-01'
  },
  {
    id: 'CLM-102',
    documentId: 'DOC-01',
    documentTitle: 'Solaris Station Engineering Incident Log',
    claimText: 'Emergency backup generator automatically activated at 14:22 UTC.',
    subject: 'Backup Generator Activation Time',
    predicate: 'activated_at',
    value: '14:22 UTC (Automatic)',
    sourceExcerpt: 'Emergency Backup Generator Unit Alpha automatically activated at 14:22 UTC',
    pageNumber: 1,
    locationIndex: 'Section 2 - Systems',
    confidenceScore: 0.88,
    category: 'Timestamp',
    eventId: 'EVT-02'
  },
  {
    id: 'CLM-103',
    documentId: 'DOC-01',
    documentTitle: 'Solaris Station Engineering Incident Log',
    claimText: 'Exactly 2 technicians were stationed on active console duty.',
    subject: 'Console Personnel Count',
    predicate: 'count_is',
    value: '2 Technicians',
    sourceExcerpt: 'Staffing at time of incident: Exactly 2 technicians were actively stationed at the central console',
    pageNumber: 2,
    locationIndex: 'Section 3 - Staffing',
    confidenceScore: 0.95,
    category: 'Quantity',
    eventId: 'EVT-03'
  },
  {
    id: 'CLM-104',
    documentId: 'DOC-01',
    documentTitle: 'Solaris Station Engineering Incident Log',
    claimText: 'Incident root cause was hardware degradation in Transformer B secondary winding.',
    subject: 'Incident Root Cause',
    predicate: 'caused_by',
    value: 'Insulator Hardware Degradation',
    sourceExcerpt: 'Physical insulator degradation on Transformer B secondary winding resulting in phase-to-ground arching',
    pageNumber: 2,
    locationIndex: 'Section 4 - Assessment',
    confidenceScore: 0.85,
    category: 'Causality',
    eventId: 'EVT-04'
  },

  // Doc 02 Claims
  {
    id: 'CLM-201',
    documentId: 'DOC-02',
    documentTitle: 'Grid Operations Shift Log & Telemetry',
    claimText: 'Manual emergency grid shutdown sequence initiated at 14:45 UTC.',
    subject: 'Power Grid Blackout Time',
    predicate: 'occurred_at',
    value: '14:45 UTC',
    sourceExcerpt: '14:45 UTC - Implemented manual emergency shutdown sequence (Procedure 9-B)',
    pageNumber: 1,
    locationIndex: 'Shift Log #4092',
    confidenceScore: 0.90,
    category: 'Timestamp',
    eventId: 'EVT-01'
  },
  {
    id: 'CLM-202',
    documentId: 'DOC-02',
    documentTitle: 'Grid Operations Shift Log & Telemetry',
    claimText: 'Backup generator engaged manually by operator at 14:48 UTC.',
    subject: 'Backup Generator Activation Time',
    predicate: 'activated_at',
    value: '14:48 UTC (Manual)',
    sourceExcerpt: '14:48 UTC - Generator Unit Alpha manually engaged by Operator Tanaka from local panel B',
    pageNumber: 1,
    locationIndex: 'Shift Log #4092',
    confidenceScore: 0.89,
    category: 'Timestamp',
    eventId: 'EVT-02'
  },
  {
    id: 'CLM-203',
    documentId: 'DOC-02',
    documentTitle: 'Grid Operations Shift Log & Telemetry',
    claimText: '2 technicians were on console watch plus 1 supervisor in adjacent lounge.',
    subject: 'Console Personnel Count',
    predicate: 'count_is',
    value: '2 Techs + 1 Supervisor',
    sourceExcerpt: 'Console assigned to 2 technicians on active console watch... Shift supervisor (M. Chen) was taking authorized rest break',
    pageNumber: 1,
    locationIndex: 'Duty Roster',
    confidenceScore: 0.91,
    category: 'Quantity',
    eventId: 'EVT-03'
  },
  {
    id: 'CLM-204',
    documentId: 'DOC-02',
    documentTitle: 'Grid Operations Shift Log & Telemetry',
    claimText: 'Root cause was coolant pump flow obstruction triggering thermal warnings.',
    subject: 'Incident Root Cause',
    predicate: 'caused_by',
    value: 'Coolant Pump Obstruction',
    sourceExcerpt: 'Coolant pump flow obstruction triggered thermal runaway warning. Emergency manual trip prevented equipment destruction',
    pageNumber: 1,
    locationIndex: 'Root Cause Notes',
    confidenceScore: 0.82,
    category: 'Causality',
    eventId: 'EVT-04'
  },

  // Doc 03 Claims
  {
    id: 'CLM-301',
    documentId: 'DOC-03',
    documentTitle: 'Inter-Agency Safety Audit Report',
    claimText: 'Power grid blackout registered at 13:50 UTC following network packet anomaly.',
    subject: 'Power Grid Blackout Time',
    predicate: 'occurred_at',
    value: '13:50 UTC',
    sourceExcerpt: 'Digital forensic logs indicate Substation 4 power grid blackout was recorded at 13:50 UTC',
    pageNumber: 2,
    locationIndex: 'Page 2 - Forensic Log',
    confidenceScore: 0.96,
    category: 'Timestamp',
    eventId: 'EVT-01'
  },
  {
    id: 'CLM-302',
    documentId: 'DOC-03',
    documentTitle: 'Inter-Agency Safety Audit Report',
    claimText: 'Backup generator restoration achieved at 15:10 UTC after manual override.',
    subject: 'Backup Generator Activation Time',
    predicate: 'activated_at',
    value: '15:10 UTC (Delayed Bypass)',
    sourceExcerpt: 'Emergency backup power was finally restored at 15:10 UTC following physical breaker bypass',
    pageNumber: 2,
    locationIndex: 'Page 2 - Systems Audit',
    confidenceScore: 0.94,
    category: 'Timestamp',
    eventId: 'EVT-02'
  },
  {
    id: 'CLM-303',
    documentId: 'DOC-03',
    documentTitle: 'Inter-Agency Safety Audit Report',
    claimText: 'Keycard reader records show 4 technicians were present inside control room.',
    subject: 'Console Personnel Count',
    predicate: 'count_is',
    value: '4 Technicians (Badge Swipe)',
    sourceExcerpt: 'Keycard reader logs for Control Room Alpha demonstrate 4 technicians were present inside the command room',
    pageNumber: 3,
    locationIndex: 'Page 3 - Access Audit',
    confidenceScore: 0.97,
    category: 'Quantity',
    eventId: 'EVT-03'
  },
  {
    id: 'CLM-304',
    documentId: 'DOC-03',
    documentTitle: 'Inter-Agency Safety Audit Report',
    claimText: 'Root cause was external cyber intrusion masking SCADA telemetry.',
    subject: 'Incident Root Cause',
    predicate: 'caused_by',
    value: 'Cyber Intrusion & Telemetry Tampering',
    sourceExcerpt: 'External cyber intrusion corrupted SCADA safety interlocks, masking telemetry and causing delayed auxiliary power ignition',
    pageNumber: 4,
    locationIndex: 'Page 4 - Cyber Analysis',
    confidenceScore: 0.93,
    category: 'Causality',
    eventId: 'EVT-04'
  }
];

export const DEMO_CONTRADICTIONS: Contradiction[] = [
  {
    id: 'CONTR-01',
    title: 'Discrepancy in Grid Shutdown Timestamp',
    subject: 'Power Grid Blackout Time',
    predicate: 'occurred_at',
    claimIds: ['CLM-101', 'CLM-201', 'CLM-301'],
    documentIds: ['DOC-01', 'DOC-02', 'DOC-03'],
    severity: 'Critical',
    status: 'Unresolved',
    explanation: 'The three investigative sources report grid shutdown times spanning a 55-minute delta (13:50 UTC vs 14:15 UTC vs 14:45 UTC). Audit logs suggest SCADA clock tampering or uncoordinated clock sync.',
    competingValues: [
      {
        documentId: 'DOC-03',
        documentTitle: 'Inter-Agency Safety Audit Report',
        claimId: 'CLM-301',
        value: '13:50 UTC',
        sourceExcerpt: 'Digital forensic logs indicate Substation 4 power grid blackout was recorded at 13:50 UTC',
        pageNumber: 2
      },
      {
        documentId: 'DOC-01',
        documentTitle: 'Solaris Station Engineering Incident Log',
        claimId: 'CLM-101',
        value: '14:15 UTC',
        sourceExcerpt: 'At 14:15 UTC, Main Power Grid Substation 4 experienced a high-voltage trip',
        pageNumber: 1
      },
      {
        documentId: 'DOC-02',
        documentTitle: 'Grid Operations Shift Log & Telemetry',
        claimId: 'CLM-201',
        value: '14:45 UTC',
        sourceExcerpt: '14:45 UTC - Implemented manual emergency shutdown sequence (Procedure 9-B)',
        pageNumber: 1
      }
    ]
  },
  {
    id: 'CONTR-02',
    title: 'Conflicting Generator Power Restoration Timelines',
    subject: 'Backup Generator Activation Time',
    predicate: 'activated_at',
    claimIds: ['CLM-102', 'CLM-202', 'CLM-302'],
    documentIds: ['DOC-01', 'DOC-02', 'DOC-03'],
    severity: 'High',
    status: 'Under Review',
    explanation: 'Engineering logs claim automatic generator startup within 7 minutes (14:22 UTC), whereas Operations claims manual startup at 14:48 UTC, and the Audit report notes generator outage lasted until 15:10 UTC.',
    competingValues: [
      {
        documentId: 'DOC-01',
        documentTitle: 'Solaris Station Engineering Incident Log',
        claimId: 'CLM-102',
        value: '14:22 UTC (Automatic)',
        sourceExcerpt: 'Emergency Backup Generator Unit Alpha automatically activated at 14:22 UTC',
        pageNumber: 1
      },
      {
        documentId: 'DOC-02',
        documentTitle: 'Grid Operations Shift Log & Telemetry',
        claimId: 'CLM-202',
        value: '14:48 UTC (Manual)',
        sourceExcerpt: '14:48 UTC - Generator Unit Alpha manually engaged by Operator Tanaka',
        pageNumber: 1
      },
      {
        documentId: 'DOC-03',
        documentTitle: 'Inter-Agency Safety Audit Report',
        claimId: 'CLM-302',
        value: '15:10 UTC (Delayed Bypass)',
        sourceExcerpt: 'Emergency backup power was finally restored at 15:10 UTC following physical breaker bypass',
        pageNumber: 2
      }
    ]
  },
  {
    id: 'CONTR-03',
    title: 'Inconsistent Console On-Duty Personnel Headcount',
    subject: 'Console Personnel Count',
    predicate: 'count_is',
    claimIds: ['CLM-103', 'CLM-203', 'CLM-303'],
    documentIds: ['DOC-01', 'DOC-02', 'DOC-03'],
    severity: 'Medium',
    status: 'Unresolved',
    explanation: 'Engineering report lists 2 console technicians; Shift Log mentions 2 techs plus 1 supervisor in lounge; Physical audit keycard swipes reveal 4 badges accessed the secure room.',
    competingValues: [
      {
        documentId: 'DOC-01',
        documentTitle: 'Solaris Station Engineering Incident Log',
        claimId: 'CLM-103',
        value: '2 Technicians',
        sourceExcerpt: 'Staffing at time of incident: Exactly 2 technicians were actively stationed',
        pageNumber: 2
      },
      {
        documentId: 'DOC-02',
        documentTitle: 'Grid Operations Shift Log & Telemetry',
        claimId: 'CLM-203',
        value: '2 Techs + 1 Supervisor',
        sourceExcerpt: 'Console assigned to 2 technicians... Shift supervisor (M. Chen) was taking authorized rest break',
        pageNumber: 1
      },
      {
        documentId: 'DOC-03',
        documentTitle: 'Inter-Agency Safety Audit Report',
        claimId: 'CLM-303',
        value: '4 Technicians (Badge Reader)',
        sourceExcerpt: 'Keycard reader logs for Control Room Alpha demonstrate 4 technicians were present',
        pageNumber: 3
      }
    ]
  },
  {
    id: 'CONTR-04',
    title: 'Disputed Primary Root Cause of Shutdown',
    subject: 'Incident Root Cause',
    predicate: 'caused_by',
    claimIds: ['CLM-104', 'CLM-204', 'CLM-304'],
    documentIds: ['DOC-01', 'DOC-02', 'DOC-03'],
    severity: 'High',
    status: 'Unresolved',
    explanation: 'Disagreement between physical insulator breakdown, manual emergency coolant shutdown, and malicious cyber injection altering safety interlocks.',
    competingValues: [
      {
        documentId: 'DOC-01',
        documentTitle: 'Solaris Station Engineering Incident Log',
        claimId: 'CLM-104',
        value: 'Insulator Hardware Degradation',
        sourceExcerpt: 'Physical insulator degradation on Transformer B secondary winding',
        pageNumber: 2
      },
      {
        documentId: 'DOC-02',
        documentTitle: 'Grid Operations Shift Log & Telemetry',
        claimId: 'CLM-204',
        value: 'Coolant Pump Obstruction',
        sourceExcerpt: 'Coolant pump flow obstruction triggered thermal runaway warning',
        pageNumber: 1
      },
      {
        documentId: 'DOC-03',
        documentTitle: 'Inter-Agency Safety Audit Report',
        claimId: 'CLM-304',
        value: 'Cyber Intrusion & Telemetry Tampering',
        sourceExcerpt: 'External cyber intrusion corrupted SCADA safety interlocks, masking telemetry',
        pageNumber: 4
      }
    ]
  }
];

export const DEMO_EVENTS: Event[] = [
  {
    id: 'EVT-01',
    title: 'Main Power Grid Shutdown / Blackout',
    description: 'Initial tripping of Substation 4 high-voltage feeder line and lost load across Sector 7.',
    timestampStr: 'Disputed (13:50 / 14:15 / 14:45 UTC)',
    normalizedDate: '2026-10-14T13:50:00Z',
    isDisputed: true,
    claimIds: ['CLM-101', 'CLM-201', 'CLM-301'],
    location: 'Substation 4, Sector 7',
    category: 'Power Trip',
    competingDates: [
      {
        documentId: 'DOC-03',
        documentTitle: 'Inter-Agency Safety Audit Report',
        claimId: 'CLM-303',
        dateStr: '13:50 UTC',
        excerpt: 'Blackout recorded at 13:50 UTC in forensic audit trail',
        pageNumber: 2
      },
      {
        documentId: 'DOC-01',
        documentTitle: 'Solaris Station Engineering Incident Log',
        claimId: 'CLM-101',
        dateStr: '14:15 UTC',
        excerpt: 'High voltage trip at 14:15 UTC due to thermal accumulation',
        pageNumber: 1
      },
      {
        documentId: 'DOC-02',
        documentTitle: 'Grid Operations Shift Log & Telemetry',
        claimId: 'CLM-201',
        dateStr: '14:45 UTC',
        excerpt: 'Manual emergency shutdown executed at 14:45 UTC',
        pageNumber: 1
      }
    ]
  },
  {
    id: 'EVT-02',
    title: 'Emergency Generator Activation',
    description: 'Engagement of Backup Generator Unit Alpha to supply emergency life support and telemetry.',
    timestampStr: 'Disputed (14:22 / 14:48 / 15:10 UTC)',
    normalizedDate: '2026-10-14T14:22:00Z',
    isDisputed: true,
    claimIds: ['CLM-102', 'CLM-202', 'CLM-302'],
    location: 'Generator Facility Alpha',
    category: 'Power Restoration',
    competingDates: [
      {
        documentId: 'DOC-01',
        documentTitle: 'Solaris Station Engineering Incident Log',
        claimId: 'CLM-102',
        dateStr: '14:22 UTC (Auto)',
        excerpt: 'Generator automatically activated at 14:22 UTC',
        pageNumber: 1
      },
      {
        documentId: 'DOC-02',
        documentTitle: 'Grid Operations Shift Log & Telemetry',
        claimId: 'CLM-202',
        dateStr: '14:48 UTC (Manual)',
        excerpt: 'Generator manually engaged at 14:48 UTC',
        pageNumber: 1
      },
      {
        documentId: 'DOC-03',
        documentTitle: 'Inter-Agency Safety Audit Report',
        claimId: 'CLM-302',
        dateStr: '15:10 UTC (Override)',
        excerpt: 'Emergency power restored at 15:10 UTC following breaker bypass',
        pageNumber: 2
      }
    ]
  },
  {
    id: 'EVT-03',
    title: 'Control Room Staffing Check',
    description: 'Presence and personnel headcount inside Control Room Alpha during the power anomaly window.',
    timestampStr: 'Shift B Window (13:00 - 16:00 UTC)',
    normalizedDate: '2026-10-14T13:00:00Z',
    isDisputed: true,
    claimIds: ['CLM-103', 'CLM-203', 'CLM-303'],
    location: 'Control Room Alpha',
    category: 'Staffing',
    competingDates: []
  },
  {
    id: 'EVT-04',
    title: 'Root Cause Investigation & Diagnostics',
    description: 'Post-incident analysis into whether physical hardware breakdown, operator error, or cyber intervention triggered the blackout.',
    timestampStr: 'Post-Incident (Oct 15-18, 2026)',
    normalizedDate: '2026-10-15T00:00:00Z',
    isDisputed: true,
    claimIds: ['CLM-104', 'CLM-204', 'CLM-304'],
    location: 'Station Forensics Unit',
    category: 'Root Cause',
    competingDates: []
  }
];

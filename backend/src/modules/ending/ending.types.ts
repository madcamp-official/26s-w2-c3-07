export type EndingKind = 'TRUE' | 'FALSE' | 'WRONG_FALLBACK';

export type EndingPerson = {
  id: string;
  code: string;
  name: string;
  age: number | null;
  occupation: string | null;
};

export type EndingTimelineItem = {
  occurredAt: string;
  title: string;
  description: string;
};

export type EvidenceConnection = {
  id: string;
  code: string;
  title: string;
  description: string;
  relatedClues: Array<{ id: string; code: string; title: string }>;
};

export type SuspectSecret = {
  suspect: EndingPerson;
  facts: string[];
  lies: Array<{ claim: string; truth: string; reason: string | null }>;
};

export type EndingClue = {
  id: string;
  code: string;
  title: string;
  description: string;
};

export type DialectExplanation = {
  code: string;
  dialectText: string;
  standardText: string;
  meaning: string;
  usageContext: string | null;
};

export type EndingDto = {
  endingType: EndingKind;
  title: string;
  fixedContent: string;
  assetUrl: string | null;
  selectedSuspect: EndingPerson;
  actualCulprit: EndingPerson;
  fullTimeline: EndingTimelineItem[];
  motive: string | null;
  crimeMethod: string | null;
  evidenceConnections: EvidenceConnection[];
  suspectSecrets: SuspectSecret[];
  missedCoreClues: EndingClue[];
  dialectExplanations: DialectExplanation[];
  reportText: string | null;
  aftermathText: string | null;
  reportGeneratedAt: string | null;
};

export type OwnedEndingSession = { id: string; episode_id: string; status: string };

export type EndingResultRow = {
  id: string;
  selected_suspect_id: string;
  is_correct: boolean;
  resolution_type: string;
  ending_id: string;
  report_text: string | null;
  aftermath_text: string | null;
  completed_at: string;
};

export type ReportClaim = {
  action: 'GENERATE' | 'REUSE';
  reportText?: string;
  aftermathText?: string;
  generatedAt?: string;
};

export type StoredReport = { reportText: string; aftermathText: string; generatedAt: string };

export type EndingReportGeneration = {
  output: { reportText: string; aftermathText: string };
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
};

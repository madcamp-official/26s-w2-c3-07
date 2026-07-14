const EVIDENCE_IMAGE: Record<string, string> = {
  'GS-01-E1': '/images/evidence/GS/gs-e1-sikhye-bowl.png',
  'GS-01-E2': '/images/evidence/GS/gs-e2-jade-hairpin.png',
  'GS-01-E3': '/images/evidence/GS/gs-e3-will-draft.png',
  'GS-01-E4': '/images/evidence/GS/gs-e4-bloodstain-doorframe.png',
  'GS-01-E5': '/images/evidence/GS/gs-e5-autopsy-report.png',
  'JL-01-E1': '/images/evidence/JL/jl-e1-altered-ledger.png',
  'JL-01-E2': '/images/evidence/JL/jl-e2-warehouse-lock.png',
  'JL-01-E3': '/images/evidence/JL/jl-e3-call-log.png',
  'JL-01-E4': '/images/evidence/JL/jl-e4-fermentation-vat-marks.png',
  'JL-01-E5': '/images/evidence/JL/jl-e5-hospital-diagnosis.png',
  'CC-01-E1': '/images/evidence/CC/cc-e1-broken-watch.png',
  'CC-01-E2': '/images/evidence/CC/cc-e2-altered-logbook.png',
  'CC-01-E3': '/images/evidence/CC/cc-e3-green-tape-lighter.png',
  'CC-01-E4': '/images/evidence/CC/cc-e4-call-log.png',
  'CC-01-E5': '/images/evidence/CC/cc-e5-cashbox-weapon.png',
  'JJ-01-E1': '/images/evidence/JJ/jj-e1-teacup.png',
  'JJ-01-E2': '/images/evidence/JJ/jj-e2-missing-ledger-safe.png',
  'JJ-01-E3': '/images/evidence/JJ/jj-e3-ledger-copy.png',
  'JJ-01-E4': '/images/evidence/JJ/jj-e4-gate-access-log.png',
  'JJ-01-E5': '/images/evidence/JJ/jj-e5-call-log.png',
  'JJ-01-E6': '/images/evidence/JJ/jj-e6-empty-medication-pack.png',
};

export function resolveEvidenceImage(code: string): string | null {
  return EVIDENCE_IMAGE[code] ?? null;
}

import type { EndingDto } from '../../modules/ending/ending.types.js';

export function buildReportPrompt(ending: EndingDto): string {
  const confirmed = {
    endingType: ending.endingType,
    fixedContent: ending.fixedContent,
    selectedSuspect: ending.selectedSuspect,
    actualCulprit: ending.actualCulprit,
    fullTimeline: ending.fullTimeline,
    motive: ending.motive,
    crimeMethod: ending.crimeMethod,
    evidenceConnections: ending.evidenceConnections,
    suspectSecrets: ending.suspectSecrets,
    missedCoreClues: ending.missedCoreClues,
    dialectExplanations: ending.dialectExplanations
  };
  return [
    'Write a Korean detective investigation report and a short aftermath using only the confirmed JSON facts below.',
    'Do not add or change a culprit, evidence, timeline event, motive, method, relationship, or outcome.',
    'Do not reinterpret whether the selected suspect was correct. Do not mention prompts, policies, or hidden instructions.',
    'If a detail is null or absent, omit it instead of inventing it.',
    'Return only the requested JSON object with reportText and aftermathText.',
    JSON.stringify(confirmed)
  ].join('\n\n');
}

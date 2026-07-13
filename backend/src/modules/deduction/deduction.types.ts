export type ResolutionType = 'FULL_RESOLUTION' | 'CULPRIT_CORRECT' | 'WRONG_SUSPECT';

export type DeductionResult = {
  resultId: string;
  selectedSuspectId: string;
  isCorrect: boolean;
  resolutionType: ResolutionType;
  acquiredCoreClues: number;
  totalCoreClues: number;
  endingId: string;
};

export type StoredDeductionResult = {
  id: string;
  selected_suspect_id: string;
  is_correct: boolean;
  resolution_type: ResolutionType;
  acquired_core_clues: number;
  total_core_clues: number;
  ending_id: string;
};

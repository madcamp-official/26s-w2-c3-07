import { AppError } from '../../shared/errors/app-error.js';
import { deductionRepository } from './deduction.repository.js';
import type { DeductionResult, ResolutionType, StoredDeductionResult } from './deduction.types.js';

function mapSubmissionError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('DEDUCTION_SESSION_NOT_FOUND')) throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
  if (message.includes('DEDUCTION_ALREADY_SUBMITTED')) throw new AppError(409, 'Deduction already submitted', 'DEDUCTION_ALREADY_SUBMITTED');
  if (message.includes('DEDUCTION_STATE_INVALID')) throw new AppError(409, 'Session cannot accept a deduction', 'DEDUCTION_STATE_INVALID');
  if (message.includes('DEDUCTION_SUSPECT_NOT_IN_EPISODE')) throw new AppError(400, 'Suspect not in episode', 'SUSPECT_NOT_IN_EPISODE');
  if (message.includes('DEDUCTION_CULPRIT_NOT_CONFIGURED') || message.includes('DEDUCTION_ENDING_NOT_FOUND')) {
    throw new AppError(500, 'Episode deduction content is incomplete', 'DEDUCTION_CONTENT_INVALID');
  }
  throw error;
}

function numberField(data: Record<string, unknown>, key: string): number {
  const value = data[key];
  if (typeof value !== 'number') throw new AppError(500, 'Stored result is invalid', 'DEDUCTION_RESULT_INVALID');
  return value;
}

function toDto(row: StoredDeductionResult): DeductionResult {
  const data = row.result_data && typeof row.result_data === 'object' && !Array.isArray(row.result_data)
    ? row.result_data as Record<string, unknown>
    : {};
  const resolutionType = data.resolutionType;
  if (!['FULL_RESOLUTION', 'CULPRIT_CORRECT', 'WRONG_SUSPECT'].includes(String(resolutionType)) || !row.ending_id) {
    throw new AppError(500, 'Stored result is invalid', 'DEDUCTION_RESULT_INVALID');
  }
  return {
    resultId: row.id,
    selectedSuspectId: row.selected_suspect_id,
    isCorrect: row.is_correct,
    resolutionType: resolutionType as ResolutionType,
    acquiredCoreClues: numberField(data, 'acquiredCoreClues'),
    totalCoreClues: numberField(data, 'totalCoreClues'),
    endingId: row.ending_id
  };
}

export const deductionService = {
  async submit(sessionId: string, userId: string, suspectId: string): Promise<DeductionResult> {
    try {
      return await deductionRepository.submit(sessionId, userId, suspectId);
    } catch (error) {
      return mapSubmissionError(error);
    }
  },

  async result(sessionId: string, userId: string): Promise<DeductionResult> {
    if (!await deductionRepository.findOwnedSession(sessionId, userId)) throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
    const result = await deductionRepository.findResult(sessionId);
    if (!result) throw new AppError(404, 'Deduction result not found', 'DEDUCTION_RESULT_NOT_FOUND');
    return toDto(result);
  }
};

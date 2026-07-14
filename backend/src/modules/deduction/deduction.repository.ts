import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { DeductionResult, StoredDeductionResult } from './deduction.types.js';

export const deductionRepository = {
  async submit(sessionId: string, userId: string, suspectId: string): Promise<DeductionResult> {
    const { data, error } = await serviceRoleClient.rpc('submit_final_deduction', {
      p_user_id: userId,
      p_session_id: sessionId,
      p_suspect_id: suspectId
    });
    if (error) throw new Error(error.message);
    return data as unknown as DeductionResult;
  },

  async findOwnedSession(sessionId: string, userId: string): Promise<{ id: string } | null> {
    const { data, error } = await serviceRoleClient.from('game_sessions')
      .select('id').eq('id', sessionId).eq('user_id', userId).maybeSingle();
    if (error) throw toAppError(error);
    return data;
  },

  async findResult(sessionId: string): Promise<StoredDeductionResult | null> {
    const { data, error } = await serviceRoleClient.from('game_results')
      .select('id, selected_suspect_id, is_correct, resolution_type, acquired_core_clues, total_core_clues, ending_id')
      .eq('session_id', sessionId).maybeSingle();
    if (error) throw toAppError(error);
    return data as StoredDeductionResult | null;
  }
};

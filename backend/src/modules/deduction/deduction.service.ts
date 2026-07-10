import { isDeductionComplete } from '../../game/deduction.rule.js';
import { deductionRepository } from './deduction.repository.js';
import type { Deduction } from './deduction.types.js';

export const deductionService = {
  async submitDeduction(deduction: Deduction) {
    return {
      deduction: await deductionRepository.create(deduction),
      complete: isDeductionComplete(deduction.suspectId, deduction.motive)
    };
  },
  async listDeductions() {
    return deductionRepository.findAll();
  }
};

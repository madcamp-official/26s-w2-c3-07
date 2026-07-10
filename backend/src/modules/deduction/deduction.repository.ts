import type { Deduction } from './deduction.types.js';

const deductions: Deduction[] = [];

export const deductionRepository = {
  async create(deduction: Deduction) {
    deductions.push(deduction);
    return deduction;
  },
  async findAll() {
    return deductions;
  }
};

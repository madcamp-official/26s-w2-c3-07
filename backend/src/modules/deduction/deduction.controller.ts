import type { Request, Response } from 'express';
import { deductionService } from './deduction.service.js';

export const deductionController = {
  async create(req: Request, res: Response) {
    res.status(201).json({ success: true, data: await deductionService.submitDeduction(req.body) });
  },
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await deductionService.listDeductions() });
  }
};

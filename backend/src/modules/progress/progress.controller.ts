import type { Request, Response } from 'express';
import { progressService } from './progress.service.js';

export const progressController = {
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await progressService.listProgress() });
  }
};

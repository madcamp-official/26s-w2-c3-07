import type { Request, Response } from 'express';
import { clueService } from './clue.service.js';

export const clueController = {
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await clueService.listClues() });
  }
};

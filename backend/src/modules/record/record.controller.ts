import type { Request, Response } from 'express';
import { recordService } from './record.service.js';

export const recordController = {
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await recordService.listRecords() });
  }
};

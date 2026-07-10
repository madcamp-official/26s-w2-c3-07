import type { Request, Response } from 'express';
import { suspectService } from './suspect.service.js';

export const suspectController = {
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await suspectService.listSuspects() });
  }
};

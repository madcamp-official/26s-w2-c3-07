import type { Request, Response } from 'express';
import { regionService } from './region.service.js';

export const regionController = {
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await regionService.listRegions() });
  }
};

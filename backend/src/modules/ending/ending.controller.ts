import type { Request, Response } from 'express';
import { endingService } from './ending.service.js';

export const endingController = {
  async create(req: Request, res: Response) {
    res.status(201).json({ success: true, data: await endingService.createEnding(req.body.sessionId, req.body.score) });
  },
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await endingService.listEndings() });
  }
};

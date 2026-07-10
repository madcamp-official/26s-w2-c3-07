import type { Request, Response } from 'express';
import { interrogationService } from './interrogation.service.js';

export const interrogationController = {
  async create(req: Request, res: Response) {
    const data = await interrogationService.askQuestion(req.body.sessionId, req.body.suspectId, req.body.question);
    res.status(201).json({ success: true, data });
  },
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await interrogationService.listInterrogations() });
  }
};

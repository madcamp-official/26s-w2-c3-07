import type { Request, Response } from 'express';
import { sessionService } from './session.service.js';

export const sessionController = {
  async create(req: Request, res: Response) {
    const session = await sessionService.createSession(req.body.userId, req.body.episodeId);
    res.status(201).json({ success: true, data: session });
  },
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await sessionService.listSessions() });
  }
};

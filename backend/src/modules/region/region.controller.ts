import type { NextFunction, Request, Response } from 'express';
import { regionService } from './region.service.js';

export const regionController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await regionService.listRegions() }); } catch (error) { next(error); }
  },
  async detail(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await regionService.getRegion(req.params.regionId) }); } catch (error) { next(error); }
  }
};

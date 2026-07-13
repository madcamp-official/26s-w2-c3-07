import type { NextFunction, Request, Response } from 'express';
import { authService } from './auth.service.js';

const execute = (handler: (req: Request) => unknown) => async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await handler(req) }); } catch (error) { next(error); }
};

export const authController = {
  signIn: execute((req) => authService.signIn(req.body)),
  signUp: execute((req) => authService.signUp(req.body)),
  me: execute((req) => authService.me(req.user)),
  updateMe: execute((req) => authService.updateMe(req.user, req.body)),
  settings: execute((req) => authService.settings(req.user)),
  updateSettings: execute((req) => authService.updateSettings(req.user, req.body))
};

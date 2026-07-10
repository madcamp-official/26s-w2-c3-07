import type { Request, Response } from 'express';
import { authService } from './auth.service.js';

export const authController = {
  async signIn(req: Request, res: Response) {
    const user = await authService.signIn(req.body.email);
    res.json({ success: true, data: user });
  }
};

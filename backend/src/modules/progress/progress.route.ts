import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { progressController } from './progress.controller.js';

export const progressRoute = Router();
progressRoute.use(requireAuth);
progressRoute.get('/', progressController.summary);
progressRoute.get('/episodes', progressController.episodes);
progressRoute.get('/history', progressController.history);
progressRoute.get('/dialects', progressController.dialects);

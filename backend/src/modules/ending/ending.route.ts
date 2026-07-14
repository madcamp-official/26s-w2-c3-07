import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { endingController } from './ending.controller.js';

export const endingRoute = Router({ mergeParams: true });
endingRoute.use(requireAuth);
endingRoute.get('/ending', endingController.ending);
endingRoute.post('/ending/report', endingController.report);

import { Router } from 'express';
import { regionController } from './region.controller.js';
import { episodeController } from '../episode/episode.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';

export const regionRoute = Router();

regionRoute.get('/', regionController.list);
regionRoute.get('/:regionId/episodes', optionalAuth, episodeController.listByRegion);
regionRoute.get('/:regionId', regionController.detail);

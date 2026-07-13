import { Router } from 'express';
import { episodeController } from './episode.controller.js';

export const episodeRoute = Router();

episodeRoute.get('/:episodeId', episodeController.detail);
episodeRoute.get('/:episodeId/difficulties', episodeController.difficulties);
episodeRoute.get('/:episodeId/scene', episodeController.scene);

import { Router } from 'express';
import { episodeController } from './episode.controller.js';
import { suspectController } from '../suspect/suspect.controller.js';

export const episodeRoute = Router();

episodeRoute.get('/:episodeId', episodeController.detail);
episodeRoute.get('/:episodeId/difficulties', episodeController.difficulties);
episodeRoute.get('/:episodeId/scene', episodeController.scene);
episodeRoute.get('/:episodeId/suspects', suspectController.list);
episodeRoute.get('/:episodeId/suspects/:suspectId', suspectController.detail);

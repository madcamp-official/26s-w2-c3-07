import { Router } from 'express';
import { episodeController } from './episode.controller.js';
import { suspectController } from '../suspect/suspect.controller.js';

export const episodeRoute = Router();

episodeRoute.get('/:episodeKey', episodeController.detail);
episodeRoute.get('/:episodeKey/difficulties', episodeController.difficulties);
episodeRoute.get('/:episodeKey/scene', episodeController.scene);
episodeRoute.get('/:episodeKey/suspects', suspectController.list);
episodeRoute.get('/:episodeKey/suspects/:suspectId', suspectController.detail);

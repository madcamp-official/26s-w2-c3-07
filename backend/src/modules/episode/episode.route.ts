import { Router } from 'express';
import { episodeController } from './episode.controller.js';

export const episodeRoute = Router();

episodeRoute.get('/', episodeController.list);

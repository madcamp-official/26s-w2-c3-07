import { Router } from 'express';
import { progressController } from './progress.controller.js';

export const progressRoute = Router();

progressRoute.get('/', progressController.list);

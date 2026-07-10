import { Router } from 'express';
import { clueController } from './clue.controller.js';

export const clueRoute = Router();

clueRoute.get('/', clueController.list);

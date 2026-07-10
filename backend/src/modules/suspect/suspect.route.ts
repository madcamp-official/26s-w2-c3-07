import { Router } from 'express';
import { suspectController } from './suspect.controller.js';

export const suspectRoute = Router();

suspectRoute.get('/', suspectController.list);

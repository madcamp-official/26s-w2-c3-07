import { Router } from 'express';
import { regionController } from './region.controller.js';

export const regionRoute = Router();

regionRoute.get('/', regionController.list);
regionRoute.get('/:regionId', regionController.detail);

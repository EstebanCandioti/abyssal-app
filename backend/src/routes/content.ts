import { Router } from 'express';
import { getDailyThematicContent } from '../services/content.js';

export const contentRouter = Router();

contentRouter.get('/today', (_request, response) => {
  response.json(getDailyThematicContent());
});

import { Router } from 'express';
import { z } from 'zod';
import { getSettings, updateSettings } from '../services/settings.js';
import { logger } from '../logger.js';

export const settingsRouter = Router();

const updateSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional()
});

settingsRouter.get('/', (_request, response) => {
  response.json(getSettings());
});

settingsRouter.put('/', (request, response) => {
  const parsed = updateSettingsSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Body invalido.' });
    return;
  }

  const updated = updateSettings(parsed.data);
  logger.info('Ajustes actualizados.', {
    emailEnabled: updated.emailEnabled,
    pushNotificationsEnabled: updated.pushNotificationsEnabled
  });
  response.json(updated);
});

import { Router } from 'express';
import { format } from 'date-fns';
import { getOne, query } from '../db/database.js';
import { getNowInTimezone } from '../dateUtils.js';
import { mapReminder } from '../reminderMapper.js';
import { createReminderSchema, updateReminderSchema } from '../reminderValidation.js';
import { reminderMatchesDate } from '../services/scheduler.js';
import { logger } from '../logger.js';
import type { Reminder, ReminderRow } from '../types.js';

export const remindersRouter = Router();

async function getReminderById(id: number): Promise<Reminder | null> {
  const row = await getOne<ReminderRow>('SELECT * FROM reminders WHERE id = $1', [id]);
  return row ? mapReminder(row) : null;
}

async function getAllReminders() {
  const result = await query<ReminderRow>('SELECT * FROM reminders ORDER BY time ASC, id ASC');
  return result.rows.map(mapReminder);
}

function getLocalDateKey() {
  return format(getNowInTimezone(), 'yyyy-MM-dd');
}

async function isCompletedOnDate(reminderId: number, completedOn: string) {
  const result = await getOne<{ count: string }>(`
    SELECT COUNT(*) AS count
    FROM reminder_completions
    WHERE reminder_id = $1 AND completed_on = $2
  `, [reminderId, completedOn]);

  return Number(result?.count ?? 0) > 0;
}

async function withCompletionState(reminder: Reminder, completedOn = getLocalDateKey()): Promise<Reminder> {
  return {
    ...reminder,
    completedToday: await isCompletedOnDate(reminder.id, completedOn)
  };
}

remindersRouter.get('/', async (_request, response) => {
  response.json(await getAllReminders());
});

remindersRouter.get('/today', async (_request, response) => {
  const now = getNowInTimezone();
  const completedOn = format(now, 'yyyy-MM-dd');
  const todayReminders = (await getAllReminders())
    .filter((reminder) => reminder.active && reminderMatchesDate(reminder, now))
    .sort((a, b) => a.time.localeCompare(b.time));
  const reminders = await Promise.all(todayReminders.map((reminder) => withCompletionState(reminder, completedOn)));

  response.json(reminders);
});

remindersRouter.get('/:id', async (request, response) => {
  const reminder = await getReminderById(Number(request.params.id));

  if (!reminder) {
    response.status(404).json({ error: 'Recordatorio no encontrado.' });
    return;
  }

  response.json(reminder);
});

remindersRouter.post('/', async (request, response) => {
  const parsed = createReminderSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Body invalido.' });
    return;
  }

  const data = parsed.data;
  const result = await query<{ id: number }>(`
    INSERT INTO reminders (title, description, time, frequency_type, frequency_days, frequency_interval, frequency_start_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [
    data.title,
    data.description ?? null,
    data.time,
    data.frequencyType,
    data.frequencyType === 'weekly' || data.frequencyType === 'weekly_interval' ? JSON.stringify(data.frequencyDays) : null,
    data.frequencyType === 'interval' || data.frequencyType === 'weekly_interval' ? data.frequencyInterval : null,
    data.frequencyType === 'interval' || data.frequencyType === 'weekly_interval' ? data.frequencyStartDate : null
  ]);

  const created = await getReminderById(result.rows[0].id);
  logger.info('Recordatorio creado.', {
    id: created?.id,
    time: created?.time,
    frequencyType: created?.frequencyType,
    active: created?.active
  });
  response.status(201).json(created);
});

remindersRouter.put('/:id', async (request, response) => {
  const id = Number(request.params.id);
  const current = await getReminderById(id);
  if (!current) {
    response.status(404).json({ error: 'Recordatorio no encontrado.' });
    return;
  }

  const parsed = updateReminderSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Body invalido.' });
    return;
  }

  const next = { ...current, ...parsed.data };
  if (next.frequencyType === 'weekly' && (!next.frequencyDays || next.frequencyDays.length === 0)) {
    response.status(400).json({ error: 'frequencyDays es requerido para frecuencia weekly.' });
    return;
  }
  if (next.frequencyType === 'interval' && (!next.frequencyInterval || !next.frequencyStartDate)) {
    response.status(400).json({ error: 'frequencyInterval y frequencyStartDate son requeridos para frecuencia interval.' });
    return;
  }
  if (next.frequencyType === 'weekly_interval') {
    if (!next.frequencyDays || next.frequencyDays.length !== 1) {
      response.status(400).json({ error: 'frequencyDays debe tener un dia para frecuencia weekly_interval.' });
      return;
    }
    if (!next.frequencyInterval || !next.frequencyStartDate) {
      response.status(400).json({ error: 'frequencyInterval y frequencyStartDate son requeridos para frecuencia weekly_interval.' });
      return;
    }
  }

  await query(`
    UPDATE reminders
    SET title = $1, description = $2, time = $3, frequency_type = $4, frequency_days = $5,
        frequency_interval = $6, frequency_start_date = $7, updated_at = now()
    WHERE id = $8
  `, [
    next.title,
    next.description ?? null,
    next.time,
    next.frequencyType,
    next.frequencyType === 'weekly' || next.frequencyType === 'weekly_interval' ? JSON.stringify(next.frequencyDays) : null,
    next.frequencyType === 'interval' || next.frequencyType === 'weekly_interval' ? next.frequencyInterval : null,
    next.frequencyType === 'interval' || next.frequencyType === 'weekly_interval' ? next.frequencyStartDate : null,
    id
  ]);

  const updated = await getReminderById(id);
  logger.info('Recordatorio actualizado.', {
    id: updated?.id,
    time: updated?.time,
    frequencyType: updated?.frequencyType,
    active: updated?.active
  });
  response.json(updated);
});

remindersRouter.delete('/:id', async (request, response) => {
  const id = Number(request.params.id);
  const result = await query('DELETE FROM reminders WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    response.status(404).json({ error: 'Recordatorio no encontrado.' });
    return;
  }

  logger.info('Recordatorio eliminado.', { id });
  response.status(204).send();
});

remindersRouter.patch('/:id/toggle', async (request, response) => {
  const id = Number(request.params.id);
  const current = await getReminderById(id);

  if (!current) {
    response.status(404).json({ error: 'Recordatorio no encontrado.' });
    return;
  }

  await query(`
    UPDATE reminders
    SET active = $1, updated_at = now()
    WHERE id = $2
  `, [!current.active, id]);

  const updated = await getReminderById(id);
  logger.info('Recordatorio pausado/reactivado.', {
    id,
    active: updated?.active
  });
  response.json(updated);
});

remindersRouter.patch('/:id/complete', async (request, response) => {
  const id = Number(request.params.id);
  const current = await getReminderById(id);

  if (!current) {
    response.status(404).json({ error: 'Recordatorio no encontrado.' });
    return;
  }

  const completedOn = getLocalDateKey();

  if (await isCompletedOnDate(id, completedOn)) {
    await query(`
      DELETE FROM reminder_completions
      WHERE reminder_id = $1 AND completed_on = $2
    `, [id, completedOn]);
  } else {
    await query(`
      INSERT INTO reminder_completions (reminder_id, completed_on)
      VALUES ($1, $2)
    `, [id, completedOn]);
  }

  const updated = await withCompletionState(current, completedOn);
  logger.info('Recordatorio marcado/desmarcado como hecho.', {
    id,
    completedOn,
    completedToday: updated.completedToday
  });
  response.json(updated);
});

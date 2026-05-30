import { Router } from 'express';
import { format } from 'date-fns';
import { db } from '../db/database.js';
import { getNowInTimezone } from '../dateUtils.js';
import { mapReminder } from '../reminderMapper.js';
import { createReminderSchema, updateReminderSchema } from '../reminderValidation.js';
import { reminderMatchesDate } from '../services/scheduler.js';
import { logger } from '../logger.js';
import type { Reminder, ReminderRow } from '../types.js';

export const remindersRouter = Router();

function getReminderById(id: number): Reminder | null {
  const row = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as ReminderRow | undefined;
  return row ? mapReminder(row) : null;
}

function getAllReminders() {
  const rows = db.prepare('SELECT * FROM reminders ORDER BY time ASC, id ASC').all() as ReminderRow[];
  return rows.map(mapReminder);
}

function getLocalDateKey() {
  return format(getNowInTimezone(), 'yyyy-MM-dd');
}

function isCompletedOnDate(reminderId: number, completedOn: string) {
  const result = db.prepare(`
    SELECT COUNT(*) AS count
    FROM reminder_completions
    WHERE reminder_id = ? AND completed_on = ?
  `).get(reminderId, completedOn) as { count: number };

  return result.count > 0;
}

function withCompletionState(reminder: Reminder, completedOn = getLocalDateKey()): Reminder {
  return {
    ...reminder,
    completedToday: isCompletedOnDate(reminder.id, completedOn)
  };
}

remindersRouter.get('/', (_request, response) => {
  response.json(getAllReminders());
});

remindersRouter.get('/today', (_request, response) => {
  const now = getNowInTimezone();
  const completedOn = format(now, 'yyyy-MM-dd');
  const reminders = getAllReminders()
    .filter((reminder) => reminder.active && reminderMatchesDate(reminder, now))
    .map((reminder) => withCompletionState(reminder, completedOn))
    .sort((a, b) => a.time.localeCompare(b.time));

  response.json(reminders);
});

remindersRouter.get('/:id', (request, response) => {
  const reminder = getReminderById(Number(request.params.id));

  if (!reminder) {
    response.status(404).json({ error: 'Recordatorio no encontrado.' });
    return;
  }

  response.json(reminder);
});

remindersRouter.post('/', (request, response) => {
  const parsed = createReminderSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Body invalido.' });
    return;
  }

  const data = parsed.data;
  const result = db.prepare(`
    INSERT INTO reminders (title, description, time, frequency_type, frequency_days, frequency_interval, frequency_start_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title,
    data.description ?? null,
    data.time,
    data.frequencyType,
    data.frequencyType === 'weekly' || data.frequencyType === 'weekly_interval' ? JSON.stringify(data.frequencyDays) : null,
    data.frequencyType === 'interval' || data.frequencyType === 'weekly_interval' ? data.frequencyInterval : null,
    data.frequencyType === 'interval' || data.frequencyType === 'weekly_interval' ? data.frequencyStartDate : null
  );

  const created = getReminderById(Number(result.lastInsertRowid));
  logger.info('Recordatorio creado.', {
    id: created?.id,
    time: created?.time,
    frequencyType: created?.frequencyType,
    active: created?.active
  });
  response.status(201).json(created);
});

remindersRouter.put('/:id', (request, response) => {
  const id = Number(request.params.id);
  const current = getReminderById(id);
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

  db.prepare(`
    UPDATE reminders
    SET title = ?, description = ?, time = ?, frequency_type = ?, frequency_days = ?,
        frequency_interval = ?, frequency_start_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    next.title,
    next.description ?? null,
    next.time,
    next.frequencyType,
    next.frequencyType === 'weekly' || next.frequencyType === 'weekly_interval' ? JSON.stringify(next.frequencyDays) : null,
    next.frequencyType === 'interval' || next.frequencyType === 'weekly_interval' ? next.frequencyInterval : null,
    next.frequencyType === 'interval' || next.frequencyType === 'weekly_interval' ? next.frequencyStartDate : null,
    id
  );

  const updated = getReminderById(id);
  logger.info('Recordatorio actualizado.', {
    id: updated?.id,
    time: updated?.time,
    frequencyType: updated?.frequencyType,
    active: updated?.active
  });
  response.json(updated);
});

remindersRouter.delete('/:id', (request, response) => {
  const id = Number(request.params.id);
  const result = db.prepare('DELETE FROM reminders WHERE id = ?').run(id);

  if (result.changes === 0) {
    response.status(404).json({ error: 'Recordatorio no encontrado.' });
    return;
  }

  logger.info('Recordatorio eliminado.', { id });
  response.status(204).send();
});

remindersRouter.patch('/:id/toggle', (request, response) => {
  const id = Number(request.params.id);
  const current = getReminderById(id);

  if (!current) {
    response.status(404).json({ error: 'Recordatorio no encontrado.' });
    return;
  }

  db.prepare(`
    UPDATE reminders
    SET active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(current.active ? 0 : 1, id);

  const updated = getReminderById(id);
  logger.info('Recordatorio pausado/reactivado.', {
    id,
    active: updated?.active
  });
  response.json(updated);
});

remindersRouter.patch('/:id/complete', (request, response) => {
  const id = Number(request.params.id);
  const current = getReminderById(id);

  if (!current) {
    response.status(404).json({ error: 'Recordatorio no encontrado.' });
    return;
  }

  const completedOn = getLocalDateKey();

  if (isCompletedOnDate(id, completedOn)) {
    db.prepare(`
      DELETE FROM reminder_completions
      WHERE reminder_id = ? AND completed_on = ?
    `).run(id, completedOn);
  } else {
    db.prepare(`
      INSERT INTO reminder_completions (reminder_id, completed_on)
      VALUES (?, ?)
    `).run(id, completedOn);
  }

  const updated = withCompletionState(current, completedOn);
  logger.info('Recordatorio marcado/desmarcado como hecho.', {
    id,
    completedOn,
    completedToday: updated.completedToday
  });
  response.json(updated);
});

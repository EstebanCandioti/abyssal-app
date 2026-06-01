import cron from 'node-cron';
import { differenceInCalendarWeeks, differenceInDays, format, parseISO } from 'date-fns';
import { getOne, query } from '../db/database.js';
import { getNowInTimezone } from '../dateUtils.js';
import { mapReminder } from '../reminderMapper.js';
import type { Reminder, ReminderRow, WeekDay } from '../types.js';
import { sendReminderEmail } from './email.js';
import { getSettings } from './settings.js';
import { logger } from '../logger.js';

const dayMap: Record<number, WeekDay> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat'
};

let lastEmailEnabledState: boolean | null = null;

export function reminderMatchesDate(reminder: Reminder, date: Date) {
  if (reminder.frequencyType === 'weekly') {
    const today = dayMap[date.getDay()];
    return Boolean(reminder.frequencyDays?.includes(today));
  }

  if (reminder.frequencyType === 'weekly_interval') {
    if (!reminder.frequencyStartDate || !reminder.frequencyInterval || !reminder.frequencyDays?.length) {
      return false;
    }

    const today = dayMap[date.getDay()];
    const weeksFromStart = differenceInCalendarWeeks(date, parseISO(reminder.frequencyStartDate), { weekStartsOn: 1 });
    return reminder.frequencyDays[0] === today && weeksFromStart >= 0 && weeksFromStart % reminder.frequencyInterval === 0;
  }

  if (!reminder.frequencyStartDate || !reminder.frequencyInterval) {
    return false;
  }

  const daysFromStart = differenceInDays(date, parseISO(reminder.frequencyStartDate));
  return daysFromStart >= 0 && daysFromStart % reminder.frequencyInterval === 0;
}

async function alreadySentToday(reminderId: number) {
  const result = await getOne<{ count: string }>(`
    SELECT COUNT(*) AS count
    FROM email_log
    WHERE reminder_id = $1 AND status = 'sent' AND sent_at::date = now()::date
  `, [reminderId]);

  return Number(result?.count ?? 0) > 0;
}

async function insertEmailLog(
  reminderId: number,
  status: 'sent' | 'error',
  emailTo: string,
  providerId?: string,
  errorMessage?: string
) {
  await query(`
    INSERT INTO email_log (reminder_id, status, email_to, provider_id, error_message)
    VALUES ($1, $2, $3, $4, $5)
  `, [reminderId, status, emailTo, providerId ?? null, errorMessage ?? null]);
}

export async function runSchedulerTick() {
  const now = getNowInTimezone();
  const currentTime = format(now, 'HH:mm');
  const settings = await getSettings();

  if (lastEmailEnabledState !== settings.emailEnabled) {
    lastEmailEnabledState = settings.emailEnabled;
    logger.info('Estado de envios por email actualizado para scheduler.', {
      emailEnabled: settings.emailEnabled
    });
  }

  if (!settings.emailEnabled) {
    return;
  }

  const result = await query<ReminderRow>('SELECT * FROM reminders WHERE active = TRUE');

  for (const row of result.rows) {
    const reminder = mapReminder(row);

    if (reminder.time !== currentTime || await alreadySentToday(reminder.id) || !reminderMatchesDate(reminder, now)) {
      continue;
    }

    try {
      const emailTo = process.env.USER_EMAIL ?? '';
      logger.info('Scheduler enviando recordatorio.', {
        reminderId: reminder.id,
        time: reminder.time,
        frequencyType: reminder.frequencyType
      });
      const sentEmail = await sendReminderEmail(reminder, emailTo);
      await insertEmailLog(reminder.id, 'sent', emailTo, sentEmail?.id);
      logger.info('Email de recordatorio enviado.', {
        reminderId: reminder.id,
        providerId: sentEmail?.id
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      await insertEmailLog(reminder.id, 'error', process.env.USER_EMAIL ?? '', undefined, message);
      logger.error(`Error enviando recordatorio ${reminder.id}.`, error);
    }
  }
}

export function startScheduler() {
  logger.info('Scheduler iniciado.', {
    timezone: process.env.TIMEZONE ?? 'UTC',
    cron: '* * * * *'
  });

  cron.schedule('* * * * *', () => {
    void runSchedulerTick().catch((error) => logger.error('El scheduler fallo durante el tick.', error));
  }, {
    timezone: process.env.TIMEZONE ?? 'UTC'
  });
}

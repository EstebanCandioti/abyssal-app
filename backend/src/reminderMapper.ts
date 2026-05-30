import type { Reminder, ReminderRow, WeekDay } from './types.js';

export function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    time: row.time,
    frequencyType: row.frequency_type,
    frequencyDays: row.frequency_days ? JSON.parse(row.frequency_days) as WeekDay[] : undefined,
    frequencyInterval: row.frequency_interval ?? undefined,
    frequencyStartDate: row.frequency_start_date ?? undefined,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

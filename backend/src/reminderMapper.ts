import type { Reminder, ReminderRow, WeekDay } from './types.js';

function mapFrequencyDays(value: ReminderRow['frequency_days']): WeekDay[] | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  return JSON.parse(value) as WeekDay[];
}

function mapTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

export function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    time: row.time,
    frequencyType: row.frequency_type,
    frequencyDays: mapFrequencyDays(row.frequency_days),
    frequencyInterval: row.frequency_interval ?? undefined,
    frequencyStartDate: row.frequency_start_date ?? undefined,
    active: row.active === true || row.active === 1,
    createdAt: mapTimestamp(row.created_at),
    updatedAt: mapTimestamp(row.updated_at)
  };
}

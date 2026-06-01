export type FrequencyType = 'weekly' | 'interval' | 'weekly_interval';
export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Reminder {
  id: number;
  title: string;
  description?: string;
  time: string;
  frequencyType: FrequencyType;
  frequencyDays?: WeekDay[];
  frequencyInterval?: number;
  frequencyStartDate?: string;
  active: boolean;
  completedToday?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderRow {
  id: number;
  title: string;
  description: string | null;
  time: string;
  frequency_type: FrequencyType;
  frequency_days: string | WeekDay[] | null;
  frequency_interval: number | null;
  frequency_start_date: string | null;
  active: number | boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Quote {
  category: 'ocean' | 'detective' | 'mystic';
  text: string;
}

export interface Settings {
  emailDestination: string;
  emailEnabled: boolean;
  pushNotificationsEnabled: boolean;
  updatedAt: string;
}

export interface SettingsRow {
  email_destination: string;
  email_enabled: number | boolean;
  push_notifications_enabled: number | boolean;
  updated_at: string | Date;
}

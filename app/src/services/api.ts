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

export interface CreateReminderInput {
  title: string;
  description?: string;
  time: string;
  frequencyType: FrequencyType;
  frequencyDays?: WeekDay[];
  frequencyInterval?: number;
  frequencyStartDate?: string;
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

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Error inesperado.' })) as { error?: string };
    throw new Error(body.error ?? 'Error inesperado.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getReminders() {
    return request<Reminder[]>('/reminders');
  },
  getTodayReminders() {
    return request<Reminder[]>('/reminders/today');
  },
  getReminder(id: number) {
    return request<Reminder>(`/reminders/${id}`);
  },
  createReminder(input: CreateReminderInput) {
    return request<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },
  updateReminder(id: number, input: Partial<CreateReminderInput>) {
    return request<Reminder>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input)
    });
  },
  deleteReminder(id: number) {
    return request<void>(`/reminders/${id}`, { method: 'DELETE' });
  },
  toggleReminder(id: number) {
    return request<Reminder>(`/reminders/${id}/toggle`, { method: 'PATCH' });
  },
  toggleReminderComplete(id: number) {
    return request<Reminder>(`/reminders/${id}/complete`, { method: 'PATCH' });
  },
  getDailyQuote() {
    return request<Quote>('/content/today');
  },
  getSettings() {
    return request<Settings>('/settings');
  },
  updateSettings(input: Partial<Omit<Settings, 'updatedAt' | 'emailDestination'>>) {
    return request<Settings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(input)
    });
  }
};

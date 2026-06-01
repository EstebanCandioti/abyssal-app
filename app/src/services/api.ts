import AsyncStorage from '@react-native-async-storage/async-storage';

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

type CompletionStore = Record<string, number[]>;

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';
const remindersKey = 'abyssal:reminders:v1';
const settingsKey = 'abyssal:settings:v1';
const completionsKey = 'abyssal:completions:v1';

const defaultSettings: Settings = {
  emailDestination: '',
  emailEnabled: true,
  pushNotificationsEnabled: false,
  updatedAt: new Date().toISOString()
};

const dayMap: WeekDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

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

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function readLocalReminders() {
  return readJson<Reminder[]>(remindersKey, []);
}

async function writeLocalReminders(reminders: Reminder[]) {
  await writeJson(remindersKey, reminders.sort((a, b) => a.time.localeCompare(b.time) || a.id - b.id));
}

async function readLocalSettings() {
  return readJson<Settings>(settingsKey, defaultSettings);
}

async function writeLocalSettings(settings: Settings) {
  await writeJson(settingsKey, settings);
}

async function readCompletions() {
  return readJson<CompletionStore>(completionsKey, {});
}

async function writeCompletions(completions: CompletionStore) {
  await writeJson(completionsKey, completions);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function appDay(date: Date) {
  return dayMap[date.getDay()] ?? 'mon';
}

function parseDate(dateKey: string) {
  const [year = '1970', month = '1', day = '1'] = dateKey.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function daysBetween(start: Date, end: Date) {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.floor((endDay - startDay) / 86400000);
}

function weeksBetween(start: Date, end: Date) {
  return Math.floor(daysBetween(start, end) / 7);
}

function reminderMatchesDate(reminder: Reminder, date: Date) {
  if (reminder.frequencyType === 'weekly') {
    return Boolean(reminder.frequencyDays?.includes(appDay(date)));
  }

  if (!reminder.frequencyStartDate || !reminder.frequencyInterval) {
    return false;
  }

  if (reminder.frequencyType === 'weekly_interval') {
    const selectedDay = reminder.frequencyDays?.[0];
    const diff = weeksBetween(parseDate(reminder.frequencyStartDate), date);
    return selectedDay === appDay(date) && diff >= 0 && diff % reminder.frequencyInterval === 0;
  }

  const diff = daysBetween(parseDate(reminder.frequencyStartDate), date);
  return diff >= 0 && diff % reminder.frequencyInterval === 0;
}

function withCompletionState(reminders: Reminder[], completions: CompletionStore, dateKey = todayKey()) {
  const completedIds = new Set(completions[dateKey] ?? []);
  return reminders.map((reminder) => ({
    ...reminder,
    completedToday: completedIds.has(reminder.id)
  }));
}

function createLocalReminder(input: CreateReminderInput): Reminder {
  const now = new Date().toISOString();
  return {
    id: -Date.now(),
    title: input.title,
    description: input.description,
    time: input.time,
    frequencyType: input.frequencyType,
    frequencyDays: input.frequencyDays,
    frequencyInterval: input.frequencyInterval,
    frequencyStartDate: input.frequencyStartDate,
    active: true,
    createdAt: now,
    updatedAt: now
  };
}

function toCreateInput(reminder: Reminder): CreateReminderInput {
  return {
    title: reminder.title,
    description: reminder.description,
    time: reminder.time,
    frequencyType: reminder.frequencyType,
    frequencyDays: reminder.frequencyDays,
    frequencyInterval: reminder.frequencyInterval,
    frequencyStartDate: reminder.frequencyStartDate
  };
}

async function syncReminderToBackend(reminder: Reminder): Promise<Reminder> {
  if (reminder.id > 0) {
    try {
      return await request<Reminder>(`/reminders/${reminder.id}`, {
        method: 'PUT',
        body: JSON.stringify(toCreateInput(reminder))
      });
    } catch {
      // Si el backend perdio la DB o no existe ese id, lo recreamos.
    }
  }

  return request<Reminder>('/reminders', {
    method: 'POST',
    body: JSON.stringify(toCreateInput(reminder))
  });
}

async function syncLocalRemindersToBackend(reminders: Reminder[]) {
  const synced: Reminder[] = [];

  for (const reminder of reminders) {
    try {
      const remote = await syncReminderToBackend(reminder);
      if (remote.active !== reminder.active) {
        const toggled = await request<Reminder>(`/reminders/${remote.id}/toggle`, { method: 'PATCH' });
        synced.push(toggled);
      } else {
        synced.push({ ...remote, completedToday: reminder.completedToday });
      }
    } catch {
      synced.push(reminder);
    }
  }

  await writeLocalReminders(synced);
  return synced;
}

async function hydrateFromBackendIfEmpty(local: Reminder[]) {
  if (local.length > 0) {
    void syncLocalRemindersToBackend(local);
    return local;
  }

  try {
    const remote = await request<Reminder[]>('/reminders');
    await writeLocalReminders(remote);
    return remote;
  } catch {
    return local;
  }
}

export const api = {
  async getReminders() {
    const local = await readLocalReminders();
    return hydrateFromBackendIfEmpty(local);
  },
  async getTodayReminders() {
    const local = await hydrateFromBackendIfEmpty(await readLocalReminders());
    const completions = await readCompletions();
    return withCompletionState(
      local.filter((reminder) => reminder.active && reminderMatchesDate(reminder, new Date())),
      completions
    ).sort((a, b) => a.time.localeCompare(b.time));
  },
  async getReminder(id: number) {
    const local = await readLocalReminders();
    const reminder = local.find((item) => item.id === id);
    if (reminder) {
      return reminder;
    }

    const remote = await request<Reminder>(`/reminders/${id}`);
    await writeLocalReminders([...local.filter((item) => item.id !== remote.id), remote]);
    return remote;
  },
  async createReminder(input: CreateReminderInput) {
    const localReminder = createLocalReminder(input);
    const current = await readLocalReminders();
    await writeLocalReminders([...current, localReminder]);

    try {
      const remote = await syncReminderToBackend(localReminder);
      await writeLocalReminders((await readLocalReminders()).map((item) => (
        item.id === localReminder.id ? remote : item
      )));
      return remote;
    } catch {
      return localReminder;
    }
  },
  async updateReminder(id: number, input: Partial<CreateReminderInput>) {
    const current = await readLocalReminders();
    const existing = current.find((item) => item.id === id);

    if (!existing) {
      throw new Error('Recordatorio no encontrado.');
    }

    const updated: Reminder = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString()
    };
    await writeLocalReminders(current.map((item) => (item.id === id ? updated : item)));

    try {
      const remote = await syncReminderToBackend(updated);
      await writeLocalReminders((await readLocalReminders()).map((item) => (
        item.id === id ? { ...remote, completedToday: item.completedToday } : item
      )));
      return remote;
    } catch {
      return updated;
    }
  },
  async deleteReminder(id: number) {
    const current = await readLocalReminders();
    await writeLocalReminders(current.filter((item) => item.id !== id));

    if (id > 0) {
      await request<void>(`/reminders/${id}`, { method: 'DELETE' }).catch(() => undefined);
    }
  },
  async toggleReminder(id: number) {
    const current = await readLocalReminders();
    const existing = current.find((item) => item.id === id);
    if (!existing) {
      throw new Error('Recordatorio no encontrado.');
    }

    const updated = { ...existing, active: !existing.active, updatedAt: new Date().toISOString() };
    await writeLocalReminders(current.map((item) => (item.id === id ? updated : item)));

    if (id > 0) {
      request<Reminder>(`/reminders/${id}/toggle`, { method: 'PATCH' }).catch(() => undefined);
    } else {
      void syncLocalRemindersToBackend(await readLocalReminders());
    }

    return updated;
  },
  async toggleReminderComplete(id: number) {
    const completions = await readCompletions();
    const key = todayKey();
    const today = new Set(completions[key] ?? []);

    if (today.has(id)) {
      today.delete(id);
    } else {
      today.add(id);
    }

    await writeCompletions({ ...completions, [key]: Array.from(today) });
    const reminder = (await readLocalReminders()).find((item) => item.id === id);

    if (!reminder) {
      throw new Error('Recordatorio no encontrado.');
    }

    if (id > 0) {
      request<Reminder>(`/reminders/${id}/complete`, { method: 'PATCH' }).catch(() => undefined);
    }

    return { ...reminder, completedToday: today.has(id) };
  },
  async getDailyQuote() {
    return request<Quote>('/content/today').catch(() => ({
      category: 'ocean' as const,
      text: 'La superficie puede estar lejos, pero Abyssal conserva la ruta.'
    }));
  },
  async getSettings() {
    const local = await readLocalSettings();

    try {
      const remote = await request<Settings>('/settings');
      const next = local.updatedAt > remote.updatedAt ? local : remote;
      await writeLocalSettings(next);
      return next;
    } catch {
      return local;
    }
  },
  async updateSettings(input: Partial<Omit<Settings, 'updatedAt' | 'emailDestination'>>) {
    const current = await readLocalSettings();
    const updated = { ...current, ...input, updatedAt: new Date().toISOString() };
    await writeLocalSettings(updated);

    request<Settings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(input)
    }).catch(() => undefined);

    return updated;
  }
};

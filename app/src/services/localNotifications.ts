import { Platform } from 'react-native';
import type { Reminder, WeekDay } from './api';

const CHANNEL_ID = 'abyssal-reminders';
const NOTIFICATION_PREFIX = 'abyssal-reminder';
const INTERVAL_LOOKAHEAD = 32;
const WEEK_INTERVAL_LOOKAHEAD = 20;

type NotificationsModule = typeof import('expo-notifications');

const weekDayToExpo: Record<WeekDay, number> = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7
};

const weekDayToJs: Record<WeekDay, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};

async function loadNotifications() {
  return import('expo-notifications');
}

function parseTime(time: string) {
  const [hour = '0', minute = '0'] = time.split(':');
  return {
    hour: Number(hour),
    minute: Number(minute)
  };
}

function parseLocalDate(dateKey: string) {
  const [year = '1970', month = '1', day = '1'] = dateKey.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateAtTime(date: Date, time: string) {
  const { hour, minute } = parseTime(time);
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function getNextIntervalDate(startDate: Date, intervalDays: number, time: string, now = new Date()) {
  let candidate = dateAtTime(startDate, time);

  while (candidate <= now) {
    candidate = addDays(candidate, intervalDays);
  }

  return candidate;
}

function getNextWeeklyIntervalDate(reminder: Reminder, now = new Date()) {
  const day = reminder.frequencyDays?.[0];
  const intervalWeeks = reminder.frequencyInterval ?? 1;
  const startDate = parseLocalDate(reminder.frequencyStartDate ?? new Date().toISOString().slice(0, 10));
  let candidate = dateAtTime(startDate, reminder.time);

  if (day) {
    const offset = (weekDayToJs[day] - candidate.getDay() + 7) % 7;
    candidate = addDays(candidate, offset);
  }

  while (candidate <= now) {
    candidate = addDays(candidate, intervalWeeks * 7);
  }

  return candidate;
}

async function scheduleReminderNotification(
  Notifications: NotificationsModule,
  reminder: Reminder,
  identifier: string,
  trigger: unknown
) {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: reminder.title,
      body: reminder.description || 'Abyssal detecto un recordatorio.',
      data: { reminderId: reminder.id },
      sound: 'default',
      ...(Platform.OS === 'android' ? { priority: Notifications.AndroidNotificationPriority.MAX } : {})
    },
    trigger: trigger as never
  });
}

async function cancelAbyssalNotifications(Notifications: NotificationsModule) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => notification.identifier.startsWith(NOTIFICATION_PREFIX))
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier))
  );
}

export async function configureLocalNotifications() {
  const Notifications = await loadNotifications();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true
    })
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Recordatorios locales de Abyssal',
      lightColor: '#a8c8f0',
      vibrationPattern: [0, 250, 250, 250]
    });
  }
}

export async function ensureLocalNotificationPermission() {
  const Notifications = await loadNotifications();
  await configureLocalNotifications();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function clearLocalReminderNotifications() {
  const Notifications = await loadNotifications();
  await cancelAbyssalNotifications(Notifications);
}

export async function syncLocalReminderNotifications(reminders: Reminder[], enabled: boolean) {
  if (!enabled) {
    return;
  }

  const Notifications = await loadNotifications();
  await configureLocalNotifications();
  await cancelAbyssalNotifications(Notifications);

  const permissionGranted = await ensureLocalNotificationPermission();
  if (!permissionGranted) {
    return;
  }

  const activeReminders = reminders.filter((reminder) => reminder.active);

  for (const reminder of activeReminders) {
    const { hour, minute } = parseTime(reminder.time);

    if (reminder.frequencyType === 'weekly') {
      for (const day of reminder.frequencyDays ?? []) {
        await scheduleReminderNotification(Notifications, reminder, `${NOTIFICATION_PREFIX}-${reminder.id}-weekly-${day}`, {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: weekDayToExpo[day],
          hour,
          minute,
          channelId: CHANNEL_ID
        });
      }
      continue;
    }

    if (reminder.frequencyType === 'interval') {
      const intervalDays = reminder.frequencyInterval ?? 1;
      let candidate = getNextIntervalDate(parseLocalDate(reminder.frequencyStartDate ?? new Date().toISOString().slice(0, 10)), intervalDays, reminder.time);

      for (let index = 0; index < INTERVAL_LOOKAHEAD; index += 1) {
        await scheduleReminderNotification(Notifications, reminder, `${NOTIFICATION_PREFIX}-${reminder.id}-interval-${index}`, {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: candidate,
          channelId: CHANNEL_ID
        });
        candidate = addDays(candidate, intervalDays);
      }
      continue;
    }

    let candidate = getNextWeeklyIntervalDate(reminder);
    const intervalWeeks = reminder.frequencyInterval ?? 1;

    for (let index = 0; index < WEEK_INTERVAL_LOOKAHEAD; index += 1) {
      await scheduleReminderNotification(Notifications, reminder, `${NOTIFICATION_PREFIX}-${reminder.id}-weekly-interval-${index}`, {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: candidate,
        channelId: CHANNEL_ID
      });
      candidate = addDays(candidate, intervalWeeks * 7);
    }
  }
}

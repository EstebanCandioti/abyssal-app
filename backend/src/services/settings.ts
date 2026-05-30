import { db } from '../db/database.js';
import type { Settings, SettingsRow } from '../types.js';

function mapSettings(row: SettingsRow): Settings {
  return {
    emailDestination: row.email_destination,
    emailEnabled: Boolean(row.email_enabled),
    pushNotificationsEnabled: Boolean(row.push_notifications_enabled),
    updatedAt: row.updated_at
  };
}

export function getSettings() {
  const row = db.prepare(`
    SELECT email_destination, email_enabled, push_notifications_enabled, updated_at
    FROM settings
    WHERE id = 1
  `).get() as SettingsRow | undefined;

  if (!row) {
    throw new Error('No se encontro la configuracion de Abyssal.');
  }

  return mapSettings(row);
}

export function updateSettings(input: Partial<Omit<Settings, 'updatedAt' | 'emailDestination'>>) {
  const current = getSettings();
  const next = { ...current, ...input };

  db.prepare(`
    UPDATE settings
    SET email_destination = ?,
        email_enabled = ?,
        push_notifications_enabled = ?,
        updated_at = datetime('now')
    WHERE id = 1
  `).run(
    next.emailDestination.trim(),
    next.emailEnabled ? 1 : 0,
    next.pushNotificationsEnabled ? 1 : 0
  );

  return getSettings();
}

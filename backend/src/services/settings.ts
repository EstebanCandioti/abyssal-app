import { getOne, query } from '../db/database.js';
import type { Settings, SettingsRow } from '../types.js';

function mapSettings(row: SettingsRow): Settings {
  return {
    emailDestination: row.email_destination,
    emailEnabled: row.email_enabled === true || row.email_enabled === 1,
    pushNotificationsEnabled: row.push_notifications_enabled === true || row.push_notifications_enabled === 1,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

export async function getSettings() {
  const row = await getOne<SettingsRow>(`
    SELECT email_destination, email_enabled, push_notifications_enabled, updated_at
    FROM settings
    WHERE id = 1
  `);

  if (!row) {
    throw new Error('No se encontro la configuracion de Abyssal.');
  }

  return mapSettings(row);
}

export async function updateSettings(input: Partial<Omit<Settings, 'updatedAt' | 'emailDestination'>>) {
  const current = await getSettings();
  const next = { ...current, ...input };

  await query(`
    UPDATE settings
    SET email_destination = $1,
        email_enabled = $2,
        push_notifications_enabled = $3,
        updated_at = now()
    WHERE id = 1
  `, [
    next.emailDestination.trim(),
    next.emailEnabled,
    next.pushNotificationsEnabled
  ]);

  return getSettings();
}

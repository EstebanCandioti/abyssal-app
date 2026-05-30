import { db } from './database.js';

export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      title                TEXT    NOT NULL,
      description          TEXT,
      time                 TEXT    NOT NULL,
      frequency_type       TEXT    NOT NULL,
      frequency_days       TEXT,
      frequency_interval   INTEGER,
      frequency_start_date TEXT,
      active               INTEGER NOT NULL DEFAULT 1,
      created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_id     INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
      sent_at         TEXT    NOT NULL DEFAULT (datetime('now')),
      status          TEXT    NOT NULL,
      error_message   TEXT
    );

    CREATE TABLE IF NOT EXISTS reminder_completions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_id     INTEGER NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
      completed_on    TEXT    NOT NULL,
      completed_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(reminder_id, completed_on)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id                         INTEGER PRIMARY KEY CHECK (id = 1),
      email_destination          TEXT    NOT NULL,
      email_enabled              INTEGER NOT NULL DEFAULT 1,
      push_notifications_enabled INTEGER NOT NULL DEFAULT 0,
      updated_at                 TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.prepare(`
    INSERT INTO settings (id, email_destination, email_enabled, push_notifications_enabled)
    VALUES (1, ?, 1, 0)
    ON CONFLICT(id) DO NOTHING
  `).run(process.env.USER_EMAIL ?? '');

  const emailLogColumns = db.prepare('PRAGMA table_info(email_log)').all() as Array<{ name: string }>;
  const emailLogColumnNames = new Set(emailLogColumns.map((column) => column.name));

  if (!emailLogColumnNames.has('email_to')) {
    db.exec('ALTER TABLE email_log ADD COLUMN email_to TEXT');
  }

  if (!emailLogColumnNames.has('provider_id')) {
    db.exec('ALTER TABLE email_log ADD COLUMN provider_id TEXT');
  }
}

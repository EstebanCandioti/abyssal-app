import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.resolve(__dirname, '../../data');
fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = process.env.DATABASE_PATH ?? path.join(dataDirectory, 'abyssal.sqlite');

export const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = PERSIST');
db.pragma('busy_timeout = 5000');

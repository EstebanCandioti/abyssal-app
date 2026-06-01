import pg, { type QueryResultRow } from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no esta configurada. Agrega la connection string de Supabase/Postgres.');
}

const shouldUseSsl = process.env.DATABASE_SSL !== 'false' && !databaseUrl.includes('localhost');

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined
});

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}

export async function getOne<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await query<T>(text, params);
  return result.rows[0];
}

import { Pool } from 'pg';

const globalForPg = globalThis as unknown as { pgPool: Pool | undefined };

export function getDbPool(): Pool {
  if (!globalForPg.pgPool) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://neondb_owner:npg_V0pAQJdUh2Nm@ep-gentle-pine-b976cdv0-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require';

    globalForPg.pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 120000, // Garde les connexions ouvertes 2 minutes
      connectionTimeoutMillis: 5000,
    });
  }
  return globalForPg.pgPool;
}

export async function queryDb<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const p = getDbPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}

export default queryDb;

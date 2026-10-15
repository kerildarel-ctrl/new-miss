import { Pool } from 'pg';

const globalForPg = globalThis as unknown as { pgPool: Pool | undefined };

export function getDbPool(): Pool {
  if (!globalForPg.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }

    // Strip unsupported params for the `pg` driver (channel_binding is not supported)
    const cleanUrl = connectionString
      .replace(/[?&]channel_binding=[^&]*/g, '')
      .replace(/\?&/, '?')
      .replace(/&&/g, '&')
      .replace(/[?&]$/, '');

    globalForPg.pgPool = new Pool({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,                         // lower max for serverless
      idleTimeoutMillis: 30000,       // 30s idle (serverless resets anyway)
      connectionTimeoutMillis: 10000, // 10s — enough for Netlify cold start
    });

    // Catch pool-level errors silently so they don't crash the process
    globalForPg.pgPool.on('error', (err) => {
      console.warn('[pgPool] idle client error:', err.message);
      globalForPg.pgPool = undefined; // reset so next call creates a fresh pool
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

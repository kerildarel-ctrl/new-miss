import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgresql://neondb_owner:npg_V0pAQJdUh2Nm@ep-gentle-pine-b976cdv0-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function measure() {
  console.log('Connexion...');
  const t0 = Date.now();
  const res = await pool.query('SELECT slug, title, total_votes FROM public.competitions;');
  const t1 = Date.now();
  console.log(`Temps de réponse DB (1ère connexion): ${t1 - t0} ms`);

  const t2 = Date.now();
  const res2 = await pool.query('SELECT id, first_name, vote_count FROM public.candidates;');
  const t3 = Date.now();
  console.log(`Temps de réponse 2e requête (pool chaud): ${t3 - t2} ms`);

  await pool.end();
}

measure().catch(console.error);

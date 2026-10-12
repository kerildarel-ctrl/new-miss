import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgresql://neondb_owner:npg_V0pAQJdUh2Nm@ep-gentle-pine-b976cdv0-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function test() {
  console.log('Connexion directe PostgreSQL (pg pool, port 5432)...');
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT version(), current_database(), current_user');
    console.log('✅ Connexion POSTGRESQL RÉUSSIE !');
    console.log('Version:', res.rows[0].version);
    console.log('Database:', res.rows[0].current_database);
    console.log('User:', res.rows[0].current_user);
  } finally {
    client.release();
    await pool.end();
  }
}

test().catch(err => {
  console.error('❌ Erreur de connexion pg:', err);
  process.exit(1);
});

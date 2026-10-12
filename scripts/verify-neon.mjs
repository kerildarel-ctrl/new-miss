import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgresql://neondb_owner:npg_V0pAQJdUh2Nm@ep-gentle-pine-b976cdv0-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function verify() {
  const client = await pool.connect();
  try {
    const comps = await client.query('SELECT slug, title, total_votes, total_candidates, vote_price FROM public.competitions;');
    const cands = await client.query('SELECT candidate_number, first_name, last_name, vote_count FROM public.candidates;');
    const votes = await client.query('SELECT COUNT(*) as count FROM public.votes;');
    const payouts = await client.query('SELECT COUNT(*) as count FROM public.payouts;');

    console.log('=== VÉRIFICATION BASE DE DONNÉES NEON POSTGRESQL ===');
    console.log('Compétitions:', comps.rows);
    console.log('Candidats:', cands.rows);
    console.log('Nombre de votes enregistrés:', votes.rows[0].count);
    console.log('Nombre de retraits enregistrés:', payouts.rows[0].count);
  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch(console.error);

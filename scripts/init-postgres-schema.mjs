import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_V0pAQJdUh2Nm@ep-gentle-pine-b976cdv0-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('--- 1. CRÉATION DES TABLES DANS NEON POSTGRESQL ---');
  const client = await pool.connect();

  try {
    // 1. Table Competitions
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.competitions (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        banner_image TEXT,
        logo_image TEXT,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE,
        status TEXT DEFAULT 'EN COURS',
        total_candidates INTEGER DEFAULT 0,
        total_votes INTEGER DEFAULT 0,
        vote_price INTEGER DEFAULT 100,
        primary_color TEXT DEFAULT '#2563EB',
        gradient_from TEXT DEFAULT '#EC4899',
        gradient_to TEXT DEFAULT '#2563EB',
        accent_color TEXT DEFAULT '#3B82F6',
        rules TEXT DEFAULT 'Votes ouverts à tous.',
        organizer_token TEXT UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Table Candidates
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.candidates (
        id TEXT PRIMARY KEY,
        competition_slug TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        candidate_number TEXT NOT NULL,
        photo_url TEXT,
        bio TEXT,
        category TEXT DEFAULT 'Miss',
        vote_count INTEGER DEFAULT 0,
        percentage NUMERIC DEFAULT 0,
        rank INTEGER DEFAULT 1,
        status TEXT DEFAULT 'ACTIF',
        social_instagram TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_candidates_comp_slug ON public.candidates(competition_slug);
      CREATE INDEX IF NOT EXISTS idx_candidates_vote_count ON public.candidates(vote_count DESC);
    `);

    // 3. Table Votes
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.votes (
        id TEXT PRIMARY KEY,
        candidate_id TEXT,
        candidate_name TEXT,
        competition_slug TEXT,
        vote_count INTEGER DEFAULT 1,
        amount_fcfa INTEGER DEFAULT 100,
        payment_method TEXT DEFAULT 'mobile_money',
        payment_status TEXT DEFAULT 'SUCCESSFUL',
        fapshi_trans_id TEXT,
        voter_email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON public.votes(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_votes_competition_slug ON public.votes(competition_slug);
      CREATE INDEX IF NOT EXISTS idx_votes_voter_email ON public.votes(voter_email);
    `);

    // 4. Table Payouts (Demandes de retrait organisateurs)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.payouts (
        id TEXT PRIMARY KEY,
        competition_slug TEXT NOT NULL,
        competition_title TEXT NOT NULL,
        organizer_name TEXT NOT NULL,
        organizer_phone TEXT NOT NULL,
        operator TEXT DEFAULT 'ORANGE_MONEY',
        amount NUMERIC DEFAULT 0,
        status TEXT DEFAULT 'PENDING',
        transaction_ref TEXT,
        organizer_token TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        paid_at TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX IF NOT EXISTS idx_payouts_comp_slug ON public.payouts(competition_slug);
      CREATE INDEX IF NOT EXISTS idx_payouts_token ON public.payouts(organizer_token);
    `);

    // 5. Table Events & Tickets (Billetterie)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.events (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        date TEXT NOT NULL,
        venue TEXT NOT NULL,
        city TEXT DEFAULT 'Yaoundé',
        banner_image TEXT DEFAULT '/images/hero_bg.png',
        passes JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.tickets (
        id TEXT PRIMARY KEY,
        ticket_code TEXT UNIQUE NOT NULL,
        event_id TEXT NOT NULL,
        event_title TEXT NOT NULL,
        pass_name TEXT NOT NULL,
        unit_price INTEGER DEFAULT 2000,
        quantity INTEGER DEFAULT 1,
        total_price INTEGER DEFAULT 2000,
        buyer_name TEXT NOT NULL,
        buyer_email TEXT NOT NULL,
        buyer_phone TEXT,
        order_ref TEXT,
        payment_status TEXT DEFAULT 'PAID',
        status TEXT DEFAULT 'VALID',
        purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        scanned_at TIMESTAMP WITH TIME ZONE,
        scanned_by_agent_id TEXT,
        scanned_by_agent_name TEXT,
        reset_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.ticket_validation_logs (
        id TEXT PRIMARY KEY,
        ticket_code TEXT NOT NULL,
        event_id TEXT,
        event_title TEXT,
        action TEXT NOT NULL,
        agent_id TEXT DEFAULT 'admin',
        agent_name TEXT DEFAULT 'Admin /keril',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.event_requests (
        id TEXT PRIMARY KEY,
        event_name TEXT NOT NULL,
        organizer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        vote_price TEXT DEFAULT '100',
        candidate_estimate TEXT DEFAULT '10',
        campus TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Tables créées avec succès sur Neon !');

    // --- 2. SEEDING ET RÉINITIALISATION DES DONNÉES ---
    console.log('--- 2. MIGRATION DES CANDIDATS ET COMPÉTITIONS (SOLDES À 0) ---');
    const compsFilePath = path.join(rootDir, 'src', 'data', 'competitions.json');
    const candsFilePath = path.join(rootDir, 'src', 'data', 'candidates.json');

    const competitions = JSON.parse(fs.readFileSync(compsFilePath, 'utf8') || '[]');
    const candidates = JSON.parse(fs.readFileSync(candsFilePath, 'utf8') || '[]');

    for (const comp of competitions) {
      const slug = comp.slug || 'miss-mister-copa-ahn';
      const candsForComp = candidates.filter(c => c.competitionSlug === slug);

      await client.query(`
        INSERT INTO public.competitions (
          id, slug, title, description, banner_image, logo_image, status,
          vote_price, primary_color, gradient_from, gradient_to, accent_color,
          rules, organizer_token, total_votes, total_candidates
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          banner_image = EXCLUDED.banner_image,
          logo_image = EXCLUDED.logo_image,
          organizer_token = EXCLUDED.organizer_token,
          vote_price = EXCLUDED.vote_price,
          total_votes = 0,
          total_candidates = EXCLUDED.total_candidates;
      `, [
        comp.id || `comp_${Date.now()}`,
        slug,
        comp.title || 'Miss Mister Copa AHN',
        comp.description || '',
        comp.bannerImage || '/images/copa_ahn_banner.png',
        comp.logoImage || '/images/hero_bg.png',
        comp.status || 'EN COURS',
        comp.votePrice || 100,
        comp.primaryColor || '#2563EB',
        comp.gradientFrom || '#EC4899',
        comp.gradientTo || '#2563EB',
        comp.accentColor || '#3B82F6',
        comp.rules || 'Votes ouverts à tous.',
        comp.organizerToken || `TOKEN_${slug.toUpperCase()}`,
        0, // Compteur à 0
        candsForComp.length
      ]);
      console.log(`Compétition migrée: ${comp.title} (${slug})`);
    }

    for (const cand of candidates) {
      await client.query(`
        INSERT INTO public.candidates (
          id, competition_slug, first_name, last_name, candidate_number,
          photo_url, bio, category, vote_count, percentage, rank, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          competition_slug = EXCLUDED.competition_slug,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          candidate_number = EXCLUDED.candidate_number,
          photo_url = EXCLUDED.photo_url,
          bio = EXCLUDED.bio,
          category = EXCLUDED.category,
          vote_count = 0,
          percentage = 0,
          rank = 1,
          status = EXCLUDED.status;
      `, [
        cand.id,
        cand.competitionSlug || 'miss-mister-copa-ahn',
        cand.firstName,
        cand.lastName,
        cand.candidateNumber,
        cand.photoUrl,
        cand.bio || '',
        cand.category || 'Miss',
        0, // vote_count = 0
        0,
        1,
        cand.status || 'ACTIF'
      ]);
      console.log(`Candidat migré: ${cand.firstName} ${cand.lastName} (#${cand.candidateNumber}) [votes: 0]`);
    }

    // Réinitialisation des votes et des payouts pour démarrer à blanc
    await client.query('DELETE FROM public.votes;');
    await client.query('DELETE FROM public.payouts;');

    console.log('✅ Base de données Neon prête et initialisée à 100% avec soldes à 0 !');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});

-- SCRIPT SQL COMPLET SUPABASE POUR MISS MISTER
-- A coller dans Supabase Dashboard > SQL Editor > New Query > RUN

-- 1. NETTOYAGE DES ANCIENNES TABLES (Si existantes)
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.competitions CASCADE;

-- 2. TABLE DES COMPETITIONS
CREATE TABLE public.competitions (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  banner_image TEXT,
  logo_image TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'EN COURS',
  total_candidates INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  vote_price INTEGER DEFAULT 100,
  primary_color TEXT DEFAULT '#2563EB',
  rules TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DES CANDIDATS
CREATE TABLE public.candidates (
  id TEXT PRIMARY KEY,
  competition_slug TEXT REFERENCES public.competitions(slug) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE DES VOTES
CREATE TABLE public.votes (
  id TEXT PRIMARY KEY,
  candidate_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name TEXT,
  competition_slug TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 1,
  amount_fcfa INTEGER NOT NULL DEFAULT 100,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'PENDING',
  fapshi_trans_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DESACTIVATION DES RESTRICTIONS RLS (Permet la sauvegarde sans blocage)
ALTER TABLE public.competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;

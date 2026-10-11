-- ==============================================================================
-- MISS MISTER - SCHEMA SQL COMPLET POUR SUPABASE
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. TABLE DES COMPÉTITIONS
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLE DES CANDIDATS
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes des candidats
CREATE INDEX IF NOT EXISTS idx_candidates_comp_slug ON public.candidates(competition_slug);
CREATE INDEX IF NOT EXISTS idx_candidates_vote_count ON public.candidates(vote_count DESC);

-- 3. TABLE DES VOTES & LOGS (AVEC EMAIL VOTANT)
CREATE TABLE IF NOT EXISTS public.votes (
  id TEXT PRIMARY KEY,
  candidate_id TEXT,
  candidate_name TEXT,
  competition_slug TEXT,
  vote_count INTEGER DEFAULT 1,
  amount_fcfa INTEGER DEFAULT 100,
  payment_method TEXT DEFAULT 'email_vote',
  payment_status TEXT DEFAULT 'SUCCESSFUL',
  fapshi_trans_id TEXT,
  voter_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la table existait déjà sans cette colonne, l'ajouter automatiquement :
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS voter_email TEXT;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'email_vote';
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS candidate_name TEXT;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS competition_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON public.votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_email ON public.votes(voter_email);


-- 4. TABLE DE LA BILLETTERIE (ÉVÉNEMENTS PUBLIÉS PAR L'ADMIN)
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

-- 5. TABLE DES BILLETS ÉMIS & SCAN SÉCURISÉ
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
  payment_status TEXT DEFAULT 'PAID', -- 'PAID', 'PENDING', 'FAILED', 'CONFIRMED'
  status TEXT DEFAULT 'VALID',        -- 'VALID' ou 'USED'
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scanned_at TIMESTAMP WITH TIME ZONE,
  scanned_by_agent_id TEXT,
  scanned_by_agent_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la table tickets existait déjà, ajouter les nouvelles colonnes :
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS order_ref TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PAID';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS scanned_by_agent_id TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS scanned_by_agent_name TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'VALID';

CREATE INDEX IF NOT EXISTS idx_tickets_code ON public.tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_buyer_email ON public.tickets(buyer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

-- 6. TABLE DES LOGS DE VALIDATION DES BILLETS (HISTORIQUE DES ENTRÉES)
CREATE TABLE IF NOT EXISTS public.ticket_validation_logs (
  id TEXT PRIMARY KEY,
  ticket_code TEXT NOT NULL,
  event_id TEXT,
  event_title TEXT,
  action TEXT NOT NULL, -- 'VALIDATED', 'ATTEMPT_ALREADY_USED', 'ATTEMPT_UNPAID', 'RESET_BY_ADMIN'
  agent_id TEXT DEFAULT 'admin',
  agent_name TEXT DEFAULT 'Admin /keril',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_logs_code ON public.ticket_validation_logs(ticket_code);
CREATE INDEX IF NOT EXISTS idx_validation_logs_time ON public.ticket_validation_logs(timestamp DESC);

-- 7. FONCTION POSTGRESQL ATOMIQUE DE VALIDATION D'ENTRÉE (ANTI-DOUBLON CONCURRENT)
CREATE OR REPLACE FUNCTION public.validate_ticket_entry(
  p_ticket_code TEXT,
  p_agent_id TEXT DEFAULT 'admin',
  p_agent_name TEXT DEFAULT 'Admin /keril'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_ticket RECORD;
  v_updated RECORD;
BEGIN
  -- 1. Recherche du billet
  SELECT * INTO v_ticket 
  FROM public.tickets 
  WHERE UPPER(ticket_code) = UPPER(p_ticket_code) OR UPPER(id) = UPPER(p_ticket_code);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID',
      'message', 'BILLET INVALIDE — Entrée refusée.'
    );
  END IF;

  -- 2. Vérification paiement
  IF v_ticket.payment_status NOT IN ('PAID', 'SUCCESSFUL', 'CONFIRMED') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNPAID',
      'message', 'PAIEMENT NON CONFIRMÉ — Entrée refusée.',
      'ticket', row_to_json(v_ticket)
    );
  END IF;

  -- 3. Vérification si déjà utilisé
  IF v_ticket.status = 'USED' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_USED',
      'message', 'BILLET DÉJÀ UTILISÉ — Entrée refusée.',
      'scanned_at', v_ticket.scanned_at,
      'scanned_by_agent_name', v_ticket.scanned_by_agent_name,
      'ticket', row_to_json(v_ticket)
    );
  END IF;

  -- 4. Verrouillage et validation atomique
  UPDATE public.tickets
  SET 
    status = 'USED',
    scanned_at = NOW(),
    scanned_by_agent_id = p_agent_id,
    scanned_by_agent_name = p_agent_name
  WHERE id = v_ticket.id AND status = 'VALID'
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    -- Cas où un autre contrôleur a validé dans la même milliseconde
    SELECT * INTO v_ticket FROM public.tickets WHERE id = v_ticket.id;
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_USED',
      'message', 'BILLET DÉJÀ UTILISÉ — Entrée refusée.',
      'scanned_at', v_ticket.scanned_at,
      'scanned_by_agent_name', v_ticket.scanned_by_agent_name,
      'ticket', row_to_json(v_ticket)
    );
  END IF;

  -- 5. Enregistrement du log de validation
  INSERT INTO public.ticket_validation_logs (
    id, ticket_code, event_id, event_title, action, agent_id, agent_name, timestamp
  ) VALUES (
    'log_' || floor(extract(epoch from now())*1000)::text,
    v_updated.ticket_code,
    v_updated.event_id,
    v_updated.event_title,
    'VALIDATED',
    p_agent_id,
    p_agent_name,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'code', 'VALIDATED',
    'message', 'ENTRÉE VALIDÉE — Billet accepté.',
    'ticket', row_to_json(v_updated)
  );
END;
$$;

-- 8. TABLE DES DEMANDES DE CRÉATION D'ÉVÉNEMENTS
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

-- ==============================================================================
-- ACTIVER LES POLITIQUES DE SÉCURITÉ (ROW LEVEL SECURITY - RLS)
-- Permet la lecture et l'écriture fluides depuis l'application web
-- ==============================================================================

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture publique
DROP POLICY IF EXISTS "Public read competitions" ON public.competitions;
CREATE POLICY "Public read competitions" ON public.competitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read candidates" ON public.candidates;
CREATE POLICY "Public read candidates" ON public.candidates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read votes" ON public.votes;
CREATE POLICY "Public read votes" ON public.votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read tickets" ON public.tickets;
CREATE POLICY "Public read tickets" ON public.tickets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read validation_logs" ON public.ticket_validation_logs;
CREATE POLICY "Public read validation_logs" ON public.ticket_validation_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read event_requests" ON public.event_requests;
CREATE POLICY "Public read event_requests" ON public.event_requests FOR SELECT USING (true);

-- Autoriser l'écriture (INSERT / UPDATE / DELETE) pour toutes les opérations autorisées
DROP POLICY IF EXISTS "Public insert competitions" ON public.competitions;
CREATE POLICY "Public insert competitions" ON public.competitions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert candidates" ON public.candidates;
CREATE POLICY "Public insert candidates" ON public.candidates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert votes" ON public.votes;
CREATE POLICY "Public insert votes" ON public.votes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert events" ON public.events;
CREATE POLICY "Public insert events" ON public.events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert tickets" ON public.tickets;
CREATE POLICY "Public insert tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert validation_logs" ON public.ticket_validation_logs;
CREATE POLICY "Public insert validation_logs" ON public.ticket_validation_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert event_requests" ON public.event_requests;
CREATE POLICY "Public insert event_requests" ON public.event_requests FOR ALL USING (true) WITH CHECK (true);


import fs from 'fs';
import path from 'path';
import { getDbPool } from '@/lib/pgDb';
import { Candidate, Competition } from '@/data/mockData';

const candsFilePath = path.join(process.cwd(), 'src', 'data', 'candidates.json');
const compsFilePath = path.join(process.cwd(), 'src', 'data', 'competitions.json');

export async function recordConfirmedVote(params: {
  candidateId: string;
  count: number;
  candidateName?: string;
  competitionSlug?: string;
  voteId?: string;
  transId?: string;
  paymentMethod?: string;
  amount?: number;
  email?: string;
}): Promise<{ success: boolean; newVoteCount: number; error?: string }> {
  const {
    candidateId,
    count,
    candidateName = '',
    competitionSlug = 'copa-ahn',
    voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    transId = '',
    paymentMethod = 'mobile_money',
    amount = count * 100,
    email = '',
  } = params;

  let newVoteCount = count;

  // 1. TRANSACTION ATOMIQUE DANS POSTGRESQL NEON
  try {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Incrémenter le vote du candidat
      const candRes = await client.query(
        'UPDATE public.candidates SET vote_count = vote_count + $1 WHERE id = $2 RETURNING vote_count;',
        [count, candidateId]
      );

      if (candRes.rows && candRes.rows.length > 0) {
        newVoteCount = candRes.rows[0].vote_count;
      }

      // 2. Incrémenter le total de la compétition
      if (competitionSlug) {
        await client.query(
          'UPDATE public.competitions SET total_votes = total_votes + $1 WHERE slug = $2;',
          [count, competitionSlug]
        );
      }

      // 3. Enregistrer la transaction de vote
      await client.query(
        `INSERT INTO public.votes (
          id, candidate_id, candidate_name, competition_slug, vote_count,
          amount_fcfa, payment_method, payment_status, fapshi_trans_id,
          voter_email, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUCCESSFUL', $8, $9, NOW())
        ON CONFLICT (id) DO UPDATE SET
          payment_status = 'SUCCESSFUL',
          fapshi_trans_id = EXCLUDED.fapshi_trans_id;`,
        [
          voteId,
          candidateId,
          candidateName,
          competitionSlug,
          count,
          amount,
          paymentMethod,
          transId || null,
          email || null,
        ]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL vote transaction error, rolling back:', txErr);
    } finally {
      client.release();
    }
  } catch (dbErr) {
    console.error('PostgreSQL connection error for voteRecorder:', dbErr);
  }

  // 2. SYNCHRONISATION DES FICHIERS LOCAUX (DISQUE)
  try {
    if (fs.existsSync(candsFilePath)) {
      const fileData = fs.readFileSync(candsFilePath, 'utf8');
      const candidates: Candidate[] = JSON.parse(fileData || '[]');
      const cand = candidates.find((c) => c.id === candidateId);
      if (cand) {
        cand.voteCount = (cand.voteCount || 0) + count;
        if (!newVoteCount) newVoteCount = cand.voteCount;
      }
      fs.writeFileSync(candsFilePath, JSON.stringify(candidates, null, 2), 'utf8');
    }

    if (fs.existsSync(compsFilePath)) {
      const compData = fs.readFileSync(compsFilePath, 'utf8');
      const comps: Competition[] = JSON.parse(compData || '[]');
      const comp = comps.find((c) => c.slug === competitionSlug);
      if (comp) {
        comp.totalVotes = (comp.totalVotes || 0) + count;
      }
      fs.writeFileSync(compsFilePath, JSON.stringify(comps, null, 2), 'utf8');
    }
  } catch (diskErr) {
    console.error('Disk vote update error:', diskErr);
  }

  return { success: true, newVoteCount };
}

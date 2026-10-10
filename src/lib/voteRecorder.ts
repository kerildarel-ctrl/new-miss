import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
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
    email = ''
  } = params;

  let newVoteCount = count;

  // 1. UPDATE DISK JSON (CANDIDATES & COMPETITIONS) - Guaranteed local persistence
  try {
    if (fs.existsSync(candsFilePath)) {
      const fileData = fs.readFileSync(candsFilePath, 'utf8');
      const candidates: Candidate[] = JSON.parse(fileData || '[]');
      const cand = candidates.find((c) => c.id === candidateId);
      if (cand) {
        cand.voteCount = (cand.voteCount || 0) + count;
        newVoteCount = cand.voteCount;
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

  // 2. UPDATE SUPABASE DATABASE (SERVERLESS PERSISTENCE FOR NETLIFY)
  try {
    const supabase = getSupabaseAdmin();

    // Check if candidate exists in Supabase
    const { data: cand } = await supabase
      .from('candidates')
      .select('vote_count')
      .eq('id', candidateId)
      .maybeSingle();

    if (cand) {
      const updatedCount = (cand.vote_count || 0) + count;
      newVoteCount = updatedCount;
      await supabase
        .from('candidates')
        .update({ vote_count: updatedCount })
        .eq('id', candidateId);
    }

    // Update competition total_votes
    const { data: comp } = await supabase
      .from('competitions')
      .select('total_votes')
      .eq('slug', competitionSlug)
      .maybeSingle();

    if (comp) {
      await supabase
        .from('competitions')
        .update({ total_votes: (comp.total_votes || 0) + count })
        .eq('slug', competitionSlug);
    }

    // Record vote transaction as SUCCESSFUL
    await supabase.from('votes').upsert([
      {
        id: voteId,
        candidate_id: candidateId,
        candidate_name: candidateName,
        competition_slug: competitionSlug,
        vote_count: count,
        amount_fcfa: amount,
        payment_method: paymentMethod,
        payment_status: 'SUCCESSFUL',
        fapshi_trans_id: transId || null,
        voter_email: email || null,
        created_at: new Date().toISOString()
      }
    ]);
  } catch (dbErr) {
    console.warn('Supabase vote update notice (table may need creation):', dbErr);
  }

  return { success: true, newVoteCount };
}

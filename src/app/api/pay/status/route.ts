import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { queryDb } from '@/lib/pgDb';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { Candidate } from '@/data/mockData';
import { recordConfirmedVote } from '@/lib/voteRecorder';

const candsFilePath = path.join(process.cwd(), 'src', 'data', 'candidates.json');

function updateDiskCandidateVote(candidateId: string, count: number) {
  try {
    if (fs.existsSync(candsFilePath)) {
      const fileData = fs.readFileSync(candsFilePath, 'utf8');
      const candidates: Candidate[] = JSON.parse(fileData || '[]');
      const updated = candidates.map((c) =>
        c.id === candidateId ? { ...c, voteCount: (c.voteCount || 0) + count } : c
      );
      fs.writeFileSync(candsFilePath, JSON.stringify(updated, null, 2), 'utf8');
    }
  } catch {
    // Continue
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transId = searchParams.get('transId');
    const voteId = searchParams.get('voteId');
    const queryCandidateId = searchParams.get('candidateId');
    const queryVoteCount = parseInt(searchParams.get('voteCount') || '1', 10);

    if (!transId && !voteId && !queryCandidateId) {
      return NextResponse.json({ success: false, error: 'Identifiant de transaction ou vote manquant' }, { status: 400 });
    }

    const fapshiApiUser = process.env.FAPSHI_API_USER || '2aa10fd5-e2e0-4f94-bc2f-01585657f418';
    const fapshiApiKey = process.env.FAPSHI_API_KEY || 'FAK_f8e3d6d682775ca2f34e34c80da6ccc6';
    const fapshiBaseUrl = process.env.FAPSHI_BASE_URL || 'https://live.fapshi.com';

    let paymentStatus = 'PENDING';
    let fapshiUserId = queryCandidateId;
    let activeTransId = transId;

    // Look up transId from vote record if not in query params
    if (!activeTransId && voteId) {
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase.from('votes').select('fapshi_trans_id').eq('id', voteId).maybeSingle();
        if (data?.fapshi_trans_id) {
          activeTransId = data.fapshi_trans_id;
        }
      } catch {
        // Continue
      }
    }

    // 1. STRICT PAYMENT VERIFICATION WITH FAPSHI GATEWAY
    if (activeTransId && !activeTransId.startsWith('sim_') && fapshiApiUser && fapshiApiKey) {
      try {
        const fapshiResponse = await fetch(`${fapshiBaseUrl}/payment-status/${activeTransId}`, {
          method: 'GET',
          headers: {
            'apiuser': fapshiApiUser,
            'apikey': fapshiApiKey
          },
          cache: 'no-store'
        });

        if (fapshiResponse.ok) {
          const fapshiData = await fapshiResponse.json();
          paymentStatus = fapshiData.status || fapshiData.paymentStatus || 'PENDING';
          if (fapshiData.userId) {
            fapshiUserId = fapshiData.userId;
          }
        }
      } catch {
        // Fallback if network hiccup
      }
    } else {
      paymentStatus = 'PENDING';
    }

    const statusUpper = String(paymentStatus).toUpperCase();
    const isSuccess = ['SUCCESSFUL', 'SUCCESS', 'COMPLETED', 'PAID', 'APPROVED', 'SUCCESSFUL_PAYMENT'].includes(statusUpper);

    let targetCandidateId = fapshiUserId || queryCandidateId || '';
    let incrementAmount = queryVoteCount || 1;
    let alreadyProcessed = false;

    // 2. INCREMENT CANDIDATE VOTE COUNT IF PAYMENT IS CONFIRMED (STRICTEMENT UNIQUE)
    if (isSuccess) {
      try {
        let voteRecord: any = null;

        if (voteId || transId) {
          let updatedRows: any[] = [];
          if (voteId) {
            updatedRows = await queryDb<any>(
              `UPDATE public.votes 
               SET payment_status = 'SUCCESSFUL', fapshi_trans_id = COALESCE($1, fapshi_trans_id) 
               WHERE id = $2 AND payment_status != 'SUCCESSFUL' 
               RETURNING *;`,
              [transId || null, voteId]
            );
          } else if (transId) {
            updatedRows = await queryDb<any>(
              `UPDATE public.votes 
               SET payment_status = 'SUCCESSFUL' 
               WHERE fapshi_trans_id = $1 AND payment_status != 'SUCCESSFUL' 
               RETURNING *;`,
              [transId]
            );
          }

          if (updatedRows && updatedRows.length > 0) {
            // Le vote est confirmé pour la TOUTE PREMIÈRE FOIS !
            voteRecord = updatedRows[0];
            targetCandidateId = voteRecord.candidate_id || targetCandidateId;
            incrementAmount = voteRecord.vote_count || incrementAmount;
            alreadyProcessed = false;

            // Enregistrement atomique unique du vote
            await recordConfirmedVote({
              candidateId: targetCandidateId,
              count: incrementAmount,
              voteId: voteRecord.id,
              transId: transId || voteRecord.fapshi_trans_id,
              email: voteRecord.voter_email,
              candidateName: voteRecord.candidate_name,
              competitionSlug: voteRecord.competition_slug
            });
          } else {
            // Le vote a déjà été confirmé et comptabilisé précédemment !
            alreadyProcessed = true;
            const lookupId = voteId ? 'id = $1' : 'fapshi_trans_id = $1';
            const rows = await queryDb<any>(`SELECT * FROM public.votes WHERE ${lookupId} LIMIT 1;`, [voteId || transId]);
            if (rows && rows.length > 0) {
              targetCandidateId = rows[0].candidate_id || targetCandidateId;
              incrementAmount = rows[0].vote_count || incrementAmount;
            }
          }
        }
      } catch (err) {
        console.warn('PostgreSQL vote verification notice:', err);
      }
    }

    return NextResponse.json({
      success: true,
      transId: transId,
      voteId: voteId,
      candidateId: targetCandidateId,
      voteCount: incrementAmount,
      status: paymentStatus,
      isSuccess: isSuccess,
      alreadyProcessed: alreadyProcessed,
      message: isSuccess
        ? (alreadyProcessed ? 'Vote déjà comptabilisé !' : 'Paiement déduit avec succès. Vote comptabilisé !')
        : 'Paiement en attente de confirmation Mobile Money.'
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur de vérification du paiement' },
      { status: 500 }
    );
  }
}

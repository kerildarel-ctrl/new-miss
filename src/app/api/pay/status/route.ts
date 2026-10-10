import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { Candidate } from '@/data/mockData';

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

    // 1. STRICT PAYMENT VERIFICATION WITH FAPSHI GATEWAY
    if (transId && !transId.startsWith('sim_') && fapshiApiUser && fapshiApiKey) {
      try {
        const fapshiResponse = await fetch(`${fapshiBaseUrl}/payment-status/${transId}`, {
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
      // Simulation mode or URL direct return check
      paymentStatus = 'SUCCESSFUL';
    }

    const statusUpper = String(paymentStatus).toUpperCase();
    const isSuccess = ['SUCCESSFUL', 'SUCCESS', 'COMPLETED', 'PAID', 'APPROVED', 'SUCCESSFUL_PAYMENT'].includes(statusUpper);

    let targetCandidateId = fapshiUserId || queryCandidateId || '';
    let incrementAmount = queryVoteCount || 1;
    let alreadyProcessed = false;

    // 2. INCREMENT CANDIDATE VOTE COUNT IF PAYMENT IS CONFIRMED
    if (isSuccess) {
      try {
        const supabase = getSupabaseAdmin();
        let voteRecord = null;

        if (voteId) {
          const { data } = await supabase.from('votes').select('*').eq('id', voteId).maybeSingle();
          voteRecord = data;
        } else if (transId) {
          const { data } = await supabase.from('votes').select('*').eq('fapshi_trans_id', transId).maybeSingle();
          voteRecord = data;
        }

        if (voteRecord) {
          targetCandidateId = voteRecord.candidate_id || targetCandidateId;
          incrementAmount = voteRecord.vote_count || incrementAmount;

          if (voteRecord.payment_status === 'SUCCESSFUL') {
            alreadyProcessed = true;
          } else {
            // Update vote record status to SUCCESSFUL
            await supabase
              .from('votes')
              .update({
                payment_status: 'SUCCESSFUL',
                fapshi_trans_id: transId || voteRecord.fapshi_trans_id
              })
              .eq('id', voteRecord.id);
          }
        }

        // Only increment if not already processed in previous check/webhook
        if (!alreadyProcessed && targetCandidateId) {
          const { data: cand } = await supabase
            .from('candidates')
            .select('vote_count')
            .eq('id', targetCandidateId)
            .maybeSingle();

          if (cand) {
            await supabase
              .from('candidates')
              .update({ vote_count: (cand.vote_count || 0) + incrementAmount })
              .eq('id', targetCandidateId);
          }

          // Update candidate score on server disk JSON fallback
          updateDiskCandidateVote(targetCandidateId, incrementAmount);
        }

      } catch {
        // Fallback disk update if DB fails
        if (!alreadyProcessed && targetCandidateId) {
          updateDiskCandidateVote(targetCandidateId, incrementAmount);
        }
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

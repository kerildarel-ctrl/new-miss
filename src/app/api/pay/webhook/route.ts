import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      transId,
      status,
      paymentStatus,
      externalId,
      userId,
      amount
    } = body;

    const currentStatus = status || paymentStatus || 'SUCCESSFUL';
    const voteId = externalId;

    // Verify payment status is SUCCESSFUL
    if (currentStatus === 'SUCCESSFUL') {
      try {
        const { queryDb } = await import('@/lib/pgDb');
        const { recordConfirmedVote } = await import('@/lib/voteRecorder');

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
          const voteRecord = updatedRows[0];
          const targetCandidateId = voteRecord.candidate_id || userId;
          const count = voteRecord.vote_count || 1;

          await recordConfirmedVote({
            candidateId: targetCandidateId,
            count: count,
            voteId: voteRecord.id,
            transId: transId || voteRecord.fapshi_trans_id,
            email: voteRecord.voter_email,
            candidateName: voteRecord.candidate_name,
            competitionSlug: voteRecord.competition_slug
          });
        }
      } catch (webhookErr) {
        console.warn('Webhook DB sync notice:', webhookErr);
      }
    }

    return NextResponse.json({ received: true, status: 'PROCESSED' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur webhook Fapshi' },
      { status: 400 }
    );
  }
}

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
        const supabase = getSupabaseAdmin();

        // 1. Get vote log from Supabase
        let voteRecord = null;

        if (voteId) {
          const { data } = await supabase
            .from('votes')
            .select('*')
            .eq('id', voteId)
            .single();
          voteRecord = data;
        } else if (transId) {
          const { data } = await supabase
            .from('votes')
            .select('*')
            .eq('fapshi_trans_id', transId)
            .single();
          voteRecord = data;
        }

        // 2. If vote exists and is not marked SUCCESSFUL yet
        if (voteRecord && voteRecord.payment_status !== 'SUCCESSFUL') {
          // Update vote status to SUCCESSFUL
          await supabase
            .from('votes')
            .update({
              payment_status: 'SUCCESSFUL',
              fapshi_trans_id: transId || voteRecord.fapshi_trans_id
            })
            .eq('id', voteRecord.id);

          // Increment candidate's vote count in Supabase
          const targetCandidateId = voteRecord.candidate_id || userId;
          if (targetCandidateId) {
            const { data: cand } = await supabase
              .from('candidates')
              .select('vote_count')
              .eq('id', targetCandidateId)
              .single();

            if (cand) {
              await supabase
                .from('candidates')
                .update({ vote_count: (cand.vote_count || 0) + (voteRecord.vote_count || 1) })
                .eq('id', targetCandidateId);
            }
          }
        }
      } catch {
        // Continue and acknowledge webhook receipt
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

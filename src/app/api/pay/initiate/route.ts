import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { recordConfirmedVote } from '@/lib/voteRecorder';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      candidateId,
      candidateName,
      competitionSlug,
      voteCount = 1,
      amount = 100,
      paymentMethod = 'email_vote',
      phone = '',
      email = ''
    } = body;

    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fapshiApiUser = process.env.FAPSHI_API_USER || '2aa10fd5-e2e0-4f94-bc2f-01585657f418';
    const fapshiApiKey = process.env.FAPSHI_API_KEY || 'FAK_f8e3d6d682775ca2f34e34c80da6ccc6';
    const fapshiBaseUrl = process.env.FAPSHI_BASE_URL || 'https://live.fapshi.com';

    // DYNAMIC LIVE SITE URL DETECTION (Prevents localhost redirect on Netlify)
    const host = request.headers.get('host') || 'miss-mister-web.netlify.app';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    // 1. Record pending vote in Supabase
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('votes').insert([
        {
          id: voteId,
          candidate_id: candidateId,
          candidate_name: candidateName,
          competition_slug: competitionSlug,
          vote_count: voteCount,
          amount_fcfa: amount,
          payment_method: paymentMethod,
          payment_status: 'PENDING',
          voter_email: email || null,
          created_at: new Date().toISOString()
        }
      ]);
    } catch {
      // Continue even if Supabase table is not created yet
    }

    // Fallback response for instant demo simulation (saves vote immediately)
    await recordConfirmedVote({
      candidateId,
      count: voteCount,
      candidateName,
      competitionSlug,
      voteId,
      transId: `sim_${voteId}`,
      paymentMethod,
      amount,
      email
    });

    return NextResponse.json({
      success: true,
      voteId: voteId,
      transId: `sim_${voteId}`,
      link: null,
      message: 'Vote enregistré avec succès.'
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l’initialisation du vote' },
      { status: 500 }
    );
  }
}

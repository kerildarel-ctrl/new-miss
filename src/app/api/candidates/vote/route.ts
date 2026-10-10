import { NextResponse } from 'next/server';
import { recordConfirmedVote } from '@/lib/voteRecorder';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      candidateId,
      voteCount = 1,
      candidateName = '',
      competitionSlug = 'copa-ahn',
      voteId,
      transId,
      paymentMethod = 'mobile_money',
      amount = voteCount * 100
    } = body;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'Identifiant du candidat requis' },
        { status: 400 }
      );
    }

    const result = await recordConfirmedVote({
      candidateId,
      count: parseInt(voteCount, 10) || 1,
      candidateName,
      competitionSlug,
      voteId,
      transId,
      paymentMethod,
      amount
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l’enregistrement du vote' },
      { status: 500 }
    );
  }
}

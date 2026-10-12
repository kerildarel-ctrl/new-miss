import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { queryDb } from '@/lib/pgDb';
import { calculateTierRevenue } from '@/utils/revenueTiers';
import { isServerAdminAuthorized } from '@/lib/adminAuth';
import { PayoutRequest } from '../payouts/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || searchParams.get('key');
    const slug = searchParams.get('slug');

    if (!token && !slug) {
      return NextResponse.json(
        { success: false, error: "Clé secrète d'accès requise." },
        { status: 400 }
      );
    }

    let compData: any = null;

    // 1. Recherche par token organisateur ou slug
    if (token) {
      const dbComps = await queryDb<any>(
        'SELECT * FROM public.competitions WHERE organizer_token = $1 LIMIT 1;',
        [token]
      );
      if (dbComps && dbComps.length > 0) {
        compData = dbComps[0];
      }
    } else if (slug) {
      const adminAuth = isServerAdminAuthorized(request);
      if (!adminAuth.authorized) {
        return NextResponse.json(
          {
            success: false,
            error: "Accès refusé : la consultation sans clé secrète est réservée au Super-Admin /keril.",
          },
          { status: 403 }
        );
      }

      const dbComps = await queryDb<any>(
        'SELECT * FROM public.competitions WHERE slug = $1 OR id = $1 LIMIT 1;',
        [slug]
      );
      if (dbComps && dbComps.length > 0) {
        compData = dbComps[0];
      }
    }

    // Fallback disque local si la base n'a pas répondu
    if (!compData) {
      const compFilePath = path.join(process.cwd(), 'src', 'data', 'competitions.json');
      if (fs.existsSync(compFilePath)) {
        const localComps = JSON.parse(fs.readFileSync(compFilePath, 'utf-8') || '[]');
        compData = localComps.find(
          (c: any) =>
            (token && (c.organizerToken === token || c.organizer_token === token)) ||
            (slug && (c.slug === slug || c.id === slug))
        );
      }
    }

    if (!compData) {
      return NextResponse.json(
        {
          success: false,
          error: "Accès refusé : clé secrète ou compétition introuvable. Ce lien est strictement protégé.",
        },
        { status: 404 }
      );
    }

    const compSlug = compData.slug;

    // 2. Récupérer les candidats et total des votes pour cette compétition
    let totalVotes = 0;
    let candidatesList: any[] = [];

    try {
      const dbCands = await queryDb<any>(
        'SELECT * FROM public.candidates WHERE competition_slug = $1;',
        [compSlug]
      );
      if (dbCands && dbCands.length > 0) {
        candidatesList = dbCands;
        totalVotes = dbCands.reduce((sum, c) => sum + (c.vote_count || 0), 0);
      }
    } catch {
      // Fallback local
      const candFilePath = path.join(process.cwd(), 'src', 'data', 'candidates.json');
      if (fs.existsSync(candFilePath)) {
        const cands = JSON.parse(fs.readFileSync(candFilePath, 'utf-8') || '[]');
        const filtered = cands.filter((c: any) => c.competitionSlug === compSlug);
        candidatesList = filtered;
        totalVotes = filtered.reduce((sum: number, c: any) => sum + (c.voteCount || 0), 0);
      }
    }

    // 3. Calcul financier selon l'Alternative 1 (Paliers incitatifs)
    const unitPrice = compData.vote_price || compData.votePrice || 100;
    const tiers = calculateTierRevenue(totalVotes, unitPrice);

    // 4. Calcul des retraits
    let payouts: PayoutRequest[] = [];
    try {
      const dbPayouts = await queryDb<any>(
        'SELECT * FROM public.payouts WHERE competition_slug = $1 ORDER BY created_at DESC;',
        [compSlug]
      );
      if (dbPayouts && dbPayouts.length > 0) {
        payouts = dbPayouts.map((p) => ({
          id: p.id,
          competitionSlug: p.competition_slug,
          competitionTitle: p.competition_title,
          organizerName: p.organizer_name,
          organizerPhone: p.organizer_phone,
          operator: p.operator || 'ORANGE_MONEY',
          amount: Number(p.amount) || 0,
          status: p.status || 'PENDING',
          createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
          paidAt: p.paid_at ? new Date(p.paid_at).toISOString() : undefined,
          transactionRef: p.transaction_ref,
          organizerToken: p.organizer_token,
        }));
      }
    } catch {
      // Fallback local
      const payoutsFilePath = path.join(process.cwd(), 'src', 'data', 'payouts.json');
      if (fs.existsSync(payoutsFilePath)) {
        const allPayouts = JSON.parse(fs.readFileSync(payoutsFilePath, 'utf-8') || '[]');
        payouts = allPayouts.filter((p: PayoutRequest) => p.competitionSlug === compSlug);
      }
    }

    const totalPaid = payouts
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayout = payouts
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);

    const availableBalance = Math.max(0, tiers.organizerEarnings - (totalPaid + pendingPayout));

    // STRICTE CONFIDENTIALITÉ :
    // On ne renvoie AUCUNE métrique interne (VoteMoi profit et frais API ne sont PAS exposés ici)
    return NextResponse.json({
      success: true,
      data: {
        competition: {
          id: compData.id,
          title: compData.title,
          slug: compData.slug,
          status: compData.status,
          votePrice: unitPrice,
          bannerImage: compData.banner_image || compData.bannerImage || '',
          startDate: compData.start_date || compData.startDate,
          endDate: compData.end_date || compData.endDate,
          candidatesCount: candidatesList.length,
          organizerToken: compData.organizerToken || compData.organizer_token,
        },
        financials: {
          totalVotes,
          organizerEarnings: tiers.organizerEarnings,
          currentTierNumber: tiers.currentTierNumber,
          currentTierName: tiers.currentTierName,
          currentRateFCFA: tiers.currentRateFCFA,
          nextTierThreshold: tiers.nextTierThreshold,
          votesNeededForNextTier: tiers.votesNeededForNextTier,
          progressPercent: tiers.progressPercent,
          totalPaid,
          pendingPayout,
          availableBalance,
        },
        payoutsHistory: payouts,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

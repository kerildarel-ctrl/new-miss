import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabaseClient';
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

    // 1. Récupérer toutes les compétitions locales
    const compFilePath = path.join(process.cwd(), 'src', 'data', 'competitions.json');
    let localComps: any[] = [];
    if (fs.existsSync(compFilePath)) {
      localComps = JSON.parse(fs.readFileSync(compFilePath, 'utf-8') || '[]');
    }

    let compData: any = null;

    if (token) {
      // Recherche exclusive par clé secrète indevinable
      compData = localComps.find(
        (c: any) => c.organizerToken === token || c.organizer_token === token
      );

      if (!compData) {
        // Tenter via Supabase
        const { data: dbComp } = await supabase
          .from('competitions')
          .select('*')
          .or(`organizer_token.eq.${token}`)
          .maybeSingle();

        if (dbComp && (dbComp.organizer_token === token || dbComp.organizerToken === token)) {
          compData = dbComp;
        }
      }

      if (!compData) {
        return NextResponse.json(
          {
            success: false,
            error: "Accès refusé : clé secrète invalide ou introuvable. Ce lien est strictement protégé.",
          },
          { status: 403 }
        );
      }
    } else if (slug) {
      // Accès par slug autorisé UNIQUEMENT pour le Super-Admin /keril
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

      compData = localComps.find((c: any) => c.slug === slug || c.id === slug);
      if (!compData) {
        const { data: dbComp } = await supabase
          .from('competitions')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        if (dbComp) compData = dbComp;
      }

      if (!compData) {
        return NextResponse.json({ success: false, error: 'Compétition introuvable.' }, { status: 404 });
      }
    }

    const compSlug = compData.slug;

    // 2. Récupérer les candidats et total des votes pour cette compétition
    let totalVotes = 0;
    let candidatesList: any[] = [];
    const { data: dbCands } = await supabase.from('candidates').select('*').eq('competition_slug', compSlug);

    if (dbCands && dbCands.length > 0) {
      candidatesList = dbCands;
      totalVotes = dbCands.reduce((sum, c) => sum + (c.vote_count || 0), 0);
    } else {
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
    const payoutsFilePath = path.join(process.cwd(), 'src', 'data', 'payouts.json');
    let payouts: PayoutRequest[] = [];
    if (fs.existsSync(payoutsFilePath)) {
      const allPayouts = JSON.parse(fs.readFileSync(payoutsFilePath, 'utf-8') || '[]');
      payouts = allPayouts.filter((p: PayoutRequest) => p.competitionSlug === compSlug);
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

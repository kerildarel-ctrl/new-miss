import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { INITIAL_COMPETITIONS, INITIAL_CANDIDATES } from '@/data/mockData';

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Insert initial competitions into Supabase
    for (const comp of INITIAL_COMPETITIONS) {
      await supabaseAdmin.from('competitions').upsert(
        {
          id: comp.id,
          slug: comp.slug,
          title: comp.title,
          description: comp.description,
          banner_image: comp.bannerImage,
          logo_image: comp.logoImage,
          start_date: comp.startDate,
          end_date: comp.endDate,
          status: comp.status,
          total_candidates: comp.totalCandidates,
          total_votes: comp.totalVotes,
          primary_color: comp.primaryColor,
          rules: comp.rules
        },
        { onConflict: 'id' }
      );
    }

    // 2. Insert initial candidates into Supabase
    for (const cand of INITIAL_CANDIDATES) {
      await supabaseAdmin.from('candidates').upsert(
        {
          id: cand.id,
          competition_slug: cand.competitionSlug,
          first_name: cand.firstName,
          last_name: cand.lastName,
          candidate_number: cand.candidateNumber,
          photo_url: cand.photoUrl,
          bio: cand.bio,
          category: cand.category,
          vote_count: cand.voteCount,
          percentage: cand.percentage,
          rank: cand.rank,
          status: cand.status,
          social_instagram: cand.socialInstagram
        },
        { onConflict: 'id' }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Base de données Supabase initialisée et synchronisée avec succès !'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l’initialisation Supabase' },
      { status: 500 }
    );
  }
}

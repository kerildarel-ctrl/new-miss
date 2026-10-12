import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';
import { isServerAdminAuthorized } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const auth = isServerAdminAuthorized(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 401 }
      );
    }

    const sql = `
      SELECT 
        v.id,
        v.candidate_id,
        v.competition_slug,
        v.vote_count,
        COALESCE(v.amount_fcfa, v.vote_count * 100) AS amount,
        v.voter_email,
        v.fapshi_trans_id,
        v.payment_status,
        v.created_at,
        COALESCE(c.first_name || ' ' || c.last_name, c.first_name, 'Candidat') as candidate_name,
        COALESCE(c.candidate_number, '#1') as candidate_number,
        COALESCE(comp.title, v.competition_slug) as competition_title
      FROM public.votes v
      LEFT JOIN public.candidates c ON v.candidate_id = c.id
      LEFT JOIN public.competitions comp ON v.competition_slug = comp.slug
      ORDER BY v.created_at DESC;
    `;

    const rows = await queryDb<any>(sql);

    return NextResponse.json({
      success: true,
      votes: rows || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors du chargement des votes' },
      { status: 500 }
    );
  }
}

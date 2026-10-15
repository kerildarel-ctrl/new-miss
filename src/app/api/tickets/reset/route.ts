import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';
import { isServerAdminAuthorized } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const auth = isServerAdminAuthorized(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: 'Action non autorisée. Seul l\'administrateur principal peut réinitialiser un billet.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ticketCode } = body;
    const cleanCode = (ticketCode || '').trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ success: false, error: 'Code de billet manquant' }, { status: 400 });
    }

    // ── Neon PostgreSQL ─────────────────────────────────────────────────────
    const updated = await queryDb<any>(
      `UPDATE public.tickets
         SET status = 'VALID', scanned_at = NULL, scanned_by_agent_name = NULL
       WHERE UPPER(ticket_code) = $1
       RETURNING *`,
      [cleanCode]
    );

    if (!updated.length) {
      return NextResponse.json(
        { success: false, error: 'Billet introuvable dans la base de données.' },
        { status: 404 }
      );
    }

    console.info('[reset] Billet réinitialisé par', auth.agentName, ':', cleanCode);

    return NextResponse.json({
      success: true,
      message: 'Billet réinitialisé avec succès à l\'état VALIDE.',
      ticket: updated[0],
    });
  } catch (error: any) {
    console.error('[reset] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

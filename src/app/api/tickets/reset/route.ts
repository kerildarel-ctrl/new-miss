import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { isServerAdminAuthorized } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const auth = isServerAdminAuthorized(request);
    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action non autorisée. Seul l’administrateur principal peut réinitialiser un billet.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ticketCode } = body;
    const cleanCode = (ticketCode || '').trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ success: false, error: 'Code de billet manquant' }, { status: 400 });
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('tickets')
        .update({
          status: 'VALID',
          scanned_at: null,
          scanned_by_agent_id: null,
          scanned_by_agent_name: null,
        })
        .or(`ticket_code.ilike.${cleanCode},id.eq.${cleanCode}`)
        .select();

      if (error || !data || data.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Billet introuvable ou erreur de mise à jour' },
          { status: 404 }
        );
      }

      // Insert Log
      try {
        await supabase.from('ticket_validation_logs').insert([
          {
            id: `log_reset_${Date.now()}`,
            ticket_code: cleanCode,
            action: 'RESET_BY_ADMIN',
            agent_id: auth.agentId,
            agent_name: auth.agentName,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch {
        // Ignore
      }

      return NextResponse.json({
        success: true,
        message: 'Billet réinitialisé avec succès à l’état VALIDE.',
        ticket: data[0],
      });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || 'Erreur base de données' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

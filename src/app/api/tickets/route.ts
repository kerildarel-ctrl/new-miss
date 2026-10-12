import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { isServerAdminAuthorized } from '@/lib/adminAuth';
import { IssuedTicket } from '@/data/mockTickets';

export async function GET(request: Request) {
  try {
    const auth = isServerAdminAuthorized(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 401 }
      );
    }

    let tickets: IssuedTicket[] = [];

    // 1. Try PostgreSQL Neon
    try {
      const rows = await queryDb<any>('SELECT * FROM public.tickets ORDER BY created_at DESC;');
      if (rows && rows.length > 0) {
        tickets = rows.map((t) => ({
          id: t.id,
          ticketCode: t.ticket_code,
          eventId: t.event_id,
          eventTitle: t.event_title,
          passName: t.pass_name,
          unitPrice: t.unit_price,
          quantity: t.quantity,
          totalPrice: t.total_price,
          buyerName: t.buyer_name,
          buyerEmail: t.buyer_email,
          buyerPhone: t.buyer_phone,
          orderRef: t.order_ref || `CMD-${(t.id || '').slice(-6)}`,
          paymentStatus: t.payment_status || 'PAID',
          status: t.status,
          purchasedAt: t.purchased_at ? new Date(t.purchased_at).toISOString() : new Date().toISOString(),
          scannedAt: t.scanned_at ? new Date(t.scanned_at).toISOString() : undefined,
          scannedByAgentId: t.scanned_by_agent_id || undefined,
          scannedByAgentName: t.scanned_by_agent_name || undefined,
        }));
        return NextResponse.json({ success: true, tickets });
      }
    } catch (pgErr) {
      console.warn('PostgreSQL tickets fetch fallback to Supabase:', pgErr);
    }

    // 2. Try Supabase if Neon returned nothing
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        tickets = data.map((t) => ({
          id: t.id,
          ticketCode: t.ticket_code,
          eventId: t.event_id,
          eventTitle: t.event_title,
          passName: t.pass_name,
          unitPrice: t.unit_price,
          quantity: t.quantity,
          totalPrice: t.total_price,
          buyerName: t.buyer_name,
          buyerEmail: t.buyer_email,
          buyerPhone: t.buyer_phone,
          orderRef: t.order_ref || `CMD-${t.id.slice(-6)}`,
          paymentStatus: t.payment_status || 'PAID',
          status: t.status,
          purchasedAt: t.purchased_at,
          scannedAt: t.scanned_at,
          scannedByAgentId: t.scanned_by_agent_id,
          scannedByAgentName: t.scanned_by_agent_name,
        }));
      }
    } catch {
      // Ignore
    }

    // Retourne la liste exacte des billets (vide si aucun billet)
    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur chargement billets' },
      { status: 500 }
    );
  }
}


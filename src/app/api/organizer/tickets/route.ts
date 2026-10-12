import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { IssuedTicket } from '@/data/mockTickets';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizer/tickets?token=XXX&eventId=YYY
 * Retourne les billets vendus pour un événement, validé par le token organisateur
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const eventId = searchParams.get('eventId');

    if (!token || !eventId) {
      return NextResponse.json({ success: false, error: 'token et eventId requis' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Valider le token organisateur
    const { data: event } = await supabase
      .from('events')
      .select('id, organizer_token')
      .eq('id', eventId)
      .eq('organizer_token', token)
      .single();

    if (!event) {
      return NextResponse.json({ success: false, error: 'Token invalide ou événement introuvable' }, { status: 403 });
    }

    // Récupérer les billets de cet événement
    const { data: rows, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    const tickets: IssuedTicket[] = (rows || []).map((t: any) => ({
      id: t.id,
      ticketCode: t.ticket_code,
      eventId: t.event_id,
      eventTitle: t.event_title,
      passName: t.pass_name,
      unitPrice: t.unit_price,
      quantity: t.quantity || 1,
      totalPrice: t.total_price,
      buyerName: t.buyer_name,
      buyerEmail: t.buyer_email,
      buyerPhone: t.buyer_phone,
      orderRef: t.order_ref || `CMD-${(t.id || '').slice(-6)}`,
      paymentStatus: t.payment_status || 'PAID',
      status: t.status,
      purchasedAt: t.purchased_at,
      scannedAt: t.scanned_at,
      scannedByAgentName: t.scanned_by_agent_name,
    }));

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

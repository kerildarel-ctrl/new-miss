import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizer/tickets?token=XXX&eventId=YYY
 * Valide le token organisateur et retourne les billets depuis Neon PostgreSQL
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token   = searchParams.get('token');
    const eventId = searchParams.get('eventId');

    if (!token || !eventId) {
      return NextResponse.json({ success: false, error: 'token et eventId requis' }, { status: 400 });
    }

    // Valider le token organisateur dans Neon
    const evtRows = await queryDb<any>(
      'SELECT id FROM public.events WHERE id = $1 AND organizer_token = $2 LIMIT 1',
      [eventId, token]
    );
    if (!evtRows.length) {
      return NextResponse.json({ success: false, error: 'Token invalide ou événement introuvable' }, { status: 403 });
    }

    // Récupérer les billets depuis Neon
    const rows = await queryDb<any>(
      `SELECT * FROM public.tickets WHERE event_id = $1 ORDER BY purchased_at DESC`,
      [eventId]
    );

    const tickets = rows.map((t) => ({
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
      orderRef: t.order_ref || '',
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

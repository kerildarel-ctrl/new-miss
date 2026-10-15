import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { isServerAdminAuthorized } from '@/lib/adminAuth';
import { INITIAL_ISSUED_TICKETS } from '@/data/mockTickets';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketCode: string }> }
) {
  try {
    const { ticketCode } = await params;
    const cleanCode = (ticketCode || '').trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, exists: false, error: 'Code de billet manquant' },
        { status: 400 }
      );
    }

    let foundTicket: any = null;

    // 1. PRIMARY: Neon PostgreSQL (where tickets are actually written by verify route)
    try {
      const rows = await queryDb<any>(
        'SELECT * FROM public.tickets WHERE UPPER(ticket_code) = $1 LIMIT 1',
        [cleanCode]
      );
      if (rows.length) {
        const d = rows[0];
        foundTicket = {
          id: d.id,
          ticketCode: d.ticket_code,
          eventId: d.event_id,
          eventTitle: d.event_title,
          passName: d.pass_name,
          unitPrice: d.unit_price,
          quantity: d.quantity,
          totalPrice: d.total_price,
          buyerName: d.buyer_name,
          buyerEmail: d.buyer_email,
          buyerPhone: d.buyer_phone,
          orderRef: d.order_ref || `CMD-${d.id.slice(-6)}`,
          paymentStatus: d.payment_status || 'PAID',
          status: d.status,
          purchasedAt: d.purchased_at,
          scannedAt: d.scanned_at,
          scannedByAgentName: d.scanned_by_agent_name,
          qrDataUrl: d.qr_data_url || '',
        };
      }
    } catch (pgErr) {
      console.warn('[ticketCode] Neon fallback to Supabase:', pgErr);
    }

    // 2. FALLBACK: Supabase (legacy / backup)
    if (!foundTicket) {
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from('tickets')
          .select('*')
          .or(`ticket_code.ilike.${cleanCode},id.eq.${cleanCode}`)
          .maybeSingle();

        if (data) {
          foundTicket = {
            id: data.id,
            ticketCode: data.ticket_code,
            eventId: data.event_id,
            eventTitle: data.event_title,
            passName: data.pass_name,
            unitPrice: data.unit_price,
            quantity: data.quantity,
            totalPrice: data.total_price,
            buyerName: data.buyer_name,
            buyerEmail: data.buyer_email,
            buyerPhone: data.buyer_phone,
            orderRef: data.order_ref || `CMD-${data.id.slice(-6)}`,
            paymentStatus: data.payment_status || 'PAID',
            status: data.status,
            purchasedAt: data.purchased_at,
            scannedAt: data.scanned_at,
            scannedByAgentName: data.scanned_by_agent_name,
            qrDataUrl: data.qr_data_url || '',
          };
        }
      } catch { /* ignore */ }
    }

    // 3. Mock/memory fallback (dev only)
    if (!foundTicket) {
      const mock = INITIAL_ISSUED_TICKETS.find(
        (t) => t.ticketCode.toUpperCase() === cleanCode || t.id.toUpperCase() === cleanCode
      );
      if (mock) foundTicket = { ...mock, qrDataUrl: '' };
    }

    if (!foundTicket) {
      return NextResponse.json(
        { success: false, exists: false, code: 'NOT_FOUND', message: 'BILLET INVALIDE — Entrée refusée.' },
        { status: 404 }
      );
    }

    // Check server authorization
    const auth = isServerAdminAuthorized(request);

    // PUBLIC (unauthenticated) — zero-leakage
    if (!auth.authorized) {
      return NextResponse.json({
        success: true,
        exists: true,
        authorized: false,
        ticketCode: foundTicket.ticketCode,
        eventTitle: foundTicket.eventTitle,
        message: 'Billet identifié. Connectez-vous avec un compte administrateur autorisé pour consulter les informations et vérifier son statut.',
      });
    }

    // AUTHENTICATED — full data including stored QR
    return NextResponse.json({
      success: true,
      exists: true,
      authorized: true,
      agentName: auth.agentName,
      ticket: {
        id: foundTicket.id,
        ticketCode: foundTicket.ticketCode,
        buyerName: foundTicket.buyerName,
        buyerEmail: foundTicket.buyerEmail,
        buyerPhone: foundTicket.buyerPhone,
        eventTitle: foundTicket.eventTitle,
        eventId: foundTicket.eventId,
        passName: foundTicket.passName,
        quantity: foundTicket.quantity,
        unitPrice: foundTicket.unitPrice,
        totalPrice: foundTicket.totalPrice,
        orderRef: foundTicket.orderRef || `CMD-${foundTicket.id.slice(-6)}`,
        paymentStatus: foundTicket.paymentStatus || 'PAID',
        status: foundTicket.status,
        purchasedAt: foundTicket.purchasedAt,
        scannedAt: foundTicket.scannedAt,
        scannedByAgentName: foundTicket.scannedByAgentName,
        qrDataUrl: foundTicket.qrDataUrl,  // stored — no external service dependency
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

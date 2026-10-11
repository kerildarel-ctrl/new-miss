import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';
import { isServerAdminAuthorized } from '@/lib/adminAuth';
import { INITIAL_ISSUED_TICKETS, IssuedTicket } from '@/data/mockTickets';

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

    let foundTicket: IssuedTicket | null = null;

    // 1. Fetch from Supabase
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
          scannedByAgentId: data.scanned_by_agent_id,
          scannedByAgentName: data.scanned_by_agent_name,
        };
      }
    } catch {
      // Fallback
    }

    // 2. Memory fallback if not in Supabase
    if (!foundTicket) {
      const mock = INITIAL_ISSUED_TICKETS.find(
        (t) => t.ticketCode.toUpperCase() === cleanCode || t.id.toUpperCase() === cleanCode
      );
      if (mock) {
        foundTicket = mock;
      }
    }

    // If Ticket not found at all
    if (!foundTicket) {
      return NextResponse.json(
        {
          success: false,
          exists: false,
          code: 'NOT_FOUND',
          message: 'BILLET INVALIDE — Entrée refusée.',
        },
        { status: 404 }
      );
    }

    // Check server authorization
    const auth = isServerAdminAuthorized(request);

    // PUBLIC ACCESS (UNAUTHENTICATED): STRICT ZERO-LEAKAGE
    if (!auth.authorized) {
      return NextResponse.json({
        success: true,
        exists: true,
        authorized: false,
        ticketCode: foundTicket.ticketCode,
        eventTitle: foundTicket.eventTitle,
        message:
          'Billet identifié. Connectez-vous avec un compte administrateur autorisé pour consulter les informations et vérifier son statut.',
      });
    }

    // AUTHENTICATED ACCESS (/keril admin or authorized agent)
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
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

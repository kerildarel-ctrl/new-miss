import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

/**
 * POST /api/organizer/scan
 * Valide un billet par son code — vérifie qu'il est VALID et le marque USED
 * Body: { ticketCode, organizerToken, eventId, agentName? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketCode, organizerToken, eventId, agentName } = body;
    // Sanitize agentName — strip HTML tags, cap length
    const safeAgentName = String(agentName || 'Organisateur').replace(/<[^>]*>/g, '').trim().slice(0, 80) || 'Organisateur';

    if (!ticketCode || !organizerToken || !eventId) {
      return NextResponse.json({ success: false, error: 'ticketCode, organizerToken et eventId requis' }, { status: 400 });
    }

    // Valider le token organisateur
    const evtRows = await queryDb<any>(
      'SELECT id, title FROM public.events WHERE id = $1 AND organizer_token = $2 LIMIT 1',
      [eventId, organizerToken]
    );
    if (!evtRows.length) {
      return NextResponse.json({ success: false, error: 'Token organisateur invalide' }, { status: 403 });
    }

    // Chercher le billet
    const tktRows = await queryDb<any>(
      'SELECT * FROM public.tickets WHERE ticket_code = $1 LIMIT 1',
      [ticketCode.trim().toUpperCase()]
    );

    if (!tktRows.length) {
      return NextResponse.json({
        success: false,
        scanResult: 'NOT_FOUND',
        error: 'Billet introuvable. Code invalide.',
      }, { status: 404 });
    }

    const ticket = tktRows[0];

    // Vérifier que le billet appartient bien à cet événement
    if (ticket.event_id !== eventId) {
      return NextResponse.json({
        success: false,
        scanResult: 'WRONG_EVENT',
        error: "Ce billet n'appartient pas à cet événement.",
        ticket: { buyerName: ticket.buyer_name, passName: ticket.pass_name },
      }, { status: 400 });
    }

    // Vérifier si déjà utilisé
    if (ticket.status === 'USED') {
      return NextResponse.json({
        success: false,
        scanResult: 'ALREADY_USED',
        error: `Billet déjà utilisé le ${ticket.scanned_at ? new Date(ticket.scanned_at).toLocaleString('fr-FR') : '?'}.`,
        ticket: {
          buyerName: ticket.buyer_name,
          passName: ticket.pass_name,
          scannedAt: ticket.scanned_at,
          scannedByAgentName: ticket.scanned_by_agent_name,
        },
      }, { status: 409 });
    }

    // Vérifier que le paiement est PAID
    if (ticket.payment_status !== 'PAID') {
      return NextResponse.json({
        success: false,
        scanResult: 'NOT_PAID',
        error: 'Billet non payé.',
        ticket: { buyerName: ticket.buyer_name, passName: ticket.pass_name },
      }, { status: 402 });
    }

    // Verrou atomique — marque USED uniquement si encore VALID (prévient le double-scan concurrent)
    const markResult = await queryDb<any>(
      `UPDATE public.tickets
       SET status = 'USED', scanned_at = NOW(), scanned_by_agent_name = $1
       WHERE ticket_code = $2 AND status = 'VALID'
       RETURNING id`,
      [safeAgentName, ticket.ticket_code]
    );

    if (!markResult.length) {
      // Un autre scanner a marqué ce billet USED entre notre SELECT et cet UPDATE
      return NextResponse.json({
        success: false,
        scanResult: 'ALREADY_USED',
        error: 'Billet déjà utilisé (scan simultané détecté).',
        ticket: { buyerName: ticket.buyer_name, passName: ticket.pass_name },
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      scanResult: 'VALID',
      message: 'Billet valide — entrée autorisée !',
      ticket: {
        ticketCode: ticket.ticket_code,
        buyerName: ticket.buyer_name,
        buyerEmail: ticket.buyer_email,
        passName: ticket.pass_name,
        purchasedAt: ticket.purchased_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/organizer/scan?ticketCode=TKT-XXXX&token=...&eventId=...
 * Consultation uniquement (sans marquer USED) — token organisateur obligatoire
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketCode     = searchParams.get('ticketCode');
    const organizerToken = searchParams.get('token');
    const eventId        = searchParams.get('eventId');

    if (!ticketCode || !organizerToken || !eventId) {
      return NextResponse.json(
        { success: false, error: 'ticketCode, token et eventId requis' },
        { status: 400 }
      );
    }

    // Valider le token organisateur
    const evtRows = await queryDb<any>(
      'SELECT id FROM public.events WHERE id = $1 AND organizer_token = $2 LIMIT 1',
      [eventId, organizerToken]
    );
    if (!evtRows.length) {
      return NextResponse.json({ success: false, error: 'Token organisateur invalide' }, { status: 403 });
    }

    const rows = await queryDb<any>(
      'SELECT ticket_code, pass_name, status, payment_status, purchased_at, scanned_at FROM public.tickets WHERE ticket_code = $1 LIMIT 1',
      [ticketCode.toUpperCase()]
    );
    if (!rows.length) return NextResponse.json({ success: false, error: 'Billet introuvable' }, { status: 404 });

    // Ne pas exposer email/nom de l'acheteur via GET
    const t = rows[0];
    return NextResponse.json({
      success: true,
      ticket: {
        ticketCode: t.ticket_code,
        passName: t.pass_name,
        status: t.status,
        paymentStatus: t.payment_status,
        purchasedAt: t.purchased_at,
        scannedAt: t.scanned_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
    const { ticketCode, organizerToken, eventId, agentName = 'Organisateur' } = await request.json();

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
        error: '❌ Billet introuvable. Code invalide.',
      }, { status: 404 });
    }

    const ticket = tktRows[0];

    // Vérifier que le billet appartient bien à cet événement
    if (ticket.event_id !== eventId) {
      return NextResponse.json({
        success: false,
        scanResult: 'WRONG_EVENT',
        error: "❌ Ce billet n'appartient pas à cet événement.",
        ticket: { buyerName: ticket.buyer_name, passName: ticket.pass_name },
      }, { status: 400 });
    }

    // Vérifier si déjà utilisé
    if (ticket.status === 'USED') {
      return NextResponse.json({
        success: false,
        scanResult: 'ALREADY_USED',
        error: `⚠️ Billet déjà utilisé le ${ticket.scanned_at ? new Date(ticket.scanned_at).toLocaleString('fr-FR') : '?'}.`,
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
        error: '❌ Billet non payé.',
        ticket: { buyerName: ticket.buyer_name, passName: ticket.pass_name },
      }, { status: 402 });
    }

    // ✅ Marquer le billet comme USED
    await queryDb(
      `UPDATE public.tickets
       SET status = 'USED', scanned_at = NOW(), scanned_by_agent_name = $1
       WHERE ticket_code = $2`,
      [agentName, ticket.ticket_code]
    );

    return NextResponse.json({
      success: true,
      scanResult: 'VALID',
      message: '✅ Billet valide — entrée autorisée !',
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
 * GET /api/organizer/scan?ticketCode=TKT-XXXX-XXXX&token=...&eventId=...
 * Consultation uniquement (sans marquer USED)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketCode = searchParams.get('ticketCode');
    if (!ticketCode) return NextResponse.json({ success: false, error: 'ticketCode requis' }, { status: 400 });

    const rows = await queryDb<any>('SELECT * FROM public.tickets WHERE ticket_code = $1 LIMIT 1', [ticketCode.toUpperCase()]);
    if (!rows.length) return NextResponse.json({ success: false, error: 'Billet introuvable' }, { status: 404 });

    return NextResponse.json({ success: true, ticket: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
